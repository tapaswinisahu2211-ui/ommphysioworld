const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config();

const app = express();

const {
  authenticateRequest,
  requireAdminAuth,
  requireAuthenticatedSession,
  requirePatientOrStaffAuth,
  requirePatientRecordAccess,
  requireStaffAuth,
} = require("./middleware/auth");
const { createRateLimiter, securityHeaders } = require("./middleware/security");

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean)
);

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS."));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
});
const publicFormRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many form submissions. Please wait and try again.",
});
const publicChatRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: "Too many chat requests. Please slow down and try again.",
});

const connectDB = require("./config/db");
const Appointment = require("./models/Appointment");
const ChatConversation = require("./models/ChatConversation");
const ContactMessage = require("./models/ContactMessage");
const Feedback = require("./models/Feedback");
const JobRequirement = require("./models/JobRequirement");
const Patient = require("./models/Patient");
const PublicUser = require("./models/PublicUser");
const Service = require("./models/Service");
const StaffApplication = require("./models/StaffApplication");
const User = require("./models/User");
const upload = require("./middleware/upload");
const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const {
  normalizePermissions,
  serializeUser,
  ensureDefaultAdmin,
} = require("./utils/userHelpers");
const {
  cleanEmail,
  cleanPhone,
  cleanText,
  isFutureOrTodayDate,
  isValidDateValue,
  isValidEmail,
  isValidPhone,
} = require("./utils/validation");
const { hashPassword } = require("./utils/password");

app.use("/api", authenticateRequest);
app.use("/api", authRoutes);
app.use("/api", publicRoutes);

const hasChatPermission = (user) => {
  if (!user) {
    return false;
  }

  if (user.role === "Admin") {
    return true;
  }

  return (user.permissions || []).some(
    (permission) => permission.module === "chat" && Boolean(permission.view)
  );
};

const isUserOnlineForChat = (user) => {
  if (!user) {
    return false;
  }

  const onlineThreshold = new Date(Date.now() - 2 * 60 * 1000);
  return (
    user.status === "Active" &&
    hasChatPermission(user) &&
    user.lastSeenAt &&
    new Date(user.lastSeenAt) >= onlineThreshold
  );
};

const serializePatientAppointments = (appointments = []) => {
  const seenRequestIds = new Set();

  return (appointments || [])
    .filter((appointment) => {
      const requestId = appointment.requestId ? appointment.requestId.toString() : "";

      if (!requestId) {
        return true;
      }

      if (seenRequestIds.has(requestId)) {
        return false;
      }

      seenRequestIds.add(requestId);
      return true;
    })
    .map((appointment) => ({
      id: appointment._id.toString(),
      date: appointment.date,
      time: appointment.time || "",
      service: appointment.service,
      status: appointment.status || "approved",
      remark: appointment.remark || "",
      requestId: appointment.requestId ? appointment.requestId.toString() : "",
      createdAt: appointment.createdAt,
    }));
};

const serializePatient = (patient) => ({
  id: patient._id.toString(),
  name: patient.name,
  email: patient.email,
  mobile: patient.mobile,
  createdFrom: patient.createdFrom || "admin",
  disease: patient.disease || "",
  notes: patient.notes || "",
  profileImageUrl: patient.profileImageData
    ? `/patients/${patient._id.toString()}/profile-image`
    : "",
  profileImageUpdatedAt: patient.profileImageUpdatedAt || null,
  clinicalNotes: (patient.clinicalNotes || []).map((entry) => ({
    id: entry._id.toString(),
    title: entry.title || "",
    note: entry.note || "",
    addedByType: entry.addedByType || "opw",
    addedByLabel: entry.addedByLabel || (entry.addedByType === "patient" ? "Patient" : "OPW"),
    createdAt: entry.createdAt,
    documents: (entry.documents || []).map((document) => ({
      id: document._id.toString(),
      name: document.name || "",
      mimeType: document.mimeType || "application/octet-stream",
      uploadedAt: document.uploadedAt,
      downloadUrl: `/patients/${patient._id.toString()}/clinical-notes/${entry._id.toString()}/documents/${document._id.toString()}`,
    })),
  })),
  treatmentPlans: (patient.treatmentPlans || []).map((plan) => ({
    id: plan._id.toString(),
    treatmentTypes: plan.treatmentTypes || [],
    fromDate: plan.fromDate || "",
    toDate: plan.toDate || "",
    totalAmount: Number(plan.totalAmount || 0),
    advanceAmount: Number(plan.advanceAmount || 0),
    balanceAmount: Number(plan.balanceAmount || 0),
    paymentMethod: plan.paymentMethod || "",
    paymentNotes: plan.paymentNotes || "",
    payments: (plan.payments || []).map((payment) => ({
      id: payment._id.toString(),
      amount: Number(payment.amount || 0),
      method: payment.method || "",
      createdAt: payment.createdAt,
    })),
    sessionDays: (plan.sessionDays || []).map((day) => ({
      id: day._id.toString(),
      date: day.date || "",
      status: day.status || "not_done",
      updatedAt: day.updatedAt || null,
    })),
    status: plan.status || "active",
    createdAt: plan.createdAt,
  })),
  appointments: serializePatientAppointments(patient.appointments || []),
  payments: (patient.payments || []).map((payment) => ({
    id: payment._id.toString(),
    amount: payment.amount,
    method: payment.method,
    createdAt: payment.createdAt,
  })),
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

const formatPatientCreatedFrom = (value) => {
  switch (String(value || "").trim()) {
    case "mobile_app":
      return "Mobile App";
    case "website":
      return "Website";
    default:
      return "Admin";
  }
};

const serializeJobRequirement = (requirement) => ({
  id: requirement._id.toString(),
  title: requirement.title,
  department: requirement.department || "",
  employmentType: requirement.employmentType || "",
  experience: requirement.experience || "",
  location: requirement.location || "",
  openings: Number(requirement.openings || 1),
  summary: requirement.summary || "",
  responsibilities: Array.isArray(requirement.responsibilities)
    ? requirement.responsibilities.filter(Boolean)
    : [],
  requirements: Array.isArray(requirement.requirements)
    ? requirement.requirements.filter(Boolean)
    : [],
  benefits: Array.isArray(requirement.benefits)
    ? requirement.benefits.filter(Boolean)
    : [],
  status: requirement.status || "Active",
  isPublished: Boolean(requirement.isPublished),
  createdAt: requirement.createdAt,
  updatedAt: requirement.updatedAt,
});

const parseLineList = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const serializeFeedback = (feedback) => ({
  id: feedback._id.toString(),
  name: feedback.name,
  email: feedback.email || "",
  comment: feedback.comment,
  stars: Number(feedback.stars || 0),
  isApproved: Boolean(feedback.isApproved),
  approvedAt: feedback.approvedAt,
  createdAt: feedback.createdAt,
  updatedAt: feedback.updatedAt,
});

const serializeChatConversation = (conversation, userMap = new Map()) => {
  const assignedUser =
    userMap.get(String(conversation.assignedTo?._id || conversation.assignedTo || "")) ||
    conversation.assignedTo;

  return {
    id: conversation._id.toString(),
    visitorName: conversation.visitorName,
    visitorContact: conversation.visitorContact || "",
    assignedTo:
      assignedUser && assignedUser._id
        ? {
            id: assignedUser._id.toString(),
            name: assignedUser.name,
            role: assignedUser.role,
            workType: assignedUser.workType || assignedUser.role,
            profileImageUrl: assignedUser.profileImageData
              ? `/users/${assignedUser._id.toString()}/profile-image`
              : "",
          }
        : null,
    messages: (conversation.messages || []).map((message) => ({
      id: message._id.toString(),
      senderType: message.senderType,
      senderName: message.senderName || "",
      text: message.text,
      attachments: (message.attachments || []).map((attachment) => ({
        id: attachment._id.toString(),
        name: attachment.name || "",
        mimeType: attachment.mimeType || "application/octet-stream",
        uploadedAt: attachment.uploadedAt,
        downloadUrl: `/public-chat/conversations/${conversation._id.toString()}/messages/${message._id.toString()}/attachments/${attachment._id.toString()}`,
      })),
      createdAt: message.createdAt,
    })),
    unreadForAgent: Boolean(conversation.unreadForAgent),
    unreadForVisitor: Boolean(conversation.unreadForVisitor),
    isClosed: Boolean(conversation.isClosed),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTodayKey = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const parseDateKey = (value) => {
  const [year, month, day] = String(value || "")
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildSessionDays = (fromDate, toDate, existingDays = []) => {
  const start = parseDateKey(fromDate);
  const end = parseDateKey(toDate);

  if (!start || !end || end < start) {
    return [];
  }

  const existingByDate = new Map(
    (existingDays || []).map((day) => [
      day.date,
      {
        status: day.status || "not_done",
        updatedAt: day.updatedAt || null,
      },
    ])
  );
  const days = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const date = formatDateKey(cursor);
    const existing = existingByDate.get(date);
    days.push({
      date,
      status: existing?.status || "not_done",
      updatedAt: existing?.updatedAt || null,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const ensureTreatmentPlanSessionDays = (patient) => {
  let changed = false;

  (patient.treatmentPlans || []).forEach((plan) => {
    if ((!plan.sessionDays || plan.sessionDays.length === 0) && plan.fromDate && plan.toDate) {
      plan.sessionDays = buildSessionDays(plan.fromDate, plan.toDate);
      changed = true;
    }
  });

  return changed;
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

    return Boolean(fromKey && toKey && fromKey <= todayKey && toKey >= todayKey);
  });
};

const hasOpenPatientAppointment = (patient) => {
  if (!patient) {
    return false;
  }

  const todayKey = getTodayKey();

  return serializePatientAppointments(patient.appointments || []).some((appointment) => {
    const status = appointment.status || "approved";
    const appointmentKey = String(appointment.date || "").slice(0, 10);

    return (
      appointmentKey >= todayKey &&
      !["completed", "cancelled"].includes(status)
    );
  });
};

const getAppointmentScheduleKey = (appointment) =>
  String(
    appointment.rescheduledDate ||
      appointment.approvedDate ||
      appointment.date ||
      ""
  ).slice(0, 10);

app.get("/", (req, res) => {
  res.send("OmmPhysio World API is running.");
});

const mapChatAttachments = (files = []) =>
  (files || []).map((file) => ({
    name: file.originalname,
    mimeType: file.mimetype,
    data: file.buffer,
  }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "OmmPhysio World API is running.",
    timestamp: new Date().toISOString(),
  });
});

const serializeService = (service) => ({
  id: service._id.toString(),
  name: service.name,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
});

const serializeMailboxItem = (type, entry) => {
  const isCareer = type === "career";

  return {
    id: entry._id.toString(),
    type,
    title: isCareer
      ? `${entry.name || "Unknown"} applied for ${entry.role || "a role"}`
      : `${entry.name || "Unknown"} sent a contact message`,
    senderName: entry.name || "",
    senderEmail: entry.email || "",
    senderPhone: entry.phone || "",
    subject: isCareer
      ? `Career Application${entry.role ? ` - ${entry.role}` : ""}`
      : entry.subject || "Contact Message",
    summary: isCareer
      ? entry.message || `Experience: ${entry.experience || "Not provided"}`
      : entry.message || "Website contact form message",
    service: entry.service || "",
    preferredDate: entry.date || "",
    role: entry.role || "",
    experience: entry.experience || "",
    message: entry.message || "",
    attachmentName: entry.attachmentName || entry.resumeName || "",
    attachmentMimeType: entry.attachmentMimeType || entry.resumeMimeType || "",
    hasAttachment: Boolean(
      entry.attachmentData ||
        entry.resumeData ||
        entry.attachmentName ||
        entry.resumeName
    ),
    isRead: Boolean(entry.isRead),
    readAt: entry.readAt || null,
    createdAt: entry.createdAt,
  };
};

const serializeAppointmentRequest = (appointment) => {
  const status = appointment.status || "pending";
  const confirmedDate =
    status === "rescheduled"
      ? appointment.rescheduledDate || appointment.approvedDate || appointment.date || ""
      : appointment.approvedDate || appointment.rescheduledDate || appointment.date || "";
  const confirmedTime =
    status === "rescheduled"
      ? appointment.rescheduledTime || appointment.approvedTime || appointment.time || ""
      : appointment.approvedTime || appointment.rescheduledTime || appointment.time || "";

  return {
    id: appointment._id.toString(),
    patientId: appointment.patientId ? appointment.patientId.toString() : "",
    name: appointment.name || "",
    email: appointment.email || "",
    phone: appointment.phone || "",
    service: appointment.service || "",
    requestedDate: appointment.date || "",
    requestedTime: appointment.time || "",
    message: appointment.message || "",
    status,
    confirmedDate,
    confirmedTime,
    approvedDate: appointment.approvedDate || "",
    approvedTime: appointment.approvedTime || "",
    rescheduledDate: appointment.rescheduledDate || "",
    rescheduledTime: appointment.rescheduledTime || "",
    decisionNote: appointment.decisionNote || "",
    decisionAt: appointment.decisionAt || null,
    isRead: Boolean(appointment.isRead),
    readAt: appointment.readAt || null,
    notificationSeenAt: appointment.notificationSeenAt || null,
    createdAt: appointment.createdAt,
  };
};

const resolveAppointmentPatient = async (appointment) => {
  if (appointment.patientId) {
    const patient = await Patient.findById(appointment.patientId);
    if (patient) {
      return patient;
    }
  }

  const email = String(appointment.email || "").trim().toLowerCase();
  const phone = String(appointment.phone || "").trim();

  if (email) {
    const patient = await Patient.findOne({ email });
    if (patient) {
      appointment.patientId = patient._id;
      await appointment.save();
      return patient;
    }
  }

  if (phone) {
    const patient = await Patient.findOne({ mobile: phone });
    if (patient) {
      appointment.patientId = patient._id;
      await appointment.save();
      return patient;
    }
  }

  return null;
};

const upsertPatientAppointmentFromRequest = async (appointment) => {
  const patient = await resolveAppointmentPatient(appointment);

  if (!patient) {
    return null;
  }

  const requestId = appointment._id.toString();
  const matchingAppointments = (patient.appointments || []).filter(
    (entry) => entry.requestId && entry.requestId.toString() === requestId
  );
  const existingAppointment = matchingAppointments[0] || null;
  const date =
    appointment.rescheduledDate ||
    appointment.approvedDate ||
    appointment.date;
  const time =
    appointment.rescheduledTime ||
    appointment.approvedTime ||
    appointment.time ||
    "";

  if (existingAppointment) {
    existingAppointment.date = date;
    existingAppointment.time = time;
    existingAppointment.service = appointment.service || existingAppointment.service;
    existingAppointment.status = appointment.status;
    existingAppointment.remark = appointment.decisionNote || existingAppointment.remark || "";
    patient.appointments = (patient.appointments || []).filter(
      (entry) =>
        !entry.requestId ||
        entry.requestId.toString() !== requestId ||
        entry._id.toString() === existingAppointment._id.toString()
    );
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
  return patient;
};

const autoCompleteOverdueAppointments = async (filter = {}) => {
  const todayKey = getTodayKey();
  const appointments = await Appointment.find({
    ...filter,
    status: { $in: ["approved", "rescheduled"] },
  });
  let updatedCount = 0;

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
    await upsertPatientAppointmentFromRequest(appointment);
    updatedCount += 1;
  }

  return updatedCount;
};

app.get("/api/dashboard", requireStaffAuth, async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const [patients, staff, appointmentRequests] = await Promise.all([
      Patient.find().sort({ updatedAt: -1 }),
      User.find().sort({ createdAt: -1 }),
      Appointment.find().sort({ createdAt: -1 }),
    ]);
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    const totalRevenue = patients.reduce((sum, patient) => {
      const treatmentRevenue = (patient.treatmentPlans || []).reduce(
        (planSum, plan) =>
          planSum +
          (plan.payments || []).reduce(
            (paymentSum, payment) => paymentSum + Number(payment.amount || 0),
            0
          ),
        0
      );

      const legacyRevenue = (patient.payments || []).reduce(
        (paymentSum, payment) => paymentSum + Number(payment.amount || 0),
        0
      );

      return sum + treatmentRevenue + legacyRevenue;
    }, 0);

    const patientSessions = patients.flatMap((patient) =>
      (patient.treatmentPlans || [])
        .filter((plan) => (plan.status || "active") === "active")
        .map((plan) => {
          const fromKey = String(plan.fromDate || "").slice(0, 10);
          const toKey = String(plan.toDate || "").slice(0, 10);

          if (!fromKey || !toKey) {
            return null;
          }

          const scheduleType =
            fromKey <= todayKey && toKey >= todayKey
              ? "today"
              : fromKey > todayKey
              ? "upcoming"
              : null;

          if (!scheduleType) {
            return null;
          }

          return {
            patient: patient.name,
            time: `Session: ${plan.fromDate} to ${plan.toDate}`,
            service: (plan.treatmentTypes || []).join(", ") || "Treatment Session",
            sortTime: `${fromKey}T00:00:00.000Z`,
            kind: "session",
            scheduleType,
          };
        })
        .filter(Boolean)
    );

    const patientAppointments = patients.flatMap((patient) =>
      serializePatientAppointments(patient.appointments || [])
        .filter((appointment) => !["completed", "cancelled"].includes(appointment.status || ""))
        .map((appointment) => {
          const appointmentKey = String(appointment.date || "").slice(0, 10);
          if (!appointmentKey) {
            return null;
          }

          const scheduleType =
            appointmentKey === todayKey ? "today" : appointmentKey > todayKey ? "upcoming" : null;

          if (!scheduleType) {
            return null;
          }

          return {
            patient: patient.name,
            time: appointment.date,
            service: appointment.service,
            sortTime: appointment.date,
            kind: "appointment",
            scheduleType,
          };
        })
        .filter(Boolean)
    );

    const externalAppointments = appointmentRequests
      .filter((appointment) =>
        !appointment.patientId &&
        ["approved", "rescheduled"].includes(appointment.status || "pending")
      )
      .map((appointment) => {
        const appointmentKey = String(
          appointment.status === "rescheduled"
            ? appointment.rescheduledDate || appointment.approvedDate || appointment.date
            : appointment.approvedDate || appointment.date
        ).slice(0, 10);
        if (!appointmentKey) {
          return null;
        }

        const scheduleType =
          appointmentKey === todayKey ? "today" : appointmentKey > todayKey ? "upcoming" : null;

        if (!scheduleType) {
          return null;
        }

        return {
          patient: appointment.name,
          time: appointmentKey,
          service: appointment.service,
          sortTime: appointmentKey,
          kind: "appointment",
          scheduleType,
        };
      })
      .filter(Boolean);

    const scheduleItems = [...patientSessions, ...patientAppointments, ...externalAppointments]
      .sort((a, b) => String(a.sortTime || a.time).localeCompare(String(b.sortTime || b.time)))
      .map(({ patient, time, service, kind, scheduleType }) => ({
        patient,
        time,
        service,
        kind,
        scheduleType,
      }));

    const todaysSchedule = scheduleItems.filter((item) => item.scheduleType === "today").slice(0, 8);
    const upcomingSchedule = scheduleItems
      .filter((item) => item.scheduleType === "upcoming")
      .slice(0, 8);

    const nextSchedule = todaysSchedule[0]?.time || upcomingSchedule[0]?.time || "Not scheduled";
    const pendingAppointmentRequests = appointmentRequests.filter(
      (appointment) => !appointment.status || appointment.status === "pending"
    ).length;
    const activeTreatmentSessions = patients.reduce(
      (count, patient) =>
        count +
        (patient.treatmentPlans || []).filter((plan) => (plan.status || "active") === "active")
          .length,
      0
    );
    const appointmentStatusChart = ["pending", "approved", "rescheduled", "completed", "cancelled"]
      .map((status) => ({
        label: status.replace("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()),
        value: appointmentRequests.filter(
          (appointment) => (appointment.status || "pending") === status
        ).length,
      }));
    const treatmentPlans = patients.flatMap((patient) => patient.treatmentPlans || []);
    const sessionStatusChart = ["active", "completed"].map((status) => ({
      label: status.replace(/^\w/, (letter) => letter.toUpperCase()),
      value: treatmentPlans.filter((plan) => (plan.status || "active") === status).length,
    }));
    const monthFormatter = new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "2-digit",
    });
    const revenueByMonth = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: monthFormatter.format(date),
        value: 0,
      };
    });
    const revenueBuckets = new Map(revenueByMonth.map((month) => [month.key, month]));
    const addRevenueToMonth = (payment) => {
      const paymentDate = payment.createdAt ? new Date(payment.createdAt) : null;
      if (!paymentDate || Number.isNaN(paymentDate.getTime())) {
        return;
      }

      const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const bucket = revenueBuckets.get(key);
      if (bucket) {
        bucket.value += Number(payment.amount || 0);
      }
    };

    patients.forEach((patient) => {
      (patient.payments || []).forEach(addRevenueToMonth);
      (patient.treatmentPlans || []).forEach((plan) => {
        (plan.payments || []).forEach(addRevenueToMonth);
      });
    });

    res.json({
      stats: {
        totalPatients: patients.length,
        todaysSchedule: todaysSchedule.length,
        appointmentsToday: todaysSchedule.length,
        revenue: totalRevenue,
        staff: staff.length,
      },
      quickStats: {
        pendingAppointmentRequests,
        pendingRequests: pendingAppointmentRequests,
        activeTreatmentSessions,
        activeSessions: activeTreatmentSessions,
        nextSchedule,
      },
      charts: {
        appointmentStatus: appointmentStatusChart,
        sessionStatus: sessionStatusChart,
        revenueByMonth,
      },
      todaysSchedule,
      upcomingSchedule,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load dashboard data." });
  }
});

app.get("/api/reports", requireAdminAuth, async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const todayKey = getTodayKey();
    const requestedFrom = String(req.query.from || "").slice(0, 10);
    const requestedTo = String(req.query.to || "").slice(0, 10);
    const fromKey = requestedFrom || `${todayKey.slice(0, 7)}-01`;
    const toKey = requestedTo || todayKey;
    const fromDate = parseDateKey(fromKey);
    const toDate = parseDateKey(toKey);

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Please provide a valid from and to date." });
    }

    if (fromDate > toDate) {
      return res.status(400).json({ message: "From date cannot be after to date." });
    }

    const patients = await Patient.find().sort({ name: 1, createdAt: -1 });
    const patientsNeedingSessionDays = patients.filter(ensureTreatmentPlanSessionDays);
    if (patientsNeedingSessionDays.length) {
      await Promise.all(patientsNeedingSessionDays.map((patient) => patient.save()));
    }

    const isInRange = (dateKey) => Boolean(dateKey) && dateKey >= fromKey && dateKey <= toKey;
    const patientsCovered = new Set();
    const appointments = [];
    const sessions = [];
    const payments = [];

    patients.forEach((patient) => {
      const patientId = patient._id.toString();
      const patientName = patient.name || "Patient";
      const patientEmail = patient.email || "";
      const patientMobile = patient.mobile || "";

      serializePatientAppointments(patient.appointments || []).forEach((appointment) => {
        const dateKey = String(appointment.date || "").slice(0, 10);
        if (!isInRange(dateKey)) {
          return;
        }

        patientsCovered.add(patientId);
        appointments.push({
          id: appointment.id,
          patientId,
          patientName,
          patientEmail,
          patientMobile,
          date: appointment.date || "",
          time: appointment.time || "",
          service: appointment.service || "",
          status: appointment.status || "approved",
          remark: appointment.remark || "",
          createdAt: appointment.createdAt || null,
        });
      });

      (patient.treatmentPlans || []).forEach((plan) => {
        const treatmentTypes = (plan.treatmentTypes || []).join(", ") || "Treatment Session";
        const planStatus = plan.status || "active";

        (plan.sessionDays || []).forEach((day) => {
          const dateKey = String(day.date || "").slice(0, 10);
          if (!isInRange(dateKey)) {
            return;
          }

          patientsCovered.add(patientId);
          sessions.push({
            id: `${patientId}-${plan._id.toString()}-${day._id.toString()}`,
            patientId,
            patientName,
            patientEmail,
            patientMobile,
            date: day.date || "",
            status: day.status || "not_done",
            updatedAt: day.updatedAt || null,
            treatmentTypes,
            planStatus,
            fromDate: plan.fromDate || "",
            toDate: plan.toDate || "",
          });
        });

        (plan.payments || []).forEach((payment) => {
          const dateKey = payment.createdAt ? formatDateKey(new Date(payment.createdAt)) : "";
          if (!isInRange(dateKey)) {
            return;
          }

          patientsCovered.add(patientId);
          payments.push({
            id: `${patientId}-${plan._id.toString()}-${payment._id.toString()}`,
            patientId,
            patientName,
            patientEmail,
            patientMobile,
            date: dateKey,
            amount: Number(payment.amount || 0),
            method: payment.method || "",
            source: "Session Payment",
            treatmentTypes,
            createdAt: payment.createdAt || null,
          });
        });
      });

      (patient.payments || []).forEach((payment) => {
        const dateKey = payment.createdAt ? formatDateKey(new Date(payment.createdAt)) : "";
        if (!isInRange(dateKey)) {
          return;
        }

        patientsCovered.add(patientId);
        payments.push({
          id: `${patientId}-direct-${payment._id.toString()}`,
          patientId,
          patientName,
          patientEmail,
          patientMobile,
          date: dateKey,
          amount: Number(payment.amount || 0),
          method: payment.method || "",
          source: "Direct Payment",
          treatmentTypes: "",
          createdAt: payment.createdAt || null,
        });
      });
    });

    appointments.sort((a, b) =>
      `${b.date} ${b.time || ""}`.localeCompare(`${a.date} ${a.time || ""}`)
    );
    sessions.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    payments.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    res.json({
      range: {
        from: fromKey,
        to: toKey,
      },
      summary: {
        patientsCovered: patientsCovered.size,
        appointmentCount: appointments.length,
        completedAppointments: appointments.filter(
          (appointment) => appointment.status === "completed"
        ).length,
        sessionCount: sessions.length,
        completedSessions: sessions.filter((session) => session.status === "done").length,
        paymentCount: payments.length,
        paymentAmount: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      },
      appointments,
      sessions,
      payments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load reports." });
  }
});

app.get("/api/treatment-tracker", requireStaffAuth, async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const [patients, appointmentRequests, appointmentDecisions] = await Promise.all([
      Patient.find().sort({ updatedAt: -1 }),
      Appointment.find({
        status: { $in: ["pending", "", null] },
      }).sort({ createdAt: -1 }),
      Appointment.find({
        status: { $in: ["approved", "rescheduled", "completed", "cancelled"] },
      }).sort({ decisionAt: -1, createdAt: -1 }),
    ]);
    const patientsNeedingSessionDays = patients.filter(ensureTreatmentPlanSessionDays);
    if (patientsNeedingSessionDays.length) {
      await Promise.all(patientsNeedingSessionDays.map((patient) => patient.save()));
    }
    const now = new Date();
    const todayKey = getTodayKey();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const todaysAppointments = appointmentDecisions.filter((appointment) => {
      const appointmentKey = getAppointmentScheduleKey(appointment);

      return appointmentKey === todayKey;
    });

    const summaries = patients.map((patient) => {
      const treatmentPlans = (patient.treatmentPlans || [])
        .map((plan) => ({
          id: plan._id.toString(),
          treatmentTypes: plan.treatmentTypes || [],
          fromDate: plan.fromDate || "",
          toDate: plan.toDate || "",
          status: plan.status || "active",
          parsedFromDate: parseDateValue(plan.fromDate),
          parsedToDate: parseDateValue(plan.toDate),
          totalAmount: Number(plan.totalAmount || 0),
          advanceAmount: Number(plan.advanceAmount || 0),
          balanceAmount: Number(plan.balanceAmount || 0),
          sessionDays: (plan.sessionDays || []).map((day) => ({
            id: day._id.toString(),
            date: day.date || "",
            status: day.status || "not_done",
            updatedAt: day.updatedAt || null,
          })),
        }))
        .sort((a, b) => {
          const aTime = a.parsedFromDate ? a.parsedFromDate.getTime() : 0;
          const bTime = b.parsedFromDate ? b.parsedFromDate.getTime() : 0;
          return bTime - aTime;
        });
      const appointments = serializePatientAppointments(patient.appointments || [])
        .map((appointment) => ({
          id: appointment.id,
          date: appointment.date,
          service: appointment.service,
          status: appointment.status || "approved",
          parsedDate: parseDateValue(appointment.date),
          createdAt: appointment.createdAt,
        }))
        .sort((a, b) => {
          const aTime = a.parsedDate ? a.parsedDate.getTime() : 0;
          const bTime = b.parsedDate ? b.parsedDate.getTime() : 0;
          return aTime - bTime;
        });

      const activeTreatmentPlan = treatmentPlans.find((plan) => plan.status === "active") || null;
      const todaysSessions = treatmentPlans.flatMap((plan) =>
        (plan.sessionDays || [])
          .filter((day) => plan.status === "active" && day.date === todayKey)
          .map((day) => ({
            patientId: patient._id.toString(),
            patientName: patient.name,
            patientMobile: patient.mobile,
            patientEmail: patient.email,
            planId: plan.id,
            dayId: day.id,
            date: day.date,
            status: day.status || "not_done",
            treatmentTypes: plan.treatmentTypes || [],
          }))
      );
      const latestCompletedPlan =
        treatmentPlans.find((plan) => plan.status === "completed") ||
        treatmentPlans.find((plan) => plan.parsedToDate && plan.parsedToDate < now) ||
        null;

      const upcomingAppointments = appointments.filter(
        (appointment) =>
          appointment.parsedDate &&
          appointment.parsedDate >= now &&
          !["completed", "cancelled"].includes(appointment.status || "")
      );
      const latestPastAppointment = [...appointments]
        .filter((appointment) => appointment.parsedDate && appointment.parsedDate < now)
        .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())[0];
      const latestAppointment = [...appointments].sort((a, b) => {
        const aTime = a.parsedDate ? a.parsedDate.getTime() : 0;
        const bTime = b.parsedDate ? b.parsedDate.getTime() : 0;
        return bTime - aTime;
      })[0];

      const treatmentStarted = appointments.length > 0;
      const followUpNeeded =
        Boolean((latestCompletedPlan?.parsedToDate || latestPastAppointment?.parsedDate)) &&
        (latestCompletedPlan?.parsedToDate || latestPastAppointment?.parsedDate) < sevenDaysAgo &&
        upcomingAppointments.length === 0;

      return {
        id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        disease: patient.disease || "",
        clinicalNotesCount: (patient.clinicalNotes || []).length,
        appointmentsCount: appointments.length,
        treatmentStarted: treatmentStarted || treatmentPlans.length > 0,
        treatmentPlans,
        todaysSessions,
        activeTreatmentPlan,
        upcomingAppointments: upcomingAppointments.map((appointment) => ({
          id: appointment.id,
          date: appointment.date,
          service: appointment.service,
        })),
        nextAppointment: upcomingAppointments[0]
          ? {
              id: upcomingAppointments[0].id,
              date: upcomingAppointments[0].date,
              service: upcomingAppointments[0].service,
            }
          : null,
        latestSession: latestAppointment
          ? {
              id: latestAppointment.id,
              date: latestAppointment.date,
              service: latestAppointment.service,
            }
          : null,
        followUpNeeded,
        daysSinceLastSession: (latestCompletedPlan?.parsedToDate || latestPastAppointment?.parsedDate)
          ? Math.floor(
              (now.getTime() -
                (latestCompletedPlan?.parsedToDate || latestPastAppointment?.parsedDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      };
    });

    res.json({
      appointmentRequests: appointmentRequests.map(serializeAppointmentRequest),
      todaysAppointments: todaysAppointments.map(serializeAppointmentRequest),
      upcomingAppointments: summaries
        .filter((patient) => patient.upcomingAppointments.length > 0)
        .sort((a, b) => {
          const aDate = parseDateValue(a.nextAppointment?.date)?.getTime() || 0;
          const bDate = parseDateValue(b.nextAppointment?.date)?.getTime() || 0;
          return aDate - bDate;
        }),
      activeSessions: summaries
        .filter((patient) => patient.activeTreatmentPlan && !patient.followUpNeeded)
        .sort((a, b) => {
          const aDate = parseDateValue(a.activeTreatmentPlan?.fromDate)?.getTime() || 0;
          const bDate = parseDateValue(b.activeTreatmentPlan?.fromDate)?.getTime() || 0;
          return bDate - aDate;
        }),
      todaysSessions: summaries
        .flatMap((patient) => patient.todaysSessions || [])
        .sort((a, b) => a.patientName.localeCompare(b.patientName)),
      followUpNeeded: summaries
        .filter((patient) => patient.followUpNeeded)
        .sort((a, b) => (b.daysSinceLastSession || 0) - (a.daysSinceLastSession || 0)),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load treatment tracker." });
  }
});

app.get("/api/appointments", requireStaffAuth, async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments.map(serializeAppointmentRequest));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load appointment requests." });
  }
});

app.patch("/api/appointments/:id/approve", requireStaffAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment request not found." });
    }

    const date = String(req.body.date || appointment.date || "").trim();
    const time = String(req.body.time || appointment.time || "").trim();

    if (!date) {
      return res.status(400).json({ message: "Appointment date is required." });
    }

    appointment.status = "approved";
    appointment.approvedDate = date;
    appointment.approvedTime = time;
    appointment.rescheduledDate = "";
    appointment.rescheduledTime = "";
    appointment.decisionNote = String(req.body.note || "").trim();
    appointment.decisionAt = new Date();
    appointment.notificationSeenAt = null;
    appointment.isRead = true;
    appointment.readAt = appointment.readAt || new Date();
    await appointment.save();

    await upsertPatientAppointmentFromRequest(appointment);

    res.json(serializeAppointmentRequest(appointment));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to approve appointment." });
  }
});

app.patch("/api/appointments/:id/reschedule", requireStaffAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment request not found." });
    }

    const date = String(req.body.date || "").trim();
    const time = String(req.body.time || "").trim();

    if (!date) {
      return res.status(400).json({ message: "Rescheduled date is required." });
    }

    appointment.status = "rescheduled";
    appointment.rescheduledDate = date;
    appointment.rescheduledTime = time;
    appointment.decisionNote = String(req.body.note || "").trim();
    appointment.decisionAt = new Date();
    appointment.notificationSeenAt = null;
    appointment.isRead = true;
    appointment.readAt = appointment.readAt || new Date();
    await appointment.save();

    await upsertPatientAppointmentFromRequest(appointment);

    res.json(serializeAppointmentRequest(appointment));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to reschedule appointment." });
  }
});

app.patch("/api/appointments/:id/status", requireStaffAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment request not found." });
    }

    const status = cleanText(req.body.status).toLowerCase();
    const remark = cleanText(req.body.remark || req.body.note);

    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Status must be done or cancelled." });
    }

    if (!remark) {
      return res.status(400).json({ message: "Remark is required." });
    }

    appointment.status = status;
    appointment.decisionNote = remark;
    appointment.decisionAt = new Date();
    appointment.notificationSeenAt = null;
    appointment.isRead = true;
    appointment.readAt = appointment.readAt || new Date();
    await appointment.save();

    await upsertPatientAppointmentFromRequest(appointment);

    res.json(serializeAppointmentRequest(appointment));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update appointment status." });
  }
});

app.get("/api/patients/:id/appointment-requests", requirePatientRecordAccess, async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const requests = await Appointment.find({
      $or: [
        { patientId: patient._id },
        { email: patient.email },
        { phone: patient.mobile },
      ],
    }).sort({ createdAt: -1 });

    res.json(requests.map(serializeAppointmentRequest));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load appointment requests." });
  }
});

app.patch("/api/appointments/:id/notification-seen", requirePatientOrStaffAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment request not found." });
    }

    if (req.auth?.type === "patient") {
      const appointmentPatientId = appointment.patientId ? appointment.patientId.toString() : "";

      if (!req.auth.patientId || appointmentPatientId !== req.auth.patientId) {
        return res.status(403).json({ message: "You do not have access to this appointment." });
      }
    }

    appointment.notificationSeenAt = new Date();
    await appointment.save();
    res.json(serializeAppointmentRequest(appointment));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update appointment notification." });
  }
});

app.get("/api/mailbox", requireStaffAuth, async (req, res) => {
  try {
    const [applications, contactMessages] = await Promise.all([
      StaffApplication.find().sort({ createdAt: -1 }),
      ContactMessage.find().sort({ createdAt: -1 }),
    ]);

    const items = [
      ...applications.map((application) =>
        serializeMailboxItem("career", application)
      ),
      ...contactMessages.map((message) =>
        serializeMailboxItem("contact", message)
      ),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load mailbox." });
  }
});

app.patch("/api/mailbox/:type/:id/read", requireStaffAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const isRead = req.body.isRead !== false;
    const Model =
      type === "career"
        ? StaffApplication
        : type === "contact"
        ? ContactMessage
        : null;

    if (!Model) {
      return res.status(400).json({ message: "Invalid mailbox item type." });
    }

    const item = await Model.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Mailbox item not found." });
    }

    item.isRead = isRead;
    item.readAt = isRead ? new Date() : null;
    await item.save();

    res.json(serializeMailboxItem(type, item));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update mailbox item." });
  }
});

app.get("/api/mailbox/:type/:id/attachment", requireStaffAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === "career" ? StaffApplication : null;

    if (!Model) {
      return res.status(400).json({ message: "Invalid mailbox item type." });
    }

    const item = await Model.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Mailbox item not found." });
    }

    const fileName = item.attachmentName || item.resumeName;
    const mimeType = item.attachmentMimeType || item.resumeMimeType || "application/octet-stream";
    const fileData = item.attachmentData || item.resumeData;

    if (!fileName || !fileData) {
      return res.status(404).json({ message: "Attachment not available for download." });
    }

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.send(fileData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to download attachment." });
  }
});

app.get("/api/patients", requireStaffAuth, async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients.map(serializePatient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load patients." });
  }
});

app.get("/api/patients/:id", requirePatientRecordAccess, async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (ensureTreatmentPlanSessionDays(patient)) {
      await patient.save();
    }

    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load patient." });
  }
});

app.post("/api/patients", requireStaffAuth, async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const mobile = cleanPhone(req.body.mobile);

    if (!name || !email || !mobile) {
      return res.status(400).json({ message: "Name, email, and mobile are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isValidPhone(mobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number." });
    }

    const existingPatient = await Patient.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingPatient) {
      return res.status(409).json({
        message: "A patient with this email or mobile number already exists.",
      });
    }

    const patient = await Patient.create({
      name,
      email,
      mobile,
      createdFrom: "admin",
      notes: "Created from Admin registration.",
    });
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create patient." });
  }
});

app.put("/api/patients/:id", requirePatientRecordAccess, async (req, res) => {
  try {
    const name = req.body.name !== undefined ? cleanText(req.body.name) : undefined;
    const email = req.body.email !== undefined ? cleanEmail(req.body.email) : undefined;
    const mobile = req.body.mobile !== undefined ? cleanPhone(req.body.mobile) : undefined;
    const disease = req.body.disease !== undefined ? cleanText(req.body.disease) : undefined;
    const notes = req.body.notes !== undefined ? cleanText(req.body.notes) : undefined;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (name !== undefined && !name) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (req.auth?.type === "patient" && email !== undefined && email !== patient.email) {
      return res.status(400).json({
        message: "Email address cannot be changed from your profile.",
      });
    }

    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (mobile !== undefined && !isValidPhone(mobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number." });
    }

    if (req.auth?.type === "staff") {
      patient.email = email ?? patient.email;
    }
    patient.name = name ?? patient.name;
    patient.mobile = mobile ?? patient.mobile;
    patient.disease = disease ?? patient.disease;
    patient.notes = notes ?? patient.notes;

    await patient.save();

    await PublicUser.updateMany(
      { patientId: patient._id },
      {
        $set: {
          name: patient.name,
          mobile: patient.mobile,
        },
      }
    );

    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update patient." });
  }
});

app.get("/api/patients/:id/profile-image", requirePatientRecordAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.profileImageData) {
      return res.status(404).json({ message: "Profile image not found." });
    }

    res.setHeader("Content-Type", patient.profileImageMimeType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(patient.profileImageData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load patient profile image." });
  }
});

app.post("/api/patients/:id/profile-image", requirePatientRecordAccess, upload.single("image"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (!req.file || !req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ message: "Please upload an image." });
    }

    patient.profileImageData = req.file.buffer;
    patient.profileImageMimeType = req.file.mimetype || "image/jpeg";
    patient.profileImageUpdatedAt = new Date();
    await patient.save();

    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload patient profile image." });
  }
});

app.delete("/api/patients/:id", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    res.json({ message: "Patient deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete patient." });
  }
});

app.post("/api/patients/:id/treatment-plans", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const hasActiveSession = (patient.treatmentPlans || []).some(
      (plan) => (plan.status || "active") === "active"
    );

    if (hasActiveSession) {
      return res.status(409).json({
        message:
          "A treatment session is already active. Complete the current session before starting another one.",
      });
    }

    const treatmentTypes = Array.isArray(req.body.treatmentTypes)
      ? req.body.treatmentTypes.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const fromDate = String(req.body.fromDate || "").trim();
    const toDate = String(req.body.toDate || "").trim();
    const totalAmount = Number(req.body.totalAmount || 0);
    const advanceAmount = Number(req.body.advanceAmount || 0);
    const paymentMethod = String(req.body.paymentMethod || "").trim();
    const paymentNotes = String(req.body.paymentNotes || "").trim();

    if (!treatmentTypes.length) {
      return res.status(400).json({ message: "Add at least one treatment type." });
    }

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "From date and to date are required." });
    }

    if (!isValidDateValue(fromDate) || !isValidDateValue(toDate)) {
      return res.status(400).json({ message: "Please select valid treatment dates." });
    }

    if (new Date(toDate) < new Date(fromDate)) {
      return res.status(400).json({ message: "To date cannot be before from date." });
    }

    if (totalAmount < 0 || advanceAmount < 0) {
      return res.status(400).json({ message: "Payment amounts cannot be negative." });
    }

    if (advanceAmount > totalAmount) {
      return res.status(400).json({ message: "Advance amount cannot exceed total amount." });
    }

    const balanceAmount = Math.max(0, totalAmount - advanceAmount);

    patient.treatmentPlans.unshift({
      treatmentTypes,
      fromDate,
      toDate,
      totalAmount,
      advanceAmount,
      balanceAmount,
      paymentMethod,
      paymentNotes,
      payments:
        advanceAmount > 0
          ? [
              {
                amount: advanceAmount,
                method: paymentMethod,
              },
            ]
          : [],
      sessionDays: buildSessionDays(fromDate, toDate),
      status: "active",
    });

    await patient.save();
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to start treatment session." });
  }
});

app.patch("/api/patients/:id/treatment-plans/:planId/status", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const plan = patient.treatmentPlans.id(req.params.planId);

    if (!plan) {
      return res.status(404).json({ message: "Treatment plan not found." });
    }

    const nextStatus = String(req.body.status || "").trim().toLowerCase();
    if (!["active", "completed"].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid treatment status." });
    }

    plan.status = nextStatus;
    await patient.save();
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update treatment status." });
  }
});

app.put("/api/patients/:id/treatment-plans/:planId", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const plan = patient.treatmentPlans.id(req.params.planId);

    if (!plan) {
      return res.status(404).json({ message: "Treatment plan not found." });
    }

    const treatmentTypes = Array.isArray(req.body.treatmentTypes)
      ? req.body.treatmentTypes.map((item) => String(item || "").trim()).filter(Boolean)
      : plan.treatmentTypes;

    const totalAmount = Number(req.body.totalAmount ?? plan.totalAmount ?? 0);
    const paymentMethod = String(req.body.paymentMethod ?? plan.paymentMethod ?? "").trim();
    const paymentNotes = String(req.body.paymentNotes ?? plan.paymentNotes ?? "").trim();
    const paidAmount = (plan.payments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const nextFromDate = String(req.body.fromDate ?? plan.fromDate ?? "").trim();
    const nextToDate = String(req.body.toDate ?? plan.toDate ?? "").trim();

    plan.treatmentTypes = treatmentTypes;
    plan.fromDate = nextFromDate;
    plan.toDate = nextToDate;

    if (!plan.treatmentTypes.length) {
      return res.status(400).json({ message: "Add at least one treatment type." });
    }

    if (!isValidDateValue(plan.fromDate) || !isValidDateValue(plan.toDate)) {
      return res.status(400).json({ message: "Please select valid treatment dates." });
    }

    if (new Date(plan.toDate) < new Date(plan.fromDate)) {
      return res.status(400).json({ message: "To date cannot be before from date." });
    }

    if (totalAmount < 0) {
      return res.status(400).json({ message: "Total amount cannot be negative." });
    }

    plan.totalAmount = totalAmount;
    plan.advanceAmount = paidAmount;
    plan.balanceAmount = Math.max(0, totalAmount - paidAmount);
    plan.paymentMethod = paymentMethod;
    plan.paymentNotes = paymentNotes;
    plan.sessionDays = buildSessionDays(plan.fromDate, plan.toDate, plan.sessionDays || []);

    await patient.save();
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update treatment plan." });
  }
});

app.patch("/api/patients/:id/treatment-plans/:planId/session-days/:dayId", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const plan = patient.treatmentPlans.id(req.params.planId);

    if (!plan) {
      return res.status(404).json({ message: "Treatment plan not found." });
    }

    const sessionDay = plan.sessionDays.id(req.params.dayId);

    if (!sessionDay) {
      return res.status(404).json({ message: "Session day not found." });
    }

    if (sessionDay.date !== getTodayKey()) {
      return res.status(400).json({ message: "Only today's session status can be updated." });
    }

    const nextStatus = String(req.body.status || "").trim().toLowerCase();
    if (!["done", "not_done"].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid session day status." });
    }

    sessionDay.status = nextStatus;
    sessionDay.updatedAt = new Date();
    await patient.save();

    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update session day." });
  }
});

app.post("/api/patients/:id/treatment-plans/:planId/payments", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const plan = patient.treatmentPlans.id(req.params.planId);

    if (!plan) {
      return res.status(404).json({ message: "Treatment plan not found." });
    }

    const amount = Number(req.body.amount || 0);
    const method = String(req.body.method || "").trim();

    if (!amount) {
      return res.status(400).json({ message: "Payment amount is required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than zero." });
    }

    plan.payments.push({
      amount,
      method,
    });

    const paidAmount = (plan.payments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    plan.advanceAmount = paidAmount;
    plan.balanceAmount = Math.max(0, Number(plan.totalAmount || 0) - paidAmount);
    if (method) {
      plan.paymentMethod = method;
    }

    await patient.save();
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add treatment payment." });
  }
});

app.delete("/api/patients/:id/treatment-plans/:planId", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    patient.treatmentPlans = patient.treatmentPlans.filter(
      (plan) => plan._id.toString() !== req.params.planId
    );

    await patient.save();
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete treatment plan." });
  }
});

app.post("/api/patients/:id/clinical-notes", requirePatientRecordAccess, upload.array("documents", 10), async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const note = String(req.body.note || "").trim();
    const addedByType = cleanText(req.body.addedByType) === "patient" ? "patient" : "opw";
    const addedByLabel =
      addedByType === "patient" ? cleanText(req.body.addedByLabel) || "Patient" : "OPW";
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (!title && !note && !(req.files || []).length) {
      return res.status(400).json({ message: "Add a title, note, or at least one document." });
    }

    patient.clinicalNotes.unshift({
      title,
      note,
      addedByType,
      addedByLabel,
      documents: (req.files || []).map((file) => ({
        name: file.originalname,
        mimeType: file.mimetype,
        data: file.buffer,
      })),
    });

    await patient.save();
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to save clinical note." });
  }
});

app.delete("/api/patients/:id/clinical-notes/:noteId", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    patient.clinicalNotes = patient.clinicalNotes.filter(
      (entry) => entry._id.toString() !== req.params.noteId
    );

    await patient.save();
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete clinical note." });
  }
});

app.get("/api/patients/:id/clinical-notes/:noteId/documents/:documentId", requirePatientRecordAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const note = patient.clinicalNotes.id(req.params.noteId);

    if (!note) {
      return res.status(404).json({ message: "Clinical note not found." });
    }

    const document = note.documents.id(req.params.documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.setHeader("Content-Type", document.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(document.name)}"`
    );
    res.send(document.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to download document." });
  }
});

app.post("/api/patients/:id/appointments", requireStaffAuth, async (req, res) => {
  try {
    const date = cleanText(req.body.date);
    const time = cleanText(req.body.time);
    const service = cleanText(req.body.service);

    if (!date || !service) {
      return res.status(400).json({ message: "Date and service are required." });
    }

    if (!isFutureOrTodayDate(date)) {
      return res.status(400).json({ message: "Appointment date cannot be in the past." });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (hasStartedActiveTreatment(patient)) {
      return res.status(409).json({
        message:
          "Treatment session is already active. A new appointment can be added after the current session date is finished.",
      });
    }

    if (hasOpenPatientAppointment(patient)) {
      return res.status(409).json({
        message:
          "This patient already has a scheduled appointment. Add another only after it is done or cancelled.",
      });
    }

    patient.appointments.push({ date, time: time || "", service });
    await patient.save();

    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add appointment." });
  }
});

app.delete("/api/patients/:id/appointments/:appointmentId", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const appointmentToDelete = patient.appointments.id(req.params.appointmentId);

    if (!appointmentToDelete) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointmentToDelete.requestId) {
      const appointmentRequest = await Appointment.findById(appointmentToDelete.requestId);

      if (appointmentRequest && !["completed", "cancelled"].includes(appointmentRequest.status)) {
        appointmentRequest.status = "cancelled";
        appointmentRequest.decisionNote = "Deleted from OPW patient profile";
        appointmentRequest.decisionAt = new Date();
        appointmentRequest.notificationSeenAt = null;
        appointmentRequest.isRead = true;
        appointmentRequest.readAt = appointmentRequest.readAt || new Date();
        await appointmentRequest.save();
      }
    }

    patient.appointments = patient.appointments.filter(
      (appointment) => appointment._id.toString() !== req.params.appointmentId
    );

    await patient.save();

    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete appointment." });
  }
});

app.patch("/api/patients/:id/appointments/:appointmentId", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const appointment = patient.appointments.id(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const status = cleanText(req.body.status).toLowerCase();
    const date = cleanText(req.body.date);
    const time = cleanText(req.body.time);
    const remark = cleanText(req.body.remark || req.body.note);

    if (!["rescheduled", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status." });
    }

    if (status === "rescheduled" && !date) {
      return res.status(400).json({ message: "Rescheduled date is required." });
    }

    if (["completed", "cancelled"].includes(status) && !remark) {
      return res.status(400).json({ message: "Remark is required." });
    }

    if (status === "rescheduled") {
      appointment.date = date;
      appointment.time = time || appointment.time || "";
    }

    appointment.status = status;
    appointment.remark = remark || appointment.remark || "";

    if (appointment.requestId) {
      const appointmentRequest = await Appointment.findById(appointment.requestId);

      if (appointmentRequest) {
        appointmentRequest.status = status;
        appointmentRequest.decisionNote = remark || appointmentRequest.decisionNote || "";
        appointmentRequest.decisionAt = new Date();
        appointmentRequest.notificationSeenAt = null;
        appointmentRequest.isRead = true;
        appointmentRequest.readAt = appointmentRequest.readAt || new Date();

        if (status === "rescheduled") {
          appointmentRequest.rescheduledDate = date;
          appointmentRequest.rescheduledTime = time || "";
        }

        await appointmentRequest.save();
      }
    }

    await patient.save();
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update appointment." });
  }
});

app.post("/api/patients/:id/payments", requireStaffAuth, async (req, res) => {
  try {
    const amount = Number(req.body.amount || 0);
    const method = cleanText(req.body.method);

    if (!amount) {
      return res.status(400).json({ message: "Amount is required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    patient.payments.push({ amount, method: method || "" });
    await patient.save();

    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add payment." });
  }
});

app.delete("/api/patients/:id/payments/:paymentId", requireStaffAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    patient.payments = patient.payments.filter(
      (payment) => payment._id.toString() !== req.params.paymentId
    );

    await patient.save();

    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete payment." });
  }
});

app.get("/api/services", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services.map(serializeService));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load services." });
  }
});

app.get("/api/feedback", requireAdminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback.map(serializeFeedback));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load feedback." });
  }
});

app.get("/api/public-feedback", async (req, res) => {
  try {
    const feedback = await Feedback.find({ isApproved: true }).sort({
      approvedAt: -1,
      createdAt: -1,
    });
    res.json(feedback.map(serializeFeedback));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load public feedback." });
  }
});

app.post("/api/contact", publicFormRateLimiter, async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const phone = cleanPhone(req.body.phone);
    const subject = cleanText(req.body.subject || "Contact Request");
    const message = cleanText(req.body.message);

    if (!name || !message) {
      return res.status(400).json({ message: "Name and message are required." });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit phone number." });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    res.status(201).json({
      message: "Thank you. Your message has been sent to the clinic team.",
      id: contactMessage._id.toString(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to submit contact message." });
  }
});

app.get("/api/contact", requireStaffAuth, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    res.json(
      messages.map((message) => ({
        id: message._id.toString(),
        name: message.name,
        email: message.email || "",
        phone: message.phone || "",
        subject: message.subject || "",
        message: message.message,
        isRead: Boolean(message.isRead),
        createdAt: message.createdAt,
      }))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load contact messages." });
  }
});

app.post("/api/feedback", publicFormRateLimiter, async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const comment = cleanText(req.body.comment);
    const stars = Number(req.body.stars || 0);

    if (!name || !comment || !stars) {
      return res.status(400).json({ message: "Name, comment, and stars are required." });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Star rating must be between 1 and 5." });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const feedback = await Feedback.create({
      name,
      email,
      comment,
      stars,
    });

    res.status(201).json({
      message: "Thank you. Your feedback was submitted for admin approval.",
      feedback: serializeFeedback(feedback),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to submit feedback." });
  }
});

app.patch("/api/feedback/:id/approve", requireAdminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    const isApproved = Boolean(req.body.isApproved);
    feedback.isApproved = isApproved;
    feedback.approvedAt = isApproved ? new Date() : null;
    await feedback.save();

    res.json(serializeFeedback(feedback));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update feedback status." });
  }
});

app.delete("/api/feedback/:id", requireAdminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    await feedback.deleteOne();
    res.json({ message: "Feedback deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete feedback." });
  }
});

app.get("/api/job-requirements", requireAdminAuth, async (req, res) => {
  try {
    const requirements = await JobRequirement.find().sort({ updatedAt: -1, createdAt: -1 });
    res.json(requirements.map(serializeJobRequirement));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load job requirements." });
  }
});

app.get("/api/public-job-requirements", async (req, res) => {
  try {
    const requirements = await JobRequirement.find({
      isPublished: true,
      status: "Active",
    }).sort({
      updatedAt: -1,
      createdAt: -1,
    });
    res.json(requirements.map(serializeJobRequirement));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load public job requirements." });
  }
});

app.post("/api/job-requirements", requireAdminAuth, async (req, res) => {
  try {
    const title = cleanText(req.body.title);
    const openings = Number(req.body.openings || 1);

    if (!title) {
      return res.status(400).json({ message: "Job title is required." });
    }

    if (!Number.isFinite(openings) || openings < 1) {
      return res.status(400).json({ message: "Openings must be at least 1." });
    }

    const requirement = await JobRequirement.create({
      title,
      department: String(req.body.department || "").trim(),
      employmentType: String(req.body.employmentType || "").trim(),
      experience: String(req.body.experience || "").trim(),
      location: String(req.body.location || "").trim(),
      openings,
      summary: String(req.body.summary || "").trim(),
      responsibilities: parseLineList(req.body.responsibilities),
      requirements: parseLineList(req.body.requirements),
      benefits: parseLineList(req.body.benefits),
      status: ["Active", "Completed", "Unpublished"].includes(String(req.body.status || ""))
        ? String(req.body.status)
        : "Active",
      isPublished:
        req.body.isPublished !== false &&
        String(req.body.status || "Active") !== "Unpublished",
    });

    res.status(201).json(serializeJobRequirement(requirement));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create job requirement." });
  }
});

app.put("/api/job-requirements/:id", requireAdminAuth, async (req, res) => {
  try {
    const requirement = await JobRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({ message: "Job requirement not found." });
    }

    const title = cleanText(req.body.title);
    const openings = Number(req.body.openings || 1);

    if (!title) {
      return res.status(400).json({ message: "Job title is required." });
    }

    if (!Number.isFinite(openings) || openings < 1) {
      return res.status(400).json({ message: "Openings must be at least 1." });
    }

    requirement.title = title;
    requirement.department = String(req.body.department || "").trim();
    requirement.employmentType = String(req.body.employmentType || "").trim();
    requirement.experience = String(req.body.experience || "").trim();
    requirement.location = String(req.body.location || "").trim();
    requirement.openings = openings;
    requirement.summary = String(req.body.summary || "").trim();
    requirement.responsibilities = parseLineList(req.body.responsibilities);
    requirement.requirements = parseLineList(req.body.requirements);
    requirement.benefits = parseLineList(req.body.benefits);
    requirement.status = ["Active", "Completed", "Unpublished"].includes(
      String(req.body.status || "")
    )
      ? String(req.body.status)
      : "Active";
    requirement.isPublished =
      req.body.isPublished !== false && requirement.status !== "Unpublished";

    await requirement.save();
    res.json(serializeJobRequirement(requirement));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update job requirement." });
  }
});

app.delete("/api/job-requirements/:id", requireAdminAuth, async (req, res) => {
  try {
    const requirement = await JobRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({ message: "Job requirement not found." });
    }

    await requirement.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete job requirement." });
  }
});

app.post("/api/services", requireStaffAuth, async (req, res) => {
  try {
    const name = cleanText(req.body.name);

    if (!name) {
      return res.status(400).json({ message: "Service name is required." });
    }

    if (name.length < 2) {
      return res.status(400).json({ message: "Service name must be at least 2 characters." });
    }

    const service = await Service.create({ name });
    res.status(201).json(serializeService(service));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create service." });
  }
});

app.put("/api/services/:id", requireStaffAuth, async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Service name must be at least 2 characters." });
    }

    service.name = name;
    await service.save();

    res.json(serializeService(service));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update service." });
  }
});

app.delete("/api/services/:id", requireStaffAuth, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    res.json({ message: "Service deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete service." });
  }
});

app.get("/api/users", requireStaffAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(serializeUser));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load staff." });
  }
});

app.get("/api/users/:id", requireStaffAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    res.json(serializeUser(user));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load staff member." });
  }
});

app.get("/api/public-chat-agents", async (req, res) => {
  try {
    const users = await User.find({
      status: "Active",
    }).sort({ role: 1, updatedAt: -1 });

    const availableUsers = users.filter(isUserOnlineForChat);

    res.json(
      availableUsers.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        workType: user.workType || user.role,
        profileImageUrl: user.profileImageData
          ? `/users/${user._id.toString()}/profile-image`
          : "",
        chatUrl: user.mobile
          ? `https://wa.me/${String(user.mobile).replace(/\D/g, "")}`
          : "",
      }))
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load online chat staff." });
  }
});

app.post("/api/public-chat/conversations", publicChatRateLimiter, upload.array("attachments", 5), async (req, res) => {
  try {
    const agentId = String(req.body.agentId || "").trim();
    const visitorName = String(req.body.visitorName || "").trim();
    const visitorContact = String(req.body.visitorContact || "").trim();
    const text = String(req.body.text || "").trim();
    const attachments = mapChatAttachments(req.files);

    if (!agentId || !visitorName || (!text && !attachments.length)) {
      return res.status(400).json({
        message: "Agent, visitor name, and a message or attachment are required.",
      });
    }

    const assignedUser = await User.findById(agentId);

    if (!assignedUser || !isUserOnlineForChat(assignedUser)) {
      return res.status(400).json({ message: "Selected staff is not available for chat." });
    }

    const conversation = await ChatConversation.create({
      visitorName,
      visitorContact,
      assignedTo: assignedUser._id,
      messages: [
        {
          senderType: "visitor",
          senderName: visitorName,
          text,
          attachments,
        },
      ],
      unreadForAgent: true,
      unreadForVisitor: false,
    });

    res.status(201).json(serializeChatConversation(conversation, new Map([[assignedUser._id.toString(), assignedUser]])));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to start chat conversation." });
  }
});

app.get("/api/public-chat/conversations/:id", async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id).populate("assignedTo");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (!isUserOnlineForChat(conversation.assignedTo)) {
      return res.status(410).json({ message: "Assigned staff is offline right now." });
    }

    if (conversation.unreadForVisitor) {
      conversation.unreadForVisitor = false;
      await conversation.save();
    }

    res.json(serializeChatConversation(conversation));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load conversation." });
  }
});

app.post("/api/public-chat/conversations/:id/messages", publicChatRateLimiter, upload.array("attachments", 5), async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id).populate("assignedTo");
    const visitorName = String(req.body.visitorName || "").trim();
    const text = String(req.body.text || "").trim();
    const attachments = mapChatAttachments(req.files);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (!isUserOnlineForChat(conversation.assignedTo)) {
      return res.status(410).json({ message: "Assigned staff is offline right now." });
    }

    if (!visitorName || (!text && !attachments.length)) {
      return res.status(400).json({
        message: "Visitor name and a message or attachment are required.",
      });
    }

    conversation.visitorName = visitorName;
    conversation.messages.push({
      senderType: "visitor",
      senderName: visitorName,
      text,
      attachments,
    });
    conversation.unreadForAgent = true;
    conversation.unreadForVisitor = false;
    await conversation.save();

    res.status(201).json(serializeChatConversation(conversation));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to send message." });
  }
});

app.get("/api/public-chat/conversations/:id/messages/:messageId/attachments/:attachmentId", async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const message = conversation.messages.id(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    const attachment = message.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found." });
    }

    res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.name || "attachment")}"`,
    );
    res.send(attachment.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to download chat attachment." });
  }
});

app.get("/api/chat/conversations", requireStaffAuth, async (req, res) => {
  try {
    const agentId = String(req.auth?.sub || "").trim();

    if (!agentId) {
      return res.status(400).json({ message: "Agent ID is required." });
    }

    const conversations = await ChatConversation.find({ assignedTo: agentId })
      .populate("assignedTo")
      .sort({ updatedAt: -1 });

    res.json(conversations.map((conversation) => serializeChatConversation(conversation)));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load chat conversations." });
  }
});

app.post("/api/chat/conversations/:id/messages", requireStaffAuth, upload.array("attachments", 5), async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id).populate("assignedTo");
    const senderUserId = String(req.auth?.sub || "").trim();
    const text = String(req.body.text || "").trim();
    const attachments = mapChatAttachments(req.files);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (!senderUserId || (!text && !attachments.length)) {
      return res.status(400).json({ message: "Sender and a message or attachment are required." });
    }

    if (conversation.assignedTo?._id?.toString() !== senderUserId) {
      return res.status(403).json({ message: "This chat is not assigned to the current user." });
    }

    conversation.messages.push({
      senderType: "agent",
      senderName: conversation.assignedTo.name,
      text,
      attachments,
    });
    conversation.unreadForAgent = false;
    conversation.unreadForVisitor = true;
    await conversation.save();

    res.status(201).json(serializeChatConversation(conversation));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to send reply." });
  }
});

app.patch("/api/chat/conversations/:id/read", requireStaffAuth, async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id).populate("assignedTo");
    const agentId = String(req.auth?.sub || "").trim();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (agentId && conversation.assignedTo?._id?.toString() !== agentId) {
      return res.status(403).json({ message: "This chat is not assigned to the current user." });
    }

    conversation.unreadForAgent = false;
    await conversation.save();

    res.json(serializeChatConversation(conversation));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to mark chat as read." });
  }
});

app.delete("/api/chat/conversations/:id", requireAdminAuth, async (req, res) => {
  try {
    const requesterUserId = String(req.auth?.sub || "").trim();

    if (!requesterUserId) {
      return res.status(400).json({ message: "Requester user ID is required." });
    }

    const requester = await User.findById(requesterUserId);

    if (!requester || requester.role !== "Admin") {
      return res.status(403).json({ message: "Only admin can delete chat conversations." });
    }

    const conversation = await ChatConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    await conversation.deleteOne();
    res.json({ message: "Conversation deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete conversation." });
  }
});

app.get("/api/users/:id/profile-image", requireStaffAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.profileImageData) {
      return res.status(404).json({ message: "Profile image not found." });
    }

    res.setHeader("Content-Type", user.profileImageMimeType || "image/jpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(user.profileImageData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load profile image." });
  }
});

app.get("/api/users/:id/joining-documents/:documentId", requireStaffAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    const document = user.joiningDocuments.id(req.params.documentId);

    if (!document) {
      return res.status(404).json({ message: "Joining document not found." });
    }

    res.setHeader("Content-Type", document.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(document.name)}"`
    );
    res.send(document.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to download joining document." });
  }
});

app.post("/api/users", requireAdminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      role,
      status,
      chatEnabled,
      workType,
      permissions,
      joiningDate,
      joiningNotes,
      password,
    } = req.body;

    const cleanName = cleanText(name);
    const cleanUserEmail = cleanEmail(email);
    const cleanUserMobile = cleanPhone(mobile);
    const cleanPassword = cleanText(password);

    if (!cleanName || !cleanUserEmail || !cleanUserMobile) {
      return res.status(400).json({ message: "Name, email, and mobile are required." });
    }

    if (!isValidEmail(cleanUserEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isValidPhone(cleanUserMobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number." });
    }

    if (cleanPassword && cleanPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: cleanUserEmail }, { mobile: cleanUserMobile }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A staff member with this email or mobile number already exists.",
      });
    }

    const resolvedRole = role || "Staff";
    const user = await User.create({
      name: cleanName,
      email: cleanUserEmail,
      password: "",
      passwordHash: cleanPassword ? hashPassword(cleanPassword) : "",
      mobile: cleanUserMobile,
      role: resolvedRole,
      status: status || "Active",
      chatEnabled: Boolean(chatEnabled),
      workType: String(workType || "").trim(),
      joiningDate: joiningDate || "",
      joiningNotes: joiningNotes || "",
      permissions: normalizePermissions(permissions, resolvedRole),
    });
    res.status(201).json(serializeUser(user));
  } catch (error) {
    console.log(error);
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A staff member with this email already exists.",
      });
    }
    res.status(500).json({ message: "Failed to create staff member." });
  }
});

app.put("/api/users/:id", requireAdminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      role,
      status,
      chatEnabled,
      workType,
      permissions,
      joiningDate,
      joiningNotes,
      password,
    } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    const cleanName = name !== undefined ? cleanText(name) : undefined;
    const cleanUserEmail = email !== undefined ? cleanEmail(email) : undefined;
    const cleanUserMobile = mobile !== undefined ? cleanPhone(mobile) : undefined;
    const cleanPassword = password !== undefined ? cleanText(password) : undefined;

    if (cleanName !== undefined && !cleanName) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (cleanUserEmail !== undefined && !isValidEmail(cleanUserEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (cleanUserMobile !== undefined && !isValidPhone(cleanUserMobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number." });
    }

    if (cleanPassword !== undefined && cleanPassword && cleanPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    user.name = cleanName ?? user.name;
    user.email = cleanUserEmail ?? user.email;
    user.mobile = cleanUserMobile ?? user.mobile;
    user.role = role ?? user.role;
    user.status = status ?? user.status;
    if (chatEnabled !== undefined) {
      user.chatEnabled = Boolean(chatEnabled);
    }
    user.workType = workType !== undefined ? String(workType || "").trim() : user.workType;
    user.joiningDate = joiningDate ?? user.joiningDate;
    user.joiningNotes = joiningNotes ?? user.joiningNotes;
    if (password !== undefined) {
      user.password = "";
      user.passwordHash = cleanPassword ? hashPassword(cleanPassword) : user.passwordHash;
    }
    user.permissions =
      permissions !== undefined
        ? normalizePermissions(permissions, user.role)
        : normalizePermissions(user.permissions, user.role);
    await user.save();

    res.json(serializeUser(user));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update staff member." });
  }
});

app.post("/api/users/:id/joining-documents", requireAdminAuth, upload.array("documents", 10), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    if (!(req.files || []).length) {
      return res.status(400).json({ message: "Please upload at least one document." });
    }

    user.joiningDocuments.push(
      ...(req.files || []).map((file) => ({
        name: file.originalname,
        mimeType: file.mimetype,
        data: file.buffer,
      }))
    );

    await user.save();
    res.status(201).json(serializeUser(user));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload joining documents." });
  }
});

app.post("/api/users/:id/profile-image", requireAdminAuth, upload.single("image"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image." });
    }

    user.profileImageData = req.file.buffer;
    user.profileImageMimeType = req.file.mimetype || "image/jpeg";
    user.profileImageUpdatedAt = new Date();

    await user.save();
    res.status(201).json(serializeUser(user));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload profile image." });
  }
});

app.delete("/api/users/:id/joining-documents/:documentId", requireAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    user.joiningDocuments = user.joiningDocuments.filter(
      (document) => document._id.toString() !== req.params.documentId
    );

    await user.save();
    res.json(serializeUser(user));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete joining document." });
  }
});

app.delete("/api/users/:id", requireAdminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    if (user.role === "Admin") {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "At least one admin must remain." });
      }
    }

    await user.deleteOne();
    res.json({ message: "Staff member deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete staff member." });
  }
});

app.get("/api/admin/profile", requireAdminAuth, async (req, res) => {
  try {
    const admin = await ensureDefaultAdmin();
    res.json(serializeUser(admin));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load admin profile." });
  }
});

app.put("/api/admin/profile/:id", requireAdminAuth, async (req, res) => {
  try {
    const { name, email, mobile, chatEnabled, workType } = req.body;
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const cleanName = name !== undefined ? cleanText(name) : undefined;
    const cleanAdminEmail = email !== undefined ? cleanEmail(email) : undefined;
    const cleanAdminMobile = mobile !== undefined ? cleanPhone(mobile) : undefined;

    if (cleanName !== undefined && !cleanName) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (cleanAdminEmail !== undefined && !isValidEmail(cleanAdminEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (cleanAdminMobile !== undefined && !isValidPhone(cleanAdminMobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number." });
    }

    admin.name = cleanName ?? admin.name;
    admin.email = cleanAdminEmail ?? admin.email;
    admin.mobile = cleanAdminMobile ?? admin.mobile;
    admin.chatEnabled = chatEnabled !== undefined ? Boolean(chatEnabled) : admin.chatEnabled;
    admin.workType = workType !== undefined ? String(workType || "").trim() : admin.workType;
    admin.role = "Admin";
    await admin.save();

    res.json(serializeUser(admin));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update admin profile." });
  }
});

app.get("/api/staff-applications", requireStaffAuth, async (req, res) => {
  try {
    const applications = await StaffApplication.find().sort({ createdAt: -1 });
    res.json(applications.map((application) => serializeMailboxItem("career", application)));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load staff applications." });
  }
});

app.use((error, _req, res, next) => {
  if (!error) {
    return next();
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message || "File upload failed." });
  }

  if (error.message === "Unsupported file type.") {
    return res.status(400).json({ message: "Unsupported file type." });
  }

  if (error.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({ message: "Origin is not allowed." });
  }

  console.log(error);
  return res.status(500).json({ message: "Something went wrong." });
});

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
