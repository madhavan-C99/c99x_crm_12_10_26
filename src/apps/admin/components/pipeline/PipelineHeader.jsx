import { useState } from "react";

import {
  Box,
  Typography,
  InputBase,
  Button,
  Menu,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";

import { Search, Add, KeyboardArrowDown } from "@mui/icons-material";
import { useAuth } from "@/shared/context/AuthContext";

const PipelineHeader = ({
  searchValue = "",
  onSearchChange = () => {},
  pipelinesList = [],
  selectedPipeline = null,
  onPipelineChange = () => {},
  onCreateCampaign = () => {},
  onLeadSummary = () => {},
  onCallLogs = () => {},
  onAction = () => {},
}) => {
  const { hasPermission } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const openActions = Boolean(anchorEl);

  const actionItems = [
    { label: "Disposition", permission: "api_disposition_log_admin" },
    { label: "Upload Excel Sheet", permission: "api_upload_lead_excel_admin" },
    { label: "Add Lead", permission: "api_add_new_lead_admin" },
    {
      label: "Manage Pipeline",
      permission: "api_education_pipeline_stats_admin",
    },
  ];

  const visibleActionItems = actionItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const currentPipelineObj = (
    Array.isArray(pipelinesList) ? pipelinesList : []
  ).find(
    (p) => (p.id ?? p.value) === selectedPipeline || p === selectedPipeline,
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        p: 2,
        borderBottom: "1px solid #EFEFEF",
      }}
    >
      {/* TITLE */}
      <Typography
        sx={{
          fontSize: { xs: "16px", sm: "18px", md: "22px" },
          fontWeight: 700,
          color: "#111",
        }}
      >
        Pipeline
      </Typography>

      {/* RIGHT CLUSTER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        {/* PIPELINE SELECT DROPDOWN */}
        <FormControl size="small">
          <Select
            value={selectedPipeline || ""}
            onChange={(e) => onPipelineChange(e.target.value)}
            displayEmpty
            IconComponent={KeyboardArrowDown}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: "300px",
                  overflowY: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  "&::-webkit-scrollbar": { width: "5px" },
                  "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
                },
              },
            }}
            renderValue={(selected) => {
              if (!selected && selected !== 0) {
                return (
                  <span style={{ color: "#9CA3AF" }}>Select Pipeline</span>
                );
              }
              return (
                currentPipelineObj?.name ||
                currentPipelineObj?.label ||
                currentPipelineObj?.category_name ||
                String(selected)
              );
            }}
            sx={{
              height: "36px",
              minWidth: "160px",
              borderRadius: "8px",
              background: "#fff",
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#333",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#E0E0E0",
              },
            }}
          >
            {Array.isArray(pipelinesList) && pipelinesList.length > 0 ? (
              pipelinesList.map((pipe) => {
                const pipeId = pipe.id ?? pipe.value;
                const pipeName =
                  pipe.name ||
                  pipe.label ||
                  pipe.category_name ||
                  String(pipeId);
                return (
                  <MenuItem
                    key={pipeId}
                    value={pipeId}
                    sx={{ fontSize: "13.5px" }}
                  >
                    {pipeName}
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem disabled sx={{ fontSize: "13px", color: "#94A3B8" }}>
                No Pipelines Available
              </MenuItem>
            )}
          </Select>
        </FormControl>
        {/* SEARCH */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            height: "36px",
            px: 1.5,
            borderRadius: "8px",
            border: "1px solid #E0E0E0",
            backgroundColor: "#fff",
            minWidth: "220px",
          }}
        >
          <Search sx={{ fontSize: "14px", color: "#9AA0A6" }} />
          <InputBase
            placeholder="Search by campaign name"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              fontSize: "13px",
              width: "100%",
              "& input::placeholder": { color: "#A2A2A2", opacity: 1 },
            }}
          />
        </Box>

        {/* CREATE CAMPAIGN */}
        {hasPermission("api_create_campaign_admin") && (
          <Button
            onClick={onCreateCampaign}
            startIcon={<Add sx={{ fontSize: "18px !important" }} />}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "#0205C8",
              color: "#fff",
              "&:hover": { backgroundColor: "#0205C8" },
            }}
          >
            Create Campaign
          </Button>
        )}

        {/* LEAD SUMMARY (White Box Button) */}
        {hasPermission("api_lead_summary_report_admin") && (
          <Button
            onClick={onLeadSummary}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              color: "#3F4D27",
              backgroundColor: "#fff",
              border: "1px solid #E0E0E0",
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#f9f9f9", borderColor: "#D0D0D0" },
            }}
          >
            Lead Summary
          </Button>
        )}

        {/* CALL LOGS (White Box Button) */}
        {hasPermission("api_call_log_report_admin") && (
          <Button
            onClick={onCallLogs}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              color: "#3F4D27",
              backgroundColor: "#fff",
              border: "1px solid #E0E0E0",
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#f9f9f9", borderColor: "#D0D0D0" },
            }}
          >
            Call Logs
          </Button>
        )}

        {/* ACTIONS DROPDOWN */}
        {visibleActionItems.length > 0 && (
          <>
            <Button
              onClick={(e) => setAnchorEl(e.currentTarget)}
              endIcon={<KeyboardArrowDown />}
              sx={{
                height: "36px",
                px: 1.5,
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "14px",
                color: "#111",
                backgroundColor: "#fff",
                border: "1px solid #E0E0E0",
                "&:hover": {
                  backgroundColor: "#f9f9f9",
                  borderColor: "#D0D0D0",
                },
              }}
            >
              Actions
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={openActions}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  maxHeight: "300px",
                  overflowY: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  "&::-webkit-scrollbar": { width: "5px" },
                  "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
                },
              }}
            >
              {visibleActionItems.map(({ label }) => (
                <MenuItem
                  key={label}
                  onClick={() => {
                    onAction(label);
                    setAnchorEl(null);
                  }}
                  sx={{ fontSize: "13px" }}
                >
                  {label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );
};

export default PipelineHeader;
