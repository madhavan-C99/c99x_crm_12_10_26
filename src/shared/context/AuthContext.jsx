import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { fetchUserPermissionApi } from "../services/authService";

const AuthContext = createContext();

// ✅ MERGED: Combined roles from both Bharath & Dhina
const SUPER_ADMIN_ROLES = [
  "admin",
  "superadmin",
  "super_admin",
  "developer",
  "dev",
  "org_admin",
  "manager",
  "asst_manager",
];

const SESSION_PERMS_KEY = "crm_session_permissions";
const SESSION_PAGES_KEY = "crm_session_pages";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");

  // 🌟 Stale-While-Revalidate: Initialize immediately from session cache
  const [permissions, setPermissions] = useState(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_PERMS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // ✅ From Bharath: pages-level permissions
  const [pages, setPages] = useState(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_PAGES_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [permissionsLoaded, setPermissionsLoaded] = useState(() => {
    const currentRole = (localStorage.getItem("role") || "")
      .toLowerCase()
      .trim();
    if (SUPER_ADMIN_ROLES.includes(currentRole)) return true;
    try {
      const cached = sessionStorage.getItem(SESSION_PERMS_KEY);
      return Boolean(cached && JSON.parse(cached)?.length > 0);
    } catch {
      return false;
    }
  });

  // 🌟 Background refresh without blocking UI
  const refreshPermissions = useCallback(async () => {
    const activeToken = localStorage.getItem("token");
    if (!activeToken) {
      setPermissions([]);
      setPages({});
      setPermissionsLoaded(true);
      sessionStorage.removeItem(SESSION_PERMS_KEY);
      sessionStorage.removeItem(SESSION_PAGES_KEY);
      return [];
    }

    try {
      const res = await fetchUserPermissionApi();
      const perms =
        res?.data?.data?.permissions ||
        res?.data?.permissions ||
        res?.data?.data ||
        [];
      const pagesData = res?.data?.data?.pages || res?.data?.pages || {};

      const permsArray = Array.isArray(perms) ? perms : [];
      setPermissions(permsArray);
      setPages(pagesData && typeof pagesData === "object" ? pagesData : {});
      setPermissionsLoaded(true);

      try {
        sessionStorage.setItem(SESSION_PERMS_KEY, JSON.stringify(permsArray));
        sessionStorage.setItem(SESSION_PAGES_KEY, JSON.stringify(pagesData));
      } catch (e) {
        console.warn("Could not cache permissions to sessionStorage:", e);
      }
      return permsArray;
    } catch (err) {
      console.warn("Permissions API Error:", err?.message || err);
      // Keep existing cached permissions on transient network error
      setPermissionsLoaded(true);
      return [];
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshPermissions();
    } else {
      setPermissions([]);
      setPages({});
      setPermissionsLoaded(true);
    }

    // 🌟 Auto-refresh when network is restored
    const handleOnline = () => {
      if (token) refreshPermissions();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [token, refreshPermissions]);

  // ✅ useCallback + pages check (Bharath) + all roles (merged)
  const hasPermission = useCallback(
    (requiredPermission) => {
      if (!requiredPermission) return true;

      const currentRole = (role || localStorage.getItem("role") || "")
        .toLowerCase()
        .trim();

      if (SUPER_ADMIN_ROLES.includes(currentRole)) return true;

      if (typeof requiredPermission === "string") {
        if (
          pages &&
          pages[requiredPermission] &&
          typeof pages[requiredPermission].can_view === "boolean"
        ) {
          return Boolean(pages[requiredPermission].can_view);
        }
        return permissions.includes(requiredPermission);
      }

      if (Array.isArray(requiredPermission)) {
        return requiredPermission.some((p) => {
          if (pages && pages[p] && typeof pages[p].can_view === "boolean") {
            return Boolean(pages[p].can_view);
          }
          return permissions.includes(p);
        });
      }

      return false;
    },
    [role, pages, permissions],
  );

  // ✅ From Bharath: Granular page-level access helpers
  const canView = useCallback(
    (pageKey) => {
      if (!pageKey) return true;
      const currentRole = (role || localStorage.getItem("role") || "")
        .toLowerCase()
        .trim();
      if (SUPER_ADMIN_ROLES.includes(currentRole)) return true;
      return Boolean(pages?.[pageKey]?.can_view);
    },
    [role, pages],
  );

  const canEdit = useCallback(
    (pageKey) => {
      if (!pageKey) return true;
      const currentRole = (role || localStorage.getItem("role") || "")
        .toLowerCase()
        .trim();
      if (SUPER_ADMIN_ROLES.includes(currentRole)) return true;
      return Boolean(pages?.[pageKey]?.can_edit);
    },
    [role, pages],
  );

  const canAdmin = useCallback(
    (pageKey) => {
      if (!pageKey) return true;
      const currentRole = (role || localStorage.getItem("role") || "")
        .toLowerCase()
        .trim();
      if (SUPER_ADMIN_ROLES.includes(currentRole)) return true;
      return Boolean(pages?.[pageKey]?.can_admin);
    },
    [role, pages],
  );

  const canManage = useCallback(
    (tabKey) => {
      if (!tabKey) return true;
      const currentRole = (role || localStorage.getItem("role") || "")
        .toLowerCase()
        .trim();
      if (SUPER_ADMIN_ROLES.includes(currentRole)) return true;
      return Boolean(pages?.[tabKey]?.can_manage || pages?.[tabKey]?.can_admin);
    },
    [role, pages],
  );

  // ✅ From Bharath: Caches initial perms+pages from login response
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

    const userRole = data?.role || data?.user?.role || data?.user_role || "";

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

    // Cache initial permissions from login response (if provided)
    const initialPerms = data?.permissions || data?.user?.permissions || [];
    const initialPages = data?.pages || data?.user?.pages || {};

    if (Array.isArray(initialPerms) && initialPerms.length > 0) {
      setPermissions(initialPerms);
      try {
        sessionStorage.setItem(SESSION_PERMS_KEY, JSON.stringify(initialPerms));
      } catch (e) {
        console.warn("Could not cache initial permissions:", e);
      }
    }

    if (initialPages && typeof initialPages === "object") {
      setPages(initialPages);
      try {
        sessionStorage.setItem(SESSION_PAGES_KEY, JSON.stringify(initialPages));
      } catch (e) {
        console.warn("Could not cache initial pages:", e);
      }
    }

    // Fetch fresh permissions immediately after login
    refreshPermissions();
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setRole("");
    setPermissions([]);
    setPages({});
    setPermissionsLoaded(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        permissions,
        pages,
        permissionsLoaded,
        hasPermission,
        canView,
        canEdit,
        canAdmin,
        canManage,
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
