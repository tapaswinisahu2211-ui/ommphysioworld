const { verifySessionToken } = require("../utils/sessionToken");

const getBearerToken = (req) => {
  const authorization = String(req.headers.authorization || "").trim();

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
};

const authenticateRequest = (req, _res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    req.auth = null;
    return next();
  }

  const payload = verifySessionToken(token);

  if (!payload) {
    req.auth = null;
    req.authError = "Invalid or expired session.";
    return next();
  }

  req.auth = payload;
  req.authError = "";
  return next();
};

const requireAuthenticatedSession = (req, res, next) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  if (!req.auth) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  return next();
};

const requireStaffAuth = (req, res, next) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  if (!req.auth || req.auth.type !== "staff") {
    return res.status(401).json({ message: "Staff authentication is required." });
  }

  return next();
};

const requireAdminAuth = (req, res, next) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  if (!req.auth || req.auth.type !== "staff" || req.auth.role !== "Admin") {
    return res.status(403).json({ message: "Admin access is required." });
  }

  return next();
};

const requirePatientAuth = (req, res, next) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  if (!req.auth || req.auth.type !== "patient") {
    return res.status(401).json({ message: "Patient authentication is required." });
  }

  return next();
};

const requirePatientOrStaffAuth = (req, res, next) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  if (!req.auth || !["patient", "staff"].includes(req.auth.type)) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  return next();
};

const requirePatientRecordAccess = (req, res, next) => {
  if (req.authError) {
    return res.status(401).json({ message: req.authError });
  }

  if (!req.auth) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  if (req.auth.type === "staff") {
    return next();
  }

  if (
    req.auth.type === "patient" &&
    req.auth.patientId &&
    req.auth.patientId === String(req.params.id || "").trim()
  ) {
    return next();
  }

  return res.status(403).json({ message: "You do not have access to this patient record." });
};

module.exports = {
  authenticateRequest,
  requireAdminAuth,
  requireAuthenticatedSession,
  requirePatientAuth,
  requirePatientOrStaffAuth,
  requirePatientRecordAccess,
  requireStaffAuth,
};
