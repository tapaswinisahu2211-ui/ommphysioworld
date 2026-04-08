const STORAGE_KEY = "adminUser";

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user || {}));
};

export const isAdminUser = (user = getStoredUser()) => user.role === "Admin";

export const getModulePermission = (moduleKey, user = getStoredUser()) => {
  if (!moduleKey) {
    return { view: true, add: true, edit: true };
  }

  if (isAdminUser(user)) {
    return { view: true, add: true, edit: true };
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return (
    permissions.find((permission) => permission.module === moduleKey) || {
      view: false,
      add: false,
      edit: false,
    }
  );
};

export const canViewModule = (moduleKey, user = getStoredUser()) =>
  getModulePermission(moduleKey, user).view;

export const canAddModule = (moduleKey, user = getStoredUser()) =>
  getModulePermission(moduleKey, user).add;

export const canEditModule = (moduleKey, user = getStoredUser()) =>
  getModulePermission(moduleKey, user).edit;

export const getFirstAccessiblePath = (user = getStoredUser()) => {
  if (!user || !user.role) {
    return "/admin";
  }

  if (isAdminUser(user)) {
    return "/dashboard";
  }

  const orderedModules = [
    { key: "dashboard", path: "/dashboard" },
    { key: "patients", path: "/patients" },
    { key: "appointments", path: "/patients" },
    { key: "documents", path: "/patients" },
    { key: "chat", path: "/dashboard" },
    { key: "services", path: "/services" },
    { key: "mailbox", path: "/mailbox" },
    { key: "treatment_tracker", path: "/treatment-tracker" },
    { key: "staff", path: "/staff" },
  ];

  return orderedModules.find(({ key }) => canViewModule(key, user))?.path || "/admin";
};
