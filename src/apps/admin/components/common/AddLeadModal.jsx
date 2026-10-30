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
  Select,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";
import { addNewLead } from "@/apps/admin/services/add_new_lead_service";
import { sanitizeMobileInput, validateMobile, formatWithCountryCode } from "@/shared/utils/mobile";

const BRAND_GREEN = "#90D916";
const GREY_BG = "#F5F5F5";

const todayString = () => new Date().toISOString().split("T")[0];

export const AddLeadModal = ({
  open,
  onClose,
  onSaveSuccess,
  onSave,
  initialCampaignId = null,
  initialCampaignName = "",
  initialPipelineCategoryId = null,
  selectedPipeline = null,
  lockCampaign = false,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [emailId, setEmailId] = useState("");
  const [pipelineCategoryId, setPipelineCategoryId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [inquiryDate, setInquiryDate] = useState(todayString());

  // Dropdown options from Backend API
  const [campaignsList, setCampaignsList] = useState([]);
  const [pipelineCategories, setPipelineCategories] = useState([]);
  const [sourcesList, setSourcesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName("");
      setLastName("");
      setMobileNo("");
      setEmailId("");
      setInquiryDate(todayString());
      loadInitialOptions();
    }
  }, [open, initialCampaignId, initialCampaignName, initialPipelineCategoryId, selectedPipeline]);

  const loadInitialOptions = async () => {
    try {
      setLoading(true);

      // 1. Fetch Pipelines (Categories)
      const categories = await getSelectOptions("L_CATEGORIES").catch(() => []);
      setPipelineCategories(categories);

      // Determine initial pipeline
      const rawPipeline = initialPipelineCategoryId ?? selectedPipeline;
      let chosenPipelineId =
        typeof rawPipeline === "object" && rawPipeline !== null
          ? rawPipeline?.id ?? rawPipeline?.value
          : rawPipeline;

      if (!chosenPipelineId && categories.length > 0) {
        chosenPipelineId = categories[0].id ?? categories[0].value;
      }
      if (chosenPipelineId) {
        setPipelineCategoryId(Number(chosenPipelineId));
      }

      // Filter for selected pipeline
      const pipeFilter = chosenPipelineId
        ? { pipeline_id: Number(chosenPipelineId) }
        : null;

      // 2. Fetch Sources and Campaigns with opt_filter: { pipeline_id }
      const [sources, campaigns] = await Promise.all([
        getSelectOptions("L_LEAD_SOURCES", pipeFilter).catch(() => []),
        getSelectOptions("L_CAMPAIGN_NAMES", pipeFilter).catch(() => []),
      ]);

      setSourcesList(sources);
      setCampaignsList(campaigns);

      if (sources.length > 0) {
        setSourceId(sources[0].id);
      } else {
        setSourceId("");
      }

      // Pre-select Campaign
      let chosenCampaignId = "";
      if (initialCampaignId) {
        chosenCampaignId = Number(initialCampaignId);
      } else if (initialCampaignName && campaigns.length > 0) {
        const found = campaigns.find(
          (c) =>
            (c.name || c.label || "").toLowerCase().trim() ===
            initialCampaignName.toLowerCase().trim()
        );
        chosenCampaignId = found ? found.id : campaigns[0].id;
      } else if (campaigns.length > 0) {
        chosenCampaignId = campaigns[0].id;
      }
      setCampaignId(chosenCampaignId);

      // 3. Fetch Users (L_TELECALLERS) with opt_filter: { campaign_id }
      const campFilter = chosenCampaignId
        ? { campaign_id: Number(chosenCampaignId) }
        : null;
      const users = await getSelectOptions("L_TELECALLERS", campFilter).catch(() => []);
      setUsersList(users);

      if (users.length > 0) {
        setAssignedToId(users[0].id);
      } else {
        setAssignedToId("");
      }
    } catch (err) {
      console.error("Failed to load add lead dropdown options:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePipelineChange = async (newPipelineId) => {
    const numPipelineId = newPipelineId ? Number(newPipelineId) : null;
    setPipelineCategoryId(newPipelineId);
    try {
      const pipeFilter = numPipelineId ? { pipeline_id: numPipelineId } : null;

      // 1. Fetch Sources and Campaigns with opt_filter: { pipeline_id }
      const [sources, campaigns] = await Promise.all([
        getSelectOptions("L_LEAD_SOURCES", pipeFilter).catch(() => []),
        getSelectOptions("L_CAMPAIGN_NAMES", pipeFilter).catch(() => []),
      ]);

      setSourcesList(sources);
      setCampaignsList(campaigns);

      // Check/maintain source selection
      if (sources.length > 0) {
        const stillValidSource = sources.some((s) => s.id === sourceId);
        setSourceId(stillValidSource ? sourceId : sources[0].id);
      } else {
        setSourceId("");
      }

      // Check/maintain campaign selection
      let newCampaignId = "";
      if (campaigns.length > 0) {
        const stillValidCamp = campaigns.some((c) => c.id === campaignId);
        newCampaignId = stillValidCamp ? campaignId : campaigns[0].id;
      }
      setCampaignId(newCampaignId);

      // 2. Fetch Users (L_TELECALLERS) with opt_filter: { campaign_id }
      const campFilter = newCampaignId ? { campaign_id: Number(newCampaignId) } : null;
      const users = await getSelectOptions("L_TELECALLERS", campFilter).catch(() => []);
      setUsersList(users);

      if (users.length > 0) {
        const stillValidUser = users.some((u) => u.id === assignedToId);
        setAssignedToId(stillValidUser ? assignedToId : users[0].id);
      } else {
        setAssignedToId("");
      }
    } catch (err) {
      console.error("Failed to fetch options for pipeline change:", err);
    }
  };

  const handleCampaignChange = async (newCampId) => {
    setCampaignId(newCampId);
    try {
      const campFilter = newCampId ? { campaign_id: Number(newCampId) } : null;
      const users = await getSelectOptions("L_TELECALLERS", campFilter).catch(() => []);
      setUsersList(users);

      if (users.length > 0) {
        const stillValidUser = users.some((u) => u.id === assignedToId);
        setAssignedToId(stillValidUser ? assignedToId : users[0].id);
      } else {
        setAssignedToId("");
      }
    } catch (err) {
      console.error("Failed to fetch telecallers for campaign:", err);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() && !lastName.trim()) {
      toast.error("Please enter First Name");
      return;
    }
    const mobileErr = validateMobile(mobileNo, "Mobile Number");
    if (mobileErr) {
      toast.error(mobileErr);
      return;
    }

    if (!pipelineCategoryId) {
      toast.error("Please select a Pipeline");
      return;
    }

    // Check if selected telecaller is paused for this campaign
    const selectedUser = usersList.find((u) => u.id === Number(assignedToId));
    if (selectedUser && selectedUser.is_active_for_campaign === false) {
      toast.error(
        `Cannot assign lead! Telecaller '${selectedUser.name || selectedUser.label}' is currently paused for this campaign!`
      );
      return;
    }

    const formattedMobile = formatWithCountryCode(mobileNo);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile_no: formattedMobile,
      email: emailId.trim(),
      pipeline_category_id: pipelineCategoryId ? Number(pipelineCategoryId) : null,
      campaign_id: campaignId ? Number(campaignId) : null,
      lead_source_id: sourceId ? Number(sourceId) : null,
      assigned_to_id: assignedToId ? Number(assignedToId) : null,
      enquiry_date: inquiryDate
        ? (inquiryDate.includes("T") ? inquiryDate : `${inquiryDate}T12:00:00.000Z`)
        : new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      const res = await addNewLead(payload);
      toast.success(
        res?.data?.data?.message || res?.data?.message || "Lead Created Successfully!"
      );
      onSaveSuccess?.(res?.data?.data || res?.data || payload);
      onSave?.(res?.data?.data || res?.data || payload);
      handleCloseModal();
    } catch (err) {
      console.error("Error creating lead:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.data?.message ||
          err?.message ||
          "Error adding lead"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setFirstName("");
    setLastName("");
    setMobileNo("");
    setEmailId("");
    setInquiryDate(todayString());
    onClose?.();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={handleCloseModal}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1,
          maxWidth: "460px",
        },
      }}
    >
      {/* DIALOG HEADER */}
      <DialogTitle
        sx={{
          pb: 0.5,
          pt: 1.5,
          px: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: BRAND_GREEN,
            }}
          >
            Add New Lead
          </Typography>
          <IconButton onClick={handleCloseModal} size="small" sx={{ color: BRAND_GREEN }}>
            <CloseIcon fontSize="medium" />
          </IconButton>
        </Box>
        <Typography
          sx={{
            fontSize: "13px",
            color: "#666666",
            mt: 0.5,
          }}
        >
          Enter the lead details below to add them to the pipeline.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 1.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} sx={{ color: BRAND_GREEN }} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0.5 }}>
            {/* FIRST NAME */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                First Name*
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: GREY_BG,
                    borderRadius: "8px",
                    height: "44px",
                    fontSize: "14px",
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>

            {/* LAST NAME */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                Last Name
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: GREY_BG,
                    borderRadius: "8px",
                    height: "44px",
                    fontSize: "14px",
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>

            {/* MOBILE NO* */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                Mobile No*
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter 10-digit Mobile No"
                value={mobileNo}
                onChange={(e) => setMobileNo(sanitizeMobileInput(e.target.value))}
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: GREY_BG,
                    borderRadius: "8px",
                    height: "44px",
                    fontSize: "14px",
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>

            {/* EMAIL ID */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                Email ID
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter Mail ID"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: GREY_BG,
                    borderRadius: "8px",
                    height: "44px",
                    fontSize: "14px",
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>

            {/* PIPELINE* */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                Pipeline*
              </Typography>
              <Select
                fullWidth
                value={pipelineCategoryId}
                onChange={(e) => handlePipelineChange(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: GREY_BG,
                  borderRadius: "8px",
                  height: "44px",
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              >
                {pipelineCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name || cat.label || cat.display_name || cat.category_name}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* CAMPAIGN* (DISABLED/LOCKED IF OPENED FROM ENQUIRY SHEET PAGE) */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                Campaign*{lockCampaign ? " (Locked to current Campaign)" : ""}
              </Typography>
              <Select
                fullWidth
                value={campaignId}
                disabled={Boolean(lockCampaign)}
                onChange={(e) => handleCampaignChange(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: lockCampaign ? "#E0E0E0" : GREY_BG,
                  borderRadius: "8px",
                  height: "44px",
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              >
                {campaignsList.length === 0 ? (
                  <MenuItem value="" disabled>
                    No campaigns found
                  </MenuItem>
                ) : (
                  campaignsList.map((camp) => (
                    <MenuItem key={camp.id} value={camp.id}>
                      {camp.name || camp.label || camp.campaign_name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </Box>

            {/* SOURCE TYPE */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                Source Type
              </Typography>
              <Select
                fullWidth
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: GREY_BG,
                  borderRadius: "8px",
                  height: "44px",
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              >
                {sourcesList.length === 0 ? (
                  <MenuItem value="" disabled>
                    No sources found
                  </MenuItem>
                ) : (
                  sourcesList.map((src) => (
                    <MenuItem key={src.id} value={src.id}>
                      {src.name || src.label || src.source_name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </Box>

            {/* USER */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                User
              </Typography>
              <Select
                fullWidth
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: GREY_BG,
                  borderRadius: "8px",
                  height: "44px",
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              >
                {usersList.length === 0 ? (
                  <MenuItem value="" disabled>
                    No users found
                  </MenuItem>
                ) : (
                  usersList.map((usr) => {
                    const isPaused = usr.is_active_for_campaign === false;
                    return (
                      <MenuItem
                        key={usr.id}
                        value={usr.id}
                        sx={{
                          color: isPaused ? "#D9383A" : "inherit",
                          fontWeight: isPaused ? 600 : 400,
                        }}
                      >
                        {usr.name || usr.label || usr.user_name || usr.username}{" "}
                        {isPaused ? "(Paused for this Campaign)" : ""}
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </Box>

            {/* INQUIRY DATE */}
            <Box>
              <Typography
                sx={{ fontSize: "13.5px", fontWeight: 600, color: "#333", mb: 0.6 }}
              >
                Inquiry Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={inquiryDate}
                onChange={(e) => setInquiryDate(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: GREY_BG,
                    borderRadius: "8px",
                    height: "44px",
                    fontSize: "14px",
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* DIALOG ACTIONS FOOTER */}
      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
        <Button
          onClick={handleCloseModal}
          disabled={submitting}
          sx={{
            height: "36px",
            px: 2.5,
            borderRadius: "6px",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
            border: `1px solid ${BRAND_GREEN}`,
            color: BRAND_GREEN,
            backgroundColor: "#fff",
            "&:hover": {
              backgroundColor: "#F8FDF0",
              borderColor: BRAND_GREEN,
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || submitting}
          sx={{
            height: "36px",
            px: 3,
            borderRadius: "6px",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
            backgroundColor: BRAND_GREEN,
            color: "#fff",
            boxShadow: "0px 4px 10px rgba(144, 217, 22, 0.3)",
            "&:hover": {
              backgroundColor: "#82C713",
            },
          }}
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLeadModal;
