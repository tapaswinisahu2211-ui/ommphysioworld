const multer = require("multer");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);

const therapyUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Keep file size comfortably under MongoDB's 16 MB document limit.
    fileSize: 12 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file?.mimetype || !allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("Unsupported therapy file type."));
    }

    return callback(null, true);
  },
});

module.exports = therapyUpload;
