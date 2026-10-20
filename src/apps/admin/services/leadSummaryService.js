import api from "../../../shared/services/axios";
import { getSelectOptions } from "./dropdownService";

// 🌟 1. Fetch Dropdown Filter Options using standardized /adm/get_select_options
export const getFilterOptions = async (optFilter = null) => {
  try {
    const [
      stages,
      sources,
      campaigns,
      courseNames,
      coursePlans,
      telecallers,
      paymentStages,
      tags,
      categories,
    ] = await Promise.all([
      getSelectOptions("L_STAGES", optFilter).catch(() => []),
      getSelectOptions("L_LEAD_SOURCES", optFilter).catch(() => []),
      getSelectOptions("L_CAMPAIGN_NAMES", optFilter).catch(() => []),
      getSelectOptions("L_COURSE_NAMES", optFilter).catch(() => []),
      getSelectOptions("L_COURSE_PLANS", optFilter).catch(() => []),
      getSelectOptions("L_TELECALLERS", optFilter).catch(() => []),
      getSelectOptions("L_PAYMENT_STAGES", optFilter).catch(() => []),
      getSelectOptions("L_TAGS", optFilter).catch(() => []),
      getSelectOptions("L_CATEGORIES", optFilter).catch(() => []),
    ]);

    let courses =
      courseNames.length > 0
        ? courseNames
        : await getSelectOptions("L_COURSES", optFilter).catch(() => []);

    return {
      data: {
        data: {
          stages,
          sources,
          lead_sources: sources,
          campaigns,
          courses,
          course_plans: coursePlans,
          telecallers,
          tags,
          priorities: tags,
          payment_stages: paymentStages,
          payment_statuses: paymentStages,
          categories,
        },
      },
    };
  } catch (error) {
    console.error("Failed to load filter options via dropdown service:", error);
    return {
      data: {
        data: {},
      },
    };
  }
};

// 🌟 2. Fetch Lead Summary Report Table Data with Filters
export const getLeadSummaryReport = async (params = {}) => {
  return api.post("/adm/lead_summary_report", params);
};

// 🌟 3. Bulk Delete Lead Summary Records (POST Method)
export const deleteLeadSummary = async (target) => {
  if (Array.isArray(target)) {
    return api.post("/adm/delete_lead_summary", { lead_ids: target });
  }
  if (typeof target === "object" && target !== null) {
    return api.post("/adm/delete_lead_summary", target);
  }
  return api.post("/adm/delete_lead_summary", { lead_id: target });
};

// 🌟 4. Bulk Move Leads to Another Campaign (POST Method)
export const moveLeadCampaign = async (payload) => {
  return api.post("/adm/move_lead_campaign", payload);
};

// 🌟 5. Bulk Assign Leads to Telecaller (POST Method)
export const assignLeadTelecaller = async (payload) => {
  return api.post("/adm/assign_lead_telecaller", payload);
};

// 🌟 6. Bulk Change Lead Status (POST Method)
export const changeLeadStatus = async (payload) => {
  return api.post("/adm/change_lead_status", payload);
};
