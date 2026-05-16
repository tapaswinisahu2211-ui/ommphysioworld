const mongoose = require("mongoose");

const whatsAppLoginOtpSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

whatsAppLoginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("WhatsAppLoginOtp", whatsAppLoginOtpSchema);
