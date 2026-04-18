const multer = require("multer");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const shopUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file?.mimetype || !allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("Please upload a valid product image."));
    }

    return callback(null, true);
  },
});

module.exports = shopUpload;
