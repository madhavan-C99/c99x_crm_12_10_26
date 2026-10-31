import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Switch,
  Paper,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddTagModal from "./AddTagModal";
import ColorPickerSection from "./ColorPickerSection";
import AddStageModal from "./AddStageModal";

export default function CreatePipelineModal({ open, onClose, onCreate }) {
  const [pipelineName, setPipelineName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start with clean initial bounds (New Lead -> Joined / Closed, 0 dummy middle stages)
  const [stages, setStages] = useState([
    {
      id: "new_lead",
      name: "New Lead",
      isFirst: true,
      stage_color: "",
      color: "",
      color_code: "",
      tags: [],
    },
  ]);

  const [terminals, setTerminals] = useState({
    joined: { id: "joined", name: "Won", tags: [], stage_color: "", color: "", color_code: "" },
    closed: { id: "closed", name: "Loss", tags: [], stage_color: "", color: "", color_code: "" },
  });

  const [selectedStageId, setSelectedStageId] = useState("new_lead");
  const [editStageName, setEditStageName] = useState("New Lead");
  const [editStageColor, setEditStageColor] = useState("");
  const [colorError, setColorError] = useState("");
  const [editStageTags, setEditStageTags] = useState([]);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [insertStageIndex, setInsertStageIndex] = useState(-1);
  const [editingTag, setEditingTag] = useState(null);
  const [lossReasonInput, setLossReasonInput] = useState("");

  const handleAddLossReason = () => {
    const trimmed = lossReasonInput.trim();
    if (!trimmed) return;
    setTerminals((prevT) => {
      const closedTerminal = prevT.closed || { id: "closed", name: "Loss", tags: [], reasons: [] };
      const currentReasons = Array.isArray(closedTerminal.reasons)
        ? closedTerminal.reasons
        : Array.isArray(closedTerminal.loss_reasons)
        ? closedTerminal.loss_reasons
        : [];
      if (currentReasons.includes(trimmed)) return prevT;
      const nextReasons = [...currentReasons, trimmed];
      return {
        ...prevT,
        closed: {
          ...closedTerminal,
          reasons: nextReasons,
          loss_reasons: nextReasons,
        },
      };
    });
    setLossReasonInput("");
  };

  const handleDeleteLossReason = (reasonToDelete) => {
    setTerminals((prevT) => {
      const closedTerminal = prevT.closed || { id: "closed", name: "Loss", tags: [], reasons: [] };
      const currentReasons = Array.isArray(closedTerminal.reasons)
        ? closedTerminal.reasons
        : Array.isArray(closedTerminal.loss_reasons)
        ? closedTerminal.loss_reasons
        : [];
      const nextReasons = currentReasons.filter((r) => r !== reasonToDelete);
      return {
        ...prevT,
        closed: {
          ...closedTerminal,
          reasons: nextReasons,
          loss_reasons: nextReasons,
        },
      };
    });
  };

  // Reset to pristine clean state whenever modal opens
  useEffect(() => {
    if (open) {
      setPipelineName("");
      setIsDefault(false);
      setNameError("");
      setColorError("");

      const initialStage = {
        id: `new_lead_${Date.now()}`,
        name: "New Lead",
        isFirst: true,
        stage_color: "",
        color: "",
        color_code: "",
        tags: [],
      };

      setStages([initialStage]);
      setTerminals({
        joined: { id: "joined", name: "Won", tags: [], stage_color: "#02E840", color: "#02E840", color_code: "#02E840" },
        closed: { id: "closed", name: "Loss", tags: [], reasons: [], stage_color: "#EF4444", color: "#EF4444", color_code: "#EF4444" },
      });

      setSelectedStageId(initialStage.id);
      setEditStageName("New Lead");
      setEditStageColor("");
      setEditStageTags([]);
      setLossReasonInput("");
    }
  }, [open]);

  // Select a stage in flowchart to view/edit in right panel
  const handleSelectStage = (stage) => {
    if (!stage) return;
    setSelectedStageId(stage.id);
    setEditStageName(stage.name || "");
    setEditStageColor(stage.stage_color || stage.color || stage.color_code || "");
    setEditStageTags(stage.tags || []);
    setColorError("");
  };

  // Real-time update of stage color in right panel and flowchart
  const handleEditStageColorChange = (newColor) => {
    setEditStageColor(newColor);
    setColorError("");
    setNameError("");
    if (selectedStageId === "joined" || selectedStageId === "closed") {
      setTerminals((prev) => ({
        ...prev,
        [selectedStageId]: {
          ...prev[selectedStageId],
          stage_color: newColor,
          color: newColor,
          color_code: newColor,
        },
      }));
    } else {
      setStages((prev) =>
        prev.map((s) =>
          s.id === selectedStageId
            ? { ...s, stage_color: newColor, color: newColor, color_code: newColor }
            : s
        )
      );
    }
  };

  // Open AddStageModal to prompt for Stage Name and Color
  const handleOpenAddStage = (index) => {
    setInsertStageIndex(index !== undefined ? index : stages.length - 1);
    setIsAddStageOpen(true);
  };

  const handleConfirmAddStage = ({ name, stage_color, color, color_code, insertIndex }) => {
    const insertIdx = insertIndex < 0 ? stages.length : insertIndex + 1;
    const finalCol = stage_color || color || color_code || "";
    const newStage = {
      id: `stage_${Date.now()}`,
      name: name,
      stage_color: finalCol,
      color: finalCol,
      color_code: finalCol,
      isFirst: false,
      tags: [],
    };
    const nextStages = [...stages];
    nextStages.splice(insertIdx, 0, newStage);
    setStages(nextStages);
    handleSelectStage(newStage);
  };

  // Delete a stage
  const handleDeleteStage = (stageId, e) => {
    if (e) e.stopPropagation();
    const targetStage = stages.find((s) => s.id === stageId);
    if (stageId === "joined" || stageId === "closed" || targetStage?.isFirst || stages[0]?.id === stageId) {
      return;
    }
    const nextStages = stages.filter((s) => s.id !== stageId);
    setStages(nextStages);

    if (selectedStageId === stageId) {
      if (nextStages.length > 0) {
        handleSelectStage(nextStages[0]);
      } else {
        handleSelectStage({
          id: "joined",
          name: terminals.joined.name,
          tags: terminals.joined.tags,
          stage_color: terminals.joined.stage_color || terminals.joined.color || terminals.joined.color_code || "",
          color: terminals.joined.color || terminals.joined.color_code || "",
          color_code: terminals.joined.color || terminals.joined.color_code || "",
        });
      }
    }
  };

  // Save current stage edits from the right panel into flowchart
  const handleSaveStage = () => {
    const trimmedName = editStageName.trim();
    if (selectedStageId === "joined" || selectedStageId === "closed") {
      setTerminals((prev) => ({
        ...prev,
        [selectedStageId]: {
          ...prev[selectedStageId],
          name: trimmedName || prev[selectedStageId].name,
          stage_color: editStageColor || prev[selectedStageId].stage_color || prev[selectedStageId].color || "",
          color: editStageColor || prev[selectedStageId].color || "",
          color_code: editStageColor || prev[selectedStageId].color_code || "",
          tags: editStageTags,
        },
      }));
    } else {
      setStages((prev) =>
        prev.map((s) =>
          s.id === selectedStageId
            ? {
                ...s,
                name: trimmedName || s.name,
                stage_color: editStageColor || s.stage_color || s.color || "",
                color: editStageColor || s.color || "",
                color_code: editStageColor || s.color_code || "",
                tags: editStageTags,
              }
            : s
        )
      );
    }
  };

  // Add tag from AddTagModal
  const handleAddTag = (newTag) => {
    setEditStageTags((prev) => {
      const updated = [...prev, newTag];
      // Live sync to active stage
      if (selectedStageId === "joined" || selectedStageId === "closed") {
        setTerminals((tPrev) => ({
          ...tPrev,
          [selectedStageId]: {
            ...tPrev[selectedStageId],
            tags: updated,
          },
        }));
      } else {
        setStages((sPrev) =>
          sPrev.map((s) =>
            s.id === selectedStageId ? { ...s, tags: updated } : s
          )
        );
      }
      return updated;
    });
  };

  // Remove tag
  const handleRemoveTag = (tagName) => {
    setEditStageTags((prev) => {
      const updated = prev.filter((t) => t.name !== tagName);
      if (selectedStageId === "joined" || selectedStageId === "closed") {
        setTerminals((tPrev) => ({
          ...tPrev,
          [selectedStageId]: {
            ...tPrev[selectedStageId],
            tags: updated,
          },
        }));
      } else {
        setStages((sPrev) =>
          sPrev.map((s) =>
            s.id === selectedStageId ? { ...s, tags: updated } : s
          )
        );
      }
      return updated;
    });
    setEditingTag(null);
  };

  // Open edit modal for a tag
  const handleOpenEditTag = (tag) => {
    setEditingTag(tag);
    setIsAddTagOpen(true);
  };

  // Close tag modal
  const handleCloseTagModal = () => {
    setIsAddTagOpen(false);
    setEditingTag(null);
  };

  // Update existing tag and live sync
  const handleUpdateTag = (updatedTag) => {
    if (!editingTag) return;
    setEditStageTags((prev) => {
      const updated = prev.map((t) =>
        t.name === editingTag.name ? { ...t, ...updatedTag } : t
      );
      if (selectedStageId === "joined" || selectedStageId === "closed") {
        setTerminals((tPrev) => ({
          ...tPrev,
          [selectedStageId]: {
            ...tPrev[selectedStageId],
            tags: updated,
          },
        }));
      } else {
        setStages((sPrev) =>
          sPrev.map((s) =>
            s.id === selectedStageId ? { ...s, tags: updated } : s
          )
        );
      }
      return updated;
    });
    setEditingTag(null);
  };

  // Submit and create pipeline
  const handleFinalSave = async () => {
    if (!pipelineName.trim()) {
      setNameError("Pipeline name is required");
      return;
    }

    // Auto-commit any currently active stage name/tags/color in the right panel
    const currentName = editStageName.trim();
    let finalStages = stages.map((s) => {
      const isCur = s.id === selectedStageId;
      const c = isCur
        ? (editStageColor || s.stage_color || s.color || s.color_code || "")
        : (s.stage_color || s.color || s.color_code || "");
      return {
        id: s.id,
        name: isCur ? (currentName || s.name) : s.name,
        isFirst: Boolean(s.isFirst),
        stage_color: c,
        tags: isCur ? editStageTags : (s.tags || []),
      };
    });

    let finalTerminals = {};
    const joinedCol = selectedStageId === "joined"
      ? (editStageColor || terminals.joined?.stage_color || terminals.joined?.color || "#02E840")
      : (terminals.joined?.stage_color || terminals.joined?.color || "#02E840");

    const closedCol = selectedStageId === "closed"
      ? (editStageColor || terminals.closed?.stage_color || terminals.closed?.color || "#EF4444")
      : (terminals.closed?.stage_color || terminals.closed?.color || "#EF4444");

    const closedReasons = Array.isArray(terminals.closed?.reasons)
      ? terminals.closed.reasons
      : Array.isArray(terminals.closed?.loss_reasons)
      ? terminals.closed.loss_reasons
      : [];

    finalTerminals.joined = {
      id: "joined",
      name: selectedStageId === "joined" ? (currentName || terminals.joined?.name || "Won") : (terminals.joined?.name || "Won"),
      stage_color: joinedCol,
      tags: selectedStageId === "joined" ? editStageTags : (terminals.joined?.tags || []),
    };

    finalTerminals.closed = {
      id: "closed",
      name: selectedStageId === "closed" ? (currentName || terminals.closed?.name || "Loss") : (terminals.closed?.name || "Loss"),
      stage_color: closedCol,
      tags: selectedStageId === "closed" ? editStageTags : (terminals.closed?.tags || []),
      reasons: closedReasons,
    };

    // Compulsory check: every stage MUST have a stage_color
    const stageWithoutColor = finalStages.find(
      (s) => !s.stage_color || !String(s.stage_color).trim()
    );
    if (stageWithoutColor) {
      const colErrMsg = `Stage color is compulsory. Please select a color for stage "${stageWithoutColor.name}".`; setNameError(colErrMsg); toast.error(colErrMsg);
      if (stageWithoutColor.id !== selectedStageId) {
        handleSelectStage(stageWithoutColor);
      }
      setColorError("Stage color is compulsory. Please select a color.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate({
        name: pipelineName.trim(),
        isDefault,
        stages: finalStages,
        terminals: finalTerminals,
      });
      onClose();
    } catch (err) {
      console.error("Error creating pipeline:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create pipeline";
      setNameError(errMsg); toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "10px",
          maxWidth: "980px",
          p: 0,
        },
      }}
    >
      {/* Header: Title is "Create Pipeline" */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "17px",
            color: "#0F172A",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Create Pipeline
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 20, color: "#64748B" }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {/* Top Control Row: Pipeline Name & Make This Default Pipeline */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {/* Pipeline Name Input */}
          <Box sx={{ flex: 1, minWidth: "260px" }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#334155",
                mb: 0.5,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Pipeline Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Course, B2B Corporate, Real Estate"
              value={pipelineName}
              onChange={(e) => {
                setPipelineName(e.target.value);
                if (nameError) setNameError("");
              }}
              error={Boolean(nameError)}
              helperText={nameError}
              autoFocus
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  "&.Mui-focused fieldset": {
                    borderColor: "#84CC16",
                  },
                },
              }}
            />
          </Box>

          {/* Make This Default Pipeline Toggle */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#334155",
                mb: 0.5,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Make This Default Pipeline
            </Typography>
            <Switch
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#84CC16",
                  "&:hover": {
                    backgroundColor: "rgba(132, 204, 22, 0.08)",
                  },
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#84CC16",
                },
              }}
            />
          </Box>
        </Box>

        {/* Two-Column Pipeline Builder Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          {/* Left Column: Flow Diagram inside bordered card */}
          <Paper
            elevation={0}
            sx={{
              flex: 1.4,
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              p: 2.5,
              backgroundColor: "#FFFFFF",
            }}
          >
            {/* Pipeline Name Display Field */}
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
                Pipeline Name*
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={pipelineName}
                placeholder="Pipeline Name"
                disabled
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#64748B",
                  },
                }}
              />
            </Box>

            {/* Stages Vertical Flow */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                maxHeight: "440px",
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              {stages.map((stage, idx) => {
                const isSelected = selectedStageId === stage.id;
                const isFirstStage = idx === 0;
                const stageColor = stage.stage_color || stage.color || stage.color_code || "";

                return (
                  <React.Fragment key={stage.id}>
                    {/* Stage Card */}
                    <Box
                      onClick={() => handleSelectStage(stage)}
                      sx={{
                        width: "100%",
                        height: "40px",
                        borderRadius: "6px",
                        backgroundColor: isFirstStage ? "#ECFCCB" : "#FFFFFF",
                        border: isFirstStage
                          ? isSelected
                            ? "2px solid #84CC16"
                            : "1px solid #84CC16"
                          : isSelected
                          ? "2px solid #84CC16"
                          : "1px solid #CBD5E1",
                        borderLeft: stageColor ? `5px solid ${stageColor}` : undefined,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "0 0 0 2px rgba(132, 204, 22, 0.2)"
                          : "none",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "#84CC16",
                          borderLeftColor: stageColor || undefined,
                        },
                        "&:hover .stage-delete-btn": {
                          opacity: 1,
                          visibility: "visible",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {stageColor && (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: stageColor,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: isFirstStage ? "#166534" : "#1E293B",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {stage.name}
                        </Typography>
                      </Box>

                      {/* Delete Icon on hover for non-first stages */}
                      {!isFirstStage && (
                        <Tooltip title="Delete Stage">
                          <IconButton
                            className="stage-delete-btn"
                            size="small"
                            onClick={(e) => handleDeleteStage(stage.id, e)}
                            sx={{
                              position: "absolute",
                              right: 12,
                              color: "#EF4444",
                              p: 0.3,
                              opacity: 0.7,
                              transition: "opacity 0.2s ease",
                              "&:hover": {
                                backgroundColor: "#FEE2E2",
                                opacity: 1,
                              },
                            }}
                          >
                            <DeleteOutlinedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Connector Arrow Line with '+' button */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        my: 0.2,
                      }}
                    >
                      <Box
                        sx={{
                          width: "1.5px",
                          height: "10px",
                          backgroundColor: "#84CC16",
                        }}
                      />
                      <Tooltip title="Add stage here">
                        <Box
                          onClick={() => handleOpenAddStage(idx)}
                          sx={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            backgroundColor: "#84CC16",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 700,
                            userSelect: "none",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              backgroundColor: "#65A30D",
                              transform: "scale(1.15)",
                            },
                          }}
                        >
                          +
                        </Box>
                      </Tooltip>
                      <Box
                        sx={{
                          width: "1.5px",
                          height: "10px",
                          backgroundColor: "#84CC16",
                          position: "relative",
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            bottom: 0,
                            left: "-3px",
                            width: 0,
                            height: 0,
                            borderLeft: "4px solid transparent",
                            borderRight: "4px solid transparent",
                            borderTop: "5px solid #84CC16",
                          },
                        }}
                      />
                    </Box>
                  </React.Fragment>
                );
              })}

              {/* If all stages deleted, show an Add Stage button so user can add stages back */}
              {stages.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    my: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenAddStage(-1)}
                    sx={{
                      borderColor: "#84CC16",
                      color: "#65A30D",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "6px",
                      "&:hover": {
                        borderColor: "#65A30D",
                        backgroundColor: "#F7FEE7",
                      },
                    }}
                  >
                    + Add Stage
                  </Button>
                </Box>
              )}

              {/* Terminal Split: Joined & Closed */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: 1.5,
                  mt: 0.5,
                }}
              >
                {/* Joined Box */}
                {(() => {
                  const joinedColor =
                    terminals?.joined?.stage_color || terminals?.joined?.color || terminals?.joined?.color_code || "";
                  return (
                    <Box
                      onClick={() =>
                        handleSelectStage({
                          id: "joined",
                          name: terminals.joined.name,
                          tags: terminals.joined.tags,
                          stage_color: joinedColor,
                          color: joinedColor,
                          color_code: joinedColor,
                        })
                      }
                      sx={{
                        flex: 1,
                        height: "40px",
                        borderRadius: "6px",
                        backgroundColor: "#DCFCE7",
                        border:
                          selectedStageId === "joined"
                            ? "2px solid #84CC16"
                            : "1px solid #84CC16",
                        borderLeft: joinedColor ? `5px solid ${joinedColor}` : undefined,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {joinedColor && (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: joinedColor,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#166534",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {terminals.joined.name}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}

                {/* Bidirectional Arrow */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "#84CC16",
                    fontSize: "15px",
                    fontWeight: 600,
                    userSelect: "none",
                  }}
                >
                  <Box component="span" sx={{ letterSpacing: "-2px" }}>
                    &#8592;&#8594;
                  </Box>
                </Box>

                {/* Closed Box */}
                {(() => {
                  const closedColor =
                    terminals?.closed?.stage_color || terminals?.closed?.color || terminals?.closed?.color_code || "";
                  return (
                    <Box
                      onClick={() =>
                        handleSelectStage({
                          id: "closed",
                          name: terminals.closed.name,
                          tags: terminals.closed.tags,
                          stage_color: closedColor,
                          color: closedColor,
                          color_code: closedColor,
                        })
                      }
                      sx={{
                        flex: 1,
                        height: "40px",
                        borderRadius: "6px",
                        backgroundColor: "#FEE2E2",
                        border:
                          selectedStageId === "closed"
                            ? "2px solid #EF4444"
                            : "1px solid #F87171",
                        borderLeft: closedColor ? `5px solid ${closedColor}` : undefined,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {closedColor && (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: closedColor,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#DC2626",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {terminals.closed.name}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            </Box>
          </Paper>

          {/* Right Column: Create Stage Card */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              p: 2.5,
              backgroundColor: "#FFFFFF",
              alignSelf: "flex-start",
            }}
          >
            {/* Header: Title is "Create Stage" */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Create Stage
              </Typography>

              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenAddStage()}
                sx={{
                  borderColor: "#84CC16",
                  color: "#65A30D",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "12px",
                  height: "30px",
                  px: 1.8,
                  borderRadius: "6px",
                  "&:hover": {
                    borderColor: "#65A30D",
                    backgroundColor: "#F7FEE7",
                  },
                }}
              >
                + Add Stage
              </Button>
            </Box>

            {/* Stage Name Input */}
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#475569",
                  mb: 0.8,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Stage Name:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editStageName}
                onChange={(e) => {
                  setEditStageName(e.target.value);
                  const val = e.target.value;
                  if (selectedStageId === "joined" || selectedStageId === "closed") {
                    setTerminals((prev) => ({
                      ...prev,
                      [selectedStageId]: {
                        ...prev[selectedStageId],
                        name: val || prev[selectedStageId].name,
                      },
                    }));
                  } else {
                    setStages((prev) =>
                      prev.map((s) =>
                        s.id === selectedStageId ? { ...s, name: val } : s
                      )
                    );
                  }
                }}
                onBlur={handleSaveStage}
                placeholder="Stage Name"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#FFFFFF",
                  },
                }}
              />
            </Box>

            {/* Stage Color Field */}
            <ColorPickerSection
              selectedColor={editStageColor}
              onChange={handleEditStageColorChange}
              label="Stage Color:*"
              error={colorError}
            />

            {/* Loss Reasons Section - Only for Loss / Closed Terminal */}
            {selectedStageId === "closed" && (
              <Box sx={{ mt: 2.5 }}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#475569",
                    mb: 1,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Loss Reasons:
                </Typography>

                <Box
                  sx={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    borderRadius: "8px",
                    p: 1.5,
                  }}
                >
                  {/* List of Reasons */}
                  {(() => {
                    const currentClosedTerminal = terminals?.closed || {};
                    const lossReasons = Array.isArray(currentClosedTerminal.reasons)
                      ? currentClosedTerminal.reasons
                      : Array.isArray(currentClosedTerminal.loss_reasons)
                      ? currentClosedTerminal.loss_reasons
                      : [];

                    return (
                      <>
                        {lossReasons.length === 0 ? (
                          <Typography
                            sx={{
                              fontSize: "13px",
                              color: "#94A3B8",
                              fontFamily: "Inter, sans-serif",
                              fontStyle: "italic",
                              mb: 1.5,
                            }}
                          >
                            No loss reasons added yet (add reasons below).
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              mb: 1.5,
                              maxHeight: "135px",
                              overflowY: "auto",
                              pr: 0.5,
                              "&::-webkit-scrollbar": {
                                width: "5px",
                              },
                              "&::-webkit-scrollbar-thumb": {
                                backgroundColor: "#CBD5E1",
                                borderRadius: "4px",
                              },
                              "&::-webkit-scrollbar-track": {
                                backgroundColor: "transparent",
                              },
                            }}
                          >
                            {lossReasons.map((reasonStr, idx) => (
                              <Box
                                key={reasonStr + idx}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  px: 1.5,
                                  py: 0.8,
                                  borderRadius: "6px",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #E2E8F0",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#1E293B",
                                    fontFamily: "Inter, sans-serif",
                                  }}
                                >
                                  {reasonStr}
                                </Typography>

                                <Tooltip title="Delete Reason">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteLossReason(reasonStr)}
                                    sx={{
                                      color: "#EF4444",
                                      p: 0.3,
                                      "&:hover": { backgroundColor: "#FEE2E2" },
                                    }}
                                  >
                                    <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ))}
                          </Box>
                        )}

                        {/* Add Reason controls */}
                        <Box sx={{ display: "flex", gap: 1, mt: lossReasons.length > 0 ? 1 : 0 }}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Enter loss reason"
                            value={lossReasonInput}
                            onChange={(e) => setLossReasonInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddLossReason();
                              }
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: "#FFFFFF",
                                borderRadius: "6px",
                                fontSize: "13px",
                              },
                            }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleAddLossReason}
                            sx={{
                              backgroundColor: "#84CC16",
                              color: "#FFFFFF",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "13px",
                              px: 2,
                              borderRadius: "6px",
                              whiteSpace: "nowrap",
                              boxShadow: "none",
                              "&:hover": {
                                backgroundColor: "#65A30D",
                                boxShadow: "none",
                              },
                            }}
                          >
                            + Add Reason
                          </Button>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </Box>
            )}

            {/* Tags Section (only for middle custom stages, hidden for New Lead, Won, Loss) */}
            {!(
              selectedStageId === "joined" ||
              selectedStageId === "closed" ||
              selectedStageId === stages[0]?.id ||
              Boolean(stages.find((s) => s.id === selectedStageId)?.isFirst)
            ) && (
              <Box>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#475569",
                    mb: 0.8,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Tags (Sub-status):
                </Typography>

                {/* Tag Pills List */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                  {editStageTags.map((tag, idx) => (
                    <Box
                      key={tag.name || idx}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "6px",
                        border: `1.5px solid ${tag.borderColor || "#3B82F6"}`,
                        backgroundColor: tag.bgColor || "rgba(59, 130, 246, 0.1)",
                        color: tag.textColor || tag.borderColor || "#1E40AF",
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      <span>{tag.name}</span>
                      <Tooltip title="Edit Tag">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditTag(tag)}
                          sx={{
                            p: 0.2,
                            color: tag.textColor || tag.borderColor || "#1E40AF",
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                          }}
                        >
                          <EditOutlinedIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Tag">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveTag(tag.name)}
                          sx={{
                            p: 0.2,
                            color: "#EF4444",
                            "&:hover": { backgroundColor: "#FEE2E2" },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>

                {/* Add Tag Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setEditingTag(null);
                    setIsAddTagOpen(true);
                  }}
                  sx={{
                    borderColor: "#84CC16",
                    color: "#65A30D",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "12px",
                    height: "30px",
                    px: 2,
                    borderRadius: "6px",
                    "&:hover": {
                      borderColor: "#65A30D",
                      backgroundColor: "#F7FEE7",
                    },
                  }}
                >
                  + Add Tag
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </DialogContent>

      {/* Footer Action Buttons */}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderColor: "#84CC16",
            color: "#65A30D",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            height: "36px",
            px: 3,
            borderRadius: "6px",
            "&:hover": {
              borderColor: "#65A30D",
              backgroundColor: "#F7FEE7",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleFinalSave}
          disabled={isSubmitting}
          sx={{
            backgroundColor: "#84CC16",
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            height: "36px",
            px: 3.5,
            borderRadius: "6px",
            boxShadow: "0 2px 4px rgba(132, 204, 22, 0.3)",
            "&:hover": {
              backgroundColor: "#65A30D",
              boxShadow: "none",
            },
          }}
        >
          {isSubmitting ? "Creating..." : "Save Pipeline"}
        </Button>
      </DialogActions>

      {/* Add / Edit Tag Modal Sub-dialog */}
      <AddTagModal
        open={isAddTagOpen}
        onClose={handleCloseTagModal}
        onAddTag={handleAddTag}
        onUpdateTag={handleUpdateTag}
        tagToEdit={editingTag}
        title={editingTag ? "Edit Tag" : "Add a Tag for Your Stage"}
      />

      {/* Add Stage Modal Sub-dialog (prompts for stage name & color) */}
      <AddStageModal
        open={isAddStageOpen}
        onClose={() => setIsAddStageOpen(false)}
        onAddStage={handleConfirmAddStage}
        insertIndex={insertStageIndex}
      />
    </Dialog>
  );
}
