const mongoose = require("mongoose");

const shopProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: "", trim: true },
  description: { type: String, default: "", trim: true },
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  imageName: { type: String, default: "", trim: true },
  imageMimeType: { type: String, default: "" },
  imageData: { type: Buffer, default: null },
  imageUpdatedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

shopProductSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("ShopProduct", shopProductSchema);
