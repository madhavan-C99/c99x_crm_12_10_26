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
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getMarkAsWonInfo } from "@/apps/admin/services/leadService";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";

const MarkAsWonModal = ({ open, onClose, lead, onSubmitSuccess }) => {
  const [wonInfoData, setWonInfoData] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [stage, setStage] = useState("");
  const [paidThrough, setPaidThrough] = useState("");
  const [paymentModesOptions, setPaymentModesOptions] = useState([]);
  const [amountPaid, setAmountPaid] = useState("");
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [pendingAmount, setPendingAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");
  const [quickFollowup, setQuickFollowup] = useState("");
  const [manualFollowup, setManualFollowup] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const updatePaymentStatusByAmounts = (paid, pending) => {
    const halfFee = totalCourseFee / 2;
    const completedStatus = wonInfoData?.completed_status_name || "Completed";
    const partialStatus = wonInfoData?.partial_status_name || "Partial";
    const pendingStatus = wonInfoData?.pending_status_name || "Pending";

    if (pending <= 0 && paid > 0) {
      setPaymentStatus(completedStatus);
    } else if (paid >= halfFee && pending > 0) {
      setPaymentStatus(partialStatus);
    } else {
      setPaymentStatus(pendingStatus);
    }
  };

  // Fetch live GET info on modal open
  useEffect(() => {
    if (!open || !lead) {
      return;
    }
    setErrorMsg("");

    const initialStage = lead?.current_stage || lead?.stage || lead?.stage_name || "";
    if (initialStage) setStage(initialStage);

    const fetchInfo = async () => {
      try {
        setLoadingInfo(true);
        const targetId = lead.id || lead.lead_id;
        if (targetId) {
          const res = await getMarkAsWonInfo({ lead_id: targetId, id: targetId });
          const resData = res?.data?.data || res?.data?.result || res?.data;
          if (resData && typeof resData === "object") {
            setWonInfoData(resData);
            const leadInfo = resData.lead_info || resData.lead_details || resData.lead || resData;
            
            const extractedStage = leadInfo.current_stage || leadInfo.stage || leadInfo.stage_name || resData.current_stage || resData.stage;
            if (extractedStage) setStage(extractedStage);

            const extractedPaid = leadInfo.amount_paid ?? leadInfo.paid_amount ?? resData.amount_paid;
            if (extractedPaid !== undefined && extractedPaid !== null && extractedPaid !== "") {
              setAmountPaid(String(extractedPaid));
            }

            const extractedPending = leadInfo.pending_amount ?? leadInfo.pending ?? resData.pending_amount;
            if (extractedPending !== undefined && extractedPending !== null && extractedPending !== "") {
              setPendingAmount(String(extractedPending));
            }

            if (extractedPaid !== undefined && extractedPending !== undefined) {
              updatePaymentStatusByAmounts(Number(extractedPaid) || 0, Number(extractedPending) || 0);
            }

            const extractedDueDate = leadInfo.due_date || resData.due_date;
            if (extractedDueDate) setDueDate(extractedDueDate);

            const extractedPaymentStatus = leadInfo.payment_status || resData.payment_status;
            if (extractedPaymentStatus) setPaymentStatus(extractedPaymentStatus);

            const extractedNextFollowup = leadInfo.next_followup_reminder || leadInfo.next_followup || leadInfo.next_followup_date || leadInfo.reminder_date || resData.next_followup_reminder || resData.next_followup;
            if (extractedNextFollowup) setNextFollowup(extractedNextFollowup);

            const extractedSummary = leadInfo.summary || leadInfo.remarks || resData.summary || resData.remarks;
            if (extractedSummary) setSummary(extractedSummary);
          }
        }
      } catch (err) {
        console.warn("getMarkAsWonInfo API error:", err);
      } finally {
        setLoadingInfo(false);
      }
    };

    getSelectOptions("L_PAYMENT_MODES")
      .then((modes) => {
        if (Array.isArray(modes) && modes.length > 0) {
          setPaymentModesOptions(modes);
        }
      })
      .catch((err) => console.warn("L_PAYMENT_MODES fetch error:", err));

    fetchInfo();
  }, [open, lead]);

  const leadInfoData = wonInfoData?.lead_info || wonInfoData?.lead_details || wonInfoData;
  const activeData = leadInfoData ? { ...lead, ...leadInfoData } : lead;

  // Sync clicked lead info
  const name =
    activeData?.full_name ||
    activeData?.name ||
    `${activeData?.first_name || ""} ${activeData?.last_name || ""}`.trim();
  const phone =
    activeData?.mobile_no || activeData?.phone_no || activeData?.phone || activeData?.contact || "";
  const assignedTo =
    activeData?.assigned_to || activeData?.user_name || activeData?.telecaller || "";

  const totalCourseFee = Number(activeData?.total_amount || activeData?.amount || activeData?.course_fee || 0);

  useEffect(() => {
    if (isFullPayment) {
      setAmountPaid(String(totalCourseFee));
      setPendingAmount("0");
      setPaymentStatus(wonInfoData?.completed_status_name || "Completed");
    }
  }, [isFullPayment, totalCourseFee, wonInfoData]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmountPaid(val);
    const numericPaid = Number(val) || 0;
    const rem = totalCourseFee - numericPaid;
    const remStr = rem > 0 ? String(rem) : "0";
    setPendingAmount(remStr);
    updatePaymentStatusByAmounts(numericPaid, rem);
  };

  const handlePendingAmountChange = (e) => {
    const val = e.target.value;
    setPendingAmount(val);
    const numericPending = Number(val) || 0;
    const numericPaid = Number(amountPaid) || 0;
    updatePaymentStatusByAmounts(numericPaid, numericPending);
  };

  const parseNumericAmount = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const formatDateToISO = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }
    return str;
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!stage) {
      setErrorMsg("Lead Stage is required!");
      return;
    }
    if (!paidThrough) {
      setErrorMsg("Paid Through method is required!");
      return;
    }
    if (amountPaid === "" || amountPaid === null || amountPaid === undefined) {
      setErrorMsg("Amount Paid is required!");
      return;
    }
    if (pendingAmount === "" || pendingAmount === null || pendingAmount === undefined) {
      setErrorMsg("Pending Amount is required!");
      return;
    }
    const numPendingAmount = parseNumericAmount(pendingAmount);
    if (numPendingAmount > 0 && !dueDate) {
      setErrorMsg("Due Date is required for pending amount!");
      return;
    }
    const followupVal = nextFollowup ? formatDateToISO(nextFollowup) : (manualFollowup || quickFollowup || null);
    const effectivePaymentStatus = paymentStatus || leadInfoData?.payment_status || wonInfoData?.payment_status || "Completed";

    setSubmitting(true);
    try {
      const numericLeadId = Number(lead?.id || lead?.lead_id) || lead?.id || lead?.lead_id;
      const numAmountPaid = parseNumericAmount(amountPaid);

      const payload = {
        lead_id: numericLeadId,
        id: numericLeadId,
        stage: stage,
        stage_name: stage,
        paid_through: paidThrough,
        amount_paid: numAmountPaid,
        paid_amount: numAmountPaid,
        pending_amount: numPendingAmount,
        due_date: numPendingAmount > 0 ? formatDateToISO(dueDate) : null,
        payment_status: effectivePaymentStatus,
        next_followup: followupVal,
        next_followup_reminder: followupVal,
        reminder_date: followupVal,
        next_followup_reminder_date: followupVal,
        summary: summary || "",
        remarks: summary || "",
      };

      if (onSubmitSuccess) {
        await onSubmitSuccess(payload);
      }
      onClose();
    } catch (err) {
      console.error("Error submitting Mark as Won:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to mark lead as Won. Please check input fields.";
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
        PaperProps={{
          sx: {
            width: "560px",
            maxWidth: "92vw",
            borderRadius: "16px",
            overflow: "hidden",
          },
        }}
      >
        {/* Lime Green Modal Header */}
        <Box
          sx={{
            backgroundColor: "#84CC16",
            px: 3,
            py: 1.8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              Mark as Won
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
            <Typography sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}>
              Lead Name:
            </Typography>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
              {name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <Typography sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}>
              Mobile No:
            </Typography>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
              {phone}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Typography sx={{ fontSize: "14px", color: "#64748B", width: "140px" }}>
              Assigned Telecaller:
            </Typography>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
              {assignedTo}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: "#E2E8F0" }} />
        </Box>

        {/* Form Fields */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Lead Stage Dropdown (Red Pill style) */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155", mb: 0.8 }}>
              Lead Stage<span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              sx={{
                "& .MuiSelect-select": {
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  borderRadius: "8px",
                  py: 1,
                },
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSvgIcon-root": { color: "#FFFFFF" },
              }}
            >
              {(() => {
                const rawStages = wonInfoData?.lead_stages || wonInfoData?.priority_tags || [];
                const stageList = rawStages.map((opt) => (typeof opt === "object" ? opt.name || opt.label || opt.value : opt));
                const stageOptions = Array.from(new Set([...(stage ? [stage] : []), ...stageList].filter(Boolean)));
                return stageOptions.map((val) => (
                  <MenuItem key={val} value={val}>
                    {val}
                  </MenuItem>
                ));
              })()}
            </TextField>
          </Box>

          {/* Paid Through */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155", mb: 0.8 }}>
              Paid Through<span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={paidThrough}
              onChange={(e) => setPaidThrough(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#F1F5F9",
                  borderRadius: "8px",
                  "& fieldset": { border: "none" },
                },
              }}
            >
              {((paymentModesOptions.length > 0 ? paymentModesOptions : wonInfoData?.payment_modes) || []).map((opt, idx) => {
                const val = typeof opt === "object" ? opt.name || opt.label || opt.value || opt.mode_name : opt;
                const key = typeof opt === "object" ? opt.id || opt.value || idx : idx;
                return (
                  <MenuItem key={key} value={val}>
                    {val}
                  </MenuItem>
                );
              })}
            </TextField>
          </Box>

          {/* Amount Paid */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155", mb: 0.8 }}>
              Amount Paid<span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Payment Amount"
              value={amountPaid}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: (
                  <Typography sx={{ fontSize: "13px", color: "#64748B", mr: 1, pr: 1, borderRight: "1px solid #CBD5E1" }}>
                    INR
                  </Typography>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#F1F5F9",
                  borderRadius: "8px",
                  "& fieldset": { border: "none" },
                },
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isFullPayment}
                  onChange={(e) => setIsFullPayment(e.target.checked)}
                  size="small"
                  sx={{ color: "#84CC16", "&.Mui-checked": { color: "#84CC16" } }}
                />
              }
              label={
                <Typography sx={{ fontSize: "12.5px", color: "#64748B" }}>
                  Full Payment {totalCourseFee.toLocaleString()}
                </Typography>
              }
              sx={{ mt: 0.5 }}
            />
          </Box>

          {/* Pending Amount */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155", mb: 0.8 }}>
              Pending Amount<span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Pending Amount"
              value={pendingAmount}
              onChange={handlePendingAmountChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#F1F5F9",
                  borderRadius: "8px",
                  "& fieldset": { border: "none" },
                },
              }}
            />
          </Box>

          {/* Due Date */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155", mb: 0.8 }}>
              Due Date{Number(pendingAmount) > 0 ? <span style={{ color: "#EF4444" }}>*</span> : <span style={{ color: "#94A3B8", fontWeight: 400 }}> (Optional)</span>}
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#F1F5F9",
                  borderRadius: "8px",
                  "& fieldset": { border: "none" },
                },
              }}
            />
          </Box>


          {/* Next Follow Up Reminder (Date picker) */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155", mb: 0.8 }}>
              Next Follow Up Reminder <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={nextFollowup}
              onChange={(e) => setNextFollowup(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#F1F5F9",
                  borderRadius: "8px",
                  "& fieldset": { border: "none" },
                },
              }}
            />
          </Box>

          {/* Summary Multiline */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#334155", mb: 0.8 }}>
              Summary <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Write anything"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
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
            {submitting ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Mark as Won"}
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
          Are you sure you want to cancel marking this lead as Won?
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
              "&:hover": { backgroundColor: "#F7FEE7", borderColor: "#65A30D" },
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

export default MarkAsWonModal;
