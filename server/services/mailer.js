const nodemailer = require("nodemailer");

const hasMailConfig = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
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
