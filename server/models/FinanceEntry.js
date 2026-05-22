const mongoose = require("mongoose");

const financeEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  source: {
    type: String,
    enum: ["manual", "payroll"],
    default: "manual",
  },
  title: { type: String, required: true, trim: true },
  category: { type: String, default: "", trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: String, required: true, trim: true },
  method: { type: String, default: "", trim: true },
  notes: { type: String, default: "", trim: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

financeEntrySchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("FinanceEntry", financeEntrySchema);
