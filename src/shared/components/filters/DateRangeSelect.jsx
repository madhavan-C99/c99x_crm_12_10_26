import { useState } from "react";
import { Chip, MenuItem, TextField } from "@mui/material";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import dayjs from "dayjs";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";
import { controlFieldSx, selectedMenuItemSx } from "./filterStyles";

export const DATE_FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "year", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

/**
 * Period dropdown (Today / Weekly / ... / Custom) + custom-range dialog + range chip.
 * The page owns the state; this component only decides WHEN the dialog opens
 * and what happens when a range is applied or cleared.
 */
export default function DateRangeSelect({
  filterType,
  setFilterType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  defaultType = "monthly",
}) {
  const [openCalendar, setOpenCalendar] = useState(false);

  const hasCustomRange = filterType === "custom" && fromDate && toDate;
  const rangeLabel = hasCustomRange
    ? `${dayjs(fromDate).format("DD MMM")} - ${dayjs(toDate).format("DD MMM")}`
    : "";

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setOpenCalendar(true);
      return;
    }
    setFilterType(value);
    setFromDate("");
    setToDate("");
  };

  const handleApply = (from, to) => {
    setFromDate(from);
    setToDate(to);
    setFilterType("custom");
    setOpenCalendar(false);
  };

  // Cancel / backdrop / Esc: don't leave the dropdown stuck on "custom" with no range
  const handleClose = () => {
    setOpenCalendar(false);
    if (!fromDate || !toDate) {
      setFilterType((prev) => (prev === "custom" ? defaultType : prev));
    }
  };

  // the page refetches by itself when filterType changes
  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setFilterType(defaultType);
  };

  const renderValue = (value) => {
    if (hasCustomRange && value === "custom") {
      return `${dayjs(fromDate).format("DD/MM/YYYY")} - ${dayjs(toDate).format("DD/MM/YYYY")}`;
    }
    return DATE_FILTER_OPTIONS.find((o) => o.value === value)?.label || "Select Date";
  };

  return (
    <>
      <TextField
        select
        size="small"
        value={filterType}
        onChange={handleChange}
        SelectProps={{ IconComponent: KeyboardArrowDownOutlinedIcon, renderValue }}
        sx={{ minWidth: "110px", ...controlFieldSx }}
      >
        {DATE_FILTER_OPTIONS.map(({ value, label }) => (
          <MenuItem
            key={value}
            value={value}
            // re-clicking "Custom" while it is already selected doesn't fire onChange
            onClick={value === "custom" ? () => setOpenCalendar(true) : undefined}
            sx={selectedMenuItemSx}
          >
            {label}
          </MenuItem>
        ))}
      </TextField>

      {hasCustomRange && (
        <Chip
          icon={<CalendarMonth sx={{ fontSize: "16px !important" }} />}
          label={rangeLabel}
          onDelete={handleClear}
          sx={{ backgroundColor: "#E9F6D4", color: "#3A6B00", fontWeight: 500, fontSize: "12px" }}
        />
      )}

      <CustomDateRangePicker
        open={openCalendar}
        onClose={handleClose}
        onApply={handleApply}
        initialFrom={fromDate}
        initialTo={toDate}
      />
    </>
  );
}
