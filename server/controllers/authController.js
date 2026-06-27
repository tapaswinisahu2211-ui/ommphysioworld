const User = require("../models/User");
const PublicUser = require("../models/PublicUser");
const Patient = require("../models/Patient");
const WhatsAppLoginOtp = require("../models/WhatsAppLoginOtp");
const { DEFAULT_ADMIN } = require("../config/defaults");
const { hasMailConfig, sendMail } = require("../services/mailer");
const { isWhatsAppOtpDevMode, sendWhatsAppOtp } = require("../services/whatsapp");
const { ensureDefaultAdmin, serializeUser } = require("../utils/userHelpers");
const { hashPassword, verifyPassword } = require("../utils/password");
const { createSessionToken, verifySessionToken } = require("../utils/sessionToken");
const {
  cleanEmail,
  cleanPhone,
  cleanText,
  isValidEmail,
  isValidPhone,
} = require("../utils/validation");

const serializePublicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  address: user.address || "",
  createdFrom: user.createdFrom || "website",
  patientId: user.patientId ? user.patientId.toString() : "",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeCreatedFrom = (value, fallback = "website") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["website", "mobile_app", "admin"].includes(normalized)) {
    return normalized;
  }

  return fallback;
};

const formatCreatedFromLabel = (value) => {
  switch (normalizeCreatedFrom(value, "website")) {
    case "mobile_app":
      return "Mobile App";
    case "admin":
      return "Admin";
    default:
      return "Website";
  }
};

const isMobileAppAuthRequest = (req) => {
  const clientType = cleanText(req.body.clientType).toLowerCase();
  const createdFrom = normalizeCreatedFrom(req.body.createdFrom, "");
  return clientType === "mobile_app" || createdFrom === "mobile_app";
};

const createPatientAuthToken = (req, payload) =>
  createSessionToken(payload, isMobileAppAuthRequest(req) ? null : undefined);

const createStaffAuthToken = (req, payload) =>
  createSessionToken(payload, isMobileAppAuthRequest(req) ? null : undefined);

const generateTemporaryPassword = () =>
  `OPW${Math.random().toString(36).slice(-4).toUpperCase()}${Date.now()
    .toString()
    .slice(-4)}`;

const getWhatsAppOtpTtlSeconds = () => {
  const configured = Number(process.env.WHATSAPP_OTP_TTL_SECONDS || 600);
  return Number.isFinite(configured) && configured >= 60 ? Math.min(configured, 900) : 600;
};

const generateWhatsAppOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const createWhatsAppRegistrationToken = (mobile) =>
  createSessionToken(
    {
      sub: mobile,
      type: "whatsapp_otp_register",
      mobile,
    },
    15 * 60
  );

const findPublicUserByMobile = async (mobile) => {
  const users = await PublicUser.find({ mobile }).limit(2);

  if (users.length > 1) {
    const error = new Error("Multiple patient login accounts use this mobile number. Please login with email and password.");
    error.statusCode = 409;
    throw error;
  }

  return users[0] || null;
};

const resolveLoginPatient = async (user) => {
  if (!user?.patientId) {
    return null;
  }

  return Patient.findById(user.patientId);
};

const verifyUserPassword = (user, password) => {
  if (!user) {
    return false;
  }

  if (user.passwordHash) {
    return verifyPassword(password, user.passwordHash);
  }

  return Boolean(user.password && user.password === password);
};

const upgradeLegacyUserPassword = async (user, password) => {
  if (!user || user.passwordHash) {
    return;
  }

  user.passwordHash = hashPassword(password);
  user.password = "";
  await user.save();
};

const findOrCreatePatientForPublicUser = async ({
  name,
  email,
  mobile,
  address,
  createdFrom,
}) => {
  const resolvedCreatedFrom = normalizeCreatedFrom(createdFrom, "website");
  const existingPatient = await Patient.findOne({ email });

  if (existingPatient) {
    let shouldSave = false;

    if (!existingPatient.name && name) {
      existingPatient.name = name;
      shouldSave = true;
    }

    if (!existingPatient.mobile && mobile) {
      existingPatient.mobile = mobile;
      shouldSave = true;
    }

    if (!existingPatient.address && address) {
      existingPatient.address = address;
      shouldSave = true;
    }

    if (!existingPatient.createdFrom) {
      existingPatient.createdFrom = resolvedCreatedFrom;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingPatient.save();
    }

    return existingPatient;
  }

  return Patient.create({
    name,
    email,
    mobile,
    address,
    createdFrom: resolvedCreatedFrom,
    notes: `Created from ${formatCreatedFromLabel(resolvedCreatedFrom)} registration.`,
  });
};

const adminLogin = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = cleanText(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      const admin = await ensureDefaultAdmin();
      await upgradeLegacyUserPassword(admin, password);
      admin.lastSeenAt = new Date();
      await admin.save();

      return res.json({
        token: createStaffAuthToken(req, {
          sub: admin._id.toString(),
          type: "staff",
          role: admin.role,
        }),
        user: serializeUser(admin),
      });
    }

    const user = await User.findOne({ email });

    if (!user || !verifyUserPassword(user, password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ message: "This staff account is inactive." });
    }

    await upgradeLegacyUserPassword(user, password);
    user.lastSeenAt = new Date();
    await user.save();

    return res.json({
      token: createStaffAuthToken(req, {
        sub: user._id.toString(),
        type: "staff",
        role: user.role,
      }),
      user: serializeUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to login." });
  }
};

const registerPublicUser = async (req, res) => {
  try {
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const mobile = cleanPhone(req.body.mobile);
    const address = cleanText(req.body.address);
    const password = String(req.body.password || "");
    const createdFrom = normalizeCreatedFrom(req.body.createdFrom, "website");

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Name, email, mobile, and password are required.",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isValidPhone(mobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await PublicUser.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.mobile === mobile
            ? "An account with this mobile number already exists."
            : "An account with this email already exists.",
      });
    }

    const user = await PublicUser.create({
      name,
      email,
      mobile,
      address,
      passwordHash: hashPassword(password),
      createdFrom,
    });
    const patient = await findOrCreatePatientForPublicUser({
      name,
      email,
      mobile,
      address,
      createdFrom,
    });

    user.patientId = patient._id;
    await user.save();

    return res.status(201).json({
      message: "Account created successfully.",
      token: createPatientAuthToken(req, {
        sub: user._id.toString(),
        type: "patient",
        patientId: patient._id.toString(),
      }),
      user: serializePublicUser(user),
      patientId: patient._id.toString(),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to register user." });
  }
};

const loginPublicUser = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await PublicUser.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    let linkedPatient = null;

    if (user.patientId) {
      linkedPatient = await Patient.findById(user.patientId);
    }

    if (!linkedPatient) {
      await user.deleteOne();
      return res.status(404).json({
        message:
          "This patient account is no longer available. Please contact OPW support.",
      });
    }

    return res.json({
      message: "Login successful.",
      token: createPatientAuthToken(req, {
        sub: user._id.toString(),
        type: "patient",
        patientId: linkedPatient._id.toString(),
      }),
      user: serializePublicUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to login user." });
  }
};

const requestWhatsAppLoginOtp = async (req, res) => {
  try {
    const mobile = cleanPhone(req.body.mobile);

    if (!mobile) {
      return res.status(400).json({ message: "WhatsApp mobile number is required." });
    }

    if (!isValidPhone(mobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit WhatsApp number." });
    }

    const otp = generateWhatsAppOtp();
    const expiresInSeconds = getWhatsAppOtpTtlSeconds();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const otpRecord = await WhatsAppLoginOtp.create({
      mobile,
      otpHash: hashPassword(otp),
      expiresAt,
    });

    try {
      const delivery = await sendWhatsAppOtp({ mobile, otp });
      otpRecord.deliveryMode = delivery.deliveryMode;
      otpRecord.providerMessageId = delivery.messageId;
      await otpRecord.save();

      return res.json({
        message: "Verification code sent on WhatsApp.",
        mobile,
        expiresInSeconds,
        autofill: "android_one_tap_zero_tap_ready",
        ...(isWhatsAppOtpDevMode() ? { devOtp: otp } : {}),
      });
    } catch (sendError) {
      await otpRecord.deleteOne();
      throw sendError;
    }
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Failed to send WhatsApp verification code.",
    });
  }
};

const verifyWhatsAppLoginOtp = async (req, res) => {
  try {
    const mobile = cleanPhone(req.body.mobile);
    const otp = cleanText(req.body.otp);

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile number and WhatsApp code are required." });
    }

    if (!isValidPhone(mobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit WhatsApp number." });
    }

    if (!/^\d{4,8}$/.test(otp)) {
      return res.status(400).json({ message: "Please enter a valid WhatsApp verification code." });
    }

    const otpRecord = await WhatsAppLoginOtp.findOne({
      mobile,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        message: "WhatsApp verification code expired. Please request a new code.",
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(429).json({
        message: "Too many incorrect WhatsApp code attempts. Please request a new code.",
      });
    }

    otpRecord.attempts += 1;
    if (!verifyPassword(otp, otpRecord.otpHash)) {
      await otpRecord.save();
      return res.status(401).json({ message: "Invalid WhatsApp verification code." });
    }

    otpRecord.usedAt = new Date();
    await otpRecord.save();

    const user = await findPublicUserByMobile(mobile);
    if (!user) {
      return res.json({
        message: "WhatsApp number verified. Complete account details.",
        needsRegistration: true,
        registered: false,
        mobile,
        verificationToken: createWhatsAppRegistrationToken(mobile),
      });
    }

    const linkedPatient = await resolveLoginPatient(user);
    if (!linkedPatient) {
      return res.status(404).json({
        message: "This patient account is no longer available. Please contact OPW support.",
      });
    }

    return res.json({
      message: "Login successful.",
      token: createPatientAuthToken(req, {
        sub: user._id.toString(),
        type: "patient",
        patientId: linkedPatient._id.toString(),
      }),
      user: serializePublicUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Failed to verify WhatsApp code.",
    });
  }
};

const registerPublicUserWithWhatsAppOtp = async (req, res) => {
  try {
    const verificationToken = cleanText(req.body.verificationToken);
    const tokenPayload = verifySessionToken(verificationToken);

    if (
      !tokenPayload ||
      tokenPayload.type !== "whatsapp_otp_register" ||
      !tokenPayload.mobile
    ) {
      return res.status(401).json({
        message: "WhatsApp verification expired. Please verify your number again.",
      });
    }

    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const mobile = cleanPhone(req.body.mobile || tokenPayload.mobile);
    const address = cleanText(req.body.address);
    const password = String(req.body.password || "");
    const createdFrom = normalizeCreatedFrom(req.body.createdFrom, "website");

    if (mobile !== cleanPhone(tokenPayload.mobile)) {
      return res.status(400).json({ message: "Verified WhatsApp number does not match." });
    }

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Name, email, mobile, and password are required.",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isValidPhone(mobile)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await PublicUser.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.mobile === mobile
            ? "An account with this WhatsApp number already exists. Please verify again to login."
            : "An account with this email already exists.",
      });
    }

    const user = await PublicUser.create({
      name,
      email,
      mobile,
      address,
      passwordHash: hashPassword(password),
      createdFrom,
    });
    const patient = await findOrCreatePatientForPublicUser({
      name,
      email,
      mobile,
      address,
      createdFrom,
    });

    user.patientId = patient._id;
    await user.save();

    return res.status(201).json({
      message: "Account created successfully.",
      token: createPatientAuthToken(req, {
        sub: user._id.toString(),
        type: "patient",
        patientId: patient._id.toString(),
      }),
      user: serializePublicUser(user),
      patientId: patient._id.toString(),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to create WhatsApp verified account." });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await PublicUser.findOne({ email });

    if (!user) {
      return res.json({
        message:
          "If the account exists, a temporary password has been sent to the registered email address.",
      });
    }

    if (!hasMailConfig()) {
      return res.status(503).json({
        message:
          "Password email is not configured right now. Please contact OPW support.",
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    user.passwordHash = hashPassword(temporaryPassword);
    await user.save();

    try {
      await sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "OPW password reset",
        text: `Hello ${user.name},

Your OMM Physio World account password has been reset.

Temporary password: ${temporaryPassword}

Please login and change your password after signing in.

If you did not request this change, please contact OPW immediately.
`,
      });
    } catch (emailError) {
      console.log("Password reset email failed:", emailError);

      const authFailed =
        emailError?.code === "EAUTH" ||
        String(emailError?.response || "")
          .toLowerCase()
          .includes("authentication");

      if (authFailed) {
        return res.status(503).json({
          message:
            "Password email is not configured correctly right now. Please contact OPW support.",
        });
      }

      return res.status(500).json({
        message: "Unable to send the password email right now. Please try again shortly.",
      });
    }

    return res.json({
      message:
        "If the account exists, a temporary password has been sent to the registered email address.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to submit password reset request." });
  }
};

const changePublicUserPassword = async (req, res) => {
  try {
    if (!req.auth || req.auth.type !== "patient") {
      return res.status(401).json({ message: "Patient authentication is required." });
    }

    const oldPassword = String(req.body.oldPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Old password, new password, and confirm password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password must match." });
    }

    const user = await PublicUser.findById(String(req.auth.sub || "").trim());

    if (!user) {
      return res.status(404).json({ message: "Patient account not found." });
    }

    if (!verifyPassword(oldPassword, user.passwordHash)) {
      return res.status(401).json({ message: "Old password is incorrect." });
    }

    user.passwordHash = hashPassword(newPassword);
    await user.save();

    if (hasMailConfig()) {
      try {
        await sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "OPW password changed",
          text: `Hello ${user.name},

Your OMM Physio World account password has been changed successfully.

New password: ${newPassword}

If you did not make this change, please contact OPW immediately.
`,
        });
      } catch (emailError) {
        console.log("Password change email failed:", emailError);
      }
    }

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to change password." });
  }
};

const pingSession = async (req, res) => {
  try {
    const userId =
      req.auth?.type === "staff"
        ? String(req.auth.sub || "").trim()
        : String(req.body.userId || "").trim();

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.lastSeenAt = new Date();
    await user.save();

    return res.json({ success: true, lastSeenAt: user.lastSeenAt });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to update online status." });
  }
};

const logoutSession = async (req, res) => {
  try {
    const userId =
      req.auth?.type === "staff"
        ? String(req.auth.sub || "").trim()
        : String(req.body.userId || "").trim();

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.lastSeenAt = null;
    await user.save();

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to update logout status." });
  }
};

module.exports = {
  adminLogin,
  registerPublicUser,
  loginPublicUser,
  requestWhatsAppLoginOtp,
  verifyWhatsAppLoginOtp,
  registerPublicUserWithWhatsAppOtp,
  requestPasswordReset,
  changePublicUserPassword,
  pingSession,
  logoutSession,
};
