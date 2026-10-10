import { Box, Typography, Snackbar } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import useDebounce from "@/shared/hooks/useDebounce";

// =============================================================================
// COMPONENT IMPORTS & SUB-MODULES
// =============================================================================
import LeadHeader from "../Leads/components/LeadHeader";       // 1. Top Header (Title, Category Dropdown, Action Buttons)
import LeadStats from "./components/LeadStats";               // 2. Status Pill Tabs with Count Badges (All, New, Followup, Missed, Won, Lost)
import LeadTable from "../Leads/components/LeadTable";         // 3. Paginated Data Grid Table View
import LeadFilter from "../Leads/components/LeadFilter";       // 4. Toolbar (Search, List/Pipeline Switch, Date, Filter, Sort)
import LeadPipeLine from "../Leads/components/LeadPipeLine";   // 5. Kanban Board Pipeline View
import AddNewLeadModal from "./components/AddNewLead";         // 6. Add New Lead Modal Dialog Form
import UploadLeadsModal from "./components/UploadLeadsModal";   // 7. Bulk Excel / CSV File Upload Modal
import LeadDetailModal from "./components/LeadDetailModal";     // 8. Single Lead Detail Modal Dialog
import MarkAsWonModal from "./components/MarkAsWonModal";       // 9. Mark As Won Modal Dialog
import MarkAsLossModal from "./components/MarkAsLossModal";     // 10. Mark As Loss Modal Dialog
import EditLeadModal from "./components/EditLeadModal";         // 11. Exact Figma Edit Lead Modal Dialog
import ReassignLeadModal from "../LossLeadApproval/components/ReassignLeadModal"; // 12. Reassign Telecaller Modal Dialog
import ExportColumnsModal from "./components/ExportColumnsModal";

// =============================================================================
// API SERVICE IMPORTS
// =============================================================================
import {
  getLeadData,
  uploadLeadsExcel,
  updateLeadStage,
  exportLeads,
  submitMarkAsWon,
  submitMarkAsLost,
  editLead,
  deleteLead,
  reassignLead,
} from "../../services/leadService";

import { getSelectOptions } from "../../services/dropdownService";

const Leads = () => {
  // ---------------------------------------------------------------------------
  // 1. STATE FOR LeadHeader & DYNAMIC PIPELINES / CATEGORIES & STAGES
  // ---------------------------------------------------------------------------
  const [pipelinesList, setPipelinesList] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [stagesList, setStagesList] = useState([]);

  useEffect(() => {
    getSelectOptions("L_CATEGORIES")
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setPipelinesList(cats);
          const initialId = cats[0].id ?? cats[0].value;
          setSelectedPipeline(initialId);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!selectedPipeline) return;
    const optFilter = { pipeline_id: selectedPipeline, category_id: selectedPipeline };
    getSelectOptions("L_STAGES", optFilter)
      .then((stgs) => {
        if (Array.isArray(stgs) && stgs.length > 0) {
          setStagesList(stgs);
        }
      })
      .catch(() => null);
  }, [selectedPipeline]);

  // ---------------------------------------------------------------------------
  // 2. STATE FOR LeadStats COMPONENT (Pill Badge Tabs)
  // ---------------------------------------------------------------------------
  // Tab filter value: stage ID from stagesList or "all"
  const [selectedLeadType, setSelectedLeadType] = useState("all");

  // ---------------------------------------------------------------------------
  // 3. STATE FOR LeadFilter COMPONENT (Toolbar, Search, Date & Sort)
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");              // Search input string
  const debouncedSearchTerm = useDebounce(searchTerm, 400);      // 400ms debounced search
  const [dateFilterType, setDateFilterType] = useState("monthly");// "monthly" | "today" | "custom"
  const [sortType, setSortType] = useState("newest");             // "newest" | "oldest"
  const [fromDate, setFromDate] = useState(null);                 // Custom date range start
  const [toDate, setToDate] = useState(null);                     // Custom date range end
  const [selectedFilters, setSelectedFilters] = useState({});     // Checkbox filter values
  const [viewType, setViewType] = useState("list");               // "list" (Table) vs "pipeline" (Kanban)

  // ---------------------------------------------------------------------------
  // 4. SERVER-SIDE PAGINATION & MAIN DATA STORE
  // ---------------------------------------------------------------------------
  const [page, setPage] = useState(1);                            // 1-based page index
  const [pageSize, setPageSize] = useState(50);                   // Rows per page
  const [totalRecords, setTotalRecords] = useState(0);            // Total lead count from API

  const [tableData, setTableData] = useState([]);   // Lead rows array returned by API
  const [statsData, setStatsData] = useState({});   // Summary counts object returned by API
  const [loading, setLoading] = useState(false);    // Loading spinner flag

  const abortControllerRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 5. MODAL DIALOG VISIBILITY STATES
  // ---------------------------------------------------------------------------
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);        // Add Lead Modal Visibility
  const [editingLead, setEditingLead] = useState(null);               // Currently selected lead for edit
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);  // Upload Excel Modal Visibility
  const [selectedDetailLead, setSelectedDetailLead] = useState(null); // Selected lead for Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);  // Detail Modal Visibility
  const [selectedWonLead, setSelectedWonLead] = useState(null);       // Selected lead for Mark as Won Modal
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);        // Mark as Won Modal Visibility
  const [selectedLossLead, setSelectedLossLead] = useState(null);     // Selected lead for Mark as Loss Modal
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);      // Mark as Loss Modal Visibility
  const [selectedEditLead, setSelectedEditLead] = useState(null);     // Selected lead for Edit Lead Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);      // Edit Lead Modal Visibility
  const [selectedReassignLead, setSelectedReassignLead] = useState(null); // Selected lead for Reassign Modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);  // Reassign Modal Visibility
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const leadExportColumns = [
    { id: "s_no", backendKey: "s_no", label: "S.No" },
    { id: "name", backendKey: "name", label: "Full Name" },
    { id: "mobile_no", backendKey: "mobile_no", label: "Contact Number" },
    { id: "assigned_to", backendKey: "assigned_to", label: "Assigned Telecaller" },
    { id: "stage", backendKey: "stage", label: "Current Stage" },
    { id: "pipeline", backendKey: "pipeline", label: "Pipeline Category" },
    { id: "campaign_name", backendKey: "campaign_name", label: "Campaign Name" },
    { id: "source", backendKey: "source", label: "Lead Source" },
    { id: "course_plan", backendKey: "course_plan", label: "Course Plan" },
    { id: "course_name", backendKey: "course_name", label: "Course Offered" },
    { id: "next_follow_up", backendKey: "next_follow_up", label: "Next Follow-Up Date" },
    { id: "amount", backendKey: "amount", label: "Course Fee" },
    { id: "pending_amount", backendKey: "pending_amount", label: "Pending Amount" },
    { id: "last_contacted", backendKey: "last_contacted", label: "Last Contacted Date" },
    { id: "last_conversation_outcome", backendKey: "last_conversation_outcome", label: "Last Outcome" },
    { id: "created", backendKey: "created", label: "Created Date" },
  ];

  const handleOpenLeadDetail = (lead) => {
    setSelectedDetailLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleOpenWonModal = (lead) => {
    setSelectedWonLead(lead);
    setIsWonModalOpen(true);
  };

  const handleOpenLossModal = (lead) => {
    setSelectedLossLead(lead);
    setIsLossModalOpen(true);
  };

  const handleOpenReassignModal = (lead) => {
    setSelectedReassignLead(lead);
    setIsReassignModalOpen(true);
  };
  
  // Toast Pop-up State matching UI/UX design
  const [toastState, setToastState] = useState({
    open: false,
    message: "",
  });

  const showToast = (message) => {
    setToastState({ open: true, message });
  };

  const handleCloseToast = () => {
    setToastState((prev) => ({ ...prev, open: false }));
  };

  // Modal toggle helpers for AddNewLeadModal
  const handleOpenAddModal = () => {
    setEditingLead(null);
    setIsAddModalOpen(true);
  };
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingLead(null);
  };

  const handleEditLead = (lead) => {
    setSelectedEditLead(lead);
    setIsEditModalOpen(true);
  };

  // ===========================================================================
  // 6. HANDLER FOR AddNewLeadModal COMPONENT (Add & Edit)
  // ===========================================================================
  const handleSaveLead = (newLeadData, isEdit = false) => {
    showToast(isEdit ? "The lead is successfully Updated" : "The lead is successfully Added");
    fetchLeadData();
  };

  // ===========================================================================
  // 7. HANDLER FOR UploadLeadsModal COMPONENT
  // ===========================================================================
  const handleUploadLeads = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadLeadsExcel(formData);
      showToast("Excel sheet uploaded successfully");
      fetchLeadData();
    } catch (error) {
      console.error("Failed to upload leads excel:", error);
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to upload file. Please try again.";
      showToast(errMsg);
      throw error;
    }
  };

  // ===========================================================================
  // 7B. HANDLER FOR OFFICIAL BACKEND EXCEL EXPORT
  // ===========================================================================
  const handleExportLeads = async (selectedKeys) => {
    try {
      showToast("Generating official Excel file from server...");
      const filtersPayload = buildPayload(selectedFilters, page, pageSize);
      delete filtersPayload.page;
      delete filtersPayload.page_size;

      const payload = {
        entity: "leads",
        export_format: "excel",
        selected_columns: selectedKeys && Array.isArray(selectedKeys) ? selectedKeys : [],
        filters: filtersPayload,
      };

      const response = await exportLeads(payload);
      const resData = response?.data || response;
      const resultObj = resData?.data || resData;

      let downloadUrl = resultObj?.download_url || resData?.download_url || resultObj?.file_url;

      if (downloadUrl) {
        if (!downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://")) {
          const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
          downloadUrl = `${baseUrl}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;
        }

        window.open(downloadUrl, "_blank");
        showToast(resData?.message || resultObj?.message || `Successfully exported leads file!`);
      } else {
        showToast("Export failed. No download URL returned from server.");
      }
    } catch (error) {
      console.error("Backend Export API error:", error);
      showToast("Export failed. Please try again.");
    }
  };

  // ===========================================================================
  // 8. API PAYLOAD BUILDER & BACKEND DATA FETCHING (getLeadData)
  // ===========================================================================
  const buildPayload = (filters = selectedFilters, currPage = page, currPageSize = pageSize) => {
    const pId = Number(
      selectedPipeline?.id ??
        selectedPipeline?.value ??
        selectedPipeline ??
        pipelinesList?.[0]?.id ??
        pipelinesList?.[0]?.value ??
        0
    );

    const payload = {
      pipeline_id: pId,
      sort_order: sortType || "newest",
      search: debouncedSearchTerm || "",
      page: currPage,
      page_size: currPageSize,
    };

    if (selectedLeadType && selectedLeadType !== "all") {
      payload.lead_stage_id = selectedLeadType;
    }

    if (filters?.pipeline_stage_id && filters.pipeline_stage_id !== 0 && filters.pipeline_stage_id !== "all") {
      payload.pipeline_stage_id = Number(filters.pipeline_stage_id);
    }
    if (filters?.assigned_to_id && filters.assigned_to_id !== 0) {
      payload.assigned_to = filters.assigned_to_id;
    }
    if (filters?.lead_source_id && filters.lead_source_id !== 0 && filters.lead_source_id !== "all") {
      payload.source_id = filters.lead_source_id;
    }
    if (filters?.campaign_name_id && filters.campaign_name_id !== 0 && filters.campaign_name_id !== "all") {
      payload.campaign_id = filters.campaign_name_id;
    }
    if (filters?.course_plan_id && filters.course_plan_id !== 0 && filters.course_plan_id !== "all") {
      payload.course_plan_id = filters.course_plan_id;
    }

    if (dateFilterType && dateFilterType !== "all") {
      payload.date_filter_type = dateFilterType === "monthly" ? "this_month" : dateFilterType;
    }
    if (dateFilterType === "custom" && fromDate && toDate) {
      payload.from_date = dayjs(fromDate).format("YYYY-MM-DD");
      payload.to_date = dayjs(toDate).format("YYYY-MM-DD");
    }
    return payload;
  };

  // Calls getLeadData API service & parses response with AbortController
  const fetchLeadData = async (filters = selectedFilters, targetPage = page, targetPageSize = pageSize) => {
    if (!selectedPipeline) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const payload = buildPayload(filters, targetPage, targetPageSize);
      const response = await getLeadData(payload, { signal: controller.signal });

      if (controller.signal.aborted) return;

      const rawData = response?.data?.data || response?.data?.result || response?.data;

      let tableRows = [];
      let statsObj = {};

      if (Array.isArray(rawData)) {
        if (Array.isArray(rawData[0])) {
          tableRows = rawData[0];
          statsObj = rawData[1]?.[0] || rawData[1] || {};
        } else {
          tableRows = rawData;
        }
      } else if (rawData && typeof rawData === "object") {
        tableRows = rawData.leads || rawData.rows || rawData.data || [];
        statsObj = rawData.stats || rawData.summary || rawData.counts || {};
      }

      const totalRec =
        rawData?.total_records ??
        rawData?.total_count ??
        statsObj?.total_count ??
        statsObj?.total_records ??
        (Array.isArray(tableRows) ? tableRows.length : 0);

      if (controller.signal.aborted) return;

      setTableData(tableRows);
      setTotalRecords(totalRec);
      setStatsData(statsObj);
    } catch (error) {
      if (error?.name === "CanceledError" || error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
        return;
      }
      console.error("fetchLeadData API Error:", error);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const selectedFiltersStr = JSON.stringify(selectedFilters);

  const prevFiltersRef = useRef({
    selectedPipeline,
    selectedLeadType,
    sortType,
    dateFilterType,
    fromDate,
    toDate,
    debouncedSearchTerm,
    selectedFiltersStr,
  });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.selectedPipeline !== selectedPipeline ||
      prev.selectedLeadType !== selectedLeadType ||
      prev.sortType !== sortType ||
      prev.dateFilterType !== dateFilterType ||
      prev.fromDate !== fromDate ||
      prev.toDate !== toDate ||
      prev.debouncedSearchTerm !== debouncedSearchTerm ||
      prev.selectedFiltersStr !== selectedFiltersStr;

    prevFiltersRef.current = {
      selectedPipeline,
      selectedLeadType,
      sortType,
      dateFilterType,
      fromDate,
      toDate,
      debouncedSearchTerm,
      selectedFiltersStr,
    };

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    fetchLeadData(selectedFilters, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPipeline,
    selectedLeadType,
    sortType,
    dateFilterType,
    fromDate,
    toDate,
    debouncedSearchTerm,
    selectedFiltersStr,
    page,
    pageSize,
  ]);

  const getExportPayload = () => buildPayload();

  // ===========================================================================
  // 9. JSX COMPONENT TREE RENDER
  // ===========================================================================
  return (
    <Box sx={{ pb: 3, pr: 3 }}>
      {/* Toast Notification Pop-Up matching UI/UX Screenshot */}
      <Snackbar
        open={toastState.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "30px !important" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#FFFFFF",
            color: "#111827",
            px: 3,
            py: 1.5,
            borderRadius: "14px",
            boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.12)",
            border: "1px solid #E5E7EB",
            borderBottom: "3px solid #84CC16",
          }}
        >
          <CheckCircleIcon sx={{ color: "#84CC16", fontSize: 24 }} />
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
            {toastState.message}
          </Typography>
        </Box>
      </Snackbar>

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 1: LeadHeader (Title, Education/Product dropdown, Add Lead, Upload, Export buttons) */}
      {/* --------------------------------------------------------------------- */}
      <LeadHeader
        onAddNew={handleOpenAddModal}
        onUpload={() => setIsUploadModalOpen(true)}
        onExport={() => setIsExportModalOpen(true)}
        pipelinesList={pipelinesList}
        selectedPipeline={selectedPipeline}
        onPipelineCategoryChange={(pipeId) => {
          setSelectedPipeline(pipeId);
        }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 2: LeadStats (Pill Badge Tabs - All Leads, New Lead, Follow up, Missed Follow up, Won, Lost) */}
      {/* --------------------------------------------------------------------- */}
      {viewType === "list" && (
        <LeadStats
          statsData={statsData}
          tableData={tableData}
          selectedLeadType={selectedLeadType}
          setSelectedLeadType={(newType) => {
            setSelectedLeadType(newType);
          }}
          stagesList={stagesList}
          loading={loading}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 3: LeadFilter (Search input, Pipeline/List view toggle, Date picker, Filter & Sort menus) */}
      {/* --------------------------------------------------------------------- */}
      <LeadFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={dateFilterType}
        setFilterType={setDateFilterType}
        sortType={sortType}
        setSortType={setSortType}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        fetchLeadData={fetchLeadData}
        dropdownCategory="lead_filter"
        pageName="leads"
        getExportPayload={getExportPayload}
        viewType={viewType}
        onViewTypeChange={setViewType}
        selectedPipeline={selectedPipeline}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 4 & 5: LeadTable (Data Grid View) OR LeadPipeLine (Kanban Board View) */}
      {/* --------------------------------------------------------------------- */}
      {viewType === "pipeline" ? (
        /* COMPONENT 5: LeadPipeLine (Kanban Board View) */
        <LeadPipeLine
          tableData={tableData}
          searchTerm={searchTerm}
          dateFilterType={dateFilterType}
          fromDate={fromDate}
          toDate={toDate}
          selectedFilters={selectedFilters}
          stagesList={stagesList}
          selectedPipeline={selectedPipeline}
          onCardClick={handleOpenLeadDetail}
          onMarkAsWon={handleOpenWonModal}
        />
      ) : (
        /* COMPONENT 4: LeadTable (Paginated Data Table Grid View) */
        <LeadTable
          tableData={tableData}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onPageChange={(event, newPage) => {
            setPage(newPage + 1);
          }}
          onRowsPerPageChange={(event) => {
            const newSize = parseInt(event.target.value, 10);
            setPageSize(newSize);
            setPage(1);
          }}
          onEditLead={handleEditLead}
          onMarkAsWon={handleOpenWonModal}
          onMarkAsLost={handleOpenLossModal}
          onReassignLead={handleOpenReassignModal}
          onDeleteLead={async (lead) => {
            const targetId = lead.id || lead.lead_id;
            const userId = lead.assigned_to_id || lead.user_id || lead.telecaller_id;
            try {
              const res = await deleteLead({ lead_id: targetId, id: targetId, user_id: userId, user: userId });
              const resData = res?.data;

              if (resData?.status === "failed" || resData?.success === false) {
                showToast(resData?.message || resData?.detail || "Failed to delete lead");
                return;
              }

              const message = resData?.message || resData?.detail || "The lead is successfully Deleted";
              showToast(message);
              fetchLeadData();
            } catch (error) {
              console.error("deleteLead error:", error);
              const errMsg =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to delete lead";
              showToast(errMsg);
            }
          }}
          onRefreshLead={() => fetchLeadData()}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 6: AddNewLeadModal (Form Dialog to add/edit single lead) */}
      {/* --------------------------------------------------------------------- */}
      <AddNewLeadModal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveLead}
        editLeadData={editingLead}
        selectedPipeline={selectedPipeline}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 7: UploadLeadsModal (Bulk Excel / CSV File Upload Dialog) */}
      {/* --------------------------------------------------------------------- */}
      <UploadLeadsModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadLeads}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 8: LeadDetailModal (Single Card Details Dialog) */}
      {/* --------------------------------------------------------------------- */}
      <LeadDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        lead={selectedDetailLead}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 9: MarkAsWonModal (Exact Figma Mark as Won Dialog) */}
      {/* --------------------------------------------------------------------- */}
      <MarkAsWonModal
        open={isWonModalOpen}
        onClose={() => setIsWonModalOpen(false)}
        lead={selectedWonLead}
        onSubmitSuccess={async (payload) => {
          try {
            await submitMarkAsWon(payload);
            showToast("Lead successfully marked as Won!");
            fetchLeadData();
          } catch (err) {
            console.error("submitMarkAsWon API error:", err);
            throw err;
          }
        }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 10: MarkAsLossModal (Exact Figma Mark as Loss Dialog) */}
      {/* --------------------------------------------------------------------- */}
      <MarkAsLossModal
        open={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        lead={selectedLossLead}
        onSubmitSuccess={async (payload) => {
          try {
            await submitMarkAsLost(payload);
            showToast("Lead successfully marked as Lost!");
            fetchLeadData();
          } catch (err) {
            console.error("submitMarkAsLost API error:", err);
            throw err;
          }
        }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 11: EditLeadModal (Exact Figma Edit Lead Dialog) */}
      {/* --------------------------------------------------------------------- */}
      <EditLeadModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditLead(null);
        }}
        lead={selectedEditLead}
        onSaveSuccess={async (payload) => {
          try {
            await editLead(payload);
            showToast("Lead updated successfully!");
            fetchLeadData();
          } catch (err) {
            console.error("editLead API error:", err);
            throw err;
          }
        }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 12: ReassignLeadModal (Reassign Telecaller Dialog) */}
      {/* --------------------------------------------------------------------- */}
      <ReassignLeadModal
        open={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setSelectedReassignLead(null);
        }}
        lead={selectedReassignLead}
        onReassign={async ({ lead, telecaller_id, chosenTelecaller }) => {
          const targetId = lead.id || lead.lead_id;
          const newName = chosenTelecaller?.name || "Telecaller";
          try {
            const res = await reassignLead({
              lead_id: targetId,
              telecaller_id: telecaller_id,
              assigned_to_id: telecaller_id,
              assigned_to: telecaller_id,
            });
            const msg = res?.data?.message || `Lead successfully reassigned to ${newName}!`;
            showToast(msg);
            fetchLeadData();
          } catch (err) {
            console.error("reassignLead API error:", err);
            throw err;
          }
        }}
      />

      <ExportColumnsModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columns={leadExportColumns}
        onExport={handleExportLeads}
      />
    </Box>
  );
};

export default Leads;
