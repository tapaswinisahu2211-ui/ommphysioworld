const mongoose = require("mongoose");

const staffCompensationSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  monthlySalary: { type: Number, default: 0, min: 0 },
  monthlyBonus: { type: Number, default: 0, min: 0 },
  commissionPerPatient: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: "", trim: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

staffCompensationSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("StaffCompensation", staffCompensationSchema);
