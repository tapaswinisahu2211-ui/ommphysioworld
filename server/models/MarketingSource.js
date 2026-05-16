const mongoose = require("mongoose");

const marketingPhotoSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "image/jpeg", trim: true },
    data: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const marketingReferralSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, trim: true },
    patientCount: { type: Number, default: 0 },
    patientNames: { type: [String], default: [] },
    notes: { type: String, default: "", trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const marketingSourceSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: ["medical_shop", "clinic", "institute", "hospital", "doctor", "other"],
    default: "medical_shop",
  },
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, default: "", trim: true },
  doctorName: { type: String, default: "", trim: true },
  mobile: { type: String, default: "", trim: true },
  alternateMobile: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  area: { type: String, default: "", trim: true },
  city: { type: String, default: "", trim: true },
  address: { type: String, default: "", trim: true },
  visitDate: { type: String, default: "", trim: true },
  nextFollowUpDate: { type: String, default: "", trim: true },
  assignedTo: { type: String, default: "", trim: true },
  pitchStatus: {
    type: String,
    enum: ["new", "visited", "interested", "follow_up", "converted", "not_interested"],
    default: "new",
  },
  expectedDailyPatients: { type: Number, default: 0 },
  notes: { type: String, default: "", trim: true },
  photos: { type: [marketingPhotoSchema], default: [] },
  referrals: { type: [marketingReferralSchema], default: [] },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

marketingSourceSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("MarketingSource", marketingSourceSchema);
