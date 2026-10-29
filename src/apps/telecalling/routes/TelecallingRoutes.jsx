import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import CallTimerPopup from "@/apps/telecalling/components/CallTimerPopup/CallTimerPopup";
import PageLoader from "@/shared/components/layout/PageLoader";
import ProtectedRoute, { ADMIN_ROLES } from "@/shared/components/layout/ProtectedRoute";
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
            <ProtectedRoute blockedRoles={ADMIN_ROLES}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pending-payments" element={<ProtectedRoute permission="api_fetch_all_payment"><PendingPayments /></ProtectedRoute>} />
          <Route path="lead" element={<ProtectedRoute permission="api_fetch_all_leads"><Leads /></ProtectedRoute>} />
          <Route path="pipeline" element={<ProtectedRoute permission="api_fetch_pipeline_lead"><Pipeline /></ProtectedRoute>} />
          <Route path="lead-details/:id" element={<LeadDetails />} />
          <Route path="report" element={<ProtectedRoute permission="api_daily_report_api"><DailyReport /></ProtectedRoute>} />
          <Route path="settings" element={<Settings />} />

        </Route>
      </Routes>
      </Suspense>
    </>
  );
}

export default TelecallingRoutes;
