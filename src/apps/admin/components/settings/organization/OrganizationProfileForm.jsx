import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Divider,
  Grid,
  Stack,
  MenuItem,
  Select,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const ACCENT = "#90D916";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#F2F2F2",
    borderRadius: "5px",
    height: "36px",
    opacity: 1,
    "& fieldset": { border: "0.5px solid #00000017" },
    "&:hover fieldset": { border: "0.5px solid #00000017" },
    "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
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
};

const selectFieldStyles = {
  backgroundColor: "#F2F2F2",
  borderRadius: "5px",
  height: "36px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  color: "#2B2B2B",
  "& fieldset": { border: "0.5px solid #00000017" },
  "&:hover fieldset": { border: "0.5px solid #00000017" },
  "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
  "& .MuiSelect-select": {
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
  },
};

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

function OrganizationLogoIcon() {
  return (
    <Box
      component="svg"
      width="32"
      height="32"
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

export default function OrganizationProfileForm({ onNext, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);

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
  const [stateVal, setStateVal] = useState("");
  const [countryVal, setCountryVal] = useState("India");
  const [pincode, setPincode] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [officialContact, setOfficialContact] = useState("");

  // Step 3 State (Business Information)
  const [gstIn, setGstIn] = useState("");
  const [companyPan, setCompanyPan] = useState("");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState("24hrs");

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else if (onNext) {
      onNext({
        logo,
        logoFile,
        orgName,
        displayName,
        industryType,
        companyWebsite,
        companyDesc,
        addressLine1,
        addressLine2,
        city,
        stateVal,
        countryVal,
        pincode,
        officialEmail,
        officialContact,
        gstIn,
        companyPan,
        dateFormat,
        timeFormat,
      });
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

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

      {/* Stepper Progress Bar matching Image media_1788428841074.png */}
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
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <Box
                onClick={() => setCurrentStep(step.id)}
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
                    backgroundColor: currentStep > step.id ? ACCENT : "#E2E8F0",
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
            }}
          >
            Basic Information
          </Typography>
          <Divider sx={{ mb: 3, backgroundColor: "#d1d7e4" }} />

          {/* Logo Upload Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "12px",
                border: `1.5px dashed ${ACCENT}`,
                backgroundColor: "#F7FEE7",
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
                  sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5 }}
                />
              ) : (
                <OrganizationLogoIcon />
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
                  border: "1px solid #CBD5E1",
                  color: "#334155",
                  backgroundColor: "#FFFFFF",
                  textTransform: "none",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  borderRadius: "6px",
                  px: 2,
                  py: 0.6,
                  mb: 0.8,
                  "&:hover": {
                    backgroundColor: "#F8FAFC",
                    borderColor: "#94A3B8",
                  },
                }}
              >
                Upload Logo
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
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
            </Box>
          </Box>

          {/* Form Fields */}
          <Stack spacing={2.5}>
            <Box>
              <FieldLabel required>Organization Name</FieldLabel>
              <TextField
                fullWidth
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Code99 Technologies Pvt Ltd"
                sx={fieldStyles}
              />
            </Box>

            <Box>
              <FieldLabel required>Display Name</FieldLabel>
              <TextField
                fullWidth
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Code99 Technologies Pvt Ltd"
                sx={fieldStyles}
              />
            </Box>

            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Industry / Business Type</FieldLabel>
                <TextField
                  fullWidth
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  placeholder="admin@code99.in"
                  sx={fieldStyles}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Company Website</FieldLabel>
                <TextField
                  fullWidth
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="+91 98765 43210"
                  sx={fieldStyles}
                />
              </Box>
            </Box>

            <Box>
              <FieldLabel required>Company Description</FieldLabel>
              <TextField
                fullWidth
                value={companyDesc}
                onChange={(e) => setCompanyDesc(e.target.value)}
                placeholder="Code99 Technologies Pvt Ltd"
                sx={fieldStyles}
              />
            </Box>
          </Stack>
        </Paper>
      )}

      {/* STEP 2: Contact Information Form Card matching Image media_1788428841074.png */}
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
            }}
          >
            Contact Information
          </Typography>
          <Divider sx={{ mb: 3, backgroundColor: "#d1d7e4" }} />

          <Stack spacing={2.5}>
            {/* Address Line 1 */}
            <Box>
              <FieldLabel required>Address Line 1</FieldLabel>
              <TextField
                fullWidth
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Code99 Technologies Pvt Ltd"
                sx={fieldStyles}
              />
            </Box>

            {/* Address Line 2 */}
            <Box>
              <FieldLabel required>Address Line 2</FieldLabel>
              <TextField
                fullWidth
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Code99 Technologies Pvt Ltd"
                sx={fieldStyles}
              />
            </Box>

            {/* City & State */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>City</FieldLabel>
                <TextField
                  fullWidth
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Chennai"
                  sx={fieldStyles}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>State</FieldLabel>
                <Select
                  fullWidth
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={selectFieldStyles}
                >
                  <MenuItem value="Tamilnadu">Tamilnadu</MenuItem>
                  <MenuItem value="Karnataka">Karnataka</MenuItem>
                  <MenuItem value="Kerala">Kerala</MenuItem>
                  <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                </Select>
              </Box>
            </Box>

            {/* Country & Pincode */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Country</FieldLabel>
                <Select
                  fullWidth
                  value={countryVal}
                  onChange={(e) => setCountryVal(e.target.value)}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={selectFieldStyles}
                >
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="United States">United States</MenuItem>
                  <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                  <MenuItem value="Singapore">Singapore</MenuItem>
                </Select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Pincode</FieldLabel>
                <TextField
                  fullWidth
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="620020"
                  sx={fieldStyles}
                />
              </Box>
            </Box>

            {/* Official Email address & Official Contact Number */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Official Email address</FieldLabel>
                <TextField
                  fullWidth
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  placeholder="Code99@gmail.com"
                  sx={fieldStyles}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Official Contact Number</FieldLabel>
                <TextField
                  fullWidth
                  value={officialContact}
                  onChange={(e) => setOfficialContact(e.target.value)}
                  placeholder="+ 91"
                  sx={fieldStyles}
                />
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* STEP 3: Business Information Form Card matching Image media_1788429809477.png */}
      {currentStep === 3 && (
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            p: { xs: 3, md: 4 },
            maxWidth: "672px",
            height:"300px",
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
              mt:1.3,
            }}
          >
            Business Information
          </Typography>
          <Divider sx={{ mb: 3, backgroundColor: "#d1d7e4" }} />

          <Stack spacing={2.5}>
            {/* GST IN & Company Pan Card */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>GST IN</FieldLabel>
                <TextField
                  fullWidth
                  value={gstIn}
                  onChange={(e) => setGstIn(e.target.value)}
                  placeholder="Chennai"
                  sx={fieldStyles}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Company Pan Card</FieldLabel>
                <TextField
                  fullWidth
                  value={companyPan}
                  onChange={(e) => setCompanyPan(e.target.value)}
                  placeholder="e.g. ABCDE1234F"
                  sx={fieldStyles}
                />
              </Box>
            </Box>

            {/* Date Format & Time Format */}
            <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Date Format</FieldLabel>
                <Select
                  fullWidth
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={selectFieldStyles}
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel required>Time Format</FieldLabel>
                <Select
                  fullWidth
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  IconComponent={KeyboardArrowDownIcon}
                  sx={selectFieldStyles}
                >
                  <MenuItem value="12hrs">12hrs</MenuItem>
                  <MenuItem value="24hrs">24hrs</MenuItem>
                </Select>
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
          <Box
            sx={{
              mb: 2,
            }}
          >
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

              {/* Row 1: Org Name + Logo Icon */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Organization Name
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {orgName}
                  </Typography>
                </Box>
                <OrganizationLogoIcon />
              </Box>

              {/* Row 2: Display Name & Industry */}
              <Box sx={{ display: "flex", gap: "20px", width: "100%", mb: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Display Name
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {displayName}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Industry
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {industryType}
                  </Typography>
                </Box>
              </Box>

              {/* Row 3: Website & Description */}
              <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Company Website
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {companyWebsite}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Company Description
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {companyDesc}
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

              {/* Address Row */}
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                  Address
                </Typography>
                <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
                  First Floor, No 16, bus stand, Taramani Link Rd, opposite to Velachery, Vijaya Nagar, Velachery, Chennai, Tamil Nadu 600042
                </Typography>
              </Box>

              {/* Email & Phone */}
              <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Official Email Address
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {officialEmail}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Official Contact Number
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {officialContact}
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
              <Box sx={{ display: "flex", gap: "20px", width: "100%", mb: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px",fontWeight:500, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    GST IN
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {gstIn || "-"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Company Pan Card
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {companyPan || "-"}
                  </Typography>
                </Box>
              </Box>

              {/* Date Format & Time Format */}
              <Box sx={{ display: "flex", gap: "20px", width: "100%" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Date Format
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {dateFormat || "-"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "10px", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Time Format
                  </Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", fontFamily: "Inter, sans-serif" }}>
                    {timeFormat || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Footer Actions (Back & Next/Save/Create Buttons) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 2,
          maxWidth: currentStep === 4 ? "480px" : "672px",
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
          }}
        >
          {currentStep === 4 ? "Create Organization" : "Next"}
        </Button>
      </Box>
    </Box>
  );
}
