import React, { useState, useEffect, useReducer } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import RoutingStep from "./steps/RoutingStep";
import PageStep from "./steps/PageStep";
import FormsStep from "./steps/FormsStep";

import {
  getPipelines,
  getCampaigns,
  getCrmFields,
  getFacebookAccounts,
  getFacebookPages,
  getPageForms,
  createConnection,
  loginFacebookUser,
} from "@/apps/admin/services/integrationsApi";
import { initFacebookSdk } from "@/apps/admin/services/metaSdk";

const STEPS = ["Lead routing", "Facebook Page", "Lead forms"];

const initialWizardState = {
  routing: {
    type: "existing",
    campaignName: "",
    campaignId: "",
  },
  pipelineId: "",
  pipelineName: "",
  customizeFields: false,
  fieldMapping: {
    full_name: "Name",
    phone_number: "Phone",
    email: "Email",
    city: "City",
  },
  facebookAccount: null,
  pageId: "",
  pageName: "",
  formMode: "specific",
  formIds: [],
};

function wizardReducer(state, action) {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "RESET":
      return initialWizardState;
    default:
      return state;
  }
}

/**
 * Pure Validation Function per step
 */
export function validateStep(stepIndex, formState, existingConnections = []) {
  if (stepIndex === 0) {
    if (formState.routing.type === "new" && !formState.routing.campaignName?.trim()) {
      return { isValid: false, message: "Enter a campaign name." };
    }
    if (formState.routing.type === "existing" && !formState.routing.campaignId) {
      return { isValid: false, message: "Choose an existing campaign to route leads into." };
    }
    return { isValid: true, message: "" };
  }

  if (stepIndex === 1) {
    if (!formState.facebookAccount) {
      return { isValid: false, message: "Please click 'Continue with Facebook' to sign in." };
    }
    if (!formState.pageId) {
      return { isValid: false, message: "Please select a Facebook Page to connect." };
    }
    const isAlready = existingConnections.some((c) => String(c.pageId) === String(formState.pageId));
    if (isAlready) {
      return { isValid: false, message: "This Facebook Page is already connected. Please choose another page." };
    }
    return { isValid: true, message: "" };
  }

  if (stepIndex === 2) {
    if (formState.formMode === "specific") {
      if (!formState.formIds || formState.formIds.length === 0) {
        return { isValid: false, message: "Select at least one lead form to continue." };
      }
    }
    return { isValid: true, message: "" };
  }

  return { isValid: true, message: "" };
}

export default function FacebookConnectDialog({
  open,
  onClose,
  existingConnections = [],
  onConnectionSuccess,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [errorMessage, setErrorMessage] = useState("");
  const [connectingSubmit, setConnectingSubmit] = useState(false);

  // Options fetched from services
  const [pipelines, setPipelines] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [crmFields, setCrmFields] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [pages, setPages] = useState([]);
  const [forms, setForms] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);

  // Initial load when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setErrorMessage("");
      dispatch({ type: "RESET" });
      initFacebookSdk().catch(() => {});

      Promise.all([
        getPipelines().catch(() => []),
        getCampaigns().catch(() => []),
        getCrmFields().catch(() => []),
        getFacebookAccounts().catch(() => []),
      ]).then(([pipeData, campData, fieldData, accData]) => {
        setPipelines(pipeData);
        setCampaigns(campData);
        setCrmFields(fieldData);
        setAccounts(accData);

        // Pre-select default pipeline if available
        if (pipeData.length > 0) {
          dispatch({
            type: "SET_STATE",
            payload: {
              pipelineId: pipeData[0].id,
              pipelineName: pipeData[0].name,
            },
          });
        }
      });
    }
  }, [open]);

  // Load pages when account changes
  useEffect(() => {
    if (state.facebookAccount?.id) {
      setLoadingPages(true);
      getFacebookPages(state.facebookAccount.id)
        .then((pagesData) => {
          setPages(pagesData);
        })
        .finally(() => setLoadingPages(false));
    } else {
      setPages([]);
    }
  }, [state.facebookAccount]);

  // Load forms when page changes
  useEffect(() => {
    if (state.pageId) {
      setLoadingForms(true);
      getPageForms(state.pageId)
        .then((formsData) => {
          setForms(formsData);
          if (state.formMode === "specific" && formsData.length > 0) {
            dispatch({
              type: "SET_STATE",
              payload: { formIds: [formsData[0].id] },
            });
          }
        })
        .finally(() => setLoadingForms(false));
    } else {
      setForms([]);
    }
  }, [state.pageId]);

  // State change handler that clears validation error
  const handleWizardStateChange = (nextState) => {
    dispatch({ type: "SET_STATE", payload: nextState });
    // If an error is currently showing, re-check to clear it proactively
    if (errorMessage) {
      const validation = validateStep(activeStep, nextState, existingConnections);
      if (validation.isValid) {
        setErrorMessage("");
      }
    }
  };

  // Step 2 Login Handlers (Meta OAuth 2.0 SDK Popup)
  const handleConnectFacebook = async () => {
    try {
      setErrorMessage("");
      const { account, pages: fetchedPages } = await loginFacebookUser({ reauthenticate: false });
      if (fetchedPages && fetchedPages.length > 0) {
        setPages(fetchedPages);
      }
      handleWizardStateChange({
        ...state,
        facebookAccount: account,
        pageId: "",
        pageName: "",
      });
    } catch (err) {
      console.warn("Facebook connect warning:", err);
      setErrorMessage(err.message || "Failed to authenticate with Facebook.");
    }
  };

  const handleSwitchAccount = async () => {
    try {
      setErrorMessage("");
      const { account, pages: fetchedPages } = await loginFacebookUser({ reauthenticate: true });
      if (fetchedPages && fetchedPages.length > 0) {
        setPages(fetchedPages);
      }
      handleWizardStateChange({
        ...state,
        facebookAccount: account,
        pageId: "",
        pageName: "",
        formIds: [],
      });
    } catch (err) {
      console.warn("Facebook switch account warning:", err);
      setErrorMessage(err.message || "Failed to switch Facebook account.");
    }
  };

  // Next / Connect Page Click
  const handleNext = async () => {
    const validation = validateStep(activeStep, state, existingConnections);
    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    setErrorMessage("");

    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Step 3: Finish & Connect Page
      setConnectingSubmit(true);
      try {
        const payload = {
          routing: state.routing,
          pipelineId: state.pipelineId,
          pipelineName: state.pipelineName,
          fieldMapping: state.fieldMapping,
          facebookAccount: state.facebookAccount,
          pageId: state.pageId,
          pageName: state.pageName,
          formMode: state.formMode,
          formIds: state.formMode === "all" ? [] : state.formIds,
          forms: forms.filter((f) => state.formMode === "all" || state.formIds.includes(f.id)),
        };

        const newConnection = await createConnection(payload);
        if (onConnectionSuccess) {
          onConnectionSuccess(newConnection);
        }
        onClose();
      } catch (err) {
        console.error("Failed to connect page:", err);
        setErrorMessage("Connection failed. Please check your network and try again.");
      } finally {
        setConnectingSubmit(false);
      }
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    if (activeStep === 0) {
      onClose();
    } else {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      aria-labelledby="connect-facebook-dialog-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: isMobile ? 0 : "16px",
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
          maxWidth: isMobile ? "100%" : "620px !important",
          width: "100%",
          maxHeight: isMobile ? "100%" : "calc(100vh - 40px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          m: isMobile ? 0 : 2,
          p: { xs: 2, sm: 3 },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          mb: 1.5,
        }}
      >
        <Typography id="connect-facebook-dialog-title" sx={{ fontSize: "17px", fontWeight: 600, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
          Connect Facebook &amp; Instagram
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close dialog"
          sx={{ color: "#64748B", p: 0.5, "&:hover": { backgroundColor: "#F1F5F9" } }}
        >
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Box>

      {/* Stepper Progress (Clean Inline Badges matching reference) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.2, mb: 2.5, flexShrink: 0 }}>
        {STEPS.map((label, idx) => {
          const isActive = activeStep === idx;
          const isCompleted = activeStep > idx;
          return (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: isActive || isCompleted ? "#84CC16" : "transparent",
                  border: isActive || isCompleted ? "none" : "1.5px solid #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isActive || isCompleted ? "#FFFFFF" : "#94A3B8",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {idx + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#0F172A" : "#64748B",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Content Area */}
      <DialogContent sx={{ p: 0, flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
        {activeStep === 0 && (
          <RoutingStep
            state={state}
            onChange={handleWizardStateChange}
            campaigns={campaigns}
            crmFields={crmFields}
          />
        )}

        {activeStep === 1 && (
          <PageStep
            state={state}
            onChange={handleWizardStateChange}
            facebookAccounts={accounts}
            pages={pages}
            existingConnections={existingConnections}
            loadingPages={loadingPages}
            onConnectFacebook={handleConnectFacebook}
            onSwitchAccount={handleSwitchAccount}
          />
        )}

        {activeStep === 2 && (
          <FormsStep
            state={state}
            onChange={handleWizardStateChange}
            forms={forms}
            loadingForms={loadingForms}
          />
        )}
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          pt: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.2,
          flexShrink: 0,
        }}
      >
        {/* Validation Error Message Alert in Footer */}
        {errorMessage && (
          <Alert
            severity="error"
            icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              py: 0.5,
              px: 1.5,
              borderRadius: "8px",
              fontSize: "13px",
              backgroundColor: "#FEF2F2",
              color: "#B91C1C",
              border: "1px solid #FCA5A5",
              "& .MuiAlert-message": { fontSize: "13px", fontWeight: 500 },
            }}
          >
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5, width: "100%" }}>
          {/* Back / Cancel Button */}
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{
              borderRadius: "6px",
              borderColor: "#84CC16",
              color: "#65A30D",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              px: 2.5,
              py: 0.7,
              height: "36px",
              boxShadow: "none",
              "&:hover": {
                borderColor: "#84CC16",
                backgroundColor: "rgba(132, 204, 22, 0.08)",
              },
            }}
          >
            {activeStep === 0 ? "Cancel" : "Back"}
          </Button>

          {/* Next / Connect Page Button */}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={connectingSubmit}
            endIcon={
              connectingSubmit ? (
                <CircularProgress size={15} color="inherit" />
              ) : null
            }
            sx={{
              borderRadius: "6px",
              backgroundColor: "#84CC16",
              color: "#FFFFFF",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              px: 3,
              py: 0.7,
              height: "36px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#65A30D",
                boxShadow: "none",
              },
            }}
          >
            {connectingSubmit ? "Connecting..." : activeStep === STEPS.length - 1 ? "Connect Page" : "Next"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
