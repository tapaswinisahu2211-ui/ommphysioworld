const mongoose = require("mongoose");

const appointmentAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    data: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const appointmentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    default: null,
  },
  service: String,
  date: String,
  time: { type: String, default: "" },
  message: String,
  attachmentName: String,
  attachmentMimeType: String,
  attachmentData: Buffer,
  attachments: { type: [appointmentAttachmentSchema], default: [] },
  status: {
    type: String,
    enum: ["pending", "approved", "rescheduled", "completed", "cancelled"],
    default: "pending",
  },
  approvedDate: { type: String, default: "" },
  approvedTime: { type: String, default: "" },
  rescheduledDate: { type: String, default: "" },
  rescheduledTime: { type: String, default: "" },
  decisionNote: { type: String, default: "" },
  decisionAt: { type: Date, default: null },
  notificationSeenAt: { type: Date, default: null },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
