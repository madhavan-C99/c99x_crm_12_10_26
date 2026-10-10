import api from "@/shared/services/axios";

// 1. Fetch Performance Overview Data (Top Performers + Summary + Table list)

export const fetchAdminPerformanceOverview = (payload = {}) => {
  const defaultPayload = {
    team_id: 0,
    date_filter_type: "monthly",
    from_date: "",
    to_date: "",
    search: "",
    page: 1,
    page_size: 25,
    ...payload,
  };
  return api.post("/adm/fetch_performance_overview_admin", defaultPayload);
};

// 2. Fetch Performance Filter Dropdowns (Teams + Date Filters)

import { getSelectOptions } from "@/apps/admin/services/dropdownService";

export const fetchPerformanceFilterDropdowns = async () => {
  const [teams, telecallers] = await Promise.all([
    getSelectOptions("L_TEAMS"),
    getSelectOptions("L_TELECALLERS"),
  ]);

  return {
    data: {
      teams,
      telecallers,
    },
  };
};

// 3. Export Performance Overview Report (Excel / CSV file Blob)

export const exportPerformanceOverviewFile = (payload = {}) => {
  return api.post("/adm/export_data_api", payload);
};
