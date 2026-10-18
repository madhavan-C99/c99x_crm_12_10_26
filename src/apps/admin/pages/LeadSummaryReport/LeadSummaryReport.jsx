import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";

// 🌟 IMPORTING FROM ADMIN SERVICES (FOLLOWING YOUR PROJECT STRUCTURE)
import {
  getFilterOptions,
  getLeadSummaryReport,
  updateLeadSummary,
  deleteLeadSummary,
  moveLeadCampaign,
  assignLeadTelecaller,
  changeLeadStatus,
} from "@/apps/admin/services/leadSummaryService";

import LeadSummaryHeader from "@/apps/admin/pages/LeadSummaryReport/components/LeadSummaryHeader";
import LeadSummaryToolbar from "@/apps/admin/pages/LeadSummaryReport/components/LeadSummaryToolbar";
import LeadSummaryTable from "@/apps/admin/pages/LeadSummaryReport/components/LeadSummaryTable";
// 🌟 EDIT LEAD MODAL — same modal used from the CRM "Edit Lead" popup
import EditLeadModal from "@/apps/admin/pages/LeadSummaryReport/components/Editleadmodal";
// 🌟 LEAD HISTORY MODAL — view lead history modal popup
import LeadHistoryModal from "@/apps/admin/pages/LeadSummaryReport/components/LeadHistoryModal";
// 🌟 DELETE CONFIRM MODAL — delete confirmation modal popup
import DeleteConfirmModal from "@/apps/admin/pages/LeadSummaryReport/components/DeleteConfirmModal";
// 🌟 MOVE CAMPAIGN MODAL — move leads to another campaign modal popup
import MoveCampaignModal from "@/apps/admin/pages/LeadSummaryReport/components/MoveCampaignModal";
// 🌟 ASSIGN TELECALLER MODAL — assign leads to telecaller modal popup
import AssignTelecallerModal from "@/apps/admin/pages/LeadSummaryReport/components/AssignTelecallerModal";
// 🌟 CHANGE LEAD STATUS MODAL — bulk change lead status modal popup
import ChangeStatusModal from "@/apps/admin/pages/LeadSummaryReport/components/ChangeStatusModal";
// 🌟 BULK DELETE MODAL — bulk delete leads modal popup with confirmation
import BulkDeleteModal from "@/apps/admin/pages/LeadSummaryReport/components/BulkDeleteModal";

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

  // DYNAMIC FILTER STATES
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [panelFilters, setPanelFilters] = useState({});

  // 🌟 EDIT LEAD MODAL STATE
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leadBeingEdited, setLeadBeingEdited] = useState(null);

  // 🌟 VIEW LEAD HISTORY MODAL STATE
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [leadBeingViewed, setLeadBeingViewed] = useState(null);

  // 🌟 DELETE CONFIRM MODAL STATE
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadBeingDeleted, setLeadBeingDeleted] = useState(null);

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

  // 1. 🌟 CALLING SERVICE METHOD FOR FILTER OPTIONS
  useEffect(() => {
    async function loadSelectOptions() {
      try {
        const pipelineIdToUse =
          searchParams.get("pipeline_id") ||
          sessionStorage.getItem("admin_pipeline_selected");
        const optFilter = pipelineIdToUse
          ? {
              pipeline_id: Number(pipelineIdToUse),
            }
          : null;
        const response = await getFilterOptions(optFilter);
        if (response.data && response.data.data) {
          const apiData = response.data.data;

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

          const rawStages = apiData.stages || [];
          const rawTelecallers = apiData.telecallers || [];
          const rawCampaigns = apiData.campaigns || [];
          const rawCourses = apiData.courses || [];
          const rawCoursePlans = apiData.course_plans || [];
          const rawSources = apiData.lead_sources || apiData.sources || [];
          const rawPaymentStages =
            apiData.payment_stages || apiData.payment_statuses || [];
          const rawTags = apiData.tags || apiData.priorities || [];

          setFilterOptionsData({
            campaigns: extractNames(rawCampaigns),
            courses: extractNames(rawCourses),
            coursePlans: extractNames(rawCoursePlans),
            sources: extractNames(rawSources),
            paymentStages: extractNames(rawPaymentStages),
            paymentStatuses: extractNames(rawPaymentStages),
            tags: extractNames(rawTags),
            priorities: extractNames(rawTags),
            stages: extractNames(rawStages),
            stageObjects: rawStages,
            telecallers: extractNames(rawTelecallers),
            telecallerObjects: rawTelecallers,
            campaignObjects: rawCampaigns,
            stageTagsMap: apiData.stage_tags_map || {},
          });
        }
      } catch (error) {
        console.error("Filter options load error:", error);
      }
    }
    loadSelectOptions();
  }, [searchParams]);

  const getQueryParams = () => {
    const params = {
      search: search || undefined,
      date_range: selectedDate || undefined,
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
    selectedUsers,
    selectedStages,
    panelFilters,
  ]);

  // 🌟 OPEN EDIT MODAL WITH THE CLICKED ROW'S DATA
  const handleEditClick = (row) => {
    setLeadBeingEdited(row);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setLeadBeingEdited(null);
  };

  // 🌟 OPEN VIEW LEAD HISTORY MODAL
  const handleViewClick = (row) => {
    setLeadBeingViewed(row);
    setHistoryModalOpen(true);
  };

  const handleHistoryClose = () => {
    setHistoryModalOpen(false);
    setLeadBeingViewed(null);
  };

  // 🌟 OPEN DELETE CONFIRM MODAL
  const handleDeleteClick = (row) => {
    setLeadBeingDeleted(row);
    setDeleteModalOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteModalOpen(false);
    setLeadBeingDeleted(null);
  };

  // 🌟 DELETE HANDLER — DELETE method API call to remove lead permanently from DB
  const handleDeleteConfirm = async (lead) => {
    try {
      if (lead?.id) {
        console.log("Deleting lead via DELETE API:", lead.id);
        await deleteLeadSummary(lead.id);
      }
      setTableRows((prev) => prev.filter((r) => r.id !== lead?.id));
      handleDeleteClose();
    } catch (error) {
      console.error("Failed to delete lead via DELETE API:", error);
    }
  };

  // 🌟 SAVE HANDLER — POST method API call to update lead in DB
  const handleEditSave = async (updatedLeadData) => {
    try {
      console.log(
        "Saving lead via POST API:",
        leadBeingEdited?.id,
        updatedLeadData,
      );

      const payload = {
        lead_id: leadBeingEdited?.id,
        ...updatedLeadData,
      };

      // 🌟 1. Call simple POST API to update DB
      await updateLeadSummary(payload);

      // 🌟 2. Re-fetch fresh data from server so changes persist on refresh
      await refreshLeadSummaryTable();
      handleEditClose();
    } catch (error) {
      console.error("Failed to save lead via POST API:", error);
    }
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
        search={search}
        onSearchChange={setSearch}
        selectedCount={selectedIds.length}
        filterDropdownOptions={filterOptionsData}
        telecallers={filterOptionsData.telecallers}
        selectedDate={selectedDate}
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
            setMoveModalOpen(true);
          } else if (act.includes("assign")) {
            setAssignModalOpen(true);
          } else if (act.includes("status") || act.includes("change")) {
            setChangeStatusModalOpen(true);
          } else if (act.includes("delete")) {
            setBulkDeleteModalOpen(true);
          }
        }}
      />

      <LeadSummaryTable
        rows={tableRows}
        loading={loading}
        onEdit={handleEditClick}
        onView={handleViewClick}
        onDelete={handleDeleteClick}
        onSelectionChange={setSelectedIds}
      />

      <EditLeadModal
        open={editModalOpen}
        onClose={handleEditClose}
        onSave={handleEditSave}
        lead={leadBeingEdited || {}}
        stageOptions={filterOptionsData.stages}
        tagOptions={filterOptionsData.tags || filterOptionsData.priorities}
        stageTagsMap={filterOptionsData.stageTagsMap}
      />

      <LeadHistoryModal
        open={historyModalOpen}
        onClose={handleHistoryClose}
        lead={leadBeingViewed || {}}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        lead={leadBeingDeleted || {}}
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
    </Box>
  );
}

export default LeadSummaryReport;
