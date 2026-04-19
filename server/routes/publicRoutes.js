const express = require("express");
const { requirePatientOrStaffAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { createRateLimiter } = require("../middleware/security");
const {
  submitAppointment,
  submitStaffApplication,
} = require("../controllers/publicFormsController");

const router = express.Router();
const publicFormRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many submissions. Please wait and try again.",
});

router.post(
  "/appointments",
  requirePatientOrStaffAuth,
  publicFormRateLimiter,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  submitAppointment
);
router.post(
  "/staff-applications",
  publicFormRateLimiter,
  upload.single("resume"),
  submitStaffApplication
);

module.exports = router;
