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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const BRAND_GREEN = "#8BC34A";
const BRAND_GREEN_DARK = "#7CB342";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
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

export default function ChangeStatusModal({
  open,
  onClose,
  onSubmit,
  selectedCount = 0,
  statusOptions = [],
}) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedStatus("");
      setNote("");
      setLoading(false);
    }
  }, [open]);

  const defaultStatusList = [
    "working",
    "won",
    "loss",
    "unreached",
    "pending",
    "contact_attempt",
    "future",
  ];

  const activeStatusList =
    statusOptions && statusOptions.length > 0
      ? statusOptions
      : defaultStatusList;

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    try {
      setLoading(true);
      await onSubmit({
        status_name: selectedStatus,
        note: note,
      });
      onClose();
    } catch (err) {
      console.error("Change status submit error:", err);
    } finally {
      setLoading(false);
    }
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
          p: 1.5,
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
          px: 2,
          pt: 1.5,
          pb: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#111827",
            fontSize: "17px",
          }}
        >
          Change Lead Status
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

      <DialogContent sx={{ p: 2, pt: 1 }}>
        {/* Info Banner */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            backgroundColor: "#EFF6FF",
            border: "1px solid #DBEAFE",
            borderRadius: "8px",
            p: 1.5,
            mb: 2.5,
          }}
        >
          <InfoOutlinedIcon sx={{ color: "#2563EB", fontSize: 20 }} />
          <Typography
            sx={{ fontSize: "13px", color: "#1D4ED8", fontWeight: 500 }}
          >
            You are about to change the status of{" "}
            <strong>{selectedCount}</strong> selected leads.
          </Typography>
        </Box>

        {/* Field 1: Select Lead Status */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#374151",
              mb: 0.8,
              fontSize: "13.5px",
            }}
          >
            Select Lead Status <span style={{ color: "#EF4444" }}>*</span>
          </Typography>

          <TextField
            select
            fullWidth
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            displayEmpty
            sx={fieldSx}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (!selected) {
                  return (
                    <span style={{ color: "#9CA3AF" }}>Select Status</span>
                  );
                }
                return selected;
              },
            }}
          >
            <MenuItem value="" disabled>
              Select Status
            </MenuItem>
            {activeStatusList.map((stg) => (
              <MenuItem key={stg} value={stg}>
                {stg}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Field 2: Add Note (Optional) */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#374151",
              mb: 0.8,
              fontSize: "13.5px",
            }}
          >
            Add Note (Optional)
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={note}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setNote(e.target.value);
              }
            }}
            placeholder="Enter note..."
            sx={fieldSx}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 0.5,
            }}
          >
            <Typography sx={{ fontSize: "12px", color: "#9CA3AF" }}>
              {note.length}/200
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            mb: 2,
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
              px: 2.5,
              py: 0.8,
              fontSize: 14,
              fontWeight: 600,
              "&:hover": {
                borderColor: BRAND_GREEN_DARK,
                backgroundColor: "rgba(139, 195, 74, 0.08)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!selectedStatus || loading}
            disableElevation
            sx={{
              backgroundColor: BRAND_GREEN,
              color: "#FFFFFF",
              borderRadius: "8px",
              textTransform: "none",
              px: 2.5,
              py: 0.8,
              fontSize: 14,
              fontWeight: 600,
              "&:hover": {
                backgroundColor: BRAND_GREEN_DARK,
              },
              "&.Mui-disabled": {
                backgroundColor: "#D1D5DB",
                color: "#9CA3AF",
              },
            }}
          >
            {loading ? "Updating..." : `Update ${selectedCount} Leads`}
          </Button>
        </Box>

        {/* Subtitle Footer */}
        <Typography
          align="center"
          sx={{ fontSize: "12.5px", color: "#6B7280", mt: 1 }}
        >
          Selected leads status will be updated to the status you choose.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
