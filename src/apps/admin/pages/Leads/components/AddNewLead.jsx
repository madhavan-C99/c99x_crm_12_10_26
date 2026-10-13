import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  createLead,
  getLeadSelectOptions,
} from "../../../services/leadService";

const AddNewLeadModal = ({
  open,
  onClose,
  onSave,
  editLeadData = null,
  selectedPipeline = null,
}) => {
  const isEdit = Boolean(editLeadData);

  const todayString = () => new Date().toISOString().split("T")[0];

  const getInitialState = () => {
    if (editLeadData) {
      const nameParts = (
        editLeadData.full_name ||
        editLeadData.name ||
        ""
      ).split(" ");
      let initialMobile = (
        editLeadData.mobile_no ||
        editLeadData.phone_no ||
        editLeadData.phone ||
        ""
      ).replace(/\D/g, "");
      if (initialMobile.startsWith("91") && initialMobile.length > 10) {
        initialMobile = initialMobile.slice(2);
      }
      const rawDate = editLeadData.inquiry_date || editLeadData.created_at;
      return {
        firstName: editLeadData.first_name || nameParts[0] || "",
        lastName: editLeadData.last_name || nameParts.slice(1).join(" ") || "",
        mobileNo: initialMobile,
        emailId: editLeadData.email || editLeadData.email_id || "",
        pipeline: editLeadData.pipeline || "",
        campaign: editLeadData.campaign_id || editLeadData.campaign || "",
        sourceType:
          editLeadData.lead_source_id ||
          editLeadData.source_id ||
          editLeadData.source ||
          "",
        user:
          editLeadData.assigned_to_id ||
          editLeadData.user_id ||
          editLeadData.assigned_to ||
          "",
        inquiryDate: rawDate
          ? new Date(rawDate).toISOString().split("T")[0]
          : todayString(),
      };
    }
    return {
      firstName: "",
      lastName: "",
      mobileNo: "",
      emailId: "",
      pipeline: "",
      campaign: "",
      sourceType: "",
      user: "",
      inquiryDate: todayString(),
    };
  };

  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState(""); // API errors
  const [validationWarning, setValidationWarning] = useState(""); // missing-field warning

  const [options, setOptions] = useState({
    pipelines: [],
    campaigns: [],
    sources: [],
    users: [],
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(getInitialState());
      setErrors({});
      setErrorMessage("");
      setValidationWarning("");
      fetchOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editLeadData]);

  const capitalize = (str) => {
    if (!str) return "";
    return String(str)
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const fetchOptions = async () => {
    try {
      setLoading(true);

      let apiCampaigns = [];
      let apiSources = [];
      let apiTelecallers = [];
      let apiPipelines = [];

      // Query dropdown options API directly from Backend
      try {
        const optFilter = selectedPipeline
          ? { pipeline_id: selectedPipeline, category_id: selectedPipeline }
          : null;
        const response = await getLeadSelectOptions(optFilter);
        const raw =
          response?.data?.data || response?.data?.result || response?.data;

        if (raw && typeof raw === "object") {
          const rawStages = raw.stages;
          if (Array.isArray(rawStages) && rawStages.length > 0) {
            apiPipelines = rawStages.map((item) =>
              typeof item === "object"
                ? {
                    id: item.id ?? item.value ?? item.stage_id,
                    name: capitalize(
                      item.name ||
                        item.label ||
                        item.stage_name ||
                        item.title ||
                        String(item.value ?? ""),
                    ),
                  }
                : { id: item, name: capitalize(String(item)) },
            );
          }

          const rawCampaigns = raw.campaigns;
          if (Array.isArray(rawCampaigns) && rawCampaigns.length > 0) {
            apiCampaigns = rawCampaigns.map((item) =>
              typeof item === "object"
                ? {
                    id: item.id ?? item.value ?? item.campaign_id,
                    name: capitalize(
                      item.name ||
                        item.label ||
                        item.campaign_name ||
                        String(item.value ?? ""),
                    ),
                  }
                : { id: item, name: capitalize(String(item)) },
            );
          }

          const rawSources = raw.sources;
          if (Array.isArray(rawSources) && rawSources.length > 0) {
            apiSources = rawSources.map((item) =>
              typeof item === "object"
                ? {
                    id: item.id ?? item.value ?? item.source_id,
                    name: capitalize(
                      item.name ||
                        item.label ||
                        item.source_name ||
                        String(item.value ?? ""),
                    ),
                  }
                : { id: item, name: capitalize(String(item)) },
            );
          }

          const rawTelecallers = raw.telecallers;
          if (Array.isArray(rawTelecallers) && rawTelecallers.length > 0) {
            apiTelecallers = rawTelecallers.map((item) =>
              typeof item === "object"
                ? {
                    id: item.id ?? item.value ?? item.user_id,
                    name: capitalize(
                      item.name ||
                        item.label ||
                        item.user_name ||
                        item.telecaller ||
                        String(item.value ?? ""),
                    ),
                  }
                : { id: item, name: capitalize(String(item)) },
            );
          }
        }
      } catch (apiErr) {
        console.warn("getLeadSelectOptions API error:", apiErr);
      }

      setOptions({
        pipelines: apiPipelines,
        campaigns: apiCampaigns,
        sources: apiSources,
        users: apiTelecallers,
      });

      // NOTE: Dropdowns are intentionally NOT auto-filled with the first option,
      // so the user must select them (otherwise "required" validation never triggers).
    } catch (error) {
      console.error("fetchOptions error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobileNo") {
      const numericOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName?.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim())
      newErrors.lastName = "Last name is required";

    const cleanMobile = (formData.mobileNo || "").replace(/\D/g, "");
    if (!cleanMobile) {
      newErrors.mobileNo = "Mobile number is required";
    } else if (cleanMobile.length !== 10) {
      newErrors.mobileNo = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.emailId?.trim()) {
      newErrors.emailId = "Email ID is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId.trim())) {
      newErrors.emailId = "Please enter a valid email address";
    }

    if (!formData.pipeline)
      newErrors.pipeline = "Pipeline selection is required";
    if (!formData.campaign)
      newErrors.campaign = "Campaign selection is required";
    if (!formData.sourceType) newErrors.sourceType = "Source type is required";
    if (!formData.user) newErrors.user = "User selection is required";
    if (!formData.inquiryDate)
      newErrors.inquiryDate = "Inquiry date is required";

    setErrors(newErrors);

    const hasErrors = Object.keys(newErrors).length > 0;
    setValidationWarning(
      hasErrors
        ? "Please fill in all the required fields before submitting."
        : "",
    );
    return !hasErrors;
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    if (!validate()) return;

    try {
      setSubmitting(true);

      const cleanMobile = (formData.mobileNo || "").replace(/\D/g, "");
      const formattedMobile = cleanMobile ? `+91 ${cleanMobile}` : "";

      const payload = {
        ...(isEdit && editLeadData
          ? { lead_id: editLeadData.id || editLeadData.lead_id }
          : {}),
        first_name: formData.firstName,
        last_name: formData.lastName,
        mobile_no: formattedMobile,
        email: formData.emailId,
        pipeline_stage_id: Number(formData.pipeline) || 0,
        campaign_id: Number(formData.campaign) || 0,
        lead_source_id: Number(formData.sourceType) || 0,
        assigned_to_id: Number(formData.user) || 0,
        enquiry_date: formData.inquiryDate
          ? `${formData.inquiryDate}T12:00:00.000Z`
          : new Date().toISOString(),
      };

      const response = isEdit ? { data: payload } : await createLead(payload);

      if (onSave) {
        onSave(response?.data || payload, isEdit);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save lead:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.data?.message ||
          "Failed to save lead. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const customInputStyle = {
    backgroundColor: "#F3F4F6",
    borderRadius: "8px",
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "1px solid #84CC16",
    },
    input: { padding: "10px 14px", fontSize: "14px" },
    "& .MuiSelect-select": { padding: "10px 14px", fontSize: "14px" },
    // keep helper text visible and outside the grey box
    "& .MuiFormHelperText-root": { marginLeft: 0, backgroundColor: "#FFF" },
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    mb: 0.5,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "12px 8px",
        },
      }}
    >
      {/* Title & Close Button */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pb: 1,
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: "20px", fontWeight: 700, color: "#84CC16" }}
          >
            {isEdit ? "Edit Lead" : "Add New Lead"}
          </Typography>
          <Typography sx={{ fontSize: "13px", color: "#6B7280", mt: 0.5 }}>
            {isEdit
              ? "Update the lead details below."
              : "Enter the lead details below to add them to the pipeline."}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Form Content */}
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}
      >
        {validationWarning && (
          <Alert severity="warning" onClose={() => setValidationWarning("")}>
            {validationWarning}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: "#84CC16" }} />
          </Box>
        ) : (
          <>
            {/* First Name */}
            <Box>
              <Typography sx={labelStyle}>First Name*</Typography>
              <TextField
                fullWidth
                name="firstName"
                placeholder="Enter First Name"
                value={formData.firstName}
                onChange={handleChange}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName}
                sx={customInputStyle}
              />
            </Box>

            {/* Last Name */}
            <Box>
              <Typography sx={labelStyle}>Last Name*</Typography>
              <TextField
                fullWidth
                name="lastName"
                placeholder="Enter Last Name"
                value={formData.lastName}
                onChange={handleChange}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName}
                sx={customInputStyle}
              />
            </Box>

            {/* Mobile No */}
            <Box>
              <Typography sx={labelStyle}>Mobile No*</Typography>
              <TextField
                fullWidth
                name="mobileNo"
                placeholder="9876543210"
                value={formData.mobileNo}
                onChange={handleChange}
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
                        <Typography
                          sx={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#374151",
                          }}
                        >
                          +91
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={customInputStyle}
              />
            </Box>

            {/* Email ID */}
            <Box>
              <Typography sx={labelStyle}>Email ID*</Typography>
              <TextField
                fullWidth
                name="emailId"
                placeholder="Enter Email ID"
                value={formData.emailId}
                onChange={handleChange}
                error={Boolean(errors.emailId)}
                helperText={errors.emailId}
                sx={customInputStyle}
              />
            </Box>

            {/* Pipeline Dropdown */}
            <Box>
              <Typography sx={labelStyle}>Pipeline*</Typography>
              <TextField
                select
                fullWidth
                name="pipeline"
                value={formData.pipeline}
                onChange={handleChange}
                error={Boolean(errors.pipeline)}
                helperText={errors.pipeline}
                sx={customInputStyle}
              >
                {options.pipelines.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Campaign Dropdown */}
            <Box>
              <Typography sx={labelStyle}>Campaign*</Typography>
              <TextField
                select
                fullWidth
                name="campaign"
                value={formData.campaign}
                onChange={handleChange}
                error={Boolean(errors.campaign)}
                helperText={errors.campaign}
                sx={customInputStyle}
              >
                {options.campaigns.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Source Type Dropdown */}
            <Box>
              <Typography sx={labelStyle}>Source Type*</Typography>
              <TextField
                select
                fullWidth
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
                error={Boolean(errors.sourceType)}
                helperText={errors.sourceType}
                sx={customInputStyle}
              >
                {options.sources.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Telecallers / User Dropdown */}
            <Box>
              <Typography sx={labelStyle}>Assign To*</Typography>
              <TextField
                select
                fullWidth
                name="user"
                value={formData.user}
                onChange={handleChange}
                error={Boolean(errors.user)}
                helperText={errors.user}
                sx={customInputStyle}
              >
                {options.users.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Inquiry Date */}
            <Box>
              <Typography sx={labelStyle}>Inquiry Date*</Typography>
              <TextField
                fullWidth
                type="date"
                name="inquiryDate"
                value={formData.inquiryDate}
                onChange={handleChange}
                error={Boolean(errors.inquiryDate)}
                helperText={errors.inquiryDate}
                sx={customInputStyle}
              />
            </Box>
          </>
        )}
      </DialogContent>

      {/* Action Buttons */}
      <DialogActions
        sx={{ justifyContent: "flex-end", gap: 1.5, px: 3, pb: 2, pt: 1 }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitting}
          sx={{
            borderColor: "#84CC16",
            color: "#84CC16",
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            fontWeight: 600,
            "&:hover": { borderColor: "#65A30D", backgroundColor: "#F7FEE7" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            backgroundColor: "#84CC16",
            color: "#FFF",
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": { backgroundColor: "#65A30D" },
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: "#FFF" }} />
          ) : (
            "Save"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddNewLeadModal;
