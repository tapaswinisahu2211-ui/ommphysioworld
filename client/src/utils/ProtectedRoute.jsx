import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { canViewModule, getFirstAccessiblePath, getStoredUser, isAdminUser } from "./auth";

export default function ProtectedRoute({ children, moduleKey, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let active = true;
    const refreshUser = async () => {
      try {
        const response = await API.get("/admin/profile");
        if (!active) {
          return;
        }
        localStorage.setItem("adminUser", JSON.stringify(response.data || {}));
        setUser(response.data || {});
      } catch (_) {
        // Expired sessions are handled globally by the API interceptor.
      }
    };

    refreshUser();
    const intervalId = window.setInterval(refreshUser, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  if (adminOnly && !isAdminUser(user)) {
    return <Navigate to={getFirstAccessiblePath(user)} replace />;
  }

  if (moduleKey && !canViewModule(moduleKey, user)) {
    return <Navigate to={getFirstAccessiblePath(user)} replace />;
  }

  return children;
}
