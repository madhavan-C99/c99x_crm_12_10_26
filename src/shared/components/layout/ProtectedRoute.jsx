import { Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (!token) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const isAdmin = ADMIN_ROLES.includes(role);

  // 🌟 Organization check: If has_organization is false, user is locked to Organization setup screen
  const hasOrg = localStorage.getItem("has_organization") !== "false";
  if (!hasOrg) {
    const searchParams = new URLSearchParams(location.search);
    const isOrgScreen =
      location.pathname === "/admin/Settings" &&
      searchParams.get("tab") === "organization";
    const isOrgShortcut = location.pathname === "/admin/organization";

    if (!isOrgScreen && !isOrgShortcut) {
      return <Navigate to="/admin/Settings?tab=organization" replace />;
    }
    return children;
  }

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
