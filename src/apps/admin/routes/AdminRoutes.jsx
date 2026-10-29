import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute, {
  ADMIN_ROLES,
} from "@/shared/components/layout/ProtectedRoute";

// Layout
import MainLayout from "../layouts/MainLayout";

// Lazy-loaded Pages (Code Splitting for instant initial load)
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Pipeline = lazy(() => import("../pages/Pipeline/Pipeline"));
const EnquirySheet = lazy(() => import("../pages/Pipeline/views/EnquirySheet"));
const LeadSummaryReport = lazy(() => import("../pages/LeadSummaryReport/LeadSummaryReport"));
const CallLogReport = lazy(() => import("../pages/Pipeline/views/CallLogReport"));
const DispositionLog = lazy(() => import("../pages/Pipeline/views/DispositionLog"));
const EditCampaign = lazy(() => import("../pages/Pipeline/views/EditCampaign"));
const Leads = lazy(() => import("../pages/Leads/Leads"));
const PendingPayment = lazy(() => import("../pages/PendingPayments/PendingPayment"));
const LossLeadApproval = lazy(() => import("../pages/LossLeadApproval/LossLeadApproval"));
const Performance = lazy(() => import("../pages/Performance/Performance"));
const Reports = lazy(() => import("../pages/Reports/Reports"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
import { SETTINGS_TABS } from "../components/settings/SettingTabs";

const SETTINGS_PERMISSIONS = SETTINGS_TABS.map((t) => t.permission).filter(
  Boolean,
);

function AdminRoutes() {
  return (
    <Routes>
      {/* Main Admin Layout */}
      <Route
        element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="pipeline"
          element={
            <ProtectedRoute permission="api_education_pipeline_stats_admin">
              <Pipeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="Educatiionpipeline"
          element={
            <ProtectedRoute permission="api_education_pipeline_stats_admin">
              <Pipeline />
            </ProtectedRoute>
          }
        />
        <Route path="enquiry-sheet/:campaignId" element={<EnquirySheet />} />
        <Route path="lead-summary-report" element={<LeadSummaryReport />} />
        <Route path="call-log-report" element={<CallLogReport />} />
        <Route path="disposition-log-report" element={<DispositionLog />} />
        <Route path="edit-campaign" element={<EditCampaign />} />

        {/* ✅ Leads & Module Routes with RBAC Permission Protection */}
        <Route path="Lead" element={<Navigate to="/admin/Leads" replace />} />
        <Route
          path="Leads"
          element={
            <ProtectedRoute permission="api_fetch_all_leads_admin">
              <Leads />
            </ProtectedRoute>
          }
        />
        <Route
          path="PendingPayments"
          element={
            <ProtectedRoute permission="api_fetch_all_pending_payments_admin">
              <PendingPayment />
            </ProtectedRoute>
          }
        />
        <Route
          path="LossLeadApproval"
          element={
            <ProtectedRoute permission="api_fetch_loss_lead_approval_requests_admin">
              <LossLeadApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="Performance"
          element={
            <ProtectedRoute permission="api_fetch_performance_overview_admin">
              <Performance />
            </ProtectedRoute>
          }
        />
        <Route
          path="Reports"
          element={
            <ProtectedRoute permission="api_lead_summary_report_admin">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="Settings"
          element={
            <ProtectedRoute permission={SETTINGS_PERMISSIONS}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="admin/dashboard" replace />} />
    </Routes>
  );
}

export default AdminRoutes;
