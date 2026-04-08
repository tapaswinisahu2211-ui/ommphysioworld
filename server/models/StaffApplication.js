const mongoose = require("mongoose");

const staffApplicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  experience: String,
  message: String,
  resumeName: String,
  resumeMimeType: String,
  resumeData: Buffer,
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("StaffApplication", staffApplicationSchema);
