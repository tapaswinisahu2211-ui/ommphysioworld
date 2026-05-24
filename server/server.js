const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

const {
  authenticateRequest,
  requireAdminAuth,
  requireAuthenticatedSession,
  requirePatientAuth,
  requirePatientOrStaffAuth,
  requirePatientRecordAccess,
  requireStaffAuth,
  requireStaffPermission,
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
const FinanceEntry = require("./models/FinanceEntry");
const JobRequirement = require("./models/JobRequirement");
const MarketingSource = require("./models/MarketingSource");
const PatientNotification = require("./models/PatientNotification");
const Patient = require("./models/Patient");
const PayrollPayment = require("./models/PayrollPayment");
const PromotionBanner = require("./models/PromotionBanner");
const PublicUser = require("./models/PublicUser");
const Service = require("./models/Service");
const ShopOrder = require("./models/ShopOrder");
const ShopProduct = require("./models/ShopProduct");
const StaffApplication = require("./models/StaffApplication");
const TherapyResource = require("./models/TherapyResource");
const User = require("./models/User");
const shopUpload = require("./middleware/shopUpload");
const therapyUpload = require("./middleware/therapyUpload");
const upload = require("./middleware/upload");
const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const {
  normalizePermissions,
  serializeUser,
  ensureDefaultAdmin,
} = require("./utils/userHelpers");
const {
  getPushStatus,
  sendDuePatientPushNotifications,
  sendPatientPushNotification,
} = require("./services/pushNotifications");
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

const APPOINTMENT_LOCATION_NOTE =
  "First-time patients and every post-session review must visit the clinic. Home service is available only after OPW confirms it is suitable.";

const normalizeServiceLocation = (value) => {
  const normalized = cleanText(value).toLowerCase();
  return normalized === "home" ? "home" : "clinic";
};

const formatServiceLocation = (value) =>
  normalizeServiceLocation(value) === "home" ? "At home" : "At clinic";

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
      serviceLocation: normalizeServiceLocation(appointment.serviceLocation),
      serviceLocationLabel: formatServiceLocation(appointment.serviceLocation),
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
  therapyRecommendations: (patient.therapyRecommendations || []).map((entry) => ({
    id: entry._id.toString(),
    serviceId: entry.serviceId ? entry.serviceId.toString() : "",
    serviceName: entry.serviceName || "",
    note: entry.note || "",
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    items: (entry.items || []).map((item) => ({
      id: item._id.toString(),
      resourceId: item.resourceId ? item.resourceId.toString() : "",
      title: item.title || "",
      description: item.description || "",
      fileName: item.fileName || "",
      mimeType: item.mimeType || "application/octet-stream",
      resourceType: item.resourceType || getTherapyResourceType(item.mimeType || ""),
      sizeBytes: Number(item.sizeBytes || 0),
      fileUrl: `/patients/${patient._id.toString()}/therapy-recommendations/${entry._id.toString()}/items/${item._id.toString()}/file`,
      downloadUrl: `/patients/${patient._id.toString()}/therapy-recommendations/${entry._id.toString()}/items/${item._id.toString()}/download`,
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
  isArchived: Boolean(patient.archivedAt),
  archivedAt: patient.archivedAt || null,
  archivedByUserId: patient.archivedByUserId ? patient.archivedByUserId.toString() : "",
  archivedByRole: patient.archivedByRole || "",
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

const getArchivedPatients = () =>
  Patient.find({ archivedAt: { $ne: null } })
    .setOptions({ includeArchived: true })
    .sort({ archivedAt: -1, updatedAt: -1 });

const findArchivedPatientById = (id) =>
  Patient.findOne({ _id: id, archivedAt: { $ne: null } }).setOptions({
    includeArchived: true,
  });

const DEFAULT_ADMIN_CREATED_PATIENT_PASSWORD = "123456";

const getPatientIdentityConflict = async ({ email, mobile, excludePatientId = null }) => {
  const identityFilters = [];

  if (email) {
    identityFilters.push({ email });
  }

  if (mobile) {
    identityFilters.push({ mobile });
  }

  if (!identityFilters.length) {
    return null;
  }

  const patientFilter = { $or: identityFilters };
  if (excludePatientId) {
    patientFilter._id = { $ne: excludePatientId };
  }

  const existingPatient = await Patient.findOne(patientFilter).setOptions({
    includeArchived: true,
  });

  if (existingPatient) {
    const field = existingPatient.mobile === mobile ? "mobile number" : "email address";
    return {
      field,
      message: `A patient with this ${field} already exists.`,
    };
  }

  const portalUserFilter = { $or: identityFilters };
  if (excludePatientId) {
    portalUserFilter.patientId = { $ne: excludePatientId };
  }

  const existingPortalUser = await PublicUser.findOne(portalUserFilter);

  if (existingPortalUser) {
    const field = existingPortalUser.mobile === mobile ? "mobile number" : "email address";
    return {
      field,
      message: `A patient login account with this ${field} already exists.`,
    };
  }

  return null;
};

const syncAdminCreatedPatientPortalAccount = async (patient) => {
  const existingUser = await PublicUser.findOne({ email: patient.email });

  if (existingUser) {
    existingUser.name = patient.name;
    existingUser.email = patient.email;
    existingUser.mobile = patient.mobile;
    existingUser.createdFrom = "admin";
    existingUser.patientId = patient._id;
    existingUser.passwordHash = hashPassword(DEFAULT_ADMIN_CREATED_PATIENT_PASSWORD);
    await existingUser.save();
    return existingUser;
  }

  return PublicUser.create({
    name: patient.name,
    email: patient.email,
    mobile: patient.mobile,
    passwordHash: hashPassword(DEFAULT_ADMIN_CREATED_PATIENT_PASSWORD),
    createdFrom: "admin",
    patientId: patient._id,
  });
};

const deletePatientRelatedRecords = async (patient) => {
  const patientId = patient?._id || null;
  const email = String(patient?.email || "").trim().toLowerCase();
  const mobile = String(patient?.mobile || "").trim();
  const appointmentFilters = [];

  if (patientId) {
    appointmentFilters.push({ patientId });
  }

  if (email) {
    appointmentFilters.push({ email });
  }

  if (mobile) {
    appointmentFilters.push({ phone: mobile });
  }

  const [deletedPortalAccountsResult, deletedAppointmentsResult] = await Promise.all([
    PublicUser.deleteMany({
      $or: [{ patientId }, ...(email ? [{ email }] : [])],
    }),
    appointmentFilters.length
      ? Appointment.deleteMany({ $or: appointmentFilters })
      : Promise.resolve({ deletedCount: 0 }),
  ]);

  return {
    deletedPortalAccounts: Number(deletedPortalAccountsResult?.deletedCount || 0),
    deletedAppointmentRequests: Number(deletedAppointmentsResult?.deletedCount || 0),
  };
};

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

const getDateRangeFromQuery = (query = {}) => {
  const todayKey = getTodayKey();
  const requestedFrom = String(query.from || "").slice(0, 10);
  const requestedTo = String(query.to || "").slice(0, 10);
  const fromKey = requestedFrom || `${todayKey.slice(0, 7)}-01`;
  const toKey = requestedTo || todayKey;
  const fromDate = parseDateKey(fromKey);
  const toDate = parseDateKey(toKey);

  if (!fromDate || !toDate) {
    const error = new Error("Please provide a valid from and to date.");
    error.statusCode = 400;
    throw error;
  }

  if (fromDate > toDate) {
    const error = new Error("From date cannot be after to date.");
    error.statusCode = 400;
    throw error;
  }

  return { todayKey, fromKey, toKey, fromDate, toDate };
};

const collectPatientPaymentIncome = (patients = [], fromKey, toKey) => {
  const isInRange = (dateKey) => Boolean(dateKey) && dateKey >= fromKey && dateKey <= toKey;
  const payments = [];
  const paidPatients = new Set();

  patients.forEach((patient) => {
    const patientId = patient._id.toString();
    const patientName = patient.name || "Patient";
    const patientEmail = patient.email || "";
    const patientMobile = patient.mobile || "";

    (patient.treatmentPlans || []).forEach((plan) => {
      const treatmentTypes = (plan.treatmentTypes || []).join(", ") || "Treatment Session";

      (plan.payments || []).forEach((payment) => {
        const dateKey = payment.createdAt ? formatDateKey(new Date(payment.createdAt)) : "";
        if (!isInRange(dateKey)) {
          return;
        }

        paidPatients.add(patientId);
        payments.push({
          id: `${patientId}-${plan._id.toString()}-${payment._id.toString()}`,
          type: "income",
          source: "patient_payment",
          title: "Session Payment",
          category: "Patient Payment",
          patientId,
          patientName,
          patientEmail,
          patientMobile,
          date: dateKey,
          amount: Number(payment.amount || 0),
          method: payment.method || "",
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

      paidPatients.add(patientId);
      payments.push({
        id: `${patientId}-direct-${payment._id.toString()}`,
        type: "income",
        source: "patient_payment",
        title: "Direct Payment",
        category: "Patient Payment",
        patientId,
        patientName,
        patientEmail,
        patientMobile,
        date: dateKey,
        amount: Number(payment.amount || 0),
        method: payment.method || "",
        treatmentTypes: "",
        createdAt: payment.createdAt || null,
      });
    });
  });

  return { payments, paidPatients };
};

const serializeFinanceEntry = (entry) => ({
  id: entry._id.toString(),
  type: entry.type,
  source: entry.source || "manual",
  title: entry.title,
  category: entry.category || "",
  amount: Number(entry.amount || 0),
  date: entry.date,
  method: entry.method || "",
  notes: entry.notes || "",
  staffId: entry.staffId?._id ? entry.staffId._id.toString() : entry.staffId ? entry.staffId.toString() : "",
  staffName: entry.staffId?.name || "",
  patientId: entry.patientId ? entry.patientId.toString() : "",
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

const getPayrollMonthKey = (value) => {
  const month = cleanText(value).slice(0, 7);
  const [, monthNumber] = month.split("-").map(Number);
  return /^\d{4}-\d{2}$/.test(month) && monthNumber >= 1 && monthNumber <= 12
    ? month
    : getTodayKey().slice(0, 7);
};

const formatPayrollMonthLabel = (month) => {
  const parsed = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return month;
  }

  return parsed.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
};

const cleanMoneyAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const serializePayrollPayment = (payment) => ({
  id: payment._id.toString(),
  staffId: payment.staffId?._id ? payment.staffId._id.toString() : payment.staffId ? payment.staffId.toString() : "",
  staffName: payment.staffId?.name || payment.staffNameSnapshot || "",
  staffEmail: payment.staffId?.email || "",
  staffMobile: payment.staffId?.mobile || "",
  staffWorkType: payment.staffId?.workType || "",
  staffStatus: payment.staffId?.status || payment.staffStatusSnapshot || "",
  staffNameSnapshot: payment.staffNameSnapshot || "",
  staffRoleSnapshot: payment.staffRoleSnapshot || "",
  staffStatusSnapshot: payment.staffStatusSnapshot || "",
  month: payment.month,
  baseSalary: Number(payment.baseSalary || 0),
  bonus: Number(payment.bonus || 0),
  commission: Number(payment.commission || 0),
  totalAmount: Number(payment.totalAmount || 0),
  paidDate: payment.paidDate || "",
  method: payment.method || "",
  notes: payment.notes || "",
  financeEntryId: payment.financeEntryId ? payment.financeEntryId.toString() : "",
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const buildPayrollFinancePayload = (payment) => ({
  type: "expense",
  source: "payroll",
  title: `Payroll - ${payment.staffNameSnapshot} - ${formatPayrollMonthLabel(payment.month)}`,
  category: "Payroll",
  amount: Number(payment.totalAmount || 0),
  date: payment.paidDate || getTodayKey(),
  method: payment.method || "",
  notes: [
    `Base salary: Rs. ${Number(payment.baseSalary || 0).toLocaleString("en-IN")}`,
    `Bonus: Rs. ${Number(payment.bonus || 0).toLocaleString("en-IN")}`,
    `Commission: Rs. ${Number(payment.commission || 0).toLocaleString("en-IN")}`,
    payment.notes || "",
  ]
    .filter(Boolean)
    .join(" | "),
  staffId: payment.staffId || null,
  patientId: null,
  createdBy: payment.createdBy || null,
});

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

const CLINIC_TIMEZONE_OFFSET = process.env.CLINIC_TIMEZONE_OFFSET || "+05:30";
const NOTIFICATION_HISTORY_RETENTION_DAYS = Math.max(
  Number(process.env.NOTIFICATION_HISTORY_RETENTION_DAYS) || 15,
  1
);

const getNotificationHistoryCutoff = () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NOTIFICATION_HISTORY_RETENTION_DAYS);
  return cutoff;
};

const cleanupOldPatientNotifications = () =>
  PatientNotification.deleteMany({
    scheduledFor: { $lt: getNotificationHistoryCutoff() },
  });

const getNotificationReadCounts = async () => {
  const [total, read] = await Promise.all([
    PatientNotification.countDocuments(),
    PatientNotification.countDocuments({ readAt: { $ne: null } }),
  ]);

  return {
    total,
    read,
    unread: Math.max(total - read, 0),
  };
};

const serializePatientNotification = (notification, patient = null) => ({
  id: notification._id.toString(),
  patientId: patient?._id
    ? patient._id.toString()
    : notification.patientId?._id
    ? notification.patientId._id.toString()
    : notification.patientId
    ? notification.patientId.toString()
    : "",
  patientName:
    patient?.name ||
    notification.patientId?.name ||
    notification.metadata?.patientName ||
    "",
  category: notification.category || "general",
  title: notification.title || "",
  body: notification.body || "",
  entityType: notification.entityType || "",
  entityId: notification.entityId || "",
  actionUrl: notification.actionUrl || "",
  scheduledFor: notification.scheduledFor || null,
  pushedAt: notification.pushedAt || null,
  pushStatus: notification.pushStatus || "pending",
  readAt: notification.readAt || null,
  createdByLabel: notification.createdByLabel || "OPW",
  metadata: notification.metadata || {},
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const parseNullableDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseBooleanFlag = (value, defaultValue = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const serializePromotionBanner = (banner) => ({
  id: banner._id.toString(),
  badge: banner.badge || "OPW Update",
  title: banner.title || "",
  message: banner.message || "",
  actionLabel: banner.actionLabel || "",
  actionUrl: banner.actionUrl || "",
  imageUrl: banner.imageData
    ? `/public-promotion/${banner._id.toString()}/image?v=${banner.imageUpdatedAt?.getTime?.() || banner.updatedAt?.getTime?.() || Date.now()}`
    : "",
  isActive: Boolean(banner.isActive),
  startsAt: banner.startsAt || null,
  endsAt: banner.endsAt || null,
  createdAt: banner.createdAt,
  updatedAt: banner.updatedAt,
});

const buildPromotionPayload = (body = {}) => {
  const title = cleanText(body.title).slice(0, 90);
  const message = cleanText(body.message || body.body).slice(0, 700);
  const badge = cleanText(body.badge || "OPW Update").slice(0, 40);
  const actionLabel = cleanText(body.actionLabel).slice(0, 40);
  const actionUrl = cleanText(body.actionUrl).slice(0, 500);
  const startsAt = parseNullableDate(body.startsAt);
  const endsAt = parseNullableDate(body.endsAt);

  if (!title || !message) {
    return { error: "Banner title and message are required." };
  }

  if (startsAt === undefined || endsAt === undefined) {
    return { error: "Please choose valid banner dates." };
  }

  if (startsAt && endsAt && endsAt < startsAt) {
    return { error: "Banner end date must be after start date." };
  }

  return {
    payload: {
      badge,
      title,
      message,
      actionLabel,
      actionUrl,
      startsAt,
      endsAt,
      isActive: parseBooleanFlag(body.isActive, true),
    },
  };
};

const activePromotionFilter = () => {
  const now = new Date();

  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
};

const clinicDateTime = (dateKey, timeValue = "09:00") => {
  const date = String(dateKey || "").slice(0, 10);
  if (!date) {
    return null;
  }

  const normalizedTime =
    String(timeValue || "")
      .trim()
      .match(/^\d{1,2}:\d{2}/)?.[0] || "09:00";
  const [hour, minute] = normalizedTime.split(":").map(Number);
  const safeHour = Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 9;
  const safeMinute = Number.isFinite(minute) ? Math.min(Math.max(minute, 0), 59) : 0;
  const parsed = new Date(
    `${date}T${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}:00${CLINIC_TIMEZONE_OFFSET}`
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDaysToClinicDate = (dateKey, days, timeValue = "09:00") => {
  const base = clinicDateTime(dateKey, timeValue);
  if (!base) {
    return null;
  }

  const next = new Date(base);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

const pushPatientNotificationIfDue = async (notification) => {
  if (!notification) {
    return notification;
  }

  const scheduledFor = new Date(notification.scheduledFor || Date.now());
  if (!Number.isNaN(scheduledFor.getTime()) && scheduledFor > new Date()) {
    return notification;
  }

  try {
    const result = await sendPatientPushNotification(notification.patientId, notification);
    if (["firebase-not-configured", "no-token"].includes(result.skipped)) {
      notification.pushStatus = result.skipped;
      await notification.save();
      return notification;
    }

    notification.pushedAt = new Date();
    notification.pushStatus = getPushStatus(result);
    await notification.save();
  } catch (error) {
    console.log("Failed to push patient notification:", error.message);
  }

  return notification;
};

const createPatientNotification = async ({
  patientId,
  patient,
  category,
  title,
  body,
  uniqueKey,
  entityType = "",
  entityId = "",
  actionUrl = "",
  scheduledFor = new Date(),
  createdByUserId = null,
  createdByLabel = "OPW",
  metadata = {},
}) => {
  const resolvedPatientId = patientId || patient?._id;

  if (!resolvedPatientId || !title || !body || !uniqueKey) {
    return null;
  }

  const payload = {
    patientId: resolvedPatientId,
    category,
    title,
    body,
    uniqueKey,
    entityType,
    entityId,
    actionUrl,
    scheduledFor: scheduledFor || new Date(),
    createdByUserId,
    createdByLabel,
    metadata: {
      ...metadata,
      patientName: metadata.patientName || patient?.name || "",
    },
  };

  try {
    const notification = await PatientNotification.create(payload);
    return pushPatientNotificationIfDue(notification);
  } catch (error) {
    if (error?.code === 11000) {
      return PatientNotification.findOne({ uniqueKey });
    }

    throw error;
  }
};

const createNotificationForAppointment = async (appointment, statusLabel = "") => {
  const patient = await resolveAppointmentPatient(appointment);
  if (!patient) {
    return null;
  }

  const status = String(appointment.status || "").toLowerCase();
  const service = appointment.service || "Appointment";
  const serviceLocation = normalizeServiceLocation(appointment.serviceLocation);
  const serviceLocationLabel = formatServiceLocation(serviceLocation);
  const confirmedDate =
    status === "rescheduled"
      ? appointment.rescheduledDate || appointment.approvedDate || appointment.date
      : appointment.approvedDate || appointment.rescheduledDate || appointment.date;
  const confirmedTime =
    status === "rescheduled"
      ? appointment.rescheduledTime || appointment.approvedTime || appointment.time
      : appointment.approvedTime || appointment.rescheduledTime || appointment.time;
  const label =
    statusLabel ||
    {
      approved: "approved",
      rescheduled: "rescheduled",
      completed: "completed",
      cancelled: "cancelled",
    }[status] ||
    "updated";
  const scheduleLine = confirmedDate
    ? `Schedule: ${confirmedDate}${confirmedTime ? ` at ${confirmedTime}` : ""}\nService location: ${serviceLocationLabel}`
    : "Please check your appointment details inside the app.";
  const noteLine = appointment.decisionNote
    ? `\nOPW note: ${appointment.decisionNote}`
    : "";
  const careLine = `\nNote: ${APPOINTMENT_LOCATION_NOTE}`;

  await createPatientNotification({
    patient,
    category: "appointment",
    title: `Your ${service} appointment is ${label}`,
    body: `${scheduleLine}${noteLine}${careLine}`,
    uniqueKey: `appointment:${appointment._id.toString()}:${status}:${appointment.decisionAt?.getTime?.() || Date.now()}`,
    entityType: "appointment",
    entityId: appointment._id.toString(),
    actionUrl: "appointments",
    metadata: { status, service, serviceLocation, confirmedDate, confirmedTime },
  });

  if (["approved", "rescheduled"].includes(status)) {
    await scheduleAppointmentReminders(appointment, patient);
  }

  return patient;
};

const scheduleAppointmentReminders = async (appointment, patient) => {
  const status = String(appointment.status || "").toLowerCase();
  if (!patient || !["approved", "rescheduled"].includes(status)) {
    return;
  }

  const date =
    status === "rescheduled"
      ? appointment.rescheduledDate || appointment.approvedDate || appointment.date
      : appointment.approvedDate || appointment.rescheduledDate || appointment.date;
  const time =
    status === "rescheduled"
      ? appointment.rescheduledTime || appointment.approvedTime || appointment.time
      : appointment.approvedTime || appointment.rescheduledTime || appointment.time;
  const appointmentAt = clinicDateTime(date, time || "09:00");

  if (!appointmentAt) {
    return;
  }

  const service = appointment.service || "appointment";
  const serviceLocation = normalizeServiceLocation(appointment.serviceLocation);
  const serviceLocationLabel = formatServiceLocation(serviceLocation);
  const reminders = [
    {
      key: "one-day",
      scheduledFor: new Date(appointmentAt.getTime() - 24 * 60 * 60 * 1000),
      title: "Appointment reminder for tomorrow",
      body: `Your ${service} appointment is tomorrow${time ? ` at ${time}` : ""}. Service location: ${serviceLocationLabel}.`,
    },
    {
      key: "same-day",
      scheduledFor: clinicDateTime(date, "08:00") || appointmentAt,
      title: "Appointment reminder for today",
      body: `Your ${service} appointment is today${time ? ` at ${time}` : ""}. Service location: ${serviceLocationLabel}.`,
    },
    {
      key: "before-hours",
      scheduledFor: new Date(appointmentAt.getTime() - 2 * 60 * 60 * 1000),
      title: "Appointment coming up soon",
      body: `Your ${service} appointment is coming up${time ? ` at ${time}` : ""}. Service location: ${serviceLocationLabel}.`,
    },
  ];
  const now = new Date();

  await Promise.all(
    reminders
      .filter((reminder) => reminder.scheduledFor >= now)
      .map((reminder) =>
        createPatientNotification({
          patient,
          category: "appointment_reminder",
          title: reminder.title,
          body: reminder.body,
          uniqueKey: `appointment-reminder:${appointment._id.toString()}:${date}:${time || ""}:${reminder.key}`,
          entityType: "appointment",
          entityId: appointment._id.toString(),
          actionUrl: "appointments",
          scheduledFor: reminder.scheduledFor,
          metadata: { service, serviceLocation, date, time, reminder: reminder.key },
        })
      )
  );
};

const scheduleTreatmentPlanNotifications = async (patient, plan) => {
  if (!patient || !plan) {
    return;
  }

  const planId = plan._id.toString();
  const treatmentLabel = (plan.treatmentTypes || []).join(", ") || "Treatment session";

  await createPatientNotification({
    patient,
    category: "session",
    title: "Treatment session started",
    body: `${treatmentLabel} has been started from ${plan.fromDate || "today"} to ${plan.toDate || "the planned end date"}.`,
    uniqueKey: `treatment-start:${patient._id.toString()}:${planId}:${plan.createdAt?.getTime?.() || plan.fromDate || Date.now()}`,
    entityType: "treatment_plan",
    entityId: planId,
    actionUrl: "sessions",
    metadata: { treatmentTypes: plan.treatmentTypes || [], fromDate: plan.fromDate, toDate: plan.toDate },
  });

  await Promise.all(
    (plan.sessionDays || []).map((day) =>
      createPatientNotification({
        patient,
        category: "session_reminder",
        title: "Treatment session today",
        body: `${treatmentLabel} is scheduled today. Please follow your OPW session plan.`,
        uniqueKey: `session-reminder:${patient._id.toString()}:${planId}:${day._id.toString()}:${day.date}`,
        entityType: "treatment_plan",
        entityId: planId,
        actionUrl: "sessions",
        scheduledFor: clinicDateTime(day.date, "08:00") || new Date(),
        metadata: { treatmentTypes: plan.treatmentTypes || [], date: day.date },
      })
    )
  );

  if (Number(plan.balanceAmount || 0) > 0 && plan.toDate) {
    await createPatientNotification({
      patient,
      category: "payment",
      title: "Treatment balance reminder",
      body: `Your pending balance is ₹${Number(plan.balanceAmount || 0).toLocaleString("en-IN")}. Please complete payment after your session.`,
      uniqueKey: `payment-balance-after-plan:${patient._id.toString()}:${planId}:${plan.toDate}:${Number(plan.balanceAmount || 0)}`,
      entityType: "treatment_plan",
      entityId: planId,
      actionUrl: "payments",
      scheduledFor: addDaysToClinicDate(plan.toDate, 1, "10:00") || new Date(),
      metadata: { balanceAmount: Number(plan.balanceAmount || 0), toDate: plan.toDate },
    });
  }

  if (plan.toDate) {
    await Promise.all(
      [
        { days: 7, label: "7 days" },
        { days: 15, label: "15 days" },
        { days: 30, label: "1 month" },
      ].map((followUp) =>
        createPatientNotification({
          patient,
          category: "follow_up",
          title: `OPW follow-up reminder after ${followUp.label}`,
          body: "It has been a little while since your treatment session ended. Please check in with OPW if you need review or support.",
          uniqueKey: `follow-up:${patient._id.toString()}:${planId}:${plan.toDate}:${followUp.days}`,
          entityType: "treatment_plan",
          entityId: planId,
          actionUrl: "appointments",
          scheduledFor: addDaysToClinicDate(plan.toDate, followUp.days, "09:00") || new Date(),
          metadata: { endedOn: plan.toDate, daysAfterEnd: followUp.days },
        })
      )
    );
  }
};

app.get("/", (req, res) => {
  res.send("Omm Physio World API is running.");
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
    message: "Omm Physio World API is running.",
    timestamp: new Date().toISOString(),
  });
});

const MARKETING_SOURCE_TYPES = [
  "medical_shop",
  "clinic",
  "institute",
  "hospital",
  "doctor",
  "other",
];

const MARKETING_SOURCE_TYPE_LABELS = {
  medical_shop: "Medical Shop",
  clinic: "Clinic",
  institute: "Institute",
  hospital: "Hospital",
  doctor: "Doctor",
  other: "Other",
};

const MARKETING_PITCH_STATUSES = [
  "new",
  "visited",
  "interested",
  "follow_up",
  "converted",
  "not_interested",
];

const MARKETING_PITCH_STATUS_LABELS = {
  new: "New Lead",
  visited: "Visited",
  interested: "Interested",
  follow_up: "Follow-up",
  converted: "Converted",
  not_interested: "Not Interested",
};

const normalizeMarketingSourceType = (value) => {
  const normalized = cleanText(value).toLowerCase();
  return MARKETING_SOURCE_TYPES.includes(normalized) ? normalized : "medical_shop";
};

const normalizeMarketingPitchStatus = (value) => {
  const normalized = cleanText(value).toLowerCase();
  return MARKETING_PITCH_STATUSES.includes(normalized) ? normalized : "new";
};

const parseMarketingNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const validateOptionalMarketingDate = (value, label) => {
  const date = cleanText(value);
  if (date && !isValidDateValue(date)) {
    return `${label} must be a valid date.`;
  }

  return "";
};

const parseMarketingSourcePayload = (body = {}) => {
  const mobile = cleanPhone(body.mobile);
  const alternateMobile = cleanPhone(body.alternateMobile);
  const email = cleanEmail(body.email);
  const visitDate = cleanText(body.visitDate);
  const nextFollowUpDate = cleanText(body.nextFollowUpDate);

  return {
    sourceType: normalizeMarketingSourceType(body.sourceType),
    name: cleanText(body.name),
    contactPerson: cleanText(body.contactPerson),
    doctorName: cleanText(body.doctorName),
    mobile,
    alternateMobile,
    email,
    area: cleanText(body.area),
    city: cleanText(body.city),
    address: cleanText(body.address),
    visitDate,
    nextFollowUpDate,
    assignedTo: cleanText(body.assignedTo || body.marketingPerson),
    pitchStatus: normalizeMarketingPitchStatus(body.pitchStatus || body.status),
    expectedDailyPatients: Math.max(
      0,
      parseMarketingNumber(body.expectedDailyPatients || body.dailyPatientGoal, 0)
    ),
    notes: cleanText(body.notes),
  };
};

const validateMarketingSourcePayload = (payload) => {
  if (!payload.name || payload.name.length < 2) {
    return "Place or source name must be at least 2 characters.";
  }

  if (payload.mobile && !isValidPhone(payload.mobile)) {
    return "Please enter a valid 10-digit primary mobile number.";
  }

  if (payload.alternateMobile && !isValidPhone(payload.alternateMobile)) {
    return "Please enter a valid 10-digit alternate mobile number.";
  }

  if (payload.email && !isValidEmail(payload.email)) {
    return "Please enter a valid email address.";
  }

  return (
    validateOptionalMarketingDate(payload.visitDate, "Visit date") ||
    validateOptionalMarketingDate(payload.nextFollowUpDate, "Next follow-up date")
  );
};

const parseMarketingPhotoRemovalIds = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  const rawValue = cleanText(value);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed.map(cleanText).filter(Boolean);
    }
  } catch (_) {
    // Fall back to comma-separated ids from simple forms.
  }

  return rawValue.split(",").map(cleanText).filter(Boolean);
};

const mapMarketingPhotos = (files = []) => {
  const invalidFile = (files || []).find(
    (file) => !String(file?.mimetype || "").startsWith("image/")
  );

  if (invalidFile) {
    const error = new Error("Only image files can be uploaded for marketing photos.");
    error.statusCode = 400;
    throw error;
  }

  return (files || []).map((file) => ({
    name: file.originalname || "marketing-photo",
    mimeType: file.mimetype || "image/jpeg",
    data: file.buffer,
    uploadedAt: new Date(),
  }));
};

const serializeMarketingReferral = (referral) => ({
  id: referral._id.toString(),
  date: referral.date || "",
  patientCount: Number(referral.patientCount || 0),
  patientNames: Array.isArray(referral.patientNames) ? referral.patientNames : [],
  notes: referral.notes || "",
  createdAt: referral.createdAt,
});

const serializeMarketingSource = (source) => {
  const referrals = (source.referrals || []).map(serializeMarketingReferral);
  const totalGeneratedPatients = referrals.reduce(
    (sum, referral) => sum + Number(referral.patientCount || 0),
    0
  );
  const latestReferral = [...referrals]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];

  return {
    id: source._id.toString(),
    sourceType: source.sourceType || "medical_shop",
    sourceTypeLabel:
      MARKETING_SOURCE_TYPE_LABELS[source.sourceType] || MARKETING_SOURCE_TYPE_LABELS.medical_shop,
    name: source.name || "",
    contactPerson: source.contactPerson || "",
    doctorName: source.doctorName || "",
    mobile: source.mobile || "",
    alternateMobile: source.alternateMobile || "",
    email: source.email || "",
    area: source.area || "",
    city: source.city || "",
    address: source.address || "",
    visitDate: source.visitDate || "",
    nextFollowUpDate: source.nextFollowUpDate || "",
    assignedTo: source.assignedTo || "",
    marketingPerson: source.assignedTo || "",
    pitchStatus: source.pitchStatus || "new",
    status: source.pitchStatus || "new",
    pitchStatusLabel:
      MARKETING_PITCH_STATUS_LABELS[source.pitchStatus] || MARKETING_PITCH_STATUS_LABELS.new,
    expectedDailyPatients: Number(source.expectedDailyPatients || 0),
    dailyPatientGoal: Number(source.expectedDailyPatients || 0),
    notes: source.notes || "",
    photos: (source.photos || []).map((photo) => ({
      id: photo._id.toString(),
      name: photo.name || "",
      mimeType: photo.mimeType || "image/jpeg",
      uploadedAt: photo.uploadedAt,
      url: `/marketing/sources/${source._id.toString()}/photos/${photo._id.toString()}`,
    })),
    referrals,
    totalGeneratedPatients,
    latestReferralAt: latestReferral?.date || latestReferral?.createdAt || null,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

const serializeService = (service) => ({
  id: service._id.toString(),
  name: service.name,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
});

const serializeShopProduct = (product) => ({
  id: product._id.toString(),
  name: product.name || "",
  category: product.category || "",
  description: product.description || "",
  price: Number(product.price || 0),
  stockQuantity: Number(product.stockQuantity || 0),
  isActive: Boolean(product.isActive),
  imageUrl: product.imageData
    ? `/shop/products/${product._id.toString()}/image`
    : "",
  imageUpdatedAt: product.imageUpdatedAt || null,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const serializeShopOrder = (order) => ({
  id: order._id.toString(),
  orderNumber: order.orderNumber || "",
  patientId: order.patientId ? order.patientId.toString() : "",
  publicUserId: order.publicUserId ? order.publicUserId.toString() : "",
  customerName: order.customerName || "",
  customerEmail: order.customerEmail || "",
  customerMobile: order.customerMobile || "",
  totalQuantity: Number(order.totalQuantity || 0),
  totalAmount: Number(order.totalAmount || 0),
  note: order.note || "",
  status: order.status || "pending",
  items: (order.items || []).map((item) => ({
    id: item._id.toString(),
    productId: item.productId ? item.productId.toString() : "",
    productName: item.productName || "",
    category: item.category || "",
    unitPrice: Number(item.unitPrice || 0),
    quantity: Number(item.quantity || 0),
    lineTotal: Number(item.lineTotal || 0),
  })),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const createShopOrderNumber = () =>
  `OPW-SHOP-${Date.now().toString().slice(-8)}${Math.floor(
    100 + Math.random() * 900
  )}`;

const getTherapyResourceType = (mimeType = "") => {
  if (mimeType === "image/gif") {
    return "gif";
  }

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "document";
};

const serializeTherapyResource = (resource) => {
  const service =
    resource.serviceId && typeof resource.serviceId === "object"
      ? resource.serviceId
      : null;
  const resourceId = resource._id.toString();

  return {
    id: resourceId,
    serviceId: service?._id?.toString() || String(resource.serviceId || ""),
    serviceName: service?.name || "",
    title: resource.title || "",
    description: resource.description || "",
    fileName: resource.fileName || "",
    mimeType: resource.mimeType || "application/octet-stream",
    resourceType: getTherapyResourceType(resource.mimeType || ""),
    sizeBytes: Number(resource.sizeBytes || 0),
    fileUrl: `/therapy-resources/${resourceId}/file`,
    downloadUrl: `/therapy-resources/${resourceId}/download`,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
};

const buildTherapyRecommendationItemSnapshot = (resource) => ({
  resourceId: resource._id,
  title: resource.title || "",
  description: resource.description || "",
  fileName: resource.fileName || "",
  mimeType: resource.mimeType || "application/octet-stream",
  resourceType: getTherapyResourceType(resource.mimeType || ""),
  sizeBytes: Number(resource.sizeBytes || 0),
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
    serviceLocation: entry.serviceLocation
      ? normalizeServiceLocation(entry.serviceLocation)
      : "",
    serviceLocationLabel: entry.serviceLocation
      ? formatServiceLocation(entry.serviceLocation)
      : "",
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
    serviceLocation: normalizeServiceLocation(appointment.serviceLocation),
    serviceLocationLabel: formatServiceLocation(appointment.serviceLocation),
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
    existingAppointment.serviceLocation =
      appointment.serviceLocation || existingAppointment.serviceLocation || "clinic";
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
      serviceLocation: appointment.serviceLocation || "clinic",
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
    await createNotificationForAppointment(appointment, "completed");
    updatedCount += 1;
  }

  return updatedCount;
};

app.get("/api/dashboard", requireStaffPermission("dashboard", "view"), async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const [patients, staff, appointmentRequests, shopOrders] = await Promise.all([
      Patient.find().sort({ updatedAt: -1 }),
      User.find().sort({ createdAt: -1 }),
      Appointment.find().sort({ createdAt: -1 }),
      ShopOrder.find().sort({ createdAt: -1 }),
    ]);
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthFormatter = new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "2-digit",
    });
    const createRecentMonthBuckets = (length = 6) =>
      Array.from({ length }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (length - 1 - index), 1);
        return {
          key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
          label: monthFormatter.format(date),
          value: 0,
        };
      });
    const createBucketMap = (buckets) => new Map(buckets.map((bucket) => [bucket.key, bucket]));
    const addValueToMonthBucket = (bucketMap, dateValue, amount = 1) => {
      const entryDate = dateValue ? new Date(dateValue) : null;
      if (!entryDate || Number.isNaN(entryDate.getTime())) {
        return;
      }

      const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.value += Number(amount || 0);
      }
    };
    const serviceDemandMap = new Map();
    const addServiceDemand = (rawLabel, amount = 1) => {
      const label = cleanText(rawLabel);
      if (!label) {
        return;
      }

      serviceDemandMap.set(label, (serviceDemandMap.get(label) || 0) + Number(amount || 0));
    };

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
    const revenueByMonth = createRecentMonthBuckets(6);
    const revenueBuckets = createBucketMap(revenueByMonth);
    const addRevenueToMonth = (payment) => {
      addValueToMonthBucket(revenueBuckets, payment.createdAt, payment.amount || 0);
    };

    patients.forEach((patient) => {
      (patient.payments || []).forEach(addRevenueToMonth);
      serializePatientAppointments(patient.appointments || []).forEach((appointment) => {
        addServiceDemand(appointment.service);
      });
      (patient.treatmentPlans || []).forEach((plan) => {
        (plan.payments || []).forEach(addRevenueToMonth);
        (plan.treatmentTypes || []).forEach((service) => addServiceDemand(service));
      });
    });

    appointmentRequests.forEach((appointment) => {
      addServiceDemand(appointment.service);
    });

    const patientSourceChart = [
      { label: "Website", value: patients.filter((patient) => patient.createdFrom === "website").length },
      {
        label: "Mobile App",
        value: patients.filter((patient) => patient.createdFrom === "mobile_app").length,
      },
      { label: "Admin", value: patients.filter((patient) => patient.createdFrom === "admin").length },
    ];
    const topServices = [...serviceDemandMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
    const patientGrowthByMonth = createRecentMonthBuckets(6);
    const patientGrowthBuckets = createBucketMap(patientGrowthByMonth);
    patients.forEach((patient) => {
      addValueToMonthBucket(patientGrowthBuckets, patient.createdAt, 1);
    });
    const shopOrderStatus = ["pending", "confirmed", "completed", "cancelled"].map((status) => ({
      label: status.replace(/^\w/, (letter) => letter.toUpperCase()),
      value: shopOrders.filter((order) => (order.status || "pending") === status).length,
    }));
    const shopRevenueByMonth = createRecentMonthBuckets(6);
    const shopRevenueBuckets = createBucketMap(shopRevenueByMonth);
    shopOrders.forEach((order) => {
      if ((order.status || "pending") === "cancelled") {
        return;
      }

      addValueToMonthBucket(shopRevenueBuckets, order.createdAt, order.totalAmount || 0);
    });
    const staffStatus = ["Active", "Inactive"].map((status) => ({
      label: status,
      value: staff.filter((member) => (member.status || "Active") === status).length,
    }));

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
        patientSource: patientSourceChart,
        topServices,
        patientGrowthByMonth,
        shopOrderStatus,
        shopRevenueByMonth,
        staffStatus,
      },
      todaysSchedule,
      upcomingSchedule,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load dashboard data." });
  }
});

app.get("/api/reports", requireStaffPermission("reports", "view"), async (req, res) => {
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

app.get("/api/finance", requireStaffPermission("finance", "view"), async (req, res) => {
  try {
    const { fromKey, toKey } = getDateRangeFromQuery(req.query);
    const [patients, entries] = await Promise.all([
      Patient.find().sort({ name: 1 }),
      FinanceEntry.find({ date: { $gte: fromKey, $lte: toKey } })
        .populate("staffId", "name mobile role status")
        .sort({ date: -1, createdAt: -1 }),
    ]);

    const { payments: patientIncome, paidPatients } = collectPatientPaymentIncome(
      patients,
      fromKey,
      toKey
    );
    const manualEntries = entries.map(serializeFinanceEntry);
    const manualIncome = manualEntries.filter((entry) => entry.type === "income");
    const expenses = manualEntries.filter((entry) => entry.type === "expense");
    const manualIncomeAmount = manualIncome.reduce((sum, entry) => sum + entry.amount, 0);
    const patientIncomeAmount = patientIncome.reduce((sum, entry) => sum + entry.amount, 0);
    const expenseAmount = expenses.reduce((sum, entry) => sum + entry.amount, 0);
    const totalIncome = patientIncomeAmount + manualIncomeAmount;
    const totalExpense = expenseAmount;

    res.json({
      range: { from: fromKey, to: toKey },
      summary: {
        patientIncome: patientIncomeAmount,
        manualIncome: manualIncomeAmount,
        totalIncome,
        manualExpense: expenseAmount,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        paidPatientCount: paidPatients.size,
      },
      patientIncome,
      manualIncome,
      expenses,
    });
  } catch (error) {
    console.log(error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to load finance data." });
  }
});

app.post("/api/finance/entries", requireStaffPermission("finance", "add"), async (req, res) => {
  try {
    const type = cleanText(req.body.type).toLowerCase();
    const title = cleanText(req.body.title);
    const category = cleanText(req.body.category);
    const amount = Number(req.body.amount || 0);
    const date = cleanText(req.body.date).slice(0, 10) || getTodayKey();

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Entry type must be income or expense." });
    }

    if (!title || title.length < 2) {
      return res.status(400).json({ message: "Please enter a title." });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount." });
    }

    if (!parseDateKey(date)) {
      return res.status(400).json({ message: "Please enter a valid date." });
    }

    const entry = await FinanceEntry.create({
      type,
      source: "manual",
      title,
      category,
      amount,
      date,
      method: cleanText(req.body.method),
      notes: cleanText(req.body.notes),
      staffId: req.body.staffId || null,
      patientId: req.body.patientId || null,
      createdBy: req.auth?.type === "staff" ? req.auth.sub : null,
    });

    await entry.populate("staffId", "name mobile role status");
    res.status(201).json(serializeFinanceEntry(entry));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to save finance entry." });
  }
});

app.put("/api/finance/entries/:id", requireStaffPermission("finance", "edit"), async (req, res) => {
  try {
    const entry = await FinanceEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Finance entry not found." });
    }

    if (entry.source === "payroll") {
      return res.status(400).json({ message: "Payroll expenses must be managed from the Payroll module." });
    }

    const type = cleanText(req.body.type).toLowerCase();
    const title = cleanText(req.body.title);
    const amount = Number(req.body.amount || 0);
    const date = cleanText(req.body.date).slice(0, 10) || entry.date;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Entry type must be income or expense." });
    }

    if (!title || title.length < 2) {
      return res.status(400).json({ message: "Please enter a title." });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount." });
    }

    if (!parseDateKey(date)) {
      return res.status(400).json({ message: "Please enter a valid date." });
    }

    entry.type = type;
    entry.source = "manual";
    entry.title = title;
    entry.category = cleanText(req.body.category);
    entry.amount = amount;
    entry.date = date;
    entry.method = cleanText(req.body.method);
    entry.notes = cleanText(req.body.notes);
    entry.staffId = req.body.staffId || null;
    entry.patientId = req.body.patientId || null;
    await entry.save();
    await entry.populate("staffId", "name mobile role status");

    res.json(serializeFinanceEntry(entry));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update finance entry." });
  }
});

app.delete("/api/finance/entries/:id", requireStaffPermission("finance", "edit"), async (req, res) => {
  try {
    const entry = await FinanceEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Finance entry not found." });
    }

    if (entry.source === "payroll") {
      return res.status(400).json({ message: "Payroll expenses must be managed from the Payroll module." });
    }

    await entry.deleteOne();

    res.json({ message: "Finance entry deleted." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete finance entry." });
  }
});

app.get("/api/payroll", requireStaffPermission("payroll", "view"), async (req, res) => {
  try {
    const month = getPayrollMonthKey(req.query.month);
    const [staff, payments] = await Promise.all([
      User.find({ role: { $ne: "Admin" } }).sort({ status: 1, name: 1 }),
      PayrollPayment.find({ month })
        .populate("staffId", "name email mobile workType status role")
        .sort({ paidDate: -1, createdAt: -1 }),
    ]);

    const paidStaffIds = new Set(
      payments.map((payment) =>
        payment.staffId?._id ? payment.staffId._id.toString() : String(payment.staffId || "")
      )
    );
    const staffOptions = staff.map((item) => {
      const serialized = serializeUser(item);
      return {
        ...serialized,
        alreadyPaid: paidStaffIds.has(serialized.id),
      };
    });
    const serializedPayments = payments.map(serializePayrollPayment);
    const summary = serializedPayments.reduce(
      (totals, payment) => ({
        baseSalary: totals.baseSalary + payment.baseSalary,
        bonus: totals.bonus + payment.bonus,
        commission: totals.commission + payment.commission,
        totalAmount: totals.totalAmount + payment.totalAmount,
      }),
      { baseSalary: 0, bonus: 0, commission: 0, totalAmount: 0 }
    );

    res.json({
      month,
      monthLabel: formatPayrollMonthLabel(month),
      summary: {
        ...summary,
        paymentCount: serializedPayments.length,
      },
      staff: staffOptions,
      payments: serializedPayments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load payroll." });
  }
});

app.post("/api/payroll/payments", requireStaffPermission("payroll", "add"), async (req, res) => {
  try {
    const staffId = cleanText(req.body.staffId);
    const month = getPayrollMonthKey(req.body.month);
    const paidDate = cleanText(req.body.paidDate).slice(0, 10) || getTodayKey();

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Please select a valid staff member." });
    }

    if (!parseDateKey(paidDate)) {
      return res.status(400).json({ message: "Please select a valid paid date." });
    }

    const staff = await User.findById(staffId);
    if (!staff || staff.role === "Admin") {
      return res.status(404).json({ message: "Staff member not found." });
    }

    const existing = await PayrollPayment.findOne({ staffId, month });
    if (existing) {
      return res.status(409).json({ message: "Payroll for this staff and month already exists. Please edit the existing payment." });
    }

    const baseSalary = cleanMoneyAmount(staff.monthlySalary);
    const bonus = cleanMoneyAmount(req.body.bonus);
    const commission = cleanMoneyAmount(req.body.commission);
    const totalAmount = baseSalary + bonus + commission;

    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Please set staff salary, bonus, or commission before saving payroll." });
    }

    const payment = await PayrollPayment.create({
      staffId: staff._id,
      staffNameSnapshot: staff.name,
      staffRoleSnapshot: staff.role,
      staffStatusSnapshot: staff.status || "Active",
      month,
      baseSalary,
      bonus,
      commission,
      totalAmount,
      paidDate,
      method: cleanText(req.body.method),
      notes: cleanText(req.body.notes),
      createdBy: req.auth?.type === "staff" ? req.auth.sub : null,
    });

    const financeEntry = await FinanceEntry.create(buildPayrollFinancePayload(payment));
    payment.financeEntryId = financeEntry._id;
    await payment.save();
    await payment.populate("staffId", "name email mobile workType status role");

    res.status(201).json(serializePayrollPayment(payment));
  } catch (error) {
    console.log(error);
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Payroll for this staff and month already exists." });
    }
    res.status(500).json({ message: "Failed to save payroll payment." });
  }
});

app.put("/api/payroll/payments/:id", requireStaffPermission("payroll", "edit"), async (req, res) => {
  try {
    const payment = await PayrollPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payroll payment not found." });
    }

    const paidDate = cleanText(req.body.paidDate).slice(0, 10) || payment.paidDate || getTodayKey();
    if (!parseDateKey(paidDate)) {
      return res.status(400).json({ message: "Please select a valid paid date." });
    }

    payment.bonus = cleanMoneyAmount(req.body.bonus);
    payment.commission = cleanMoneyAmount(req.body.commission);
    payment.totalAmount = Number(payment.baseSalary || 0) + payment.bonus + payment.commission;
    payment.paidDate = paidDate;
    payment.method = cleanText(req.body.method);
    payment.notes = cleanText(req.body.notes);
    await payment.save();

    const financePayload = buildPayrollFinancePayload(payment);
    let financeEntry = payment.financeEntryId
      ? await FinanceEntry.findById(payment.financeEntryId)
      : null;

    if (financeEntry) {
      Object.assign(financeEntry, financePayload);
      await financeEntry.save();
    } else {
      financeEntry = await FinanceEntry.create(financePayload);
      payment.financeEntryId = financeEntry._id;
      await payment.save();
    }

    await payment.populate("staffId", "name email mobile workType status role");
    res.json(serializePayrollPayment(payment));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update payroll payment." });
  }
});

app.delete("/api/payroll/payments/:id", requireStaffPermission("payroll", "edit"), async (req, res) => {
  try {
    const payment = await PayrollPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payroll payment not found." });
    }

    if (payment.financeEntryId) {
      await FinanceEntry.findByIdAndDelete(payment.financeEntryId);
    }
    await payment.deleteOne();

    res.json({ message: "Payroll payment deleted." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete payroll payment." });
  }
});

app.get("/api/treatment-tracker", requireStaffPermission("treatment_tracker", "view"), async (req, res) => {
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

app.get("/api/appointments", requireStaffPermission("appointments", "view"), async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments.map(serializeAppointmentRequest));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load appointment requests." });
  }
});

app.patch("/api/appointments/:id/approve", requireStaffPermission("appointments", "edit"), async (req, res) => {
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
    await createNotificationForAppointment(appointment, "approved");

    res.json(serializeAppointmentRequest(appointment));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to approve appointment." });
  }
});

app.patch("/api/appointments/:id/reschedule", requireStaffPermission("appointments", "edit"), async (req, res) => {
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
    await createNotificationForAppointment(appointment, "rescheduled");

    res.json(serializeAppointmentRequest(appointment));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to reschedule appointment." });
  }
});

app.patch("/api/appointments/:id/status", requireStaffPermission("appointments", "edit"), async (req, res) => {
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
    await createNotificationForAppointment(appointment, status === "completed" ? "completed" : "cancelled");

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

app.post("/api/patients/:id/device-tokens", requirePatientRecordAccess, async (req, res) => {
  try {
    if (req.auth?.type !== "patient") {
      return res.status(403).json({ message: "Patient authentication is required." });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const token = String(req.body.token || "").trim();
    const platform = cleanText(req.body.platform || "android").toLowerCase() || "android";
    const deviceId = cleanText(req.body.deviceId || "");

    if (!token || token.length < 20) {
      return res.status(400).json({ message: "A valid device token is required." });
    }

    const publicUser = await PublicUser.findById(req.auth.sub);
    if (!publicUser || String(publicUser.patientId || "") !== patient._id.toString()) {
      return res.status(403).json({ message: "You do not have access to this patient record." });
    }

    const now = new Date();
    const existingToken = (publicUser.fcmTokens || []).find((entry) => entry.token === token);
    const retainedTokens = (publicUser.fcmTokens || [])
      .filter((entry) => entry.token !== token)
      .slice(-9);

    publicUser.fcmTokens = [
      ...retainedTokens,
      {
        token,
        platform,
        deviceId,
        createdAt: existingToken?.createdAt || now,
        lastSeenAt: now,
      },
    ];
    await publicUser.save();

    res.status(201).json({
      message: "Device token registered.",
      registered: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to register device token." });
  }
});

app.get("/api/patients/:id/notifications", requirePatientRecordAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const notifications = await PatientNotification.find({
      patientId: patient._id,
      scheduledFor: { $lte: new Date() },
    })
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(200);

    res.json(notifications.map((notification) => serializePatientNotification(notification, patient)));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load notifications." });
  }
});

app.patch("/api/patients/:id/notifications/:notificationId/read", requirePatientRecordAccess, async (req, res) => {
  try {
    const notification = await PatientNotification.findOne({
      _id: req.params.notificationId,
      patientId: req.params.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    notification.readAt = notification.readAt || new Date();
    await notification.save();

    res.json(serializePatientNotification(notification));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to mark notification as read." });
  }
});

app.patch("/api/patients/:id/notifications/read-all", requirePatientRecordAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    await PatientNotification.updateMany(
      {
        patientId: patient._id,
        scheduledFor: { $lte: new Date() },
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    const notifications = await PatientNotification.find({
      patientId: patient._id,
      scheduledFor: { $lte: new Date() },
    })
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(200);

    res.json(notifications.map((notification) => serializePatientNotification(notification, patient)));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to mark notifications as read." });
  }
});

app.get("/api/public-promotion", async (_req, res) => {
  try {
    const banner = await PromotionBanner.findOne(activePromotionFilter()).sort({
      updatedAt: -1,
      createdAt: -1,
    });

    res.json({ data: banner ? serializePromotionBanner(banner) : null });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load promotion banner." });
  }
});

app.get("/api/public-promotion/:id/image", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid banner id." });
    }

    const banner = await PromotionBanner.findById(req.params.id).select(
      "imageData imageMimeType imageUpdatedAt updatedAt"
    );

    if (!banner?.imageData) {
      return res.status(404).json({ message: "Promotion image not found." });
    }

    res.setHeader("Content-Type", banner.imageMimeType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(banner.imageData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load promotion image." });
  }
});

app.get("/api/promotions/admin", requireStaffPermission("notifications", "view"), async (_req, res) => {
  try {
    const banners = await PromotionBanner.find()
      .sort({ isActive: -1, updatedAt: -1, createdAt: -1 })
      .limit(100);

    res.json(banners.map(serializePromotionBanner));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load promotion banners." });
  }
});

app.post("/api/promotions/admin", requireStaffPermission("notifications", "add"), upload.single("image"), async (req, res) => {
  try {
    const { payload, error } = buildPromotionPayload(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (payload.isActive) {
      await PromotionBanner.updateMany({ isActive: true }, { $set: { isActive: false } });
    }

    const bannerPayload = {
      ...payload,
      createdByUserId: req.staffUser?._id || req.auth?.sub || null,
    };

    if (req.file) {
      if (!req.file.mimetype?.startsWith("image/")) {
        return res.status(400).json({ message: "Please upload a valid banner image." });
      }

      bannerPayload.imageData = req.file.buffer;
      bannerPayload.imageMimeType = req.file.mimetype || "image/jpeg";
      bannerPayload.imageUpdatedAt = new Date();
    }

    const banner = await PromotionBanner.create(bannerPayload);

    res.status(201).json({
      message: "Promotion banner saved.",
      data: serializePromotionBanner(banner),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to save promotion banner." });
  }
});

app.put("/api/promotions/admin/:id", requireStaffPermission("notifications", "edit"), upload.single("image"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid banner id." });
    }

    const { payload, error } = buildPromotionPayload(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (payload.isActive) {
      await PromotionBanner.updateMany(
        { _id: { $ne: req.params.id }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    if (req.file) {
      if (!req.file.mimetype?.startsWith("image/")) {
        return res.status(400).json({ message: "Please upload a valid banner image." });
      }

      payload.imageData = req.file.buffer;
      payload.imageMimeType = req.file.mimetype || "image/jpeg";
      payload.imageUpdatedAt = new Date();
    } else if (parseBooleanFlag(req.body.removeImage, false)) {
      payload.imageData = null;
      payload.imageMimeType = "";
      payload.imageUpdatedAt = null;
    }

    const banner = await PromotionBanner.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });

    if (!banner) {
      return res.status(404).json({ message: "Promotion banner not found." });
    }

    res.json({
      message: "Promotion banner updated.",
      data: serializePromotionBanner(banner),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update promotion banner." });
  }
});

app.delete("/api/promotions/admin/:id", requireStaffPermission("notifications", "edit"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid banner id." });
    }

    const banner = await PromotionBanner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Promotion banner not found." });
    }

    res.json({ message: "Promotion banner deleted." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete promotion banner." });
  }
});

app.get("/api/notifications/admin", requireStaffPermission("notifications", "view"), async (req, res) => {
  try {
    await cleanupOldPatientNotifications();

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 500, 1),
      2000
    );
    const notifications = await PatientNotification.find()
      .populate("patientId", "name email mobile")
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(limit);
    const counts = await getNotificationReadCounts();

    res.setHeader("X-Notification-Total", String(counts.total));
    res.setHeader("X-Notification-Read", String(counts.read));
    res.setHeader("X-Notification-Unread", String(counts.unread));
    res.json(
      notifications.map((notification) =>
        serializePatientNotification(notification, notification.patientId)
      )
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load notification history." });
  }
});

app.delete("/api/notifications/admin/:id", requireStaffPermission("notifications", "edit"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const notification = await PatientNotification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.json({ message: "Notification deleted.", deletedCount: 1 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete notification." });
  }
});

app.post("/api/notifications/admin/delete", requireStaffPermission("notifications", "edit"), async (req, res) => {
  try {
    const notificationIds = Array.isArray(req.body.notificationIds)
      ? req.body.notificationIds.map((id) => cleanText(id)).filter(Boolean)
      : [];
    const validIds = [...new Set(notificationIds)].filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (!validIds.length) {
      return res.status(400).json({ message: "Choose at least one notification to delete." });
    }

    const result = await PatientNotification.deleteMany({ _id: { $in: validIds } });

    res.json({
      message: `${result.deletedCount || 0} notification(s) deleted.`,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete notifications." });
  }
});

app.post("/api/notifications/custom", requireStaffPermission("notifications", "add"), async (req, res) => {
  try {
    const title = cleanText(req.body.title);
    const body = cleanText(req.body.body || req.body.message);
    const audience = cleanText(req.body.audience || "selected").toLowerCase();
    const patientIds = Array.isArray(req.body.patientIds)
      ? req.body.patientIds.map((id) => cleanText(id)).filter(Boolean)
      : [];
    const scheduledFor = req.body.scheduledFor
      ? new Date(req.body.scheduledFor)
      : new Date();

    if (!title || !body) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    if (Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ message: "Please select a valid schedule date." });
    }

    const patientFilter =
      audience === "all"
        ? {}
        : patientIds.length
        ? { _id: { $in: patientIds } }
        : null;

    if (!patientFilter) {
      return res.status(400).json({ message: "Please choose at least one patient." });
    }

    const patients = await Patient.find(patientFilter).sort({ name: 1 }).limit(1000);

    if (!patients.length) {
      return res.status(404).json({ message: "No patients found for this notification." });
    }

    const sender = req.auth?.sub ? await User.findById(req.auth.sub) : null;
    const batchId = `custom:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const created = await Promise.all(
      patients.map((patient) =>
        createPatientNotification({
          patient,
          category: "custom",
          title,
          body,
          uniqueKey: `${batchId}:${patient._id.toString()}`,
          entityType: "custom_notification",
          entityId: batchId,
          actionUrl: "notifications",
          scheduledFor,
          createdByUserId: sender?._id || null,
          createdByLabel: sender?.name || "OPW",
          metadata: { batchId, audience },
        })
      )
    );

    res.status(201).json({
      message: `Notification sent to ${created.filter(Boolean).length} patient(s).`,
      count: created.filter(Boolean).length,
      batchId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to send custom notification." });
  }
});

app.get("/api/mailbox", requireStaffPermission("mailbox", "view"), async (req, res) => {
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

app.patch("/api/mailbox/:type/:id/read", requireStaffPermission("mailbox", "edit"), async (req, res) => {
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

app.delete("/api/mailbox/:type/:id", requireStaffPermission("mailbox", "edit"), async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model =
      type === "career"
        ? StaffApplication
        : type === "contact"
        ? ContactMessage
        : null;

    if (!Model) {
      return res.status(400).json({ message: "Invalid mailbox item type." });
    }

    const item = await Model.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "Mailbox item not found." });
    }

    res.json({ message: "Mailbox item deleted." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete mailbox item." });
  }
});

app.get("/api/mailbox/:type/:id/attachment", requireStaffPermission("mailbox", "view"), async (req, res) => {
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

app.get("/api/patients", requireStaffPermission("patients", "view"), async (req, res) => {
  try {
    await autoCompleteOverdueAppointments();

    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients.map(serializePatient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load patients." });
  }
});

app.get("/api/patients/archive", requireStaffPermission("archived_patients", "view"), async (_req, res) => {
  try {
    const patients = await getArchivedPatients();
    res.json(patients.map(serializePatient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load archived patients." });
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

app.post("/api/patients", requireStaffPermission("patients", "add"), async (req, res) => {
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

    const existingPatient = await getPatientIdentityConflict({ email, mobile });

    if (existingPatient) {
      return res.status(409).json({
        message: existingPatient.message,
      });
    }

    const patient = await Patient.create({
      name,
      email,
      mobile,
      createdFrom: "admin",
      notes: "Created from Admin registration.",
    });

    await syncAdminCreatedPatientPortalAccount(patient);

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
      const identityConflict = await getPatientIdentityConflict({
        email: email ?? patient.email,
        mobile: mobile ?? patient.mobile,
        excludePatientId: patient._id,
      });

      if (identityConflict) {
        return res.status(409).json({ message: identityConflict.message });
      }
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
          email: patient.email,
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

app.delete("/api/patients/:id", requireStaffPermission("patients", "edit"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (patient.archivedAt) {
      return res.status(409).json({ message: "Patient is already archived." });
    }

    patient.archivedAt = new Date();
    patient.archivedByUserId =
      req.auth?.type === "staff" && req.auth?.sub ? req.auth.sub : null;
    patient.archivedByRole =
      req.auth?.type === "staff" && req.auth?.role ? req.auth.role : "";
    await patient.save();

    res.json({
      message: "Patient archived successfully.",
      patient: serializePatient(patient),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to archive patient." });
  }
});

app.patch("/api/patients/:id/restore", requireStaffPermission("archived_patients", "edit"), async (req, res) => {
  try {
    const patient = await findArchivedPatientById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Archived patient not found." });
    }

    const conflictingPatient = await Patient.findOne({
      _id: { $ne: patient._id },
      $or: [{ email: patient.email }, { mobile: patient.mobile }],
    });

    if (conflictingPatient) {
      return res.status(409).json({
        message:
          "Cannot restore this patient because another active patient already uses the same email or mobile number.",
      });
    }

    patient.archivedAt = null;
    patient.archivedByUserId = null;
    patient.archivedByRole = "";
    await patient.save();

    res.json({
      message: "Archived patient restored successfully.",
      patient: serializePatient(patient),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to restore archived patient." });
  }
});

app.delete("/api/patients/:id/permanent", requireStaffPermission("archived_patients", "edit"), async (req, res) => {
  try {
    const patient = await findArchivedPatientById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Archived patient not found." });
    }

    const deletedRecords = await deletePatientRelatedRecords(patient);
    await patient.deleteOne();

    res.json({
      message: "Archived patient and related data deleted permanently.",
      deletedRecords,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to permanently delete archived patient." });
  }
});

app.post("/api/patients/:id/treatment-plans", requireStaffPermission("treatment_plans", "add"), async (req, res) => {
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
    await scheduleTreatmentPlanNotifications(patient, patient.treatmentPlans[0]);
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to start treatment session." });
  }
});

app.patch("/api/patients/:id/treatment-plans/:planId/status", requireStaffPermission("treatment_plans", "edit"), async (req, res) => {
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
    if (nextStatus === "completed") {
      await createPatientNotification({
        patient,
        category: "feedback",
        title: "How was your treatment session?",
        body: "Your treatment session has ended. Please share feedback so OPW can keep improving your care experience.",
        uniqueKey: `treatment-feedback:${patient._id.toString()}:${plan._id.toString()}:${Date.now()}`,
        entityType: "treatment_plan",
        entityId: plan._id.toString(),
        actionUrl: "feedback",
        metadata: { treatmentTypes: plan.treatmentTypes || [], status: nextStatus },
      });
      await scheduleTreatmentPlanNotifications(patient, plan);
    }
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update treatment status." });
  }
});

app.put("/api/patients/:id/treatment-plans/:planId", requireStaffPermission("treatment_plans", "edit"), async (req, res) => {
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
    await scheduleTreatmentPlanNotifications(patient, plan);
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update treatment plan." });
  }
});

app.patch("/api/patients/:id/treatment-plans/:planId/session-days/:dayId", requireStaffPermission("treatment_plans", "edit"), async (req, res) => {
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
    if (nextStatus === "done") {
      await createPatientNotification({
        patient,
        category: "session",
        title: "Treatment session marked done",
        body: `${(plan.treatmentTypes || []).join(", ") || "Your session"} for ${sessionDay.date} has been marked done by OPW.`,
        uniqueKey: `session-done:${patient._id.toString()}:${plan._id.toString()}:${sessionDay._id.toString()}:${sessionDay.updatedAt.getTime()}`,
        entityType: "treatment_plan",
        entityId: plan._id.toString(),
        actionUrl: "sessions",
        metadata: { date: sessionDay.date, status: nextStatus },
      });
      if (Number(plan.balanceAmount || 0) > 0) {
        await createPatientNotification({
          patient,
          category: "payment",
          title: "Pending treatment balance",
          body: `Your current treatment balance is Rs. ${Number(plan.balanceAmount || 0).toLocaleString("en-IN")}. Please complete payment when convenient.`,
          uniqueKey: `session-balance:${patient._id.toString()}:${plan._id.toString()}:${sessionDay._id.toString()}:${Number(plan.balanceAmount || 0)}`,
          entityType: "treatment_plan",
          entityId: plan._id.toString(),
          actionUrl: "payments",
          metadata: { balanceAmount: Number(plan.balanceAmount || 0), date: sessionDay.date },
        });
      }
    }

    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update session day." });
  }
});

app.post("/api/patients/:id/treatment-plans/:planId/payments", requireStaffPermission("payments", "add"), async (req, res) => {
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
    const latestPayment = plan.payments[plan.payments.length - 1];
    if (Number(plan.balanceAmount || 0) > 0) {
      await createPatientNotification({
        patient,
        category: "payment",
        title: "Payment received, balance pending",
        body: `OPW received Rs. ${Number(amount || 0).toLocaleString("en-IN")}. Remaining balance: Rs. ${Number(plan.balanceAmount || 0).toLocaleString("en-IN")}.`,
        uniqueKey: `treatment-payment-balance:${patient._id.toString()}:${plan._id.toString()}:${latestPayment?._id?.toString() || Date.now()}`,
        entityType: "treatment_plan",
        entityId: plan._id.toString(),
        actionUrl: "payments",
        metadata: { amount, balanceAmount: Number(plan.balanceAmount || 0) },
      });
    } else {
      await createPatientNotification({
        patient,
        category: "payment",
        title: "Treatment payment completed",
        body: `OPW received Rs. ${Number(amount || 0).toLocaleString("en-IN")}. Your treatment balance is now clear.`,
        uniqueKey: `treatment-payment-clear:${patient._id.toString()}:${plan._id.toString()}:${latestPayment?._id?.toString() || Date.now()}`,
        entityType: "treatment_plan",
        entityId: plan._id.toString(),
        actionUrl: "payments",
        metadata: { amount, balanceAmount: Number(plan.balanceAmount || 0) },
      });
    }
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add treatment payment." });
  }
});

app.delete("/api/patients/:id/treatment-plans/:planId", requireStaffPermission("treatment_plans", "edit"), async (req, res) => {
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
    if (addedByType === "opw") {
      const createdNote = patient.clinicalNotes[0];
      await createPatientNotification({
        patient,
        category: "clinical_note",
        title: title || "New clinical note from OPW",
        body: note || "OPW added a clinical note to your recovery record.",
        uniqueKey: `clinical-note:${patient._id.toString()}:${createdNote?._id?.toString() || Date.now()}`,
        entityType: "clinical_note",
        entityId: createdNote?._id?.toString() || "",
        actionUrl: "therapy",
        metadata: { documentCount: (req.files || []).length },
      });
    }
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to save clinical note." });
  }
});

app.delete("/api/patients/:id/clinical-notes/:noteId", requireStaffPermission("clinical_notes", "edit"), async (req, res) => {
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

app.post("/api/patients/:id/therapy-recommendations", requireStaffPermission("therapy_recommendations", "add"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    const serviceId = cleanText(req.body.serviceId);
    const note = cleanText(req.body.note);
    const itemIds = Array.from(
      new Set(
        (Array.isArray(req.body.itemIds) ? req.body.itemIds : [req.body.itemIds])
          .map((value) => cleanText(value))
          .filter(Boolean)
      )
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (!serviceId) {
      return res.status(400).json({ message: "Please choose a service." });
    }

    if (!itemIds.length) {
      return res.status(400).json({ message: "Please choose at least one therapy item." });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    const resources = await TherapyResource.find({
      _id: { $in: itemIds },
      serviceId,
    });

    if (resources.length !== itemIds.length) {
      return res.status(400).json({
        message: "Some selected therapy items are invalid for this service.",
      });
    }

    const resourceMap = new Map(
      resources.map((resource) => [resource._id.toString(), resource])
    );
    const items = itemIds
      .map((itemId) => resourceMap.get(itemId))
      .filter(Boolean)
      .map(buildTherapyRecommendationItemSnapshot);

    const existingRecommendation = (patient.therapyRecommendations || []).find(
      (entry) => entry.serviceId?.toString() === service._id.toString()
    );

    if (existingRecommendation) {
      existingRecommendation.serviceName = service.name;
      existingRecommendation.note = note;
      existingRecommendation.items = items;
      existingRecommendation.updatedAt = new Date();
    } else {
      patient.therapyRecommendations.unshift({
        serviceId: service._id,
        serviceName: service.name,
        note,
        items,
        updatedAt: new Date(),
      });
    }

    await patient.save();
    const recommendation = (patient.therapyRecommendations || []).find(
      (entry) => entry.serviceId?.toString() === service._id.toString()
    );
    await createPatientNotification({
      patient,
      category: "therapy",
      title: `${service.name} therapy added`,
      body: note || `${items.length} therapy file(s) have been shared by OPW.`,
      uniqueKey: `therapy-recommendation:${patient._id.toString()}:${recommendation?._id?.toString() || service._id.toString()}:${recommendation?.updatedAt?.getTime?.() || Date.now()}`,
      entityType: "therapy_recommendation",
      entityId: recommendation?._id?.toString() || "",
      actionUrl: "therapy",
      metadata: { serviceName: service.name, itemCount: items.length },
    });
    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to save therapy recommendation." });
  }
});

app.delete("/api/patients/:id/therapy-recommendations/:recommendationId", requireStaffPermission("therapy_recommendations", "edit"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    patient.therapyRecommendations = (patient.therapyRecommendations || []).filter(
      (entry) => entry._id.toString() !== req.params.recommendationId
    );

    await patient.save();
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete therapy recommendation." });
  }
});

app.get("/api/patients/:id/therapy-recommendations/:recommendationId/items/:itemId/file", requirePatientRecordAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const recommendation = patient.therapyRecommendations.id(req.params.recommendationId);

    if (!recommendation) {
      return res.status(404).json({ message: "Therapy recommendation not found." });
    }

    const item = recommendation.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "Therapy item not found." });
    }

    const resource = await TherapyResource.findById(item.resourceId);

    if (!resource || !resource.data) {
      return res.status(404).json({ message: "Therapy file not found." });
    }

    res.setHeader("Content-Type", resource.mimeType || item.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(resource.fileName || item.fileName || "therapy-file")}"`
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(resource.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load therapy file." });
  }
});

app.get("/api/patients/:id/therapy-recommendations/:recommendationId/items/:itemId/download", requirePatientRecordAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const recommendation = patient.therapyRecommendations.id(req.params.recommendationId);

    if (!recommendation) {
      return res.status(404).json({ message: "Therapy recommendation not found." });
    }

    const item = recommendation.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "Therapy item not found." });
    }

    const resource = await TherapyResource.findById(item.resourceId);

    if (!resource || !resource.data) {
      return res.status(404).json({ message: "Therapy file not found." });
    }

    res.setHeader("Content-Type", resource.mimeType || item.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(resource.fileName || item.fileName || "therapy-file")}"`
    );
    res.send(resource.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to download therapy file." });
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

app.post("/api/patients/:id/appointments", requireStaffPermission("appointments", "add"), async (req, res) => {
  try {
    const date = cleanText(req.body.date);
    const time = cleanText(req.body.time);
    const service = cleanText(req.body.service);
    const serviceLocation = normalizeServiceLocation(
      req.body.serviceLocation || req.body.locationPreference || req.body.appointmentLocation
    );

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

    patient.appointments.push({ date, time: time || "", service, serviceLocation });
    await patient.save();
    const createdAppointment = patient.appointments[patient.appointments.length - 1];
    await createNotificationForAppointment(
      {
        _id: createdAppointment._id,
        patientId: patient._id,
        status: "approved",
        service,
        serviceLocation,
        date,
        time: time || "",
        approvedDate: date,
        approvedTime: time || "",
        decisionAt: new Date(),
      },
      "scheduled"
    );

    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add appointment." });
  }
});

app.delete("/api/patients/:id/appointments/:appointmentId", requireStaffPermission("appointments", "edit"), async (req, res) => {
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
        await createNotificationForAppointment(appointmentRequest, "cancelled");
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

app.patch("/api/patients/:id/appointments/:appointmentId", requireStaffPermission("appointments", "edit"), async (req, res) => {
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
    const serviceLocation = req.body.serviceLocation
      ? normalizeServiceLocation(req.body.serviceLocation)
      : normalizeServiceLocation(appointment.serviceLocation);

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

    appointment.serviceLocation = serviceLocation;
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
        appointmentRequest.serviceLocation = serviceLocation;

        await appointmentRequest.save();
      }
    }

    await patient.save();
    if (!appointment.requestId) {
      await createPatientNotification({
        patient,
        category: "appointment",
        title: `Your ${appointment.service || "appointment"} appointment is ${status}`,
        body: [
          status === "rescheduled"
            ? `New schedule: ${appointment.date}${appointment.time ? ` at ${appointment.time}` : ""}`
            : `Status: ${status}`,
          `Service location: ${formatServiceLocation(appointment.serviceLocation)}`,
          appointment.remark ? `OPW note: ${appointment.remark}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        uniqueKey: `patient-appointment:${patient._id.toString()}:${appointment._id.toString()}:${status}:${Date.now()}`,
        entityType: "appointment",
        entityId: appointment._id.toString(),
        actionUrl: "appointments",
        metadata: {
          status,
          date: appointment.date,
          time: appointment.time,
          serviceLocation: normalizeServiceLocation(appointment.serviceLocation),
        },
      });
      if (status === "rescheduled") {
        await scheduleAppointmentReminders(
          {
            _id: appointment._id,
            patientId: patient._id,
            status: "rescheduled",
            service: appointment.service,
            serviceLocation: appointment.serviceLocation,
            date: appointment.date,
            time: appointment.time,
            rescheduledDate: appointment.date,
            rescheduledTime: appointment.time,
          },
          patient
        );
      }
    }
    res.json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update appointment." });
  }
});

app.post("/api/patients/:id/payments", requireStaffPermission("payments", "add"), async (req, res) => {
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
    const latestPayment = patient.payments[patient.payments.length - 1];
    await createPatientNotification({
      patient,
      category: "payment",
      title: "Payment update added",
      body: `OPW recorded Rs. ${Number(amount || 0).toLocaleString("en-IN")} for your account.`,
      uniqueKey: `direct-payment:${patient._id.toString()}:${latestPayment?._id?.toString() || Date.now()}`,
      entityType: "payment",
      entityId: latestPayment?._id?.toString() || "",
      actionUrl: "payments",
      metadata: { amount, method },
    });

    res.status(201).json(serializePatient(patient));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add payment." });
  }
});

app.delete("/api/patients/:id/payments/:paymentId", requireStaffPermission("payments", "edit"), async (req, res) => {
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

app.get("/api/marketing/sources", requireStaffPermission("marketing", "view"), async (_req, res) => {
  try {
    const sources = await MarketingSource.find().sort({ updatedAt: -1, createdAt: -1 });
    res.json(sources.map(serializeMarketingSource));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load marketing sources." });
  }
});

app.get("/api/marketing/sources/:id", requireStaffPermission("marketing", "view"), async (req, res) => {
  try {
    const source = await MarketingSource.findById(req.params.id);

    if (!source) {
      return res.status(404).json({ message: "Marketing source not found." });
    }

    res.json(serializeMarketingSource(source));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load marketing source." });
  }
});

app.get("/api/marketing/sources/:id/photos/:photoId", requireStaffPermission("marketing", "view"), async (req, res) => {
  try {
    const source = await MarketingSource.findById(req.params.id);
    const photo = source?.photos?.id(req.params.photoId);

    if (!source || !photo) {
      return res.status(404).json({ message: "Marketing photo not found." });
    }

    res.setHeader("Content-Type", photo.mimeType || "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(photo.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load marketing photo." });
  }
});

app.post(
  "/api/marketing/sources",
  requireStaffPermission("marketing", "add"),
  upload.array("photos", 6),
  async (req, res) => {
    try {
      const payload = parseMarketingSourcePayload(req.body);
      const validationError = validateMarketingSourcePayload(payload);

      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const source = await MarketingSource.create({
        ...payload,
        photos: mapMarketingPhotos(req.files || []),
        createdByUserId: mongoose.isValidObjectId(req.auth?.sub) ? req.auth.sub : null,
        updatedByUserId: mongoose.isValidObjectId(req.auth?.sub) ? req.auth.sub : null,
      });

      res.status(201).json(serializeMarketingSource(source));
    } catch (error) {
      console.log(error);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "Failed to create marketing source.",
      });
    }
  }
);

app.put(
  "/api/marketing/sources/:id",
  requireStaffPermission("marketing", "edit"),
  upload.array("photos", 6),
  async (req, res) => {
    try {
      const source = await MarketingSource.findById(req.params.id);

      if (!source) {
        return res.status(404).json({ message: "Marketing source not found." });
      }

      const payload = parseMarketingSourcePayload(req.body);
      const validationError = validateMarketingSourcePayload(payload);

      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const removePhotoIds = new Set(parseMarketingPhotoRemovalIds(req.body.removePhotoIds));
      source.set(payload);

      if (removePhotoIds.size) {
        source.photos = (source.photos || []).filter(
          (photo) => !removePhotoIds.has(photo._id.toString())
        );
      }

      const newPhotos = mapMarketingPhotos(req.files || []);
      newPhotos.forEach((photo) => source.photos.push(photo));
      source.updatedByUserId = mongoose.isValidObjectId(req.auth?.sub) ? req.auth.sub : null;

      await source.save();
      res.json(serializeMarketingSource(source));
    } catch (error) {
      console.log(error);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "Failed to update marketing source.",
      });
    }
  }
);

app.post("/api/marketing/sources/:id/referrals", requireStaffPermission("marketing", "add"), async (req, res) => {
  try {
    const source = await MarketingSource.findById(req.params.id);

    if (!source) {
      return res.status(404).json({ message: "Marketing source not found." });
    }

    const date = cleanText(req.body.date) || new Date().toISOString().slice(0, 10);
    const patientCount = parseMarketingNumber(req.body.patientCount, 0);
    const patientNames = Array.isArray(req.body.patientNames)
      ? req.body.patientNames.map(cleanText).filter(Boolean)
      : parseLineList(req.body.patientNames);

    if (!isValidDateValue(date)) {
      return res.status(400).json({ message: "Referral date must be valid." });
    }

    if (!Number.isFinite(patientCount) || patientCount < 0) {
      return res.status(400).json({ message: "Patient count cannot be negative." });
    }

    source.referrals.push({
      date,
      patientCount,
      patientNames,
      notes: cleanText(req.body.notes),
      createdAt: new Date(),
    });
    source.updatedByUserId = mongoose.isValidObjectId(req.auth?.sub) ? req.auth.sub : null;

    await source.save();
    res.status(201).json(serializeMarketingSource(source));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add daily patient record." });
  }
});

app.delete(
  "/api/marketing/sources/:id/referrals/:referralId",
  requireStaffPermission("marketing", "edit"),
  async (req, res) => {
    try {
      const source = await MarketingSource.findById(req.params.id);

      if (!source) {
        return res.status(404).json({ message: "Marketing source not found." });
      }

      source.referrals = (source.referrals || []).filter(
        (referral) => referral._id.toString() !== req.params.referralId
      );
      source.updatedByUserId = mongoose.isValidObjectId(req.auth?.sub) ? req.auth.sub : null;

      await source.save();
      res.json(serializeMarketingSource(source));
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to delete daily patient record." });
    }
  }
);

app.delete("/api/marketing/sources/:id", requireStaffPermission("marketing", "edit"), async (req, res) => {
  try {
    const source = await MarketingSource.findByIdAndDelete(req.params.id);

    if (!source) {
      return res.status(404).json({ message: "Marketing source not found." });
    }

    res.json({ message: "Marketing source deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete marketing source." });
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

app.get("/api/shop/products", async (_req, res) => {
  try {
    const products = await ShopProduct.find({ isActive: true }).sort({
      updatedAt: -1,
      createdAt: -1,
    });
    res.json(products.map(serializeShopProduct));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load shop products." });
  }
});

app.get("/api/shop/products/:id/image", async (req, res) => {
  try {
    const product = await ShopProduct.findById(req.params.id);

    if (!product || !product.imageData) {
      return res.status(404).json({ message: "Product image not found." });
    }

    res.setHeader("Content-Type", product.imageMimeType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(product.imageData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load product image." });
  }
});

app.get("/api/shop/orders/my", requirePatientAuth, async (req, res) => {
  try {
    const patientId = String(req.auth?.patientId || "").trim();
    const publicUserId = String(req.auth?.sub || "").trim();
    const filters = [];

    if (patientId) {
      filters.push({ patientId });
    }

    if (publicUserId) {
      filters.push({ publicUserId });
    }

    const orders = filters.length
      ? await ShopOrder.find({ $or: filters }).sort({ createdAt: -1 })
      : [];

    res.json(orders.map(serializeShopOrder));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load your shop orders." });
  }
});

app.post("/api/shop/orders", requirePatientAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const note = cleanText(req.body.note);
    const publicUserId = String(req.auth?.sub || "").trim();
    const patientId = String(req.auth?.patientId || "").trim();

    if (!items.length) {
      return res.status(400).json({ message: "Add at least one product to continue." });
    }

    const publicUser = await PublicUser.findById(publicUserId);
    const patient = patientId ? await Patient.findById(patientId) : null;

    if (!publicUser || !patient) {
      return res.status(404).json({ message: "Patient account not found." });
    }

    const normalizedItems = Array.from(
      new Map(
        items
          .map((item) => {
            const productId = cleanText(item?.productId);
            const quantity = Math.max(1, Number(item?.quantity || 1));

            return productId ? [productId, { productId, quantity }] : null;
          })
          .filter(Boolean)
      ).values()
    );

    if (!normalizedItems.length) {
      return res.status(400).json({ message: "Please choose valid products." });
    }

    const products = await ShopProduct.find({
      _id: { $in: normalizedItems.map((item) => item.productId) },
      isActive: true,
    });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const orderItems = [];

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);

      if (!product) {
        return res.status(404).json({ message: "One or more products are no longer available." });
      }

      if (Number(product.stockQuantity || 0) < item.quantity) {
        return res.status(409).json({
          message: `Only ${product.stockQuantity || 0} item(s) left for ${product.name}.`,
        });
      }

      const unitPrice = Number(product.price || 0);
      const quantity = Number(item.quantity || 1);

      product.stockQuantity = Math.max(0, Number(product.stockQuantity || 0) - quantity);
      orderItems.push({
        productId: product._id,
        productName: product.name || "",
        category: product.category || "",
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
      });
    }

    const totalQuantity = orderItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + Number(item.lineTotal || 0),
      0
    );

    const order = await ShopOrder.create({
      orderNumber: createShopOrderNumber(),
      patientId: patient._id,
      publicUserId: publicUser._id,
      customerName: publicUser.name || patient.name || "Patient",
      customerEmail: publicUser.email || patient.email || "",
      customerMobile: publicUser.mobile || patient.mobile || "",
      items: orderItems,
      totalQuantity,
      totalAmount,
      note,
    });

    await Promise.all(products.map((product) => product.save()));

    res.status(201).json({
      message: "Order placed successfully.",
      order: serializeShopOrder(order),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to place shop order." });
  }
});

app.get("/api/therapy-resources", requireStaffPermission("therapy", "view"), async (req, res) => {
  try {
    const serviceId = cleanText(req.query.serviceId);
    const filters = {};

    if (serviceId) {
      filters.serviceId = serviceId;
    }

    const resources = await TherapyResource.find(filters)
      .populate("serviceId")
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json(resources.map(serializeTherapyResource));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load therapy resources." });
  }
});

app.get("/api/feedback", requireStaffPermission("feedback", "view"), async (req, res) => {
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

app.get("/api/contact", requireStaffPermission("mailbox", "view"), async (req, res) => {
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

app.patch("/api/feedback/:id/approve", requireStaffPermission("feedback", "edit"), async (req, res) => {
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

app.delete("/api/feedback/:id", requireStaffPermission("feedback", "edit"), async (req, res) => {
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

app.get("/api/job-requirements", requireStaffPermission("career", "view"), async (req, res) => {
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

app.post("/api/job-requirements", requireStaffPermission("career", "add"), async (req, res) => {
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

app.put("/api/job-requirements/:id", requireStaffPermission("career", "edit"), async (req, res) => {
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

app.delete("/api/job-requirements/:id", requireStaffPermission("career", "edit"), async (req, res) => {
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

app.post("/api/services", requireStaffPermission("services", "add"), async (req, res) => {
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

app.get("/api/admin/shop/products", requireStaffPermission("shop", "view"), async (_req, res) => {
  try {
    const products = await ShopProduct.find().sort({ updatedAt: -1, createdAt: -1 });
    res.json(products.map(serializeShopProduct));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load shop products." });
  }
});

app.get("/api/admin/shop/orders", requireStaffPermission("shop", "view"), async (_req, res) => {
  try {
    const orders = await ShopOrder.find().sort({ createdAt: -1 });
    res.json(orders.map(serializeShopOrder));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load shop orders." });
  }
});

app.post(
  "/api/admin/shop/products",
  requireStaffPermission("shop", "add"),
  shopUpload.single("image"),
  async (req, res) => {
    try {
      const name = cleanText(req.body.name);
      const category = cleanText(req.body.category);
      const description = cleanText(req.body.description);
      const price = Number(req.body.price || 0);
      const stockQuantity = Math.max(0, Number(req.body.stockQuantity || 0));
      const isActive =
        req.body.isActive === undefined
          ? true
          : !["false", "0"].includes(String(req.body.isActive).trim().toLowerCase());

      if (!name || name.length < 2) {
        return res.status(400).json({ message: "Product name must be at least 2 characters." });
      }

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ message: "Product price must be greater than zero." });
      }

      const product = await ShopProduct.create({
        name,
        category,
        description,
        price,
        stockQuantity,
        isActive,
        imageName: req.file?.originalname || "",
        imageMimeType: req.file?.mimetype || "",
        imageData: req.file?.buffer || null,
        imageUpdatedAt: req.file ? new Date() : null,
      });

      res.status(201).json(serializeShopProduct(product));
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to create shop product." });
    }
  }
);

app.post("/api/therapy-resources", requireStaffPermission("therapy", "add"), therapyUpload.single("file"), async (req, res) => {
  try {
    const serviceId = cleanText(req.body.serviceId);
    const title = cleanText(req.body.title);
    const description = cleanText(req.body.description);
    const createdByUserId = cleanText(req.auth?.sub);

    if (!serviceId) {
      return res.status(400).json({ message: "Please choose a service." });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file." });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    const resource = await TherapyResource.create({
      serviceId: service._id,
      title,
      description,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      sizeBytes: req.file.size || 0,
      data: req.file.buffer,
      createdByUserId: createdByUserId || null,
    });

    const populatedResource = await TherapyResource.findById(resource._id).populate("serviceId");
    res.status(201).json(serializeTherapyResource(populatedResource));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create therapy resource." });
  }
});

app.put("/api/services/:id", requireStaffPermission("services", "edit"), async (req, res) => {
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

app.put(
  "/api/admin/shop/products/:id",
  requireStaffPermission("shop", "edit"),
  shopUpload.single("image"),
  async (req, res) => {
    try {
      const product = await ShopProduct.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Shop product not found." });
      }

      const name = cleanText(req.body.name);
      const category = cleanText(req.body.category);
      const description = cleanText(req.body.description);
      const price = Number(req.body.price || 0);
      const stockQuantity = Math.max(0, Number(req.body.stockQuantity || 0));
      const removeImage = ["true", "1"].includes(
        String(req.body.removeImage || "").trim().toLowerCase()
      );

      if (!name || name.length < 2) {
        return res.status(400).json({ message: "Product name must be at least 2 characters." });
      }

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ message: "Product price must be greater than zero." });
      }

      product.name = name;
      product.category = category;
      product.description = description;
      product.price = price;
      product.stockQuantity = stockQuantity;
      product.isActive = !["false", "0"].includes(
        String(req.body.isActive).trim().toLowerCase()
      );

      if (req.file) {
        product.imageName = req.file.originalname || "";
        product.imageMimeType = req.file.mimetype || "";
        product.imageData = req.file.buffer || null;
        product.imageUpdatedAt = new Date();
      } else if (removeImage) {
        product.imageName = "";
        product.imageMimeType = "";
        product.imageData = null;
        product.imageUpdatedAt = new Date();
      }

      await product.save();
      res.json(serializeShopProduct(product));
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to update shop product." });
    }
  }
);

app.put("/api/therapy-resources/:id", requireStaffPermission("therapy", "edit"), therapyUpload.single("file"), async (req, res) => {
  try {
    const serviceId = cleanText(req.body.serviceId);
    const title = cleanText(req.body.title);
    const description = cleanText(req.body.description);
    const resource = await TherapyResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Therapy resource not found." });
    }

    if (!serviceId) {
      return res.status(400).json({ message: "Please choose a service." });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    resource.serviceId = service._id;
    resource.title = title;
    resource.description = description;

    if (req.file) {
      resource.fileName = req.file.originalname;
      resource.mimeType = req.file.mimetype || "application/octet-stream";
      resource.sizeBytes = req.file.size || 0;
      resource.data = req.file.buffer;
    }

    await resource.save();

    const populatedResource = await TherapyResource.findById(resource._id).populate("serviceId");
    res.json(serializeTherapyResource(populatedResource));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update therapy resource." });
  }
});

app.delete("/api/services/:id", requireStaffPermission("services", "edit"), async (req, res) => {
  try {
    const linkedTherapyResources = await TherapyResource.countDocuments({
      serviceId: req.params.id,
    });

    if (linkedTherapyResources) {
      return res.status(400).json({
        message: "This service has therapy files. Remove those files first.",
      });
    }

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

app.patch("/api/admin/shop/orders/:id/status", requireStaffPermission("shop", "edit"), async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id);
    const nextStatus = cleanText(req.body.status).toLowerCase();

    if (!order) {
      return res.status(404).json({ message: "Shop order not found." });
    }

    if (!["pending", "confirmed", "completed", "cancelled"].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid shop order status." });
    }

    const currentStatus = String(order.status || "pending").toLowerCase();
    const isCancelling = currentStatus !== "cancelled" && nextStatus === "cancelled";
    const isReactivating = currentStatus === "cancelled" && nextStatus !== "cancelled";

    if (isCancelling || isReactivating) {
      const products = await ShopProduct.find({
        _id: { $in: (order.items || []).map((item) => item.productId).filter(Boolean) },
      });
      const productMap = new Map(products.map((product) => [product._id.toString(), product]));

      for (const item of order.items || []) {
        const product = productMap.get(String(item.productId || ""));

        if (!product) {
          continue;
        }

        const quantity = Number(item.quantity || 0);

        if (isCancelling) {
          product.stockQuantity = Number(product.stockQuantity || 0) + quantity;
        }

        if (isReactivating) {
          if (Number(product.stockQuantity || 0) < quantity) {
            return res.status(409).json({
              message: `Not enough stock to reactivate ${item.productName || "this product"} order.`,
            });
          }

          product.stockQuantity = Math.max(0, Number(product.stockQuantity || 0) - quantity);
        }
      }

      await Promise.all(products.map((product) => product.save()));
    }

    order.status = nextStatus;
    await order.save();

    res.json(serializeShopOrder(order));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update shop order status." });
  }
});

app.delete("/api/admin/shop/products/:id", requireStaffPermission("shop", "edit"), async (req, res) => {
  try {
    const product = await ShopProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Shop product not found." });
    }

    await product.deleteOne();
    res.json({ message: "Shop product deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete shop product." });
  }
});

app.delete("/api/therapy-resources/:id", requireStaffPermission("therapy", "edit"), async (req, res) => {
  try {
    const resource = await TherapyResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Therapy resource not found." });
    }

    const assignedPatientsCount = await Patient.countDocuments({
      "therapyRecommendations.items.resourceId": resource._id,
    });

    if (assignedPatientsCount) {
      return res.status(400).json({
        message: "This therapy file is already assigned to patients.",
      });
    }

    await resource.deleteOne();
    res.json({ message: "Therapy resource deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete therapy resource." });
  }
});

app.get("/api/therapy-resources/:id/file", requireStaffPermission("therapy", "view"), async (req, res) => {
  try {
    const resource = await TherapyResource.findById(req.params.id);

    if (!resource || !resource.data) {
      return res.status(404).json({ message: "Therapy file not found." });
    }

    res.setHeader("Content-Type", resource.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(resource.fileName || "therapy-file")}"`
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(resource.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load therapy file." });
  }
});

app.get("/api/therapy-resources/:id/download", requireStaffPermission("therapy", "view"), async (req, res) => {
  try {
    const resource = await TherapyResource.findById(req.params.id);

    if (!resource || !resource.data) {
      return res.status(404).json({ message: "Therapy file not found." });
    }

    res.setHeader("Content-Type", resource.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(resource.fileName || "therapy-file")}"`
    );
    res.send(resource.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to download therapy file." });
  }
});

app.get("/api/users", requireStaffPermission("staff", "view"), async (req, res) => {
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
    const requester = await User.findById(String(req.auth?.sub || "").trim());
    const isSelf = String(req.params.id || "") === String(req.auth?.sub || "");
    const canViewStaff =
      requester?.role === "Admin" ||
      normalizePermissions(requester?.permissions || [], requester?.role).some(
        (permission) => permission.module === "staff" && permission.view
      );

    if (!isSelf && !canViewStaff) {
      return res.status(403).json({ message: "You do not have permission to access this staff profile." });
    }

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

app.get("/api/chat/conversations", requireStaffPermission("chat", "view"), async (req, res) => {
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

app.post("/api/chat/conversations/:id/messages", requireStaffPermission("chat", "add"), upload.array("attachments", 5), async (req, res) => {
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

app.patch("/api/chat/conversations/:id/read", requireStaffPermission("chat", "edit"), async (req, res) => {
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

app.delete("/api/chat/conversations/:id", requireStaffPermission("chat", "edit"), async (req, res) => {
  try {
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
    const requester = await User.findById(String(req.auth?.sub || "").trim());
    const isSelf = String(req.params.id || "") === String(req.auth?.sub || "");
    const canViewStaff =
      requester?.role === "Admin" ||
      normalizePermissions(requester?.permissions || [], requester?.role).some(
        (permission) => permission.module === "staff" && permission.view
      );

    if (!isSelf && !canViewStaff) {
      return res.status(403).json({ message: "You do not have permission to access this staff profile." });
    }

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
    const requester = await User.findById(String(req.auth?.sub || "").trim());
    const isSelf = String(req.params.id || "") === String(req.auth?.sub || "");
    const canViewStaff =
      requester?.role === "Admin" ||
      normalizePermissions(requester?.permissions || [], requester?.role).some(
        (permission) => permission.module === "staff" && permission.view
      );

    if (!isSelf && !canViewStaff) {
      return res.status(403).json({ message: "You do not have permission to access this staff profile." });
    }

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

app.post("/api/users", requireStaffPermission("staff", "add"), async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      role,
      status,
      chatEnabled,
      workType,
      monthlySalary,
      permissions,
      joiningDate,
      joiningNotes,
      password,
    } = req.body;

    const cleanName = cleanText(name);
    const cleanUserEmail = cleanEmail(email);
    const cleanUserMobile = cleanPhone(mobile);
    const cleanPassword = cleanText(password);
    const cleanMonthlySalary = cleanMoneyAmount(monthlySalary);

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
      monthlySalary: req.staffUser?.role === "Admin" ? cleanMonthlySalary : 0,
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

app.put("/api/users/:id", requireStaffPermission("staff", "edit"), async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      role,
      status,
      chatEnabled,
      workType,
      monthlySalary,
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
    const cleanMonthlySalary =
      monthlySalary !== undefined ? cleanMoneyAmount(monthlySalary) : undefined;

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
    if (cleanMonthlySalary !== undefined && req.staffUser?.role === "Admin") {
      user.monthlySalary = cleanMonthlySalary;
    }
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

app.post("/api/users/:id/joining-documents", requireStaffPermission("staff", "add"), upload.array("documents", 10), async (req, res) => {
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

app.post("/api/users/:id/profile-image", requireStaffPermission("staff", "edit"), upload.single("image"), async (req, res) => {
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

app.delete("/api/users/:id/joining-documents/:documentId", requireStaffPermission("staff", "edit"), async (req, res) => {
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

app.delete("/api/users/:id", requireStaffPermission("staff", "edit"), async (req, res) => {
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

app.get("/api/admin/profile", requireStaffAuth, async (req, res) => {
  try {
    if (req.auth?.role === "Admin") {
      const admin = await ensureDefaultAdmin();
      return res.json(serializeUser(admin));
    }

    const user = await User.findById(String(req.auth?.sub || "").trim());

    if (!user) {
      return res.status(404).json({ message: "Staff profile not found." });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ message: "This staff account is inactive." });
    }

    return res.json(serializeUser(user));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to load staff profile." });
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

app.get("/api/staff-applications", requireStaffPermission("staff_applications", "view"), async (req, res) => {
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

  if (error.message === "Unsupported file type." || error.message === "Unsupported therapy file type.") {
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
    cleanupOldPatientNotifications().catch((error) => {
      console.log("Failed to clean notification history:", error.message);
    });
    sendDuePatientPushNotifications().catch((error) => {
      console.log("Failed to send due push notifications:", error.message);
    });

    const pushIntervalMs = Math.max(
      Number(process.env.NOTIFICATION_PUSH_INTERVAL_MS) || 60 * 1000,
      15 * 1000
    );
    setInterval(() => {
      sendDuePatientPushNotifications().catch((error) => {
        console.log("Failed to send due push notifications:", error.message);
      });
    }, pushIntervalMs);
    setInterval(() => {
      cleanupOldPatientNotifications().catch((error) => {
        console.log("Failed to clean notification history:", error.message);
      });
    }, 24 * 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

