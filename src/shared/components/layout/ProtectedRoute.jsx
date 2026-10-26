import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
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

  // 🌟 Avoid race conditions on page refresh: wait for fresh permissions before evaluating guards
  if (permission && !permissionsLoaded) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#F1F1F1",
        }}
      >
        <CircularProgress size={36} sx={{ color: "#90D916" }} />
      </Box>
    );
  }

  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const isAdmin = ADMIN_ROLES.includes(role);

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

  // 🛡️ Route-level Permission Check (Blocks access if feature is disabled)
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
