const mongoose = require("mongoose");

const publicUserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  mobile: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  createdFrom: {
    type: String,
    enum: ["website", "mobile_app", "admin"],
    default: "website",
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

publicUserSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("PublicUser", publicUserSchema);
