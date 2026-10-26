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
