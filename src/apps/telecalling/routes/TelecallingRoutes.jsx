import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import CallTimerPopup from "@/apps/telecalling/components/CallTimerPopup/CallTimerPopup";
import PageLoader from "@/shared/components/layout/PageLoader";
import ProtectedRoute from "@/shared/components/layout/ProtectedRoute";
import MainLayout from "@/apps/telecalling/layouts/MainLayout";

const Dashboard = lazy(() => import("@/apps/telecalling/pages/dashboard/Dashboard"));
const Login = lazy(() => import("@/apps/telecalling/pages/login/Login"));
const PendingPayments = lazy(() => import("@/apps/telecalling/pages/pendingPayment/PendingPayment"));
const Leads = lazy(() => import("@/apps/telecalling/pages/leads/Leads"));
const Pipeline = lazy(() => import("@/apps/telecalling/pages/pipeline/Pipeline"));
const LeadDetails = lazy(() => import("@/apps/telecalling/pages/leadDetails/LeadDetails"));
const DailyReport = lazy(() =>
  import("@/apps/telecalling/pages/dailyReport/DailyReport").then((m) => ({ default: m.DailyReport })),
);

const Settings = lazy(() =>
  import("@/apps/telecalling/pages/setting/SettingsPage").then((m) => ({
    default: m.SettingsPage || m.default,
  }))
);

function TelecallingRoutes() {
  return (
    <>
      <CallTimerPopup />

      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute blockedRoles={["admin", "superadmin", "super_admin"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pending-payments" element={<PendingPayments />} />
          <Route path="lead" element={<Leads />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="lead-details/:id" element={<LeadDetails />} />
          <Route path="report" element={<DailyReport />} />
          <Route path="settings" element={<Settings />} />

        </Route>
      </Routes>
      </Suspense>
    </>
  );
}

export default TelecallingRoutes;
