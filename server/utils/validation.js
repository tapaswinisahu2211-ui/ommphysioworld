const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[6-9]\d{9}$/;

const cleanText = (value) => String(value || "").trim();
const cleanEmail = (value) => cleanText(value).toLowerCase();
const cleanPhone = (value) => cleanText(value).replace(/\D/g, "");

const isValidEmail = (value) => emailPattern.test(cleanEmail(value));
const isValidPhone = (value) => phonePattern.test(cleanPhone(value));

const isValidDateValue = (value) => {
  const date = cleanText(value);
  if (!date) {
    return false;
  }

  const parsed = new Date(date);
  return !Number.isNaN(parsed.getTime());
};

const isFutureOrTodayDate = (value) => {
  if (!isValidDateValue(value)) {
    return false;
  }

  const selected = new Date(value);
  const today = new Date();
  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return selected >= today;
};

const getRequiredMessage = (fields) => {
  const missing = fields
    .filter(({ value }) => !cleanText(value))
    .map(({ label }) => label);

  return missing.length ? `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.` : "";
};

module.exports = {
  cleanEmail,
  cleanPhone,
  cleanText,
  getRequiredMessage,
  isFutureOrTodayDate,
  isValidDateValue,
  isValidEmail,
  isValidPhone,
};
