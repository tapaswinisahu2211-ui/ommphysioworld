import axios from "axios";

const SESSION_EXPIRED_MESSAGE_KEY = "opwSessionExpiredMessage";
let isHandlingSessionExpiry = false;

const resolveBaseUrl = () => {
  const envBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
  }

  return "/api";
};

const API = axios.create({
  baseURL: resolveBaseUrl()
});

API.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("token") || "";
  let patientToken = "";

  try {
    const patientUser = JSON.parse(
      localStorage.getItem("ommphysioPatientUser") || "null"
    );
    patientToken = patientUser?.token || "";
  } catch (_) {
    patientToken = "";
  }

  const token = adminToken || patientToken;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = Number(error?.response?.status || 0);

    if (status === 401 && typeof window !== "undefined") {
      const adminToken = localStorage.getItem("token") || "";
      const patientSession = localStorage.getItem("ommphysioPatientUser") || "";
      const hadAdminSession = Boolean(adminToken);
      const hadPatientSession = Boolean(patientSession);

      if ((hadAdminSession || hadPatientSession) && !isHandlingSessionExpiry) {
        isHandlingSessionExpiry = true;

        try {
          sessionStorage.setItem(
            SESSION_EXPIRED_MESSAGE_KEY,
            "Session expired. Please login again."
          );
        } catch (_) {
          // Ignore storage failures and continue logout flow.
        }

        localStorage.removeItem("token");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("ommphysioPatientUser");

        const currentPath = `${window.location.pathname}${window.location.search}`;
        const nextLocation =
          hadPatientSession && !hadAdminSession
            ? `/patient-login?redirect=${encodeURIComponent(currentPath || "/patient-dashboard")}`
            : "/admin";

        window.setTimeout(() => {
          window.location.replace(nextLocation);
        }, 0);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
