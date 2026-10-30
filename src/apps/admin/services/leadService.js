import api from "@/shared/services/axios";
import { getSelectOptions } from "./dropdownService";

// 1. Fetch all leads & count stats
export const getLeadData = (payload) => {
  return api.post("/adm/fetch_all_leads_admin", payload);
};

// 2. Fetch dropdown select options for admin filter popup (/adm/get_filter_dropdowns_admin)
export const getLeadSelectOptions = async (optFilter = null) => {
  const hasCourseSelected = Boolean(optFilter?.course_id || null);

  const [
    stages,
    sources,
    campaigns,
    courses,
    plans,
    telecallers,
    courseTimes,
    categories,
  ] = await Promise.all([
    getSelectOptions("L_STAGES", optFilter),
    getSelectOptions("L_LEAD_SOURCES", optFilter),
    getSelectOptions("L_CAMPAIGN_NAMES", optFilter),
    getSelectOptions("L_COURSE_NAMES", optFilter),
    getSelectOptions("L_COURSE_PLANS", optFilter).catch(() => []),
    getSelectOptions("L_TELECALLERS", optFilter?.campaign_id ? { campaign_id: Number(optFilter.campaign_id) } : null),
    getSelectOptions("L_COURSE_TIMES", optFilter).catch(() => []),
    getSelectOptions("L_CATEGORIES", optFilter),
  ]);

  let courseNames = courses.length > 0 ? courses : (hasCourseSelected ? await getSelectOptions("L_COURSES", optFilter).catch(() => []) : []);
  let coursePlans = plans.length > 0 ? plans : await getSelectOptions("L_COURSE_PLANS", optFilter).catch(() => []);

  return {
    data: {
      stages,
      categories,
      sources,
      campaigns,
      courses: courseNames,
      course_plans: coursePlans,
      telecallers,
      course_times: courseTimes,
    },
  };
};

// 3. Add new lead (Exact Endpoint: /adm/add_new_lead_admin)
export const createLead = (payload) => {
  return api.post("/adm/add_new_lead_admin", payload);
};

// 4. Upload Excel / CSV file for bulk leads
export const uploadLeadsExcel = async (formData) => {
  return await api.post("/adm/upload_lead_excel_admin", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 4b. Verify lead records with backend (/adm/verify_lead_import)
export const verifyLeadImport = async (payload) => {
  return await api.post("/adm/verify_lead_import", payload);
};

// 4c. Submit & save imported leads (/adm/submit_lead_import)
export const submitLeadImport = async (payload) => {
  return await api.post("/adm/submit_lead_import", payload);
};

export const verifyUploadLeads = async (payload) => {
  return await api.post("/adm/verify_lead_import", payload);
};

// 5. Fetch pipeline kanban board leads (/adm/fetch_pipeline_leads_admin)
export const getPipelineLeads = async (payload) => {
  return await api.post("/adm/fetch_pipeline_leads_admin", payload);
};

// 6. Update lead stage / status
export const updateLeadStage = async (payload) => {
  return await api.post("/adm/update_lead_stage", payload);
};

// 7. Export leads Excel report (Exact Endpoint: /adm/export_all_leads_admin)
export const exportLeads = (payload) => {
  return api.post("/adm/export_data_api", payload);
};

// 8. Fetch single lead details & timeline history (/adm/fetch_lead_details_admin)
export const getLeadDetail = async (payload) => {
  const targetId = payload?.lead_id ?? payload?.id ?? payload;
  const formData = new FormData();
  formData.append("lead_id", targetId);
  return await api.post("/adm/fetch_lead_details_admin", formData);
};

// 9. Fetch Mark as Won Info for modal (/adm/get_mark_as_won_info_admin)
export const getMarkAsWonInfo = async (payload) => {
  return await api.post("/adm/get_mark_as_won_info_admin", payload);
};

// 10. Submit Mark as Won form data (/adm/mark_as_won_admin)
export const submitMarkAsWon = async (payload) => {
  return await api.post("/adm/mark_as_won_admin", payload);
};

// 11. Fetch Mark as Loss Info for modal (/adm/get_mark_as_lost_info_admin)
export const getMarkAsLostInfo = async (payload) => {
  return await api.post("/adm/get_mark_as_lost_info_admin", payload);
};

// 12. Submit Mark as Loss form data (/adm/mark_as_lost_admin)
export const submitMarkAsLost = async (payload) => {
  return await api.post("/adm/mark_as_lost_admin", payload);
};

// 13. Submit Edit Lead form data
export const editLead = async (payload) => {
  return await api.post("/adm/edit_lead_admin", payload);
};

// 14. Fetch Loss Lead Approval Requests (/adm/fetch_loss_lead_approval_requests_admin)
export const fetchLossLeadApprovalRequests = async (payload = {}) => {
  return await api.post("/adm/fetch_loss_lead_approval_requests_admin", payload);
};

// 15. Export Loss Lead Approval Requests (/adm/export_data_api)
export const exportLossLeadApprovalRequests = async (payload = {}) => {
  return await api.post("/adm/export_data_api", payload);
};

// 16. Fetch Loss Lead Approval Filter Dropdowns (/adm/get_filter_dropdowns_admin)
export const fetchLossLeadApprovalFilterDropdowns = async (selectedPipeline = null) => {
  const optFilter = selectedPipeline ? { pipeline_id: Number(selectedPipeline) } : null;

  const [telecallers, reasons, sources] = await Promise.all([
    getSelectOptions("L_TELECALLERS", optFilter?.campaign_id ? { campaign_id: Number(optFilter.campaign_id) } : null),
    getSelectOptions("L_LOSS_REASONS", optFilter),
    getSelectOptions("L_LEAD_SOURCES", optFilter),
  ]);

  return {
    data: {
      telecallers,
      loss_reasons: reasons,
      lead_sources: sources,
    },
  };
};

// 17. Action Loss Lead Approval (/adm/action_loss_lead_approval_admin) - Approve / Reject / Reassign
export const actionLossLeadApproval = async (payload = {}) => {
  return await api.post("/adm/action_loss_lead_approval_admin", payload);
};

// 18. Delete Lead Admin (/adm/delete_lead_admin)
export const deleteLead = async (payload) => {
  const targetId = Number(payload?.lead_id ?? payload?.id ?? payload);
  const jsonPayload = {
    lead_id: targetId,
    id: targetId,
    user_id: payload?.user_id || payload?.user || undefined,
    user: payload?.user || payload?.user_id || undefined,
  };

  return await api.post("/adm/delete_lead_admin", jsonPayload);
};

// 19. Reassign Lead Admin (/adm/reassign_lead_admin)
export const reassignLead = async (payload) => {
  const cleanPayload = {
    lead_id: Number(payload?.lead_id || payload?.id),
    previous_telecaller_id: Number(
      payload?.previous_telecaller_id ??
      payload?.old_telecaller_id ??
      payload?.assigned_to_id ??
      0
    ),
    new_telecaller_id: Number(
      payload?.new_telecaller_id ??
      payload?.telecaller_id ??
      payload?.assigned_to ??
      0
    ),
  };
  return await api.post("/adm/reassign_lead_admin", cleanPayload);
};
