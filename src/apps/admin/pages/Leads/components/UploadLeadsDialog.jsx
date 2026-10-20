import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  Chip,
  ThemeProvider,
  createTheme,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { CreateCampaignModal } from "@/apps/admin/components/CreateCampaignModal";
import { invalidateSelectOptions, getSelectOptions } from "@/apps/admin/services/dropdownService";

// Modern SaaS Theme - Lime Green (#84CC16) & Slate Slate Color System
const theme = createTheme({
  palette: {
    primary: {
      main: "#84CC16",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

/**
 * UploadLeadsDialog Component - High Polish Modern Redesign
 */
export default function UploadLeadsDialog({
  open = true,
  onClose,
  onBack,
  onNext,
  onSubmit,
  onRefreshCampaigns,
  campaigns = [],
  fileColumns = [],
  pipelineId = null,
  campaignId = null,
  campaignName = "",
  lockCampaign = false,
}) {
  const [step, setStep] = useState(1);

  // Step 1 States
  const [selectedOption, setSelectedOption] = useState("existing"); // "existing" | "new"
  const [selectedCampaign, setSelectedCampaign] = useState(
    campaignId ? String(campaignId) : ""
  );

  useEffect(() => {
    if (campaignId) {
      setSelectedCampaign(String(campaignId));
      setSelectedOption("existing");
    }
  }, [campaignId]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Step 2 Mapping State
  const [mapping, setMapping] = useState({
    contactName: "",
    primaryNumber: "",
    alternateNumber1: "",
    email: "",
  });

  useEffect(() => {
    if (fileColumns && fileColumns.length > 0) {
      const findMatch = (candidates) => {
        return (
          fileColumns.find((col) => {
            const normCol = String(col).toLowerCase().replace(/[^a-z0-9]/g, "");
            return candidates.some((c) => normCol.includes(c.toLowerCase().replace(/[^a-z0-9]/g, "")));
          }) || ""
        );
      };

      setMapping((prev) => ({
        contactName: prev.contactName || findMatch(["contactname", "fullname", "name", "firstname"]),
        primaryNumber: prev.primaryNumber || findMatch(["primarycontactnumber", "mobileno", "phonenumber", "mobile", "phone", "contact"]),
        alternateNumber1: prev.alternateNumber1 || findMatch(["alternatecontactnumber", "altphone", "alternateno", "secondaryphone"]),
        email: prev.email || findMatch(["emailaddress", "emailid", "email", "mail"]),
      }));
    }
  }, [fileColumns]);

  const handleCreateSuccess = async (createdCampData) => {
    setCreateModalOpen(false);
    invalidateSelectOptions("L_CAMPAIGN_NAMES");
    try {
      const campFilter = pipelineId ? { pipeline_id: Number(pipelineId) } : { pipeline_id: 1 };
      const freshList = await getSelectOptions("L_CAMPAIGN_NAMES", campFilter);
      const formatted = Array.isArray(freshList)
        ? freshList.map((c) => ({
            id: String(c.id || c.value || c.name),
            name: String(c.name || c.label || c.campaign_name || c.value),
          }))
        : [];

      if (onRefreshCampaigns) {
        onRefreshCampaigns(formatted);
      }

      const newId = String(
        createdCampData?.id ||
          createdCampData?.campaign_id ||
          createdCampData?.data?.id ||
          createdCampData?.data?.campaign_id ||
          (formatted.length > 0 ? formatted[formatted.length - 1].id : "")
      );

      if (newId) {
        setSelectedCampaign(newId);
      }
      setSelectedOption("existing");
    } catch (err) {
      console.error("Failed to refresh campaign options:", err);
    }
  };

  const handleStep1Next = () => {
    if (selectedOption === "new") {
      setCreateModalOpen(true);
      return;
    }
    if (selectedOption === "existing" && !selectedCampaign) return;
    if (onNext) {
      onNext(selectedOption, selectedCampaign);
    }
    setStep(2);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleStep2Submit = async () => {
    if (!mapping.primaryNumber || submitting) return;

    try {
      setSubmitting(true);
      // Allow browser UI to render button spinner before heavy mapping loop
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (onSubmit) {
        await onSubmit({
          campaignOption: selectedOption,
          campaignId: selectedCampaign,
          mapping,
        });
      }
    } catch (err) {
      console.error("Mapping submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMappingChange = (fieldKey, value) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const isStep1NextDisabled = selectedOption === "existing" && !selectedCampaign;
  const isStep2SubmitDisabled = !mapping.primaryNumber;

  return (
    <ThemeProvider theme={theme}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              backgroundColor: "#FFFFFF",
              width: "600px",
              maxWidth: "92vw",
              p: 0,
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
              overflow: "hidden",
            },
          },
        }}
      >
        <DialogContent sx={{ p: "28px 32px" }}>
          {/* Header Row: Title, Learn More & Close Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Typography
              sx={{
                color: "#84CC16",
                fontWeight: 700,
                fontSize: "22px",
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
              }}
            >
              Upload Excel Sheet
            </Typography>

            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "#64748B",
                p: 0.5,
                "&:hover": { backgroundColor: "#F1F5F9", color: "#0F172A" },
              }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* ========================================================================= */}
          {/* STEP 1: CAMPAIGN SELECTION SCREEN                                          */}
          {/* ========================================================================= */}
          {step === 1 && (
            <Box>
              {/* Option Cards Grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Card 1: Add leads in existing campaign */}
                <Grid xs={12} sm={lockCampaign ? 12 : 6}>
                  <Box
                    onClick={() => setSelectedOption("existing")}
                    sx={{
                      position: "relative",
                      borderRadius: "12px",
                      p: 2.2,
                      cursor: "pointer",
                      height: "100%",
                      minHeight: "92px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      backgroundColor:
                        selectedOption === "existing" ? "#F7FEE7" : "#FFFFFF",
                      border:
                        selectedOption === "existing"
                          ? "2px solid #84CC16"
                          : "1.5px dashed #E2E8F0",
                      transition: "all 0.15s ease-in-out",
                      "&:hover": {
                        borderColor: "#84CC16",
                        backgroundColor:
                          selectedOption === "existing" ? "#F7FEE7" : "#F8FAFC",
                      },
                    }}
                  >
                    {/* Suggested Badge */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -10,
                        left: 16,
                        backgroundColor: "#84CC16",
                        color: "#FFFFFF",
                        fontSize: "11px",
                        fontWeight: 700,
                        px: 1.2,
                        py: 0.2,
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(132, 204, 22, 0.25)",
                        letterSpacing: "0.2px",
                      }}
                    >
                      {lockCampaign ? "Current Campaign" : "Suggested"}
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14.5px",
                        fontWeight: 600,
                        color: selectedOption === "existing" ? "#166534" : "#334155",
                        lineHeight: 1.35,
                      }}
                    >
                      Add leads in existing campaign
                    </Typography>
                  </Box>
                </Grid>

                {/* Card 2: Create a new campaign */}
                {!lockCampaign && (
                  <Grid xs={12} sm={6}>
                    <Box
                      onClick={() => {
                        setSelectedOption("new");
                        setCreateModalOpen(true);
                      }}
                      sx={{
                        borderRadius: "12px",
                        p: 2.2,
                        cursor: "pointer",
                        height: "100%",
                        minHeight: "92px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        backgroundColor:
                          selectedOption === "new" ? "#F7FEE7" : "#FFFFFF",
                        border:
                          selectedOption === "new"
                            ? "2px solid #84CC16"
                            : "1.5px dashed #E2E8F0",
                        transition: "all 0.15s ease-in-out",
                        "&:hover": {
                          borderColor: "#84CC16",
                          backgroundColor:
                            selectedOption === "new" ? "#F7FEE7" : "#F8FAFC",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "14.5px",
                          fontWeight: 600,
                          color: selectedOption === "new" ? "#166534" : "#334155",
                          lineHeight: 1.35,
                        }}
                      >
                        Create a new campaign
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Campaign Select Dropdown */}
              {selectedOption === "existing" && (
                <Box sx={{ mb: 3.5 }}>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#334155",
                      mb: 0.8,
                    }}
                  >
                    Select Campaign *{lockCampaign ? " (Locked to current campaign)" : ""}
                  </Typography>

                  <Select
                    fullWidth
                    displayEmpty
                    disabled={Boolean(lockCampaign)}
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    sx={{
                      borderRadius: "8px",
                      backgroundColor: lockCampaign ? "#F1F5F9" : "#F8FAFC",
                      color: selectedCampaign ? "#0F172A" : "#94A3B8",
                      fontSize: "14px",
                      height: "42px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#CBD5E1",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: lockCampaign ? "#CBD5E1" : "#84CC16",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#84CC16",
                        borderWidth: "2px",
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: "#94A3B8", fontSize: "14px" }}>
                        Choose a campaign
                      </Typography>
                    </MenuItem>
                    {selectedCampaign && !campaigns.some((c) => String(c.id) === String(selectedCampaign)) && (
                      <MenuItem value={selectedCampaign} sx={{ fontSize: "14px" }}>
                        {campaignName || "Current Campaign"}
                      </MenuItem>
                    )}
                    {campaigns.map((camp) => (
                      <MenuItem key={camp.id} value={camp.id} sx={{ fontSize: "14px" }}>
                        {camp.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}

              {/* Step 1 Footer Actions */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 1.5,
                  pt: 1,
                  borderTop: "1px solid #F1F5F9",
                }}
              >
                <Button
                  onClick={onBack}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    border: "1.5px solid #84CC16",
                    color: "#84CC16",
                    fontWeight: 700,
                    fontSize: "14px",
                    borderRadius: "8px",
                    height: "40px",
                    px: 3,
                    textTransform: "none",
                    backgroundColor: "#FFFFFF",
                    "&:hover": {
                      backgroundColor: "#F7FEE7",
                      borderColor: "#65A30D",
                    },
                  }}
                >
                  Back
                </Button>

                <Button
                  onClick={handleStep1Next}
                  disabled={isStep1NextDisabled}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    backgroundColor: isStep1NextDisabled ? "#E2E8F0" : "#84CC16",
                    color: isStep1NextDisabled ? "#94A3B8" : "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "14px",
                    borderRadius: "8px",
                    height: "40px",
                    px: 3,
                    textTransform: "none",
                    boxShadow: isStep1NextDisabled
                      ? "none"
                      : "0 2px 8px rgba(132, 204, 22, 0.3)",
                    "&:hover": {
                      backgroundColor: isStep1NextDisabled ? "#E2E8F0" : "#65A30D",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "#E2E8F0",
                      color: "#94A3B8",
                    },
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: COLUMN MAPPING SCREEN                                              */}
          {/* ========================================================================= */}
          {step === 2 && (
            <Box>
              {/* Instruction Text */}
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#475569",
                  mb: 2.5,
                }}
              >
                Simply select the columns in your file for these details
              </Typography>

              {/* Form Mapping Rows */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.8,
                  mb: 3,
                }}
              >
                {/* Row 1: Contact Name */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#334155",
                      width: { xs: "100%", sm: "210px" },
                      flexShrink: 0,
                    }}
                  >
                    Contact Name :
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    value={mapping.contactName}
                    onChange={(e) =>
                      handleMappingChange("contactName", e.target.value)
                    }
                    MenuProps={selectMenuProps}
                    sx={dropdownStyles}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: "#94A3B8", fontSize: "13.5px" }}>
                        Select Column Header
                      </Typography>
                    </MenuItem>
                    {fileColumns.map((col) => (
                      <MenuItem key={col} value={col} sx={{ fontSize: "13.5px" }}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* Row 2: Primary Contact Number * (Required) */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#334155",
                      width: { xs: "100%", sm: "210px" },
                      flexShrink: 0,
                    }}
                  >
                    Primary Contact Number{" "}
                    <Box component="span" sx={{ color: "#EF4444" }}>
                      *
                    </Box>{" "}
                    :
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    value={mapping.primaryNumber}
                    onChange={(e) =>
                      handleMappingChange("primaryNumber", e.target.value)
                    }
                    MenuProps={selectMenuProps}
                    sx={dropdownStyles}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: "#94A3B8", fontSize: "13.5px" }}>
                        Select Column Header (Required)
                      </Typography>
                    </MenuItem>
                    {fileColumns.map((col) => (
                      <MenuItem key={col} value={col} sx={{ fontSize: "13.5px" }}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* Row 3: Alternate Contact Number 1 */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#334155",
                      width: { xs: "100%", sm: "210px" },
                      flexShrink: 0,
                    }}
                  >
                    Alternate Contact Number 1 :
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    value={mapping.alternateNumber1}
                    onChange={(e) =>
                      handleMappingChange("alternateNumber1", e.target.value)
                    }
                    MenuProps={selectMenuProps}
                    sx={dropdownStyles}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: "#94A3B8", fontSize: "13.5px" }}>
                        Select Column Header
                      </Typography>
                    </MenuItem>
                    {fileColumns.map((col) => (
                      <MenuItem key={col} value={col} sx={{ fontSize: "13.5px" }}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* Row 4: Email Address */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#334155",
                      width: { xs: "100%", sm: "210px" },
                      flexShrink: 0,
                    }}
                  >
                    Email Address :
                  </Typography>
                  <Select
                    fullWidth
                    displayEmpty
                    value={mapping.email}
                    onChange={(e) =>
                      handleMappingChange("email", e.target.value)
                    }
                    MenuProps={selectMenuProps}
                    sx={dropdownStyles}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: "#94A3B8", fontSize: "13.5px" }}>
                        Select Column Header
                      </Typography>
                    </MenuItem>
                    {fileColumns.map((col) => (
                      <MenuItem key={col} value={col} sx={{ fontSize: "13.5px" }}>
                        {col}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>

              {/* Step 2 Footer Actions (Back & Submit) */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 1.5,
                  pt: 1,
                  borderTop: "1px solid #F1F5F9",
                }}
              >
                <Button
                  onClick={handleStep2Back}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    border: "1.5px solid #84CC16",
                    color: "#84CC16",
                    fontWeight: 700,
                    fontSize: "14px",
                    borderRadius: "8px",
                    height: "40px",
                    px: 3,
                    textTransform: "none",
                    backgroundColor: "#FFFFFF",
                    "&:hover": {
                      backgroundColor: "#F7FEE7",
                      borderColor: "#65A30D",
                    },
                  }}
                >
                  Back
                </Button>

                <Button
                  onClick={handleStep2Submit}
                  disabled={isStep2SubmitDisabled || submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
                    ) : (
                      <FileUploadIcon sx={{ fontSize: 18 }} />
                    )
                  }
                  sx={{
                    backgroundColor: isStep2SubmitDisabled || submitting ? "#E2E8F0" : "#84CC16",
                    color: isStep2SubmitDisabled || submitting ? "#94A3B8" : "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "14px",
                    borderRadius: "8px",
                    height: "40px",
                    px: 3,
                    textTransform: "none",
                    boxShadow: isStep2SubmitDisabled || submitting
                      ? "none"
                      : "0 2px 8px rgba(132, 204, 22, 0.3)",
                    "&:hover": {
                      backgroundColor: isStep2SubmitDisabled || submitting ? "#E2E8F0" : "#65A30D",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "#E2E8F0",
                      color: "#94A3B8",
                    },
                  }}
                >
                  {submitting ? "Processing..." : "Submit"}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <CreateCampaignModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateSuccess={handleCreateSuccess}
        initialPipelineCategoryId={pipelineId}
      />
    </ThemeProvider>
  );
}

// Common Dropdown Styling Helper - Sleek 40px Height & Clean Focus
const selectMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 260,
      overflowY: "auto",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
      borderRadius: "8px",
    },
  },
};

const dropdownStyles = {
  borderRadius: "8px",
  backgroundColor: "#F8FAFC",
  height: "40px",
  fontSize: "13.5px",
  flex: 1,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#CBD5E1",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#84CC16",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#84CC16",
    borderWidth: "2px",
  },
};
