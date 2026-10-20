import { Box, Paper, Typography, IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";

// Helper to extract agent/telecaller name safely
const getRowAgentName = (row) => {
  if (!row) return "-";
  if (typeof row === "string") return row;
  return (
    row.agent ||
    row.agent_name ||
    row.telecaller ||
    row.telecaller_name ||
    row.user_name ||
    row.username ||
    row.name ||
    "-"
  );
};

// Helper to extract stage value safely from row data
const getStageValue = (row, stageLabel, stageIndex = -1) => {
  if (!row) return 0;
  const values = row.values ?? row.stages ?? row.counts ?? row;

  if (values && typeof values === "object" && !Array.isArray(values)) {
    // 1. Exact key match (e.g., values["New Lead"])
    if (values[stageLabel] !== undefined) return Number(values[stageLabel]) || 0;

    // 2. Normalized match (ignoring case, spaces, underscores, dashes)
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNorm = norm(stageLabel);

    for (const [k, v] of Object.entries(values)) {
      if (norm(k) === targetNorm) {
        return Number(v) || 0;
      }
    }

    // 3. Fallbacks for common aliases (Lost vs Loss, Won vs Win)
    if (targetNorm === "lost" && values["Loss"] !== undefined) return Number(values["Loss"]) || 0;
    if (targetNorm === "loss" && values["Lost"] !== undefined) return Number(values["Lost"]) || 0;
    if (targetNorm === "win" && values["Won"] !== undefined) return Number(values["Won"]) || 0;
  } else if (Array.isArray(values) && stageIndex >= 0) {
    return Number(values[stageIndex]) || 0;
  }

  return 0;
};

function LeadDistributionTable({
  rows = [],
  stages = [],
  lastUpdated = "",
  onRefresh,
}) {
  const safeRows = Array.isArray(rows)
    ? rows
    : typeof rows === "object" && rows !== null
      ? Object.values(rows)
      : [];

  // Dynamically determine effective stages and their backend-assigned colors
  let effectiveStages = [];
  if (Array.isArray(stages) && stages.length > 0) {
    effectiveStages = stages.map((s) => ({
      label: s?.label || s?.name || String(s),
      color: s?.color || s?.stage_color || "#1D4ED8",
    }));
  } else if (safeRows.length > 0) {
    const firstRowValues = safeRows[0]?.values ?? safeRows[0]?.stages ?? safeRows[0]?.counts;
    if (firstRowValues && typeof firstRowValues === "object" && !Array.isArray(firstRowValues)) {
      effectiveStages = Object.keys(firstRowValues).map((k) => ({
        label: k,
        color: "#1D4ED8",
      }));
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        p: { xs: 1.5, sm: 2.5 },
        border: "1px solid #ECECEC",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <SchoolIcon sx={{ color: "#83DC17" }} fontSize="small" />
          <Typography
            fontWeight={700}
            sx={{ fontSize: { xs: "15px", sm: "16px" }, color: "#333" }}
          >
            Lead Distribution
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              (Last updated {lastUpdated})
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onRefresh}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Main Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: { xs: 2.5, lg: 4 },
          alignItems: "flex-start",
        }}
      >
        {/* Left Side: Agent Bar Rows */}
        <Box sx={{ flex: 1, width: "100%", overflowX: "auto", pb: 1 }}>
          <Box sx={{ minWidth: 500 }}>
            {safeRows.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", color: "#64748B" }}>
                <Typography sx={{ fontSize: "14px" }}>
                  No lead distribution data available for this campaign.
                </Typography>
              </Box>
            ) : (
              safeRows.map((row, i) => {
                const agentName = getRowAgentName(row);

                return (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1.8,
                    }}
                  >
                    {/* Agent Name */}
                    <Typography
                      sx={{
                        width: { xs: 90, sm: 110 },
                        flexShrink: 0,
                        fontSize: { xs: 13, sm: 14 },
                        fontWeight: 600,
                        color: "#333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {agentName}
                    </Typography>

                    {/* Attached Boxes with Dynamic Stage Colors */}
                    <Box sx={{ display: "flex", flex: 1, gap: 1 }}>
                      {effectiveStages.map((st, idx) => {
                        const val = getStageValue(row, st.label, idx);
                        return (
                          <Box
                            key={st.label || idx}
                            sx={{
                              flex: 1,
                              height: 38,
                              bgcolor: st.color || "#64748B",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 0,
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {val}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Right Side: Legend Dynamically Matching Pipeline Stages & Colors */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", lg: "column" },
            flexWrap: "wrap",
            gap: { xs: 1.5, lg: 1.2 },
            minWidth: { xs: "100%", lg: 160 },
            pt: { xs: 1, lg: 0 },
            pl: { xs: 0, lg: 2 },
          }}
        >
          {effectiveStages.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                minWidth: { xs: 130, lg: "auto" },
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "2px",
                  bgcolor: item.color || "#64748B",
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                fontWeight={500}
                color="#333"
                sx={{ fontSize: "13px" }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

export default LeadDistributionTable;
