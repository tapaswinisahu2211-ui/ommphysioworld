const mongoose = require("mongoose");

const promotionBannerSchema = new mongoose.Schema(
  {
    badge: { type: String, default: "OPW Update", trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    actionLabel: { type: String, default: "", trim: true },
    actionUrl: { type: String, default: "", trim: true },
    imageData: { type: Buffer, default: null },
    imageMimeType: { type: String, default: "", trim: true },
    imageUpdatedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: null, index: true },
    endsAt: { type: Date, default: null, index: true },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

promotionBannerSchema.index({ isActive: 1, startsAt: 1, endsAt: 1, updatedAt: -1 });

module.exports = mongoose.model("PromotionBanner", promotionBannerSchema);
