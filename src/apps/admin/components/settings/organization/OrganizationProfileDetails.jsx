import React from "react";
import { Box, Typography, Paper, Button, Divider } from "@mui/material";

const ACCENT = "#90D916";

// Black Rounded Square Logo Box with Green Building Icon (Fallback)
function BlackLogoBuildingIcon() {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: "8px",
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Box
        component="svg"
        width="26"
        height="26"
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
    </Box>
  );
}

// Helper: Safely resolve absolute URL with priority to full logo_url
function getFormattedLogoUrl(data = {}, logo, logoUrl) {
  // 1. First priority: full URL from backend (logo_url or logoUrl)
  const fullUrl = data?.logo_url || data?.logoUrl || logoUrl;
  if (fullUrl && typeof fullUrl === "string" && fullUrl.trim()) {
    let url = fullUrl.trim();
    return url.startsWith("http://") ? url.replace(/^http:\/\//i, "https://") : url;
  }

  // 2. Second priority: fallback to relative file path if only file name is provided
  const rawPath = data?.logo || logo;
  if (rawPath && typeof rawPath === "string" && rawPath.trim()) {
    let trimmed = rawPath.trim();
    if (trimmed.startsWith("http://")) {
      return trimmed.replace(/^http:\/\//i, "https://");
    }
    if (trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
      return trimmed;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    let finalUrl = `${cleanBase}${cleanPath}`;
    return finalUrl.startsWith("http://") ? finalUrl.replace(/^http:\/\//i, "https://") : finalUrl;
  }

  return "";
}

// Dynamic Logo renderer directly using <img> without problematic blob fetch
function OrganizationLogo({ logo, logoUrl, data }) {
  const finalSrc = React.useMemo(
    () => getFormattedLogoUrl(data, logo, logoUrl),
    [data, logo, logoUrl]
  );
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [finalSrc]);

  if (finalSrc && !hasError) {
    return (
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "8px",
          backgroundColor: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={finalSrc}
          alt="Organization Logo"
          onError={() => setHasError(true)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            p: 0.5,
          }}
        />
      </Box>
    );
  }

  return <BlackLogoBuildingIcon />;
}

// Read-only Field Component with multiline support
function ReadOnlyField({
  label,
  value,
  required = true,
  multiline = false,
  minHeight = "36px",
}) {
  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        sx={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: "12px",
          color: "#94A3B8",
          mb: 0.6,
          lineHeight: "100%",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <span>{label}</span>
        {required && (
          <Box component="span" sx={{ color: "#94A3B8", ml: 0.3 }}>
            *
          </Box>
        )}
      </Typography>
      <Box
        title={value || ""}
        sx={{
          backgroundColor: "#F1F5F9",
          border: "1px solid #E2E8F0",
          borderRadius: "6px",
          minHeight: multiline ? minHeight : "36px",
          height: multiline ? "100%" : "36px",
          flex: multiline ? 1 : undefined,
          px: 1.5,
          py: multiline ? 1 : 0,
          display: "flex",
          alignItems: multiline ? "flex-start" : "center",
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "#0F172A",
          whiteSpace: multiline ? "normal" : "nowrap",
          wordBreak: multiline ? "break-word" : "normal",
          overflowWrap: multiline ? "anywhere" : "normal",
          lineHeight: multiline ? 1.45 : "normal",
          overflow: multiline ? "visible" : "hidden",
          textOverflow: multiline ? "clip" : "ellipsis",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {value || "-"}
      </Box>
    </Box>
  );
}

export default function OrganizationProfileDetails({ data = {}, onEdit }) {
  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Organization Settings Title Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "18px",
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
            color: "#64748B",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Manage your company profile, timezone and regional preferences
        </Typography>
      </Box>

      {/* Sub-navigation Tab Link & Edit Button Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          width: "100%",
        }}
      >
        {/* Organization Profile Green Tab Link */}
        <Box sx={{ position: "relative", pb: 0.6 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: ACCENT,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Organization Profile
          </Typography>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "2px",
              backgroundColor: ACCENT,
              borderRadius: "1px",
            }}
          />
        </Box>

        {/* Edit Action Button */}
        <Button
          variant="outlined"
          onClick={onEdit}
          sx={{
            borderColor: ACCENT,
            color: ACCENT,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            textTransform: "none",
            height: "28px",
            px: 2.2,
            borderRadius: "5px",
            backgroundColor: "#FFFFFF",
            boxShadow: "none",
            "&:hover": {
              borderColor: ACCENT,
              backgroundColor: "#F7FEE7",
              boxShadow: "none",
            },
          }}
        >
          Edit
        </Button>
      </Box>

      {/* 1. Organization Profile Card */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          border: "1px solid #E2E8F0",
          p: 3,
          mb: 3,
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
            mb: 1.5,
          }}
        >
          Organization Profile
        </Typography>

        <Divider sx={{ mb: 2.5, backgroundColor: "#E2E8F0" }} />

        {/* Top Info Section: Logo on Left + 2x2 Fields Grid on Right */}
        <Box sx={{ display: "flex", gap: 4, mb: 2.5, alignItems: "flex-start" }}>
          {/* Logo & Company Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.8,
              width: "220px",
              flexShrink: 0,
              pt: 0.5,
            }}
          >
            <OrganizationLogo
              data={data}
              logo={data.logo}
              logoUrl={data.logo_url || data.logoUrl}
            />
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {data.orgName || ""}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#94A3B8",
                  fontFamily: "Inter, sans-serif",
                  mt: 0.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {data.industryType || ""}
              </Typography>
            </Box>
          </Box>

          {/* 2x2 Grid of Fields */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Row 1: Org Name & Display Name */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Organization Name"
                  value={data.orgName}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Display Name"
                  value={data.displayName}
                />
              </Box>
            </Box>

            {/* Row 2: Industry & Company Website */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Industry"
                  value={data.industryType}
                  required={false}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Company Website"
                  value={data.companyWebsite}
                  required={false}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2, backgroundColor: "#E2E8F0" }} />

        {/* Description Field */}
        <Box sx={{ width: "100%" }}>
          <Typography
            sx={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              color: "#94A3B8",
              mb: 0.5,
            }}
          >
            Description
          </Typography>
          <Box
            sx={{
              backgroundColor: "#F1F5F9",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              minHeight: "72px",
              p: 1.5,
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0F172A",
              boxSizing: "border-box",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.45,
            }}
          >
            {data.companyDesc || ""}
          </Box>
        </Box>
      </Paper>

      {/* 2. Bottom Row: Side-by-Side Cards (Contact Profile & Business Information) */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          width: "100%",
          alignItems: "stretch",
          "& > *": { flex: 1, minWidth: 0 },
        }}
      >
        {/* Left Card: Contact Profile */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            p: 3,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 1.5,
            }}
          >
            Contact Profile
          </Typography>

          <Divider sx={{ mb: 2.5, backgroundColor: "#E2E8F0" }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Row 1: Address Line 1 & Address Line 2 */}
            <Box sx={{ display: "flex", gap: 2, width: "100%", alignItems: "stretch" }}>
              <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
                <ReadOnlyField
                  label="Address Line 1"
                  value={data.addressLine1}
                  multiline
                  minHeight="54px"
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
                <ReadOnlyField
                  label="Address Line 2"
                  value={data.addressLine2}
                  multiline
                  minHeight="54px"
                />
              </Box>
            </Box>

            {/* Row 2: City & State */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="City"
                  value={data.city}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="State"
                  value={data.stateVal}
                />
              </Box>
            </Box>

            {/* Row 3: Country & Pincode */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Country"
                  value={data.countryVal}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Pincode"
                  value={data.pincode}
                />
              </Box>
            </Box>

            {/* Row 4: Official Contact No & Official Email Id */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Official Contact No"
                  value={data.officialContact}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Official Email Id"
                  value={data.officialEmail}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Right Card: Business Information */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            p: 3,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 1.5,
            }}
          >
            Business Information
          </Typography>

          <Divider sx={{ mb: 2.5, backgroundColor: "#E2E8F0" }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Row 1: GST IN & Company Pan Card */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="GST IN"
                  value={data.gstIn}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Company Pan Card"
                  value={data.companyPan}
                />
              </Box>
            </Box>

            {/* Row 2: Date Format & Time Format */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Date Format"
                  value={data.dateFormat}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReadOnlyField
                  label="Time Format"
                  value={data.timeFormat}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}