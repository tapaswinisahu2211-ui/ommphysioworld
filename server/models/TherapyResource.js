const mongoose = require("mongoose");

const therapyResourceSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  fileName: { type: String, required: true, trim: true },
  mimeType: { type: String, default: "application/octet-stream", trim: true },
  sizeBytes: { type: Number, default: 0 },
  data: { type: Buffer, required: true },
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

therapyResourceSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("TherapyResource", therapyResourceSchema);
