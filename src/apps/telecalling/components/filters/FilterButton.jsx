import { useState } from "react";
import { Button, Popover } from "@mui/material";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import FilterPopup from "./popup/FilterPopup";
import { toolbarButtonSx } from "@/shared/components/filters/filterStyles";

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
        marginThreshold={16}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "calc(100vw - 32px)", sm: 420 },
              maxWidth: 420,
              maxHeight: { xs: "80vh", sm: "85vh" },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "14px",
              boxShadow: "0px 10px 35px rgba(0,0,0,0.2)",
              m: { xs: 1, sm: 0 },
            },
          },
        }}
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
