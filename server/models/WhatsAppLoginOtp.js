const mongoose = require("mongoose");

const whatsappLoginOtpSchema = new mongoose.Schema({
  mobile: { type: String, required: true, trim: true, index: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  providerMessageId: { type: String, default: "", trim: true },
  deliveryMode: {
    type: String,
    enum: ["cloud_api", "dev"],
    default: "cloud_api",
  },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

whatsappLoginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

whatsappLoginOtpSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("WhatsAppLoginOtp", whatsappLoginOtpSchema);
