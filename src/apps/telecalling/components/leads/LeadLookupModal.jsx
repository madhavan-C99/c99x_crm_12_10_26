import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const LeadLookupModal = ({ open, onClose, lead }) => {
  if (!lead) return null;

  const isAssignedToMe = lead.is_assigned_to_me;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
        },
      }}
    >
      {/* Header with Dark Modern Header */}
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
          color: "#fff",
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: isAssignedToMe ? "rgba(144, 217, 22, 0.2)" : "rgba(59, 130, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isAssignedToMe ? "1px solid #90D916" : "1px solid #3B82F6",
            }}
          >
            <SearchOutlinedIcon sx={{ color: isAssignedToMe ? "#90D916" : "#60A5FA" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "17px", fontWeight: 700, color: "#fff" }}>
              Lead Found in System
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "#9CA3AF" }}>
              Registered Lead Pipeline & Assignment Details
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#9CA3AF",
            "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#F9FAFB" }}>
        {/* Status Banner */}
        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            borderRadius: "10px",
            bgcolor: isAssignedToMe ? "#ECFDF5" : "#EFF6FF",
            border: isAssignedToMe ? "1px solid #A7F3D0" : "1px solid #BFDBFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: isAssignedToMe ? "#10B981" : "#3B82F6",
              }}
            />
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: isAssignedToMe ? "#065F46" : "#1E40AF",
              }}
            >
              {isAssignedToMe
                ? "This lead is currently in your pipeline"
                : `Assigned to ${lead.assigned_to}`}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={lead.stage_name || "New Lead"}
            sx={{
              fontWeight: 600,
              fontSize: "11px",
              bgcolor: isAssignedToMe ? "#D1FAE5" : "#DBEAFE",
              color: isAssignedToMe ? "#065F46" : "#1E40AF",
            }}
          />
        </Box>

        {/* 2-Column Details Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {/* Card 1: Contact Details */}
          <Box
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: "#fff",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 1.5,
              }}
            >
              Lead Profile
            </Typography>

            {/* Full Name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
              <PersonOutlineOutlinedIcon sx={{ fontSize: "18px", color: "#6B7280" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Student Name</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {lead.full_name}
                </Typography>
              </Box>
            </Box>

            {/* Mobile No */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
              <PhoneOutlinedIcon sx={{ fontSize: "18px", color: "#6B7280" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Primary Mobile</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {lead.mobile_no}
                </Typography>
              </Box>
            </Box>

            {/* Alternate Mobile */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
              <PhoneOutlinedIcon sx={{ fontSize: "18px", color: "#9CA3AF" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Alternate Mobile</Typography>
                <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                  {lead.alternative_mobile || "Not Provided"}
                </Typography>
              </Box>
            </Box>

            {/* Enquiry Date */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: "18px", color: "#9CA3AF" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Enquiry Date</Typography>
                <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                  {lead.enquiry_date}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Card 2: Assignment & Pipeline */}
          <Box
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: "#fff",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 1.5,
              }}
            >
              Assignment & Pipeline
            </Typography>

            {/* Pipeline */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
              <AltRouteOutlinedIcon sx={{ fontSize: "18px", color: "#2563EB" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Pipeline</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1D4ED8" }}>
                  {lead.pipeline_name}
                </Typography>
              </Box>
            </Box>

            {/* Current Stage */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
              <FlagOutlinedIcon sx={{ fontSize: "18px", color: "#059669" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Current Stage</Typography>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#065F46" }}>
                  {lead.stage_name}
                </Typography>
              </Box>
            </Box>

            {/* Assigned Telecaller */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
              <AccountCircleOutlinedIcon sx={{ fontSize: "18px", color: "#D97706" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Assigned Telecaller</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#B45309" }}>
                  {lead.assigned_to}
                </Typography>
              </Box>
            </Box>

            {/* Campaign */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <CampaignOutlinedIcon sx={{ fontSize: "18px", color: "#7C3AED" }} />
              <Box>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>Campaign</Typography>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#6D28D9" }}>
                  {lead.campaign_name}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, bgcolor: "#fff", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: "12px", color: "#6B7280", pl: 1 }}>
          Source: <strong>{lead.lead_source}</strong>
        </Typography>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: "#0205C8",
            color: "#fff",
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            fontWeight: 600,
            fontSize: "13px",
            boxShadow: "none",
            "&:hover": { bgcolor: "#0205c8dd", boxShadow: "none" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadLookupModal;
