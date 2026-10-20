import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import api from "@/shared/services/axios";

const ACCENT = "#90D916";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "6px",
    height: "38px",
    opacity: 1,
    "& fieldset": { border: "1px solid #E2E8F0" },
    "&:hover fieldset": { border: "1px solid #CBD5E1" },
    "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
  },
  "& .MuiInputBase-input": {
    padding: "8px 12px",
    fontSize: "13.5px",
    fontFamily: "Inter, sans-serif",
    height: "38px",
    boxSizing: "border-box",
    color: "#1E293B",
  },
};

const selectFieldStyles = {
  backgroundColor: "#FFFFFF",
  borderRadius: "6px",
  height: "38px",
  fontFamily: "Inter, sans-serif",
  fontSize: "13.5px",
  color: "#1E293B",
  "& fieldset": { border: "1px solid #E2E8F0" },
  "&:hover fieldset": { border: "1px solid #CBD5E1" },
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
  fontSize: "13px",
  color: "#334155",
  mb: 0.6,
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={labelStyles}>
      {children}
      {required && (
        <Box component="span" sx={{ color: "#334155" }}>
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

function ModalLogoPreview({ logo }) {
  const fullSrc = getFormattedLogoUrl(logo);
  const [blobSrc, setBlobSrc] = useState("");

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    if (!fullSrc) {
      setBlobSrc("");
      return;
    }

    if (fullSrc.startsWith("data:")) {
      setBlobSrc(fullSrc);
      return;
    }

    const fetchBlob = async () => {
      try {
        const response = await api.get(fullSrc, { responseType: "blob" });
        if (active) {
          const url = URL.createObjectURL(response.data);
          createdUrl = url;
          setBlobSrc(url);
        }
      } catch (err) {
        if (active) setBlobSrc(fullSrc);
      }
    };

    fetchBlob();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fullSrc]);

  if (blobSrc) {
    return (
      <Box
        component="img"
        src={blobSrc}
        alt="Logo Preview"
        sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5 }}
      />
    );
  }

  return <OrganizationLogoIcon />;
}

export default function EditOrganizationModal({
  open,
  onClose,
  onSave,
  initialData = {},
}) {
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [countryVal, setCountryVal] = useState("");
  const [pincode, setPincode] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [officialContact, setOfficialContact] = useState("");
  const [gstIn, setGstIn] = useState("");
  const [companyPan, setCompanyPan] = useState("");
  const [dateFormat, setDateFormat] = useState("");
  const [timeFormat, setTimeFormat] = useState("");

  useEffect(() => {
    if (open) {
      setLogo(initialData.logo || initialData.logo_url || "");
      setLogoFile(null);
      setOrgName(initialData.orgName || "");
      setDisplayName(initialData.displayName || "");
      setIndustryType(initialData.industryType || "");
      setCompanyWebsite(initialData.companyWebsite || "");
      setCompanyDesc(initialData.companyDesc || "");
      setAddressLine1(initialData.addressLine1 || "");
      setAddressLine2(initialData.addressLine2 || "");
      setCity(initialData.city || "");
      setStateVal(initialData.stateVal || "");
      setCountryVal(initialData.countryVal || initialData.country || "");
      setPincode(initialData.pincode || "");
      setOfficialEmail(initialData.officialEmail || "");
      setOfficialContact(initialData.officialContact || "");
      setGstIn(initialData.gstIn || "");
      setCompanyPan(initialData.companyPan || "");
      setDateFormat(initialData.dateFormat || initialData.date_format || "");
      setTimeFormat(initialData.timeFormat || initialData.time_format || "");
    }
  }, [open, initialData]);

  if (!open) return null;

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

  const handleSaveDetails = () => {
    const updatedData = {
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
    };
    if (onSave) {
      onSave(updatedData);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "736px",
          maxWidth: "95vw",
          maxHeight: "88vh",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          p: 0,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      {/* 1. Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E2E8F0",
          flexShrink: 0,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "16px",
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Edit Organization
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "#64748B", p: 0.5 }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* 2. Scrollable Body Content matching media_1788592026690.png */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          backgroundColor: "#FFFFFF",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CBD5E1",
            borderRadius: "4px",
          },
        }}
      >
        {/* Logo Upload Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 0.5 }}>
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
            <ModalLogoPreview logo={logo} />
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
              <input
                type="file"
                hidden
                accept="image/*"
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
          </Box>
        </Box>

        {/* Organization Name */}
        <Box>
          <FieldLabel required>Organization Name</FieldLabel>
          <TextField
            fullWidth
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            sx={fieldStyles}
          />
        </Box>

        {/* Display Name */}
        <Box>
          <FieldLabel required>Display Name</FieldLabel>
          <TextField
            fullWidth
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            sx={fieldStyles}
          />
        </Box>

        {/* Industry & Company Website */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel>Industry / Business Type</FieldLabel>
            <TextField
              fullWidth
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              sx={fieldStyles}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <FieldLabel>Company Website</FieldLabel>
            <TextField
              fullWidth
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              sx={fieldStyles}
            />
          </Box>
        </Box>

        {/* Company Description */}
        <Box>
          <FieldLabel required>Company Description</FieldLabel>
          <TextField
            fullWidth
            value={companyDesc}
            onChange={(e) => setCompanyDesc(e.target.value)}
            sx={fieldStyles}
          />
        </Box>

        {/* Address Line 1 */}
        <Box>
          <FieldLabel required>Address Line 1</FieldLabel>
          <TextField
            fullWidth
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
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
            sx={fieldStyles}
          />
        </Box>

        {/* City & State */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>City</FieldLabel>
            <TextField
              fullWidth
              value={city}
              onChange={(e) => setCity(e.target.value)}
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
            </Select>
          </Box>
        </Box>

        {/* Country & Pincode */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
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
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>Pincode</FieldLabel>
            <TextField
              fullWidth
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              sx={fieldStyles}
            />
          </Box>
        </Box>

        {/* Official Email address & Official Contact Number */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>Official Email address</FieldLabel>
            <TextField
              fullWidth
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
              sx={fieldStyles}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>Official Contact Number</FieldLabel>
            <TextField
              fullWidth
              value={officialContact}
              onChange={(e) => setOfficialContact(e.target.value)}
              sx={fieldStyles}
            />
          </Box>
        </Box>

        {/* GST IN & Company Pan Card */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>GST IN</FieldLabel>
            <TextField
              fullWidth
              value={gstIn}
              onChange={(e) => setGstIn(e.target.value)}
              placeholder="Enter GST IN"
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
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
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
      </Box>

      {/* 3. Footer Action Buttons */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
          borderTop: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            border: "1px solid #CBD5E1",
            color: "#475569",
            backgroundColor: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13.5px",
            textTransform: "none",
            height: "36px",
            px: 2.5,
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#F8FAFC",
              borderColor: "#94A3B8",
              boxShadow: "none",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveDetails}
          sx={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13.5px",
            textTransform: "none",
            height: "36px",
            px: 2.5,
            borderRadius: "6px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
            "&:hover": {
              backgroundColor: "#7EC610",
            },
          }}
        >
          Save Details
        </Button>
      </Box>
    </Dialog>
  );
}
