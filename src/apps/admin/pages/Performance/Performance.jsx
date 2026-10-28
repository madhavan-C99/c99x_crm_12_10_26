import ExportModal from "@/apps/admin/components/common/ExportModal";
import { triggerDirectFileDownload } from "@/apps/admin/services/exportService";
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import PerformanceHeader from "@/apps/admin/components/performance/PerformanceHeader";
import PerformanceFilter from "@/apps/admin/components/performance/PerformanceFilter";
import PerformanceTable from "@/apps/admin/components/performance/PerformanceTable";
import TopPerformersCard from "@/apps/admin/components/performance/TopPerformersCard";
import OtherTopPerformers from "@/apps/admin/components/performance/OtherTopPerformers";
import {
  fetchAdminPerformanceOverview,
  fetchPerformanceFilterDropdowns,
  exportPerformanceOverviewFile,
} from "@/apps/admin/services/performanceAdminService";
import { useAuth } from "@/shared/context/AuthContext";

export default function Performance() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const routeState = location.state || {};

  const initialFilterType = (() => {
    if (!routeState.date_filter) return "this_month";
    const df = String(routeState.date_filter).toLowerCase();
    if (df.includes("today")) return "today";
    if (df.includes("yesterday")) return "yesterday";
    if (df.includes("week")) return "weekly";
    if (df.includes("30")) return "last_30_days";
    if (df.includes("month")) return "this_month";
    return "this_month";
  })();

  const [filterType, setFilterType] = useState(initialFilterType);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [topPerformer, setTopPerformer] = useState(null);
  const [otherPerformers, setOtherPerformers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Dynamic filter dropdowns state initialized empty (loaded lazily in PerformanceFilter)
  const [teamsDropdown, setTeamsDropdown] = useState([]);

  // Helper to map team value to team_id integer for API
  const getTeamId = (team) => {
    if (typeof team === "number") return team;
    if (!team || team === "all" || team === "0") return 0;
    const num = Number(team);
    return isNaN(num) ? 0 : num;
  };

  // Helper to compute exact from_date and to_date like Pending Payments
  const getComputedDates = (type, customFrom, customTo) => {
    const today = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (type === "today") {
      const tStr = formatDate(today);
      return { from: tStr, to: tStr };
    } else if (type === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      return { from: yStr, to: yStr };
    } else if (
      type === "last_7_days" ||
      type === "weekly" ||
      type === "this_week" ||
      type === "week"
    ) {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 7);
      return { from: formatDate(past7), to: formatDate(today) };
    } else if (type === "last_30_days") {
      const past30 = new Date(today);
      past30.setDate(past30.getDate() - 30);
      return { from: formatDate(past30), to: formatDate(today) };
    } else if (
      type === "this_month" ||
      type === "monthly" ||
      type === "month"
    ) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDate(startOfMonth), to: formatDate(today) };
    } else if (type === "yearly" || type === "this_year" || type === "year") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { from: formatDate(startOfYear), to: formatDate(today) };
    } else if (type === "custom" || type === "custom_date") {
      return { from: customFrom || "", to: customTo || "" };
    }
    return { from: "", to: "" };
  };

  // Helper to map filterType to date_filter_type
  const getDateFilterType = (type) => {
    switch (type) {
      case "all":
        return "all";
      case "today":
        return "today";
      case "yesterday":
        return "yesterday";
      case "last_7_days":
      case "weekly":
      case "this_week":
        return "last_7_days";
      case "last_30_days":
        return "last_30_days";
      case "this_month":
        return "this_month";
      case "yearly":
        return "yearly";
      case "custom":
      case "custom_date":
        return "custom";
      default:
        return type || "this_month";
    }
  };

  // Transform API response into clean UI structures directly using API order and rank
  const transformApiResponse = (data) => {
    if (!data) return;

    const list = data.performance_list || [];

    // 1. Table rows
    const rows = list.map((item, index) => {
      const displayRank = item.rank ?? index + 1;
      const rawRating = item.rating_label || "";
      const cleanRating =
        rawRating.replace(/^\d+\s*/, "") ||
        (item.performance_score >= 80 ? "Good" : "Needs Improvement");

      return {
        id: item.telecaller_id || index + 1,
        rank: displayRank,
        telecaller: item.telecaller_name || `Telecaller ${index + 1}`,
        team: item.team_name || "Team",
        team_badge_color: item.team_badge_color,
        leads_assigned: item.leads_assigned ?? 0,
        calls_made: item.calls_made ?? 0,
        followups_done: item.followups_done ?? 0,
        admissions: item.admissions ?? 0,
        pending_followups: item.pending_followups ?? 0,
        score: item.performance_score ?? 0,
        rating: cleanRating,
        rating_badge_color: item.rating_badge_color,
        avg_calling_time: item.avg_calling_duration || "00:00:00",
      };
    });
    setTableData(rows);
    setTotalCount(data.total_count || rows.length);

    // 2. Rank 1 Top Performer
    const rank1 = list[0];
    if (rank1) {
      const displayRank1 = rank1.rank ?? 1;
      const leads = rank1.leads_assigned || 0;
      const admissions = rank1.admissions || 0;
      const followupsDone = rank1.followups_done || 0;
      const pendingFollowups = rank1.pending_followups || 0;
      const convRate =
        leads > 0 ? ((admissions / leads) * 100).toFixed(2) + "%" : "0.00%";
      const totalFollowups = followupsDone + pendingFollowups;
      const followupComp =
        totalFollowups > 0
          ? Math.round((followupsDone / totalFollowups) * 100) + "%"
          : "100%";
      const cleanRating =
        (rank1.rating_label || "").replace(/^\d+\s*/, "") ||
        (rank1.performance_score >= 80 ? "Excellent" : "Active");

      setTopPerformer({
        name: rank1.telecaller_name || "",
        team: rank1.team_name || "",
        score: rank1.performance_score ?? 0,
        rating: cleanRating,
        rank: displayRank1,
        avatar: "",
        snapshot: {
          admissions: admissions,
          conversionRate: convRate,
          followUpCompletion: followupComp,
          pendingFollowUps: pendingFollowups,
          avgResponseTime: rank1.avg_calling_duration || "-",
        },
        highlights: [
          {
            id: 1,
            title: "Highest Conversion Rate",
            subtitle: `${convRate} conversion`,
            iconType: "trophy",
            bg: "#FFF7ED",
            color: "#F97316",
          },
          {
            id: 2,
            title: "Most Admissions",
            subtitle: `${admissions} admissions this month`,
            iconType: "admissions",
            bg: "#FFE4E6",
            color: "#F43F5E",
          },
          {
            id: 3,
            title: "Best Follow-Up Discipline",
            subtitle: `${followupComp} follow-up completion`,
            iconType: "discipline",
            bg: "#DCFCE7",
            color: "#16A34A",
          },
          {
            id: 4,
            title: "Fastest Response Time",
            subtitle: `Avg ${rank1.avg_calling_duration || "-"}`,
            iconType: "response",
            bg: "#EEF2FF",
            color: "#6366F1",
          },
        ],
      });
    } else {
      setTopPerformer(null);
    }

    // 3. Other Top Performers (Rank 2, 3, 4)
    const otherRanks = list.slice(1, 4);
    if (otherRanks.length > 0) {
      const mappedOthers = otherRanks.map((p, idx) => {
        const displayRankOther = p.rank ?? idx + 2;
        const leads = p.leads_assigned || 0;
        const admissions = p.admissions || 0;
        const convRate =
          leads > 0 ? ((admissions / leads) * 100).toFixed(2) + "%" : "0.00%";
        const score = p.performance_score ?? 0;

        const isPremium =
          (p.team_name || "").toLowerCase().includes("premium") ||
          (p.team_name || "").toLowerCase().includes("alpha");
        const teamType = isPremium ? "premium" : "core";

        let cardBg = "#FFFFFF";
        let borderColor = "#E2E8F0";
        let dividerColor = "#F1F5F9";
        let convColor = "#16A34A";
        let scoreColor = score >= 50 ? "#16A34A" : "#EA580C";
        let highlight = "Top Performer";

        if (displayRankOther === 2) {
          cardBg = "#F0F7FF";
          borderColor = "#93C5FD";
          dividerColor = "#BFDBFE";
          convColor = "#16A34A";
          highlight = "Most Admissions";
        } else if (displayRankOther === 3) {
          cardBg = "#FFF7ED";
          borderColor = "#FDBA74";
          dividerColor = "#FED7AA";
          convColor = "#EA580C";
          highlight = "Best Follow-up Discipline";
        } else {
          cardBg = "#F8FAFC";
          borderColor = "#CBD5E1";
          dividerColor = "#CBD5E1";
          convColor = "#DC2626";
          highlight = "Most Improved This Month";
        }

        return {
          id: p.telecaller_id || displayRankOther,
          rank: displayRankOther,
          name: p.telecaller_name || `Telecaller ${displayRankOther}`,
          team: p.team_name || "Team",
          teamType,
          conversionRate: convRate,
          conversionColor: convColor,
          admissions: admissions,
          performanceScore: score,
          scoreColor: scoreColor,
          highlight: highlight,
          avatar: "",
          cardBg,
          borderColor,
          dividerColor,
        };
      });
      setOtherPerformers(mappedOthers);
    } else {
      setOtherPerformers([]);
    }
  };

  // Fetch performance overview data from API
  const loadPerformanceData = useCallback(async () => {
    // If custom date filter is selected, ensure both fromDate and toDate are chosen before firing API
    if (filterType === "custom" && (!fromDate || !toDate)) {
      return;
    }

    try {
      setLoading(true);
      const dates = getComputedDates(filterType, fromDate, toDate);
      const payload = {
        team_id: getTeamId(selectedTeam),
        pipeline_id: routeState.pipeline_id || undefined,
        campaign_id:
          routeState.campaign_id && routeState.campaign_id !== "all"
            ? routeState.campaign_id
            : undefined,
        date_filter_type: getDateFilterType(filterType),
        from_date: dates.from || "",
        to_date: dates.to || "",
        search: "",
        page: 1,
        page_size: 25,
      };

      const response = await fetchAdminPerformanceOverview(payload);
      if (response?.data?.data) {
        transformApiResponse(response.data.data);
      } else {
        setTableData([]);
        setTopPerformer(null);
        setOtherPerformers([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching performance overview:", error);
      setTableData([]);
      setTopPerformer(null);
      setOtherPerformers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filterType, fromDate, toDate, selectedTeam]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const performanceExportColumns = [
    { id: "rank", backendKey: "rank", label: "Telecaller Rank" },
    {
      id: "telecaller",
      backendKey: "telecaller_name",
      label: "Telecaller Name",
    },
    { id: "team", backendKey: "team_name", label: "Team Name" },
    {
      id: "leads_assigned",
      backendKey: "leads_assigned",
      label: "Leads Assigned",
    },
    { id: "calls_made", backendKey: "calls_made", label: "Calls Made" },
    {
      id: "followups_done",
      backendKey: "followups_done",
      label: "Follow-Ups Done",
    },
    { id: "admissions", backendKey: "admissions", label: "Admissions Count" },
    {
      id: "pending_followups",
      backendKey: "pending_followups",
      label: "Pending Follow-Ups",
    },
    {
      id: "performance_score",
      backendKey: "performance_score",
      label: "Performance Score",
    },
    { id: "rating", backendKey: "rating_label", label: "Performance Rating" },
    {
      id: "avg_calling_time",
      backendKey: "avg_calling_duration",
      label: "Avg Calling Duration",
    },
  ];

  // Export Performance Report API Call
  const handleExport = async (selectedKeys, format = "excel") => {
    try {
      setExporting(true);
      const dates = getComputedDates(filterType, fromDate, toDate);
      const filtersPayload = {
        team_id: getTeamId(selectedTeam),
        date_filter_type: getDateFilterType(filterType),
        from_date: dates.from || "",
        to_date: dates.to || "",
      };

      const payload = {
        entity: "performance_overview",
        export_format: format || "excel",
        selected_columns:
          selectedKeys && Array.isArray(selectedKeys) && selectedKeys.length > 0
            ? selectedKeys
            : performanceExportColumns.map((c) => c.backendKey),
        filters: filtersPayload,
      };

      const response = await exportPerformanceOverviewFile(payload);
      const resData = response?.data || response;
      const resultObj = resData?.data || resData;

      let downloadUrl =
        resultObj?.download_url || resData?.download_url || resultObj?.file_url;
      const fileName =
        resultObj?.file_name ||
        resData?.file_name ||
        `Performance_Report_${Date.now()}.${format === "excel" ? "xlsx" : format}`;

      if (downloadUrl) {
        await triggerDirectFileDownload(downloadUrl, fileName);
      } else {
        console.error("Export failed. No download URL returned from server.");
      }
    } catch (err) {
      console.error("Error exporting performance overview:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 4, pr: 3 }}>
        <PerformanceHeader />
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <PerformanceFilter
            filterType={filterType}
            setFilterType={setFilterType}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            teams={teamsDropdown}
            onExport={() => setIsExportModalOpen(true)}
            exporting={exporting}
          />
        </Box>
        <PerformanceTable tableData={tableData} loading={loading} />

        {/* Top Performers Showcase (Figma Design - Centered After Table) */}
        <Box
          sx={{
            maxWidth: { xs: "100%", xl: "1280px", lg: "1220px" },
            width: "100%",
            mx: "auto",
            mt: 3,
          }}
        >
          <TopPerformersCard data={topPerformer} />
          <OtherTopPerformers performers={otherPerformers} />
        </Box>
        <ExportModal
          open={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="Performance Overview"
          columns={performanceExportColumns}
          availableFormats={["xlsx", "csv", "pdf"]}
          isSubmitting={exporting}
          onDownload={async ({ fileFormat, selectedKeys }) => {
            await handleExport(
              selectedKeys,
              fileFormat === "xlsx" ? "excel" : fileFormat,
            );
            setIsExportModalOpen(false);
          }}
        />
      </Box>
    </>
  );
}
