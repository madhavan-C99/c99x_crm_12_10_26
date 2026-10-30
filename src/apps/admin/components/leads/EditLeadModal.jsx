import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getLeadDetail } from "@/apps/admin/services/leadService";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";
import { sanitizeMobileInput, normalizeMobile, formatWithCountryCode } from "@/shared/utils/mobile";

const parseNumericAmount = (val) => {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    return cleaned ? Number(cleaned) : 0;
  }
  return 0;
};

const cleanValue = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  if (str === "-" || str === " - " || str === "null" || str === "undefined") return "";
  return str;
};

const EditLeadModal = ({ open, onClose, lead, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAltPhone, setShowAltPhone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [options, setOptions] = useState({
    pipelines: [],
    campaigns: [],
    telecallers: [],
    stages: [],
    courses: [],
    plans: [],
    sources: [],
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNo: "",
    altMobileNo: "",
    emailId: "",
    createdDate: "",
    pipelineId: "",
    pipelineName: "",
    campaignId: "",
    campaignName: "",
    assignedToId: "",
    assignedToName: "",
    stage: "",
    plan: "",
    course: "",
    sourceTypeId: "",
    amountPaid: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    if (!open || !lead) return;

    setErrors({});
    setFeedback({ type: "", message: "" });
    setLoading(true);

    const targetId = lead.id || lead.lead_id;

    const fetchLeadDetailsAndOptions = async () => {
      let activeLeadObj = { ...lead };
      if (targetId) {
        try {
          const res = await getLeadDetail({ lead_id: targetId, id: targetId });
          const raw = res?.data?.data || res?.data?.result || res?.data;
          let deepObj = {};
          if (Array.isArray(raw)) {
            deepObj = raw[0] || {};
          } else if (raw && typeof raw === "object") {
            const nested = raw.lead_info || raw.lead_details || raw.lead || raw.details || raw;
            deepObj = Array.isArray(nested) ? (nested[0] || {}) : nested;
          }
          if (deepObj && typeof deepObj === "object") {
            activeLeadObj = { ...lead, ...deepObj };
          }
        } catch (err) {
          console.warn("EditLeadModal getLeadDetail error:", err);
        }
      }

      const nameParts = (activeLeadObj.full_name || activeLeadObj.name || "").trim().split(" ");
      const fName = cleanValue(activeLeadObj.first_name || nameParts[0] || "");
      const lName = cleanValue(activeLeadObj.last_name || nameParts.slice(1).join(" ") || "");
      const createdStr = cleanValue(activeLeadObj.created_at || activeLeadObj.created_date || activeLeadObj.created || activeLeadObj.date || "");

      const extractedEmail = cleanValue(
        activeLeadObj.email ||
        activeLeadObj.email_id ||
        activeLeadObj.emailId ||
        activeLeadObj.mail ||
        activeLeadObj.mail_id ||
        ""
      );

      let initialMobile = normalizeMobile(activeLeadObj.mobile_no || activeLeadObj.phone_no || activeLeadObj.phone || activeLeadObj.contact || "");
      if (initialMobile.startsWith("91") && initialMobile.length > 10) {
        initialMobile = initialMobile.slice(2);
      }

      let initialAltMobile = normalizeMobile(activeLeadObj.alt_mobile || activeLeadObj.alternate_no || activeLeadObj.alternative_mobile || activeLeadObj.alt_phone || "");
      if (initialAltMobile.startsWith("91") && initialAltMobile.length > 10) {
        initialAltMobile = initialAltMobile.slice(2);
      }

      if (initialAltMobile) {
        setShowAltPhone(true);
      }

      const extractedPlan = cleanValue(activeLeadObj.course_plan || activeLeadObj.plan_name || activeLeadObj.plan || "");
      const extractedCourse = cleanValue(activeLeadObj.course || activeLeadObj.course_name || "");
      const extractedStage = cleanValue(activeLeadObj.stage || activeLeadObj.pipeline_stage || "");
      const extractedPipelineName = cleanValue(activeLeadObj.pipeline || activeLeadObj.pipeline_name || "");
      const extractedCampaignName = cleanValue(activeLeadObj.campaign || activeLeadObj.campaign_name || "");
      const extractedAssignedToName = cleanValue(activeLeadObj.assigned_to || activeLeadObj.user_name || activeLeadObj.telecaller || "");

      // 1. Fetch Pipelines (Categories), Courses, Plans
      let categories = [];
      let courses = [];
      let plans = [];
      try {
        [categories, courses, plans] = await Promise.all([
          getSelectOptions("L_CATEGORIES").catch(() => []),
          getSelectOptions("L_COURSE_NAMES").catch(() => []),
          getSelectOptions("L_COURSE_PLANS").catch(() => []),
        ]);
      } catch (e) {
        console.warn("Failed fetching basic options:", e);
      }

      // Determine numeric pipeline ID
      let rawPipelineId =
        activeLeadObj.pipeline_id ||
        activeLeadObj.pipeline_category_id ||
        activeLeadObj.category_id ||
        lead.pipeline_id ||
        lead.pipeline_category_id ||
        lead.category_id ||
        null;

      if (!rawPipelineId && extractedPipelineName && categories.length > 0) {
        const found = categories.find(
          (c) => (c.name || c.label || "").toLowerCase().trim() === extractedPipelineName.toLowerCase().trim()
        );
        if (found) rawPipelineId = found.id;
      }
      if (!rawPipelineId && categories.length > 0) {
        rawPipelineId = categories[0].id;
      }

      const chosenPipelineId = rawPipelineId ? Number(rawPipelineId) : null;
      const pipeFilter = chosenPipelineId ? { pipeline_id: chosenPipelineId } : null;

      // 2. Fetch Campaigns, Sources, Stages with { pipeline_id: chosenPipelineId }
      let campaigns = [];
      let sources = [];
      let stages = [];
      try {
        [campaigns, sources, stages] = await Promise.all([
          getSelectOptions("L_CAMPAIGN_NAMES", pipeFilter).catch(() => []),
          getSelectOptions("L_LEAD_SOURCES", pipeFilter).catch(() => []),
          getSelectOptions("L_STAGES", pipeFilter).catch(() => []),
        ]);
      } catch (e) {
        console.warn("Failed fetching pipeline dependent options:", e);
      }

      // Determine numeric campaign ID
      let rawCampaignId =
        activeLeadObj.campaign_id ||
        activeLeadObj.campaignId ||
        lead.campaign_id ||
        null;

      if (!rawCampaignId && extractedCampaignName && campaigns.length > 0) {
        const found = campaigns.find(
          (c) => (c.name || c.label || "").toLowerCase().trim() === extractedCampaignName.toLowerCase().trim()
        );
        if (found) rawCampaignId = found.id;
      }
      if (!rawCampaignId && campaigns.length > 0) {
        rawCampaignId = campaigns[0].id;
      }

      const chosenCampaignId = rawCampaignId ? Number(rawCampaignId) : null;
      const campFilter = chosenCampaignId ? { campaign_id: chosenCampaignId } : null;

      // 3. Fetch Telecallers with { campaign_id: chosenCampaignId }
      let telecallers = [];
      try {
        telecallers = await getSelectOptions("L_TELECALLERS", campFilter).catch(() => []);
      } catch (e) {
        console.warn("Failed fetching telecallers:", e);
      }

      // Determine numeric telecaller ID
      let rawAssignedToId =
        activeLeadObj.assigned_to_id ||
        activeLeadObj.user_id ||
        activeLeadObj.telecaller_id ||
        lead.assigned_to_id ||
        null;

      if (!rawAssignedToId && extractedAssignedToName && telecallers.length > 0) {
        const found = telecallers.find(
          (u) => (u.name || u.label || u.user_name || "").toLowerCase().trim() === extractedAssignedToName.toLowerCase().trim()
        );
        if (found) rawAssignedToId = found.id;
      }
      if (!rawAssignedToId && telecallers.length > 0) {
        rawAssignedToId = telecallers[0].id;
      }

      const chosenTelecallerId = rawAssignedToId ? Number(rawAssignedToId) : "";

      // Pipeline & Campaign display names
      const foundPipe = categories.find((c) => c.id === chosenPipelineId);
      const pipeDisplayName = foundPipe ? (foundPipe.name || foundPipe.label) : extractedPipelineName;

      const foundCamp = campaigns.find((c) => c.id === chosenCampaignId);
      const campDisplayName = foundCamp ? (foundCamp.name || foundCamp.label) : extractedCampaignName;

      const foundUser = telecallers.find((u) => u.id === chosenTelecallerId);
      const userDisplayName = foundUser ? (foundUser.name || foundUser.label || foundUser.user_name) : extractedAssignedToName;

      setOptions({
        pipelines: categories,
        campaigns,
        telecallers,
        stages,
        courses,
        plans,
        sources,
      });

      setFormData({
        firstName: fName,
        lastName: lName,
        mobileNo: initialMobile,
        altMobileNo: initialAltMobile,
        emailId: extractedEmail,
        createdDate: createdStr ? String(createdStr).split("T")[0] : "",
        pipelineId: chosenPipelineId ?? "",
        pipelineName: pipeDisplayName,
        campaignId: chosenCampaignId ?? "",
        campaignName: campDisplayName,
        assignedToId: chosenTelecallerId ?? "",
        assignedToName: userDisplayName,
        stage: extractedStage || (stages.length > 0 ? (stages[0].name || stages[0].label) : ""),
        plan: extractedPlan || (plans.length > 0 ? (plans[0].name || plans[0].label) : ""),
        course: extractedCourse || (courses.length > 0 ? (courses[0].name || courses[0].label) : ""),
        sourceTypeId: activeLeadObj.lead_source_id || (sources.length > 0 ? sources[0].id : ""),
        amountPaid: parseNumericAmount(activeLeadObj.amount_paid ?? activeLeadObj.paid_amount ?? (parseNumericAmount(activeLeadObj.amount) - parseNumericAmount(activeLeadObj.pending_amount))),
        pendingAmount: parseNumericAmount(activeLeadObj.pending_amount ?? activeLeadObj.pending ?? 0),
      });

      setLoading(false);
    };

    fetchLeadDetailsAndOptions();
  }, [open, lead]);

  // When Pipeline Changes: re-fetch Campaigns & Sources with { pipeline_id }, then Telecallers with { campaign_id }
  const handlePipelineChange = async (newPipelineId) => {
    const numPipeId = newPipelineId ? Number(newPipelineId) : null;
    const foundPipe = options.pipelines.find((p) => p.id === numPipeId);
    const pipeName = foundPipe ? (foundPipe.name || foundPipe.label) : "";

    setFormData((prev) => ({
      ...prev,
      pipelineId: numPipeId ?? "",
      pipelineName: pipeName,
    }));

    try {
      const pipeFilter = numPipeId ? { pipeline_id: numPipeId } : null;
      const [newCampaigns, newSources, newStages] = await Promise.all([
        getSelectOptions("L_CAMPAIGN_NAMES", pipeFilter).catch(() => []),
        getSelectOptions("L_LEAD_SOURCES", pipeFilter).catch(() => []),
        getSelectOptions("L_STAGES", pipeFilter).catch(() => []),
      ]);

      let newCampId = "";
      let newCampName = "";
      if (newCampaigns.length > 0) {
        const stillValid = newCampaigns.find((c) => c.id === formData.campaignId);
        if (stillValid) {
          newCampId = stillValid.id;
          newCampName = stillValid.name || stillValid.label;
        } else {
          newCampId = newCampaigns[0].id;
          newCampName = newCampaigns[0].name || newCampaigns[0].label;
        }
      }

      const campFilter = newCampId ? { campaign_id: Number(newCampId) } : null;
      const newTelecallers = await getSelectOptions("L_TELECALLERS", campFilter).catch(() => []);

      let newUserId = "";
      let newUserName = "";
      if (newTelecallers.length > 0) {
        const stillValidUser = newTelecallers.find((u) => u.id === formData.assignedToId);
        if (stillValidUser) {
          newUserId = stillValidUser.id;
          newUserName = stillValidUser.name || stillValidUser.label;
        } else {
          newUserId = newTelecallers[0].id;
          newUserName = newTelecallers[0].name || newTelecallers[0].label;
        }
      }

      setOptions((prev) => ({
        ...prev,
        campaigns: newCampaigns,
        sources: newSources,
        stages: newStages,
        telecallers: newTelecallers,
      }));

      setFormData((prev) => ({
        ...prev,
        pipelineId: numPipeId ?? "",
        pipelineName: pipeName,
        campaignId: newCampId ?? "",
        campaignName: newCampName,
        assignedToId: newUserId ?? "",
        assignedToName: newUserName,
      }));
    } catch (err) {
      console.error("handlePipelineChange error:", err);
    }
  };

  // When Campaign Changes: re-fetch Telecallers with { campaign_id }
  const handleCampaignChange = async (newCampId) => {
    const numCampId = newCampId ? Number(newCampId) : null;
    const foundCamp = options.campaigns.find((c) => c.id === numCampId);
    const campName = foundCamp ? (foundCamp.name || foundCamp.label) : "";

    setFormData((prev) => ({
      ...prev,
      campaignId: numCampId ?? "",
      campaignName: campName,
    }));

    try {
      const campFilter = numCampId ? { campaign_id: Number(numCampId) } : null;
      const newTelecallers = await getSelectOptions("L_TELECALLERS", campFilter).catch(() => []);

      let newUserId = "";
      let newUserName = "";
      if (newTelecallers.length > 0) {
        const stillValidUser = newTelecallers.find((u) => u.id === formData.assignedToId);
        if (stillValidUser) {
          newUserId = stillValidUser.id;
          newUserName = stillValidUser.name || stillValidUser.label;
        } else {
          newUserId = newTelecallers[0].id;
          newUserName = newTelecallers[0].name || newTelecallers[0].label;
        }
      }

      setOptions((prev) => ({
        ...prev,
        telecallers: newTelecallers,
      }));

      setFormData((prev) => ({
        ...prev,
        campaignId: numCampId ?? "",
        campaignName: campName,
        assignedToId: newUserId ?? "",
        assignedToName: newUserName,
      }));
    } catch (err) {
      console.error("handleCampaignChange error:", err);
    }
  };

  const handleChange = (field, value) => {
    if (field === "mobileNo" || field === "altMobileNo") {
      const numericOnly = sanitizeMobileInput(value);
      setFormData((prev) => ({ ...prev, [field]: numericOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (feedback.message) setFeedback({ type: "", message: "" });
  };

  const handleSaveClick = () => {
    setFeedback({ type: "", message: "" });
    const newErrors = {};

    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = "First Name is required!";
    }

    const cleanMobile = normalizeMobile(formData.mobileNo);
    if (!cleanMobile) {
      newErrors.mobileNo = "Mobile No is required!";
    } else if (cleanMobile.length !== 10) {
      newErrors.mobileNo = "Please enter a valid 10-digit mobile number!";
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobileNo = "Mobile number must start with 6, 7, 8, or 9!";
    }

    const cleanEmail = (formData.emailId || "").trim();
    if (!cleanEmail) {
      newErrors.emailId = "Email ID is required!";
    } else if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      newErrors.emailId = "Please enter a valid email address!";
    }

    if (!formData.createdDate || !formData.createdDate.trim()) {
      newErrors.createdDate = "Created Date is required!";
    }

    if (!formData.assignedToId) {
      newErrors.assignedTo = "Assigned To is required!";
    }

    if (!formData.plan || !formData.plan.trim()) {
      newErrors.plan = "Plan is required!";
    }

    if (!formData.course || !formData.course.trim()) {
      newErrors.course = "Course is required!";
    }

    if (!formData.pipelineId) {
      newErrors.pipeline = "Pipeline is required!";
    }

    if (!formData.campaignId) {
      newErrors.campaign = "Campaign is required!";
    }

    if (!formData.stage || !formData.stage.trim()) {
      newErrors.stage = "Stage is required!";
    }

    const cleanAltMobile = normalizeMobile(formData.altMobileNo);
    if (cleanAltMobile && cleanAltMobile.length !== 10) {
      newErrors.altMobileNo = "Please enter a valid 10-digit alternate mobile number!";
    } else if (cleanAltMobile && !/^[6-9]\d{9}$/.test(cleanAltMobile)) {
      newErrors.altMobileNo = "Alternate mobile number must start with 6, 7, 8, or 9!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFeedback({ type: "error", message: "Please fill all mandatory fields!" });
      return;
    }

    setErrors({});
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setSubmitting(true);
      setFeedback({ type: "", message: "" });

      const cleanMobile = normalizeMobile(formData.mobileNo);
      const cleanAltMobile = normalizeMobile(formData.altMobileNo);
      const formattedMobile = cleanMobile ? `+91 ${cleanMobile}` : "";
      const formattedAltMobile = cleanAltMobile ? `+91 ${cleanAltMobile}` : "";

      const rawId = lead?.id || lead?.lead_id || lead?.leadId;
      const numericId = Number(rawId) || rawId;

      const payload = {
        lead_id: numericId,
        id: numericId,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        mobile_no: formattedMobile,
        mobile: formattedMobile,
        phone: formattedMobile,
        alt_mobile: formattedAltMobile,
        email: formData.emailId.trim(),
        email_id: formData.emailId.trim(),

        // Integer IDs for backend
        campaign_id: Number(formData.campaignId) || 0,
        pipeline_category_id: Number(formData.pipelineId) || 0,
        assigned_to_id: Number(formData.assignedToId) || 0,
        user_id: Number(formData.assignedToId) || 0,
        lead_source_id: Number(formData.sourceTypeId) || 0,

        // String names for backwards compatibility
        campaign: String(formData.campaignName || ""),
        campaign_name: String(formData.campaignName || ""),
        pipeline: String(formData.pipelineName || ""),
        assigned_to: String(formData.assignedToName || ""),
        telecaller: String(formData.assignedToName || ""),
        course_plan: String(formData.plan || ""),
        plan: String(formData.plan || ""),
        course: String(formData.course || ""),
        stage: String(formData.stage || "").trim(),

        amount_paid: parseNumericAmount(formData.amountPaid),
        paid_amount: parseNumericAmount(formData.amountPaid),
        pending_amount: parseNumericAmount(formData.pendingAmount),
        amount: parseNumericAmount(formData.amountPaid) + parseNumericAmount(formData.pendingAmount),
        total_amount: parseNumericAmount(formData.amountPaid) + parseNumericAmount(formData.pendingAmount),
        enquiry_date: formData.createdDate
          ? `${formData.createdDate}T12:00:00.000Z`
          : "",
      };

      if (onSaveSuccess) {
        await onSaveSuccess(payload);
      }
      setConfirmOpen(false);
      onClose();
    } catch (err) {
      console.error("Failed to save edited lead:", err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        (err?.response?.status ? `HTTP ${err.response.status}: ${err.response.statusText}` : err.message);
      setFeedback({
        type: "error",
        message: `Failed to update lead: ${backendMsg}`,
      });
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !lead) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      TransitionComponent={Fade}
      transitionDuration={150}
      sx={{
        "& .MuiDialog-paper": {
          width: "650px !important",
          minWidth: "650px !important",
          maxWidth: "94vw !important",
          height: "620px !important",
          minHeight: "620px !important",
          maxHeight: "90vh !important",
          display: "flex !important",
          flexDirection: "column !important",
          borderRadius: "16px !important",
          overflow: "hidden !important",
          p: "0 !important",
        },
      }}
    >
      {/* Modal Header */}
      <Box
        sx={{
          px: 3.5,
          pt: 3,
          pb: 1.5,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #F1F5F9",
          flexShrink: 0,
          width: "100%",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "22px", fontWeight: 700, color: "#84CC16" }}>
            Edit Lead
          </Typography>
          <Typography sx={{ fontSize: "13.5px", color: "#64748B", mt: 0.3 }}>
            Edit the lead info
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: "#84CC16", p: 0.5, "&:hover": { backgroundColor: "#F7FEE7" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Form Content */}
      <DialogContent sx={{ px: 3.5, py: 2, backgroundColor: "#FFFFFF", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", width: "100%" }}>
        {feedback.message && (
          <Alert severity={feedback.type || "info"} sx={{ mb: 2, borderRadius: "8px" }}>
            {feedback.message}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, width: "100%", minHeight: "400px" }}>
            <CircularProgress size={36} sx={{ color: "#84CC16" }} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
            {/* Row 1: First Name & Last Name */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  First Name <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#0F172A",
                      "& fieldset": { border: errors.firstName ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Last Name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#0F172A",
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Row 2: Mobile No & Email ID */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Mobile No <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="9876543210"
                  value={formData.mobileNo}
                  onChange={(e) => handleChange("mobileNo", e.target.value)}
                  error={Boolean(errors.mobileNo)}
                  helperText={errors.mobileNo}
                  slotProps={{
                    htmlInput: {
                      maxLength: 10,
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: "#374151" }}>
                            +91
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#0F172A",
                      "& fieldset": { border: errors.mobileNo ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                />
                {!showAltPhone && (
                  <Typography
                    onClick={() => setShowAltPhone(true)}
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2563EB",
                      cursor: "pointer",
                      mt: 0.8,
                      display: "inline-block",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    + Add Alternate Number
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Email ID <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.emailId}
                  onChange={(e) => handleChange("emailId", e.target.value)}
                  error={Boolean(errors.emailId)}
                  helperText={errors.emailId}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#0F172A",
                      "& fieldset": { border: errors.emailId ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Optional Alternate Mobile No */}
            {showAltPhone && (
              <Box sx={{ width: { xs: "100%", sm: "48.5%" } }}>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Alternate Mobile No
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="9876543210"
                  value={formData.altMobileNo}
                  onChange={(e) => handleChange("altMobileNo", e.target.value)}
                  error={Boolean(errors.altMobileNo)}
                  helperText={errors.altMobileNo}
                  slotProps={{
                    htmlInput: {
                      maxLength: 10,
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: "#374151" }}>
                            +91
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#0F172A",
                      "& fieldset": { border: errors.altMobileNo ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                />
              </Box>
            )}

            {/* Row 3: Created Date & Assigned To (Telecallers) */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Created Date <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={formData.createdDate}
                  onChange={(e) => handleChange("createdDate", e.target.value)}
                  error={Boolean(errors.createdDate)}
                  helperText={errors.createdDate}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      "& fieldset": { border: errors.createdDate ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Assigned To <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.assignedToId ?? ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const foundUser = options.telecallers.find((u) => u.id === selectedId);
                    setFormData((prev) => ({
                      ...prev,
                      assignedToId: selectedId,
                      assignedToName: foundUser ? (foundUser.name || foundUser.label || foundUser.user_name) : "",
                    }));
                  }}
                  error={Boolean(errors.assignedTo)}
                  helperText={errors.assignedTo}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      "& fieldset": { border: errors.assignedTo ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                >
                  {options.telecallers.length === 0 ? (
                    <MenuItem value="" disabled>No telecallers found</MenuItem>
                  ) : (
                    options.telecallers.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name || t.label || t.user_name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Box>
            </Box>

            {/* Row 4: Plan & Course Dropdowns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Plan <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.plan}
                  onChange={(e) => handleChange("plan", e.target.value)}
                  error={Boolean(errors.plan)}
                  helperText={errors.plan}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#0F172A",
                      "& fieldset": { border: errors.plan ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                >
                  {options.plans.length === 0 ? (
                    <MenuItem value="" disabled>No plans found</MenuItem>
                  ) : (
                    options.plans.map((p) => {
                      const pName = typeof p === "object" ? (p.name || p.label) : String(p);
                      return (
                        <MenuItem key={p.id || pName} value={pName}>
                          {pName}
                        </MenuItem>
                      );
                    })
                  )}
                </TextField>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Course <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.course}
                  onChange={(e) => handleChange("course", e.target.value)}
                  error={Boolean(errors.course)}
                  helperText={errors.course}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#0F172A",
                      "& fieldset": { border: errors.course ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                >
                  {options.courses.length === 0 ? (
                    <MenuItem value="" disabled>No courses found</MenuItem>
                  ) : (
                    options.courses.map((c) => {
                      const cName = typeof c === "object" ? (c.name || c.label) : String(c);
                      return (
                        <MenuItem key={c.id || cName} value={cName}>
                          {cName}
                        </MenuItem>
                      );
                    })
                  )}
                </TextField>
              </Box>
            </Box>

            {/* Row 5: Pipeline & Campaign (Cascading with opt_filter) */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Pipeline <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.pipelineId ?? ""}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  error={Boolean(errors.pipeline)}
                  helperText={errors.pipeline}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      "& fieldset": { border: errors.pipeline ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                >
                  {options.pipelines.length === 0 ? (
                    <MenuItem value="" disabled>No pipelines found</MenuItem>
                  ) : (
                    options.pipelines.map((pl) => (
                      <MenuItem key={pl.id} value={pl.id}>
                        {pl.name || pl.label || pl.stage_name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Campaign <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.campaignId ?? ""}
                  onChange={(e) => handleCampaignChange(e.target.value)}
                  error={Boolean(errors.campaign)}
                  helperText={errors.campaign}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      "& fieldset": { border: errors.campaign ? "1.5px solid #EF4444 !important" : "none" },
                    },
                  }}
                >
                  {options.campaigns.length === 0 ? (
                    <MenuItem value="" disabled>No campaigns found</MenuItem>
                  ) : (
                    options.campaigns.map((cm) => (
                      <MenuItem key={cm.id} value={cm.id}>
                        {cm.name || cm.label || cm.campaign_name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Box>
            </Box>

            {/* Row 6: Stage */}
            <Box sx={{ width: { xs: "100%", sm: "48.5%" } }}>
              <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                Stage <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.stage}
                onChange={(e) => handleChange("stage", e.target.value)}
                error={Boolean(errors.stage)}
                helperText={errors.stage}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#F1F5F9",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#0F172A",
                    "& fieldset": { border: errors.stage ? "1.5px solid #EF4444 !important" : "none" },
                  },
                }}
              >
                {options.stages.length === 0 ? (
                  <MenuItem value="" disabled>No stages found</MenuItem>
                ) : (
                  options.stages.map((st) => {
                    const stName = typeof st === "object" ? (st.name || st.label || st.stage_name) : String(st);
                    return (
                      <MenuItem key={st.id || stName} value={stName}>
                        {stName}
                      </MenuItem>
                    );
                  })
                )}
              </TextField>
            </Box>

            {/* Row 7: Amount Paid & Pending Amount */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Amount Paid
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.amountPaid}
                  onChange={(e) => handleChange("amountPaid", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      color: "#64748B",
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Pending Amount
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.pendingAmount}
                  onChange={(e) => handleChange("pendingAmount", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      color: "#64748B",
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Fixed Footer Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          px: 3.5,
          py: 2,
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            border: "1px solid #84CC16",
            color: "#84CC16",
            fontWeight: 600,
            fontSize: "13.5px",
            borderRadius: "8px",
            px: 3,
            py: 0.8,
            textTransform: "none",
            "&:hover": { backgroundColor: "#F7FEE7" },
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSaveClick}
          disabled={submitting}
          sx={{
            backgroundColor: "#84CC16",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "13.5px",
            borderRadius: "8px",
            px: 3.5,
            py: 0.8,
            textTransform: "none",
            boxShadow: "0 2px 8px rgba(132, 204, 22, 0.3)",
            "&:hover": { backgroundColor: "#65A30D" },
          }}
        >
          {submitting ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Save"}
        </Button>
      </Box>

      {/* Confirmation Popup */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "480px",
            maxWidth: "92vw",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.16)",
            backgroundColor: "#FFFFFF",
          },
        }}
      >
        <DialogContent sx={{ p: "32px 36px 28px 36px !important" }}>
          <Typography
            sx={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#84CC16",
              mb: 2,
              letterSpacing: "-0.2px",
            }}
          >
            Are you sure?
          </Typography>

          <Typography
            sx={{
              fontSize: "14.5px",
              color: "#475569",
              fontWeight: 400,
              lineHeight: 1.5,
              mb: 0.8,
            }}
          >
            Are you sure you want to save changes to this lead?
          </Typography>

          <Typography
            sx={{
              fontSize: "14.5px",
              color: "#475569",
              fontWeight: 400,
              lineHeight: 1.5,
              mb: 3.5,
            }}
          >
            Click "No" to go back, or "Yes" to save.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => setConfirmOpen(false)}
              sx={{
                border: "1.5px solid #84CC16",
                color: "#84CC16",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "8px",
                minWidth: "86px",
                height: "38px",
                px: 3,
                textTransform: "none",
                backgroundColor: "#FFFFFF",
                "&:hover": { backgroundColor: "#F7FEE7", borderColor: "#65A30D" },
              }}
            >
              No
            </Button>

            <Button
              onClick={handleConfirmSave}
              disabled={submitting}
              sx={{
                backgroundColor: "#84CC16",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "14px",
                borderRadius: "8px",
                minWidth: "86px",
                height: "38px",
                px: 3,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(132, 204, 22, 0.35)",
                "&:hover": { backgroundColor: "#65A30D" },
              }}
            >
              {submitting ? (
                <CircularProgress size={18} sx={{ color: "#FFFFFF" }} />
              ) : (
                "Yes"
              )}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default EditLeadModal;
