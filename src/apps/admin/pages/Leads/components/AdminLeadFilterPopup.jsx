import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import { getLeadSelectOptions } from "../../../services/leadService";

const INITIAL_DROPDOWN_STATE = {
  pipeline_stage_id: [{ label: "All", value: 0 }],
  lead_source_id: [{ label: "All", value: 0 }],
  campaign_name_id: [{ label: "All", value: 0 }],
  course_id: [{ label: "All", value: 0 }],
  course_plan_id: [{ label: "All", value: 0 }],
  assigned_to_id: [{ label: "All", value: 0 }],
};

const FILTER_FIELDS = [
  { key: "pipeline_stage_id", label: "Pipeline Stage" },
  { key: "lead_source_id", label: "Lead Source" },
  { key: "campaign_name_id", label: "Campaign Name" },
  { key: "course_id", label: "Course" },
  { key: "course_plan_id", label: "Course Plan" },
  { key: "assigned_to_id", label: "Assigned User" },
];

const AdminLeadFilterPopup = ({
  selectedFilters,
  setSelectedFilters,
  onClose,
  fetchLeadData,
  open,
  selectedPipeline,
}) => {
  const [tempFilters, setTempFilters] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState(INITIAL_DROPDOWN_STATE);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) {
      setTempFilters(selectedFilters || {});
      if (dropdownOptions.pipeline_stage_id.length <= 1) {
        loadAdminSelectOptions();
      }
    }
  }, [open]);

  const loadAdminSelectOptions = async () => {
    try {
      setLoadingOptions(true);
      const optFilter = selectedPipeline ? { pipeline_id: selectedPipeline } : null;
      const res = await getLeadSelectOptions(optFilter);
      const raw = res?.data;
      const data = raw?.data || raw?.result || raw || {};

      const capitalize = (str) => {
        if (!str) return "";
        return String(str)
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      };

      const formatList = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return null;
        return arr.map((item, idx) => {
          if (typeof item !== "object" || !item) {
            return { label: capitalize(String(item)), value: item };
          }
          const rawName =
            item.name ||
            item.user_name ||
            item.telecaller_name ||
            item.username ||
            item.full_name ||
            item.first_name ||
            item.label ||
            item.title ||
            item.stage_name ||
            item.source_name ||
            item.campaign_name ||
            "";
          const val =
            item.id ??
            item.value ??
            item.user_id ??
            item.telecaller_id ??
            item.assigned_to_id ??
            item.stage_id ??
            item.source_id ??
            item.campaign_id ??
            idx + 1;
          return {
            label: capitalize(rawName) || String(val),
            value: val,
          };
        });
      };

      const stages = formatList(data.stages);
      const sources = formatList(data.sources);
      const campaigns = formatList(data.campaigns);
      const courses = formatList(data.courses);
      const plans = formatList(data.course_plans);
      const telecallers = formatList(data.telecallers);

      setDropdownOptions({
        pipeline_stage_id: stages ? [{ label: "All", value: 0 }, ...stages] : [{ label: "All", value: 0 }],
        lead_source_id: sources ? [{ label: "All", value: 0 }, ...sources] : [{ label: "All", value: 0 }],
        campaign_name_id: campaigns ? [{ label: "All", value: 0 }, ...campaigns] : [{ label: "All", value: 0 }],
        course_id: courses ? [{ label: "All", value: 0 }, ...courses] : [{ label: "All", value: 0 }],
        course_plan_id: plans ? [{ label: "All", value: 0 }, ...plans] : [{ label: "All", value: 0 }],
        assigned_to_id: telecallers ? [{ label: "All", value: 0 }, ...telecallers] : [{ label: "All", value: 0 }],
      });
    } catch (err) {
      console.warn("Failed to load admin filter options:", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleDropdownChange = (key, value) => {
    const opts = dropdownOptions[key] || [];
    const found = opts.find((o) => o.value === value);
    const labelKey = key.replace("_id", "_label");
    const nameKey = key.replace("_id", "_name");

    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
      [labelKey]: found?.label || "",
      [nameKey]: found?.name || found?.label || "",
    }));
  };

  const handleApply = () => {
    setSelectedFilters(tempFilters);
    if (fetchLeadData) {
      fetchLeadData(tempFilters);
    }
    onClose();
  };

  const handleReset = () => {
    const resetObj = {
      pipeline_stage_id: 0,
      lead_source_id: 0,
      campaign_name_id: 0,
      course_id: 0,
      course_plan_id: 0,
      assigned_to_id: 0,
    };
    setTempFilters(resetObj);
    setSelectedFilters(resetObj);
    if (fetchLeadData) {
      fetchLeadData(resetObj);
    }
    onClose();
  };

  return (
    <Box
      sx={{
        width: 420,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #ECECEC",
        }}
      >
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1E293B",
          }}
        >
          Filter Admin Leads
        </Typography>

        <Typography
          onClick={handleReset}
          sx={{
            color: "#84CC16",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Reset All
        </Typography>
      </Box>

      {/* Filter Select Fields */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.8,
        }}
      >
        {FILTER_FIELDS.map((field) => {
          const options = dropdownOptions[field.key] || [
            { label: "All", value: 0 },
          ];
          const currentValue = tempFilters[field.key] ?? 0;

          return (
            <Box
              key={field.key}
              sx={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                {field.label}
              </Typography>

              <TextField
                select
                size="small"
                value={currentValue}
                onChange={(e) => handleDropdownChange(field.key, e.target.value)}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    fontSize: 13,
                  },
                }}
              >
                {options.map((opt) => (
                  <MenuItem
                    key={opt.value ?? opt.label}
                    value={opt.value}
                    sx={{ fontSize: 13 }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          );
        })}
      </Box>

      {/* Footer Action Buttons */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          borderTop: "1px solid #ECECEC",
          backgroundColor: "#F8FAFC",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: "#64748B",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          sx={{
            backgroundColor: "#84CC16",
            color: "#FFF",
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            fontWeight: 600,
            fontSize: "13px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#65A30D",
              boxShadow: "none",
            },
          }}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
};

export default AdminLeadFilterPopup;
