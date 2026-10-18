import api from "../../../shared/services/axios";
import { getSelectOptions } from "./dropdownService";

// 🌟 1. Fetch Call Log Dropdown Filter Options using standardized /adm/get_select_options
export const getCallLogFilterOptions = async (optFilter = null) => {
  try {
    const [
      telecallers,
      campaigns,
      courseNames,
      coursePlans,
      sources,
      paymentStages,
      tags,
      callStatuses,
      callDirections,
    ] = await Promise.all([
      getSelectOptions("L_TELECALLERS", optFilter).catch(() => []),
      getSelectOptions("L_CAMPAIGN_NAMES", optFilter).catch(() => []),
      getSelectOptions("L_COURSE_NAMES", optFilter).catch(() => []),
      getSelectOptions("L_COURSE_PLANS", optFilter).catch(() => []),
      getSelectOptions("L_LEAD_SOURCES", optFilter).catch(() => []),
      getSelectOptions("L_PAYMENT_STAGES", optFilter).catch(() => []),
      getSelectOptions("L_TAGS", optFilter).catch(() => []),
      getSelectOptions("L_CALL_STATUSES", optFilter).catch(() => []),
      getSelectOptions("L_CALL_DIRECTIONS", optFilter).catch(() => []),
    ]);

    let courses =
      courseNames.length > 0
        ? courseNames
        : await getSelectOptions("L_COURSES", optFilter).catch(() => []);

    return {
      data: {
        data: {
          telecallers,
          campaigns,
          courses,
          course_plans: coursePlans,
          lead_sources: sources,
          payment_stages: paymentStages,
          payment_statuses: paymentStages,
          tags,
          priorities: tags,
          call_statuses: callStatuses,
          call_directions: callDirections,
        },
      },
    };
  } catch (error) {
    console.error("Failed to load call log options via dropdown service:", error);
    return {
      data: {
        data: {},
      },
    };
  }
};

// 🌟 2. Fetch Call Log Report Table Data with Filters
export const getCallLogReport = async (params = {}) => {
  return api.post("/adm/call_log_report", params);
};
