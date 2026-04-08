const mongoose = require("mongoose");

const jobRequirementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, default: "", trim: true },
  employmentType: { type: String, default: "", trim: true },
  experience: { type: String, default: "", trim: true },
  location: { type: String, default: "", trim: true },
  openings: { type: Number, default: 1, min: 1 },
  summary: { type: String, default: "", trim: true },
  responsibilities: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  status: {
    type: String,
    enum: ["Active", "Completed", "Unpublished"],
    default: "Active",
  },
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

jobRequirementSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("JobRequirement", jobRequirementSchema);
