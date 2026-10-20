import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/shared/components/layout/ProtectedRoute";

// Layout
import MainLayout from "../layouts/MainLayout";

// Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Pipeline from "../pages/Pipeline/Pipeline";
import EnquirySheet from "../pages/Pipeline/views/EnquirySheet";
import LeadSummaryReport from "../pages/LeadSummaryReport/LeadSummaryReport";
import CallLogReport from "../pages/Pipeline/views/CallLogReport";
import DispositionLog from "../pages/Pipeline/views/DispositionLog";
import EditCampaign from "../pages/Pipeline/views/EditCampaign";
import Leads from "../pages/Leads/Leads";
import PendingPayment from "../pages/PendingPayments/PendingPayment";
import LossLeadApproval from "../pages/LossLeadApproval/LossLeadApproval";
import Performance from "../pages/Performance/Performance";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";

function AdminRoutes() {
  return (
    <Routes>
      {/* Main Admin Layout */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin", "super_admin"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="Educatiionpipeline" element={<Pipeline />} />
        <Route path="enquiry-sheet/:campaignId" element={<EnquirySheet />} />
        <Route path="lead-summary-report" element={<LeadSummaryReport />} />
        <Route path="call-log-report" element={<CallLogReport />} />
        <Route path="disposition-log-report" element={<DispositionLog />} />
        <Route path="edit-campaign" element={<EditCampaign />} />

        {/* ✅ Leads Routes */}
        <Route path="Lead" element={<Navigate to="/admin/Leads" replace />} />
        <Route path="Leads" element={<Leads />} />
        <Route path="PendingPayments" element={<PendingPayment />} />
        <Route path="LossLeadApproval" element={<LossLeadApproval />} />
        <Route path="Performance" element={<Performance />} />
        <Route path="Reports" element={<Reports />} />
        <Route path="Settings" element={<Settings />} />
      </Route>

      {/* Default redirect */}
      <Route
        path="*"
        element={<Navigate to="/admin/pipeline" replace />}
      />
    </Routes>
  );
}

export default AdminRoutes;
