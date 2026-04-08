import { Navigate } from "react-router-dom";
import { canViewModule, getFirstAccessiblePath, getStoredUser, isAdminUser } from "./auth";

export default function ProtectedRoute({ children, moduleKey, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

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
