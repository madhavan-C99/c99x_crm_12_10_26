import { Routes, Route, Navigate } from "react-router-dom";
import { LOGIN_PATH } from "@/shared/config/env";

import AdminRoutes from "@/apps/admin/routes/AdminRoutes";
import TelecallingRoutes from "@/apps/telecalling/routes/TelecallingRoutes";

function AppRouter() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/telecalling/*" element={<TelecallingRoutes />} />
      <Route
        path="/settings/integrations"
        element={<Navigate to="/admin/Settings?tab=integrations" replace />}
      />
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
}

export default AppRouter;
