import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Button,
  Stack,
} from "@mui/material";

function FilterLeadsPanel({
  initialFilters = {},
  campaignOptions = ["All"],
  courseOptions = ["All"],
  coursePlanOptions = ["All"],
  sourceOptions = ["All"],
  paymentStatusOptions = ["All"],
  paymentStageOptions,
  priorityOptions = ["All"],
  tagOptions,
  onApply,
  onReset,
  closePanel,
}) {
  const effectiveTagOptions =
    tagOptions && tagOptions.length > 0 ? tagOptions : priorityOptions;
  const effectivePaymentOptions =
    paymentStageOptions && paymentStageOptions.length > 0
      ? paymentStageOptions
      : paymentStatusOptions;

  const [filters, setFilters] = useState({
    campaignName: initialFilters.campaignName || "All",
    courseName: initialFilters.courseName || "All",
    coursePlan: initialFilters.coursePlan || "All",
    leadSource: initialFilters.leadSource || "All",
    paymentStage:
      initialFilters.paymentStage || initialFilters.paymentStatus || "All",
    paymentStatus:
      initialFilters.paymentStatus || initialFilters.paymentStage || "All",
    tag: initialFilters.tag || initialFilters.priority || "All",
    priority: initialFilters.priority || initialFilters.tag || "All",
  });

  // 🌟 PRESERVE FILTER VALUES WHEN RE-OPENED
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters((prev) => ({
        ...prev,
        ...initialFilters,
        paymentStage:
          initialFilters.paymentStage ||
          initialFilters.paymentStatus ||
          prev.paymentStage ||
          "All",
        paymentStatus:
          initialFilters.paymentStatus ||
          initialFilters.paymentStage ||
          prev.paymentStatus ||
          "All",
        tag: initialFilters.tag || initialFilters.priority || prev.tag || "All",
        priority:
          initialFilters.priority || initialFilters.tag || prev.priority || "All",
      }));
    }
  }, [initialFilters]);

  const handleChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "paymentStage") next.paymentStatus = value;
      if (field === "paymentStatus") next.paymentStage = value;
      if (field === "tag") next.priority = value;
      if (field === "priority") next.tag = value;
      return next;
    });
  };

  const handleReset = () => {
    const defaultState = {
      campaignName: "All",
      courseName: "All",
      coursePlan: "All",
      leadSource: "All",
      paymentStage: "All",
      paymentStatus: "All",
      tag: "All",
      priority: "All",
    };
    setFilters(defaultState);
    onReset?.(defaultState);
  };

  const handleApply = () => {
    onApply?.(filters);
    closePanel?.();
  };

  const selectStyle = {
    height: 36,
    width: "180px",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#ffffff",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#D0D0D0",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#B0B0B0",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#8BC34A",
    },
    "& .MuiSelect-select": {
      padding: "6px 12px",
    },
  };

  const formatOption = (opt) => {
    if (opt == null) return { value: "", label: "" };
    if (typeof opt === "object") {
      const val = opt.value ?? opt.id ?? opt.name ?? opt.label ?? "";
      const label = opt.label ?? opt.name ?? opt.value ?? String(val);
      return { value: String(val), label: String(label) };
    }
    return { value: String(opt), label: String(opt) };
  };

  const getOptionsList = (options) => {
    const list = Array.isArray(options) && options.length > 0 ? options : [];
    const hasAll = list.some((opt) => {
      const { value, label } = formatOption(opt);
      return value.toLowerCase() === "all" || label.toLowerCase() === "all";
    });
    return hasAll ? list : ["All", ...list];
  };

  const renderSelect = (field, optionsList) => {
    const opts = getOptionsList(optionsList);
    return (
      <Select
        value={filters[field] ?? "All"}
        onChange={(e) => handleChange(field, e.target.value)}
        sx={selectStyle}
      >
        {opts.map((opt, idx) => {
          const { value, label } = formatOption(opt);
          return (
            <MenuItem key={`${value}-${idx}`} value={value} sx={{ fontSize: "14px" }}>
              {label}
            </MenuItem>
          );
        })}
      </Select>
    );
  };

  return (
    <Box sx={{ width: "100%", p: 2.5, bgcolor: "#ffffff", borderRadius: "12px" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          pb: 1,
          borderBottom: "1px solid #EFEFEF",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            color: "#111111",
          }}
        >
          Filter Leads
        </Typography>
        <Typography
          onClick={handleReset}
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            color: "#8BC34A",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Reset
        </Typography>
      </Box>

      {/* Form Fields */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* 1. Campaign Name */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: "#222" }}>
            Campaign Name
          </Typography>
          <FormControl size="small">
            {renderSelect("campaignName", campaignOptions)}
          </FormControl>
        </Box>

        {/* 2. Course Name */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: "#222" }}>
            Course Name
          </Typography>
          <FormControl size="small">
            {renderSelect("courseName", courseOptions)}
          </FormControl>
        </Box>

        {/* 3. Course Plan */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: "#222" }}>
            Course Plan
          </Typography>
          <FormControl size="small">
            {renderSelect("coursePlan", coursePlanOptions)}
          </FormControl>
        </Box>

        {/* 4. Lead Source */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: "#222" }}>
            Lead Source
          </Typography>
          <FormControl size="small">
            {renderSelect("leadSource", sourceOptions)}
          </FormControl>
        </Box>

        {/* 5. Payment Stage */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: "#222" }}>
            Payment Stage
          </Typography>
          <FormControl size="small">
            {renderSelect("paymentStage", effectivePaymentOptions)}
          </FormControl>
        </Box>

        {/* 6. Tag */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: "#222" }}>
            Tag
          </Typography>
          <FormControl size="small">
            {renderSelect("tag", effectiveTagOptions)}
          </FormControl>
        </Box>
      </Stack>

      {/* Footer Buttons */}
      <Stack direction="row" spacing={1.5} sx={{ pt: 2, borderTop: "1px solid #EFEFEF" }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleReset}
          sx={{
            height: 38,
            borderRadius: "8px",
            borderColor: "#2196F3",
            color: "#2196F3",
            textTransform: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            "&:hover": { borderColor: "#1976D2", bgcolor: "#F4F8FF" },
          }}
        >
          Reset Filters
        </Button>

        <Button
          fullWidth
          variant="contained"
          onClick={handleApply}
          sx={{
            height: 38,
            borderRadius: "8px",
            bgcolor: "#8BC34A",
            color: "#ffffff",
            textTransform: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            boxShadow: "none",
            "&:hover": { bgcolor: "#7CB342", boxShadow: "none" },
          }}
        >
          Apply Filters
        </Button>
      </Stack>
    </Box>
  );
}

export default FilterLeadsPanel;