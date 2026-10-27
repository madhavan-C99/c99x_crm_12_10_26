import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  IconButton,
  Paper,
  Alert,
  Chip,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { CreateCampaignModal } from "@/apps/admin/components/common/CreateCampaignModal";
import {
  createGoogleConnection,
  getGoogleConnections,
  getCampaigns,
} from "@/apps/admin/services/googleFormsApi";
import { extractErrorMessage } from "@/shared/utils/errorUtils";

/**
 * Google Forms Logo SVG Icon
 */
export function GoogleFormsIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <path
        d="M37 42H11C9.34315 42 8 40.6569 8 39V9C8 7.34315 9.34315 6 11 6H29L40 17V39C40 40.6569 38.6569 42 37 42Z"
        fill="#7248B9"
      />
      <path d="M29 6V17H40L29 6Z" fill="#583196" />
      <rect x="15" y="22" width="18" height="2.5" rx="1.25" fill="#FFFFFF" />
      <rect x="15" y="27" width="18" height="2.5" rx="1.25" fill="#FFFFFF" />
      <rect x="15" y="32" width="12" height="2.5" rx="1.25" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Connect Google Forms Modal Dialog
 * - Step 1: Connection details (Name, Pipeline, Campaign Routing)
 * - Step 2: Setup instructions (Script editor code, masked secret, live 5s polling)
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {Function} props.onSuccess - Called upon connection created/updated
 * @param {Object} [props.viewCodeConnection] - If provided, opens directly to Step 2 to view code
 */
export default function GoogleFormsConnectDialog({
  open,
  onClose,
  onSuccess,
  viewCodeConnection = null,
}) {
  const [step, setStep] = useState(1); // 1 = Connection Details, 2 = Setup Instructions

  // Step 1 Form State
  const [name, setName] = useState("");
  const [routing, setRouting] = useState({
    type: "existing",
    campaignId: "",
    campaignName: "",
    campaignCreated: false, // true => campaign already created via CreateCampaignModal
  });

  // Create Campaign modal (common component)
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  // Dropdowns
  const [campaigns, setCampaigns] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Connection result for Step 2
  const [createdConnection, setCreatedConnection] = useState(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Live status polling state
  const [liveStatus, setLiveStatus] = useState("waiting");
  const pollTimerRef = useRef(null);

  // Load initial dropdowns
  useEffect(() => {
    if (open) {
      setErrorMessage("");
      setLoadingDropdowns(true);
      getCampaigns()
        .then((campList) => {
          setCampaigns(campList || []);
          if (campList && campList.length > 0 && !routing.campaignId) {
            setRouting((prev) => ({ ...prev, campaignId: campList[0].id }));
          }
        })
        .finally(() => setLoadingDropdowns(false));
    }
  }, [open]);

  // Handle "View Code" mode vs "New Connect" mode
  useEffect(() => {
    if (open) {
      if (viewCodeConnection) {
        // Open directly to Step 2
        setCreatedConnection(viewCodeConnection);
        setLiveStatus(viewCodeConnection.status || "waiting");
        setStep(2);
      } else {
        // Fresh creation mode
        setStep(1);
        setName("");
        setCreatedConnection(null);
        setLiveStatus("waiting");
        setRouting((prev) => ({
          ...prev,
          campaignName: "",
          campaignCreated: false,
        }));
      }
    } else {
      // Clear polling when modal closes
      stopPolling();
    }
    return () => stopPolling();
  }, [open, viewCodeConnection]);

  // Polling management for Step 2
  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const startPolling = (targetConnectionId) => {
    stopPolling();
    if (!targetConnectionId) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const conns = await getGoogleConnections();
        const match = (conns || []).find(
          (c) =>
            String(c.id) === String(targetConnectionId) ||
            String(c.uid) === String(targetConnectionId),
        );
        if (match) {
          setLiveStatus(match.status);
          if (match.status === "active") {
            // First lead received! Stop polling
            stopPolling();
          }
        }
      } catch (err) {
        console.warn("Polling Google connection status failed:", err);
      }
    }, 5000); // 5-second interval
  };

  useEffect(() => {
    if (step === 2 && createdConnection && liveStatus === "waiting") {
      startPolling(createdConnection.id || createdConnection.uid);
    } else if (liveStatus === "active") {
      stopPolling();
    }
    return () => stopPolling();
  }, [step, createdConnection, liveStatus]);

  // Copy Code to Clipboard with 2-second feedback
  const handleCopyCode = async () => {
    const code = createdConnection?.scriptCode || "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy Webhook URL
  const handleCopyWebhook = async () => {
    const url = createdConnection?.webhookUrl || "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch {
      // fallback
    }
  };

  // Routing card click ("Create a campaign" => open the common modal)
  const handleRoutingTypeSelect = (type) => {
    setRouting((prev) => ({ ...prev, type }));
    if (errorMessage) setErrorMessage("");

    if (type === "new") {
      setIsCreateCampaignOpen(true);
    }
  };

  // After CreateCampaignModal saves successfully
  const handleCampaignCreated = async (payload) => {
    let newId = payload?.id ?? payload?._id;
    const newName = payload?.name || "";

    try {
      const campList = await getCampaigns();
      if (Array.isArray(campList) && campList.length > 0) {
        setCampaigns(campList);
        if (!newId) {
          const found = campList.find(
            (c) => c.name?.trim().toLowerCase() === newName.trim().toLowerCase()
          );
          if (found) newId = found.id;
        }
      }
    } catch (err) {
      console.warn("Could not refresh campaigns after creation:", err);
    }

    setRouting((prev) => ({
      ...prev,
      type: "new",
      campaignName: newName,
      campaignId: newId ?? "",
      campaignCreated: Boolean(newId),
    }));

    setIsCreateCampaignOpen(false);
    if (errorMessage) setErrorMessage("");
  };

  // Validation
  const validateStep1 = () => {
    if (!name.trim()) {
      return "Please enter a connection name.";
    }
    if (routing.type === "new" && !routing.campaignName?.trim()) {
      return "Please create a campaign for this form.";
    }
    if (routing.type === "existing" && !routing.campaignId) {
      return "Please select an existing campaign.";
    }
    return "";
  };

  // Submit Step 1: Create Connection & Get Code
  const handleCreateAndGetCode = async () => {
    const validationError = validateStep1();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      // Campaign already created via CreateCampaignModal => reuse its id
      // (prevents creating the same campaign twice)
      const useExistingCampaign =
        routing.type === "existing" ||
        (routing.type === "new" &&
          routing.campaignCreated &&
          routing.campaignId);

      const payload = {
        name: name.trim(),
        routing: useExistingCampaign
          ? {
              type: "existing",
              campaignId: Number(routing.campaignId),
            }
          : {
              type: "new",
              campaignName: routing.campaignName.trim(),
            },
      };

      const result = await createGoogleConnection(payload);

      setCreatedConnection(result);
      setLiveStatus(result.status || "waiting");
      setStep(2);
      if (onSuccess) {
        onSuccess(result, false); // notify table
      }
    } catch (err) {
      console.error("Failed to create Google Form connection:", err);
      setErrorMessage(
        extractErrorMessage(
          err,
          "Failed to create connection. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 "Done" button
  const handleDone = () => {
    stopPolling();
    onClose();
    if (onSuccess) {
      onSuccess(createdConnection, true); // final refresh
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // Prevent accidental closing on backdrop click during setup
        if (reason === "backdropClick" && step === 2) return;
        stopPolling();
        onClose();
      }}
      maxWidth={step === 2 ? "md" : "sm"}
      fullWidth
      aria-labelledby="google-forms-dialog-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.15)",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          transition: "all 0.2s ease",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        id="google-forms-dialog-title"
        sx={{
          p: 2.5,
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <GoogleFormsIcon size={28} />
          <Box>
            <Typography
              sx={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#0F172A",
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.2,
              }}
            >
              {step === 1 ? "Connect Google Form" : "Google Apps Script Setup"}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
                mt: 0.3,
              }}
            >
              {step === 1
                ? "Step 1 of 2: Map leads to your CRM campaign"
                : "Step 2 of 2: Copy the Apps Script and install in your form"}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={() => {
            stopPolling();
            onClose();
          }}
          size="small"
          aria-label="Close dialog"
          sx={{
            color: "#94A3B8",
            "&:hover": { color: "#0F172A", backgroundColor: "#F1F5F9" },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3, backgroundColor: "#FFFFFF" }}>
        {/* ========================================================= */}
        {/* STEP 1: CONNECTION DETAILS                                */}
        {/* ========================================================= */}
        {step === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Connection Name */}
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1E293B",
                  fontFamily: "Inter, sans-serif",
                  mb: 0.7,
                }}
              >
                Connection Name <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Website Admissions Form, Event Feedback..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={submitting}
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&:hover fieldset": { borderColor: "#CBD5E1" },
                    "&.Mui-focused fieldset": { borderColor: "#84CC16" },
                  },
                }}
              />
            </Box>

            {/* Campaign Routing (Reusing existing 50/50 Card pattern) */}
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1E293B",
                  fontFamily: "Inter, sans-serif",
                  mb: 1,
                }}
              >
                Where should new leads go?{" "}
                <span style={{ color: "#EF4444" }}>*</span>
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                {[
                  {
                    type: "existing",
                    title: "Use an existing campaign",
                    desc: "Stream leads into a running campaign",
                  },
                  {
                    type: "new",
                    title: "Create a campaign",
                    desc: "Start a fresh campaign for this form",
                  },
                ].map((opt) => {
                  const isSelected = routing.type === opt.type;
                  return (
                    <Paper
                      key={opt.type}
                      elevation={0}
                      onClick={() => handleRoutingTypeSelect(opt.type)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSelected}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRoutingTypeSelect(opt.type);
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
                        }}
                      >
                        {opt.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "#64748B",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {opt.desc}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>

              {/* Existing Campaign Dropdown */}
              {routing.type === "existing" && (
                <Box sx={{ mt: 1.5 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={routing.campaignId || ""}
                      onChange={(e) => {
                        setRouting((prev) => ({
                          ...prev,
                          campaignId: e.target.value,
                        }));
                        if (errorMessage) setErrorMessage("");
                      }}
                      displayEmpty
                      sx={{
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: "Inter, sans-serif",
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#CBD5E1" },
                        "&.Mui-focused fieldset": { borderColor: "#84CC16" },
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Select an existing campaign...</em>
                      </MenuItem>
                      {campaigns.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Create New Campaign: click => opens Create Campaign modal */}
              {routing.type === "new" && (
                <Box sx={{ mt: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Click here to create a campaign"
                    value={routing.campaignName || ""}
                    onClick={() => setIsCreateCampaignOpen(true)}
                    InputProps={{ readOnly: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
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
            </Box>

            {/* Error Alert Box */}
            {errorMessage && (
              <Alert
                severity="error"
                icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 0.5,
                  borderRadius: "8px",
                  backgroundColor: "#FEF2F2",
                  color: "#B91C1C",
                  border: "1px solid #FCA5A5",
                  fontSize: "13px",
                  "& .MuiAlert-message": { fontSize: "13px", fontWeight: 500 },
                }}
              >
                {errorMessage}
              </Alert>
            )}
          </Box>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SETUP INSTRUCTIONS & APPS SCRIPT CODE              */}
        {/* ========================================================= */}
        {step === 2 && createdConnection && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Live Polling Status Header */}
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                border: "1px solid",
                borderColor:
                  liveStatus === "active"
                    ? "#86EFAC"
                    : liveStatus === "error"
                      ? "#FCA5A5"
                      : "#FDE68A",
                backgroundColor:
                  liveStatus === "active"
                    ? "#F0FDF4"
                    : liveStatus === "error"
                      ? "#FEF2F2"
                      : "#FFFBEB",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {liveStatus === "waiting" && (
                  <CircularProgress size={18} sx={{ color: "#D97706" }} />
                )}
                {liveStatus === "active" && (
                  <CheckIcon sx={{ color: "#16A34A", fontSize: 22 }} />
                )}
                {liveStatus === "error" && (
                  <WarningAmberRoundedIcon
                    sx={{ color: "#DC2626", fontSize: 22 }}
                  />
                )}
                <Box>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color:
                        liveStatus === "active"
                          ? "#15803D"
                          : liveStatus === "error"
                            ? "#991B1B"
                            : "#92400E",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {liveStatus === "waiting" &&
                      "⏳ Waiting for your first test submission…"}
                    {liveStatus === "active" &&
                      "✅ First lead received! Connection is working."}
                    {liveStatus === "error" && "⚠️ Connection error detected."}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#64748B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Connected to: <strong>{createdConnection.name}</strong>
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Numbered Setup Instructions */}
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Installation Steps
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {/* Step 1 */}
                <Box
                  sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "#F1F5F9",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    1
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#334155",
                      fontFamily: "Inter, sans-serif",
                      pt: 0.3,
                    }}
                  >
                    Open your Google Form, click the <strong>3 dots (⋮)</strong>{" "}
                    in the top right corner and choose{" "}
                    <strong>"Script editor"</strong>.
                  </Typography>
                </Box>

                {/* Step 2 */}
                <Box
                  sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "#F1F5F9",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    2
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#334155",
                      fontFamily: "Inter, sans-serif",
                      pt: 0.3,
                    }}
                  >
                    Click the <strong>"Copy Code"</strong> button below to copy
                    the ready-made Apps Script.
                  </Typography>
                </Box>

                {/* Step 3 */}
                <Box
                  sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "#F1F5F9",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    3
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#334155",
                      fontFamily: "Inter, sans-serif",
                      pt: 0.3,
                    }}
                  >
                    Delete any existing code in the Google Apps Script editor,{" "}
                    <strong>paste this code</strong>, and click{" "}
                    <strong>Save</strong> (disk icon 💾).
                  </Typography>
                </Box>

                {/* Step 4 (VISUALLY EMPHASIZED HIGHLIGHT BOX) */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                    p: 1.8,
                    borderRadius: "10px",
                    backgroundColor: "#FEFCE8",
                    border: "1.5px solid #FACC15",
                    boxShadow: "0 2px 8px rgba(250, 204, 21, 0.15)",
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: "#EAB308",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    4
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "13.5px",
                        fontWeight: 700,
                        color: "#854D0E",
                        fontFamily: "Inter, sans-serif",
                        lineHeight: 1.4,
                      }}
                    >
                      CRITICAL: Select the function "setup" from the dropdown
                      and click Run!
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12.5px",
                        color: "#713F12",
                        fontFamily: "Inter, sans-serif",
                        mt: 0.5,
                        lineHeight: 1.45,
                      }}
                    >
                      Click <strong>Authorize</strong> and allow access. If
                      Google displays an <em>"unverified app"</em> warning,
                      click <strong>Advanced → Go to project</strong>.{" "}
                      <strong>Run it only ONCE</strong> to activate the
                      submission trigger.
                    </Typography>
                  </Box>
                </Box>

                {/* Step 5 */}
                <Box
                  sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "#F1F5F9",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    5
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#334155",
                      fontFamily: "Inter, sans-serif",
                      pt: 0.3,
                    }}
                  >
                    Submit a test response in your Google Form to verify
                    real-time ingestion.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Read-Only Code Box */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.8,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0F172A",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Google Apps Script (Generated for {createdConnection.name})
                </Typography>

                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCopyCode}
                  startIcon={copiedCode ? <CheckIcon /> : <ContentCopyIcon />}
                  sx={{
                    backgroundColor: copiedCode ? "#16A34A" : "#84CC16",
                    color: "#FFFFFF",
                    textTransform: "none",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    borderRadius: "6px",
                    px: 1.8,
                    height: "30px",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: copiedCode ? "#15803D" : "#65A30D",
                    },
                  }}
                >
                  {copiedCode ? "Copied ✓" : "Copy Code"}
                </Button>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxHeight: "220px",
                  overflowY: "auto",
                  backgroundColor: "#0F172A",
                  borderRadius: "10px",
                  border: "1px solid #1E293B",
                  fontFamily: "Consolas, Menlo, Monaco, monospace",
                  fontSize: "12px",
                  color: "#E2E8F0",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {createdConnection.scriptCode}
              </Paper>
            </Box>

            {/* Masked Secret Key with Show/Hide Toggle */}
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Connection Secret Key
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: "#0F172A",
                      letterSpacing: showSecret ? "normal" : "3px",
                    }}
                  >
                    {showSecret
                      ? createdConnection.secret || "sec_gf_live_default_key"
                      : "••••••••••••••••••••••••••••••••"}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowSecret(!showSecret)}
                  startIcon={
                    showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />
                  }
                  sx={{
                    textTransform: "none",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    color: "#475569",
                    borderColor: "#CBD5E1",
                    borderRadius: "6px",
                    "&:hover": {
                      borderColor: "#94A3B8",
                      backgroundColor: "#FFFFFF",
                    },
                  }}
                >
                  {showSecret ? "Hide" : "Show"}
                </Button>
              </Box>

              {/* Webhook URL preview */}
              {createdConnection.webhookUrl && (
                <Box
                  sx={{
                    pt: 1.2,
                    borderTop: "1px dashed #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748B",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Endpoint Webhook URL
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: "12px",
                        fontFamily: "monospace",
                        color: "#0F172A",
                      }}
                    >
                      {createdConnection.webhookUrl}
                    </Typography>
                  </Box>
                  <Tooltip
                    title={copiedWebhook ? "Copied!" : "Copy Webhook URL"}
                  >
                    <IconButton size="small" onClick={handleCopyWebhook}>
                      {copiedWebhook ? (
                        <CheckIcon sx={{ fontSize: 16, color: "#16A34A" }} />
                      ) : (
                        <ContentCopyIcon
                          sx={{ fontSize: 16, color: "#64748B" }}
                        />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #F1F5F9",
          backgroundColor: "#F8FAFC",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {step === 1 ? (
          <>
            <Button
              onClick={() => {
                stopPolling();
                onClose();
              }}
              disabled={submitting}
              sx={{
                textTransform: "none",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                color: "#64748B",
                "&:hover": { backgroundColor: "#E2E8F0" },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleCreateAndGetCode}
              disabled={
                submitting ||
                !name.trim() ||
                (routing.type === "existing" && !routing.campaignId) ||
                (routing.type === "new" && !routing.campaignName?.trim())
              }
              endIcon={
                submitting ? (
                  <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
                ) : (
                  <ArrowForwardIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                backgroundColor: "#84CC16",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                px: 2.5,
                borderRadius: "6px",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#65A30D",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#CBD5E1",
                  color: "#FFFFFF",
                },
              }}
            >
              {submitting ? "Creating..." : "Create & Get Code"}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                // If viewing code, just close; if in wizard, allows back to step 1
                if (viewCodeConnection) {
                  stopPolling();
                  onClose();
                } else {
                  setStep(1);
                }
              }}
              sx={{
                textTransform: "none",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                color: "#64748B",
              }}
            >
              {viewCodeConnection ? "Close" : "Back"}
            </Button>

            <Button
              variant="contained"
              onClick={handleDone}
              sx={{
                backgroundColor: "#84CC16",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                px: 3,
                borderRadius: "6px",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#65A30D",
                  boxShadow: "none",
                },
              }}
            >
              Done
            </Button>
          </>
        )}
      </DialogActions>

      {/* Existing common Create Campaign modal */}
      <CreateCampaignModal
        open={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        onCreateSuccess={handleCampaignCreated}
      />
    </Dialog>
  );
}
