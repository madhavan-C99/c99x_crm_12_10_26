import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { fetchUserPermissionApi } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");

  // 🌟 IN-MEMORY ONLY - Permissions are never trusted from or cached in localStorage!
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

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
      // Clean up legacy localStorage key so no outdated cache lingers
      localStorage.removeItem("permissions");
      return permsArray;
    } catch (err) {
      console.error("Permissions API Error:", err);
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
  }, [token, refreshPermissions]);

  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true;

    const currentRole = (
      role ||
      localStorage.getItem("role") ||
      ""
    ).toLowerCase();
    if (
      currentRole === "admin" ||
      currentRole === "superadmin" ||
      currentRole === "super_admin"
    ) {
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
    const rawRole = data?.user?.role || data?.role;
    const userRole =
      typeof rawRole === "object"
        ? rawRole?.name || rawRole?.role_name || "user"
        : String(rawRole || data?.user?.role_name || "user");
    const userPerms = data?.user?.permissions || data?.permissions || [];

    if (accessToken) localStorage.setItem("token", accessToken);
    localStorage.setItem("role", userRole);
    // 🌟 Clean up legacy permissions from storage
    localStorage.removeItem("permissions");

    if (accessToken) setToken(accessToken);
    setRole(userRole);
    setPermissions(Array.isArray(userPerms) ? userPerms : []);
    setPermissionsLoaded(true);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setRole("");
    setPermissions([]);
    setPermissionsLoaded(true);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        permissions,
        permissionsLoaded,
        refreshPermissions,
        hasPermission,
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
    return {
      token: localStorage.getItem("token"),
      role: localStorage.getItem("role") || "",
      permissions: [],
      permissionsLoaded: true,
      refreshPermissions: async () => [],
      hasPermission: () => true,
      login: () => {},
      logout: () => {},
    };
  }
  return context;
};
