import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

const FONT = "Inter, sans-serif";

export default function DashboardHeader({
  pipelinesList = [],
  selectedPipeline = null,
  onPipelineChange,
  campaignsList = [],
  selectedCampaign = "all",
  onCampaignChange,
  dateFilter = "Today",
  onDateFilterChange,
  onExport,
  connectionStatus = "connected",
}) {
  const [pipelineAnchorEl, setPipelineAnchorEl] = useState(null);
  const [campaignAnchorEl, setCampaignAnchorEl] = useState(null);
  const [dateAnchorEl, setDateAnchorEl] = useState(null);
  const [reportAnchorEl, setReportAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const currentPipelineObj = (Array.isArray(pipelinesList) ? pipelinesList : []).find(
    (p) => (p.id ?? p.value) === selectedPipeline || p === selectedPipeline
  );
  const selectedPipelineName =
    currentPipelineObj?.name ||
    currentPipelineObj?.label ||
    currentPipelineObj?.category_name ||
    (typeof selectedPipeline === "string" ? selectedPipeline : "") ||
    (pipelinesList?.[0]?.name || pipelinesList?.[0]?.label || "Select Pipeline");

  const currentCampaignObj = (Array.isArray(campaignsList) ? campaignsList : []).find(
    (c) => (c.id ?? c.value) === selectedCampaign || c === selectedCampaign
  );
  const selectedCampaignName =
    selectedCampaign === "all" || !selectedCampaign
      ? "Campaign"
      : currentCampaignObj?.name ||
        currentCampaignObj?.label ||
        currentCampaignObj?.campaign_name ||
        "Campaign";

  const handlePipelineClick = (e) => setPipelineAnchorEl(e.currentTarget);
  const handlePipelineClose = () => setPipelineAnchorEl(null);

  const handleSelectPipeline = (pipeId, pipeObj) => {
    if (onPipelineChange) onPipelineChange(pipeId, pipeObj);
    handlePipelineClose();
  };

  const handleCampaignClick = (e) => setCampaignAnchorEl(e.currentTarget);
  const handleCampaignClose = () => setCampaignAnchorEl(null);

  const handleSelectCampaign = (campId, campObj) => {
    if (onCampaignChange) onCampaignChange(campId, campObj);
    handleCampaignClose();
  };

  const handleDateClick = (e) => setDateAnchorEl(e.currentTarget);
  const handleDateClose = () => setDateAnchorEl(null);
  const handleDateSelect = (val) => {
    if (onDateFilterChange) onDateFilterChange(val);
    handleDateClose();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "flex-start" },
        gap: 2,
        fontFamily: FONT,
      }}
    >
      {/* Title & Subtitle */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            sx={{
              fontSize: {
                xs: "20px",
                sm: "22px",
                md: "24px",
              },
              fontWeight: 600,
              color: "#111",
              fontFamily: FONT,
              lineHeight: 1.2,
            }}
          >
            Dashboard
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              backgroundColor: connectionStatus === "connected" ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${connectionStatus === "connected" ? "#BBF7D0" : "#FECACA"}`,
              borderRadius: "12px",
              px: 1,
              py: 0.2,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: connectionStatus === "connected" ? "#22C55E" : "#EF4444",
                boxShadow: connectionStatus === "connected" ? "0 0 6px #22C55E" : "none",
              }}
            />
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: connectionStatus === "connected" ? "#15803D" : "#B91C1C",
                fontFamily: FONT,
              }}
            >
              {connectionStatus === "connected" ? "Live" : "Offline"}
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: {
              xs: "12px",
              sm: "14px",
              md: "16px",
            },
            fontWeight: 400,
            color: "#6B7280",
            fontFamily: FONT,
            mt: 0.5,
          }}
        >
          Track and manage all pending payment collections from leads
        </Typography>
      </Box>

      {/* Right Controls: Lead By Toggle & Action Filters */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "flex-start", md: "flex-end" },
          gap: 1.5,
          width: { xs: "100%", md: "auto" },
        }}
      >
        {/* Row 1: Lead by Toggle Buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1E293B",
              fontFamily: FONT,
              mr: 0.3,
            }}
          >
            Lead by
          </Typography>

          {/* Dynamic Pipeline Category Dropdown (matching uploaded image) */}
          <Button
            onClick={handlePipelineClick}
            startIcon={<SchoolOutlinedIcon sx={{ fontSize: 18, color: "#3F6212" }} />}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#3F6212" }} />}
            sx={{
              backgroundColor: "#BEF264",
              color: "#3F6212",
              border: "1px solid #84CC16",
              borderRadius: "8px",
              px: 2,
              py: 0.6,
              textTransform: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              fontFamily: FONT,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#A3E635",
              },
            }}
          >
            {selectedPipelineName}
          </Button>

          <Menu
            anchorEl={pipelineAnchorEl}
            open={Boolean(pipelineAnchorEl)}
            onClose={handlePipelineClose}
            PaperProps={{
              sx: {
                borderRadius: "10px",
                mt: 0.5,
                minWidth: "160px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              },
            }}
          >
            {Array.isArray(pipelinesList) && pipelinesList.length > 0 ? (
              pipelinesList.map((pipe) => {
                const pipeId = pipe.id ?? pipe.value;
                const pipeName = pipe.name || pipe.label || pipe.category_name || String(pipeId);
                const isSelected =
                  selectedPipeline === pipeId || selectedPipelineName === pipeName;
                return (
                  <MenuItem
                    key={pipeId}
                    selected={isSelected}
                    onClick={() => handleSelectPipeline(pipeId, pipe)}
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: isSelected ? 600 : 500,
                      "&.Mui-selected": {
                        backgroundColor: "#BEF264 !important",
                        color: "#3F6212",
                      },
                      "&:hover": {
                        backgroundColor: "#F7FEE7",
                      },
                    }}
                  >
                    {pipeName}
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem
                disabled
                sx={{
                  fontSize: "13.5px",
                  color: "#64748B",
                }}
              >
                No Pipelines Available
              </MenuItem>
            )}
          </Menu>

          {/* Campaign Pill Dropdown */}
          <Button
            onClick={handleCampaignClick}
            startIcon={<EventOutlinedIcon sx={{ fontSize: 18, color: "#4D7C0F" }} />}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#4D7C0F" }} />}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#3F6212",
              border: "1.5px solid #84CC16",
              borderRadius: "8px",
              px: 2,
              py: 0.6,
              textTransform: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              fontFamily: FONT,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#F7FEE7",
              },
            }}
          >
            {selectedCampaignName}
          </Button>

          {/* Campaign Dropdown Menu */}
          <Menu
            anchorEl={campaignAnchorEl}
            open={Boolean(campaignAnchorEl)}
            onClose={handleCampaignClose}
            PaperProps={{
              sx: {
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontFamily: FONT,
                minWidth: 160,
                maxHeight: 280,
              },
            }}
          >
            {/* Default All Option */}
            <MenuItem
              selected={selectedCampaign === "all" || !selectedCampaign}
              onClick={() => handleSelectCampaign("all", null)}
              sx={{
                fontSize: "13px",
                fontWeight: selectedCampaign === "all" || !selectedCampaign ? 600 : 400,
                backgroundColor:
                  selectedCampaign === "all" || !selectedCampaign
                    ? "#F7FEE7 !important"
                    : "transparent",
                color:
                  selectedCampaign === "all" || !selectedCampaign
                    ? "#3F6212"
                    : "#1E293B",
                fontFamily: FONT,
                py: 0.8,
              }}
            >
              All
            </MenuItem>

            {/* Pipeline-specific Campaigns */}
            {Array.isArray(campaignsList) && campaignsList.length > 0 ? (
              campaignsList.map((cmp) => {
                const cmpId = cmp.id ?? cmp.value ?? cmp;
                const cmpName =
                  cmp.name ||
                  cmp.label ||
                  cmp.campaign_name ||
                  (typeof cmp === "string" ? cmp : `Campaign ${cmpId}`);
                const isSelected = selectedCampaign === cmpId;

                return (
                  <MenuItem
                    key={cmpId}
                    selected={isSelected}
                    onClick={() => handleSelectCampaign(cmpId, cmp)}
                    sx={{
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 400,
                      backgroundColor: isSelected
                        ? "#F7FEE7 !important"
                        : "transparent",
                      color: isSelected ? "#3F6212" : "#1E293B",
                      fontFamily: FONT,
                      py: 0.8,
                    }}
                  >
                    {cmpName}
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem disabled sx={{ fontSize: "12px", fontFamily: FONT, py: 0.8, color: "#94A3B8" }}>
                No campaigns in this pipeline
              </MenuItem>
            )}
          </Menu>
        </Box>

        {/* Row 2: Secondary Dropdown Filters & Export */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            flexWrap: "wrap",
          }}
        >
          {/* Today Dropdown */}
          <Button
            onClick={handleDateClick}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#64748B" }} />}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#1E293B",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              px: 1.8,
              py: 0.55,
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: FONT,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              "&:hover": { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1" },
            }}
          >
            {dateFilter}
          </Button>
          <Menu
            anchorEl={dateAnchorEl}
            open={Boolean(dateAnchorEl)}
            onClose={handleDateClose}
            PaperProps={{
              sx: {
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontFamily: FONT,
                minWidth: 130,
              },
            }}
          >
            {["Today", "Yesterday", "This Week", "This Month", "Last 30 Days"].map((d) => (
              <MenuItem
                key={d}
                onClick={() => handleDateSelect(d)}
                sx={{ fontSize: "13px", fontFamily: FONT, py: 0.8 }}
              >
                {d}
              </MenuItem>
            ))}
          </Menu>

          {/* Total Report Dropdown */}
          <Button
            onClick={(e) => setReportAnchorEl(e.currentTarget)}
            startIcon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: "#0F172A" }} />}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#64748B" }} />}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#1E293B",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              px: 1.8,
              py: 0.55,
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: FONT,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              "&:hover": { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1" },
            }}
          >
            Total Report
          </Button>
          <Menu
            anchorEl={reportAnchorEl}
            open={Boolean(reportAnchorEl)}
            onClose={() => setReportAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontFamily: FONT,
                minWidth: 150,
              },
            }}
          >
            {["All Pipelines", "Education Pipeline", "Telecaller Report", "Monthly Summary"].map((r) => (
              <MenuItem
                key={r}
                onClick={() => setReportAnchorEl(null)}
                sx={{ fontSize: "13px", fontFamily: FONT, py: 0.8 }}
              >
                {r}
              </MenuItem>
            ))}
          </Menu>

          {/* Export Button */}
          <Button
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 17, color: "#166534" }} />}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 17, color: "#166534" }} />}
            sx={{
              backgroundColor: "#DCFCE7",
              color: "#166534",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
              px: 2,
              py: 0.55,
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: FONT,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              "&:hover": {
                backgroundColor: "#BBF7D0",
                borderColor: "#86EFAC",
              },
            }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontFamily: FONT,
                minWidth: 160,
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setExportAnchorEl(null);
                if (onExport) onExport("excel");
              }}
              sx={{ fontSize: "13px", fontFamily: FONT, py: 0.9 }}
            >
              Export as Excel (.xlsx)
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportAnchorEl(null);
                if (onExport) onExport("pdf");
              }}
              sx={{ fontSize: "13px", fontFamily: FONT, py: 0.9 }}
            >
              Export as PDF (.pdf)
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}
