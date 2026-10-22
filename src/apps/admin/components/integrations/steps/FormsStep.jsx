import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Checkbox,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import CheckBoxOutlineBlankOutlinedIcon from "@mui/icons-material/CheckBoxOutlineBlankOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function FormsStep({
  state,
  onChange,
  forms = [],
  loadingForms = false,
}) {
  const { formMode, formIds, pageName } = state;

  const handleModeChange = (mode) => {
    onChange({
      ...state,
      formMode: mode,
      // If switching to all forms, clear or keep selection
      formIds: mode === "all" ? [] : (formIds && formIds.length > 0 ? formIds : forms.slice(0, 1).map((f) => f.id)),
    });
  };

  const handleToggleForm = (id) => {
    const current = new Set(formIds || []);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    onChange({
      ...state,
      formIds: Array.from(current),
    });
  };

  const handleSelectAll = () => {
    onChange({
      ...state,
      formIds: forms.map((f) => f.id),
    });
  };

  const handleDeselectAll = () => {
    onChange({
      ...state,
      formIds: [],
    });
  };

  const optionCards = [
    {
      mode: "specific",
      title: "Specific forms",
      desc: "Select specific Instant Forms from this page to stream leads into your CRM.",
      icon: <DynamicFormIcon sx={{ fontSize: 24, color: formMode === "specific" ? "#84CC16" : "#64748B" }} />,
    },
    {
      mode: "all",
      title: "All current & future forms",
      desc: "Automatically connect all existing forms and any new forms created on this page.",
      icon: <AutoAwesomeIcon sx={{ fontSize: 24, color: formMode === "all" ? "#84CC16" : "#64748B" }} />,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Top Banner showing Selected Facebook Page */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: "8px",
          backgroundColor: "#F8FAFC",
          border: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", fontFamily: "Inter, sans-serif" }}>
            Connecting Forms For
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
            {pageName || "Selected Facebook Page"}
          </Typography>
        </Box>
        <Chip
          label="Meta Verified Page"
          size="small"
          sx={{ backgroundColor: "#F7FEE7", color: "#65A30D", border: "1px solid #84CC16", fontWeight: 600, fontSize: "11px", fontFamily: "Inter, sans-serif" }}
        />
      </Box>

      {/* 2 Selectable Option Cards */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
          Choose Form Capture Mode <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, width: "100%" }}>
          {optionCards.map((opt) => {
            const isSelected = formMode === opt.mode;
            return (
              <Paper
                key={opt.mode}
                elevation={0}
                onClick={() => handleModeChange(opt.mode)}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleModeChange(opt.mode);
                  }
                }}
                sx={{
                  p: 1.5,
                  height: "100%",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: isSelected ? "1.5px solid #84CC16" : "1px solid #E2E8F0",
                  backgroundColor: isSelected ? "rgba(132, 204, 22, 0.04)" : "#FFFFFF",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  "&:hover": {
                    borderColor: isSelected ? "#84CC16" : "#CBD5E1",
                    backgroundColor: isSelected ? "rgba(132, 204, 22, 0.07)" : "#F8FAFC",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #84CC16",
                    outlineOffset: "2px",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {opt.icon}
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: isSelected ? "5px solid #84CC16" : "2px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      transition: "all 0.15s ease",
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                  {opt.title}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748B", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
                  {opt.desc}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Mode A: Specific Forms Checklist */}
      {formMode === "specific" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Box>
              <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                Select Instant Forms <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
              </Typography>
              <Typography sx={{ fontSize: "11px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                At least one form must be selected ({formIds?.length || 0} of {forms.length} selected).
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                onClick={handleSelectAll}
                sx={{
                  textTransform: "none",
                  fontSize: "12px",
                  fontFamily: "Inter, sans-serif",
                  color: "#64748B",
                  p: 0.5,
                  "&:hover": { color: "#65A30D" },
                }}
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={handleDeselectAll}
                sx={{
                  textTransform: "none",
                  fontSize: "12px",
                  fontFamily: "Inter, sans-serif",
                  color: "#64748B",
                  p: 0.5,
                  "&:hover": { color: "#65A30D" },
                }}
              >
                Deselect All
              </Button>
            </Box>
          </Box>

          {loadingForms ? (
            <Box sx={{ p: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
              <CircularProgress size={20} sx={{ color: "#84CC16" }} />
              <Typography sx={{ fontSize: "13px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>Loading Instant Forms...</Typography>
            </Box>
          ) : forms.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center", backgroundColor: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: "10px" }}>
              <Typography sx={{ fontSize: "13px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                No active Instant Forms found on this page. Create one on Meta Ads Manager or choose &quot;All current &amp; future forms&quot;.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                maxHeight: "260px",
                overflowY: "auto",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                divideY: "1px solid #F1F5F9",
              }}
            >
              {forms.map((form) => {
                const checked = formIds?.includes(form.id);
                return (
                  <Box
                    key={form.id}
                    onClick={() => handleToggleForm(form.id)}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={checked}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggleForm(form.id);
                      }
                    }}
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      borderBottom: "1px solid #F1F5F9",
                      backgroundColor: checked ? "rgba(132, 204, 22, 0.04)" : "#FFFFFF",
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        backgroundColor: checked ? "rgba(132, 204, 22, 0.08)" : "#F8FAFC",
                      },
                      "&:focus-visible": {
                        outline: "2px solid #84CC16",
                        outlineOffset: "-2px",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Checkbox
                        checked={Boolean(checked)}
                        onChange={() => handleToggleForm(form.id)}
                        icon={<CheckBoxOutlineBlankOutlinedIcon sx={{ color: "#CBD5E1" }} />}
                        checkedIcon={<CheckBoxOutlinedIcon sx={{ color: "#84CC16" }} />}
                        sx={{ p: 0.5 }}
                      />
                      <Box>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                          {form.name}
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                          ID: {form.id}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      {form.leadCount !== undefined && (
                        <Chip
                          label={`${form.leadCount} leads`}
                          size="small"
                          sx={{ height: 22, fontSize: "11px", fontWeight: 600, backgroundColor: "#F1F5F9", color: "#334155", fontFamily: "Inter, sans-serif" }}
                        />
                      )}
                      <Chip
                        label="Active"
                        size="small"
                        sx={{ height: 20, fontSize: "10px", fontWeight: 600, backgroundColor: "#F7FEE7", color: "#65A30D", border: "1px solid #84CC16", fontFamily: "Inter, sans-serif" }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Mode B: All Forms Info Card */}
      {formMode === "all" && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon sx={{ fontSize: 20, color: "#84CC16" }} />}
          sx={{
            backgroundColor: "#F7FEE7",
            color: "#1E293B",
            borderRadius: "10px",
            border: "1px solid #DDF6A8",
            "& .MuiAlert-message": { fontSize: "13px", lineHeight: 1.5, fontFamily: "Inter, sans-serif" },
          }}
        >
          <strong>All Forms Mode Enabled:</strong> Every lead submitted through any existing form on this page — plus any new forms published in the future — will automatically be ingested and routed to your designated CRM campaign without manual updates.
        </Alert>
      )}
    </Box>
  );
}
