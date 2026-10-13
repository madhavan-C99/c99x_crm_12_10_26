import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/shared/components/layout/ProtectedRoute";

// Layout
import MainLayout from "../layouts/MainLayout";

// Pages
import Educatiionpipeline from "../pages/Educatiionpipeline/Educatiionpipeline";
import EnquirySheet from "../pages/EnquirySheet/EnquirySheet";
import LeadSummaryReport from "../pages/LeadSummaryReport/LeadSummaryReport";
import CallLogReport from "../pages/CallLogReport/Calllogreport";
import DispositionLog from "../pages/DispositionLog/DispositionLog";
import EditCampaign from "../pages/EnquirySheet/components/EditCampaign";
import EditEnquiryForm from "../pages/EnquirySheet/components/EditEnquiryForm";
import Leads from "../pages/Leads/Leads";
import PendingPayment from "../pages/PendingPayments/PendingPayment";
import LossLeadApproval from "../pages/LossLeadApproval/LossLeadApproval";
import Performance from "../pages/Performance/Performance";
import Reports from "../pages/Reports/Reports";
import  Settings  from "../pages/Settings/Settings";

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
        <Route index element={<Navigate to="/admin/Educatiionpipeline" replace />} />
        <Route path="dashboard" element={<Navigate to="/admin/Educatiionpipeline" replace />} />
        <Route path="Educatiionpipeline" element={<Educatiionpipeline />} />
        <Route path="enquiry-sheet/:campaignId" element={<EnquirySheet />} />
        <Route path="lead-summary-report" element={<LeadSummaryReport />} />
        <Route path="call-log-report" element={<CallLogReport />} />
        <Route path="disposition-log-report" element={<DispositionLog />} />
        <Route path="edit-campaign" element={<EditCampaign />} />
        <Route path="edit-enquiry-form" element={<EditEnquiryForm />} />

        {/* ✅ Leads Routes */}

        <Route path="Lead" element={<Navigate to="/admin/Leads" replace />} />
        <Route path="Leads" element={<Leads />} />
        <Route path="PendingPayments" element={<PendingPayment />} />
        <Route path="LossLeadApproval" element={<LossLeadApproval />} />
        <Route path="Performance" element={<Performance />} />
        <Route path="Reports" element={<Reports />} />
        <Route path="Settings" element={<Settings/>}/>
      </Route>

      {/* Default redirect */}
      <Route
        path="*"
        element={<Navigate to="/admin/Educatiionpipeline" replace />}
      />
    </Routes>
  );
}

export default AdminRoutes;