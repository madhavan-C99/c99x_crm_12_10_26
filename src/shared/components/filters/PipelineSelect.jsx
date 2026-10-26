import { FormControl, MenuItem, Select } from "@mui/material";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import { selectedMenuItemSx } from "./filterStyles";

/**
 * One pipeline dropdown for every page.
 *  variant="header"  -> big white select with an "All Pipelines" option (page headers)
 *  variant="toolbar" -> small grey select inside a filter bar (no "All" option)
 */
export default function PipelineSelect({
  pipelines = [],
  value,
  onChange,
  variant = "header",
}) {
  const handleChange = (e) => onChange?.(Number(e.target.value));

  if (variant === "toolbar") {
    const exists = pipelines.some((p) => String(p.id) === String(value));
    return (
      <Select
        size="small"
        value={exists ? value : ""}
        displayEmpty
        renderValue={(val) => {
          const found = pipelines.find((p) => String(p.id) === String(val));
          return found ? found.name : "Select Pipeline";
        }}
        onChange={handleChange}
        IconComponent={KeyboardArrowDownOutlinedIcon}
        sx={{
          minWidth: "150px",
          height: "31px",
          borderRadius: "6px",
          background: "#E6E6E6",
          "& fieldset": { border: "none" },
          fontSize: "14px",
        }}
      >
        {pipelines.map((p) => (
          <MenuItem key={p.id} value={p.id} sx={selectedMenuItemSx}>
            {p.name}
            {p.is_default ? " (Default)" : ""}
          </MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
      <Select
        value={value || 0}
        onChange={handleChange}
        displayEmpty
        sx={{
          height: "38px",
          borderRadius: "7px",
          backgroundColor: "#fff",
          fontSize: "14px",
        }}
      >
        {/* <MenuItem value={0}>All Pipelines</MenuItem> */}
        {pipelines.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
