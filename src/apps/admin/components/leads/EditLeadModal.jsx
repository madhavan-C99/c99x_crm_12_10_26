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
import AddIcon from "@mui/icons-material/Add";
import { getLeadSelectOptions, getLeadDetail, updateLeadStage } from "@/apps/admin/services/leadService";

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
    plans: [],
    courses: [],
    telecallers: [],
    pipelines: [],
    campaigns: [],
    stages: [],
    // tags: [],
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNo: "",
    altMobileNo: "",
    emailId: "",
    createdDate: "",
    assignedTo: "",
    plan: "",
    course: "",
    pipeline: "",
    campaign: "",
    stage: "",
    // tag: "",
    amountPaid: 0,
    pendingAmount: 0,
  });

  // Load dynamic data & set initial form values on open (calls getLeadDetail API for deep details)
  useEffect(() => {
    if (!open || !lead) return;

    setErrors({});
    setFeedback({ type: "", message: "" });
    setLoading(true);

    const targetId = lead.id || lead.lead_id;

    const fetchLeadDetails = async () => {
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

      let initialMobile = (activeLeadObj.mobile_no || activeLeadObj.phone_no || activeLeadObj.phone || activeLeadObj.contact || "").replace(/\D/g, "");
      if (initialMobile.startsWith("91") && initialMobile.length > 10) {
        initialMobile = initialMobile.slice(2);
      }

      let initialAltMobile = (activeLeadObj.alt_mobile || activeLeadObj.alternate_no || activeLeadObj.alternative_mobile || activeLeadObj.alt_phone || "").replace(/\D/g, "");
      if (initialAltMobile.startsWith("91") && initialAltMobile.length > 10) {
        initialAltMobile = initialAltMobile.slice(2);
      }

      const extractedAssignedTo = cleanValue(activeLeadObj.assigned_to || activeLeadObj.user_name || activeLeadObj.telecaller || "");
      const extractedPlan = cleanValue(activeLeadObj.course_plan || activeLeadObj.plan_name || activeLeadObj.plan || "");
      const extractedCourse = cleanValue(activeLeadObj.course || activeLeadObj.course_name || "");
      const extractedPipeline = cleanValue(activeLeadObj.pipeline || activeLeadObj.pipeline_name || "");
      const extractedCampaign = cleanValue(activeLeadObj.campaign || activeLeadObj.campaign_name || "");
      const extractedStage = cleanValue(activeLeadObj.stage || activeLeadObj.pipeline_stage || "");
      // const extractedTag = cleanValue(activeLeadObj.tag || activeLeadObj.lead_tag || activeLeadObj.temperature || "");

      setFormData({
        firstName: fName,
        lastName: lName,
        mobileNo: initialMobile,
        altMobileNo: initialAltMobile,
        emailId: extractedEmail,
        createdDate: createdStr ? String(createdStr).split("T")[0] : "",
        assignedTo: extractedAssignedTo,
        plan: extractedPlan,
        course: extractedCourse,
        pipeline: extractedPipeline,
        campaign: extractedCampaign,
        stage: extractedStage,
        // tag: extractedTag,
        amountPaid: parseNumericAmount(activeLeadObj.amount_paid ?? activeLeadObj.paid_amount ?? (parseNumericAmount(activeLeadObj.amount) - parseNumericAmount(activeLeadObj.pending_amount))),
        pendingAmount: parseNumericAmount(activeLeadObj.pending_amount ?? activeLeadObj.pending ?? 0),
      });

      if (activeLeadObj.alt_mobile || activeLeadObj.alternate_no || activeLeadObj.alternative_mobile || activeLeadObj.alt_phone) {
        setShowAltPhone(true);
      }

      fetchDropdownOptions({
        plan: extractedPlan,
        course: extractedCourse,
        assignedTo: extractedAssignedTo,
        pipeline: extractedPipeline,
        campaign: extractedCampaign,
        // tag: extractedTag,
      });
    };

    fetchLeadDetails();
  }, [open, lead]);

  const fetchDropdownOptions = async (activeValues = {}) => {
    try {
      setLoading(true);

      let apiPlans = [];
      let apiCourses = [];
      let apiTelecallers = [];
      let apiPipelines = [];
      let apiCampaigns = [];
      // let apiTags = [];

      try {
        const response = await getLeadSelectOptions();
        const raw = response?.data?.data || response?.data?.result || response?.data;
        if (raw && typeof raw === "object") {
          const plansList = raw.course_plans;
          if (Array.isArray(plansList) && plansList.length > 0) {
            apiPlans = plansList.map((p) => cleanValue(typeof p === "object" ? (p.name || p.label || p.course_plan || String(p.value ?? p.id ?? "")) : String(p))).filter(Boolean);
          }

          const coursesList = raw.courses;
          if (Array.isArray(coursesList) && coursesList.length > 0) {
            apiCourses = coursesList.map((c) => cleanValue(typeof c === "object" ? (c.name || c.label || c.course_name || String(c.value ?? c.id ?? "")) : String(c))).filter(Boolean);
          }

          const telecallersList = raw.telecallers;
          if (Array.isArray(telecallersList) && telecallersList.length > 0) {
            apiTelecallers = telecallersList.map((t) => cleanValue(typeof t === "object" ? (t.name || t.label || t.user_name || String(t.value ?? t.id ?? "")) : String(t))).filter(Boolean);
          }

          const stagesList = raw.stages;
          if (Array.isArray(stagesList) && stagesList.length > 0) {
            apiPipelines = stagesList.map((pl) => cleanValue(typeof pl === "object" ? (pl.name || pl.label || pl.stage_name || String(pl.value ?? pl.id ?? "")) : String(pl))).filter(Boolean);
          }

          const campaignsList = raw.campaigns;
          if (Array.isArray(campaignsList) && campaignsList.length > 0) {
            apiCampaigns = campaignsList.map((cm) => cleanValue(typeof cm === "object" ? (cm.name || cm.label || cm.campaign_name || String(cm.value ?? cm.id ?? "")) : String(cm))).filter(Boolean);
          }

          // const tagsArray = raw.tags;
          // if (Array.isArray(tagsArray) && tagsArray.length > 0) {
          //   apiTags = tagsArray.map((tg) => cleanValue(typeof tg === "object" ? (tg.name || tg.tag_name || String(tg)) : String(tg))).filter(Boolean);
          // }
        }
      } catch (err) {
        console.warn("getLeadSelectOptions error:", err);
      }

      // Ensure valid active values are included in dropdown options
      const currPlan = cleanValue(activeValues.plan || lead?.course_plan || lead?.plan);
      const currCourse = cleanValue(activeValues.course || lead?.course);
      const currTelecaller = cleanValue(activeValues.assignedTo || lead?.assigned_to);
      const currPipeline = cleanValue(activeValues.pipeline || lead?.pipeline);
      const currCampaign = cleanValue(activeValues.campaign || lead?.campaign);
      // const currTag = cleanValue(activeValues.tag || lead?.tag);

      if (currPlan && !apiPlans.includes(currPlan)) apiPlans.unshift(currPlan);
      if (currCourse && !apiCourses.includes(currCourse)) apiCourses.unshift(currCourse);
      if (currTelecaller && !apiTelecallers.includes(currTelecaller)) apiTelecallers.unshift(currTelecaller);
      if (currPipeline && !apiPipelines.includes(currPipeline)) apiPipelines.unshift(currPipeline);
      if (currCampaign && !apiCampaigns.includes(currCampaign)) apiCampaigns.unshift(currCampaign);
      // if (currTag && !apiTags.includes(currTag)) apiTags.unshift(currTag);

      setOptions({
        plans: apiPlans,
        courses: apiCourses,
        telecallers: apiTelecallers,
        pipelines: apiPipelines,
        campaigns: apiCampaigns,
        // tags: apiTags,
      });
    } catch (err) {
      console.error("fetchDropdownOptions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    if (field === "mobileNo" || field === "altMobileNo") {
      const numericOnly = String(value || "").replace(/\D/g, "").slice(0, 10);
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

    const cleanMobile = (formData.mobileNo || "").replace(/\D/g, "");
    if (!cleanMobile) {
      newErrors.mobileNo = "Mobile No is required!";
    } else if (cleanMobile.length !== 10) {
      newErrors.mobileNo = "Please enter a valid 10-digit mobile number!";
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

    if (!formData.assignedTo || !formData.assignedTo.trim()) {
      newErrors.assignedTo = "Assigned To is required!";
    }

    if (!formData.plan || !formData.plan.trim()) {
      newErrors.plan = "Plan is required!";
    }

    if (!formData.course || !formData.course.trim()) {
      newErrors.course = "Course is required!";
    }

    if (!formData.campaign || !formData.campaign.trim()) {
      newErrors.campaign = "Campaign is required!";
    }

    if (!formData.stage || !formData.stage.trim()) {
      newErrors.stage = "Stage is required!";
    }

    // if (!formData.tag || !formData.tag.trim()) {
    //   newErrors.tag = "Tag is required!";
    // }

    const cleanAltMobile = (formData.altMobileNo || "").replace(/\D/g, "");
    if (cleanAltMobile && cleanAltMobile.length !== 10) {
      newErrors.altMobileNo = "Please enter a valid 10-digit alternate mobile number!";
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

      const cleanMobile = (formData.mobileNo || "").replace(/\D/g, "");
      const cleanAltMobile = (formData.altMobileNo || "").replace(/\D/g, "");
      const formattedMobile = cleanMobile ? `+91 ${cleanMobile}` : "";
      const formattedAltMobile = cleanAltMobile ? `+91 ${cleanAltMobile}` : "";

      const rawId = lead?.id || lead?.lead_id || lead?.leadId;
      const numericId = Number(rawId) || rawId;

      const payload = {
        lead_id: numericId,
        id: numericId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        mobile_no: formattedMobile,
        mobile: formattedMobile,
        phone: formattedMobile,
        alt_mobile: formattedAltMobile,
        email: formData.emailId,
        email_id: formData.emailId,

        // Integer IDs for Django/FastAPI ORM queries
        campaign_id: typeof formData.campaign === "number" ? formData.campaign : (Number(formData.campaign) || 0),
        lead_source_id: typeof formData.sourceType === "number" ? formData.sourceType : (Number(formData.sourceType) || 0),
        assigned_to_id: typeof formData.assignedTo === "number" ? formData.assignedTo : (Number(formData.assignedTo) || 0),
        user_id: typeof formData.assignedTo === "number" ? formData.assignedTo : (Number(formData.assignedTo) || 0),
        pipeline_stage_id: typeof formData.pipeline === "number" ? formData.pipeline : (Number(formData.pipeline) || 0),

        // String names for backwards compatibility
        campaign: String(formData.campaign || ""),
        campaign_name: String(formData.campaign || ""),
        assigned_to: String(formData.assignedTo || ""),
        telecaller: String(formData.assignedTo || ""),
        course_plan: String(formData.plan || ""),
        plan: String(formData.plan || ""),
        course: String(formData.course || ""),
        pipeline: String(formData.pipeline || ""),
        stage: String(formData.stage || "").trim(),
        // tag: String(formData.tag || "").trim(),
        // is_hot: String(formData.tag || "").toLowerCase().includes("hot"),
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
          height: "580px !important",
          minHeight: "580px !important",
          maxHeight: "88vh !important",
          display: "flex !important",
          flexDirection: "column !important",
          borderRadius: "16px !important",
          overflow: "hidden !important",
          p: "0 !important",
        },
      }}
      slotProps={{
        paper: {
          sx: {
            width: "650px !important",
            minWidth: "650px !important",
            maxWidth: "94vw !important",
            height: "580px !important",
            minHeight: "580px !important",
            maxHeight: "88vh !important",
          },
        },
      }}
      PaperProps={{
        style: {
          width: "650px",
          minWidth: "650px",
          height: "580px",
          minHeight: "580px",
        },
      }}
    >
      {/* Modal Header - Fixed at Top */}
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

      {/* Form Content - Scrollable Middle Section */}
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
              <Box sx={{ width: "49%" }}>
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

            {/* Row 3: Created Date & Assigned To */}
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
                  value={formData.assignedTo}
                  onChange={(e) => handleChange("assignedTo", e.target.value)}
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
                  {options.telecallers.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
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
                  {options.plans.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
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
                  {options.courses.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {/* Row 5: Campaign & Stage */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Campaign <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.campaign}
                  onChange={(e) => handleChange("campaign", e.target.value)}
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
                  {options.campaigns.map((cm) => (
                    <MenuItem key={cm} value={cm}>
                      {cm}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                  Stage <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
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
                />
              </Box>
            </Box>

            {/* Row 6: Tag (Red Dropdown Pill) */}
            {/* <Box sx={{ width: "49%" }}>
              <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", mb: 0.6 }}>
                Tag <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.tag}
                onChange={(e) => handleChange("tag", e.target.value)}
                error={Boolean(errors.tag)}
                helperText={errors.tag}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#F1F5F9",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#0F172A",
                    "& fieldset": { border: errors.tag ? "1.5px solid #EF4444 !important" : "none" },
                  },
                }}
              >
                {options.tags.map((tg) => (
                  <MenuItem key={tg} value={tg}>
                    {tg}
                  </MenuItem>
                ))}
              </TextField>
            </Box> */}

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

      {/* Fixed Footer Actions - Pinned at Bottom */}
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

      {/* Exact Mark As Loss style Confirmation Popup */}
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
