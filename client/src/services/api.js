import axios from "axios";

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

export default API;
