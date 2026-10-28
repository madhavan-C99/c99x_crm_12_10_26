import { Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import PageLoader from "./PageLoader";
import { LOGIN_PATH } from "@/shared/config/env";
import { useAuth } from "@/shared/context/AuthContext";

export const ADMIN_ROLES = [
  "admin",
  "superadmin",
  "super_admin",
  "manager",
  "asst_manager",
  // "team_lead",
  "developer",
];

function ProtectedRoute({ children, allowedRoles, blockedRoles, permission }) {
  const token = localStorage.getItem("token");
  const { hasPermission, permissionsLoaded } = useAuth();

  if (!token) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const isAdmin = ADMIN_ROLES.includes(role);

  // 1. Role Allowed Check
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.map((r) => r.toLowerCase()).includes(role);
    if (!isAllowed) {
      return (
        <Navigate
          to={isAdmin ? "/admin/dashboard" : "/telecalling/dashboard"}
          replace
        />
      );
    }
  }

  // 2. Role Blocked Check
  if (blockedRoles && blockedRoles.length > 0) {
    const isBlocked = blockedRoles.map((r) => r.toLowerCase()).includes(role);
    if (isBlocked) {
      return (
        <Navigate
          to={isAdmin ? "/admin/dashboard" : "/telecalling/dashboard"}
          replace
        />
      );
    }
  }

  // 3. Admin Bypass: Admin roles have full access to all features and must NOT be blocked by permission loading
  if (isAdmin) {
    return children;
  }

  // 4. For non-admin roles: Wait for permissions to load if permission is required
  if (permission && !permissionsLoaded) {
    return <PageLoader />;
  }

  // 5. Route-level Permission Check (Blocks access if feature is disabled)
  if (permission && !hasPermission(permission)) {
    return (
      <Navigate
        to={isAdmin ? "/admin/dashboard" : "/telecalling/dashboard"}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
