const PATIENT_USER_KEY = "ommphysioPatientUser";

export function getPatientUser() {
  try {
    const rawValue = localStorage.getItem(PATIENT_USER_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    localStorage.removeItem(PATIENT_USER_KEY);
    return null;
  }
}

export function savePatientUser(user) {
  localStorage.setItem(PATIENT_USER_KEY, JSON.stringify(user));
}

export function clearPatientUser() {
  localStorage.removeItem(PATIENT_USER_KEY);
}
