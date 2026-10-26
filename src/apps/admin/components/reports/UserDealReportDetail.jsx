import { useState, useEffect, useRef } from "react";
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
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ErrorIcon from "@mui/icons-material/Error";
import ExportModal from "@/apps/admin/components/common/ExportModal";
import useReportExport from "@/apps/admin/hooks/useReportExport";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import Table from "@/shared/components/table/Table";
import {
  fetchUsersDropdownAdmin,
  fetchReportingManagersDropdownAdmin,
  fetchPipelinesDropdownAdmin,
  fetchCampaignsDropdownAdmin,
  executeReportAdmin,
} from "@/apps/admin/services/reportService";

export default function UserDealReportDetail({ onBack }) {
  const [dateFilter, setDateFilter] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("All");
  const [reportingManager, setReportingManager] = useState("All");
  const [pipelineFilter, setPipelineFilter] = useState("All");
  const [campaignFilter, setCampaignFilter] = useState("All");
  const [usersList, setUsersList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [pipelinesList, setPipelinesList] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);

  // Table & API states
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const getBackendDateFilter = (filter) => {
    const map = {
      all: "All",
      today: "Today",
      yesterday: "Yesterday",
      weekly: "Last 7 Days",
      monthly: "This Month",
      year: "Last 30 Days",
      custom: "Custom Date",
    };
    return map[filter] || filter || "Today";
  };

  const prevDateRef = useRef({ dateFilter, fromDate, toDate });
  useEffect(() => {
    if (
      prevDateRef.current.dateFilter !== dateFilter ||
      prevDateRef.current.fromDate !== fromDate ||
      prevDateRef.current.toDate !== toDate
    ) {
      prevDateRef.current = { dateFilter, fromDate, toDate };
      setPage(0);
    }
  }, [dateFilter, fromDate, toDate]);

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
    const loadStaticDropdowns = async () => {
      try {
        const [usersRes, managersRes, pipelinesRes] = await Promise.all([
          fetchUsersDropdownAdmin(),
          fetchReportingManagersDropdownAdmin(),
          fetchPipelinesDropdownAdmin(),
        ]);
        if (ignore) return;
        if (usersRes?.success && Array.isArray(usersRes?.data)) {
          setUsersList(usersRes.data);
        } else if (Array.isArray(usersRes)) {
          setUsersList(usersRes);
        }

        if (managersRes?.success && Array.isArray(managersRes?.data)) {
          setManagersList(managersRes.data);
        } else if (Array.isArray(managersRes)) {
          setManagersList(managersRes);
        }

        if (pipelinesRes?.success && Array.isArray(pipelinesRes?.data)) {
          setPipelinesList(pipelinesRes.data);
        } else if (Array.isArray(pipelinesRes)) {
          setPipelinesList(pipelinesRes);
        }
      } catch (error) {
        if (ignore) return;
        console.error("Error fetching dropdown options:", error);
        setToast({
          open: true,
          message: "Failed to load dropdown options. Please try again.",
          severity: "error",
        });
      }
    };
    loadStaticDropdowns();
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
      if (dateFilter === "custom" && (!fromDate || !toDate)) {
        setLoading(false);
        setRows([]);
        setTotalRecords(0);
        return;
      }

      setLoading(true);

      const payload = {
        report_key: "user_deal_report",
        date_filter: getBackendDateFilter(dateFilter),
        user_id: selectedUser,
        reporting_manager: reportingManager,
        pipeline_id: pipelineFilter,
        campaign_id: campaignFilter,
        page: page + 1,
        limit: rowsPerPage,
      };

      if (dateFilter === "custom") {
        payload.from_date = fromDate;
        payload.to_date = toDate;
      }

      try {
        const response = await executeReportAdmin(payload);
        if (ignore || currentRequestId !== requestIdRef.current) return;

        const root =
          response?.data &&
          typeof response.data === "object" &&
          !Array.isArray(response.data)
            ? response.data
            : response;

        const isSuccess = root?.success !== false && response?.success !== false;

        if (isSuccess && root) {
          const list = Array.isArray(root?.data)
            ? root.data
            : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : [];
          setRows(list);
          setTotalRecords(
            typeof root?.total_records === "number"
              ? root.total_records
              : typeof response?.total_records === "number"
              ? response.total_records
              : list.length,
          );
        } else {
          const errMsg =
            response?.message || "Failed to fetch user deal report";
          setToast({
            open: true,
            message: errMsg,
            severity: "error",
          });
          setRows([]);
          setTotalRecords(0);
        }
      } catch (err) {
        if (ignore || currentRequestId !== requestIdRef.current) return;
        console.error("Error fetching user deal report:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch user deal report";
        setToast({
          open: true,
          message: errMsg,
          severity: "error",
        });
        setRows([]);
        setTotalRecords(0);
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
  }, [
    dateFilter,
    selectedUser,
    reportingManager,
    pipelineFilter,
    campaignFilter,
    page,
    rowsPerPage,
    fromDate,
    toDate,
  ]);

  const handleUserChange = (val) => {
    setSelectedUser(val);
    setPage(0);
  };

  const handleManagerChange = (val) => {
    setReportingManager(val);
    setPage(0);
  };

  const handlePipelineFilterChange = (val) => {
    setPipelineFilter(val);
    setCampaignFilter("All");
    setPage(0);
  };

  const handleCampaignFilterChange = (val) => {
    setCampaignFilter(val);
    setPage(0);
  };

  const userDealReportColumns = [
    "User Name",
    "Reporting Manager",
    "Date Range",
    "Total Joined Converted",
    "Won Value",
    "Total Lost Leads",
    "Total Lost Value",
  ];

  const exportProps = useReportExport({
    reportKey: "user_deal_report",
    columns: userDealReportColumns,
    getFilters: () => ({
      date_filter: getBackendDateFilter(dateFilter),
      from_date: dateFilter === "custom" ? fromDate : "",
      to_date: dateFilter === "custom" ? toDate : "",
      user_id: selectedUser,
      reporting_manager: reportingManager,
      pipeline_id: pipelineFilter,
      campaign_id: campaignFilter,
    }),
  });

  const tableColumns = [
    {
      field: "s_no",
      headerName: "No",
      minWidth: "60px",
      align: "center",
      renderCell: (row) => row.s_no ?? row.id,
    },
    {
      field: "user_name",
      headerName: "User Name",
      minWidth: "160px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#4D4D4D",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.user_name}
        </Typography>
      ),
    },
    {
      field: "reporting_manager",
      headerName: "Reporting Manager",
      minWidth: "180px",
      align: "center",
    },
    {
      field: "date_range",
      headerName: "Date",
      minWidth: "230px",
      align: "center",
    },
    {
      field: "total_joined_converted",
      headerName: "Total Joined/Converted",
      minWidth: "200px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#4D4D4D",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.total_joined_converted}
        </Typography>
      ),
    },
    {
      field: "won_value",
      headerName: "Won Value",
      minWidth: "140px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#16A34A",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.won_value}
        </Typography>
      ),
    },
    {
      field: "total_lost_leads",
      headerName: "Total Lost Leads",
      minWidth: "160px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#DC2626",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.total_lost_leads}
        </Typography>
      ),
    },
    {
      field: "total_lost_value",
      headerName: "Total Lost Value",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#DC2626",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row.total_lost_value}
        </Typography>
      ),
    },
  ];

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
          User Deal Report
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
          <DateRangeSelect
            filterType={dateFilter}
            setFilterType={setDateFilter}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            defaultType="today"
          />

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={selectedUser}
              onChange={(e) => handleUserChange(e.target.value)}
              displayEmpty
              startAdornment={
                <GroupOutlinedIcon
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
              <MenuItem value="All">All Users</MenuItem>
              {usersList.map((user, idx) => {
                const val =
                  user.id ?? user.value;
                const label =
                  user.name || user.label || String(val);
                return (
                  <MenuItem key={val} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={reportingManager}
              onChange={(e) => handleManagerChange(e.target.value)}
              displayEmpty
              startAdornment={
                <PersonOutlinedIcon
                  sx={{ fontSize: "18px", mr: 1, color: "#64748B" }}
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
              <MenuItem value="All">All Reporting Managers</MenuItem>
              {managersList.map((mgr, idx) => {
                const val = mgr.id ?? mgr.value;
                const label =
                  mgr.label || mgr.name || String(val);
                return (
                  <MenuItem key={val} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

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
                const val = pipe.id ?? pipe.value;
                const label =
                  pipe.label || pipe.name || String(val);
                return (
                  <MenuItem key={val} value={val}>
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
                const val = camp.id ?? camp.value;
                const label =
                  camp.label || camp.name || String(val);
                return (
                  <MenuItem key={val} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        <IconButton
          onClick={exportProps.openDownloadModal}
          sx={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            p: 1,
            mr: 4,
            color: "#475569",
            "&:hover": { backgroundColor: "#F8FAFC", color: "#84CC16" },
          }}
        >
          <FileDownloadOutlinedIcon sx={{ fontSize: "24px" }} />
        </IconButton>
      </Box>

      {/* Table matching Leads/Pending Payments typography */}
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
        minWidth={1450}
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
        reportName="User Deal Report"
        columns={userDealReportColumns}
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
