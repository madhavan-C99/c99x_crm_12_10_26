import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

import DispositionHeader from "./components/DispositionHeader";
import DispositionToolbar from "./components/DispositionToolbar";
import DispositionTable from "./components/DispositionTable";

import { getDispositionLogReport } from "../../services/dispositionService";
import { getFilterOptions } from "../../services/leadSummaryService";

export default function DispositionLog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const campaignId = searchParams.get("campaign_id");
  const initialCampaignName = searchParams.get("campaign_name") || "Education";

  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [panelFilters, setPanelFilters] = useState({});

  // Filter dropdown data
  const [filterOptionsData, setFilterOptionsData] = useState({
    telecallers: [],
    stagesOptions: [],
  });

  const optionsFetchedRef = useRef(false);
  const loadOptions = async () => {
    if (optionsFetchedRef.current) return;
    try {
      optionsFetchedRef.current = true;
      const res = await getFilterOptions();
      if (res.data && res.data.data) {
        setFilterOptionsData({
          telecallers: res.data.data.telecallers || [],
          stagesOptions: res.data.data.pipeline_stages || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
      optionsFetchedRef.current = false;
    }
  };

  useEffect(() => {
    async function loadDispositionData() {
      try {
        setLoading(true);
        const payload = {
          campaign_id: campaignId || null,
          campaign_name: initialCampaignName,
          search: search || null,
          date_range: selectedDate || null,
          assigned_to: selectedUsers.length > 0 ? selectedUsers.join(",") : null,
          stages: selectedStages.length > 0 ? selectedStages.join(",") : null,
          ...panelFilters,
        };

        const response = await getDispositionLogReport(payload);
        if (response.data && response.data.data) {
          setCampaignName(response.data.data.campaign_name || initialCampaignName);
          setTableRows(response.data.data.rows || []);
        }
      } catch (error) {
        console.error("Failed to load disposition log data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDispositionData();
  }, [
    campaignId,
    initialCampaignName,
    search,
    selectedDate,
    selectedUsers,
    selectedStages,
    panelFilters,
  ]);

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", p: 2 }}>
      <DispositionHeader
        title={`Disposition Log - ${campaignName}`}
        onBack={() => navigate(-1)}
      />

      <DispositionToolbar
        search={search}
        onSearchChange={setSearch}
        onFetchOptions={loadOptions}
        filterDropdownOptions={filterOptionsData}
        telecallers={filterOptionsData.telecallers}
        stagesOptions={filterOptionsData.stagesOptions}
        selectedDate={selectedDate}
        selectedUsers={selectedUsers}
        selectedStages={selectedStages}
        appliedPanelFilters={panelFilters}
        onDateApply={(val) => setSelectedDate(val)}
        onUserApply={(vals) => setSelectedUsers(vals)}
        onStageApply={(vals) => setSelectedStages(vals)}
        onFilterApply={(filterData) => setPanelFilters(filterData)}
      />

      <DispositionTable rows={tableRows} loading={loading} />
    </Box>
  );
}
