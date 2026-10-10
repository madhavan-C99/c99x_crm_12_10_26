import { createContext, useContext, useEffect, useState } from "react";

import { fetchUserPermissionApi } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");

  const [permissions, setPermissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("permissions")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (token) {
      fetchUserPermissionApi()
        .then((res) => {
          const perms =
            res?.data?.data?.permissions ||
            res?.data?.permissions ||
            res?.data?.data ||
            [];
          const permsArray = Array.isArray(perms) ? perms : [];
          setPermissions(permsArray);
          localStorage.setItem("permissions", JSON.stringify(permsArray));
        })
        .catch((err) => {
          console.error("Permissions API Error:", err);
          const saved = localStorage.getItem("permissions");
          if (!saved) {
            localStorage.setItem("permissions", JSON.stringify([]));
          }
        });
    }
  }, [token]);

  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true;

    const currentRole = (role || "").toLowerCase();
    if (currentRole === "admin" || currentRole === "superadmin" || currentRole === "super_admin") {
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
    const accessToken = data?.token?.access || data?.access || data?.token || (typeof data?.token === "string" ? data.token : null);
    const rawRole = data?.user?.role || data?.role;
    const userRole = typeof rawRole === "object"
      ? (rawRole?.name || rawRole?.role_name || "user")
      : String(rawRole || data?.user?.role_name || "user");
    const userPerms = data?.user?.permissions || data?.permissions || [];

    if (accessToken) localStorage.setItem("token", accessToken);
    localStorage.setItem("role", userRole);
    localStorage.setItem("permissions", JSON.stringify(userPerms));

    if (accessToken) setToken(accessToken);
    setRole(userRole);
    setPermissions(userPerms);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setRole("");
    setPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        permissions,
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
      hasPermission: () => true,
      login: () => {},
      logout: () => {},
    };
  }
  return context;
};
