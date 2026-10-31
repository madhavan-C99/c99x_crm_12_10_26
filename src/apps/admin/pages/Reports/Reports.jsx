import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";

import UserReportDetail from "@/apps/admin/components/reports/UserReportDetail";
import LeadDispositionReportDetail from "@/apps/admin/components/reports/LeadDispositionReportDetail";
import UserStageReportDetail from "@/apps/admin/components/reports/UserStageReportDetail";
import UserFollowUpReportDetail from "@/apps/admin/components/reports/UserFollowUpReportDetail";
import CampaignReportDetail from "@/apps/admin/components/reports/CampaignReportDetail";
import CampaignStageReportDetail from "@/apps/admin/components/reports/CampaignStageReportDetail";
import CampaignLeadReportDetail from "@/apps/admin/components/reports/CampaignLeadReportDetail";
import UserDealReportDetail from "@/apps/admin/components/reports/UserDealReportDetail";
import LoginReportDetail from "@/apps/admin/components/reports/LoginReportDetail";
import DownloadLogsDetail from "@/apps/admin/components/reports/DownloadLogsDetail";
// Campaign Source Report component create pannina apram idha uncomment pannunga:
// import CampaignSourceReportDetail from "@/apps/admin/components/reports/CampaignSourceReportDetail";

import Table from "@/shared/components/table/Table";
import {
  fetchReportsAdmin,
  trackReportViewAdmin,
  fetchRecentlyViewedReportsAdmin,
} from "@/apps/admin/services/reportService";

const REPORT_COMPONENTS = {
  user_report: UserReportDetail,
  lead_disposition_report: LeadDispositionReportDetail,
  user_stage_report: UserStageReportDetail,
  user_followup_report: UserFollowUpReportDetail,
  user_follow_up_report: UserFollowUpReportDetail,
  campaign_report: CampaignReportDetail,
  campaign_stage_report: CampaignStageReportDetail,
  campaign_lead_report: CampaignLeadReportDetail,
  user_deal_report: UserDealReportDetail,
  login_report: LoginReportDetail,
  // campaign_source_report: CampaignSourceReportDetail,
};

const idMap = {
  1: "user_report",
  2: "lead_disposition_report",
  3: "user_stage_report",
  4: "user_followup_report",
  5: "login_report",
  6: "campaign_report",
  7: "campaign_lead_report",
  8: "campaign_stage_report",
  9: "user_deal_report",
  10: "campaign_source_report",
};

// Fixed display order for the "All Reports" tab
const REPORT_ORDER = [
  "user_report",
  "lead_disposition_report",
  "user_stage_report",
  "user_followup_report",
  "login_report",
  "campaign_report",
  "campaign_lead_report",
  "campaign_stage_report",
  "user_deal_report",
  "campaign_source_report",
];

const getReportKey = (report) => {
  if (!report) return "";
  if (report.report_key) return String(report.report_key).trim().toLowerCase();
  if (report.key) return String(report.key).trim().toLowerCase();
  if (report.name) {
    return String(report.name)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }
  return idMap[report.id] || "";
};

const getReportComponent = (selectedReport) => {
  if (!selectedReport) return null;
  const key = getReportKey(selectedReport);
  return REPORT_COMPONENTS[key] || null;
};

const normalizeKey = (key) =>
  key === "user_follow_up_report" ? "user_followup_report" : key;

// Sorts by REPORT_ORDER (when shouldSort is true) and adds a 1..n display number
const orderReports = (list, shouldSort) => {
  const sorted = shouldSort
    ? [...list].sort((a, b) => {
        const ia = REPORT_ORDER.indexOf(normalizeKey(getReportKey(a)));
        const ib = REPORT_ORDER.indexOf(normalizeKey(getReportKey(b)));
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
    : list;
  return sorted.map((r, i) => ({ ...r, display_no: i + 1 }));
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDownloadLogs, setShowDownloadLogs] = useState(false);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        let res;
        if (activeTab === "recentlyViewed") {
          res = await fetchRecentlyViewedReportsAdmin(5);
        } else {
          res = await fetchReportsAdmin(activeTab);
        }

        const list = res?.data?.reports || res?.data || [];
        setReportsList(
          Array.isArray(list) ? orderReports(list, activeTab === "all") : [],
        );
      } catch (error) {
        console.error("Error fetching reports:", error);
        setReportsList([]);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [activeTab]);

  const reportsColumns = [
    {
      field: "display_no",
      headerName: "No",
      minWidth: "70px",
      align: "center",
    },
    {
      field: "name",
      headerName: "Report Name",
      minWidth: "240px",
      align: "left",
      renderCell: (row) => (
        <Typography
          sx={{
            color: "#4D4D4D",
            fontWeight: 600,
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {row?.name || "-"}
        </Typography>
      ),
    },
    { field: "description", headerName: "Description", align: "left" },
    {
      field: "category",
      headerName: "Category",
      minWidth: "280px",
      align: "left",
    },
  ];

  const handleDownloadLogs = () => {
    setShowDownloadLogs(true);
  };

  const handleReportClick = (row) => {
    const Component = getReportComponent(row);
    if (!Component) {
      toast.info(`${row?.name || "This report"} is under development.`);
      return;
    }
    const key = getReportKey(row);
    if (key) {
      trackReportViewAdmin(key).catch((err) => {
        console.error("Failed to track report view:", err);
      });
    }
    setSelectedReport(row);
  };

  if (showDownloadLogs) {
    return <DownloadLogsDetail onBack={() => setShowDownloadLogs(false)} />;
  }

  // Render individual report detail component when selected
  const SelectedComponent = getReportComponent(selectedReport);
  if (SelectedComponent) {
    return React.createElement(SelectedComponent, {
      onBack: () => setSelectedReport(null),
    });
  }

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
      {/* Top Header Row */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: "#0F172A",
            fontSize: "24px",
            letterSpacing: "-0.02em",
          }}
        >
          Reports
        </Typography>
      </Box>

      {/* Tabs & Action Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", gap: 3 }}>
          <Box
            onClick={() => setActiveTab("all")}
            sx={{
              cursor: "pointer",
              pb: 0.75,
              borderBottom:
                activeTab === "all"
                  ? "2px solid #84CC16"
                  : "2px solid transparent",
            }}
          >
            <Typography
              sx={{
                fontWeight: activeTab === "all" ? 700 : 500,
                color: activeTab === "all" ? "#84CC16" : "#94A3B8",
                fontSize: "13px",
              }}
            >
              All Reports
            </Typography>
          </Box>

          <Box
            onClick={() => setActiveTab("recentlyViewed")}
            sx={{
              cursor: "pointer",
              pb: 0.75,
              borderBottom:
                activeTab === "recentlyViewed"
                  ? "2px solid #84CC16"
                  : "2px solid transparent",
            }}
          >
            <Typography
              sx={{
                fontWeight: activeTab === "recentlyViewed" ? 700 : 500,
                color: activeTab === "recentlyViewed" ? "#84CC16" : "#94A3B8",
                fontSize: "13px",
              }}
            >
              Recently Viewed
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<AddIcon sx={{ fontSize: "18px !important" }} />}
          onClick={handleDownloadLogs}
          sx={{
            borderColor: "#84CC16",
            color: "#65A30D",
            backgroundColor: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "8px",
            px: 2,
            py: 0.75,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            "&:hover": {
              borderColor: "#65A30D",
              backgroundColor: "#F7FEE7",
            },
          }}
        >
          Download Logs
        </Button>
      </Box>

      <Table
        columns={reportsColumns}
        rows={reportsList}
        loading={loading}
        onRowClick={handleReportClick}
        minWidth={1000}
        sx={{
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
