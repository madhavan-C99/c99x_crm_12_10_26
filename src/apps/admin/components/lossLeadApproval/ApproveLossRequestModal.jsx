import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { actionLossLeadApproval } from "@/apps/admin/services/leadService";

const ApproveLossRequestModal = ({
  open,
  onClose,
  lead,
  onSubmitSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) {
      setErrorMsg("");
    }
  }, [open]);

  if (!open || !lead) return null;

  const name = lead.name || lead.full_name || lead.student_name || "Lead";
  const phone = lead.contact || lead.mobile_no || lead.phone || "-";
  const assignedTo = lead.assigned_to || lead.user_name || lead.telecaller || "Unassigned";
  const totalAttempts = lead.effort_summary || lead.total_attempts || (lead.call_logs ? `${lead.call_logs.length} Calls done` : "0 Calls done");
  const lossReason = lead.loss_reason || lead.main_reason || lead.reason || "-";
  const lastConversation = lead.last_conversation_outcome || lead.last_conversation || lead.outcome || "-";
  const lastContacted = lead.last_contacted || lead.last_call_date || "-";
  const leadAge = lead.lead_age || lead.age || "-";

  const handleSubmit = async () => {
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await actionLossLeadApproval({
        lead_id: lead.id || lead.lead_id,
        action: "approve",
      });
      if (onSubmitSuccess) {
        await onSubmitSuccess(res?.data);
      }
      onClose();
    } catch (err) {
      console.error("Error submitting approve loss request:", err);
      setErrorMsg(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to approve loss request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "480px",
          maxWidth: "92vw",
          maxHeight: "90vh",
          borderRadius: "16px",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          p: 0,
        },
      }}
    >
      {/* Olive Green Header */}
      <Box
        sx={{
          backgroundColor: "#52796F",
          px: 3,
          py: 1.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon sx={{ color: "#FFFFFF", fontSize: 20 }} />
          <Typography sx={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700 }}>
            Approval Loss Request
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#FFFFFF" }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Body Content */}
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Lead Name */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px" }}>
            Lead Name:
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
            {name}
          </Typography>
        </Box>

        {/* Mobile No */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px" }}>
            Mobile No:
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
            {phone}
          </Typography>
        </Box>

        {/* Assigned Telecaller */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px" }}>
            Assigned Telecaller:
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
            {assignedTo}
          </Typography>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: "#E2E8F0" }} />

        {/* Total Attempts */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px" }}>
            Total Attempts:
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
            {totalAttempts}
          </Typography>
        </Box>

        {/* Loss Reason */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px" }}>
            Loss Reason:
          </Typography>
          <Box
            sx={{
              backgroundColor: "#FEF3C7",
              color: "#92400E",
              px: 1.5,
              py: 0.3,
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {lossReason}
          </Box>
        </Box>

        {/* Last Conversation */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px", flexShrink: 0 }}>
            Last Conversation:
          </Typography>
          <Typography sx={{ fontSize: "13.5px", color: "#334155" }}>
            {lastConversation}
          </Typography>
        </Box>

        {/* Last Contacted */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px" }}>
            Last Contacted:
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
            {lastContacted}
          </Typography>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: "#E2E8F0" }} />

        {/* Lead Age */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#64748B", width: "160px" }}>
            Lead Age:
          </Typography>
          <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
            {leadAge}
          </Typography>
        </Box>

        {errorMsg && (
          <Typography sx={{ color: "#DC2626", fontSize: "13px", mt: 0.5 }}>
            {errorMsg}
          </Typography>
        )}
      </Box>

      {/* Are you sure banner */}
      <Box
        sx={{
          backgroundColor: "#F1F5F9",
          py: 1.5,
          px: 2,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
          Are you sure you want to mark this lead as lost ?
        </Typography>
      </Box>

      {/* Action Footer Buttons */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            backgroundColor: "#FFFFFF",
            color: "#84CC16",
            border: "1.5px solid #84CC16",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            px: 2.5,
            py: 0.8,
            "&:hover": { backgroundColor: "#F7FBEB" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            backgroundColor: "#84CC16",
            color: "#FFFFFF",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            px: 2.5,
            py: 0.8,
            "&:hover": { backgroundColor: "#65A30D" },
          }}
        >
          {submitting ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Mark Loss"}
        </Button>
      </Box>
    </Dialog>
  );
};

export default ApproveLossRequestModal;
