import { useState } from "react";
import { Button, Popover } from "@mui/material";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import FilterPopup from "./popup/FilterPopup";
import { toolbarButtonSx } from "./filterStyles";

/** "Filter" button that opens the dropdown-driven filter popup. */
export default function FilterButton({
  selectedFilters,
  setSelectedFilters,
  dropdownCategory,
  selectedPipelineId = 0,
}) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  return (
    <>
      <Button
        startIcon={<FilterListOutlinedIcon />}
        endIcon={<KeyboardArrowDownOutlinedIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={toolbarButtonSx}
      >
        Filter
      </Button>

      <Popover
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 430, overflow: "hidden", borderRadius: "12px" } } }}
      >
        <FilterPopup
          open={Boolean(anchor)}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          onClose={close}
          dropdownCategory={dropdownCategory}
          selectedPipelineId={selectedPipelineId}
        />
      </Popover>
    </>
  );
}
