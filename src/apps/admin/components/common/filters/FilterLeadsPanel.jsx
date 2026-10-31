import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  hideCampaign = false,
  onApply,
  onReset,
  closePanel,
}) {
  const [searchParams] = useSearchParams();
  const isInsideCampaign = hideCampaign || Boolean(searchParams.get("campaign_id"));

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
    width: "175px",
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
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: "300px",
              minWidth: "130px",
              overflowY: "auto",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
            },
          },
        }}
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
    <Box sx={{ width: "100%", maxWidth: 350, p: 2.5, bgcolor: "#ffffff", borderRadius: "12px", display: "flex", flexDirection: "column", height: "350px", maxHeight: "350px", boxSizing: "border-box" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          pb: 1,
          borderBottom: "1px solid #EFEFEF",
          flexShrink: 0,
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
      <Stack
        spacing={2}
        sx={{
          mb: 2,
          flex: 1,
          overflowY: "auto",
          pr: 0.5,
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
        }}
      >
        {/* 1. Campaign Name (Hidden inside a campaign) */}
        {!isInsideCampaign && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: "#222" }}>
              Campaign Name
            </Typography>
            <FormControl size="small">
              {renderSelect("campaignName", campaignOptions)}
            </FormControl>
          </Box>
        )}

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
      <Stack direction="row" spacing={1.5} sx={{ pt: 1.5, borderTop: "1px solid #EFEFEF", flexShrink: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={closePanel}
          sx={{
            height: 38,
            borderRadius: "8px",
            borderColor: "#8BC34A",
            color: "#8BC34A",
            textTransform: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            "&:hover": { borderColor: "#7CB342", bgcolor: "#F7FEE7" },
          }}
        >
          Cancel
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
