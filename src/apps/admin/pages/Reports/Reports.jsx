import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";

import UserReportDetail from "./components/UserReportDetail";
import LeadDispositionReportDetail from "./components/LeadDispositionReportDetail";
import UserStageReportDetail from "./components/UserStageReportDetail";
import UserFollowUpReportDetail from "./components/UserFollowUpReportDetail";
import CampaignReportDetail from "./components/CampaignReportDetail";
import CampaignStageReportDetail from "./components/CampaignStageReportDetail";
import CampaignLeadReportDetail from "./components/CampaignLeadReportDetail";
import UserDealReportDetail from "./components/UserDealReportDetail";
import LoginReportDetail from "./components/LoginReportDetail";
import DownloadLogsDetail from "./components/DownloadLogsDetail";

import Table from "@/shared/components/table/Table";
import {
  fetchReportsAdmin,
  trackReportViewAdmin,
  fetchRecentlyViewedReportsAdmin,
} from "@/apps/admin/services/reportService";

const REPORT_COMPONENTS = {
  // User Report
  user_report: UserReportDetail,
  userreport: UserReportDetail,
  "user report": UserReportDetail,

  // Lead Disposition Report
  lead_disposition_report: LeadDispositionReportDetail,
  leaddispositionreport: LeadDispositionReportDetail,
  "lead disposition report": LeadDispositionReportDetail,

  // User Stage Report
  user_stage_report: UserStageReportDetail,
  userstagereport: UserStageReportDetail,
  "user stage report": UserStageReportDetail,

  // User Follow-Up Report
  user_followup_report: UserFollowUpReportDetail,
  user_follow_up_report: UserFollowUpReportDetail,
  userfollowupreport: UserFollowUpReportDetail,
  userfollow_upreport: UserFollowUpReportDetail,
  "user follow-up report": UserFollowUpReportDetail,
  "user follow up report": UserFollowUpReportDetail,

  // Campaign Report
  campaign_report: CampaignReportDetail,
  campaignreport: CampaignReportDetail,
  "campaign report": CampaignReportDetail,

  // Campaign Stage Report
  campaign_stage_report: CampaignStageReportDetail,
  campaignstagereport: CampaignStageReportDetail,
  "campaign stage report": CampaignStageReportDetail,

  // Campaign Lead Report
  campaign_lead_report: CampaignLeadReportDetail,
  campaignleadreport: CampaignLeadReportDetail,
  "campaign lead report": CampaignLeadReportDetail,

  // User Deal Report
  user_deal_report: UserDealReportDetail,
  userdealreport: UserDealReportDetail,
  "user deal report": UserDealReportDetail,

  // Login / Hourly Report
  login_report: LoginReportDetail,
  loginreport: LoginReportDetail,
  "login report": LoginReportDetail,
  hourly_login_report: LoginReportDetail,
  hourlyloginreport: LoginReportDetail,
  "hourly & login report": LoginReportDetail,
  "hourly login report": LoginReportDetail,
};

const getReportComponent = (selectedReport) => {
  if (!selectedReport) return null;

  const id =
    selectedReport.id || selectedReport.report_id || selectedReport.reportId;
  const name = String(
    selectedReport.name ||
      selectedReport.report_name ||
      selectedReport.reportName ||
      "",
  ).trim();
  const key = String(
    selectedReport.report_key ||
      selectedReport.reportKey ||
      selectedReport.key ||
      name,
  ).trim();
  const lowerKey = key.toLowerCase();
  const lowerName = name.toLowerCase();

  // Unimplemented / under development reports
  if (
    lowerName.includes("source") ||
    lowerKey.includes("source")
  ) {
    return null;
  }

  // 1. Direct ID matching from API list
  if (id === 1 || id === "1") return UserReportDetail;
  if (id === 2 || id === "2") return LeadDispositionReportDetail;
  if (id === 3 || id === "3") return UserStageReportDetail;
  if (id === 4 || id === "4") return UserFollowUpReportDetail;
  if (id === 5 || id === "5") return LoginReportDetail;
  if (id === 6 || id === "6") return CampaignReportDetail;
  if (id === 7 || id === "7") return CampaignLeadReportDetail;
  if (id === 8 || id === "8") return CampaignStageReportDetail;
  if (id === 9 || id === "9") return UserDealReportDetail;

  // 2. Name & key keyword matching
  if (
    lowerName.includes("lead disposition") ||
    lowerKey.includes("lead_disposition")
  )
    return LeadDispositionReportDetail;
  if (lowerName.includes("user stage") || lowerKey.includes("user_stage"))
    return UserStageReportDetail;
  if (lowerName.includes("follow") || lowerKey.includes("follow"))
    return UserFollowUpReportDetail;
  if (
    lowerName.includes("campaign stage") ||
    lowerKey.includes("campaign_stage")
  )
    return CampaignStageReportDetail;
  if (lowerName.includes("campaign lead") || lowerKey.includes("campaign_lead"))
    return CampaignLeadReportDetail;
  if (lowerName.includes("campaign") || lowerKey.includes("campaign"))
    return CampaignReportDetail;
  if (
    lowerName.includes("user deal") ||
    lowerKey.includes("user_deal") ||
    lowerKey.includes("deal")
  )
    return UserDealReportDetail;
  if (
    lowerName.includes("login") ||
    lowerKey.includes("login") ||
    lowerName.includes("hourly") ||
    lowerKey.includes("hourly")
  )
    return LoginReportDetail;
  if (lowerName.includes("user report") || lowerKey.includes("user_report"))
    return UserReportDetail;

  // 3. Dictionary lookup
  const Component = REPORT_COMPONENTS[key] || REPORT_COMPONENTS[lowerKey];
  if (Component) return Component;

  return null;
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

        const list =
          res?.data?.reports ||
          res?.reports ||
          res?.data?.result ||
          res?.data?.data ||
          res?.data ||
          (Array.isArray(res) ? res : []);

        setReportsList(Array.isArray(list) ? list : []);
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
    { field: "id", headerName: "No", minWidth: "70px", align: "center" },
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
          {row.name}
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
    const key = row?.report_key || row?.reportKey || row?.key || row?.name;
    if (key) {
      trackReportViewAdmin(key).catch(() => {});
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
