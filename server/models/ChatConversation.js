const mongoose = require("mongoose");

const chatAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "application/octet-stream", trim: true },
    data: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const chatMessageSchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ["visitor", "agent"],
      required: true,
    },
    senderName: { type: String, default: "", trim: true },
    text: { type: String, default: "", trim: true },
    attachments: { type: [chatAttachmentSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const chatConversationSchema = new mongoose.Schema({
  visitorName: { type: String, required: true, trim: true },
  visitorContact: { type: String, default: "", trim: true },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messages: { type: [chatMessageSchema], default: [] },
  unreadForAgent: { type: Boolean, default: true },
  unreadForVisitor: { type: Boolean, default: false },
  isClosed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

chatConversationSchema.pre("save", function updateTimestamp() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
