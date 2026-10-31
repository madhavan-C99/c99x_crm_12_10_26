import { useEffect, useState } from "react";
import { Chip, MenuItem, TextField } from "@mui/material";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import dayjs from "dayjs";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";
import { getSelectOptions } from "@/shared/services/dropdownService";
import { controlFieldSx, selectedMenuItemSx } from "./filterStyles";

export const DEFAULT_DATE_FILTER_OPTIONS = [
  {value: "all", label: "All"},
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export const DATE_FILTER_OPTIONS = DEFAULT_DATE_FILTER_OPTIONS;

// const ALL_OPTION = { value: "today", label: "Today" };
const CUSTOM_OPTION = { value: "custom", label: "Custom" };

const normalizeDateOption = (item) => {
  if (!item || typeof item !== "object") return null;
  const value = item.value ?? item.id;
  if (value === undefined || value === null) return null;
  return {
    value: String(value),
    // API-la "Custom Range" vandhaalum "Custom"-nu kaattum
    label: value === "custom" ? "Custom" : (item.label ?? String(value)),
  };
};

/**
 * Period dropdown (All / Today / ... / Custom) + custom-range dialog + range chip.
 * The page owns the state; this component only decides WHEN the dialog opens
 * and what happens when a range is applied or cleared.
 */
export function DateRangeSelect({
  filterType,
  setFilterType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  defaultType = "today",
  bgColor,
  border,
  borderRadius,
  height,
  sx = {},
}) {
  const [options, setOptions] = useState(DEFAULT_DATE_FILTER_OPTIONS);
  const [openCalendar, setOpenCalendar] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSelectOptions({ field: "L_DATE_FILTERS" })
      .then((res) => {
        const raw = res?.data?.data ?? res?.data ?? [];
        if (Array.isArray(raw) && raw.length > 0) {
          const parsed = raw.map(normalizeDateOption).filter(Boolean);

          // duplicate values remove
          const unique = parsed.filter(
            (opt, i, arr) => arr.findIndex((o) => o.value === opt.value) === i,
          );

          // API-la illa-na "All" top-la, "Custom" last-la add aagum
          // if (!unique.some((opt) => opt.value === "Today")) {
          //   unique.unshift(ALL_OPTION);
          // }
          if (!unique.some((opt) => opt.value === "custom")) {
            unique.push(CUSTOM_OPTION);
          }

          if (isMounted) setOptions(unique);
        }
      })
      .catch((err) => {
        console.warn(
          "Could not fetch L_DATE_FILTERS, falling back to default options:",
          err,
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Cancel / backdrop / Esc: range illama "custom"-la stuck aagakoodadhu
  const handleClose = () => {
    setOpenCalendar(false);
    if (!fromDate || !toDate) {
      if (filterType === "custom") setFilterType(defaultType);
    }
  };

  // filterType maarum bodhu page thaanaave refetch pannum
  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setFilterType(defaultType);
  };

  const normalizeTarget = (val) => {
    if (!val) return defaultType || "today";
    if (val === "year" || val === "yearly") return "this_year";
    if (val === "month" || val === "monthly") return "this_month";
    return val;
  };

  const renderValue = (value) => {
    if (hasCustomRange && (value === "custom" || filterType === "custom")) {
      return `${dayjs(fromDate).format("DD/MM/YYYY")} - ${dayjs(toDate).format("DD/MM/YYYY")}`;
    }
    const target = normalizeTarget(value);
    const found = options.find((o) => o.value === target || o.value === value);
    if (found) return found.label;
    if (target === "this_year") return "This Year";
    if (target === "this_month") return "This Month";
    if (target === "last_30_days") return "Last 30 days";
    if (target === "last_7_days") return "Last 7 days";
    if (target === "today") return "Today";
    if (target === "yesterday") return "Yesterday";
    if (target === "all") return "All";
    return String(value || "Today");
  };

  const customBg = bgColor || sx?.backgroundColor || sx?.background;
  const customBorder = border || sx?.border;
  const customBorderRadius = borderRadius || sx?.borderRadius;
  const customHeight = height || sx?.height;

  const inputRootStyles = {
    ...(customBg && {
      backgroundColor: `${customBg} !important`,
      background: `${customBg} !important`,
    }),
    ...(customBorder && { border: `${customBorder} !important` }),
    ...(customBorderRadius && {
      borderRadius: `${customBorderRadius} !important`,
    }),
    ...(customHeight && { height: `${customHeight} !important` }),
  };

  return (
    <>
      <TextField
        select
        size="small"
        value={normalizeTarget(filterType)}
        onChange={handleChange}
        SelectProps={{
          IconComponent: KeyboardArrowDownIcon,
          renderValue,
          MenuProps: {
            PaperProps: {
              sx: {
                minWidth: "130px",
                maxHeight: "300px",
                overflowY: "auto",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                "&::-webkit-scrollbar": {
                  width: "5px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#CBD5E1",
                  borderRadius: "4px",
                },
              },
            },
          },
        }}
        sx={{
          minWidth: "110px",
          ...controlFieldSx,
          ...(Object.keys(inputRootStyles).length > 0 && {
            "& .MuiOutlinedInput-root": inputRootStyles,
          }),
          ...sx,
        }}
      >
        {options.map(({ value, label }) => (
          <MenuItem
            key={value}
            value={value}
            // "Custom" already selected-a irukkum bodhu re-click panna onChange fire aagaadhu
            onClick={
              value === "custom" ? () => setOpenCalendar(true) : undefined
            }
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
          sx={{
            backgroundColor: "#E9F6D4",
            color: "#3A6B00",
            fontWeight: 500,
            fontSize: "12px",
          }}
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

export default DateRangeSelect;
