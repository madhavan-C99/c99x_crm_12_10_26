import { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { toast } from "react-toastify";
import { API_BASE_URL } from "@/shared/config/env";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateAllOrganizationSteps,
} from "@/shared/utils/validators";

const ACCENT = "#90D916";

const getFieldStyles = (hasError) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: hasError ? "#FEF2F2" : "#FFFFFF",
    borderRadius: "6px",
    height: "38px",
    opacity: 1,
    "& fieldset": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : "1px solid #E2E8F0",
    },
    "&:hover fieldset": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : "1px solid #CBD5E1",
    },
    "&.Mui-focused fieldset": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : `1px solid ${ACCENT}`,
    },
  },
  "& .MuiInputBase-input": {
    padding: "8px 12px",
    fontSize: "13.5px",
    fontFamily: "Inter, sans-serif",
    height: "38px",
    boxSizing: "border-box",
    color: "#1E293B",
  },
});

const getSelectFieldStyles = (hasError) => ({
  backgroundColor: hasError ? "#FEF2F2" : "#FFFFFF",
  borderRadius: "6px",
  height: "38px",
  fontFamily: "Inter, sans-serif",
  fontSize: "13.5px",
  color: "#1E293B",
  "& fieldset": {
    border: hasError
      ? "1.5px solid #EF4444 !important"
      : "1px solid #E2E8F0",
  },
  "&:hover fieldset": {
    border: hasError
      ? "1.5px solid #EF4444 !important"
      : "1px solid #CBD5E1",
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
  fontSize: "13px",
  color: "#334155",
  mb: 0.6,
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={labelStyles}>
      {children}
      {required && (
        <Box component="span" sx={{ color: "#EF4444" }}>
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

// Helper: Safely resolve absolute URL with fallback base URL
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
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  let finalUrl = `${baseUrl}${cleanPath}`;
  if (finalUrl.startsWith("http://")) {
    finalUrl = finalUrl.replace(/^http:\/\//i, "https://");
  }
  return finalUrl;
}

// Logo Preview directly using <img> with fallback on error
function ModalLogoPreview({ logo }) {
  const fullSrc = getFormattedLogoUrl(logo);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [fullSrc]);

  if (fullSrc && !hasError) {
    return (
      <Box
        component="img"
        src={fullSrc}
        alt="Logo Preview"
        onError={() => setHasError(true)}
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
  const [stateVal, setStateVal] = useState("Tamilnadu");
  const [countryVal, setCountryVal] = useState("India");
  const [pincode, setPincode] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [officialContact, setOfficialContact] = useState("");
  const [gstIn, setGstIn] = useState("");
  const [companyPan, setCompanyPan] = useState("");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState("24hrs");
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    if (open) {
      // 1. முழுமையான URL-க்கு முதல் முன்னுரிமை
      const initialLogo =
        initialData.logo_url || initialData.logoUrl || initialData.logo || "";

      setLogo(initialLogo);
      setLogoFile(null);
      setErrors({});
      setFeedback({ type: "", message: "" });
      setOrgName(initialData.orgName || initialData.org_name || "");
      setDisplayName(initialData.displayName || initialData.display_name || "");
      setIndustryType(
        initialData.industryType || initialData.industry_type || "",
      );
      setCompanyWebsite(
        initialData.companyWebsite || initialData.company_website || "",
      );
      setCompanyDesc(
        initialData.companyDesc || initialData.company_description || "",
      );
      setAddressLine1(
        initialData.addressLine1 || initialData.address_line1 || "",
      );
      setAddressLine2(
        initialData.addressLine2 || initialData.address_line2 || "",
      );
      setCity(initialData.city || "");
      setStateVal(initialData.stateVal || initialData.state || "Tamilnadu");
      setCountryVal(initialData.countryVal || initialData.country || "India");
      setPincode(initialData.pincode || initialData.pin_code || "");
      setOfficialEmail(
        initialData.officialEmail || initialData.official_email || "",
      );
      setOfficialContact(
        initialData.officialContact || initialData.official_contact || "",
      );
      setGstIn(initialData.gstIn || initialData.gst_in || "");
      setCompanyPan(initialData.companyPan || initialData.company_pan || "");
      setDateFormat(
        initialData.dateFormat || initialData.date_format || "DD/MM/YYYY",
      );
      setTimeFormat(
        initialData.timeFormat || initialData.time_format || "24hrs",
      );
    }
  }, [open, initialData]);

  if (!open) return null;

  const clearFieldError = (fieldName) => {
    if (feedback.message) setFeedback({ type: "", message: "" });
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

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

  const getCurrentFormData = () => ({
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

  const handleBlur = (fieldName) => {
    const data = getCurrentFormData();
    let res = null;
    if (["orgName", "displayName", "companyWebsite", "companyDesc"].includes(fieldName)) {
      res = validateStep1(data);
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
      res = validateStep2(data);
    } else if (["gstIn", "companyPan", "dateFormat", "timeFormat"].includes(fieldName)) {
      res = validateStep3(data);
    }

    if (res && res.errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: res.errors[fieldName] }));
    }
  };

  const handleSaveDetails = () => {
    const updatedData = {
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
    };

    const { isValid, errors: allErrors } = validateAllOrganizationSteps(updatedData);

    if (!isValid) {
      setErrors(allErrors);
      setFeedback({
        type: "error",
        message: "Please fill all mandatory fields!",
      });
      toast.error("Please fill all mandatory fields!");
      return;
    }

    setFeedback({ type: "", message: "" });
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

      {/* 2. Scrollable Body Content */}
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
        {feedback.message && (
          <Alert
            severity={feedback.type || "error"}
            sx={{ mb: 1, borderRadius: "8px" }}
          >
            {feedback.message}
          </Alert>
        )}
        {/* Logo Upload Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 0.5 }}>
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
                border: errors.logo
                  ? "1px solid #EF4444"
                  : "1px solid #CBD5E1",
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

        {/* Organization Name */}
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
            sx={getFieldStyles(Boolean(errors.orgName))}
          />
          <FieldError error={errors.orgName} />
        </Box>

        {/* Display Name */}
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
            sx={getFieldStyles(Boolean(errors.displayName))}
          />
          <FieldError error={errors.displayName} />
        </Box>

        {/* Industry & Company Website */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel>Industry / Business Type</FieldLabel>
            <TextField
              fullWidth
              value={industryType}
              onChange={(e) => {
                setIndustryType(e.target.value);
                clearFieldError("industryType");
              }}
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
              sx={getFieldStyles(Boolean(errors.companyWebsite))}
            />
            <FieldError error={errors.companyWebsite} />
          </Box>
        </Box>

        {/* Company Description */}
        <Box>
          <FieldLabel required>Company Description</FieldLabel>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={companyDesc}
            onChange={(e) => {
              setCompanyDesc(e.target.value);
              clearFieldError("companyDesc");
            }}
            onBlur={() => handleBlur("companyDesc")}
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
            sx={getFieldStyles(Boolean(errors.addressLine2))}
          />
          <FieldError error={errors.addressLine2} />
        </Box>

        {/* City & State */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
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
              {stateVal &&
                !["Tamilnadu", "Karnataka", "Kerala", "Maharashtra"].includes(
                  stateVal,
                ) && <MenuItem value={stateVal}>{stateVal}</MenuItem>}
            </Select>
            <FieldError error={errors.stateVal} />
          </Box>
        </Box>

        {/* Country & Pincode */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>Country</FieldLabel>
            <Select
              fullWidth
              value={countryVal}
              onChange={(e) => {
                setCountryVal(e.target.value);
                clearFieldError("countryVal");
              }}
              onBlur={() => handleBlur("countryVal")}
              IconComponent={KeyboardArrowDownIcon}
              sx={getSelectFieldStyles(Boolean(errors.countryVal))}
            >
              <MenuItem value="India">India</MenuItem>
              <MenuItem value="United States">United States</MenuItem>
              <MenuItem value="United Kingdom">United Kingdom</MenuItem>
              <MenuItem value="Singapore">Singapore</MenuItem>
              {countryVal &&
                ![
                  "India",
                  "United States",
                  "United Kingdom",
                  "Singapore",
                ].includes(countryVal) && (
                  <MenuItem value={countryVal}>{countryVal}</MenuItem>
                )}
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
              inputProps={{ maxLength: 6 }}
              sx={getFieldStyles(Boolean(errors.pincode))}
            />
            <FieldError error={errors.pincode} />
          </Box>
        </Box>

        {/* Official Email address & Official Contact Number */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
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
              inputProps={{ maxLength: 10 }}
              sx={getFieldStyles(Boolean(errors.officialContact))}
            />
            <FieldError error={errors.officialContact} />
          </Box>
        </Box>

        {/* GST IN & Company Pan Card */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>GST IN</FieldLabel>
            <TextField
              fullWidth
              value={gstIn}
              onChange={handleGstChange}
              onBlur={() => handleBlur("gstIn")}
              placeholder="Enter GST IN"
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
              placeholder="e.g. ABCDE1234F"
              inputProps={{ maxLength: 10 }}
              sx={getFieldStyles(Boolean(errors.companyPan))}
            />
            <FieldError error={errors.companyPan} />
          </Box>
        </Box>

        {/* Date Format & Time Format */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel required>Date Format</FieldLabel>
            <Select
              fullWidth
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value);
                clearFieldError("dateFormat");
              }}
              onBlur={() => handleBlur("dateFormat")}
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
              onBlur={() => handleBlur("timeFormat")}
              IconComponent={KeyboardArrowDownIcon}
              sx={getSelectFieldStyles(Boolean(errors.timeFormat))}
            >
              <MenuItem value="12hrs">12hrs</MenuItem>
              <MenuItem value="24hrs">24hrs</MenuItem>
            </Select>
            <FieldError error={errors.timeFormat} />
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
