/** Look & feel shared by every filter-bar control. Change here, changes everywhere. */
export const CONTROL_HEIGHT = "31px";

export const controlFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: CONTROL_HEIGHT,
    borderRadius: "6px",
    background: "#E6E6E6",
    fontSize: "14px",
    "& fieldset": { border: "none" },
  },
};

export const toolbarButtonSx = {
  height: CONTROL_HEIGHT,
  px: 2,
  borderRadius: "6px",
  background: "#E6E6E6",
  color: "#333",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 400,
  "&:hover": { background: "#ECECEC" },
};

export const selectedMenuItemSx = {
  "&.Mui-selected": { backgroundColor: "#90D916 !important", color: "#FFF" },
  "&.Mui-selected:hover": { backgroundColor: "#b9e76f !important" },
};

export const filterBarSx = {
  background: "#fff",
  border: "1px solid #E5E5E5",
  borderRadius: "7px",
  p: 1.5,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
  flexWrap: "wrap",
  mt: 3,
};

export const reportDateFilterSx = {
  minWidth: "125px",
  "& .MuiOutlinedInput-root": {
    height: "auto !important",
    borderRadius: "8px !important",
    backgroundColor: "#FFFFFF !important",
    fontSize: "13px",
    fontWeight: 500,
    color: "#475569",
    "& fieldset": {
      border: "1px solid #E2E8F0 !important",
    },
    "&:hover fieldset": {
      borderColor: "#CBD5E1 !important",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#90D916 !important",
    },
  },
  "& .MuiSelect-select": {
    fontSize: "13px",
    fontWeight: 500,
    color: "#475569",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-icon": {
    color: "#64748B",
  },
};

export const reportMenuProps = {
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "left",
  },
  transformOrigin: {
    vertical: "top",
    horizontal: "left",
  },
  autoFocus: false,
  disableAutoFocusItem: true,
  PaperProps: {
    style: {
      maxHeight: 300,
    },
    sx: {
      maxHeight: "300px !important",
      borderRadius: "8px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      "&::-webkit-scrollbar": { width: "6px" },
      "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
    },
  },
  MenuListProps: {
    style: {
      maxHeight: 300,
      overflowY: "auto",
    },
    sx: {
      maxHeight: "300px !important",
      overflowY: "auto !important",
      "&::-webkit-scrollbar": { width: "6px" },
      "&::-webkit-scrollbar-track": { background: "transparent" },
      "&::-webkit-scrollbar-thumb": { backgroundColor: "#94A3B8", borderRadius: "4px" },
      "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#64748B" },
    },
  },
  slotProps: {
    paper: {
      style: {
        maxHeight: 300,
      },
      sx: {
        maxHeight: "300px !important",
      },
    },
    list: {
      style: {
        maxHeight: 300,
        overflowY: "auto",
      },
      sx: {
        maxHeight: "300px !important",
        overflowY: "auto !important",
      },
    },
  },
};


