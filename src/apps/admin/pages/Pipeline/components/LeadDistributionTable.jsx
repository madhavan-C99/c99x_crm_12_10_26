import { Box, Paper, Typography, IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SchoolIcon from "@mui/icons-material/School";

const legend = [
  {
    label: "New Lead",
    color: "#0011C5",
    keys: ["new_lead", "new lead", "new", "new_leads"],
  }, // Deep Blue
  {
    label: "1st Time Not Picked",
    color: "#F78F1E",
    keys: [
      "first_time_not_picked",
      "1st time not picked",
      "1st_time_not_picked",
      "not_picked",
    ],
  }, // Orange
  {
    label: "Follow Up",
    color: "#FA1CE9",
    keys: ["follow_up", "follow up", "followups"],
  }, // Bright Pink
  {
    label: "Missed Follow Up",
    color: "#ECEC00",
    keys: ["missed_follow_up", "missed follow up", "missed"],
  }, // Yellow
  {
    label: "Not Connected",
    color: "#C74116",
    keys: ["not_connected", "not connected"],
  }, // Rust / Brownish Red
  {
    label: "Won",
    color: "#83DC17",
    keys: ["won", "win"],
  }, // Lime Green
  {
    label: "Lost",
    color: "#FF2B2B",
    keys: ["lost", "loss"],
  }, // Bright Red
];

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
    ""
  );
};

// Helper to extract stage values array safely from any data structure
const getRowValues = (row) => {
  if (!row) return [0, 0, 0, 0, 0, 0, 0];

  // 1. If row.values is already a valid array
  if (Array.isArray(row.values)) {
    return row.values;
  }

  // 2. If row.counts / row.stages is an array
  if (Array.isArray(row.counts)) return row.counts;
  if (Array.isArray(row.stages)) return row.stages;
  if (Array.isArray(row.data)) return row.data;

  // 3. If stage counts are in an object (e.g. row.values, row.stages, or direct properties on row)
  const sourceObj =
    typeof row.values === "object" && row.values !== null
      ? row.values
      : typeof row.stages === "object" && row.stages !== null
        ? row.stages
        : typeof row.counts === "object" && row.counts !== null
          ? row.counts
          : row;

  return legend.map((item) => {
    // Check matching keys
    for (const k of item.keys) {
      if (sourceObj[k] !== undefined) return Number(sourceObj[k]) || 0;
    }
    // Check by exact label (e.g. sourceObj["New Lead"])
    if (sourceObj[item.label] !== undefined) {
      return Number(sourceObj[item.label]) || 0;
    }
    return 0;
  });
};

function LeadDistributionTable({
  rows = [],
  lastUpdated = "",
  onRefresh,
}) {
  const safeRows = Array.isArray(rows)
    ? rows
    : typeof rows === "object" && rows !== null
      ? Object.values(rows)
      : [];

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
                const values = getRowValues(row);

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

                    {/* Attached Boxes with NO Border Radius */}
                    <Box sx={{ display: "flex", flex: 1, gap: 1 }}>
                      {values.map((v, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            flex: 1,
                            height: 38,
                            bgcolor: legend[idx]?.color || "#777",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 0,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {v}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Right Side: Legend */}
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
          {legend.map((item) => (
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
                  bgcolor: item.color,
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
