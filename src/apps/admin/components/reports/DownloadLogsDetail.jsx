import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import Table from "@/shared/components/table/Table";
import { getExportLogs, downloadExport } from "@/apps/admin/services/exportService";

const FONT = "'Inter', sans-serif";

const formatLogRows = (list, page, rowsPerPage) =>
  list.map((item, idx) => ({
    id: item.id || idx + 1,
    no: page * rowsPerPage + idx + 1,
    date: item.created_at
      ? dayjs(item.created_at).isValid()
        ? dayjs(item.created_at).format("DD MMM YYYY h:mm A")
        : item.created_at
      : item.date || "--",
    requested_user_name: item.requested_user_name || item.user_name || "--",
    report_type: item.report_type || item.report_name || "--",
    campaign_name: item.campaign_name || "--",
    pipeline: item.pipeline_name || item.pipeline || "--",
    status: String(item.status || "").toLowerCase(),
    error_message: item.error_message || item.message || null,
    file_name: item.file_name || null,
    file_format: item.file_format || "xlsx",
  }));

export default function DownloadLogsDetail({ onBack }) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleBack = onBack || (() => navigate(-1));

  // Initial load & page/rowsPerPage change
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await getExportLogs({
          page: page + 1,
          limit: rowsPerPage,
        });
        if (!isMounted) return;

        const rawList =
          res?.data?.data ||
          (Array.isArray(res?.data) ? res.data : []) ||
          (Array.isArray(res) ? res : []);
        const list = Array.isArray(rawList) ? rawList : [];

        setLogs(formatLogRows(list, page, rowsPerPage));

        const total =
          typeof res?.data?.total_records === "number"
            ? res.data.total_records
            : typeof res?.total_records === "number"
            ? res.total_records
            : typeof res?.data?.total === "number"
            ? res.data.total
            : typeof res?.total === "number"
            ? res.total
            : list.length;
        setTotalCount(total);
      } catch (err) {
        console.error("Error fetching download logs:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [page, rowsPerPage]);

  // Conditional polling: every 6s ONLY while any row is pending or processing
  useEffect(() => {
    const hasPending = logs.some(
      (l) => l.status === "pending" || l.status === "processing"
    );

    if (!hasPending) return;

    let isMounted = true;
    const timer = setInterval(async () => {
      try {
        const res = await getExportLogs({
          page: page + 1,
          limit: rowsPerPage,
        });
        if (!isMounted) return;
        const rawList =
          res?.data?.data ||
          (Array.isArray(res?.data) ? res.data : []) ||
          (Array.isArray(res) ? res : []);
        const list = Array.isArray(rawList) ? rawList : [];
        setLogs(formatLogRows(list, page, rowsPerPage));

        const total =
          typeof res?.data?.total_records === "number"
            ? res.data.total_records
            : typeof res?.total_records === "number"
            ? res.total_records
            : null;
        if (total !== null) setTotalCount(total);
      } catch (err) {
        console.error("Error polling download logs:", err);
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [logs, page, rowsPerPage]);

  const handleDownloadFile = async (exportId, fileName) => {
    if (downloadingId) return;
    setDownloadingId(exportId);
    try {
      await downloadExport(exportId, fileName);
      toast.success("File downloaded successfully!");
    } catch (err) {
      console.error("File download error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Download failed. Please try again.";
      toast.error(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      field: "no",
      headerName: "No",
      minWidth: "70px",
      align: "center",
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            color: "#4D4D4D",
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          {row.no}
        </Typography>
      ),
    },
    {
      field: "date",
      headerName: "Date",
      minWidth: "200px",
      align: "left",
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            color: "#0F172A",
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          {row.date}
        </Typography>
      ),
    },
    {
      field: "requested_user_name",
      headerName: "Requested User Name",
      minWidth: "220px",
      align: "left",
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            color: "#0F172A",
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          {row.requested_user_name}
        </Typography>
      ),
    },
    {
      field: "report_type",
      headerName: "Report Type",
      minWidth: "160px",
      align: "left",
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            color: "#0F172A",
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          {row.report_type}
        </Typography>
      ),
    },
    {
      field: "campaign_name",
      headerName: "Campaign Name",
      minWidth: "160px",
      align: "left",
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            color: "#64748B",
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          {row.campaign_name}
        </Typography>
      ),
    },
    {
      field: "pipeline",
      headerName: "Pipeline",
      minWidth: "180px",
      align: "left",
      renderCell: (row) => (
        <Typography
          sx={{
            fontSize: "14px",
            color: "#0F172A",
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          {row.pipeline}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: "160px",
      align: "left",
      renderCell: (row) => {
        const isDownloading = downloadingId === row.id;

        // Completed -> Clickable Downloaded status link
        if (row.status === "completed" || row.status === "downloaded" || row.status === "success") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                onClick={() =>
                  handleDownloadFile(row.id, row.file_name || `${row.report_type || "report"}.${row.file_format || "xlsx"}`)
                }
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: FONT,
                  color: "#16A34A",
                  cursor: isDownloading ? "wait" : "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                {isDownloading ? "Downloading..." : "Downloaded"}
              </Typography>
              {isDownloading && (
                <CircularProgress size={14} sx={{ color: "#16A34A" }} />
              )}
            </Box>
          );
        }

        // Pending or Processing -> "Processing..." with subtle indicator
        if (row.status === "pending" || row.status === "processing") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={14} sx={{ color: "#3B82F6" }} />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 500,
                  fontFamily: FONT,
                  color: "#3B82F6",
                }}
              >
                Processing...
              </Typography>
            </Box>
          );
        }

        // Failed -> Red "Failed" text with tooltip of error message
        if (row.status === "failed") {
          return (
            <Tooltip
              title={row.error_message || "Export generation failed. Please try again."}
              arrow
              placement="top"
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: FONT,
                  color: "#DC2626",
                  cursor: "help",
                  display: "inline-block",
                  textDecoration: "underline dotted #DC2626",
                }}
              >
                Failed
              </Typography>
            </Tooltip>
          );
        }

        // Fallback for expired or any other status
        return (
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: FONT,
              color: "#94A3B8",
            }}
          >
            {row.status || "--"}
          </Typography>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        pr: 3,
        pb: 5,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: FONT,
      }}
    >
      {/* Top Header Row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <IconButton
          onClick={handleBack}
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
            fontFamily: FONT,
          }}
        >
          Download Logs
        </Typography>
      </Box>

      {/* Shared Table */}
      <Table
        columns={columns}
        rows={logs}
        loading={loading}
        serverSide={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        minWidth={1100}
        sx={{
          "& th:first-of-type, & td:first-of-type": {
            textAlign: "center !important",
          },
          "& th:nth-of-type(n+2)": {
            textAlign: "left !important",
            pl: "24px !important",
          },
          "& td:nth-of-type(n+2)": {
            textAlign: "left !important",
            pl: "24px !important",
          },
          "& th:not(:last-child)": {
            borderRight: "1px solid #D0CCCC !important",
          },
          "& td:not(:last-child)": {
            borderRight: "1px solid #D0CCCC !important",
          },
        }}
      />
    </Box>
  );
}
