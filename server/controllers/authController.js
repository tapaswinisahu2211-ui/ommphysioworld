const User = require("../models/User");
const PublicUser = require("../models/PublicUser");
const Patient = require("../models/Patient");
const { DEFAULT_ADMIN } = require("../config/defaults");
const { sendMail } = require("../services/mailer");
const { ensureDefaultAdmin, serializeUser } = require("../utils/userHelpers");
const { hashPassword, verifyPassword } = require("../utils/password");
const { createSessionToken } = require("../utils/sessionToken");
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
  patientId: user.patientId ? user.patientId.toString() : "",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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

const findOrCreatePatientForPublicUser = async ({ name, email, mobile }) => {
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

    if (shouldSave) {
      await existingPatient.save();
    }

    return existingPatient;
  }

  return Patient.create({
    name,
    email,
    mobile,
    notes: "Created from mobile app registration.",
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
        token: createSessionToken({
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
      token: createSessionToken({
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
    const password = String(req.body.password || "");

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

    const existingUser = await PublicUser.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await PublicUser.create({
      name,
      email,
      mobile,
      passwordHash: hashPassword(password),
    });
    const patient = await findOrCreatePatientForPublicUser({
      name,
      email,
      mobile,
    });

    user.patientId = patient._id;
    await user.save();

    return res.status(201).json({
      message: "Account created successfully.",
      token: createSessionToken({
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

    if (!user.patientId) {
      const patient = await findOrCreatePatientForPublicUser({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      });
      user.patientId = patient._id;
      await user.save();
    }

    return res.json({
      message: "Login successful.",
      token: createSessionToken({
        sub: user._id.toString(),
        type: "patient",
        patientId: user.patientId ? user.patientId.toString() : "",
      }),
      user: serializePublicUser(user),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to login user." });
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

    if (user) {
      try {
        await sendMail({
          from: process.env.EMAIL_USER,
          to: "contact@ommphysioworld.com",
          replyTo: email,
          subject: `Password Reset Request - ${user.name}`,
          text: `A public user requested password support.

Name: ${user.name}
Email: ${user.email}
Mobile: ${user.mobile}
Requested At: ${new Date().toISOString()}
`,
        });
      } catch (emailError) {
        console.log("Password reset notification email failed:", emailError);
      }
    }

    return res.json({
      message:
          "If the account exists, the clinic has been notified and will help with password access.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to submit password reset request." });
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
  requestPasswordReset,
  pingSession,
  logoutSession,
};
