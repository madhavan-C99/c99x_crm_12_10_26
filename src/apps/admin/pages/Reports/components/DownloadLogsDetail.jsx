import { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Table from "@/shared/components/table/Table";
import { fetchDownloadLogsAdmin } from "@/apps/admin/services/reportService";

const FONT = "'Inter', sans-serif";

const INITIAL_DOWNLOAD_LOGS = [
  {
    id: 1,
    no: 1,
    date: "12 Oct 2026 6:18 PM",
    requested_user_name: "Gunalraj k",
    report_type: "Reports",
    campaign_name: "--",
    pipeline: "--",
    status: "Download Now",
  },
  {
    id: 2,
    no: 2,
    date: "12 Oct 2026 6:17 PM",
    requested_user_name: "Gunalraj k",
    report_type: "Reports",
    campaign_name: "--",
    pipeline: "--",
    status: "Download Now",
  },
  {
    id: 3,
    no: 3,
    date: "12 Oct 2026 6:16 PM",
    requested_user_name: "Gunalraj k",
    report_type: "Reports",
    campaign_name: "--",
    pipeline: "--",
    status: "Download Now",
  },
  {
    id: 4,
    no: 4,
    date: "09 Oct 2026 7:37 PM",
    requested_user_name: "Gunalraj k",
    report_type: "Reports",
    campaign_name: "--",
    pipeline: "--",
    status: "Download Now",
  },
  {
    id: 5,
    no: 5,
    date: "09 Oct 2026 5:48 PM",
    requested_user_name: "Gunalraj k",
    report_type: "Reports",
    campaign_name: "--",
    pipeline: "--",
    status: "Download Now",
  },
  {
    id: 6,
    no: 6,
    date: "08 Oct 2026 4:27 PM",
    requested_user_name: "Gunalraj k",
    report_type: "Reports",
    campaign_name: "--",
    pipeline: "--",
    status: "Download Now",
  },
  {
    id: 7,
    no: 7,
    date: "06 Oct 2026 11:55 AM",
    requested_user_name: "Gunalraj k",
    report_type: "Unified Leads",
    campaign_name: "--",
    pipeline: "Code99 SMV Leads",
    status: "Link Expired",
  },
  {
    id: 8,
    no: 8,
    date: "05 Oct 2026 3:53 PM",
    requested_user_name: "Gunalraj k",
    report_type: "Reports",
    campaign_name: "--",
    pipeline: "--",
    status: "Link Expired",
  },
  {
    id: 9,
    no: 9,
    date: "27 Aug 2026 10:26 AM",
    requested_user_name: "Tharun",
    report_type: "Unified Leads",
    campaign_name: "--",
    pipeline: "Code99 SMV Leads",
    status: "Link Expired",
  },
  {
    id: 10,
    no: 10,
    date: "24 Aug 2026 3:03 PM",
    requested_user_name: "Vinitha",
    report_type: "Unified Leads",
    campaign_name: "--",
    pipeline: "Code99 SMV Leads",
    status: "Link Expired",
  },
  {
    id: 11,
    no: 11,
    date: "24 Aug 2026 2:59 PM",
    requested_user_name: "Vinitha",
    report_type: "Unified Leads",
    campaign_name: "--",
    pipeline: "Code99 SMV Leads",
    status: "Link Expired",
  },
];

export default function DownloadLogsDetail({ onBack }) {
  const [logs, setLogs] = useState(INITIAL_DOWNLOAD_LOGS);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    let ignore = false;
    const loadLogs = async () => {
      setLoading(true);
      try {
        const res = await fetchDownloadLogsAdmin();
        if (ignore) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setLogs(
            list.map((item, idx) => ({
              id: item.id || idx + 1,
              no: item.no || idx + 1,
              date:
                item.date ||
                item.downloaded_at ||
                item.downloadedAt ||
                item.created_at ||
                "--",
              requested_user_name:
                item.requested_user_name ||
                item.requestedUserName ||
                item.user_name ||
                item.userName ||
                "--",
              report_type:
                item.report_type ||
                item.reportType ||
                item.report_name ||
                item.reportName ||
                "--",
              campaign_name: item.campaign_name || item.campaignName || "--",
              pipeline: item.pipeline || item.category || "--",
              status: item.status || "Download Now",
              download_url: item.download_url || item.url || null,
            })),
          );
        }
      } catch (err) {
        console.error("Error fetching download logs:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadLogs();
    return () => {
      ignore = true;
    };
  }, []);

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
        const isDownload = String(row.status || "")
          .toLowerCase()
          .includes("download");
        return (
          <Typography
            onClick={() => {
              if (isDownload && row.download_url) {
                window.open(row.download_url, "_blank");
              }
            }}
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: FONT,
              color: isDownload ? "#2563EB" : "#94A3B8",
              cursor: isDownload ? "pointer" : "default",
              "&:hover": {
                textDecoration: isDownload ? "underline" : "none",
              },
            }}
          >
            {row.status}
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
            fontFamily: FONT,
          }}
        >
          Download Logs
        </Typography>
      </Box>

      {/* Shared Table */}
      <Table
        columns={columns}
        rows={logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
        loading={loading}
        serverSide={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={logs.length}
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
