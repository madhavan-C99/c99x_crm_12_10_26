import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";

import { getCallLogFilterOptions, getCallLogReport } from "@/apps/admin/services/callLogService";

import CallLogHeader from "./Components/Calllogheader";
import CallLogToolbar from "./Components/Calllogtoolbar";
import CallLogTable from "./Components/CallLogTable";

function CallLogReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const campaignId = searchParams.get("campaign_id");
  const initialCampaignName = searchParams.get("campaign_name") || "";

  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [search, setSearch] = useState("");
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // DYNAMIC FILTER STATES
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedCallStatus, setSelectedCallStatus] = useState([]);
  const [selectedCallDirection, setSelectedCallDirection] = useState([]);
  const [panelFilters, setPanelFilters] = useState({});

  const [filterOptionsData, setFilterOptionsData] = useState({
    telecallers: [],
    callStatuses: [],
    callDirections: [],
    campaigns: [],
    courses: [],
    coursePlans: [],
    sources: [],
    paymentStatuses: [],
    priorities: [],
  });

  // 1. LOAD FILTER OPTIONS (Lazily on filter open)
  const optionsFetchedRef = useRef(false);
  const loadSelectOptions = async () => {
    if (optionsFetchedRef.current) return;
    try {
      optionsFetchedRef.current = true;
      const response = await getCallLogFilterOptions();
      if (response.data && response.data.data) {
        const apiData = response.data.data;
        setFilterOptionsData({
          telecallers: apiData.telecallers || [],
          callStatuses: apiData.call_statuses || [],
          callDirections: apiData.call_directions || [],
          campaigns: apiData.campaigns || [],
          courses: apiData.courses || [],
          coursePlans: apiData.course_plans || apiData.plans || [],
          sources: apiData.lead_sources || [],
          paymentStatuses: apiData.payment_statuses || [],
          priorities: apiData.priorities || [],
        });
      }
    } catch (error) {
      console.error("Call log filter options load error:", error);
      optionsFetchedRef.current = false;
    }
  };

  // 2. LOAD CALL LOG DATA
  useEffect(() => {
    async function loadCallLogData() {
      setLoading(true);
      try {
        const queryParams = {
          campaign_id: campaignId || "",
          campaign_name: initialCampaignName || "",
          search: search || "",
          date_range: selectedDate || "",
          assigned_to: Array.isArray(selectedUsers) ? selectedUsers.join(",") : "",
          call_status: Array.isArray(selectedCallStatus) ? selectedCallStatus.join(",") : "",
          call_direction: Array.isArray(selectedCallDirection) ? selectedCallDirection.join(",") : "",
          filter_campaign: panelFilters?.campaignName || "",
          course_name: panelFilters?.courseName || "",
          course_plan: panelFilters?.coursePlan || "",
          lead_source: panelFilters?.leadSource || "",
          priority: panelFilters?.priority || "",
        };

        const response = await getCallLogReport(queryParams);

        if (response.data && response.data.data) {
          setCampaignName(response.data.data.campaign_name || initialCampaignName);
          setTableRows(response.data.data.rows || []);
        }
      } catch (error) {
        console.error("Failed to load call log data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCallLogData();
  }, [
    campaignId,
    initialCampaignName,
    search,
    selectedDate,
    selectedUsers,
    selectedCallStatus,
    selectedCallDirection,
    panelFilters,
  ]);

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", p: 2 }}>
      <CallLogHeader
        title={`Call Log - ${campaignName}`}
        onBack={() => navigate(-1)}
        onLeadSummary={() =>
          navigate(`/admin/lead-summary-report?campaign_id=${campaignId}&campaign_name=${campaignName}`)
        }
      />

      <CallLogToolbar
        search={search}
        onSearchChange={setSearch}
        onFetchOptions={loadSelectOptions}
        filterDropdownOptions={filterOptionsData}
        telecallers={filterOptionsData.telecallers}
        callStatusOptions={filterOptionsData.callStatuses}
        callDirectionOptions={filterOptionsData.callDirections}
        selectedDate={selectedDate}
        selectedUsers={selectedUsers}
        selectedCallStatus={selectedCallStatus}
        selectedCallDirection={selectedCallDirection}
        appliedPanelFilters={panelFilters}
        onDateApply={(val) => setSelectedDate(val)}
        onUserApply={(vals) => setSelectedUsers(vals)}
        onCallStatusApply={(vals) => setSelectedCallStatus(vals)}
        onCallDirectionApply={(vals) => setSelectedCallDirection(vals)}
        onFilterApply={(filterData) => setPanelFilters(filterData)}
      />

      <CallLogTable rows={tableRows} loading={loading} />
    </Box>
  );
}

export default CallLogReport;