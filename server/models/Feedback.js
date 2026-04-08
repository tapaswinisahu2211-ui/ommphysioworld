const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  comment: { type: String, required: true, trim: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

feedbackSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Feedback", feedbackSchema);
