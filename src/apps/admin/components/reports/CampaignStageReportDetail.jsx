import { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterListIcon from "@mui/icons-material/FilterList";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ErrorIcon from "@mui/icons-material/Error";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import Table from "@/shared/components/table/Table";

import {
  fetchPipelinesDropdownAdmin,
  fetchCampaignsDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

export default function CampaignStageReportDetail({ onBack }) {
  const [pipelineFilter, setPipelineFilter] = useState("All");
  const [campaignFilter, setCampaignFilter] = useState("All");
  const [pipelinesList, setPipelinesList] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);

  // Table & API states
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Toast / notification state (only for errors)
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Race condition tracker & clean unmount check
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadPipelines = async () => {
      try {
        const pipelinesRes = await fetchPipelinesDropdownAdmin();
        if (ignore) return;
        if (pipelinesRes?.success && Array.isArray(pipelinesRes?.data)) {
          setPipelinesList(pipelinesRes.data);
        } else if (Array.isArray(pipelinesRes)) {
          setPipelinesList(pipelinesRes);
        }
      } catch (error) {
        if (ignore) return;
        console.error("Error fetching pipeline options:", error);
        setToast({
          open: true,
          message: "Failed to load dropdown options. Please try again.",
          severity: "error",
        });
      }
    };
    loadPipelines();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadCampaigns = async () => {
      try {
        const filterParam =
          pipelineFilter === "All" ? undefined : pipelineFilter;
        const campaignsRes = await fetchCampaignsDropdownAdmin(filterParam);
        if (ignore) return;
        if (campaignsRes?.success && Array.isArray(campaignsRes?.data)) {
          setCampaignsList(campaignsRes.data);
        } else if (Array.isArray(campaignsRes)) {
          setCampaignsList(campaignsRes);
        } else {
          setCampaignsList([]);
        }
      } catch (error) {
        if (ignore) return;
        console.error("Error fetching campaign options:", error);
        setCampaignsList([]);
        setToast({
          open: true,
          message: "Failed to load campaigns. Please try again.",
          severity: "error",
        });
      }
    };

    loadCampaigns();

    return () => {
      ignore = true;
    };
  }, [pipelineFilter]);

  useEffect(() => {
    let ignore = false;
    const currentRequestId = ++requestIdRef.current;

    const fetchReport = async () => {
      setLoading(true);

      const payload = {
        report_key: "campaign_stage_report",
        pipeline_id: pipelineFilter,
        campaign_id: campaignFilter,
        page: page + 1,
        limit: rowsPerPage,
      };

      try {
        const response = await executeReportAdmin(payload);
        if (ignore || currentRequestId !== requestIdRef.current) return;

        if (response && response.success !== false) {
          const list = Array.isArray(response.data) ? response.data : [];
          setRows(list);
          if (Array.isArray(response.columns)) {
            setColumns(response.columns);
          }
          setTotalRecords(
            typeof response.total_records === "number"
              ? response.total_records
              : list.length,
          );
        } else {
          const errMsg =
            response?.message || "Failed to fetch campaign stage report";
          setToast({
            open: true,
            message: errMsg,
            severity: "error",
          });
          setRows([]);
          setTotalRecords(0);
          setColumns([]);
        }
      } catch (err) {
        if (ignore || currentRequestId !== requestIdRef.current) return;
        console.error("Error fetching campaign stage report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch campaign stage report";
        setToast({
          open: true,
          message: errMsg,
          severity: "error",
        });
        setRows([]);
        setTotalRecords(0);
        setColumns([]);
      } finally {
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      ignore = true;
    };
  }, [pipelineFilter, campaignFilter, page, rowsPerPage]);

  const handlePipelineFilterChange = (val) => {
    setPipelineFilter(val);
    setCampaignFilter("All");
    setPage(0);
  };

  const handleCampaignFilterChange = (val) => {
    setCampaignFilter(val);
    setPage(0);
  };

  // Dynamically build Table columns from API response columns
  const tableColumns = useMemo(() => {
    if (!Array.isArray(columns) || columns.length === 0) return [];

    return columns.map((col) => {
      const headerText = col.headerName || col.field || "";
      const headerLen = headerText.length;
      const minWidth = Math.max(70, headerLen * 11 + 35);

      const colDef = {
        field: col.field,
        headerName: headerText,
        align: col.align || "center",
        minWidth: `${minWidth}px`,
      };

      if (col.field === "s_no" || col.headerName === "No") {
        colDef.renderCell = (row) => row.s_no ?? row.id;
      } else if (col.color) {
        colDef.renderCell = (row) => (
          <Typography
            sx={{
              color: col.color,
              fontWeight: 600,
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {row[col.field]}
          </Typography>
        );
      }

      return colDef;
    });
  }, [columns]);

  const tableMinWidth = useMemo(() => {
    if (!tableColumns || tableColumns.length === 0) return 1200;
    const totalWidth = tableColumns.reduce(
      (sum, col) => sum + parseInt(col.minWidth, 10),
      0,
    );
    return Math.max(1200, totalWidth);
  }, [tableColumns]);

  const downloadReportColumns = useMemo(
    () => columns.map((c) => c.headerName || c.field),
    [columns],
  );

  const exportProps = useReportExport({
    reportKey: "campaign_stage_report",
    columns: downloadReportColumns,
    getFilters: () => ({
      pipeline_id: pipelineFilter,
      campaign_id: campaignFilter,
    }),
  });

  return (
    <Box
      sx={{
        pr: 3,
        pb: 4,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Detail View Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{
            p: 0.5,
            color: "#0F172A",
            "&:hover": { backgroundColor: "#E2E8F0" },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: "22px" }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#0F172A",
            fontSize: "22px",
            letterSpacing: "-0.01em",
          }}
        >
          Campaign Stage Report
        </Typography>
      </Box>

      {/* Filter Controls Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={pipelineFilter}
              onChange={(e) => handlePipelineFilterChange(e.target.value)}
              displayEmpty
              startAdornment={
                <FilterListIcon
                  sx={{ fontSize: "16px", mr: 1, color: "#64748B" }}
                />
              }
              sx={{
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 500,
                color: "#475569",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
              }}
            >
              <MenuItem value="All">All Pipelines</MenuItem>
              {pipelinesList.map((pipe, idx) => {
                const val = pipe.value ?? pipe.id ?? pipe.name ?? pipe;
                const label =
                  pipe.label ?? pipe.name ?? pipe.category_name ?? String(val);
                return (
                  <MenuItem key={pipe.id || val || idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={campaignFilter}
              onChange={(e) => handleCampaignFilterChange(e.target.value)}
              displayEmpty
              startAdornment={
                <FilterListIcon
                  sx={{ fontSize: "16px", mr: 1, color: "#64748B" }}
                />
              }
              sx={{
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 500,
                color: "#475569",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
              }}
            >
              <MenuItem value="All">All Campaigns</MenuItem>
              {campaignsList.map((camp, idx) => {
                const val = camp.value ?? camp.id ?? camp.name ?? camp;
                const label =
                  camp.label ?? camp.name ?? camp.campaign_name ?? String(val);
                return (
                  <MenuItem key={camp.id || val || idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              p: 1,
              color: "#475569",
              "&:hover": { backgroundColor: "#F8FAFC" },
            }}
          >
            <ShareOutlinedIcon sx={{ fontSize: "24px" }} />
          </IconButton>
          <IconButton
            onClick={exportProps.openDownloadModal}
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              p: 1,
              color: "#475569",
              "&:hover": { backgroundColor: "#F8FAFC", color: "#84CC16" },
            }}
          >
            <FileDownloadOutlinedIcon sx={{ fontSize: "20px" }} />
          </IconButton>
        </Box>
      </Box>

      <Table
        columns={tableColumns}
        rows={rows}
        loading={loading}
        serverSide={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalRecords}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          const newLimit = parseInt(e.target.value, 10);
          setRowsPerPage(newLimit);
          setPage(0);
        }}
        getRowId={(row) => row.id}
        minWidth={tableMinWidth}
        sx={{
          "& th:not(:last-child)": {
            borderRight: "1px solid #D0CCCC !important",
          },
          "& td:not(:last-child)": {
            borderRight: "1px solid #D0CCCC !important",
          },
        }}
      />

      {/* DOWNLOAD REPORT MODAL */}
      <ExportModal
        open={exportProps.downloadModalOpen}
        onClose={exportProps.closeDownloadModal}
        reportName="Campaign Stage Report"
        columns={downloadReportColumns}
        isSubmitting={exportProps.isSubmitting}
        onDownload={exportProps.handleDownloadSubmit}
      />

      {/* FLOATING TOP-CENTER PILL TOAST POPUP */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 1 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            px: 3,
            py: 1.2,
            borderRadius: "50px",
            border: "1.5px solid #EF4444",
            boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <ErrorIcon sx={{ color: "#EF4444", fontSize: 22 }} />
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#0F172A",
            }}
          >
            {toast.message}
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  );
}
