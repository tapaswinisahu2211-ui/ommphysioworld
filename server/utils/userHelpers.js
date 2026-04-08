const User = require("../models/User");
const { DEFAULT_ADMIN, DEFAULT_STAFF_PERMISSIONS } = require("../config/defaults");
const { hashPassword } = require("./password");

const normalizePermissions = (permissions = [], role = "Staff") => {
  if (role === "Admin") {
    return [];
  }

  const map = new Map(
    DEFAULT_STAFF_PERMISSIONS.map((permission) => [
      permission.module,
      { ...permission },
    ])
  );

  permissions.forEach((permission) => {
    const module = String(permission.module || "").trim();
    if (!module) {
      return;
    }

    map.set(module, {
      module,
      view: Boolean(permission.view),
      add: Boolean(permission.add),
      edit: Boolean(permission.edit),
    });
  });

  return Array.from(map.values());
};

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  status: user.status || "Active",
  chatEnabled: Boolean(user.chatEnabled),
  lastSeenAt: user.lastSeenAt,
  profileImageUrl: user.profileImageData
    ? `/users/${user._id.toString()}/profile-image`
    : "",
  workType: user.workType || "",
  joiningDate: user.joiningDate || "",
  joiningNotes: user.joiningNotes || "",
  joiningDocuments: (user.joiningDocuments || []).map((document) => ({
    id: document._id.toString(),
    name: document.name || "",
    mimeType: document.mimeType || "application/octet-stream",
    uploadedAt: document.uploadedAt,
    downloadUrl: `/users/${user._id.toString()}/joining-documents/${document._id.toString()}`,
  })),
  permissions: normalizePermissions(user.permissions || [], user.role),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const ensureDefaultAdmin = async () => {
  const admin = await User.findOne({ role: "Admin" }).sort({ createdAt: 1 });

  if (!admin) {
    return User.create({
      ...DEFAULT_ADMIN,
      password: "",
      passwordHash: hashPassword(DEFAULT_ADMIN.password),
    });
  }

  if (!admin.email) {
    admin.email = DEFAULT_ADMIN.email;
  }
  admin.role = "Admin";
  admin.chatEnabled = admin.chatEnabled ?? true;
  if (!admin.name) {
    admin.name = DEFAULT_ADMIN.name;
  }
  if (!admin.mobile) {
    admin.mobile = DEFAULT_ADMIN.mobile;
  }
  if (!admin.passwordHash) {
    const fallbackPassword = admin.password || DEFAULT_ADMIN.password;
    admin.passwordHash = hashPassword(fallbackPassword);
    admin.password = "";
  }

  await admin.save();
  return admin;
};

module.exports = {
  normalizePermissions,
  serializeUser,
  ensureDefaultAdmin,
};
