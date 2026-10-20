import { useState } from "react";
import { Button, Popover } from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

function FilterButton({ label, active, children, width = 260, onOpen }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
    if (onOpen) onOpen();
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<SwapVertIcon fontSize="small" sx={{ color: "#333" }} />}
        endIcon={<KeyboardArrowDownIcon fontSize="small" sx={{ color: "#333" }} />}
        onClick={handleClick}
        sx={{
          textTransform: "none",
          
          // 🌟 Typography Requirements
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400, // Regular
          fontSize: "14px",
          lineHeight: "100%",
          letterSpacing: "0px",
          
          color: "#333333",
          borderColor: "#D0D0D0",
          bgcolor: "#ffffff", // Pure White Background matching picture
          height: 36,
          px: 1.8,
          borderRadius: "6px",
          boxShadow: "none",
          "&:hover": {
            bgcolor: "#F9F9F9",
            borderColor: "#C0C0C0",
          },
        }}
      >
        {label}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 1, borderRadius: 2, width } } }}
      >
        {typeof children === "function" ? children({ close }) : children}
      </Popover>
    </>
  );
}

export default FilterButton;