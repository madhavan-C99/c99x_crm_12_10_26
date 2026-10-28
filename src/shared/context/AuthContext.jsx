import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { fetchUserPermissionApi } from "../services/authService";

const AuthContext = createContext();

const ADMIN_ROLES_LIST = [
  "admin",
  "superadmin",
  "super_admin",
  "manager",
  "asst_manager",
  "developer",
];

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");

  // 🌟 IN-MEMORY ONLY - Permissions are never trusted from or cached in localStorage!
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(() => {
    const currentRole = (localStorage.getItem("role") || "").toLowerCase().trim();
    return ADMIN_ROLES_LIST.includes(currentRole);
  });

  // 🌟 Fetch fresh permissions directly from Backend API into React Memory
  const refreshPermissions = useCallback(async () => {
    const activeToken = localStorage.getItem("token");
    if (!activeToken) {
      setPermissions([]);
      setPermissionsLoaded(true);
      return [];
    }

    try {
      const res = await fetchUserPermissionApi();
      const perms =
        res?.data?.data?.permissions ||
        res?.data?.permissions ||
        res?.data?.data ||
        [];
      const permsArray = Array.isArray(perms) ? perms : [];
      setPermissions(permsArray);
      setPermissionsLoaded(true);
      localStorage.removeItem("permissions");
      return permsArray;
    } catch (err) {
      console.warn("Permissions API Error:", err?.message || err);
      setPermissions([]);
      setPermissionsLoaded(true);
      return [];
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshPermissions();
    } else {
      setPermissions([]);
      setPermissionsLoaded(true);
    }

    // 🌟 Auto-refresh permissions as soon as network is restored
    const handleOnline = () => {
      if (token) refreshPermissions();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [token, refreshPermissions]);

  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true;

    const currentRole = (
      role ||
      localStorage.getItem("role") ||
      ""
    ).toLowerCase();
    if (ADMIN_ROLES_LIST.includes(currentRole)) {
      return true;
    }

    if (typeof requiredPermission === "string") {
      return permissions.includes(requiredPermission);
    }

    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some((p) => permissions.includes(p));
    }

    return false;
  };

  const login = (data) => {
    const accessToken =
      data?.token?.access ||
      data?.access ||
      data?.token ||
      (typeof data?.token === "string" ? data.token : null);

    const refreshToken =
      data?.token?.refresh ||
      data?.refresh ||
      (typeof data?.refresh === "string" ? data.refresh : null);

    const userRole =
      data?.role ||
      data?.user?.role ||
      data?.user_role ||
      "";

    if (accessToken) {
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
    }

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    if (userRole) {
      localStorage.setItem("role", userRole);
      setRole(userRole);
    }

    // Immediately fetch fresh permissions on login
    refreshPermissions();
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setRole("");
    setPermissions([]);
    setPermissionsLoaded(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        permissions,
        permissionsLoaded,
        hasPermission,
        refreshPermissions,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
