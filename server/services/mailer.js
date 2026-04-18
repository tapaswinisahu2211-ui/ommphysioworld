const nodemailer = require("nodemailer");

const PLACEHOLDER_PASSWORDS = new Set([
  "PASTE_YOUR_GMAIL_APP_PASSWORD_HERE",
  "YOUR_GMAIL_APP_PASSWORD",
]);

const cleanEnvValue = (value) => String(value || "").trim();

const hasMailConfig = () => {
  const emailUser = cleanEnvValue(process.env.EMAIL_USER);
  const emailPassword = cleanEnvValue(process.env.EMAIL_APP_PASSWORD);

  return Boolean(
    emailUser && emailPassword && !PLACEHOLDER_PASSWORDS.has(emailPassword)
  );
};

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: cleanEnvValue(process.env.EMAIL_USER),
      pass: cleanEnvValue(process.env.EMAIL_APP_PASSWORD),
    },
  });

const sendMail = async (mailOptions) => {
  if (!hasMailConfig()) {
    return false;
  }

  const transporter = createTransporter();
  await transporter.sendMail(mailOptions);
  return true;
};

module.exports = {
  hasMailConfig,
  sendMail,
};
