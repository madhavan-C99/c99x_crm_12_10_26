import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";

const BRAND_GREEN = "#8BC34A";
const BRAND_GREEN_DARK = "#7CB342";
const DANGER_RED = "#DC2626";
const DANGER_RED_DARK = "#B91C1C";

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
      borderColor: DANGER_RED,
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputBase-input": {
    py: "10px",
    px: "14px",
    color: "#1F2937",
  },
};

export default function BulkDeleteModal({
  open,
  onClose,
  onConfirm,
  selectedCount = 0,
}) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setLoading(false);
    }
  }, [open]);

  const isConfirmed = confirmText.trim() === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) return;
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Bulk delete submit error:", err);
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
          Delete Lead
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
        {/* Red Danger Alert Box */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            backgroundColor: "#FEF2F2",
            border: "1px solid #FEE2E2",
            borderRadius: "8px",
            p: 1.5,
            mb: 2.5,
          }}
        >
          <ErrorOutlineIcon sx={{ color: DANGER_RED, fontSize: 22, mt: 0.2 }} />
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                color: "#991B1B",
                fontWeight: 700,
                mb: 0.3,
              }}
            >
              This action cannot be undone.
            </Typography>
            <Typography
              sx={{ fontSize: "12.5px", color: "#7F1D1D", fontWeight: 400 }}
            >
              You are about to permanently delete{" "}
              <strong>{selectedCount}</strong> selected leads.
            </Typography>
          </Box>
        </Box>

        {/* Confirmation Field */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#374151",
              mb: 0.8,
              fontSize: "13px",
            }}
          >
            Please confirm by typing{" "}
            <span style={{ color: DANGER_RED, fontWeight: 700 }}>DELETE</span>
          </Typography>

          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            sx={fieldSx}
          />
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
            onClick={handleDelete}
            variant="contained"
            disabled={!isConfirmed || loading}
            disableElevation
            sx={{
              backgroundColor: DANGER_RED,
              color: "#FFFFFF",
              borderRadius: "8px",
              textTransform: "none",
              px: 2.5,
              py: 0.8,
              fontSize: 14,
              fontWeight: 600,
              "&:hover": {
                backgroundColor: DANGER_RED_DARK,
              },
              "&.Mui-disabled": {
                backgroundColor: "#FCA5A5",
                color: "#FFFFFF",
                opacity: 0.7,
              },
            }}
          >
            {loading ? "Deleting..." : `Delete ${selectedCount} Leads`}
          </Button>
        </Box>

        {/* Subtitle Footer */}
        <Typography
          align="center"
          sx={{ fontSize: "12.5px", color: "#6B7280", mt: 1 }}
        >
          Selected leads will be permanently deleted from the system.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
