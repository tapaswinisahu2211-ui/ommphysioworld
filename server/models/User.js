const mongoose = require("mongoose");

const modulePermissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true },
    view: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
  },
  { _id: false }
);

const joiningDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    data: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, default: "" },
  passwordHash: { type: String, default: "" },
  mobile: { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: ["Admin", "Staff"],
    default: "Staff",
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  chatEnabled: { type: Boolean, default: false },
  lastSeenAt: { type: Date, default: null },
  profileImageData: { type: Buffer, default: null },
  profileImageMimeType: { type: String, default: "" },
  profileImageUpdatedAt: { type: Date, default: null },
  workType: { type: String, default: "", trim: true },
  joiningDate: { type: String, default: "" },
  joiningNotes: { type: String, default: "" },
  joiningDocuments: { type: [joiningDocumentSchema], default: [] },
  permissions: { type: [modulePermissionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("User", userSchema);
