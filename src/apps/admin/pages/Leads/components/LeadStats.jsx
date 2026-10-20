import { useMemo } from "react";
import { Box, Typography, Button, Skeleton } from "@mui/material";

const LeadStats = ({
  statsData = {},
  selectedLeadType,
  setSelectedLeadType,
  stagesList = [],
  loading = false,
}) => {
  const leadOptions = useMemo(() => {
    const baseOptions = [{ countKey: "total_count", value: "all", label: "All Leads" }];
    if (Array.isArray(stagesList) && stagesList.length > 0) {
      stagesList.forEach((stg) => {
        const label = stg.label || stg.name || stg.stage_name || String(stg);
        const val = String(stg.id ?? stg.value ?? label);
        baseOptions.push({
          countKey: `${val}_count`,
          value: val,
          label: label,
          stageObj: stg,
        });
      });
      return baseOptions;
    }
    return baseOptions;
  }, [stagesList]);

  const getCount = (item) => {
    if (item.value === "all") {
      return (
        statsData.total_leads ??
        statsData.total_count ??
        statsData.total_records ??
        statsData.all_leads ??
        0
      );
    }
    const stageId = item.value;
    const stageWise = statsData?.stage_wise_count;
    if (Array.isArray(stageWise) && stageWise.length > 0) {
      const found = stageWise.find(
        (s) =>
          String(s.pipeline_stage_id ?? s.id ?? s.stage_id) === String(stageId) ||
          String(s.label || s.name || "").toLowerCase() === String(item.label || "").toLowerCase()
      );
      if (found && found.count !== undefined) return found.count;
    }
    return (
      statsData[`${stageId}_count`] ??
      statsData[stageId] ??
      statsData[item.countKey] ??
      0
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", gap: "10px", my: 2 }}>
        {leadOptions.map((_, i) => (
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
          selectedLeadType === item.value ||
          (selectedLeadType === "all" && item.value === "") ||
          (selectedLeadType === "" && item.value === "all");
        const count = getCount(item);

        return (
          <Button
            key={item.value}
            onClick={() => setSelectedLeadType(item.value)}
            sx={{
              height: "38px",
              px: 2,
              borderRadius: "8px",
              border: isActive ? "1px solid #84CC16" : "1px solid #E5E7EB",
              backgroundColor: isActive ? "#84CC16" : "#F9FAFB",
              color: isActive ? "#000000" : "#374151",
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              fontWeight: isActive ? 600 : 500,
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: "inherit" }}>
              {item.label}
            </Typography>
            <Box
              sx={{
                minWidth: "22px",
                height: "22px",
                borderRadius: "11px",
                backgroundColor: isActive ? "#000000" : "#D1D5DB",
                color: isActive ? "#FFFFFF" : "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
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
