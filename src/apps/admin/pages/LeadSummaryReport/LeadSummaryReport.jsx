import { useState, useEffect, useRef, useCallback } from "react";
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
  const initialCampaignName = searchParams.get("campaign_name") || "500 Enquiry Sheet";

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
    campaigns: ["All"],
    courses: ["All"],
    coursePlans: ["All"],
    sources: ["All"],
    paymentStatuses: ["All"],
    priorities: ["All"],
    telecallers: [],
  });

  // 1. 🌟 CALLING SERVICE METHOD FOR FILTER OPTIONS (Lazily on filter open)
  const optionsFetchedRef = useRef(false);
  const loadSelectOptions = async () => {
    if (optionsFetchedRef.current) return;
    try {
      optionsFetchedRef.current = true;
      const response = await getFilterOptions();
      if (response.data && response.data.data) {
        const apiData = response.data.data;

        setFilterOptionsData({
          campaigns: apiData.campaigns || ["All"],
          courses: apiData.courses || ["All"],
          coursePlans: apiData.course_plans || ["All"],
          sources: apiData.lead_sources || ["All"],
          paymentStatuses: apiData.payment_statuses || ["All"],
          priorities: apiData.priorities || ["All"],
          stages: apiData.stages || [],
          stageTagsMap: apiData.stage_tags_map || {},
          telecallers: apiData.telecallers || [],
        });
      }
    } catch (error) {
      console.error("Filter options load error:", error);
      optionsFetchedRef.current = false;
    }
  };

  // HELPER TO BUILD QUERY PARAMS FOR LEAD SUMMARY
  const buildQueryParams = useCallback(
    () => ({
      campaign_id: campaignId,
      campaign_name: initialCampaignName,
      search: search,
      date_range: selectedDate,
      assigned_to: selectedUsers.join(","),
      stages: selectedStages.join(","),
      filter_campaign: panelFilters.campaignName,
      course_name: panelFilters.courseName,
      course_plan: panelFilters.coursePlan,
      lead_source: panelFilters.leadSource,
      payment_status: panelFilters.paymentStatus,
      priority: panelFilters.priority,
    }),
    [
      campaignId,
      initialCampaignName,
      search,
      selectedDate,
      selectedUsers,
      selectedStages,
      panelFilters,
    ]
  );

  // HELPER TO FETCH LEAD SUMMARY DATA
  const fetchLeadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams();
      const response = await getLeadSummaryReport(queryParams);

      if (response.data && response.data.data) {
        setCampaignName(response.data.data.campaign_name || initialCampaignName);
        setTableRows(response.data.data.rows || []);
      }
    } catch (error) {
      console.error("Failed to load lead summary data:", error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, initialCampaignName]);

  // 2. 🌟 CALLING SERVICE METHOD FOR SUMMARY REPORT DATA
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchLeadSummary();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchLeadSummary]);

  // 🌟 OPEN EDIT MODAL WITH THE CLICKED ROW'S DATA
  const handleEditClick = (row) => {
    loadSelectOptions();
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
        await fetchLeadSummary();
      }
      handleDeleteClose();
    } catch (error) {
      console.error("Failed to delete lead via DELETE API:", error);
    }
  };

  // 🌟 SAVE HANDLER — POST method API call to update lead in DB
  const handleEditSave = async (updatedLeadData) => {
    try {
      console.log("Saving lead via POST API:", leadBeingEdited?.id, updatedLeadData);

      const payload = {
        lead_id: leadBeingEdited?.id,
        ...updatedLeadData,
      };

      // 🌟 1. Call simple POST API to update DB
      await updateLeadSummary(payload);

      // 🌟 2. Re-fetch fresh data from server so changes persist on refresh
      await fetchLeadSummary();

      handleEditClose();
    } catch (error) {
      console.error("Failed to save lead via POST API:", error);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", p: 2 }}>
      <LeadSummaryHeader
        title={`Lead Summary Report- ${campaignName}`}
        onBack={() => navigate(-1)}
        onCallLogs={() =>
          navigate(
            `/admin/call-log-report?campaign_id=${campaignId ?? ""}&campaign_name=${encodeURIComponent(
              campaignName
            )}`
          )
        }
      />

      <LeadSummaryToolbar
        search={search}
        onSearchChange={setSearch}
        onFetchOptions={loadSelectOptions}
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
          const act = String(action || "").toLowerCase().trim();
          if (act.includes("move")) {
            loadSelectOptions();
            setMoveModalOpen(true);
          } else if (act.includes("assign")) {
            loadSelectOptions();
            setAssignModalOpen(true);
          } else if (act.includes("status") || act.includes("change")) {
            loadSelectOptions();
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
        tagOptions={filterOptionsData.priorities}
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
              await fetchLeadSummary();
              setSelectedIds([]);
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
              await fetchLeadSummary();
              setSelectedIds([]);
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
              await fetchLeadSummary();
              setSelectedIds([]);
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
              await fetchLeadSummary();
              setSelectedIds([]);
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