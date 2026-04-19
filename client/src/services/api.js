import axios from "axios";

const SESSION_EXPIRED_MESSAGE_KEY = "opwSessionExpiredMessage";
let isHandlingSessionExpiry = false;

const getPatientSession = () => {
  try {
    return JSON.parse(localStorage.getItem("ommphysioPatientUser") || "null");
  } catch (_) {
    return null;
  }
};

const isPatientFacingPath = (pathname = "") =>
  pathname.startsWith("/patient") ||
  pathname.startsWith("/shop") ||
  pathname.startsWith("/book-appointment");

const isPatientRequest = (config = {}) => {
  const url = `${config?.url || ""}`.toLowerCase();

  return (
    url.startsWith("/auth/change-password") ||
    url.startsWith("/shop/orders/my") ||
    url.startsWith("/shop/orders") ||
    (url.startsWith("/patients/") && !url.startsWith("/patients/archive"))
  );
};

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
  const patientToken = getPatientSession()?.token || "";
  const pathname =
    typeof window !== "undefined" ? window.location.pathname || "" : "";
  const token =
    (isPatientFacingPath(pathname) || isPatientRequest(config)) && patientToken
      ? patientToken
      : adminToken || patientToken;

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
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const shouldReturnToPatientLogin =
        hadPatientSession &&
        (isPatientFacingPath(window.location.pathname || "") ||
          isPatientRequest(error?.config));

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

        const nextLocation =
          shouldReturnToPatientLogin
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
