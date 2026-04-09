const mongoose = require("mongoose");

const appointmentEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, default: "" },
    service: { type: String, required: true },
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
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
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

const sessionDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["done", "not_done"],
      default: "not_done",
    },
    updatedAt: { type: Date, default: null },
  },
  { _id: true }
);

const treatmentPlanSchema = new mongoose.Schema(
  {
    treatmentTypes: { type: [String], default: [] },
    fromDate: { type: String, default: "" },
    toDate: { type: String, default: "" },
    totalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "" },
    paymentNotes: { type: String, default: "" },
    payments: { type: [paymentEntrySchema], default: [] },
    sessionDays: { type: [sessionDaySchema], default: [] },
    status: { type: String, default: "active" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  mobile: { type: String, required: true, trim: true },
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
  treatmentPlans: { type: [treatmentPlanSchema], default: [] },
  appointments: { type: [appointmentEntrySchema], default: [] },
  payments: { type: [paymentEntrySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

patientSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Patient", patientSchema);
