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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { getAddLeadOptions, addNewLead } from "@/apps/admin/services/add_new_lead_service";

const BRAND_GREEN = "#90D916";
const GREY_BG = "#F5F5F5";

export const AddLeadModal = ({
  open,
  onClose,
  onSaveSuccess,
  initialCampaignId = null,
  initialCampaignName = "",
  initialPipelineCategoryId = null,
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
  const [inquiryDate, setInquiryDate] = useState("");

  // Dropdown options from Backend API
  const [campaignsList, setCampaignsList] = useState([]);
  const [pipelineCategories, setPipelineCategories] = useState([]);
  const [sourcesList, setSourcesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadDropdownOptions();
    }
  }, [open, initialCampaignId, initialCampaignName, initialPipelineCategoryId, campaignId]);

  const loadDropdownOptions = async () => {
    try {
      setLoading(true);
      const activeCampaignId = campaignId || initialCampaignId;
      const res = await getAddLeadOptions({
        campaign_id: activeCampaignId ? Number(activeCampaignId) : null,
        campaign_name: initialCampaignName || "",
      });
      const data = res?.data?.data || {};

      const campaigns = data.campaigns || [];
      const categories = data.pipeline_categories || [];
      const sources = data.sources || [];
      const users = data.users || [];

      setCampaignsList(campaigns);
      setPipelineCategories(categories);
      setSourcesList(sources);
      setUsersList(users);

      if (initialPipelineCategoryId) {
        setPipelineCategoryId(Number(initialPipelineCategoryId));
      } else if (categories.length > 0 && !pipelineCategoryId) {
        setPipelineCategoryId(categories[0].id);
      }

      // Pre-select & lock campaign if opened from specific campaign Enquiry Sheet page
      if (initialCampaignId) {
        setCampaignId(Number(initialCampaignId));
      } else if (initialCampaignName && campaigns.length > 0) {
        const found = campaigns.find(
          (c) => c.name.toLowerCase().trim() === initialCampaignName.toLowerCase().trim()
        );
        if (found) {
          setCampaignId(found.id);
        } else if (campaigns.length > 0 && !campaignId) {
          setCampaignId(campaigns[0].id);
        }
      } else if (campaigns.length > 0 && !campaignId) {
        setCampaignId(campaigns[0].id);
      }

      if (sources.length > 0 && !sourceId) setSourceId(sources[0].id);
      if (users.length > 0 && !assignedToId) setAssignedToId(users[0].id);
    } catch (err) {
      console.error("Failed to load add lead dropdown options:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() && !lastName.trim()) {
      toast.error("Please enter First Name");
      return;
    }
    if (!mobileNo.trim()) {
      toast.error("Please enter Mobile Number");
      return;
    }

    // Check if selected telecaller is paused for this campaign
    const selectedUser = usersList.find((u) => u.id === Number(assignedToId));
    if (selectedUser && selectedUser.is_active_for_campaign === false) {
      toast.error(`Cannot assign lead! Telecaller '${selectedUser.name}' is currently paused for this campaign!`);
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      mobile_no: mobileNo,
      email: emailId,
      pipeline_category_id: pipelineCategoryId ? Number(pipelineCategoryId) : null,
      campaign_id: campaignId ? Number(campaignId) : null,
      lead_source_id: sourceId ? Number(sourceId) : null,
      assigned_to_id: assignedToId ? Number(assignedToId) : null,
      enquiry_date: inquiryDate || null,
    };

    try {
      setLoading(true);
      const res = await addNewLead(payload);
      toast.success(res?.data?.data?.message || "Lead Created Successfully!");
      onSaveSuccess?.(res?.data?.data || payload);
      onClose?.();
      // Reset form
      setFirstName("");
      setLastName("");
      setMobileNo("");
      setEmailId("");
    } catch (err) {
      console.error("Error creating lead:", err);
      toast.error(err?.response?.data?.message || err?.message || "Error adding lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
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
          <IconButton onClick={onClose} size="small" sx={{ color: BRAND_GREEN }}>
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
              placeholder="Enter Mobile No"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
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
              onChange={(e) => setPipelineCategoryId(e.target.value)}
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
                  {cat.display_name || cat.category_name}
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
              onChange={(e) => setCampaignId(e.target.value)}
              sx={{
                backgroundColor: lockCampaign ? "#E0E0E0" : GREY_BG,
                borderRadius: "8px",
                height: "44px",
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {campaignsList.map((camp) => (
                <MenuItem key={camp.id} value={camp.id}>
                  {camp.name}
                </MenuItem>
              ))}
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
              sx={{
                backgroundColor: GREY_BG,
                borderRadius: "8px",
                height: "44px",
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {sourcesList.map((src) => (
                <MenuItem key={src.id} value={src.id}>
                  {src.name}
                </MenuItem>
              ))}
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
              sx={{
                backgroundColor: GREY_BG,
                borderRadius: "8px",
                height: "44px",
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {usersList.map((usr) => {
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
                    {usr.name || usr.username} {isPaused ? "(Paused for this Campaign)" : ""}
                  </MenuItem>
                );
              })}
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
      </DialogContent>

      {/* DIALOG ACTIONS FOOTER */}
      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
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
          disabled={loading}
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
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLeadModal;
