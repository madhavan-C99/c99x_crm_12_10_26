import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CancelIcon from "@mui/icons-material/Cancel";
import { getMarkAsLostInfo } from "@/apps/admin/services/leadService";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";

const MarkAsLossModal = ({ open, onClose, lead, onSubmitSuccess }) => {
  const [lossInfoData, setLossInfoData] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [stage, setStage] = useState("");
  const [reason, setReason] = useState("");
  const [lossReasonsOptions, setLossReasonsOptions] = useState([]);
  const [detailedReason, setDetailedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch live GET info on modal open (/adm/get_mark_as_lost_info_admin)
  useEffect(() => {
    if (!open || !lead) {
      setLossInfoData(null);
      setErrorMsg("");
      return;
    }
    setErrorMsg("");
    if (lead?.stage || lead?.stage_name) {
      setStage(lead.stage || lead.stage_name);
    }

    const fetchInfo = async () => {
      try {
        setLoadingInfo(true);
        const targetId = lead.id || lead.lead_id;
        if (targetId) {
          const res = await getMarkAsLostInfo({ lead_id: targetId, id: targetId });
          const resData = res?.data?.data || res?.data?.result || res?.data;
          if (resData && typeof resData === "object") {
            setLossInfoData(resData);
            if (resData.stage) setStage(resData.stage);
            if (resData.reason || resData.main_reason) {
              setReason(resData.reason || resData.main_reason);
            }
            if (resData.detailed_reason || resData.remarks) {
              setDetailedReason(resData.detailed_reason || resData.remarks);
            }
          }
        }
      } catch (err) {
        console.warn("MarkAsLossModal GET info API error:", err);
      } finally {
        setLoadingInfo(false);
      }
    };

    getSelectOptions("L_LOSS_REASONS")
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setLossReasonsOptions(res);
        }
      })
      .catch(() => {
        getSelectOptions("L_MAIN_REASONS")
          .then((res) => {
            if (Array.isArray(res) && res.length > 0) {
              setLossReasonsOptions(res);
            }
          })
          .catch(() => {});
      });

    fetchInfo();
  }, [open, lead]);

  const activeData = lossInfoData ? { ...lead, ...lossInfoData } : lead;

  // Sync clicked lead info
  const name =
    activeData?.full_name ||
    activeData?.name ||
    `${activeData?.first_name || ""} ${activeData?.last_name || ""}`.trim() ||
    "-";
  const phone =
    activeData?.mobile_no || activeData?.phone_no || activeData?.phone || activeData?.contact || "-";
  const assignedTo =
    activeData?.assigned_to || activeData?.user_name || activeData?.telecaller || "-";
  const totalAttempts =
    activeData?.total_attempts || activeData?.attempts || "-";
  const lastConversation =
    activeData?.last_conversation_outcome ||
    activeData?.outcome ||
    activeData?.remarks ||
    "-";
  const lastContacted =
    activeData?.last_contacted || activeData?.last_call_date || "-";
  const leadAge = activeData?.lead_age || activeData?.age || "-";

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const numericLeadId = Number(lead?.id || lead?.lead_id) || lead?.id || lead?.lead_id;
      const selectedReason = reason || "";
      const payload = {
        lead_id: numericLeadId,
        id: numericLeadId,
        stage: stage || "Lost",
        stage_name: stage || "Lost",
        reason: selectedReason,
        main_reason: selectedReason,
        sub_reason: "",
        loss_reason: selectedReason,
        detailed_reason: detailedReason || selectedReason || "",
        remarks: detailedReason || selectedReason || "",
      };

      if (onSubmitSuccess) {
        await onSubmitSuccess(payload);
      }
      onClose();
    } catch (err) {
      console.error("Error submitting Mark as Loss:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to mark lead as Lost.";
      setErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const handleRequestCancel = () => {
    setConfirmCancelOpen(true);
  };

  const handleConfirmCancel = () => {
    setConfirmCancelOpen(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open && !confirmCancelOpen}
        onClose={handleRequestCancel}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              width: "430px",
              maxWidth: "92vw",
              borderRadius: "16px",
              overflow: "hidden",
              p: 0,
            },
          },
        }}
      >
        {/* Crimson Red Header Bar */}
        <Box
          sx={{
            backgroundColor: "#DC2626",
            px: 3,
            py: 1.8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CancelIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              Mark as Loss
            </Typography>
          </Box>
          <IconButton
            onClick={handleRequestCancel}
            sx={{ color: "#FFFFFF", p: 0.5, "&:hover": { opacity: 0.8 } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: "#FFFFFF" }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
              {errorMsg}
            </Alert>
          )}
          {/* Top Summary Block */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Typography
                sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}
              >
                Lead Name:
              </Typography>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}
              >
                {name}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Typography
                sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}
              >
                Mobile No:
              </Typography>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}
              >
                {phone}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 1.8 }}>
              <Typography
                sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}
              >
                Assigned Telecaller:
              </Typography>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}
              >
                {assignedTo}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "#E2E8F0", mb: 1.8 }} />

            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Typography
                sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}
              >
                Total Attempts:
              </Typography>
              <Typography sx={{ fontSize: "13.5px", color: "#334155" }}>
                {totalAttempts}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Typography
                sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}
              >
                Last Conversation:
              </Typography>
              <Typography sx={{ fontSize: "13.5px", color: "#334155" }}>
                {lastConversation}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 1.8 }}>
              <Typography
                sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}
              >
                Last Contacted:
              </Typography>
              <Typography sx={{ fontSize: "13.5px", color: "#334155" }}>
                {lastContacted}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "#E2E8F0", mb: 1.8 }} />

            <Box sx={{ display: "flex", gap: 1, mb: 1.8 }}>
              <Typography
                sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}
              >
                Lead Age:
              </Typography>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}
              >
                {leadAge}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "#E2E8F0" }} />
          </Box>

          {/* Form Fields */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Lead Stage Dropdown (Sky Blue Pill style) */}
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.8,
                }}
              >
                Lead Stage
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                sx={{
                  "& .MuiSelect-select": {
                    backgroundColor: "#60A5FA",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    borderRadius: "8px",
                    py: 1,
                  },
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSvgIcon-root": { color: "#FFFFFF" },
                }}
              >
                {(lossInfoData?.lead_stages || lossInfoData?.stages || [])
                  .length === 0 ? (
                  <MenuItem value={stage || "Cold"}>{stage || "Cold"}</MenuItem>
                ) : (
                  (lossInfoData?.lead_stages || lossInfoData?.stages || []).map(
                    (opt) => {
                      const val =
                        typeof opt === "object"
                          ? opt.name || opt.label || opt.stage
                          : opt;
                      return (
                        <MenuItem key={val} value={val}>
                          {val}
                        </MenuItem>
                      );
                    },
                  )
                )}
              </TextField>
            </Box>

            {/* Reason Dropdown */}
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.8,
                }}
              >
                Reason
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                displayEmpty
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#F1F5F9",
                    borderRadius: "8px",
                    "& fieldset": { border: "none" },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <Typography sx={{ color: "#94A3B8", fontSize: "13px" }}>
                    Select reason
                  </Typography>
                </MenuItem>
                {(() => {
                  const opts =
                    lossInfoData?.reasons ||
                    lossInfoData?.main_reasons ||
                    lossInfoData?.loss_reasons ||
                    (lossReasonsOptions.length > 0 ? lossReasonsOptions : []);
                  if (!Array.isArray(opts) || opts.length === 0) {
                    return reason ? (
                      <MenuItem value={reason}>{reason}</MenuItem>
                    ) : (
                      <MenuItem disabled sx={{ fontSize: "13px", color: "#94A3B8" }}>
                        No reasons loaded from server
                      </MenuItem>
                    );
                  }
                  return opts.map((opt, idx) => {
                    const val =
                      typeof opt === "object"
                        ? opt.name || opt.label || opt.reason || opt.value
                        : opt;
                    return (
                      <MenuItem key={val || idx} value={val}>
                        {val}
                      </MenuItem>
                    );
                  });
                })()}
              </TextField>
            </Box>

            {/* Detailed Reason for loss Multiline */}
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.8,
                }}
              >
                Detailed Reason for loss
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Write anything"
                value={detailedReason}
                onChange={(e) => setDetailedReason(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#F1F5F9",
                    borderRadius: "8px",
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: "8px" }}>
              {errorMsg}
            </Alert>
          )}

          {/* Footer Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 3,
              pt: 2,
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <Button
              onClick={handleRequestCancel}
              sx={{
                border: "1px solid #84CC16",
                color: "#84CC16",
                fontWeight: 600,
                fontSize: "13.5px",
                borderRadius: "8px",
                px: 3,
                py: 0.8,
                textTransform: "none",
                "&:hover": { backgroundColor: "#F7FEE7" },
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
                fontSize: "13.5px",
                borderRadius: "8px",
                px: 3,
                py: 0.8,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(132, 204, 22, 0.3)",
                "&:hover": { backgroundColor: "#65A30D" },
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: "#FFFFFF" }} />
              ) : (
                "Mark Loss"
              )}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Exact Figma "Are you sure?" Cancel Confirmation Popup */}
      <Dialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "480px",
            maxWidth: "92vw",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.16)",
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        <DialogContent sx={{ p: "32px 36px 28px 36px !important" }}>
          <Typography
            sx={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#84CC16",
              mb: 2,
              letterSpacing: "-0.2px",
            }}
          >
            Are you sure?
          </Typography>

          <Typography
            sx={{
              fontSize: "14.5px",
              color: "#475569",
              fontWeight: 400,
              lineHeight: 1.5,
              mb: 0.8,
            }}
          >
            Are you sure you want to cancel marking this lead as Loss?
          </Typography>

          <Typography
            sx={{
              fontSize: "14.5px",
              color: "#475569",
              fontWeight: 400,
              lineHeight: 1.5,
              mb: 3.5,
            }}
          >
            Click "No" to go back, or "Yes" to cancel the action.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => setConfirmCancelOpen(false)}
              sx={{
                border: "1.5px solid #84CC16",
                color: "#84CC16",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "8px",
                minWidth: "86px",
                height: "38px",
                px: 3,
                textTransform: "none",
                backgroundColor: "#FFFFFF",
                "&:hover": {
                  backgroundColor: "#F7FEE7",
                  borderColor: "#65A30D",
                },
              }}
            >
              No
            </Button>

            <Button
              onClick={handleConfirmCancel}
              sx={{
                backgroundColor: "#84CC16",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "8px",
                minWidth: "86px",
                height: "38px",
                px: 3,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(132, 204, 22, 0.35)",
                "&:hover": { backgroundColor: "#65A30D" },
              }}
            >
              Yes
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarkAsLossModal;
