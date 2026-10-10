import { Navigate } from "react-router-dom";
import { LOGIN_PATH } from "@/shared/config/env";

const ADMIN_ROLES = ["admin", "superadmin", "super_admin"];

function ProtectedRoute({ children, allowedRoles, blockedRoles }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const isAdmin = ADMIN_ROLES.includes(role);

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.map((r) => r.toLowerCase()).includes(role);
    if (!isAllowed) {
      return (
        <Navigate
          to={isAdmin ? "/admin/Educatiionpipeline" : "/telecalling/dashboard"}
          replace
        />
      );
    }
  }

  if (blockedRoles && blockedRoles.length > 0) {
    const isBlocked = blockedRoles.map((r) => r.toLowerCase()).includes(role);
    if (isBlocked) {
      return (
        <Navigate
          to={isAdmin ? "/admin/Educatiionpipeline" : "/telecalling/dashboard"}
          replace
        />
      );
    }
  }

  return children;
}

export default ProtectedRoute;
