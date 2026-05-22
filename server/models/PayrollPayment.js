const mongoose = require("mongoose");

const payrollPaymentSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  staffNameSnapshot: { type: String, required: true, trim: true },
  staffRoleSnapshot: { type: String, default: "", trim: true },
  staffStatusSnapshot: { type: String, default: "", trim: true },
  month: { type: String, required: true, trim: true },
  baseSalary: { type: Number, required: true, min: 0 },
  bonus: { type: Number, default: 0, min: 0 },
  commission: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paidDate: { type: String, required: true, trim: true },
  method: { type: String, default: "", trim: true },
  notes: { type: String, default: "", trim: true },
  financeEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FinanceEntry",
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

payrollPaymentSchema.index({ staffId: 1, month: 1 }, { unique: true });

payrollPaymentSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("PayrollPayment", payrollPaymentSchema);
