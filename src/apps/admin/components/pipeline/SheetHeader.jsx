import { useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

function SheetHeader({
  title = "",
  onBack,
  onAction,
  onLeadSummary,
  onCallLogs,
  isCampaignActive = true,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const pauseOrResumeItem = isCampaignActive
    ? "Pause Campaign"
    : "Resume Campaign";
  const actionMenuItems = [
    "Disposition",
    "Upload Excel Sheet",
    "Add Lead",
    pauseOrResumeItem,
    "Campaign Setting",
  ];

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (item) => {
    handleClose();
    onAction?.(item);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
        mb: 2.5,
        flexWrap: "wrap",
      }}
    >
      {/* Title & Back Button Cluster */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
      >
        {/* 🌟 ONLY CLEAN ARROW ICON (No Border & No White Background) */}
        <IconButton
          size="small"
          onClick={onBack}
          sx={{
            p: 0.5,
            bgcolor: "transparent", // 👈 No White Background
            border: "none", // 👈 No Border
            color: "#000000",
            "&:hover": {
              bgcolor: "transparent",
              opacity: 0.7,
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 24, color: "#000000" }} />
        </IconButton>

        {/* Header Title (22px, Semi Bold, Inter) */}
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

      {/* Buttons Cluster */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          width: { xs: "100%", sm: "auto" },
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={onLeadSummary}
          sx={{
            height: 36,
            px: 2,
            textTransform: "none",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            borderColor: "#E0E0E0",
            color: "#3F4D27",
            bgcolor: "#fff",
            flexGrow: { xs: 1, sm: 0 },
            "&:hover": { bgcolor: "#f9f9f9", borderColor: "#D0D0D0" },
          }}
        >
          Lead Summary
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={onCallLogs}
          sx={{
            height: 36,
            px: 2,
            textTransform: "none",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            borderColor: "#E0E0E0",
            color: "#3F4D27",
            bgcolor: "#fff",
            flexGrow: { xs: 1, sm: 0 },
            "&:hover": { bgcolor: "#f9f9f9", borderColor: "#D0D0D0" },
          }}
        >
          Call Logs
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={handleOpen}
          endIcon={<KeyboardArrowDownIcon />}
          sx={{
            height: 36,
            px: 2,
            textTransform: "none",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            borderColor: "#E0E0E0",
            color: "#111",
            bgcolor: "#fff",
            flexGrow: { xs: 1, sm: 0 },
            "&:hover": { bgcolor: "#f9f9f9", borderColor: "#D0D0D0" },
          }}
        >
          Actions
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              maxHeight: "300px",
              overflowY: "auto",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
            },
          }}
        >
          {actionMenuItems.map((item) => (
            <MenuItem key={item} onClick={() => handleSelect(item)}>
              {item}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
}

export default SheetHeader;
