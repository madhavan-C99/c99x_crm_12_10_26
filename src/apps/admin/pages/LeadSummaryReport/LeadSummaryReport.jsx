import ExportModal from "@/apps/admin/components/common/ExportModal";
import { getSelectOptions, invalidateSelectOptions } from "@/apps/admin/services/dropdownService";
import { createExport, triggerDirectFileDownload } from "@/apps/admin/services/exportService";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";
import { toast } from "react-toastify";

// 🌟 IMPORTING FROM ADMIN SERVICES (FOLLOWING YOUR PROJECT STRUCTURE)
import {
  getFilterOptions,
  getLeadSummaryReport,
  deleteLeadSummary,
  moveLeadCampaign,
  assignLeadTelecaller,
  changeLeadStatus,
} from "@/apps/admin/services/leadSummaryService";

import LeadSummaryHeader from "@/apps/admin/components/leadSummaryReport/LeadSummaryHeader";
import LeadSummaryToolbar from "@/apps/admin/components/leadSummaryReport/LeadSummaryToolbar";
import LeadSummaryTable from "@/apps/admin/components/leadSummaryReport/LeadSummaryTable";
// 🌟 LEAD HISTORY MODAL — view lead history modal popup
import LeadHistoryModal from "@/apps/admin/components/leadSummaryReport/LeadHistoryModal";
// 🌟 MOVE CAMPAIGN MODAL — move leads to another campaign modal popup
import MoveCampaignModal from "@/apps/admin/components/leadSummaryReport/MoveCampaignModal";
// 🌟 ASSIGN TELECALLER MODAL — assign leads to telecaller modal popup
import AssignTelecallerModal from "@/apps/admin/components/leadSummaryReport/AssignTelecallerModal";
// 🌟 CHANGE LEAD STATUS MODAL — bulk change lead status modal popup
import ChangeStatusModal from "@/apps/admin/components/leadSummaryReport/ChangeStatusModal";
// 🌟 BULK DELETE MODAL — bulk delete leads modal popup with confirmation
import BulkDeleteModal from "@/apps/admin/components/leadSummaryReport/BulkDeleteModal";

function LeadSummaryReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const campaignId = searchParams.get("campaign_id");
  const initialCampaignName = searchParams.get("campaign_name") || "";
  const pipelineIdParam = searchParams.get("pipeline_id");
  const savedPipelineId = sessionStorage.getItem("admin_pipeline_selected");
  const effectivePipelineId = pipelineIdParam || savedPipelineId;

  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const leadSummaryExportColumns = [
    { id: "lead_name", backendKey: "lead_name", label: "Lead Name" },
    { id: "lead_number", backendKey: "lead_number", label: "Lead Number" },
    { id: "email", backendKey: "email", label: "Email ID" },
    { id: "campaign_name", backendKey: "campaign_name", label: "Campaign Name" },
    { id: "lead_source", backendKey: "lead_source", label: "Lead Source" },
    { id: "creation_date", backendKey: "creation_date", label: "Creation Date" },
    { id: "updated_at", backendKey: "updated_at", label: "Updated at" },
    { id: "lead_stage", backendKey: "lead_stage", label: "Lead Stage" },
    { id: "tag", backendKey: "tag", label: "Tag" },
    { id: "assigned_to", backendKey: "assigned_to", label: "Assigned to" },
    { id: "followup_time", backendKey: "followup_time", label: "Follow up Time" },
    { id: "lead_status", backendKey: "lead_status", label: "Lead Status" },
    { id: "deal_amount", backendKey: "deal_amount", label: "Deal Amount" },
    { id: "last_contacted", backendKey: "last_contacted", label: "Last Contacted" },
    { id: "call_attempt_count", backendKey: "call_attempt_count", label: "Call Attempt Count" },
  ];

  const handleExportSubmit = async ({ fileFormat, selectedKeys }) => {
    try {
      setExportLoading(true);
      const payload = {
        entity: "lead_summary",
        report_key: "lead_summary_report",
        export_format: fileFormat === "xlsx" ? "excel" : fileFormat,
        selected_columns: selectedKeys,
        filters: {
          search,
          selected_date: computedDateRange || "",
          users: selectedUsers,
          stages: selectedStages,
          panel_filters: panelFilters,
          pipeline_id: effectivePipelineId || null,
        },
      };
      const res = await createExport(payload);
      const resData = res?.data || res;
      const downloadUrl = resData?.download_url || res?.download_url || resData?.file_url;
      if (downloadUrl) {
        await triggerDirectFileDownload(downloadUrl, `Lead_Summary_Report.${fileFormat}`);
        toast.success(resData?.message || "Lead Summary exported successfully!");
      } else {
        toast.info(resData?.message || "Export request received.");
      }
    } catch (err) {
      console.error("Lead summary export error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Export failed.");
    } finally {
      setExportLoading(false);
      setIsExportModalOpen(false);
    }
  };

  // DYNAMIC FILTER STATES
  const [selectedDate, setSelectedDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [panelFilters, setPanelFilters] = useState({});

  // 🌟 VIEW LEAD HISTORY MODAL STATE
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [leadBeingViewed, setLeadBeingViewed] = useState(null);

  // 🌟 MOVE CAMPAIGN MODAL STATE
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  // 🌟 ASSIGN TELECALLER MODAL STATE
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // 🌟 CHANGE LEAD STATUS MODAL STATE
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false);

  // 🌟 BULK DELETE MODAL STATE
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const [filterOptionsData, setFilterOptionsData] = useState({
    campaigns: [],
    courses: [],
    coursePlans: [],
    sources: [],
    paymentStatuses: [],
    priorities: [],
    telecallers: [],
  });

  // Helper to extract display names from raw dropdown items
  const extractNames = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (typeof item === "string") return item;
        return (
          item?.name ||
          item?.label ||
          item?.campaign_name ||
          item?.stage_name ||
          item?.user_name ||
          item?.source_name ||
          item?.title ||
          String(item?.id || "")
        );
      })
      .filter(Boolean);
  };

  const getOptFilter = () => {
    const pipelineIdToUse =
      searchParams.get("pipeline_id") ||
      sessionStorage.getItem("admin_pipeline_selected");
    return pipelineIdToUse
      ? { pipeline_id: Number(pipelineIdToUse) }
      : null;
  };

  // 1. 🌟 ON-DEMAND: Fetch Telecallers only when "Assigned to" filter opens
  const loadTelecallers = async () => {
    try {
      invalidateSelectOptions("L_TELECALLERS");
      const optFilter = getOptFilter();
      const res = await getSelectOptions("L_TELECALLERS", null, true).catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const names = extractNames(raw);
      setFilterOptionsData((prev) => ({
        ...prev,
        telecallers: names,
        telecallerObjects: raw,
      }));
    } catch (err) {
      console.error("Error loading telecallers:", err);
    }
  };

  // 2. 🌟 ON-DEMAND: Fetch Stages only when "Stage" filter opens
  const loadStages = async () => {
    try {
      invalidateSelectOptions("L_STAGES");
      const optFilter = getOptFilter();
      const res = await getSelectOptions("L_STAGES", optFilter, true).catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const names = extractNames(raw);
      setFilterOptionsData((prev) => ({
        ...prev,
        stages: names,
        stageObjects: raw,
      }));
    } catch (err) {
      console.error("Error loading stages:", err);
    }
  };

  // 3. 🌟 ON-DEMAND: Fetch Detailed Filter Panel options only when "Filter" opens
  const loadDetailedFilters = async () => {
    try {
      invalidateSelectOptions();
      const optFilter = getOptFilter();
      const [
        campaigns,
        courseNames,
        coursePlans,
        sources,
        paymentStages,
        tags,
      ] = await Promise.all([
        !campaignId ? getSelectOptions("L_CAMPAIGN_NAMES", optFilter, true).catch(() => []) : Promise.resolve([]),
        getSelectOptions("L_COURSE_NAMES", optFilter, true).catch(() => []),
        getSelectOptions("L_COURSE_PLANS", optFilter, true).catch(() => []),
        getSelectOptions("L_LEAD_SOURCES", optFilter, true).catch(() => []),
        getSelectOptions("L_PAYMENT_STAGES", optFilter, true).catch(() => []),
        getSelectOptions("L_TAGS", optFilter, true).catch(() => []),
      ]);

      let courses =
        courseNames.length > 0
          ? courseNames
          : await getSelectOptions("L_COURSES", optFilter, true).catch(() => []);

      setFilterOptionsData((prev) => ({
        ...prev,
        campaigns: extractNames(campaigns),
        campaignObjects: campaigns,
        courses: extractNames(courses),
        coursePlans: extractNames(coursePlans),
        sources: extractNames(sources),
        paymentStages: extractNames(paymentStages),
        paymentStatuses: extractNames(paymentStages),
        tags: extractNames(tags),
        priorities: extractNames(tags),
      }));
    } catch (err) {
      console.error("Error loading detailed filters:", err);
    }
  };

  // 4. 🌟 ON-DEMAND: Fetch Campaigns when Move Campaign modal opens
  const loadCampaigns = async () => {
    try {
      invalidateSelectOptions("L_CAMPAIGN_NAMES");
      const optFilter = getOptFilter();
      const res = await getSelectOptions("L_CAMPAIGN_NAMES", optFilter, true).catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
      const names = extractNames(raw);
      setFilterOptionsData((prev) => ({
        ...prev,
        campaigns: names,
        campaignObjects: raw,
      }));
    } catch (err) {
      console.error("Error loading campaigns:", err);
    }
  };

  const computedDateRange = (() => {
    if (dateFilterType === "custom" && fromDate && toDate) {
      return `${fromDate} to ${toDate}`;
    }
    const map = {
      today: "Today",
      yesterday: "Yesterday",
      weekly: "Last 7 days",
      monthly: "This Month",
      year: "Last 30 days",
    };
    return map[dateFilterType] || selectedDate || undefined;
  })();

  const getQueryParams = () => {
    const params = {
      search: search || undefined,
      date_range: computedDateRange,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      assigned_to: selectedUsers.length > 0 ? selectedUsers.join(",") : undefined,
      stages: selectedStages.length > 0 ? selectedStages.join(",") : undefined,
      filter_campaign:
        panelFilters?.campaignName && panelFilters.campaignName !== "All"
          ? panelFilters.campaignName
          : undefined,
      course_name:
        panelFilters?.courseName && panelFilters.courseName !== "All"
          ? panelFilters.courseName
          : undefined,
      course_plan:
        panelFilters?.coursePlan && panelFilters.coursePlan !== "All"
          ? panelFilters.coursePlan
          : undefined,
      lead_source:
        panelFilters?.leadSource && panelFilters.leadSource !== "All"
          ? panelFilters.leadSource
          : undefined,
      payment_status:
        panelFilters?.paymentStatus && panelFilters.paymentStatus !== "All"
          ? panelFilters.paymentStatus
          : panelFilters?.paymentStage && panelFilters.paymentStage !== "All"
            ? panelFilters.paymentStage
            : undefined,
      payment_stage:
        panelFilters?.paymentStage && panelFilters.paymentStage !== "All"
          ? panelFilters.paymentStage
          : panelFilters?.paymentStatus && panelFilters.paymentStatus !== "All"
            ? panelFilters.paymentStatus
            : undefined,
      tag:
        panelFilters?.tag && panelFilters.tag !== "All"
          ? panelFilters.tag
          : panelFilters?.priority && panelFilters.priority !== "All"
            ? panelFilters.priority
            : undefined,
      priority:
        panelFilters?.priority && panelFilters.priority !== "All"
          ? panelFilters.priority
          : panelFilters?.tag && panelFilters.tag !== "All"
            ? panelFilters.tag
            : undefined,
    };
    const effectivePipeline =
      pipelineIdParam || sessionStorage.getItem("admin_pipeline_selected");
    if (effectivePipeline) {
      params.pipeline_id = Number(effectivePipeline);
    }
    if (campaignId) {
      params.campaign_id = Number(campaignId);
    }
    return params;
  };

  const refreshLeadSummaryTable = async () => {
    const response = await getLeadSummaryReport(getQueryParams());
    if (response?.data?.data) {
      setTableRows(response.data.data.rows || []);
    }
    setSelectedIds([]);
  };

  // 2. 🌟 CALLING SERVICE METHOD FOR SUMMARY REPORT DATA
  useEffect(() => {
    async function loadLeadSummaryData() {
      setLoading(true);
      try {
        const queryParams = getQueryParams();
        const response = await getLeadSummaryReport(queryParams);

        if (response.data && response.data.data) {
          setCampaignName(
            response.data.data.campaign_name || initialCampaignName,
          );
          setTableRows(response.data.data.rows || []);
        }
      } catch (error) {
        console.error("Failed to load lead summary data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeadSummaryData();
  }, [
    pipelineIdParam,
    effectivePipelineId,
    campaignId,
    initialCampaignName,
    search,
    selectedDate,
    dateFilterType,
    fromDate,
    toDate,
    selectedUsers,
    selectedStages,
    panelFilters,
  ]);

  // 🌟 OPEN VIEW LEAD HISTORY MODAL
  const handleViewClick = (row) => {
    setLeadBeingViewed(row);
    setHistoryModalOpen(true);
  };

  const handleHistoryClose = () => {
    setHistoryModalOpen(false);
    setLeadBeingViewed(null);
  };

  const cleanCampName = campaignName
    ? campaignName.replace(/enquiry sheet$/i, "").trim()
    : "";
  const headerTitle = cleanCampName
    ? `Lead Summary Report- ${cleanCampName}`
    : "Lead Summary Report";

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", p: 2 }}>
      <LeadSummaryHeader
        title={headerTitle}
        onBack={() => navigate(-1)}
      />

      <LeadSummaryToolbar
        hideCampaign={Boolean(campaignId)}
        onOpenAssignedTo={loadTelecallers}
        onOpenStage={loadStages}
        onOpenFilter={loadDetailedFilters}
        onDownload={() => setIsExportModalOpen(true)}
        search={search}
        onSearchChange={setSearch}
        selectedCount={selectedIds.length}
        filterDropdownOptions={filterOptionsData}
        telecallers={filterOptionsData.telecallers}
        selectedDate={selectedDate}
        dateFilterType={dateFilterType}
        setDateFilterType={setDateFilterType}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        selectedUsers={selectedUsers}
        selectedStages={selectedStages}
        appliedPanelFilters={panelFilters}
        onDateApply={(val) => setSelectedDate(val)}
        onUserApply={(vals) => setSelectedUsers(vals)}
        onStageApply={(vals) => setSelectedStages(vals)}
        onFilterApply={(filterData) => setPanelFilters(filterData)}
        onBulkAction={(action) => {
          const act = String(action || "")
            .toLowerCase()
            .trim();
          if (act.includes("move")) {
            loadCampaigns();
            setMoveModalOpen(true);
          } else if (act.includes("assign")) {
            loadTelecallers();
            setAssignModalOpen(true);
          } else if (act.includes("status") || act.includes("change")) {
            loadStages();
            setChangeStatusModalOpen(true);
          } else if (act.includes("delete")) {
            setBulkDeleteModalOpen(true);
          }
        }}
      />

      <LeadSummaryTable
        rows={tableRows}
        loading={loading}
        onView={handleViewClick}
        onSelectionChange={setSelectedIds}
      />

      <LeadHistoryModal
        open={historyModalOpen}
        onClose={handleHistoryClose}
        lead={leadBeingViewed || {}}
      />

      <MoveCampaignModal
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        selectedCount={selectedIds.length}
        campaignOptions={filterOptionsData.campaigns}
        onMove={async ({ campaign, note }) => {
          try {
            if (selectedIds.length > 0 && campaign) {
              await moveLeadCampaign({
                lead_ids: selectedIds,
                target_campaign: campaign,
                note: note,
              });

              // Refresh summary table after move
              await refreshLeadSummaryTable();
            }
          } catch (error) {
            console.error("Failed to move leads:", error);
          }
        }}
      />

      <AssignTelecallerModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        selectedCount={selectedIds.length}
        telecallerOptions={filterOptionsData.telecallers}
        onAssign={async ({ telecaller, note }) => {
          try {
            if (selectedIds.length > 0 && telecaller) {
              await assignLeadTelecaller({
                lead_ids: selectedIds,
                telecaller: telecaller,
                note: note,
              });

              // Refresh summary table after assign
              await refreshLeadSummaryTable();
            }
          } catch (error) {
            console.error("Failed to assign leads to telecaller:", error);
          }
        }}
      />

      <ChangeStatusModal
        open={changeStatusModalOpen}
        onClose={() => setChangeStatusModalOpen(false)}
        selectedCount={selectedIds.length}
        statusOptions={filterOptionsData.stages}
        onSubmit={async ({ status_name, note }) => {
          try {
            if (selectedIds.length > 0 && status_name) {
              await changeLeadStatus({
                lead_ids: selectedIds,
                status_name: status_name,
                note: note,
              });

              // Refresh summary table after status change
              await refreshLeadSummaryTable();
            }
          } catch (error) {
            console.error("Failed to change lead status:", error);
          }
        }}
      />

      <BulkDeleteModal
        open={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        selectedCount={selectedIds.length}
        onConfirm={async () => {
          try {
            if (selectedIds.length > 0) {
              await deleteLeadSummary(selectedIds);

              // Refresh summary table after bulk delete
              await refreshLeadSummaryTable();
            }
          } catch (error) {
            console.error("Failed to bulk delete leads:", error);
          }
        }}
      />
      <ExportModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="Lead Summary Report"
        columns={leadSummaryExportColumns}
        availableFormats={["xlsx", "csv", "pdf"]}
        isSubmitting={exportLoading}
        onDownload={handleExportSubmit}
      />
    </Box>
  );
}

export default LeadSummaryReport;
