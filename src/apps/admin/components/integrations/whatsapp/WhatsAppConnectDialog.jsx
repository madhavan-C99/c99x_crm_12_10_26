import React, { useState, useEffect } from "react";
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
  CircularProgress,
  InputAdornment,
  Link,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PhoneIcon from "@mui/icons-material/Phone";
import CampaignIcon from "@mui/icons-material/Campaign";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { CreateCampaignModal } from "@/apps/admin/components/common/CreateCampaignModal";
import { invalidateSelectOptions } from "@/apps/admin/services/dropdownService";
import {
  createWhatsAppConnection,
  getCampaigns,
  WHATSAPP_EXTENSION_STORE_URL,
} from "@/apps/admin/services/whatsappApi";
import { extractErrorMessage } from "@/apps/admin/utils/errorUtils";

/**
 * WhatsApp Official Green SVG Icon
 */
export function WhatsAppIcon({ size = 24 }) {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 4C12.9543 4 4 12.9543 4 24C4 27.5355 4.91901 30.8559 6.52765 33.7383L4.17157 42.2797C3.96213 43.0392 4.67086 43.7291 5.42646 43.5049L13.8824 40.9972C16.8202 42.8776 20.2872 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4ZM16.4853 14.1213C15.8995 13.5355 14.9503 13.5355 14.3645 14.1213C13.7787 14.7071 13.0678 15.6888 13.0678 17.1525C13.0678 19.3364 14.3512 21.9682 17.5254 25.1424C20.6996 28.3166 23.3314 29.6 25.5153 29.6C26.979 29.6 27.9607 28.8891 28.5464 28.3033C29.1322 27.7176 29.1322 26.7683 28.5464 26.1826L26.7071 24.3431C26.1213 23.7574 25.1721 23.7574 24.5863 24.3431L23.7574 25.1721C23.2367 25.0416 21.6706 24.2325 20.3536 22.9155C19.0365 21.5985 18.2274 20.0324 18.0969 19.5117L18.9259 18.6828C19.5116 18.097 19.5116 17.1478 18.9259 16.562L16.4853 14.1213Z"
        fill="#25D366"
      />
    </svg>
  );
}

/**
 * Validates and normalizes phone numbers
 * - Digits only, handles country code, defaults to 91 (India) if 10 digits without country code
 * - Returns { isValid, normalized, display, error }
 */
export function normalizeWhatsAppNumber(rawInput, defaultCountryCode = "91") {
  if (!rawInput || !rawInput.trim()) {
    return {
      isValid: false,
      normalized: "",
      display: "",
      error: "Please enter your WhatsApp mobile number.",
    };
  }

  const trimmed = rawInput.trim();

  // Ensure characters are digits, plus, space, dash, or parentheses
  if (!/^\+?[0-9\s\-()]+$/.test(trimmed)) {
    return {
      isValid: false,
      normalized: "",
      display: "",
      error: "Mobile number can only contain digits.",
    };
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      isValid: false,
      normalized: "",
      display: "",
      error: "Please enter a valid mobile number (7 to 15 digits).",
    };
  }

  let normalized = digitsOnly;

  if (trimmed.startsWith("+")) {
    // Explicit country code provided
    normalized = digitsOnly;
  } else if (digitsOnly.length === 10) {
    // 10 digits without '+' -> default to country code +91
    normalized = `${defaultCountryCode}${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    // 11 digits with leading 0 (e.g. 09876543210 in India) -> replace 0 with 91
    normalized = `${defaultCountryCode}${digitsOnly.slice(1)}`;
  }

  if (normalized.length < 8 || normalized.length > 15) {
    return {
      isValid: false,
      normalized: "",
      display: "",
      error: "Invalid mobile number length.",
    };
  }

  // Format nicely for preview: +91 XXXXX XXXXX or +[country] [number]
  let display = `+${normalized}`;
  if (normalized.startsWith("91") && normalized.length === 12) {
    display = `+91 ${normalized.slice(2, 7)} ${normalized.slice(7)}`;
  }

  return {
    isValid: true,
    normalized,
    display,
    error: "",
  };
}

/**
 * WhatsApp Connect Modal Dialog (3 Steps)
 * - Step 1: Select or create Campaign
 * - Step 2: WhatsApp Mobile Number
 * - Step 3: Link Generated & Chrome Extension instructions
 */
export default function WhatsAppConnectDialog({
  open,
  onClose,
  onSuccess,
}) {
  const [step, setStep] = useState(1);

  // Create Campaign modal state
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  // Step 1: Campaign routing state
  const [routing, setRouting] = useState({
    type: "existing", // "existing" | "new"
    campaignId: "",
    campaignName: "",
    campaignCreated: false,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Step 2: Mobile number & client name state
  const [mobileInput, setMobileInput] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");

  // Step 3: Result state
  const [connectionResult, setConnectionResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // General UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Helper to load campaigns strictly from getSelectOptions API
  const loadCampaignsFromApi = async () => {
    setLoadingCampaigns(true);
    try {
      const campList = await getCampaigns();
      setCampaigns(campList || []);
      return campList || [];
    } catch (err) {
      console.warn("Failed to load campaigns:", err);
      return [];
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Load campaigns on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setErrorMessage("");
      setConnectionResult(null);
      setCopiedLink(false);
      setClientNameInput("");
      setRouting({
        type: "existing",
        campaignId: "",
        campaignName: "",
        campaignCreated: false,
      });

      loadCampaignsFromApi().then((campList) => {
        if (campList && campList.length > 0) {
          setRouting((prev) => ({
            ...prev,
            campaignId: campList[0].id,
          }));
        }
      });
    }
  }, [open]);

  // Card click handler: When "Create a campaign" is selected, open modal directly
  const handleRoutingTypeSelect = (type) => {
    setRouting((prev) => ({ ...prev, type }));
    if (errorMessage) setErrorMessage("");

    if (type === "new") {
      setIsCreateCampaignOpen(true);
    }
  };

  // When a campaign is created via the common CreateCampaignModal
  const handleCampaignCreated = async (payload) => {
    const newName = payload?.name || "";
    let newId = payload?.id ?? payload?._id;

    // Invalidate dropdown cache and refresh campaigns list from getSelectOptions API
    invalidateSelectOptions("L_CAMPAIGN_NAMES");
    try {
      const freshList = await loadCampaignsFromApi();
      if (!newId && Array.isArray(freshList)) {
        const found = freshList.find(
          (c) => c.name?.trim().toLowerCase() === newName.trim().toLowerCase()
        );
        if (found) newId = found.id;
      }
    } catch (err) {
      console.warn("Error reloading campaigns after creation:", err);
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

  // Handle Step 1 -> Step 2
  const handleNextFromStep1 = () => {
    if (routing.type === "existing" && !routing.campaignId) {
      setErrorMessage("Please select an existing campaign to continue.");
      return;
    }
    if (routing.type === "new" && !routing.campaignName.trim()) {
      setErrorMessage("Please create a campaign to continue.");
      return;
    }

    setErrorMessage("");
    setStep(2);
  };

  // Handle Step 2 -> Step 3 (Submit)
  const handleSubmitStep2 = async () => {
    const valResult = normalizeWhatsAppNumber(mobileInput);
    if (!valResult.isValid) {
      setErrorMessage(valResult.error);
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      let finalCampaignId = routing.campaignId;
      let finalCampaignName = routing.campaignName;

      if (routing.type === "existing") {
        const found = campaigns.find(
          (c) => String(c.id) === String(routing.campaignId)
        );
        if (found) {
          finalCampaignName = found.name;
        }
      }

      // Call API
      const result = await createWhatsAppConnection({
        campaignId: finalCampaignId,
        mobile: valResult.normalized,
        campaignName: finalCampaignName,
        clientName: clientNameInput.trim() || undefined,
      });

      setConnectionResult({
        ...result,
        url: result?.connectionUrl || result?.url,
        campaignName: result?.campaignName || finalCampaignName,
        displayMobile: valResult.display,
      });

      setStep(3);
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(
          err,
          "Failed to generate connection link. Please check your network and try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Copy generated link
  const handleCopyLink = async () => {
    const linkUrl = (
      connectionResult?.connectionUrl ||
      connectionResult?.url ||
      ""
    ).trim();
    if (!linkUrl) return;

    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkUrl);
        success = true;
      }
    } catch (err) {
      console.warn("navigator.clipboard failed, using fallback:", err);
    }

    if (!success) {
      try {
        const el = document.createElement("textarea");
        el.value = linkUrl;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        success = true;
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }

    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Step 3: Complete / Done
  const handleDone = () => {
    if (onSuccess && connectionResult) {
      onSuccess(connectionResult);
    }
    onClose();
  };

  // Validation helpers for Next button disabled state
  const isStep1Disabled =
    (routing.type === "existing" && !routing.campaignId) ||
    (routing.type === "new" && !routing.campaignName.trim()) ||
    loadingCampaigns;

  const currentMobileVal = normalizeWhatsAppNumber(mobileInput);

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (submitting) return;
        if (reason === "backdropClick" && step === 3) return;
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      aria-labelledby="whatsapp-dialog-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.15)",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        id="whatsapp-dialog-title"
        sx={{
          p: 2.5,
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              backgroundColor: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #BBF7D0",
            }}
          >
            <WhatsAppIcon size={24} />
          </Box>
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
              {step === 1 && "Connect WhatsApp - Select Campaign"}
              {step === 2 && "Connect WhatsApp - Mobile Number"}
              {step === 3 && "WhatsApp Connection Ready"}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#64748B",
                fontFamily: "Inter, sans-serif",
                mt: 0.3,
              }}
            >
              {step === 1 && "Step 1 of 3: Choose where incoming WhatsApp leads will be stored"}
              {step === 2 && "Step 2 of 3: Enter the phone number logged into WhatsApp Web"}
              {step === 3 && "Step 3 of 3: Connect your Chrome Extension to start capturing leads"}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          disabled={submitting}
          aria-label="Close dialog"
          sx={{
            color: "#94A3B8",
            "&:hover": { color: "#0F172A", backgroundColor: "#F1F5F9" },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 3, backgroundColor: "#FFFFFF" }}>
        {/* Error Alert Box */}
        {errorMessage && (
          <Alert
            severity="error"
            onClose={() => setErrorMessage("")}
            sx={{
              mb: 2.5,
              borderRadius: "8px",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {errorMessage}
          </Alert>
        )}

        {/* ========================================================= */}
        {/* STEP 1: SELECT CAMPAIGN                                   */}
        {/* ========================================================= */}
        {step === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#1E293B",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Where should new WhatsApp leads go? <span style={{ color: "#EF4444" }}>*</span>
            </Typography>

            {/* Option Cards: Existing vs New */}
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
                  desc: "Add leads to a campaign you already run",
                },
                {
                  type: "new",
                  title: "Create a campaign",
                  desc: "Start a fresh campaign for WhatsApp leads",
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
                        ? "1.5px solid #25D366"
                        : "1px solid #E2E8F0",
                      backgroundColor: isSelected
                        ? "rgba(37, 211, 102, 0.05)"
                        : "#FFFFFF",
                      transition: "all 0.15s ease",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      "&:hover": {
                        borderColor: isSelected ? "#25D366" : "#CBD5E1",
                        backgroundColor: isSelected
                          ? "rgba(37, 211, 102, 0.08)"
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
              <Box sx={{ mt: 1 }}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1E293B",
                    fontFamily: "Inter, sans-serif",
                    mb: 0.7,
                  }}
                >
                  Select Campaign <span style={{ color: "#EF4444" }}>*</span>
                </Typography>

                {loadingCampaigns ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                    <CircularProgress size={18} sx={{ color: "#25D366" }} />
                    <Typography sx={{ fontSize: "13px", color: "#64748B" }}>
                      Loading campaigns...
                    </Typography>
                  </Box>
                ) : campaigns.length === 0 ? (
                  <Alert
                    severity="info"
                    sx={{
                      fontSize: "13px",
                      fontFamily: "Inter, sans-serif",
                      borderRadius: "8px",
                    }}
                  >
                    No existing campaigns found. Please choose <strong>Create a campaign</strong> above to create one.
                  </Alert>
                ) : (
                  <FormControl fullWidth size="small">
                    <Select
                      value={routing.campaignId || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRouting((prev) => ({
                          ...prev,
                          campaignId: val,
                        }));
                        if (errorMessage) setErrorMessage("");
                      }}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <Typography
                              component="span"
                              sx={{
                                color: "#94A3B8",
                                fontSize: "14px",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 400,
                              }}
                            >
                              Select an existing campaign...
                            </Typography>
                          );
                        }
                        const found = campaigns.find(
                          (c) => String(c.id) === String(selected)
                        );
                        return (
                          <Typography
                            component="span"
                            sx={{
                              color: "#0F172A",
                              fontSize: "14px",
                              fontFamily: "Inter, sans-serif",
                              fontWeight: 500,
                            }}
                          >
                            {found ? found.name : selected}
                          </Typography>
                        );
                      }}
                      sx={{
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: "Inter, sans-serif",
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#CBD5E1" },
                        "&.Mui-focused fieldset": { borderColor: "#25D366" },
                      }}
                    >
                      <MenuItem
                        value=""
                        disabled
                        sx={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "14px",
                          color: "#94A3B8",
                        }}
                      >
                        Select an existing campaign...
                      </MenuItem>
                      {campaigns.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            )}

            {/* Create New Campaign Option (Matches other integrations) */}
            {routing.type === "new" && (
              <Box sx={{ mt: 1 }}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1E293B",
                    fontFamily: "Inter, sans-serif",
                    mb: 0.7,
                  }}
                >
                  Campaign Name <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Click here to create a campaign"
                  value={routing.campaignName || ""}
                  onClick={() => setIsCreateCampaignOpen(true)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: routing.campaignName ? (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCreateCampaignOpen(true);
                          }}
                          sx={{
                            textTransform: "none",
                            fontSize: "12px",
                            fontFamily: "Inter, sans-serif",
                            color: "#16A34A",
                            fontWeight: 600,
                            minWidth: "auto",
                            p: "2px 6px",
                          }}
                        >
                          Change
                        </Button>
                      </InputAdornment>
                    ) : null,
                  }}
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
                      "&.Mui-focused fieldset": { borderColor: "#25D366" },
                    },
                  }}
                />
                {!routing.campaignName && (
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#64748B",
                      fontFamily: "Inter, sans-serif",
                      mt: 0.5,
                    }}
                  >
                    Click above to open the campaign creation window.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* ========================================================= */}
        {/* STEP 2: MOBILE NUMBER                                     */}
        {/* ========================================================= */}
        {step === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Context Reminder */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                gap: 1.2,
              }}
            >
              <CampaignIcon sx={{ color: "#16A34A", fontSize: 20 }} />
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "#334155",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Destination Campaign: <strong>{routing.campaignName || `Campaign #${routing.campaignId}`}</strong>
              </Typography>
            </Box>

            {/* Mobile Number Field */}
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
                WhatsApp Mobile Number <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. 9876543210 or +91 98765 43210"
                value={mobileInput}
                onChange={(e) => {
                  setMobileInput(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={submitting}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&:hover fieldset": { borderColor: "#CBD5E1" },
                    "&.Mui-focused fieldset": { borderColor: "#25D366" },
                  },
                }}
              />
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#64748B",
                  fontFamily: "Inter, sans-serif",
                  mt: 0.8,
                  lineHeight: 1.4,
                }}
              >
                Enter the same number that is logged in to WhatsApp Web. Leads will only be captured if the numbers match. (Default country code +91 applies automatically).
              </Typography>

              {/* Real-time normalized preview */}
              {mobileInput.trim() && currentMobileVal.isValid && (
                <Box
                  sx={{
                    mt: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1.2,
                    py: 0.4,
                    borderRadius: "6px",
                    backgroundColor: "#DCFCE7",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <CheckIcon sx={{ color: "#16A34A", fontSize: 14 }} />
                  <Typography
                    sx={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#166534",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Sync number: {currentMobileVal.display} ({currentMobileVal.normalized})
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Optional Client / Staff Name Field */}
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
                Client / Staff Name <span style={{ color: "#64748B", fontWeight: 400 }}>(Optional)</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Code99 Admin"
                value={clientNameInput}
                onChange={(e) => setClientNameInput(e.target.value)}
                disabled={submitting}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": { borderColor: "#E2E8F0" },
                    "&:hover fieldset": { borderColor: "#CBD5E1" },
                    "&.Mui-focused fieldset": { borderColor: "#25D366" },
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* ========================================================= */}
        {/* STEP 3: LINK GENERATED & INSTRUCTIONS                     */}
        {/* ========================================================= */}
        {step === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Summary Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "8px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Typography sx={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                  Selected Campaign
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#0F172A", fontWeight: 600, mt: 0.3 }}>
                  {connectionResult?.campaignName || routing.campaignName || `Campaign #${connectionResult?.campaignId}`}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "8px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Typography sx={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                  Registered Number
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#0F172A", fontWeight: 600, mt: 0.3 }}>
                  {connectionResult?.displayMobile || `+${connectionResult?.mobile}`}
                </Typography>
              </Box>
            </Box>

            {/* Note: Connect via Chrome extension */}
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon sx={{ fontSize: 20, color: "#0284C7" }} />}
              sx={{
                borderRadius: "10px",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                backgroundColor: "#F0F9FF",
                border: "1px solid #BAE6FD",
                color: "#0369A1",
                py: 1,
                px: 1.8,
                "& .MuiAlert-icon": { py: 0.3 },
                "& .MuiAlert-message": { py: 0.2, fontWeight: 500, lineHeight: 1.5 },
              }}
            >
              Copy this URL and connect via Chrome Extension. It will appear here once connected.
            </Alert>

            {/* Generated Link Field with Copy Button */}
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
                CRM Connection Link
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title={connectionResult?.url || connectionResult?.connectionUrl || "Click Copy to copy full URL"} arrow>
                  <TextField
                    fullWidth
                    size="small"
                    value={connectionResult?.url || connectionResult?.connectionUrl || ""}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                        backgroundColor: "#F8FAFC",
                        "& fieldset": { borderColor: "#E2E8F0" },
                      },
                    }}
                  />
                </Tooltip>
                <Button
                  variant="contained"
                  onClick={handleCopyLink}
                  startIcon={
                    copiedLink ? (
                      <CheckIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  sx={{
                    textTransform: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: copiedLink ? "#16A34A" : "#25D366",
                    color: "#FFFFFF",
                    borderRadius: "8px",
                    px: 2.2,
                    height: "40px",
                    whiteSpace: "nowrap",
                    minWidth: "105px",
                    boxShadow: "none",
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: copiedLink ? "#15803D" : "#1EA952",
                      boxShadow: "none",
                    },
                  }}
                >
                  {copiedLink ? "Copied!" : "Copy"}
                </Button>
              </Box>
            </Box>

            {/* Quick Setup Instructions */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "10px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  mb: 1.5,
                }}
              >
                Next Steps to Connect:
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "#DCFCE7",
                      color: "#166534",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  >
                    1
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: "13px", color: "#334155", lineHeight: 1.4 }}>
                      Install the <strong>WhatsApp Lead Sync</strong> extension from Chrome Web Store.
                    </Typography>
                    <Link
                      href={WHATSAPP_EXTENSION_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#16A34A",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.5,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Open Chrome Web Store
                      <OpenInNewIcon sx={{ fontSize: 13 }} />
                    </Link>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "#DCFCE7",
                      color: "#166534",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  >
                    2
                  </Box>
                  <Typography sx={{ fontSize: "13px", color: "#334155", lineHeight: 1.4 }}>
                    Open <strong>WhatsApp Web</strong> in Chrome and log in with your registered phone number.
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "#DCFCE7",
                      color: "#166534",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  >
                    3
                  </Box>
                  <Typography sx={{ fontSize: "13px", color: "#334155", lineHeight: 1.4 }}>
                    Open the extension, paste this link, and click <strong>&quot;Connect to CRM&quot;</strong>.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Warning Note */}
            <Alert
              severity="warning"
              icon={<WarningAmberRoundedIcon sx={{ fontSize: 20 }} />}
              sx={{
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
                backgroundColor: "#FFFBEB",
                border: "1px solid #FDE68A",
                color: "#92400E",
                "& .MuiAlert-icon": { color: "#D97706" },
              }}
            >
              Keep this link private. Anyone with it can send leads to this campaign.
            </Alert>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Actions / Navigation Buttons */}
      <DialogActions
        sx={{
          p: 2.5,
          borderTop: "1px solid #F1F5F9",
          display: "flex",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Left Side Button (Cancel or Back) */}
        {step === 1 && (
          <Button
            onClick={onClose}
            disabled={submitting}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              color: "#64748B",
              "&:hover": { backgroundColor: "#F1F5F9", color: "#0F172A" },
            }}
          >
            Cancel
          </Button>
        )}

        {step === 2 && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              setErrorMessage("");
              setStep(1);
            }}
            disabled={submitting}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              color: "#64748B",
              "&:hover": { backgroundColor: "#F1F5F9", color: "#0F172A" },
            }}
          >
            Back
          </Button>
        )}

        {step === 3 && <Box />}

        {/* Right Side Button (Next, Submit, or Done) */}
        {step === 1 && (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNextFromStep1}
            disabled={isStep1Disabled}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#25D366",
              color: "#FFFFFF",
              borderRadius: "8px",
              px: 2.5,
              "&:hover": { backgroundColor: "#1EA952" },
              "&.Mui-disabled": {
                backgroundColor: "#E2E8F0",
                color: "#94A3B8",
              },
            }}
          >
            Next
          </Button>
        )}

        {step === 2 && (
          <Button
            variant="contained"
            onClick={handleSubmitStep2}
            disabled={submitting || !mobileInput.trim() || !currentMobileVal.isValid}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#25D366",
              color: "#FFFFFF",
              borderRadius: "8px",
              px: 2.5,
              minWidth: "100px",
              "&:hover": { backgroundColor: "#1EA952" },
              "&.Mui-disabled": {
                backgroundColor: "#E2E8F0",
                color: "#94A3B8",
              },
            }}
          >
            {submitting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
                <span>Connecting...</span>
              </Box>
            ) : (
              "Submit"
            )}
          </Button>
        )}

        {step === 3 && (
          <Button
            variant="contained"
            onClick={handleDone}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#25D366",
              color: "#FFFFFF",
              borderRadius: "8px",
              px: 3,
              "&:hover": { backgroundColor: "#1EA952" },
            }}
          >
            Done
          </Button>
        )}
      </DialogActions>

      {/* Common Create Campaign Modal */}
      <CreateCampaignModal
        open={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        onCreateSuccess={handleCampaignCreated}
      />
    </Dialog>
  );
}
