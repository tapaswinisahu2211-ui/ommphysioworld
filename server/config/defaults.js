const DEFAULT_ADMIN = {
  name: process.env.DEFAULT_ADMIN_NAME || "Admin User",
  email: process.env.DEFAULT_ADMIN_EMAIL || "contact@ommphysioworld.com",
  password: process.env.DEFAULT_ADMIN_PASSWORD || "123456",
  mobile: process.env.DEFAULT_ADMIN_MOBILE || "9999999999",
  role: "Admin",
  chatEnabled: true,
  permissions: [],
};

const DEFAULT_STAFF_PERMISSIONS = [
  { module: "dashboard", view: true, add: false, edit: false },
  { module: "patients", view: true, add: false, edit: false },
  { module: "appointments", view: true, add: true, edit: true },
  { module: "documents", view: true, add: true, edit: false },
  { module: "chat", view: false, add: true, edit: true },
  { module: "services", view: false, add: false, edit: false },
  { module: "therapy", view: false, add: false, edit: false },
  { module: "staff", view: false, add: false, edit: false },
  { module: "mailbox", view: false, add: false, edit: false },
  { module: "treatment_tracker", view: false, add: false, edit: false },
];

module.exports = {
  DEFAULT_ADMIN,
  DEFAULT_STAFF_PERMISSIONS,
};
