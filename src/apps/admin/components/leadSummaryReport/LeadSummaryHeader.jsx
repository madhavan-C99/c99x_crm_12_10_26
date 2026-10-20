import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function LeadSummaryHeader({
  title = "Lead Summary Report",
  onBack,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1.2, // 🌟 COMPACT MARGIN BOTTOM
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          size="small"
          onClick={onBack}
          sx={{
            p: 0.5,
            bgcolor: "transparent",
            border: "none",
            color: "#000000",
            "&:hover": {
              bgcolor: "transparent",
              opacity: 0.7,
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 24, color: "#000000" }} />
        </IconButton>

        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: { xs: "18px", sm: "20px", md: "22px" },
            lineHeight: "100%",
            letterSpacing: "0%",
            color: "#111111",
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
}

export default LeadSummaryHeader;
