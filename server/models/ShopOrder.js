const mongoose = require("mongoose");

const shopOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopProduct",
      required: true,
    },
    productName: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const shopOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, trim: true },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    default: null,
  },
  publicUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PublicUser",
    default: null,
  },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  customerMobile: { type: String, required: true, trim: true },
  items: { type: [shopOrderItemSchema], default: [] },
  totalQuantity: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },
  note: { type: String, default: "", trim: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

shopOrderSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("ShopOrder", shopOrderSchema);
