const mongoose = require("mongoose");

const appointmentEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, default: "" },
    service: { type: String, required: true },
    serviceLocation: {
      type: String,
      enum: ["clinic", "home"],
      default: "clinic",
    },
    status: { type: String, default: "approved" },
    remark: { type: String, default: "", trim: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String, default: "" },
    paymentDate: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const treatmentBillingSettingsSchema = new mongoose.Schema(
  {
    homeVisitCharge: { type: Number, default: 500 },
    clinicVisitCharge: { type: Number, default: 300 },
    firstConsultationCharge: { type: Number, default: 200 },
    discountType: {
      type: String,
      enum: ["none", "percent", "amount"],
      default: "none",
    },
    discountValue: { type: Number, default: 0 },
    extraSessionDays: { type: Number, default: 0 },
  },
  { _id: false }
);

const treatmentBillingSummarySchema = new mongoose.Schema(
  {
    sessionCount: { type: Number, default: 0 },
    sessionRate: { type: Number, default: 0 },
    sessionSubtotal: { type: Number, default: 0 },
    consultationCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    payableAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const clinicalDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    data: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const clinicalNoteSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    addedByType: {
      type: String,
      enum: ["patient", "opw"],
      default: "opw",
    },
    addedByLabel: { type: String, default: "OPW", trim: true },
    documents: { type: [clinicalDocumentSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const therapyRecommendationItemSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TherapyResource",
      required: true,
    },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    fileName: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "application/octet-stream", trim: true },
    resourceType: { type: String, default: "document", trim: true },
    sizeBytes: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const therapyRecommendationSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    serviceName: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    items: { type: [therapyRecommendationItemSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const sessionDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["done", "not_done"],
      default: "not_done",
    },
    treatmentType: { type: String, default: "", trim: true },
    doneByStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    doneByStaffName: { type: String, default: "", trim: true },
    updatedAt: { type: Date, default: null },
  },
  { _id: true }
);

const treatmentPlanSchema = new mongoose.Schema(
  {
    treatmentTypes: { type: [String], default: [] },
    treatmentLocation: {
      type: String,
      enum: ["clinic", "home"],
      default: "clinic",
    },
    assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    fromDate: { type: String, default: "" },
    toDate: { type: String, default: "" },
    totalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "" },
    paymentNotes: { type: String, default: "" },
    billingSettings: { type: treatmentBillingSettingsSchema, default: () => ({}) },
    billingSummary: { type: treatmentBillingSummarySchema, default: () => ({}) },
    payments: { type: [paymentEntrySchema], default: [] },
    sessionDays: { type: [sessionDaySchema], default: [] },
    status: { type: String, default: "active" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const patientSchema = new mongoose.Schema({
  patientId: { type: String, trim: true, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  mobile: { type: String, required: true, trim: true },
  address: { type: String, default: "", trim: true },
  createdFrom: {
    type: String,
    enum: ["website", "mobile_app", "admin"],
    default: "admin",
  },
  disease: { type: String, default: "", trim: true },
  notes: { type: String, default: "", trim: true },
  profileImageData: { type: Buffer, default: null },
  profileImageMimeType: { type: String, default: "" },
  profileImageUpdatedAt: { type: Date, default: null },
  clinicalNotes: { type: [clinicalNoteSchema], default: [] },
  clinicalDocuments: { type: [clinicalDocumentSchema], default: [] },
  therapyRecommendations: { type: [therapyRecommendationSchema], default: [] },
  treatmentPlans: { type: [treatmentPlanSchema], default: [] },
  appointments: { type: [appointmentEntrySchema], default: [] },
  payments: { type: [paymentEntrySchema], default: [] },
  archivedAt: { type: Date, default: null },
  archivedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  archivedByRole: { type: String, default: "", trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const buildPatientIdPrefix = (date = new Date()) => `OPW${date.getFullYear()}`;

patientSchema.pre("validate", async function assignPatientId() {
  if (this.patientId) {
    return;
  }

  const prefix = buildPatientIdPrefix(this.createdAt || new Date());
  const existingIds = await this.constructor
    .find({ patientId: { $regex: `^${prefix}\\d+$` } })
    .setOptions({ includeArchived: true })
    .select("patientId")
    .lean();

  const nextSequence =
    existingIds.reduce((max, patient) => {
      const suffix = Number(String(patient.patientId || "").slice(prefix.length));
      return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
    }, 0) + 1;

  this.patientId = `${prefix}${String(nextSequence).padStart(3, "0")}`;
});

patientSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

patientSchema.pre(/^find/, function excludeArchivedPatients() {
  if (!this.getOptions().includeArchived) {
    this.where({ archivedAt: null });
  }
});

module.exports = mongoose.model("Patient", patientSchema);
