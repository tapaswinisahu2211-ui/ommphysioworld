const express = require("express");
const { requireAuthenticatedSession } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/security");
const {
  adminLogin,
  registerPublicUser,
  loginPublicUser,
  requestPasswordReset,
  pingSession,
  logoutSession,
} = require("../controllers/authController");

const router = express.Router();
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again later.",
});

router.post("/admin/login", authRateLimiter, adminLogin);
router.post("/auth/register", authRateLimiter, registerPublicUser);
router.post("/auth/login", authRateLimiter, loginPublicUser);
router.post("/auth/forgot-password", authRateLimiter, requestPasswordReset);
router.post("/session/ping", requireAuthenticatedSession, pingSession);
router.post("/session/logout", requireAuthenticatedSession, logoutSession);

module.exports = router;
