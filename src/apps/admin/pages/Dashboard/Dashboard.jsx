import ExportModal from "@/apps/admin/components/common/ExportModal";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import DashboardHeader from "@/apps/admin/components/dashboard/DashboardHeader";
import MetricCardsGrid from "@/apps/admin/components/dashboard/MetricCardsGrid";
import FollowUpAndPaymentsTables from "@/apps/admin/components/dashboard/FollowUpAndPaymentsTables";
import PipelineAndPerformance from "@/apps/admin/components/dashboard/PipelineAndPerformance";
import MonthlyCharts from "@/apps/admin/components/dashboard/MonthlyCharts";
import BottomAnalyticsCards from "@/apps/admin/components/dashboard/BottomAnalyticsCards";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";
import { connectDashboardSocket } from "@/apps/admin/services/dashboardSocketService";
import {
  fetchDashboardPendingPayments,
  fetchDashboardPerformanceOverview,
  fetchDashboardBestPerformer,
  exportDashboardReport,
} from "@/apps/admin/services/dashboardService";
import { toast } from "react-toastify";

const FONT = "Inter, sans-serif";

export default function Dashboard() {
  const navigate = useNavigate();

  // 1. Dynamic Pipeline Categories & Selected Pipeline
  const [pipelinesList, setPipelinesList] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);

  // Dynamic Campaigns for the selected Pipeline
  const [campaignsList, setCampaignsList] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  // 2. Date Filter
  const [dateFilter, setDateFilter] = useState("Today");

  // 3. Connection Status
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const socketRef = useRef(null);

  // 4. Live / Auto-Updating States (Updated via WebSocket without page refresh)
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [missedFollowUps, setMissedFollowUps] = useState(null);
  const [pipelineStages, setPipelineStages] = useState(null);
  const [totalLost, setTotalLost] = useState(0);
  const [monthlyBarData, setMonthlyBarData] = useState(null);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState(null);
  const [leadSourceTotal, setLeadSourceTotal] = useState(0);
  const [leadSources, setLeadSources] = useState(null);
  const [lossItems, setLossItems] = useState(null);
  const [keyInsight, setKeyInsight] = useState("");

  // 5. REST States (Updated via dedicated dashboard endpoints on filter change)
  const [pendingPayments, setPendingPayments] = useState([]);
  const [performanceList, setPerformanceList] = useState([]);
  const [performerData, setPerformerData] = useState(null);

  // 6. Skeleton Loading States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingRest, setLoadingRest] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch Pipeline Categories (L_CATEGORIES)
  useEffect(() => {
    getSelectOptions("L_CATEGORIES")
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setPipelinesList(cats);
          const initialId = cats[0].id ?? cats[0].value ?? 1;
          setSelectedPipeline(initialId);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch L_CATEGORIES:", err);
      });
  }, []);

  // Fetch Campaigns (L_CAMPAIGN_NAMES) whenever selected pipeline changes
  useEffect(() => {
    if (!selectedPipeline) return;
    const optFilter = {
      pipeline_id: selectedPipeline,
    };
    getSelectOptions("L_CAMPAIGN_NAMES", optFilter)
      .then((cmps) => {
        if (Array.isArray(cmps)) {
          setCampaignsList(cmps);
        } else {
          setCampaignsList([]);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch campaigns for pipeline:", err);
        setCampaignsList([]);
      });

    // Reset campaign selection to "all" on pipeline change
    setSelectedCampaign("all");
  }, [selectedPipeline]);

  // Handle incoming WebSocket live data
  const handleSocketMessage = useCallback((payload) => {
    if (!payload) return;
    setLoadingInitial(false);

    // 🟢 Update ONLY auto-updating items:
    if (payload.metrics) setLiveMetrics(payload.metrics);
    if (payload.missed_followups) setMissedFollowUps(payload.missed_followups);
    if (payload.pipeline_stages) setPipelineStages(payload.pipeline_stages);
    if (payload.total_lost !== undefined) setTotalLost(payload.total_lost);
    if (payload.monthly_bar_data) setMonthlyBarData(payload.monthly_bar_data);
    if (payload.monthly_revenue_data) setMonthlyRevenueData(payload.monthly_revenue_data);
    if (payload.lead_source_total !== undefined) setLeadSourceTotal(payload.lead_source_total);
    if (payload.lead_sources) setLeadSources(payload.lead_sources);
    if (payload.loss_items) setLossItems(payload.loss_items);
    if (payload.key_insight) setKeyInsight(payload.key_insight);

    // ⛔ EXCLUDED: pending_payments, performance_list, performer_data are deliberately ignored!
  }, []);

  // Store latest handleSocketMessage in ref to avoid re-triggering socket connect
  const handleSocketMessageRef = useRef(handleSocketMessage);
  handleSocketMessageRef.current = handleSocketMessage;

  // WebSocket lifecycle management: Open ONCE on mount with empty dependency array []
  useEffect(() => {
    const socketHandler = connectDashboardSocket({
      onMessage: (payload) => {
        if (handleSocketMessageRef.current) {
          handleSocketMessageRef.current(payload);
        }
      },
      onStatusChange: (status) => setConnectionStatus(status),
    });

    socketRef.current = socketHandler;

    return () => {
      // Disconnect ONLY when user leaves the Dashboard page
      socketHandler.disconnect();
    };
  }, []); // 👈 EMPTY DEPENDENCY ARRAY: Never disconnects on dropdown/filter change!

  // Send filter updates over the open WebSocket when pipeline, campaign, or date filter changes
  useEffect(() => {
    if (socketRef.current && selectedPipeline) {
      socketRef.current.sendFilterChange(selectedPipeline, selectedCampaign, dateFilter);
    }
  }, [selectedPipeline, selectedCampaign, dateFilter]);

  // Fetch Pending Payments, Performance Overview, and Best Performer via REST APIs
  useEffect(() => {
    if (!selectedPipeline) return;

    let isMounted = true;
    setLoadingRest(true);
    const payload = {
      pipeline_id: selectedPipeline,
      campaign_id: selectedCampaign === "all" || !selectedCampaign ? null : selectedCampaign,
      date_filter: dateFilter,
    };

    // 1. Pending Payments List
    const p1 = fetchDashboardPendingPayments(payload)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.status === "success" && Array.isArray(res.data)) {
          setPendingPayments(res.data);
        } else if (Array.isArray(res?.data)) {
          setPendingPayments(res.data);
        } else {
          setPendingPayments([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Could not fetch dashboard pending payments:", err);
        setPendingPayments([]);
      });

    // 2. Performance Overview Table
    const p2 = fetchDashboardPerformanceOverview(payload)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.status === "success" && Array.isArray(res.data)) {
          setPerformanceList(res.data);
        } else if (Array.isArray(res?.data)) {
          setPerformanceList(res.data);
        } else {
          setPerformanceList([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Could not fetch dashboard performance overview:", err);
        setPerformanceList([]);
      });

    // 3. Best Performer Card
    const p3 = fetchDashboardBestPerformer(payload)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.status === "success" && res.data) {
          setPerformerData(res.data);
        } else if (res?.data) {
          setPerformerData(res.data);
        } else {
          setPerformerData(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Could not fetch dashboard best performer:", err);
        setPerformerData(null);
      });

    Promise.allSettled([p1, p2, p3]).finally(() => {
      if (isMounted) {
        setLoadingRest(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedPipeline, selectedCampaign, dateFilter]);

  const handlePipelineChange = (newPipelineId) => {
    setSelectedPipeline(newPipelineId);
  };

  const handleExport = async (format = "excel") => {
    try {
      const payload = {
        pipeline_id: selectedPipeline,
        campaign_id: selectedCampaign === "all" || !selectedCampaign ? null : selectedCampaign,
        date_filter: dateFilter,
        format: format,
      };
      const res = await exportDashboardReport(payload);
      toast.success(res?.message || `Dashboard export (${format.toUpperCase()}) started! Check Download Logs.`);
    } catch (err) {
      console.error("Dashboard export error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Export failed to start.");
    }
  };

  return (
    <Box
      sx={{
        pr: 3,
        pb: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        fontFamily: FONT,
      }}
    >
      {/* 1. Header with Dynamic Pipeline Category Dropdown & Date Filters */}
      <DashboardHeader
        pipelinesList={pipelinesList}
        selectedPipeline={selectedPipeline}
        onPipelineChange={handlePipelineChange}
        campaignsList={campaignsList}
        selectedCampaign={selectedCampaign}
        onCampaignChange={setSelectedCampaign}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onExport={() => setIsExportModalOpen(true)}
        connectionStatus={connectionStatus}
      />

      {/* 2. Top Metric Cards (8 Cards - Stage Counts dynamically linked to selected pipeline) */}
      <MetricCardsGrid
        metrics={liveMetrics || undefined}
        loading={loadingInitial && !liveMetrics}
      />

      {/* 3. Follow-Up and Pending Payments Tables (Missed followups auto-updates; Pending payments REST) */}
      <FollowUpAndPaymentsTables
        missedFollowUps={missedFollowUps}
        pendingPayments={pendingPayments}
        loadingMissed={loadingInitial && !missedFollowUps}
        loadingPending={loadingRest}
        onViewAllMissed={() =>
          navigate("/admin/Leads", {
            state: {
              pipeline_id: selectedPipeline,
              campaign_id: selectedCampaign,
              date_filter: dateFilter,
              active_tab: "missed_follow_up",
            },
          })
        }
        onViewAllPending={() =>
          navigate("/admin/PendingPayments", {
            state: {
              pipeline_id: selectedPipeline,
              campaign_id: selectedCampaign,
              date_filter: dateFilter,
            },
          })
        }
      />

      {/* 4. Pipeline Funnel & Performance Overview Table (Funnel dynamically linked to pipeline; Performance REST) */}
      <PipelineAndPerformance
        pipelineStages={pipelineStages}
        performanceList={performanceList}
        totalLost={totalLost}
        loadingStages={loadingInitial && !pipelineStages}
        loadingPerformance={loadingRest}
        onViewAllPerformance={() =>
          navigate("/admin/Performance", {
            state: {
              pipeline_id: selectedPipeline,
              campaign_id: selectedCampaign,
              date_filter: dateFilter,
            },
          })
        }
      />

      {/* 5. Monthly Comparison Charts (Auto-updated via WebSocket) */}
      <MonthlyCharts
        barData={monthlyBarData}
        revenueData={monthlyRevenueData}
        loading={loadingInitial && !monthlyBarData && !monthlyRevenueData}
      />

      {/* 6. Bottom Analytics (Lead Source & Loss Analysis auto-updated; Best Performer REST) */}
      <BottomAnalyticsCards
        leadSourceTotal={leadSourceTotal}
        leadSources={leadSources}
        totalLost={totalLost}
        lossItems={lossItems}
        keyInsight={keyInsight}
        performerData={performerData}
        loadingSources={loadingInitial && !leadSources}
        loadingLoss={loadingInitial && !lossItems}
        loadingPerformer={loadingRest}
      />
      <ExportModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="Dashboard Report"
        availableFormats={["xlsx", "pdf"]}
        isSubmitting={exportLoading}
        onDownload={async ({ fileFormat }) => {
          setExportLoading(true);
          try {
            await handleExport(fileFormat === "xlsx" ? "excel" : fileFormat);
          } finally {
            setExportLoading(false);
            setIsExportModalOpen(false);
          }
        }}
      />
    </Box>
  );
}
