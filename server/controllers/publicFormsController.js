const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const StaffApplication = require("../models/StaffApplication");
const { sendMail } = require("../services/mailer");
const {
  cleanEmail,
  cleanPhone,
  cleanText,
  getRequiredMessage,
  isFutureOrTodayDate,
  isValidEmail,
  isValidPhone,
} = require("../utils/validation");

const getTodayKey = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getAppointmentScheduleKey = (appointment) =>
  String(
    appointment.rescheduledDate ||
      appointment.approvedDate ||
      appointment.date ||
      ""
  ).slice(0, 10);

const findLinkedPatient = async ({ patientId, email, phone }) => {
  if (patientId) {
    const patient = await Patient.findById(patientId);
    if (patient) {
      return patient;
    }
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();

  if (normalizedEmail) {
    const patient = await Patient.findOne({ email: normalizedEmail });
    if (patient) {
      return patient;
    }
  }

  if (normalizedPhone) {
    return Patient.findOne({ mobile: normalizedPhone });
  }

  return null;
};

const hasStartedActiveTreatment = (patient) => {
  if (!patient) {
    return false;
  }

  const todayKey = getTodayKey();

  return (patient.treatmentPlans || []).some((plan) => {
    if ((plan.status || "active") !== "active") {
      return false;
    }

    const fromKey = String(plan.fromDate || "").slice(0, 10);
    const toKey = String(plan.toDate || "").slice(0, 10);

    if (!fromKey || !toKey) {
      return false;
    }

    return fromKey <= todayKey && toKey >= todayKey;
  });
};

const buildAppointmentIdentityQuery = ({ patient, email, phone }) => {
  const filters = [];

  if (patient?._id) {
    filters.push({ patientId: patient._id });
  }

  if (email) {
    filters.push({ email });
  }

  if (phone) {
    filters.push({ phone });
  }

  return filters.length ? { $or: filters } : null;
};

const syncPatientAppointmentFromRequest = async (appointment, patient) => {
  if (!patient) {
    return;
  }

  const requestId = appointment._id.toString();
  const date =
    appointment.rescheduledDate ||
    appointment.approvedDate ||
    appointment.date;
  const time =
    appointment.rescheduledTime ||
    appointment.approvedTime ||
    appointment.time ||
    "";
  const existingAppointment = (patient.appointments || []).find(
    (entry) => entry.requestId && entry.requestId.toString() === requestId
  );

  if (existingAppointment) {
    existingAppointment.date = date;
    existingAppointment.time = time;
    existingAppointment.service = appointment.service || existingAppointment.service;
    existingAppointment.status = appointment.status;
    existingAppointment.remark = appointment.decisionNote || existingAppointment.remark || "";
  } else {
    patient.appointments.push({
      date,
      time,
      service: appointment.service || "Appointment",
      status: appointment.status,
      remark: appointment.decisionNote || "",
      requestId: appointment._id,
    });
  }

  await patient.save();
};

const autoCompleteOverdueScheduledAppointments = async ({ patient, email, phone }) => {
  const identityQuery = buildAppointmentIdentityQuery({ patient, email, phone });

  if (!identityQuery) {
    return;
  }

  const todayKey = getTodayKey();
  const appointments = await Appointment.find({
    ...identityQuery,
    status: { $in: ["approved", "rescheduled"] },
  });

  for (const appointment of appointments) {
    const appointmentKey = getAppointmentScheduleKey(appointment);

    if (!appointmentKey || appointmentKey >= todayKey) {
      continue;
    }

    appointment.status = "completed";
    appointment.decisionNote = "Auto generated";
    appointment.decisionAt = new Date();
    appointment.notificationSeenAt = null;
    appointment.isRead = true;
    appointment.readAt = appointment.readAt || new Date();
    await appointment.save();
    await syncPatientAppointmentFromRequest(appointment, patient);
  }
};

const hasOpenScheduledAppointment = async ({ patient, email, phone }) => {
  const todayKey = getTodayKey();

  if (
    (patient?.appointments || []).some((appointment) => {
      const status = appointment.status || "approved";
      const appointmentKey = String(appointment.date || "").slice(0, 10);

      return appointmentKey >= todayKey && !["completed", "cancelled"].includes(status);
    })
  ) {
    return true;
  }

  const identityQuery = buildAppointmentIdentityQuery({ patient, email, phone });

  if (!identityQuery) {
    return false;
  }

  const existingAppointment = await Appointment.findOne({
    ...identityQuery,
    status: { $in: ["approved", "rescheduled"] },
  });

  return Boolean(existingAppointment);
};

const hasPendingAppointmentRequest = async ({ patient, email, phone }) => {
  const identityQuery = buildAppointmentIdentityQuery({ patient, email, phone });

  if (!identityQuery) {
    return false;
  }

  const pendingAppointment = await Appointment.findOne({
    ...identityQuery,
    status: "pending",
  });

  return Boolean(pendingAppointment);
};

const getAppointmentUploadFiles = (req) => {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.files && typeof req.files === "object") {
    return [
      ...(req.files.files || []),
      ...(req.files.file || []),
      ...(req.files.documents || []),
    ];
  }

  return req.file ? [req.file] : [];
};

const submitAppointment = async (req, res) => {
  try {
    const requestedPatientId = cleanText(req.body.patientId);
    const patientToken = req.auth?.type === "patient" ? req.auth : null;
    const name = patientToken ? cleanText(req.body.name) : cleanText(req.body.name);
    const email = patientToken ? cleanEmail(req.body.email) : cleanEmail(req.body.email);
    const phone = patientToken ? cleanPhone(req.body.phone) : cleanPhone(req.body.phone);
    const patientId = patientToken?.patientId || requestedPatientId;
    const service = cleanText(req.body.service);
    const date = cleanText(req.body.date);
    const time = cleanText(req.body.time);
    const message = cleanText(req.body.message);
    const uploadedFiles = getAppointmentUploadFiles(req);
    const primaryAttachment = uploadedFiles[0] || null;

    if (uploadedFiles.length > 5) {
      return res.status(400).json({
        message: "You can upload up to 5 documents or images per appointment request.",
      });
    }

    if (patientToken && patientToken.patientId && requestedPatientId && requestedPatientId !== patientToken.patientId) {
      return res.status(403).json({ message: "Invalid patient session for this appointment request." });
    }

    const requiredMessage = getRequiredMessage([
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Phone", value: phone },
      { label: "Service", value: service },
      { label: "Date", value: date },
    ]);

    if (requiredMessage) {
      return res.status(400).json({ message: requiredMessage });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit phone number." });
    }

    if (!isFutureOrTodayDate(date)) {
      return res.status(400).json({ message: "Preferred appointment date cannot be in the past." });
    }

    const linkedPatient = await findLinkedPatient({ patientId, email, phone });

    await autoCompleteOverdueScheduledAppointments({
      patient: linkedPatient,
      email,
      phone,
    });

    if (hasStartedActiveTreatment(linkedPatient)) {
      return res.status(409).json({
        message:
          "Your treatment session is already active. You can request a new appointment after the current session date is finished.",
      });
    }

    if (await hasOpenScheduledAppointment({ patient: linkedPatient, email, phone })) {
      return res.status(409).json({
        message:
          "You already have a scheduled appointment. You can request another appointment after it is done or cancelled.",
      });
    }

    if (await hasPendingAppointmentRequest({ patient: linkedPatient, email, phone })) {
      return res.status(409).json({
        message:
          "Your previous appointment request is still pending. Please wait until OPW reviews it before sending another request.",
      });
    }

    const appointment = await Appointment.create({
      name,
      email,
      phone,
      patientId: linkedPatient?._id || null,
      service,
      date,
      time: time || "",
      message,
      attachmentName: primaryAttachment ? primaryAttachment.originalname : "",
      attachmentMimeType: primaryAttachment ? primaryAttachment.mimetype : "",
      attachmentData: primaryAttachment ? primaryAttachment.buffer : undefined,
      attachments: uploadedFiles.map((file) => ({
        name: file.originalname,
        mimeType: file.mimetype,
        data: file.buffer,
      })),
    });

    let emailSent = false;

    try {
      emailSent = await sendMail({
        from: process.env.EMAIL_USER,
        to: "contact@ommphysioworld.com",
        replyTo: email,
        subject: `Appointment Request - ${name}`,
        text: `New appointment request received.

Name: ${name}
Email: ${email}
Phone: ${phone}
Service: ${service}
Preferred Date: ${date}
Preferred Time: ${time || "Not provided"}
Attachments: ${
          uploadedFiles.length
            ? uploadedFiles.map((file) => file.originalname).join(", ")
            : "No attachment"
        }

Message:
${message || "Not provided"}
`,
        attachments: uploadedFiles.map((file) => ({
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype,
        })),
      });
    } catch (emailError) {
      console.log("Appointment email failed:", emailError);
    }

    return res.status(201).json({
      message: "Appointment request submitted successfully.",
      appointment,
      emailSent,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to submit appointment request.",
    });
  }
};

const submitStaffApplication = async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const phone = cleanPhone(req.body.phone);
    const role = cleanText(req.body.role);
    const experience = cleanText(req.body.experience);
    const message = cleanText(req.body.message);

    const requiredMessage = getRequiredMessage([
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Phone", value: phone },
      { label: "Role", value: role },
      { label: "Experience", value: experience },
    ]);

    if (requiredMessage) {
      return res.status(400).json({ message: requiredMessage });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit phone number." });
    }

    const application = await StaffApplication.create({
      name,
      email,
      phone,
      role,
      experience,
      message,
      resumeName: req.file ? req.file.originalname : "",
      resumeMimeType: req.file ? req.file.mimetype : "",
      resumeData: req.file ? req.file.buffer : undefined,
    });

    let emailSent = false;

    try {
      emailSent = await sendMail({
        from: process.env.EMAIL_USER,
        to: "contact@ommphysioworld.com",
        replyTo: email,
        subject: `Staff Application - ${name} - ${role}`,
        text: `New staff application received.

Name: ${name}
Email: ${email}
Phone: ${phone}
Role: ${role}
Experience: ${experience}
Resume: ${req.file ? req.file.originalname : "No resume attached"}

Message:
${message || "Not provided"}
`,
        attachments: req.file
          ? [
              {
                filename: req.file.originalname,
                content: req.file.buffer,
                contentType: req.file.mimetype,
              },
            ]
          : [],
      });
    } catch (emailError) {
      console.log("Staff application email failed:", emailError);
    }

    return res.status(201).json({
      message: "Staff application submitted successfully.",
      application,
      emailSent,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to submit staff application.",
    });
  }
};

module.exports = {
  submitAppointment,
  submitStaffApplication,
};
