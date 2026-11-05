import api from "@/shared/services/axios";
import dropdownService from "./dropdownService";
import { fetchAllTeamsAdmin } from "./teamService";

/**
 * Fetch monthly target dashboard data (summary stats, charts, team/individual progress tables)
 * Endpoint: POST /adm/fetch_monthly_target_admin
 */
export const fetchMonthlyTargetAdmin = async (params = {}) => {
  const payload = {
    month: params.month || undefined,
    from_date: params.from_date || params.fromDate || undefined,
    to_date: params.to_date || params.toDate || undefined,
  };
  return await api.post("/adm/fetch_monthly_target_admin", payload);
};

/**
 * Fetch dropdown options for Set Target modal (teams & employees)
 * Enriches teams with real member lists from fetchAllTeamsAdmin
 */
export const fetchTargetDropdownsAdmin = async () => {
  const [teamsDropdown, employees, allTeamsRes] = await Promise.all([
    dropdownService.getSelectOptions("L_TEAMS").catch(() => []),
    dropdownService.getSelectOptions("L_TELECALLERS").catch(() => []),
    fetchAllTeamsAdmin().catch(() => null),
  ]);

  let fullTeamsList = [];
  if (allTeamsRes?.data) {
    const raw = allTeamsRes.data;
    const inner = raw.data || raw.teams || raw.team_list || raw.results || raw;
    if (Array.isArray(inner)) fullTeamsList = inner;
    else if (Array.isArray(inner.data)) fullTeamsList = inner.data;
    else if (Array.isArray(inner.teams)) fullTeamsList = inner.teams;
  }

  const rawTeams =
    Array.isArray(teamsDropdown) && teamsDropdown.length > 0
      ? teamsDropdown
      : fullTeamsList;

  const enrichedTeams = rawTeams.map((t) => {
    const tName =
      typeof t === "object" ? t.name || t.team || t.team_name || t.label : String(t);
    const tId = typeof t === "object" ? t.id || t.value : null;

    const matched = fullTeamsList.find((ft) => {
      if (tId && ft.id && String(ft.id) === String(tId)) return true;
      const ftName = ft.name || ft.team_name || ft.team || "";
      return Boolean(
        ftName && tName && ftName.toLowerCase() === tName.toLowerCase()
      );
    });

    if (matched) {
      return {
        ...(typeof t === "object" ? t : { id: t, name: t, label: t }),
        ...matched,
        name: tName || matched.name,
        label: tName || matched.name,
        members:
          matched.members ||
          matched.employees ||
          matched.users ||
          matched.member_ids ||
          matched.rawMembers ||
          [],
      };
    }
    return t;
  });

  return {
    data: {
      teams: enrichedTeams.length > 0 ? enrichedTeams : fullTeamsList,
      employees,
    },
  };
};

/**
 * Set / Create Monthly Target (Team or Individual)
 * Endpoint: POST /adm/set_monthly_target_admin
 */
export const setMonthlyTargetAdmin = async (payload = {}) => {
  const data = {
    month: payload.month || "",
    from_date: payload.from_date || payload.fromDate || undefined,
    to_date: payload.to_date || payload.toDate || undefined,
    target_for: payload.target_for || payload.targetFor || "Team",
    team_id:
      payload.team_id !== undefined &&
      payload.team_id !== null &&
      payload.team_id !== ""
        ? Number(payload.team_id)
        : null,
    team_name: payload.team_name || payload.teamName || null,
    employee_id:
      payload.employee_id !== undefined &&
      payload.employee_id !== null &&
      payload.employee_id !== ""
        ? Number(payload.employee_id)
        : null,
    lead_target: Number(payload.lead_target || payload.leadTarget || 0),
    amount_target: Number(payload.amount_target || payload.amountTarget || 0.0),
    target_calls: Number(payload.target_calls || payload.targetCalls || 0),
    individual_allocations: Array.isArray(payload.individual_allocations)
      ? payload.individual_allocations
      : [],
  };
  return await api.post("/adm/set_monthly_target_admin", data);
};
