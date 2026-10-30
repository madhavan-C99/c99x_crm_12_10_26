import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LOGIN_PATH } from "@/shared/config/env";
import PageLoader from "@/shared/components/layout/PageLoader";

import AdminRoutes from "@/apps/admin/routes/AdminRoutes";
import TelecallingRoutes from "@/apps/telecalling/routes/TelecallingRoutes";

const Login = lazy(() => import("@/shared/pages/login/Login"));

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Admin Application Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Telecalling Application Routes */}
        <Route path="/telecalling/*" element={<TelecallingRoutes />} />

        {/* Integrations settings shortcut */}
        <Route
          path="/settings/integrations"
          element={<Navigate to="/admin/Settings?tab=integrations" replace />}
        />

        {/* Default / Fallbacks */}
        <Route path="/" element={<Navigate to={LOGIN_PATH} replace />} />
        <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
