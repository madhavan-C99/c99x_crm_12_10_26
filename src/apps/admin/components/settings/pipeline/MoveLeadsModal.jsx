import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function MoveLeadsModal({
  open,
  onClose,
  stage,
  availableStages = [],
  leadCount = 0,
  isSubmitting = false,
  onConfirmMoveAndDelete,
}) {
  const stageName = stage?.name || "";

  // Filter out the stage being deleted
  const eligibleStages = availableStages.filter(
    (s) => String(s.id) !== String(stage?.id)
  );

  const [targetStageId, setTargetStageId] = useState("");
  const [targetTagId, setTargetTagId] = useState("");
  const [deletionReason, setDeletionReason] = useState("");

  // Initialize selected target stage when modal opens
  useEffect(() => {
    if (open && eligibleStages.length > 0) {
      const defaultTarget = eligibleStages[0];
      setTargetStageId(defaultTarget?.id || "");
      setTargetTagId("");
      setDeletionReason("");
    }
  }, [open, stage?.id]);

  // Selected target stage object
  const selectedTargetStage = eligibleStages.find(
    (s) => String(s.id) === String(targetStageId)
  );

  // Available tags for the currently selected target stage
  const availableTags = selectedTargetStage?.tags || [];

  // Reset tag selection when target stage changes
  const handleTargetStageChange = (e) => {
    const newStageId = e.target.value;
    setTargetStageId(newStageId);
    setTargetTagId("");
  };

  const selectedTagName = availableTags.find(
    (t) => String(t.id) === String(targetTagId)
  )?.name;

  const handleSubmit = () => {
    if (!targetStageId) return;
    onConfirmMoveAndDelete({
      targetStageId,
      targetTagId: targetTagId || null,
      reason: deletionReason.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          p: 2,
          position: "relative",
        },
      }}
    >
      {/* Top right close button */}
      <IconButton
        size="small"
        onClick={onClose}
        disabled={isSubmitting}
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          color: "#64748B",
        }}
      >
        <CloseIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <DialogContent sx={{ px: 1, pt: 1.5, pb: 1 }}>
        {/* Title */}
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "17px",
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
            pr: 3,
          }}
        >
          Move Leads from <strong>"{stageName}"</strong>
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: "13px",
            color: "#64748B",
            fontFamily: "Inter, sans-serif",
            mt: 0.8,
            mb: 2.5,
            lineHeight: 1.4,
          }}
        >
          Select a stage to move the {leadCount} leads currently in "{stageName}" stage
        </Typography>

        {/* Form Field 1: Move to stage* */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              mb: 0.8,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Move to stage*
          </Typography>
          <Select
            fullWidth
            size="small"
            value={targetStageId}
            onChange={handleTargetStageChange}
            sx={{
              fontSize: "14px",
              color: "#1E293B",
              borderRadius: "6px",
              backgroundColor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#CBD5E1",
              },
            }}
          >
            {eligibleStages.map((st) => (
              <MenuItem key={st.id} value={st.id} sx={{ fontSize: "13px" }}>
                {st.name}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Form Field 2: Relative Tag for Target Stage */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              mb: 0.8,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Select Tag (Optional)
          </Typography>
          <Select
            fullWidth
            size="small"
            value={targetTagId}
            onChange={(e) => setTargetTagId(e.target.value)}
            displayEmpty
            sx={{
              fontSize: "14px",
              color: "#1E293B",
              borderRadius: "6px",
              backgroundColor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#CBD5E1",
              },
            }}
          >
            <MenuItem value="" sx={{ fontSize: "13px", color: "#94A3B8" }}>
              <em>{availableTags.length === 0 ? "No tags in this stage" : "None (Keep default)"}</em>
            </MenuItem>
            {availableTags.map((tag) => (
              <MenuItem
                key={tag.id || tag.name}
                value={tag.id}
                sx={{
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: tag.borderColor || "#84CC16",
                  }}
                />
                <span>{tag.name}</span>
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Form Field 3: Reason for Deletion (Optional) */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              mb: 0.8,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Reason for Deletion (Optional)
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Merged into Follow-up, Workflow restructuring..."
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            sx={{
              backgroundColor: "#FFFFFF",
              "& .MuiOutlinedInput-root": {
                borderRadius: "6px",
                fontSize: "13px",
                color: "#1E293B",
                "& fieldset": {
                  borderColor: "#CBD5E1",
                },
              },
            }}
          />
        </Box>

        {/* Blue Info Alert Box */}
        <Box
          sx={{
            backgroundColor: "#F0F9FF",
            border: "1px solid #BAE6FD",
            borderRadius: "8px",
            p: 1.5,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          <InfoOutlinedIcon sx={{ color: "#0284C7", fontSize: 20, mt: 0.2 }} />
          <Typography
            sx={{
              fontSize: "12px",
              color: "#0369A1",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.45,
            }}
          >
            All <strong>{leadCount} Leads</strong> in "{stageName}" stage will be moved to{" "}
            <strong>"{selectedTargetStage?.name || "selected"}"</strong> stage
            {selectedTagName ? ` with tag "${selectedTagName}".` : "."}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 1, pt: 1.5, pb: 1, display: "flex", gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            flex: 1,
            height: "38px",
            borderColor: "#CBD5E1",
            color: "#475569",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "14px",
            borderRadius: "6px",
            "&:hover": {
              borderColor: "#94A3B8",
              backgroundColor: "#F8FAFC",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!targetStageId || isSubmitting}
          sx={{
            flex: 1.2,
            height: "38px",
            backgroundColor: "#84CC16",
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#65A30D",
              boxShadow: "none",
            },
          }}
        >
          {isSubmitting ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
              <span>Moving...</span>
            </Box>
          ) : (
            "Move & Delete"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
