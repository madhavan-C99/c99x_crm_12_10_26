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

export default function MoveTagLeadsModal({
  open,
  onClose,
  tag,
  stage,
  availableStages = [],
  leadCount = 0,
  isSubmitting = false,
  onConfirmMoveAndDeleteTag,
}) {
  const tagName = tag?.name || "Tag";
  const stageName = stage?.name || "this stage";

  const [targetStageId, setTargetStageId] = useState("");
  const [targetTagId, setTargetTagId] = useState("");
  const [deletionReason, setDeletionReason] = useState("");

  // Initialize selected target stage (defaults to current stage) when modal opens
  useEffect(() => {
    if (open) {
      const currentStageExists = availableStages.find((s) => String(s.id) === String(stage?.id));
      const initialStageId = currentStageExists ? stage?.id : (availableStages[0]?.id || "");
      setTargetStageId(initialStageId);

      // Select first eligible tag
      const initialStageObj = availableStages.find((s) => String(s.id) === String(initialStageId));
      const initialTags = (initialStageObj?.tags || []).filter(
        (t) => String(t.id) !== String(tag?.id) && t.name !== tag?.name
      );
      setTargetTagId(initialTags[0]?.id || "");
      setDeletionReason("");
    }
  }, [open, stage?.id, tag?.id]);

  // Selected target stage object
  const selectedTargetStage = availableStages.find(
    (s) => String(s.id) === String(targetStageId)
  );

  // Available tags for the currently selected target stage (excluding the source tag if same stage)
  const eligibleTags = (selectedTargetStage?.tags || []).filter((t) => {
    if (String(targetStageId) === String(stage?.id)) {
      return String(t.id) !== String(tag?.id) && t.name !== tag?.name;
    }
    return true;
  });

  // Handle stage change
  const handleTargetStageChange = (e) => {
    const newStageId = e.target.value;
    setTargetStageId(newStageId);
    const newStageObj = availableStages.find((s) => String(s.id) === String(newStageId));
    const nextTags = (newStageObj?.tags || []).filter((t) => {
      if (String(newStageId) === String(stage?.id)) {
        return String(t.id) !== String(tag?.id) && t.name !== tag?.name;
      }
      return true;
    });
    setTargetTagId(nextTags[0]?.id || "");
  };

  const selectedTagName = eligibleTags.find(
    (t) => String(t.id) === String(targetTagId)
  )?.name;

  const handleSubmit = () => {
    if (!targetTagId) return;
    onConfirmMoveAndDeleteTag({
      targetStageId,
      targetTagId,
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
          Move Leads from Tag <strong>"{tagName}"</strong>
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
          Select a destination tag to move the <strong>{leadCount} leads</strong> currently tagged with "{tagName}" in "{stageName}".
        </Typography>

        {/* Form Field 1: Destination Stage */}
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
            Destination Stage *
          </Typography>
          <Select
            fullWidth
            size="small"
            value={targetStageId}
            onChange={handleTargetStageChange}
            sx={{
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#CBD5E1",
              },
            }}
          >
            {availableStages.map((st) => (
              <MenuItem key={st.id} value={st.id} sx={{ fontSize: "14px" }}>
                {st.name} {String(st.id) === String(stage?.id) ? "(Current Stage)" : ""}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Form Field 2: Move to Tag */}
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
            Move to Tag *
          </Typography>
          {eligibleTags.length > 0 ? (
            <Select
              fullWidth
              size="small"
              value={targetTagId}
              onChange={(e) => setTargetTagId(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#FFFFFF",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                },
              }}
            >
              {eligibleTags.map((t) => (
                <MenuItem key={t.id || t.name} value={t.id} sx={{ fontSize: "14px" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: t.borderColor || "#84CC16",
                      }}
                    />
                    <span>{t.name}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Typography
              sx={{
                fontSize: "12px",
                color: "#EF4444",
                fontFamily: "Inter, sans-serif",
                mt: 0.5,
              }}
            >
              No other tags available in "{selectedTargetStage?.name || "this stage"}". Please select another destination stage.
            </Typography>
          )}
        </Box>

        {/* Form Field 3: Reason for deletion (optional) */}
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
            Reason for Deletion <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Deprecated tag, Merged into other priority..."
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "13px",
              },
            }}
          />
        </Box>

        {/* Warning Note Box */}
        <Box
          sx={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #DCFCE7",
            borderRadius: "8px",
            p: 1.5,
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, color: "#16A34A", mt: 0.2 }} />
          <Typography
            sx={{
              fontSize: "12px",
              color: "#15803D",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.4,
            }}
          >
            All <strong>{leadCount} leads</strong> tagged with "{tagName}" will be re-assigned to{" "}
            <strong>"{selectedTagName || "the chosen tag"}"</strong>.
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
          disabled={!targetTagId || isSubmitting}
          sx={{
            flex: 1.4,
            height: "38px",
            backgroundColor: "#EF4444",
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#DC2626",
              boxShadow: "none",
            },
            "&:disabled": {
              backgroundColor: "#FCA5A5",
              color: "#FFFFFF",
            },
          }}
        >
          {isSubmitting ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
              <span>Moving...</span>
            </Box>
          ) : (
            "Move Leads & Delete Tag"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
