export const cleanText = (value) => String(value || "").trim();
export const cleanPhone = (value) => cleanText(value).replace(/\D/g, "");
export const cleanEmail = (value) => cleanText(value).toLowerCase();

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(value));

export const isValidPhone = (value) => /^[6-9]\d{9}$/.test(cleanPhone(value));

export const isFutureOrTodayDate = (value) => {
  if (!value) {
    return false;
  }

  const selected = new Date(value);
  if (Number.isNaN(selected.getTime())) {
    return false;
  }

  const today = new Date();
  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return selected >= today;
};

export const validateEmailField = (email, required = true) => {
  const value = cleanEmail(email);
  if (!value && required) {
    return "Email is required.";
  }
  if (value && !isValidEmail(value)) {
    return "Please enter a valid email address.";
  }
  return "";
};

export const validatePhoneField = (phone, required = true) => {
  const value = cleanPhone(phone);
  if (!value && required) {
    return "Phone number is required.";
  }
  if (value && !isValidPhone(value)) {
    return "Please enter a valid 10-digit phone number.";
  }
  return "";
};

export const firstValidationError = (checks) =>
  checks.find(Boolean) || "";
