const mongoose = require("mongoose");

const patientNotificationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    uniqueKey: { type: String, required: true, trim: true, unique: true },
    entityType: { type: String, default: "", trim: true },
    entityId: { type: String, default: "", trim: true },
    actionUrl: { type: String, default: "", trim: true },
    scheduledFor: { type: Date, default: Date.now, index: true },
    readAt: { type: Date, default: null },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdByLabel: { type: String, default: "OPW", trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

patientNotificationSchema.index({ patientId: 1, scheduledFor: -1 });

module.exports = mongoose.model("PatientNotification", patientNotificationSchema);
