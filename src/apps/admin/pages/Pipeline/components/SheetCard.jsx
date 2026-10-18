import { Paper, Typography } from "@mui/material";

// Helper to determine if a background color is light or dark
const isLightColor = (hex) => {
  if (!hex || typeof hex !== "string") return true;
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return true;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  // Perceived luminance formula
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance > 185;
};

function SheetCard({ label, value, color, bg }) {
  const cardColor = color || bg || "#ffffff";
  const isLight = isLightColor(cardColor);

  return (
    <Paper
      elevation={0}
      sx={{
        background: cardColor,
        border: isLight ? "1px solid #E2E8F0" : "none",
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
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* Label */}
      <Typography
        sx={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: { xs: "12px", sm: "13px", md: "14px" },
          lineHeight: "100%",
          letterSpacing: "0px",
          color: isLight ? "#334155" : "#ffffff",
          textAlign: "center",
          wordBreak: "break-word",
        }}
      >
        {label}
      </Typography>

      {/* Number / Value */}
      <Typography
        sx={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: { xs: "20px", sm: "22px", md: "24px" },
          lineHeight: "100%",
          letterSpacing: "0px",
          color: isLight ? "#194066" : "#ffffff",
          mt: 0.8,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

export default SheetCard;