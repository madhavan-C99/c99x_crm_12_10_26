import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Divider,
  Stack,
  MenuItem,
  Select,
  Alert,
} from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { toast } from "react-toastify";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateAllOrganizationSteps,
} from "@/shared/utils/validators";

const ACCENT = "#90D916";

const baseFieldRootSx = {
  backgroundColor: "#F2F2F2",
  borderRadius: "5px",
  height: "36px",
  opacity: 1,
  "& fieldset": { border: "0.5px solid #00000017" },
  "&:hover fieldset": { border: "0.5px solid #00000017" },
  "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
};

const getFieldStyles = (hasError) => ({
  "& .MuiOutlinedInput-root": {
    ...baseFieldRootSx,
    backgroundColor: hasError ? "#FEF2F2" : "#F2F2F2",
    "& fieldset": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : "0.5px solid #00000017",
    },
    "&:hover fieldset": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : "0.5px solid #00000017",
    },
    "&.Mui-focused fieldset": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : `1px solid ${ACCENT}`,
    },
  },
  "& .MuiInputBase-input": {
    padding: "8px 12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    height: "36px",
    boxSizing: "border-box",
    "&::placeholder": {
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontSize: "14px",
      color: "#6B7280",
    },
  },
});

const getSelectFieldStyles = (hasError) => ({
  backgroundColor: hasError ? "#FEF2F2" : "#F2F2F2",
  borderRadius: "5px",
  height: "36px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  color: "#2B2B2B",
  "& fieldset": {
    border: hasError
      ? "1.5px solid #EF4444 !important"
      : "0.5px solid #00000017",
  },
  "&:hover fieldset": {
    border: hasError
      ? "1.5px solid #EF4444 !important"
      : "0.5px solid #00000017",
  },
  "&.Mui-focused fieldset": {
    border: hasError ? "1.5px solid #EF4444 !important" : `1px solid ${ACCENT}`,
  },
  "& .MuiSelect-select": {
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
  },
});

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "100%",
  color: "#2B2B2B",
  mb: 0.8,
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={labelStyles}>
      {children}
      {required && (
        <Box component="span" sx={{ color: ACCENT }}>
          {" "}
          *
        </Box>
      )}
    </Typography>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return (
    <Typography
      sx={{
        color: "#EF4444",
        fontSize: "11.5px",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        mt: 0.5,
      }}
    >
      {error}
    </Typography>
  );
}

function OrganizationLogoIcon({ size = 32 }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 18C20 13.5817 23.5817 10 28 10H36C40.4183 10 44 13.5817 44 18V24H48C52.4183 24 56 27.5817 56 32V50C56 52.2091 54.2091 54 52 54H12C9.79086 54 8 52.2091 8 50V32C8 27.5817 11.5817 24 16 24H20V18Z"
        stroke={ACCENT}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 22H37"
        stroke={ACCENT}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M27 30H37"
        stroke={ACCENT}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M27 54V44C27 41.2386 29.2386 39 32 39C34.7614 39 37 41.2386 37 44V54"
        stroke={ACCENT}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

const STEPPER_STEPS = [
  { id: 1, label: "Basic Information" },
  { id: 2, label: "Contact Information" },
  { id: 3, label: "Business Information" },
];

function getFormattedLogoUrl(logoSrc) {
  if (!logoSrc || typeof logoSrc !== "string") return "";
  let trimmed = logoSrc.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://")) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
  }
  if (trimmed.startsWith("data:") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  let finalUrl = `${cleanBase}${cleanPath}`;
  if (finalUrl.startsWith("http://")) {
    finalUrl = finalUrl.replace(/^http:\/\//i, "https://");
  }
  return finalUrl;
}

export default function OrganizationProfileForm({
  onNext,
  onCancel,
  isSubmitting = false,
  formError = "",
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [completedSteps, setCompletedSteps] = useState({
    1: false,
    2: false,
    3: false,
  });

  useEffect(() => {
    if (formError) {
      setFeedback({ type: "error", message: formError });
    }
  }, [formError]);

  // Step 1 State (Basic Information)
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");

  // Step 2 State (Contact Information)
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("Tamilnadu");
  const [countryVal, setCountryVal] = useState("India");
  const [pincode, setPincode] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [officialContact, setOfficialContact] = useState("");

  // Step 3 State (Business Information)
  const [gstIn, setGstIn] = useState("");
  const [companyPan, setCompanyPan] = useState("");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState("24hrs");

  // Helper to clear specific field error
  const clearFieldError = (fieldName) => {
    if (feedback.message) setFeedback({ type: "", message: "" });
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  // Helper getters for validation payloads
  const getStep1Data = () => ({
    logo,
    logoFile,
    orgName,
    displayName,
    industryType,
    companyWebsite,
    companyDesc,
  });

  const getStep2Data = () => ({
    addressLine1,
    addressLine2,
    city,
    stateVal,
    countryVal,
    pincode,
    officialEmail,
    officialContact,
  });

  const getStep3Data = () => ({
    gstIn,
    companyPan,
    dateFormat,
    timeFormat,
    stateVal,
  });

  const getAllFormData = () => ({
    ...getStep1Data(),
    ...getStep2Data(),
    ...getStep3Data(),
  });

  // Logo file upload handler with validation
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          logo: "Logo must be a PNG or JPG file",
        }));
        toast.error("Logo must be a PNG or JPG file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          logo: "Logo file size must not exceed 2MB",
        }));
        toast.error("Logo file size must not exceed 2MB");
        return;
      }
      clearFieldError("logo");
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Input restriction handlers
  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
    clearFieldError("pincode");
  };

  const handleContactChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setOfficialContact(val);
    clearFieldError("officialContact");
  };

  const handleGstChange = (e) => {
    const val = e.target.value.toUpperCase().slice(0, 15);
    setGstIn(val);
    clearFieldError("gstIn");
  };

  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase().slice(0, 10);
    setCompanyPan(val);
    clearFieldError("companyPan");
  };

  // onBlur validation per field
  const handleBlur = (fieldName) => {
    let res = null;
    if (
      ["orgName", "displayName", "companyWebsite", "companyDesc"].includes(
        fieldName,
      )
    ) {
      res = validateStep1(getStep1Data());
    } else if (
      [
        "addressLine1",
        "addressLine2",
        "city",
        "stateVal",
        "countryVal",
        "pincode",
        "officialEmail",
        "officialContact",
      ].includes(fieldName)
    ) {
      res = validateStep2(getStep2Data());
    } else if (
      ["gstIn", "companyPan", "dateFormat", "timeFormat"].includes(fieldName)
    ) {
      res = validateStep3(getStep3Data());
    }

    if (res && res.errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: res.errors[fieldName] }));
    }
  };

  // Step Next button handler with strict step-wise validation
  const handleNextStep = () => {
    if (currentStep === 1) {
      const { isValid, errors: s1Errors } = validateStep1(getStep1Data());
      if (!isValid) {
        setErrors((prev) => ({ ...prev, ...s1Errors }));
        setCompletedSteps((prev) => ({ ...prev, 1: false }));
        setFeedback({
          type: "error",
          message: "Please fill all mandatory fields!",
        });
        toast.error("Please fill all mandatory fields!");
        return;
      }
      setFeedback({ type: "", message: "" });
      setErrors((prev) => {
        const next = { ...prev };
        [
          "orgName",
          "displayName",
          "companyWebsite",
          "companyDesc",
          "logo",
        ].forEach((k) => delete next[k]);
        return next;
      });
      setCompletedSteps((prev) => ({ ...prev, 1: true }));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const { isValid, errors: s2Errors } = validateStep2(getStep2Data());
      if (!isValid) {
        setErrors((prev) => ({ ...prev, ...s2Errors }));
        setCompletedSteps((prev) => ({ ...prev, 2: false }));
        setFeedback({
          type: "error",
          message: "Please fill all mandatory fields!",
        });
        toast.error("Please fill all mandatory fields!");
        return;
      }
      setFeedback({ type: "", message: "" });
      setErrors((prev) => {
        const next = { ...prev };
        [
          "addressLine1",
          "addressLine2",
          "city",
          "stateVal",
          "countryVal",
          "pincode",
          "officialEmail",
          "officialContact",
        ].forEach((k) => delete next[k]);
        return next;
      });
      setCompletedSteps((prev) => ({ ...prev, 2: true }));
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const { isValid, errors: s3Errors } = validateStep3(getStep3Data());
      if (!isValid) {
        setErrors((prev) => ({ ...prev, ...s3Errors }));
        setCompletedSteps((prev) => ({ ...prev, 3: false }));
        const specificMsg =
          s3Errors.gstIn || s3Errors.companyPan || "Please fill all mandatory fields!";
        setFeedback({
          type: "error",
          message: specificMsg,
        });
        toast.error(specificMsg);
        return;
      }
      setFeedback({ type: "", message: "" });
      setErrors((prev) => {
        const next = { ...prev };
        ["gstIn", "companyPan", "dateFormat", "timeFormat"].forEach((k) =>
          delete next[k],
        );
        return next;
      });
      setCompletedSteps((prev) => ({ ...prev, 3: true }));
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Step 4: Final Submit - re-validates all 3 steps
      const allData = getAllFormData();
      const {
        isValid,
        firstErrorStep,
        errors: allErrors,
      } = validateAllOrganizationSteps(allData);

      if (!isValid) {
        setErrors(allErrors);
        setFeedback({
          type: "error",
          message: "Please fill all mandatory fields!",
        });
        toast.error("Please fill all mandatory fields!");
        if (firstErrorStep) {
          setCurrentStep(firstErrorStep);
        }
        return;
      }

      setFeedback({ type: "", message: "" });
      if (onNext) {
        onNext({
          logo,
          logoFile,
          orgName: orgName.trim(),
          displayName: displayName.trim(),
          industryType: industryType.trim(),
          companyWebsite: companyWebsite.trim(),
          companyDesc: companyDesc.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          stateVal: stateVal.trim(),
          countryVal: countryVal.trim(),
          pincode: pincode.trim(),
          officialEmail: officialEmail.trim(),
          officialContact: officialContact.trim(),
          gstIn: gstIn.trim().toUpperCase(),
          companyPan: companyPan.trim().toUpperCase(),
          dateFormat: dateFormat.trim(),
          timeFormat: timeFormat.trim(),
        });
      }
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  // Direct stepper header navigation with guard
  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    if (currentStep === 1) {
      const s1 = validateStep1(getStep1Data());
      if (!s1.isValid) {
        setErrors((prev) => ({ ...prev, ...s1.errors }));
        setFeedback({
          type: "error",
          message: "Please fill all mandatory fields!",
        });
        toast.error("Please fill all mandatory fields!");
        return;
      }
      setFeedback({ type: "", message: "" });
      setCompletedSteps((prev) => ({ ...prev, 1: true }));
      if (targetStep > 2) {
        const s2 = validateStep2(getStep2Data());
        if (!s2.isValid) {
          setErrors((prev) => ({ ...prev, ...s2.errors }));
          setCurrentStep(2);
          setFeedback({
            type: "error",
            message: "Please fill all mandatory fields!",
          });
          toast.error("Please fill all mandatory fields!");
          return;
        }
        setCompletedSteps((prev) => ({ ...prev, 2: true }));
      }
    } else if (currentStep === 2) {
      const s2 = validateStep2(getStep2Data());
      if (!s2.isValid) {
        setErrors((prev) => ({ ...prev, ...s2.errors }));
        setFeedback({
          type: "error",
          message: "Please fill all mandatory fields!",
        });
        toast.error("Please fill all mandatory fields!");
        return;
      }
      setFeedback({ type: "", message: "" });
      setCompletedSteps((prev) => ({ ...prev, 2: true }));
      if (targetStep > 3) {
        const s3 = validateStep3(getStep3Data());
        if (!s3.isValid) {
          setErrors((prev) => ({ ...prev, ...s3.errors }));
          setCurrentStep(3);
          const msg =
            s3.errors.gstIn || s3.errors.companyPan || "Please fill all mandatory fields!";
          setFeedback({ type: "error", message: msg });
          toast.error(msg);
          return;
        }
        setCompletedSteps((prev) => ({ ...prev, 3: true }));
      }
    } else if (currentStep === 3) {
      const s3 = validateStep3(getStep3Data());
      if (!s3.isValid) {
        setErrors((prev) => ({ ...prev, ...s3.errors }));
        const msg =
          s3.errors.gstIn || s3.errors.companyPan || "Please fill all mandatory fields!";
        setFeedback({ type: "error", message: msg });
        toast.error(msg);
        return;
      }
      setFeedback({ type: "", message: "" });
      setCompletedSteps((prev) => ({ ...prev, 3: true }));
    }

    setCurrentStep(targetStep);
  };

  // Dynamic Full Address for Step 4 Summary
  const formattedSummaryAddress = [
    addressLine1,
    addressLine2,
    city,
    stateVal,
    countryVal,
    pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Subtitle Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "17px",
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
            mb: 0.5,
          }}
        >
          Organization Settings
        </Typography>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#6B7280",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Manage your company profile, timezone and regional preferences
        </Typography>
      </Box>

      {/* Stepper Progress Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 4,
          overflowX: "auto",
          py: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {STEPPER_STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = Boolean(completedSteps[step.id]);

          return (
            <React.Fragment key={step.id}>
              <Box
                onClick={() => handleStepClick(step.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
              >
                {/* Step Circle Icon */}
                {isCompleted ? (
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: ACCENT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckIcon sx={{ fontSize: 12, color: "#FFFFFF" }} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: isActive
                        ? `5px solid ${ACCENT}`
                        : "2px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                    }}
                  />
                )}

                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: isActive ? 700 : isCompleted ? 500 : 400,
                    color: isActive
                      ? ACCENT
                      : isCompleted
                        ? "#4B5563"
                        : "#94A3B8",
                    fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.label}
                </Typography>
              </Box>

              {/* Connecting Line */}
              {idx < STEPPER_STEPS.length - 1 && (
                <Box
                  sx={{
                    width: 40,
                    height: "1.5px",
                    backgroundColor: completedSteps[step.id] ? ACCENT : "#E2E8F0",
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* STEP 1: Basic Information Form Card */}
      {currentStep === 1 && (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            p: { xs: 3, md: 4 },
            maxWidth: "672px",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 2,
              mt: 1.3,
            }}
          >
            Basic Information
          </Typography>
          <Divider sx={{ mb: 3, backgroundColor: "#d1d7e4" }} />

          {feedback.message && (
            <Alert
              severity={feedback.type || "error"}
              sx={{ mb: 2.5, borderRadius: "8px" }}
            >
              {feedback.message}
            </Alert>
          )}

          {/* Logo Upload Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "12px",
                border: errors.logo
                  ? "1.5px dashed #EF4444"
                  : `1.5px dashed ${ACCENT}`,
                backgroundColor: errors.logo ? "#FEF2F2" : "#F7FEE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {logo ? (
                <Box
                  component="img"
                  src={getFormattedLogoUrl(logo)}
                  alt="Logo Preview"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    p: 0.5,
                  }}
                />
              ) : (
                <OrganizationLogoIcon size={32} />
              )}
            </Box>

            <Box>
              <Button
                variant="outlined"
                startIcon={
                  <FileUploadOutlinedIcon
                    sx={{ fontSize: 16, color: "#334155" }}
                  />
                }
                component="label"
                sx={{
                  border: errors.logo
                    ? "1px solid #EF4444"
                    : "1px solid #CBD5E1",
                  color: "#334155",
                  backgroundColor: "#FFFFFF",
                  textTransform: "none",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: "13px",
                  borderRadius: "6px",
                  px: 2,
                  py: 0.8,
                  mb: 0.5,
                  "&:hover": {
                    backgroundColor: "#F8FAFC",
                    borderColor: errors.logo ? "#DC2626" : "#94A3B8",
                  },
                }}
              >
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoChange}
                />
              </Button>
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#6B7280",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                PNG, JPG up to 2MB. Recommended: 200×200px
              </Typography>
              <FieldError error={errors.logo} />
            </Box>
          </Box>

          {/* Form Fields */}
          <Stack spacing={2.5}>
            <Box>
              <FieldLabel required>Organization Name</FieldLabel>
              <TextField
                fullWidth
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  clearFieldError("orgName");
                }}
                onBlur={() => handleBlur("orgName")}
                placeholder="Technologies Pvt Ltd"
                sx={getFieldStyles(Boolean(errors.orgName))}
              />
              <FieldError error={errors.orgName} />
            </Box>

            <Box>
              <FieldLabel required>Display Name</FieldLabel>
              <TextField
                fullWidth
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  clearFieldError("displayName");
                }}
                onBlur={() => handleBlur("displayName")}
                placeholder="Technologies Pvt Ltd"
                sx={getFieldStyles(Boolean(errors.displayName))}
              />
              <FieldError error={errors.displayName} />
            </Box>

            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Industry / Business Type</FieldLabel>
                <TextField
                  fullWidth
                  value={industryType}
                  onChange={(e) => {
                    setIndustryType(e.target.value);
                    clearFieldError("industryType");
                  }}
                  placeholder="e.g. Information Technology"
                  sx={getFieldStyles(Boolean(errors.industryType))}
                />
                <FieldError error={errors.industryType} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Company Website</FieldLabel>
                <TextField
                  fullWidth
                  value={companyWebsite}
                  onChange={(e) => {
                    setCompanyWebsite(e.target.value);
                    clearFieldError("companyWebsite");
                  }}
                  onBlur={() => handleBlur("companyWebsite")}
                  placeholder="https://example.com"
                  sx={getFieldStyles(Boolean(errors.companyWebsite))}
                />
                <FieldError error={errors.companyWebsite} />
              </Box>
            </Box>

            <Box>
              <FieldLabel required>Company Description</FieldLabel>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={companyDesc}
                onChange={(e) => {
                  setCompanyDesc(e.target.value);
                  clearFieldError("companyDesc");
                }}
                onBlur={() => handleBlur("companyDesc")}
                placeholder="Brief description about the organization (minimum 10 characters)"
                sx={{
                  ...getFieldStyles(Boolean(errors.companyDesc)),
                  "& .MuiOutlinedInput-root": {
                    ...getFieldStyles(Boolean(errors.companyDesc))[
                      "& .MuiOutlinedInput-root"
                    ],
                    height: "auto",
                  },
                }}
              />
              <FieldError error={errors.companyDesc} />
            </Box>
          </Stack>
        </Paper>
      )}

      {/* STEP 2: Contact Information Form Card */}
      {currentStep === 2 && (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            p: { xs: 3, md: 4 },
            maxWidth: "672px",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 2,
              mt: 1.3,
            }}
          >
            Contact Information
          </Typography>
          <Divider sx={{ mb: 3, backgroundColor: "#d1d7e4" }} />

          {feedback.message && (
            <Alert
              severity={feedback.type || "error"}
              sx={{ mb: 2.5, borderRadius: "8px" }}
            >
              {feedback.message}
            </Alert>
          )}

          <Stack spacing={2.5}>
            {/* Address Line 1 */}
            <Box>
              <FieldLabel required>Address Line 1</FieldLabel>
              <TextField
                fullWidth
                value={addressLine1}
                onChange={(e) => {
                  setAddressLine1(e.target.value);
                  clearFieldError("addressLine1");
                }}
                onBlur={() => handleBlur("addressLine1")}
                placeholder="Door / Building No, Street"
                sx={getFieldStyles(Boolean(errors.addressLine1))}
              />
              <FieldError error={errors.addressLine1} />
            </Box>

            {/* Address Line 2 */}
            <Box>
              <FieldLabel required>Address Line 2</FieldLabel>
              <TextField
                fullWidth
                value={addressLine2}
                onChange={(e) => {
                  setAddressLine2(e.target.value);
                  clearFieldError("addressLine2");
                }}
                onBlur={() => handleBlur("addressLine2")}
                placeholder="Area, Landmark"
                sx={getFieldStyles(Boolean(errors.addressLine2))}
              />
              <FieldError error={errors.addressLine2} />
            </Box>

            {/* City & State */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>City</FieldLabel>
                <TextField
                  fullWidth
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearFieldError("city");
                  }}
                  onBlur={() => handleBlur("city")}
                  placeholder="Chennai"
                  sx={getFieldStyles(Boolean(errors.city))}
                />
                <FieldError error={errors.city} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>State</FieldLabel>
                <Select
                  fullWidth
                  value={stateVal}
                  onChange={(e) => {
                    setStateVal(e.target.value);
                    clearFieldError("stateVal");
                  }}
                  onBlur={() => handleBlur("stateVal")}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={getSelectFieldStyles(Boolean(errors.stateVal))}
                >
                  <MenuItem value="Tamilnadu">Tamilnadu</MenuItem>
                  <MenuItem value="Karnataka">Karnataka</MenuItem>
                  <MenuItem value="Kerala">Kerala</MenuItem>
                  <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                  <MenuItem value="Andhra Pradesh">Andhra Pradesh</MenuItem>
                  <MenuItem value="Telangana">Telangana</MenuItem>
                  <MenuItem value="Delhi">Delhi</MenuItem>
                  <MenuItem value="Gujarat">Gujarat</MenuItem>
                </Select>
                <FieldError error={errors.stateVal} />
              </Box>
            </Box>

            {/* Country & Pincode */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Country</FieldLabel>
                <Select
                  fullWidth
                  value={countryVal}
                  onChange={(e) => {
                    setCountryVal(e.target.value);
                    clearFieldError("countryVal");
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={getSelectFieldStyles(Boolean(errors.countryVal))}
                >
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="United States">United States</MenuItem>
                  <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                  <MenuItem value="Singapore">Singapore</MenuItem>
                </Select>
                <FieldError error={errors.countryVal} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Pincode</FieldLabel>
                <TextField
                  fullWidth
                  value={pincode}
                  onChange={handlePincodeChange}
                  onBlur={() => handleBlur("pincode")}
                  placeholder="600001"
                  inputProps={{ maxLength: 6 }}
                  sx={getFieldStyles(Boolean(errors.pincode))}
                />
                <FieldError error={errors.pincode} />
              </Box>
            </Box>

            {/* Official Email address & Official Contact Number */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Official Email address</FieldLabel>
                <TextField
                  fullWidth
                  value={officialEmail}
                  onChange={(e) => {
                    setOfficialEmail(e.target.value);
                    clearFieldError("officialEmail");
                  }}
                  onBlur={() => handleBlur("officialEmail")}
                  placeholder="official@company.com"
                  sx={getFieldStyles(Boolean(errors.officialEmail))}
                />
                <FieldError error={errors.officialEmail} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Official Contact Number</FieldLabel>
                <TextField
                  fullWidth
                  value={officialContact}
                  onChange={handleContactChange}
                  onBlur={() => handleBlur("officialContact")}
                  placeholder="9876543210"
                  inputProps={{ maxLength: 10 }}
                  sx={getFieldStyles(Boolean(errors.officialContact))}
                />
                <FieldError error={errors.officialContact} />
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* STEP 3: Business Information Form Card */}
      {currentStep === 3 && (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            p: { xs: 3, md: 4 },
            maxWidth: "672px",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 2,
              mt: 1.3,
            }}
          >
            Business Information
          </Typography>
          <Divider sx={{ mb: 3, backgroundColor: "#d1d7e4" }} />

          {feedback.message && (
            <Alert
              severity={feedback.type || "error"}
              sx={{ mb: 2.5, borderRadius: "8px" }}
            >
              {feedback.message}
            </Alert>
          )}

          <Stack spacing={2.5}>
            {/* GST IN & Company Pan Card */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>GST IN</FieldLabel>
                <TextField
                  fullWidth
                  value={gstIn}
                  onChange={handleGstChange}
                  onBlur={() => handleBlur("gstIn")}
                  placeholder="33AAAAA0000A1Z5"
                  inputProps={{ maxLength: 15 }}
                  sx={getFieldStyles(Boolean(errors.gstIn))}
                />
                <FieldError error={errors.gstIn} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Company Pan Card</FieldLabel>
                <TextField
                  fullWidth
                  value={companyPan}
                  onChange={handlePanChange}
                  onBlur={() => handleBlur("companyPan")}
                  placeholder="AAAAA0000A"
                  inputProps={{ maxLength: 10 }}
                  sx={getFieldStyles(Boolean(errors.companyPan))}
                />
                <FieldError error={errors.companyPan} />
              </Box>
            </Box>

            {/* Date Format & Time Format */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Date Format</FieldLabel>
                <Select
                  fullWidth
                  value={dateFormat}
                  onChange={(e) => {
                    setDateFormat(e.target.value);
                    clearFieldError("dateFormat");
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={getSelectFieldStyles(Boolean(errors.dateFormat))}
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
                <FieldError error={errors.dateFormat} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Time Format</FieldLabel>
                <Select
                  fullWidth
                  value={timeFormat}
                  onChange={(e) => {
                    setTimeFormat(e.target.value);
                    clearFieldError("timeFormat");
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={getSelectFieldStyles(Boolean(errors.timeFormat))}
                >
                  <MenuItem value="24hrs">24hrs</MenuItem>
                  <MenuItem value="12hrs">12hrs</MenuItem>
                </Select>
                <FieldError error={errors.timeFormat} />
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* STEP 4: Review & Create Form Card */}
      {currentStep === 4 && (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            p: { xs: 3, md: 4 },
            maxWidth: "485px",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.03)",
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#0F172A",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Organization Summary
            </Typography>
          </Box>

          <Divider sx={{ mb: 2.5, backgroundColor: "#d1d7e4" }} />

          {feedback.message && (
            <Alert
              severity={feedback.type || "error"}
              sx={{ mb: 2.5, borderRadius: "8px" }}
            >
              {feedback.message}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* 1. Basic Information Section */}
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  mb: 1.5,
                }}
              >
                Basic Information
              </Typography>

              {/* Row 1: Org Name + Logo Preview */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Organization Name
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {orgName || "-"}
                  </Typography>
                </Box>

                {/* Uploaded Logo or Fallback Icon */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "6px",
                    backgroundColor: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {logo ? (
                    <Box
                      component="img"
                      src={getFormattedLogoUrl(logo)}
                      alt="Logo"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        p: 0.3,
                      }}
                    />
                  ) : (
                    <OrganizationLogoIcon size={20} />
                  )}
                </Box>
              </Box>

              {/* Row 2: Display Name & Industry */}
              <Box
                sx={{ display: "flex", gap: "20px", width: "100%", mb: 1.5 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Display Name
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {displayName || "-"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Industry
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {industryType || "-"}
                  </Typography>
                </Box>
              </Box>

              {/* Row 3: Website & Description */}
              <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Company Website
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {companyWebsite || "-"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Company Description
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {companyDesc || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 2. Contact Information Section */}
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  mb: 1.5,
                }}
              >
                Contact Information
              </Typography>

              {/* Dynamic Address Row */}
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#94A3B8",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Address
                </Typography>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1E293B",
                    fontFamily: "Inter, sans-serif",
                    lineHeight: 1.4,
                  }}
                >
                  {formattedSummaryAddress || "-"}
                </Typography>
              </Box>

              {/* Email & Phone */}
              <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Official Email Address
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {officialEmail || "-"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Official Contact Number
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {officialContact || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 3. Business Information Section */}
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  mb: 1.5,
                }}
              >
                Business Information
              </Typography>

              {/* GST & PAN */}
              <Box
                sx={{ display: "flex", gap: "20px", width: "100%", mb: 1.5 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    GST IN
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {gstIn || "-"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Company Pan Card
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {companyPan || "-"}
                  </Typography>
                </Box>
              </Box>

              {/* Date Format & Time Format */}
              <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Date Format
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {dateFormat || "-"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "#94A3B8",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Time Format
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {timeFormat || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Footer Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 2,
          maxWidth: currentStep === 4 ? "485px" : "672px",
          mt: 3,
        }}
      >
        {currentStep > 1 && (
          <Button
            variant="outlined"
            onClick={handleBackStep}
            sx={{
              backgroundColor: "#E6E6E6",
              border: "1px solid #D1D5DB",
              color: "#374151",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "none",
              minWidth: "90px",
              height: "30px",
              borderRadius: "5px",
              boxSizing: "border-box",
              "&:hover": {
                backgroundColor: "#D9D9D9",
                borderColor: "#9CA3AF",
              },
            }}
          >
            Back
          </Button>
        )}

        <Button
          variant="contained"
          onClick={handleNextStep}
          disabled={isSubmitting}
          sx={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            textTransform: "none",
            minWidth: currentStep === 4 ? "150px" : "100px",
            height: "30px",
            borderRadius: "5px",
            boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
            boxSizing: "border-box",
            "&:hover": {
              backgroundColor: "#7EC610",
              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
            },
            "&.Mui-disabled": {
              backgroundColor: "#D1D5DB",
              color: "#9CA3AF",
            },
          }}
        >
          {isSubmitting
            ? "Creating..."
            : currentStep === 4
              ? "Create Organization"
              : "Next"}
        </Button>
      </Box>
    </Box>
  );
}
