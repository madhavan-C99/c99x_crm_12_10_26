import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Paper, Button, CircularProgress } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OrganizationProfileForm from "./OrganizationProfileForm";
import OrganizationProfileDetails from "./OrganizationProfileDetails";
import EditOrganizationModal from "./EditOrganizationModal";
import {
  getOrganizationProfileAdmin,
  createOrganizationProfileAdmin,
  editOrganizationProfileAdmin,
} from "@/apps/admin/services/organizationService";
import { toast } from "react-toastify";

const ACCENT = "#90D916";

function formatOrgData(item = {}) {
  if (!item || typeof item !== "object") return {};
  const rawLogo =
    item.logo ||
    item.logo_url ||
    item.image ||
    item.company_logo ||
    item.org_logo ||
    item.profile_logo ||
    "";
  return {
    id: item.id || item.org_id,
    logo: rawLogo,
    logo_url: rawLogo,
    orgName: item.orgName || item.org_name || "",
    displayName: item.displayName || item.display_name || "",
    industryType: item.industryType || item.industry_type || item.industry || "",
    companyWebsite: item.companyWebsite || item.company_website || item.website || "",
    companyDesc: item.companyDesc || item.company_description || item.description || "",
    addressLine1: item.addressLine1 || item.address_line1 || item.address?.line1 || item.address?.street || "",
    addressLine2: item.addressLine2 || item.address_line2 || item.address?.line2 || "",
    city: item.city || item.address?.city || "",
    stateVal: item.stateVal || item.state || item.address?.state || "",
    countryVal: item.countryVal || item.country || item.address?.country || "",
    pincode: item.pincode || item.pin_code || item.address?.pincode || "",
    officialEmail: item.officialEmail || item.official_email || item.email || "",
    officialContact: item.officialContact || item.official_contact || item.phone || item.contact_no || "",
    gstIn: item.gstIn || item.gst_in || item.gstin || "",
    companyPan: item.companyPan || item.company_pan || item.pan || "",
    dateFormat: item.dateFormat || item.date_format || "",
    timeFormat: item.timeFormat || item.time_format || "",
    timezone: item.timezone || "",
    currency: item.currency || "",
    language: item.language || "",
    raw: item,
  };
}

function OrganizationFigmaIcon({ sx }) {
  return (
    <Box
      component="svg"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      sx={{ mb: 2.5, ...sx }}
    >
      {/* Outer Building Shape with Rounded Corners */}
      <path
        d="M20 18C20 13.5817 23.5817 10 28 10H36C40.4183 10 44 13.5817 44 18V24H48C52.4183 24 56 27.5817 56 32V50C56 52.2091 54.2091 54 52 54H12C9.79086 54 8 52.2091 8 50V32C8 27.5817 11.5817 24 16 24H20V18Z"
        stroke={ACCENT}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Upper Horizontal Window Line */}
      <path
        d="M27 22H37"
        stroke={ACCENT}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Lower Horizontal Window Line */}
      <path
        d="M27 30H37"
        stroke={ACCENT}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Arched Center Entrance Door */}
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

export default function OrganizationView({ onCreateProfileClick }) {
  const [viewState, setViewState] = useState("empty"); // "empty", "form", "details"
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orgData, setOrgData] = useState({});
  const [loading, setLoading] = useState(true);

  // Load Organization Profile from API
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrganizationProfileAdmin();
      const rawData = response?.data;
      const apiData = rawData?.data || rawData?.organization || rawData?.profile || rawData;

      if (apiData && (apiData.id || apiData.org_name || apiData.orgName)) {
        const formatted = formatOrgData(apiData);
        setOrgData(formatted);
        setViewState("details");
      } else {
        setViewState("empty");
      }
    } catch (err) {
      console.error("Error loading organization profile:", err);
      setViewState("empty");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleStartCreateProfile = () => {
    setViewState("form");
    if (onCreateProfileClick) {
      onCreateProfileClick();
    }
  };

  const handleFormSuccess = async (formData) => {
    try {
      setLoading(true);
      const res = await createOrganizationProfileAdmin(formData);
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "Organization Profile created successfully!");
        await loadProfile();
      } else {
        toast.error(res?.data?.message || "Failed to create organization profile");
        setViewState("form");
      }
    } catch (err) {
      console.error("Error creating organization profile:", err);
      toast.error(err?.response?.data?.message || "Error creating organization profile");
      setViewState("form");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModal = async (updatedData) => {
    try {
      const payload = {
        id: orgData.id,
        ...updatedData,
      };
      const res = await editOrganizationProfileAdmin(payload);
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "Organization Profile updated successfully!");
        setIsEditModalOpen(false);
        await loadProfile();
      } else {
        toast.error(res?.data?.message || "Failed to update organization profile");
      }
    } catch (err) {
      console.error("Error updating organization profile:", err);
      toast.error(err?.response?.data?.message || "Error updating organization profile");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (viewState === "details") {
    return (
      <>
        <OrganizationProfileDetails
          data={orgData}
          onEdit={() => setIsEditModalOpen(true)}
        />
        <EditOrganizationModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveModal}
          initialData={orgData}
        />
      </>
    );
  }

  if (viewState === "form") {
    return (
      <OrganizationProfileForm
        onNext={handleFormSuccess}
        onCancel={() => setViewState(orgData?.orgName ? "details" : "empty")}
      />
    );
  }

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Sub Title Section */}
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
            color: "#64748B",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Manage your company profile, timezone and regional preferences
        </Typography>
      </Box>

      {/* Main Set Up Card */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#FFFFFF",
          width: "960px",
          maxWidth: "100%",
          height: "350px",
          minHeight: "350px",
          borderRadius: "11px",
          boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.25)",
          opacity: 1,
          p: { xs: 3, md: 4 },
          mt: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          mx: "50px",
          boxSizing: "border-box",
        }}
      >
        {/* Figma Exact Building Icon */}
        <OrganizationFigmaIcon />

        {/* Card Heading */}
        <Typography
          sx={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#000000",
            fontFamily: "Inter, sans-serif",
            mb: 1.8,
            letterSpacing: "-0.2px",
          }}
        >
          Set Up Your Organization
        </Typography>

        {/* Card Sub-heading */}
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 400,
            color: "#475569",
            fontFamily: "Inter, sans-serif",
            maxWidth: "520px",
            lineHeight: "25px",
            mb: 4,
          }}
        >
          Create Your Organization Profile To Get Started. You Can Add Your
          Company Details And Configure Settings.
        </Typography>

        {/* Create Profile Action Button */}
        <Button
          variant="contained"
          startIcon={<EditOutlinedIcon sx={{ fontSize: 24 }} />}
          onClick={handleStartCreateProfile}
          sx={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "16px",
            textTransform: "none",
            px: 3.5,
            py: 1.2,
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(144, 217, 22, 0.3)",
            "&:hover": {
              backgroundColor: "#7EC610",
              boxShadow: "0px 6px 16px rgba(144, 217, 22, 0.4)",
            },
          }}
        >
          Create Organization Profile
        </Button>
      </Paper>
    </Box>
  );
}
