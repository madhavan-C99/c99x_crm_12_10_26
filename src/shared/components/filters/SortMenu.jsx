import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import { selectedMenuItemSx, toolbarButtonSx } from "./filterStyles";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export default function SortMenu({ sortType, setSortType }) {
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <Button
        startIcon={<ImportExportOutlinedIcon />}
        endIcon={<KeyboardArrowDownOutlinedIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={toolbarButtonSx}
      >
        Sort by
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <MenuItem
            key={value}
            selected={sortType === value}
            onClick={() => {
              setSortType(value);
              setAnchor(null);
            }}
            sx={selectedMenuItemSx}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
