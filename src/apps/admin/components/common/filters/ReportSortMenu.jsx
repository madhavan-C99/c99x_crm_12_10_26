import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";

const DEFAULT_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export default function ReportSortMenu({
  sortType = "newest",
  onSortChange,
  options = DEFAULT_SORT_OPTIONS,
  sx = {},
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (val) => {
    onSortChange?.(val);
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          <ImportExportOutlinedIcon fontSize="small" sx={{ color: "#333333" }} />
        }
        endIcon={
          <KeyboardArrowDownOutlinedIcon fontSize="small" sx={{ color: "#333333" }} />
        }
        onClick={handleClick}
        sx={{
          height: 36,
          px: 1.8,
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          borderColor: "#D0D0D0",
          color: "#333333",
          textTransform: "none",
          fontSize: "14px",
          fontWeight: 400,
          fontFamily: "'Inter', sans-serif",
          lineHeight: "100%",
          letterSpacing: "0px",
          boxShadow: "none",
          whiteSpace: "nowrap",
          "&:hover": {
            backgroundColor: "#F9F9F9",
            borderColor: "#C0C0C0",
          },
          ...sx,
        }}
      >
        Sort by
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        autoFocus={false}
        disableAutoFocusItem
        slotProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.12)",
              mt: 0.5,
              minWidth: 140,
            },
          },
        }}
      >
        {options.map((opt) => {
          const isSelected = sortType === opt.value;
          return (
            <MenuItem
              key={opt.value}
              selected={isSelected}
              onClick={() => handleSelect(opt.value)}
              sx={{
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                py: 1,
                px: 2,
                "&.Mui-selected": {
                  backgroundColor: "#90D916 !important",
                  color: "#FFF",
                  fontWeight: 600,
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "#b9e76f !important",
                },
              }}
            >
              {opt.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
