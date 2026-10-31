import { useMemo } from "react";
import { Box, Typography, Button, Skeleton } from "@mui/material";

const LeadStats = ({
  statsData = {},
  totalRecords = 0,
  selectedLeadType = "all",
  setSelectedLeadType,
  stagesList = [],
  loading = false,
}) => {
  const leadOptions = useMemo(() => {
    const baseOptions = [
      {
        value: "all",
        label: "All Leads",
        stage_color: "",
      },
    ];

    if (Array.isArray(stagesList) && stagesList.length > 0) {
      // Sort stages by order_no if present
      const sortedStages = [...stagesList].sort((a, b) => {
        const orderA = a.order_no ?? a.order ?? 0;
        const orderB = b.order_no ?? b.order ?? 0;
        return orderA - orderB;
      });

      sortedStages.forEach((stg) => {
        const label = stg.label || stg.name || stg.stage_name || String(stg);
        // Stage ID MUST be pipeline_stage_id or id (do NOT use stg.value)
        const stageId = String(stg.pipeline_stage_id ?? stg.id ?? label);
        // Stage count MUST be taken from stg.count (do NOT use stg.value)
        const count =
          stg.count !== undefined && stg.count !== null
            ? Number(stg.count)
            : null;

        baseOptions.push({
          value: stageId,
          label: label,
          stage_color: stg.stage_color || stg.color || "",
          count: count,
          stageObj: stg,
        });
      });
    }

    return baseOptions;
  }, [stagesList]);

  const getCount = (item) => {
    if (item.value === "all") {
      // Total count across all leads: sum of counts from stage_tabs or total_records
      if (Array.isArray(stagesList) && stagesList.length > 0) {
        const hasCounts = stagesList.some(
          (s) => s.count !== undefined && s.count !== null
        );
        if (hasCounts) {
          const sum = stagesList.reduce(
            (acc, s) => acc + (Number(s.count) || 0),
            0
          );
          if (sum >= 0) return sum;
        }
      }
      return (
        statsData?.total_records ??
        statsData?.total_count ??
        statsData?.total_leads ??
        totalRecords ??
        0
      );
    }

    // 1. Direct count from stage_tabs object (stg.count) - DO NOT use stg.value
    if (item.count !== null && item.count !== undefined) {
      return item.count;
    }
    if (item.stageObj?.count !== undefined && item.stageObj?.count !== null) {
      return Number(item.stageObj.count);
    }

    // 2. Stage counts object from API (e.g. stage_counts: { new_lead: 2, follow_up: 0, won: 0, loss: 1 })
    const stageCounts = statsData?.stage_counts;
    if (stageCounts && typeof stageCounts === "object") {
      const normLabel = String(item.label || "")
        .toLowerCase()
        .replace(/[\s_-]+/g, "_");
      if (stageCounts[normLabel] !== undefined) {
        return Number(stageCounts[normLabel]);
      }
      const stageId = item.value;
      if (stageCounts[stageId] !== undefined) {
        return Number(stageCounts[stageId]);
      }
    }

    // 3. Fallback to stage_wise_count array
    const stageId = item.value;
    const stageWise = statsData?.stage_wise_count;
    if (Array.isArray(stageWise) && stageWise.length > 0) {
      const found = stageWise.find(
        (s) =>
          String(s.pipeline_stage_id ?? s.id ?? s.stage_id) ===
            String(stageId) ||
          String(s.label || s.name || "").toLowerCase() ===
            String(item.label || "").toLowerCase()
      );
      if (found && found.count !== undefined) return Number(found.count);
    }

    return (
      statsData[`${stageId}_count`] ??
      statsData[stageId] ??
      0
    );
  };

  if (loading && (!stagesList || stagesList.length === 0)) {
    return (
      <Box sx={{ display: "flex", gap: "10px", my: 2 }}>
        {[1, 2, 3, 4, 5].map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ width: "120px", height: "40px", borderRadius: "8px" }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        alignItems: "center",
        mt: 1,
        mb: 1.5,
      }}
    >
      {leadOptions.map((item) => {
        const isActive =
          String(selectedLeadType) === String(item.value) ||
          (selectedLeadType === "all" && item.value === "all") ||
          (!selectedLeadType && item.value === "all");

        const count = getCount(item);
        const hasColor = Boolean(item.stage_color);

        return (
          <Button
            key={item.value}
            onClick={() => setSelectedLeadType(item.value)}
            sx={{
              height: "38px",
              px: 2,
              borderRadius: "8px",
              backgroundColor: hasColor ? item.stage_color : "#FFFFFF",
              color: hasColor ? "#FFFFFF" : "#111827",
              border: hasColor
                ? (isActive ? "2px solid #FFFFFF" : "none")
                : (isActive ? "2px solid #84CC16" : "1px solid #E5E7EB"),
              boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: hasColor ? item.stage_color : "#F3F4F6",
                opacity: 0.92,
              },
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: "inherit" }}>
              {item.label}
            </Typography>
            <Box
              sx={{
                minWidth: "22px",
                height: "22px",
                px: 0.6,
                borderRadius: "11px",
                backgroundColor: "#FFFFFF",
                color: "#111827",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {count}
            </Box>
          </Button>
        );
      })}
    </Box>
  );
};

export default LeadStats;
