import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PageLoader from "@/shared/components/layout/PageLoader";
import { LOGIN_PATH } from "@/shared/config/env";

// Each app is its own chunk - an admin never downloads telecalling code and vice versa.
const AdminRoutes = lazy(() => import("@/apps/admin/routes/AdminRoutes"));
const TelecallingRoutes = lazy(() => import("@/apps/telecalling/routes/TelecallingRoutes"));

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/telecalling/*" element={<TelecallingRoutes />} />
        <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
