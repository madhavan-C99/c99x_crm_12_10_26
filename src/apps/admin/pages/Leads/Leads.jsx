import ExportModal from "@/apps/admin/components/common/ExportModal";
import { triggerDirectFileDownload } from "@/shared/services/exportService";
import { Box, Typography, Snackbar } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import useDebounce from "@/shared/hooks/useDebounce";

// =============================================================================
// COMPONENT IMPORTS & SUB-MODULES
// =============================================================================
import LeadHeader from "@/apps/admin/components/leads/LeadHeader";
import LeadStats from "@/apps/admin/components/leads/LeadStats";
import LeadTable from "@/apps/admin/components/leads/LeadTable";
import LeadFilter from "@/apps/admin/components/leads/LeadFilter";
import LeadPipeLine from "@/apps/admin/components/leads/LeadPipeLine";
import AddLeadModal from "@/apps/admin/components/common/AddLeadModal";
import UploadLeadsModal from "@/apps/admin/components/common/UploadLeadsModal";
import LeadDetailModal from "@/apps/admin/components/leads/LeadDetailModal";
import MarkAsWonModal from "@/apps/admin/components/leads/MarkAsWonModal";
import MarkAsLossModal from "@/apps/admin/components/leads/MarkAsLossModal";
import EditLeadModal from "@/apps/admin/components/leads/EditLeadModal";
import ReassignLeadModal from "@/apps/admin/components/common/ReassignLeadModal";

// =============================================================================
// API SERVICE IMPORTS
// =============================================================================
import {
  getLeadData,
  exportLeads,
  submitMarkAsWon,
  submitMarkAsLost,
  editLead,
  deleteLead,
  reassignLead,
} from "@/apps/admin/services/leadService";

import { getSelectOptions } from "@/apps/admin/services/dropdownService";

const Leads = () => {
  const location = useLocation();
  const routeState = location.state || {};

  // ---------------------------------------------------------------------------
  // 1. STATE FOR LeadHeader & DYNAMIC PIPELINES / CATEGORIES & STAGES
  // ---------------------------------------------------------------------------
  const [pipelinesList, setPipelinesList] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(
    routeState.pipeline_id || null,
  );
  const [stagesList, setStagesList] = useState([]);
  const [selectedLeadType, setSelectedLeadType] = useState("all");

  useEffect(() => {
    getSelectOptions("L_CATEGORIES")
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setPipelinesList(cats);
          const targetId = routeState.pipeline_id
            ? (cats.find((c) => (c.id ?? c.value) === routeState.pipeline_id)
                ?.id ?? routeState.pipeline_id)
            : (cats[0].id ?? cats[0].value);
          setSelectedPipeline(targetId);
        }
      })
      .catch(() => null);
  }, [routeState.pipeline_id]);

  useEffect(() => {
    if (!selectedPipeline) return;
    const optFilter = { pipeline_id: selectedPipeline };
    getSelectOptions("L_STAGES", optFilter)
      .then((stgs) => {
        if (Array.isArray(stgs) && stgs.length > 0) {
          setStagesList((prev) => {
            if (Array.isArray(prev) && prev.length > 0 && prev.some((s) => s.count !== undefined)) {
              return prev;
            }
            return stgs;
          });

          // Auto-select Missed Follow Up tab if navigated with active_tab === "missed_follow_up"
          if (routeState.active_tab === "missed_follow_up") {
            const missedStage = stgs.find((s) => {
              const name = String(
                s.name || s.label || s.stage_name || "",
              ).toLowerCase();
              return name.includes("missed");
            });
            if (missedStage) {
              const stageVal = String(
                missedStage.id ?? missedStage.value ?? missedStage.name,
              );
              setSelectedLeadType(stageVal);
            }
          }
        }
      })
      .catch(() => null);
  }, [selectedPipeline, routeState.active_tab]);

  // ---------------------------------------------------------------------------
  // 2. STATE FOR LeadStats COMPONENT (Pill Badge Tabs)
  // ---------------------------------------------------------------------------
  // Tab filter value: stage ID from stagesList or "all"

  // ---------------------------------------------------------------------------
  // 3. STATE FOR LeadFilter COMPONENT (Toolbar, Search, Date & Sort)
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState(""); // Search input string
  const debouncedSearchTerm = useDebounce(searchTerm, 400); // 400ms debounced search

  const initialDateFilter = (() => {
    if (!routeState.date_filter) return "today";
    const df = String(routeState.date_filter).toLowerCase();
    if (df.includes("today")) return "today";
    if (df.includes("yesterday")) return "yesterday";
    if (df.includes("week")) return "last_7_days";
    if (df.includes("30")) return "last_30_days";
    if (df.includes("month")) return "this_month";
    if (df.includes("year")) return "this_year";
    if (df.includes("all")) return "all";
    return "today";
  })();
  const [dateFilterType, setDateFilterType] = useState(initialDateFilter);

  const [sortType, setSortType] = useState("newest"); // "newest" | "oldest"
  const [fromDate, setFromDate] = useState(null); // Custom date range start
  const [toDate, setToDate] = useState(null); // Custom date range end

  const initialFilters = (() => {
    const f = {};
    if (routeState.campaign_id && routeState.campaign_id !== "all") {
      f.campaign_name_id = routeState.campaign_id;
      f.campaign_id = routeState.campaign_id;
    }
    return f;
  })();
  const [selectedFilters, setSelectedFilters] = useState(initialFilters); // Checkbox filter values
  const [viewType, setViewType] = useState("list"); // "list" (Table) vs "pipeline" (Kanban)

  // ---------------------------------------------------------------------------
  // 4. SERVER-SIDE PAGINATION & MAIN DATA STORE
  // ---------------------------------------------------------------------------
  const [page, setPage] = useState(1); // 1-based page index
  const [pageSize, setPageSize] = useState(50); // Rows per page
  const [totalRecords, setTotalRecords] = useState(0); // Total lead count from API

  const [tableData, setTableData] = useState([]); // Lead rows array returned by API
  const [statsData, setStatsData] = useState({}); // Summary counts object returned by API
  const [loading, setLoading] = useState(false); // Loading spinner flag

  const abortControllerRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 5. MODAL DIALOG VISIBILITY STATES
  // ---------------------------------------------------------------------------
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Add Lead Modal Visibility
  const [editingLead, setEditingLead] = useState(null); // Currently selected lead for edit
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // Upload Excel Modal Visibility
  const [selectedDetailLead, setSelectedDetailLead] = useState(null); // Selected lead for Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // Detail Modal Visibility
  const [selectedWonLead, setSelectedWonLead] = useState(null); // Selected lead for Mark as Won Modal
  const [isWonModalOpen, setIsWonModalOpen] = useState(false); // Mark as Won Modal Visibility
  const [selectedLossLead, setSelectedLossLead] = useState(null); // Selected lead for Mark as Loss Modal
  const [isLossModalOpen, setIsLossModalOpen] = useState(false); // Mark as Loss Modal Visibility
  const [selectedEditLead, setSelectedEditLead] = useState(null); // Selected lead for Edit Lead Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit Lead Modal Visibility
  const [selectedReassignLead, setSelectedReassignLead] = useState(null); // Selected lead for Reassign Modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // Reassign Modal Visibility

  const leadExportColumns = [
    { id: "s_no", backendKey: "s_no", label: "S.No" },
    { id: "name", backendKey: "name", label: "Full Name" },
    { id: "mobile_no", backendKey: "mobile_no", label: "Contact Number" },
    {
      id: "assigned_to",
      backendKey: "assigned_to",
      label: "Assigned Telecaller",
    },
    { id: "stage", backendKey: "stage", label: "Current Stage" },
    { id: "pipeline", backendKey: "pipeline", label: "Pipeline Category" },
    {
      id: "campaign_name",
      backendKey: "campaign_name",
      label: "Campaign Name",
    },
    { id: "source", backendKey: "source", label: "Lead Source" },
    { id: "course_plan", backendKey: "course_plan", label: "Course Plan" },
    { id: "course_name", backendKey: "course_name", label: "Course Offered" },
    {
      id: "next_follow_up",
      backendKey: "next_follow_up",
      label: "Next Follow-Up Date",
    },
    { id: "amount", backendKey: "amount", label: "Course Fee" },
    {
      id: "pending_amount",
      backendKey: "pending_amount",
      label: "Pending Amount",
    },
    {
      id: "last_contacted",
      backendKey: "last_contacted",
      label: "Last Contacted Date",
    },
    {
      id: "last_conversation_outcome",
      backendKey: "last_conversation_outcome",
      label: "Last Outcome",
    },
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
  const handleSaveLead = (isEdit = false) => {
    showToast(
      isEdit
        ? "The lead is successfully Updated"
        : "The lead is successfully Added",
    );
    fetchLeadData();
  };

  // ===========================================================================
  // 7. HANDLER FOR UploadLeadsModal COMPONENT
  // ===========================================================================
  const handleUploadLeads = () => {
    showToast("Excel sheet uploaded successfully");
    fetchLeadData();
  };

  // ===========================================================================
  // 7B. HANDLER FOR OFFICIAL BACKEND EXCEL EXPORT
  // ===========================================================================
  const handleExportLeads = async (selectedKeys, format = "excel") => {
    setExportLoading(true);
    try {
      showToast("Generating official Excel file from server...");
      const filtersPayload = buildPayload(selectedFilters, page, pageSize);
      delete filtersPayload.page;
      delete filtersPayload.page_size;

      const payload = {
        entity: "leads",
        export_format: format || "excel",
        selected_columns:
          selectedKeys && Array.isArray(selectedKeys) && selectedKeys.length > 0
            ? selectedKeys
            : leadExportColumns.map((c) => c.backendKey),
        filters: filtersPayload,
      };

      const response = await exportLeads(payload);
      const resData = response?.data || response;
      const resultObj = resData?.data || resData;

      let downloadUrl =
        resultObj?.download_url || resData?.download_url || resultObj?.file_url;
      const fileName =
        resultObj?.file_name ||
        resData?.file_name ||
        `Leads_Export_${Date.now()}.${format === "excel" ? "xlsx" : format}`;

      if (downloadUrl) {
        await triggerDirectFileDownload(downloadUrl, fileName);
        showToast(
          resData?.message ||
            resultObj?.message ||
            `Successfully exported leads file!`,
        );
      } else {
        showToast("Export failed. No download URL returned from server.");
      }
    } catch (error) {
      console.error("Backend Export API error:", error);
      showToast("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // ===========================================================================
  // 8. API PAYLOAD BUILDER & BACKEND DATA FETCHING (getLeadData)
  // ===========================================================================
  const buildPayload = (
    filters = selectedFilters,
    currPage = page,
    currPageSize = pageSize,
  ) => {
    const pId = Number(
      selectedPipeline?.id ??
        selectedPipeline?.value ??
        selectedPipeline ??
        pipelinesList?.[0]?.id ??
        pipelinesList?.[0]?.value ??
        0,
    );

    const payload = {
      pipeline_id: pId,
      sort_order: sortType || "newest",
      search: debouncedSearchTerm || "",
      page: currPage,
      page_size: currPageSize,
    };

    if (selectedLeadType && selectedLeadType !== "all") {
      const stageVal = !isNaN(Number(selectedLeadType))
        ? Number(selectedLeadType)
        : selectedLeadType;
      payload.lead_stage_id = stageVal;
      payload.pipeline_stage_id = stageVal;
    }

    if (
      filters?.pipeline_stage_id &&
      filters.pipeline_stage_id !== 0 &&
      filters.pipeline_stage_id !== "all"
    ) {
      payload.pipeline_stage_id = Number(filters.pipeline_stage_id);
    }
    if (filters?.assigned_to_id && filters.assigned_to_id !== 0) {
      payload.assigned_to = filters.assigned_to_id;
    }
    if (
      filters?.lead_source_id &&
      filters.lead_source_id !== 0 &&
      filters.lead_source_id !== "all"
    ) {
      payload.source_id = filters.lead_source_id;
    }
    const campId = filters?.campaign_id || filters?.campaign_name_id;
    if (campId && campId !== 0 && campId !== "all") {
      payload.campaign_id = campId;
    }
    if (
      filters?.course_plan_id &&
      filters.course_plan_id !== 0 &&
      filters.course_plan_id !== "all"
    ) {
      payload.course_plan_id = filters.course_plan_id;
    }
    if (
      filters?.course_id &&
      filters.course_id !== 0 &&
      filters.course_id !== "all"
    ) {
      payload.course_id = filters.course_id;
      payload.course_name_id = filters.course_id;
    }

    if (dateFilterType && dateFilterType !== "all") {
      payload.date_filter_type =
        dateFilterType === "monthly" ? "this_month" : dateFilterType;
    }
    if (dateFilterType === "custom" && fromDate && toDate) {
      payload.from_date = dayjs(fromDate).format("YYYY-MM-DD");
      payload.to_date = dayjs(toDate).format("YYYY-MM-DD");
    }
    return payload;
  };

  // Calls getLeadData API service & parses response with AbortController
  const fetchLeadData = async (
    filters = selectedFilters,
    targetPage = page,
    targetPageSize = pageSize,
  ) => {
    if (!selectedPipeline) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const payload = buildPayload(filters, targetPage, targetPageSize);
      const response = await getLeadData(payload, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const rawData =
        response?.data?.data || response?.data?.result || response?.data;

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
        statsObj?.total_leads ??
        statsObj?.total_count ??
        statsObj?.total_records ??
        (Array.isArray(tableRows) ? tableRows.length : 0);

      if (controller.signal.aborted) return;

      // Update stage tabs from /adm/fetch_all_leads_admin
      if (Array.isArray(rawData?.stage_tabs) && rawData.stage_tabs.length > 0) {
        setStagesList((prev) => {
          if (Array.isArray(prev) && prev.length > rawData.stage_tabs.length) {
            return prev.map((oldStg) => {
              const matchingNew = rawData.stage_tabs.find(
                (n) =>
                  String(n.pipeline_stage_id ?? n.id) ===
                  String(oldStg.pipeline_stage_id ?? oldStg.id)
              );
              return matchingNew ? { ...oldStg, count: matchingNew.count } : oldStg;
            });
          }
          return rawData.stage_tabs;
        });
      }

      setTableData(tableRows);
      setTotalRecords(totalRec);
      setStatsData({
        ...statsObj,
        total_records: totalRec,
        stage_counts: rawData?.stage_counts,
        stage_tabs: rawData?.stage_tabs,
      });
    } catch (error) {
      if (
        error?.name === "CanceledError" ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
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
          <Typography
            sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}
          >
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
          setSelectedLeadType("all");
          setStagesList([]);
        }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 2: LeadStats (Pill Badge Tabs - All Leads, New Lead, Follow up, Missed Follow up, Won, Lost) */}
      {/* --------------------------------------------------------------------- */}
      {viewType === "list" && (
        <LeadStats
          statsData={statsData}
          tableData={tableData}
          totalRecords={totalRecords}
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
          searchTerm={debouncedSearchTerm}
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
            const userId =
              lead.assigned_to_id || lead.user_id || lead.telecaller_id;
            try {
              const res = await deleteLead({
                lead_id: targetId,
                id: targetId,
                user_id: userId,
                user: userId,
              });
              const resData = res?.data;

              if (resData?.status === "failed" || resData?.success === false) {
                showToast(
                  resData?.message ||
                    resData?.detail ||
                    "Failed to delete lead",
                );
                return;
              }

              const message =
                resData?.message ||
                resData?.detail ||
                "The lead is successfully Deleted";
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
      {/* COMPONENT 6: AddLeadModal (Common Modal to add single lead) */}
      {/* --------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <AddLeadModal
          open={isAddModalOpen}
          onClose={handleCloseAddModal}
          selectedPipeline={selectedPipeline}
          onSaveSuccess={() => {
            fetchLeadData();
          }}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 7: UploadLeadsModal (Bulk Excel / CSV File Upload Dialog) */}
      {/* --------------------------------------------------------------------- */}
      {isUploadModalOpen && (
        <UploadLeadsModal
          open={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUploadLeads}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 8: LeadDetailModal (Single Card Details Dialog) */}
      {/* --------------------------------------------------------------------- */}
      {isDetailModalOpen && (
        <LeadDetailModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          lead={selectedDetailLead}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 9: MarkAsWonModal (Exact Figma Mark as Won Dialog) */}
      {/* --------------------------------------------------------------------- */}
      {isWonModalOpen && (
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
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 10: MarkAsLossModal (Exact Figma Mark as Loss Dialog) */}
      {/* --------------------------------------------------------------------- */}
      {isLossModalOpen && (
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
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 11: EditLeadModal (Exact Figma Edit Lead Dialog) */}
      {/* --------------------------------------------------------------------- */}
      {isEditModalOpen && (
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
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 12: ReassignLeadModal (Reassign Telecaller Dialog) */}
      {/* --------------------------------------------------------------------- */}
      {isReassignModalOpen && (
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
                new_telecaller_id: telecaller_id,
                assigned_to_id: telecaller_id,
                assigned_to: telecaller_id,
              });
              const msg =
                res?.data?.message ||
                `Lead successfully reassigned to ${newName}!`;
              showToast(msg);
              fetchLeadData();
            } catch (err) {
              console.error("reassignLead API error:", err);
              throw err;
            }
          }}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMPONENT 13: ExportModal */}
      {/* --------------------------------------------------------------------- */}
      {isExportModalOpen && (
        <ExportModal
          open={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="Leads"
          columns={leadExportColumns}
          availableFormats={["xlsx", "csv", "pdf"]}
          isSubmitting={exportLoading}
          onDownload={async ({ fileFormat, selectedKeys }) => {
            await handleExportLeads(
              selectedKeys,
              fileFormat === "xlsx" ? "excel" : fileFormat,
            );
            setIsExportModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default Leads;
