import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
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
