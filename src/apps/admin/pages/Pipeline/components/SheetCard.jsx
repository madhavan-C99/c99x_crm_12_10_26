import { Paper, Typography } from "@mui/material";

function SheetCard({ label, value, bg }) {
  return (
    <Paper
      elevation={0}
      sx={{
        background: bg, // Linear Gradient Background
        borderRadius: "10px",
        px: 1,
        py: 1.5,
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 80,
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      }}
    >
      {/* Label */}
      <Typography
        sx={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400, // Regular
          fontSize: { xs: "12px", sm: "13px", md: "14px" },
          lineHeight: "100%",
          letterSpacing: "0px",
          color: "#334155",
          textAlign: "center",
          wordBreak: "break-word",
        }}
      >
        {label}
      </Typography>

      {/* 🌟 NUMBER / VALUE - ALL 8 CARDS STRICTLY USE #194066 */}
      <Typography
        sx={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600, // Semi Bold
          fontSize: { xs: "20px", sm: "22px", md: "24px" },
          lineHeight: "100%",
          letterSpacing: "0px",
          color: "#194066 !important", // 👈 8 கார்டுகளின் எண்களுக்கும் #194066 நிறம்!
          mt: 0.8,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

export default SheetCard;