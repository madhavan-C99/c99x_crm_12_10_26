import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  Select,
  Checkbox,
  FormControlLabel,
  Collapse,
  Paper,
  Grid,
} from "@mui/material";
import { CreateCampaignModal } from "@/apps/admin/components/common/CreateCampaignModal";

export default function RoutingStep({
  state,
  onChange,
  campaigns = [],
  crmFields = [],
}) {
  const { routing, customizeFields, fieldMapping } = state;

  // Create Campaign modal state
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  const handleRoutingTypeChange = (type) => {
    onChange({
      ...state,
      routing: {
        ...routing,
        type,
      },
    });

    // "Create a campaign" select pannina udane modal open aagum
    if (type === "new") {
      setIsCreateCampaignOpen(true);
    }
  };

  const handleCampaignIdChange = (e) => {
    onChange({
      ...state,
      routing: {
        ...routing,
        campaignId: e.target.value,
      },
    });
  };

  // Modal-la save pannina apparam: name input-la show aagum
  const handleCampaignCreated = (payload) => {
    onChange({
      ...state,
      routing: {
        ...routing,
        type: "new",
        campaignName: payload?.name || "",
        // backend id kudutha store pannikalam (duplicate create thavirkka)
        campaignId: payload?.id ?? payload?._id ?? routing.campaignId,
        campaignCreated: true,
      },
    });
    setIsCreateCampaignOpen(false);
  };

  // Field Mapping
  const handleToggleCustomizeFields = (e) => {
    onChange({
      ...state,
      customizeFields: e.target.checked,
    });
  };

  const handleFieldMappingChange = (fbKey, crmVal) => {
    onChange({
      ...state,
      fieldMapping: {
        ...fieldMapping,
        [fbKey]: crmVal,
      },
    });
  };

  const optionCards = [
    {
      type: "existing",
      title: "Use an existing campaign",
      desc: "Add leads to one you already run",
    },
    {
      type: "new",
      title: "Create a campaign",
      desc: "Start a fresh campaign for this Page",
    },
  ];

  const fbFieldsList =
    Array.isArray(crmFields) && crmFields.length > 0
      ? crmFields
      : [
          {
            key: "full_name",
            name: "full_name",
            label: "Full Name",
            required: true,
          },
          {
            key: "phone_number",
            name: "phone_number",
            label: "Phone Number",
            required: true,
          },
          {
            key: "email",
            name: "email",
            label: "Email Address",
            required: false,
          },
          { key: "city", name: "city", label: "City", required: false },
        ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Title */}
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#0F172A",
          fontFamily: "Inter, sans-serif",
          mb: 1.5,
        }}
      >
        Where should new leads go?
      </Typography>

      {/* 2 Selectable Option Cards (50/50 full-width even grid) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
          width: "100%",
        }}
      >
        {optionCards.map((opt) => {
          const isSelected = routing.type === opt.type;
          return (
            <Paper
              key={opt.type}
              elevation={0}
              onClick={() => handleRoutingTypeChange(opt.type)}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleRoutingTypeChange(opt.type);
                }
              }}
              sx={{
                p: 1.5,
                minHeight: "72px",
                borderRadius: "8px",
                cursor: "pointer",
                border: isSelected
                  ? "1.5px solid #84CC16"
                  : "1px solid #E2E8F0",
                backgroundColor: isSelected
                  ? "rgba(132, 204, 22, 0.04)"
                  : "#FFFFFF",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                "&:hover": {
                  borderColor: isSelected ? "#84CC16" : "#CBD5E1",
                  backgroundColor: isSelected
                    ? "rgba(132, 204, 22, 0.07)"
                    : "#F8FAFC",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isSelected ? "#0F172A" : "#1E293B",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.25,
                }}
              >
                {opt.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "11px",
                  color: "#64748B",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.3,
                }}
              >
                {opt.desc}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Option A: Use an existing campaign */}
      {routing.type === "existing" && (
        <Box sx={{ mt: 2 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#1E293B",
              fontFamily: "Inter, sans-serif",
              mb: 0.5,
            }}
          >
            Select Campaign{" "}
            <Typography component="span" sx={{ color: "#EF4444" }}>
              *
            </Typography>
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={routing.campaignId || ""}
              onChange={handleCampaignIdChange}
              displayEmpty
              sx={{
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                backgroundColor: "#FFFFFF",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: "#84CC16" },
              }}
            >
              <MenuItem
                value=""
                disabled
                sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              >
                <em>Select an existing campaign...</em>
              </MenuItem>
              {campaigns.map((camp) => (
                <MenuItem
                  key={camp.id}
                  value={camp.id}
                  sx={{ fontSize: "14px", fontFamily: "Inter, sans-serif" }}
                >
                  {camp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Option B: Create a campaign */}
      {routing.type === "new" && (
        <Box sx={{ mt: 2 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#1E293B",
              fontFamily: "Inter, sans-serif",
              mb: 0.5,
            }}
          >
            Campaign name{" "}
            <Typography component="span" sx={{ color: "#EF4444" }}>
              *
            </Typography>
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Click here to create a campaign"
            value={routing.campaignName || ""}
            onClick={() => setIsCreateCampaignOpen(true)}
            InputProps={{ readOnly: true }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
                "& input": { cursor: "pointer" },
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: "#84CC16" },
              },
            }}
          />
        </Box>
      )}

      {/* Customize form field names Checkbox */}
      <Box sx={{ mt: 1.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(customizeFields)}
              onChange={handleToggleCustomizeFields}
              size="small"
              sx={{
                color: "#CBD5E1",
                "&.Mui-checked": { color: "#84CC16" },
                p: 0.5,
                mr: 0.5,
              }}
            />
          }
          label={
            <Typography
              sx={{
                fontSize: "13px",
                color: "#334155",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Customize form field names
            </Typography>
          }
          sx={{ m: 0 }}
        />

        <Collapse in={Boolean(customizeFields)} timeout="auto" unmountOnExit>
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: "8px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: 1.2,
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Map incoming Facebook Instant Form question fields to your CRM
              lead fields:
            </Typography>

            <Grid container spacing={1.2}>
              {fbFieldsList.map((fb) => {
                const fieldKey = fb.name || fb.key;
                return (
                  <Grid item xs={12} sm={6} key={fieldKey}>
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: "6px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#475569",
                          fontFamily: "Inter, sans-serif",
                          mb: 0.5,
                        }}
                      >
                        {fb.label || fieldKey}{" "}
                        {fb.required && (
                          <Typography
                            component="span"
                            sx={{ color: "#EF4444" }}
                          >
                            *
                          </Typography>
                        )}
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={fieldMapping?.[fieldKey] || fieldKey}
                          onChange={(e) =>
                            handleFieldMappingChange(fieldKey, e.target.value)
                          }
                          sx={{
                            fontSize: "13px",
                            fontFamily: "Inter, sans-serif",
                            borderRadius: "6px",
                            "&.Mui-focused fieldset": {
                              borderColor: "#84CC16",
                            },
                          }}
                        >
                          {fbFieldsList.map((field) => {
                            const optKey = field.name || field.key;
                            return (
                              <MenuItem
                                key={optKey}
                                value={optKey}
                                sx={{
                                  fontSize: "13px",
                                  fontFamily: "Inter, sans-serif",
                                }}
                              >
                                {field.label || optKey}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Collapse>
      </Box>

      {/* Existing common Create Campaign modal */}
      <CreateCampaignModal
        open={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        onCreateSuccess={handleCampaignCreated}
      />
    </Box>
  );
}
