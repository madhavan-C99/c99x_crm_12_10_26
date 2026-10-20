import React, { useState } from "react";
import { Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useAuth } from "@/shared/context/AuthContext";

const LeadHeader = ({
  onUpload,
  onAddNew,
  onExport,
  pipelinesList = [],
  selectedPipeline,
  onPipelineCategoryChange,
}) => {
  const { hasPermission } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectCategory = (pipeId, pipeObj) => {
    if (onPipelineCategoryChange) {
      onPipelineCategoryChange(pipeId, pipeObj);
    }
    handleCloseMenu();
  };

  const currentPipelineObj = (Array.isArray(pipelinesList) ? pipelinesList : []).find(
    (p) => (p.id ?? p.value) === selectedPipeline || p === selectedPipeline
  );
  const selectedDisplayName =
    currentPipelineObj?.name ||
    currentPipelineObj?.label ||
    currentPipelineObj?.category_name ||
    (typeof selectedPipeline === "string" ? selectedPipeline : "") ||
    "Select Pipeline";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        mb: 2,
      }}
    >
      {/* Title & Subtitle */}
      <Box>
        <Typography
          sx={{
            fontSize: {
              xs: "18px",
              sm: "20px",
              md: "22px",
            },

            fontWeight: 600,
            color: "#111827",
          }}
        >
          Leads
        </Typography>
        <Typography
          sx={{
            fontSize: {
              xs: "12px",
              sm: "14px",
              md: "16px",
            },
            color: "#6B7280",
            mt: 0.5,
            fontWeight: 400,
          }}
        >
          View and manage all your leads
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2.5,
          flexWrap: "wrap",
        }}
      >
        {/* Pipeline Dropdown (Dynamic L_CATEGORIES) */}
        <Button
          variant="outlined"
          endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
          onClick={handleOpenMenu}
          sx={{
            borderColor: "#D1D5DB",
            color: selectedDisplayName === "Select Pipeline" ? "#9CA3AF" : "#374151",
            textTransform: "none",
            borderRadius: "8px",
            height: "36px",
            px: 2,
            fontSize: "14px",
            fontWeight: 500,
            backgroundColor: "#FFFFFF",
          }}
        >
          {selectedDisplayName}
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            sx: {
              borderRadius: "8px",
              mt: 0.5,
              minWidth: "160px",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
            },
          }}
        >
          {Array.isArray(pipelinesList) && pipelinesList.length > 0 ? (
            pipelinesList.map((pipe) => {
              const pipeId = pipe.id ?? pipe.value;
              const pipeName = pipe.name || pipe.label || String(pipeId);
              const isSelected = selectedPipeline === pipeId || selectedPipeline === pipe;
              return (
                <MenuItem
                  key={pipeId}
                  selected={isSelected}
                  onClick={() => handleSelectCategory(pipeId, pipe)}
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    "&.Mui-selected": {
                      backgroundColor: "#84CC16 !important",
                      color: "#FFFFFF",
                    },
                  }}
                >
                  {pipeName}
                </MenuItem>
              );
            })
          ) : (
            <MenuItem disabled sx={{ fontSize: "14px" }}>
              No Pipelines Available
            </MenuItem>
          )}
        </Menu>

        {hasPermission("api_upload_lead_excel_admin") && (
          <Button
            variant="outlined"
            startIcon={<FileUploadOutlinedIcon sx={{ fontSize: 19 }} />}
            onClick={onUpload}
            sx={{
              borderColor: "#D1D5DB",
              backgroundColor: "#FFFFFF",
              color: "#374151",
              textTransform: "none",
              borderRadius: "8px",
              height: "36px",
              px: 2,
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Upload Leads
          </Button>
        )}

        {hasPermission("api_add_new_lead_admin") && (
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 20 }} />}
            onClick={onAddNew}
            sx={{
              backgroundColor: "#0000FF",
              color: "#FFF",
              textTransform: "none",
              borderRadius: "8px",
              height: "36px",
              px: 2.5,
              fontSize: "14px",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#0000D0" },
            }}
          >
            Add New Lead
          </Button>
        )}

        {hasPermission("api_export_all_leads_admin") && (
          <Button
            variant="contained"
            startIcon={<CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={onExport}
            sx={{
              backgroundColor: "#E9F6D4",
              color: "#1E3A8A",
              border: "1px solid #C4E78B",
              textTransform: "none",
              borderRadius: "8px",
              height: "36px",
              px: 2,
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Export
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LeadHeader;

