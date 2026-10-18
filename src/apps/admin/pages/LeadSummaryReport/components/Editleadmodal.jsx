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
  Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

const BRAND_GREEN = "#8DC63F";
const BRAND_GREEN_DARK = "#7CB342";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#F9FAFB",
    fontSize: "14px",
    fontFamily: "inherit",
    "& fieldset": {
      borderColor: "#E5E7EB",
    },
    "&:hover fieldset": {
      borderColor: "#D1D5DB",
    },
    "&.Mui-focused fieldset": {
      borderColor: BRAND_GREEN,
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputBase-input": {
    py: "10px",
    px: "14px",
    color: "#1F2937",
  },
  "& .MuiSelect-select": {
    py: "10px",
    px: "14px",
    color: "#1F2937",
  },
};

function getTagFieldSx(tagValue) {
  const isHot = String(tagValue).toLowerCase() === "hot";
  return {
    ...fieldSx,
    "& .MuiOutlinedInput-root": {
      ...fieldSx["& .MuiOutlinedInput-root"],
      backgroundColor: isHot ? "#FEF2F2" : "#F9FAFB",
      "& fieldset": {
        borderColor: isHot ? "#FCA5A5" : "#E5E7EB",
      },
    },
    "& .MuiSelect-select": {
      ...fieldSx["& .MuiSelect-select"],
      color: isHot ? "#DC2626" : "#1F2937",
      fontWeight: isHot ? 600 : 400,
    },
  };
}

function FieldLabel({ children }) {
  return (
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        color: "#374151",
        mb: 0.8,
        fontSize: "13.5px",
      }}
    >
      {children}
    </Typography>
  );
}

function mapLeadToForm(lead = {}) {
  const fullName = (lead.lead_name || lead.full_name || lead.name || "").trim();
  const nameParts = fullName ? fullName.split(" ") : [];
  const fName = lead.firstName || lead.first_name || nameParts[0] || "";
  const lName =
    lead.lastName || lead.last_name || nameParts.slice(1).join(" ") || "";

  return {
    firstName: fName,
    lastName: lName,
    mobile:
      lead.lead_number || lead.mobile_no || lead.mobile || lead.phone || "",
    email: lead.email || lead.email_id || "",
    createdDate:
      lead.creation_date || lead.created_at || lead.createdDate || "",
    assignedTo: lead.assigned_to || lead.assignedTo || "",
    plan: lead.plan || lead.course_plan || "",
    course: lead.course || lead.course_name || "",
    pipeline: lead.pipeline || lead.pipeline_name || "",
    campaign: lead.campaign_name || lead.campaign || "",
    stage: lead.lead_stage || lead.stage || "",
    tag: lead.tag || "",
    amountPaid: lead.deal_amount || lead.amount_paid || lead.amountPaid || "",
    pendingAmount: lead.pending_amount || lead.pendingAmount || "",
  };
}

export default function EditLeadModal({
  open,
  onClose,
  onSave,
  lead = {},
  stageOptions = [],
  tagOptions = [],
  stageTagsMap = {},
}) {
  const [form, setForm] = useState(() => mapLeadToForm(lead));

  useEffect(() => {
    if (open) {
      setForm(mapLeadToForm(lead));
    }
  }, [open, lead]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const activeStages = Array.isArray(stageOptions) ? stageOptions : [];
  const activeTags = Array.isArray(tagOptions) ? tagOptions : [];
  const activeStageTagsMap =
    stageTagsMap && typeof stageTagsMap === "object" ? stageTagsMap : {};

  const currentStageKey = (form.stage || "").toLowerCase().trim();
  const availableTagsForStage =
    activeStageTagsMap[currentStageKey] &&
    activeStageTagsMap[currentStageKey].length > 0
      ? activeStageTagsMap[currentStageKey]
      : activeTags;

  const handleStageChange = (e) => {
    const newStage = e.target.value;
    const newStageKey = (newStage || "").toLowerCase().trim();
    const stageTags = activeStageTagsMap[newStageKey] || [];
    const defaultTagForNewStage = stageTags.length > 0 ? stageTags[0] : "-";

    setForm((prev) => ({
      ...prev,
      stage: newStage,
      tag: stageTags.includes(prev.tag) ? prev.tag : defaultTagForNewStage,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1,
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          pt: 2.5,
          pb: 1.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: BRAND_GREEN,
            fontSize: "20px",
          }}
        >
          Edit Lead
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#9CA3AF",
            "&:hover": { color: "#4B5563", backgroundColor: "#F3F4F6" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content Form Body */}
      <DialogContent sx={{ p: 3 }}>
        {/* Bulletproof 2-Column CSS Grid Layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 20px",
            width: "100%",
          }}
        >
          {/* Row 1: First Name & Last Name */}
          <Box>
            <FieldLabel>First Name</FieldLabel>
            <TextField
              fullWidth
              value={form.firstName}
              onChange={handleChange("firstName")}
              sx={fieldSx}
            />
          </Box>
          <Box>
            <FieldLabel>Last Name</FieldLabel>
            <TextField
              fullWidth
              value={form.lastName}
              onChange={handleChange("lastName")}
              sx={fieldSx}
            />
          </Box>

          {/* Row 2: Mobile No & Email ID */}
          <Box>
            <FieldLabel>Mobile No</FieldLabel>
            <TextField
              fullWidth
              value={form.mobile}
              onChange={handleChange("mobile")}
              sx={fieldSx}
            />
            <Link
              component="button"
              type="button"
              underline="none"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                mt: 1,
                fontSize: 13,
                fontWeight: 500,
                color: "#3B82F6",
                cursor: "pointer",
                "&:hover": { color: "#2563EB" },
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} /> Add Alternate Number
            </Link>
          </Box>
          <Box>
            <FieldLabel>Email ID</FieldLabel>
            <TextField
              fullWidth
              value={form.email}
              onChange={handleChange("email")}
              sx={fieldSx}
            />
          </Box>

          {/* Row 3: Created Date & Assigned To */}
          <Box>
            <FieldLabel>Created Date</FieldLabel>
            <TextField
              fullWidth
              value={form.createdDate}
              onChange={handleChange("createdDate")}
              sx={fieldSx}
            />
          </Box>
          <Box>
            <FieldLabel>Assigned To</FieldLabel>
            <TextField
              fullWidth
              value={form.assignedTo}
              onChange={handleChange("assignedTo")}
              sx={fieldSx}
            />
          </Box>

          {/* Row 4: Plan & Course */}
          <Box>
            <FieldLabel>Plan</FieldLabel>
            <TextField
              select
              fullWidth
              value={form.plan}
              onChange={handleChange("plan")}
              sx={fieldSx}
            >
              <MenuItem value="Fast Track">Fast Track</MenuItem>
              <MenuItem value="Regular">Regular</MenuItem>
              <MenuItem value="Self Paced">Self Paced</MenuItem>
            </TextField>
          </Box>
          <Box>
            <FieldLabel>Course</FieldLabel>
            <TextField
              select
              fullWidth
              value={form.course}
              onChange={handleChange("course")}
              sx={fieldSx}
            >
              <MenuItem value="F.S.Python">F.S.Python</MenuItem>
              <MenuItem value="F.S.Java">F.S.Java</MenuItem>
              <MenuItem value="MERN">MERN</MenuItem>
            </TextField>
          </Box>

          {/* Row 5: Pipeline & Campaign */}
          <Box>
            <FieldLabel>Pipeline</FieldLabel>
            <TextField
              fullWidth
              value={form.pipeline}
              onChange={handleChange("pipeline")}
              sx={fieldSx}
            />
          </Box>
          <Box>
            <FieldLabel>Campaign</FieldLabel>
            <TextField
              fullWidth
              value={form.campaign}
              onChange={handleChange("campaign")}
              sx={fieldSx}
            />
          </Box>

          {/* Row 6: Stage & Tag */}
          <Box>
            <FieldLabel>Stage</FieldLabel>
            <TextField
              select
              fullWidth
              value={form.stage || activeStages[0] || "new lead"}
              onChange={handleStageChange}
              sx={fieldSx}
            >
              {activeStages
                .concat(form.stage ? [form.stage] : [])
                .filter(Boolean)
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((stg) => (
                  <MenuItem key={stg} value={stg}>
                    {stg}
                  </MenuItem>
                ))}
            </TextField>
          </Box>
          <Box>
            <FieldLabel>Tag</FieldLabel>
            <TextField
              select
              fullWidth
              value={form.tag || availableTagsForStage[0] || "-"}
              onChange={handleChange("tag")}
              sx={getTagFieldSx(form.tag)}
            >
              {availableTagsForStage
                .concat(form.tag ? [form.tag] : [])
                .filter(Boolean)
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((tg) => (
                  <MenuItem key={tg} value={tg}>
                    {tg}
                  </MenuItem>
                ))}
            </TextField>
          </Box>

          {/* Row 7: Amount Paid & Pending Amount */}
          <Box>
            <FieldLabel>Amount Paid</FieldLabel>
            <TextField
              fullWidth
              value={form.amountPaid}
              onChange={handleChange("amountPaid")}
              sx={fieldSx}
            />
          </Box>
          <Box>
            <FieldLabel>Pending Amount</FieldLabel>
            <TextField
              fullWidth
              value={form.pendingAmount}
              onChange={handleChange("pendingAmount")}
              sx={fieldSx}
            />
          </Box>
        </Box>

        {/* Modal Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            mt: 3.5,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: BRAND_GREEN,
              color: BRAND_GREEN,
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 0.8,
              fontSize: 14,
              fontWeight: 600,
              minWidth: 90,
              "&:hover": {
                borderColor: BRAND_GREEN_DARK,
                backgroundColor: "rgba(141, 198, 63, 0.08)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={() => onSave && onSave(form)}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: BRAND_GREEN,
              color: "#FFFFFF",
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              py: 0.8,
              fontSize: 14,
              fontWeight: 600,
              minWidth: 90,
              "&:hover": {
                backgroundColor: BRAND_GREEN_DARK,
              },
            }}
          >
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
