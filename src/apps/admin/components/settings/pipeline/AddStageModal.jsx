import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ColorizeOutlinedIcon from "@mui/icons-material/ColorizeOutlined";
import UnfoldMoreOutlinedIcon from "@mui/icons-material/UnfoldMoreOutlined";

export const PRESET_STAGE_COLORS = [
  "#1D4ED8", // Dark / Royal Blue
  "#F59E0B", // Amber / Orange
  "#3B82F6", // Sky Blue
  "#EC4899", // Magenta / Pink
  "#10B981", // Emerald Green
  "#EF4444", // Coral Red
  "#84CC16", // Lime Green
  "#14B8A6", // Teal
  "#8B5CF6", // Purple / Violet
  "#64748B", // Slate / Gray
];

// Color conversion utilities
function hsvToRgb(h, s, v) {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d === 0) h = 0;
  else if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else if (max === b) h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const v = Math.round(max * 100);
  return { h, s, v };
}

function rgbToHex(r, g, b) {
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex) {
  let c = (hex || "#1D4ED8").replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 29, g: 78, b: 216 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export default function AddStageModal({
  open,
  onClose,
  onAddStage,
  onUpdateStage,
  stageToEdit = null,
  insertIndex = -1,
  title,
}) {
  const [stageName, setStageName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState("");

  // HSV state for color picker
  const [hsv, setHsv] = useState({ h: 220, s: 80, v: 80 });
  const [rgbInput, setRgbInput] = useState({ r: 29, g: 78, b: 216 });
  const [inputMode, setInputMode] = useState("rgb"); // "rgb" | "hex"
  const [hexInput, setHexInput] = useState("");

  const satBoxRef = useRef(null);
  const isDraggingSat = useRef(false);

  // Sync HSV and RGB when selectedColor changes externally
  const updateFromHex = useCallback((hex) => {
    if (!hex) return;
    const rgb = hexToRgb(hex);
    const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHsv(newHsv);
    setRgbInput(rgb);
    setHexInput(hex);
    setSelectedColor(hex);
    setError((prev) => (prev && prev.includes("color") ? "" : prev));
  }, []);

  const handleSelectPreset = (hex) => {
    setSelectedColor(hex);
    updateFromHex(hex);
    setError((prev) => (prev && prev.includes("color") ? "" : prev));
  };

  // Sync state when opening in edit mode vs add mode
  useEffect(() => {
    if (open) {
      if (stageToEdit) {
        setStageName(stageToEdit.name || "");
        const col =
          stageToEdit.stage_color ||
          stageToEdit.color ||
          stageToEdit.color_code ||
          "";
        setSelectedColor(col);
        if (col) updateFromHex(col);
      } else {
        setStageName("");
        setSelectedColor("");
        setHexInput("");
      }
      setError("");
      setShowColorPicker(false);
    }
  }, [open, stageToEdit, updateFromHex]);

  // Dragging in Saturation/Value 2D area
  const handleSatPointerMove = useCallback((e) => {
    if (!satBoxRef.current) return;
    const rect = satBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round(100 - (y / rect.height) * 100);

    setHsv((prev) => {
      const nextHsv = { ...prev, s, v };
      const rgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setRgbInput(rgb);
      setHexInput(hex);
      setSelectedColor(hex);
      return nextHsv;
    });
  }, []);

  const handleSatPointerDown = (e) => {
    isDraggingSat.current = true;
    handleSatPointerMove(e);
    window.addEventListener("pointermove", handleSatPointerMove);
    window.addEventListener("pointerup", handleSatPointerUp);
  };

  const handleSatPointerUp = useCallback(() => {
    isDraggingSat.current = false;
    window.removeEventListener("pointermove", handleSatPointerMove);
    window.removeEventListener("pointerup", handleSatPointerUp);
  }, [handleSatPointerMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleSatPointerMove);
      window.removeEventListener("pointerup", handleSatPointerUp);
    };
  }, [handleSatPointerMove, handleSatPointerUp]);

  // Hue slider change
  const handleHueChange = (e) => {
    const h = Number(e.target.value);
    setHsv((prev) => {
      const nextHsv = { ...prev, h };
      const rgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setRgbInput(rgb);
      setHexInput(hex);
      setSelectedColor(hex);
      return nextHsv;
    });
  };

  // RGB inputs change
  const handleRgbFieldChange = (channel, val) => {
    const num = Math.max(0, Math.min(255, parseInt(val, 10) || 0));
    const nextRgb = { ...rgbInput, [channel]: num };
    setRgbInput(nextRgb);
    const hex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    setHexInput(hex);
    setSelectedColor(hex);
    setHsv(rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  // Native EyeDropper
  const handleEyeDropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          updateFromHex(result.sRGBHex);
        }
      } catch {
        // EyeDropper cancelled or closed
      }
    }
  };

  const handleSave = () => {
    if (!stageName.trim()) {
      setError("Stage name is required");
      return;
    }
    if (!selectedColor || !String(selectedColor).trim()) {
      setError("Stage color is compulsory. Please select a color.");
      return;
    }

    if (stageToEdit && onUpdateStage) {
      onUpdateStage({
        ...stageToEdit,
        name: stageName.trim(),
        stage_color: selectedColor,
        color: selectedColor,
        color_code: selectedColor,
      });
    } else if (onAddStage) {
      onAddStage({
        name: stageName.trim(),
        stage_color: selectedColor,
        color: selectedColor,
        color_code: selectedColor,
        insertIndex,
      });
    }

    setStageName("");
    setError("");
    setShowColorPicker(false);
    onClose();
  };

  const handleClose = () => {
    setStageName("");
    setError("");
    setShowColorPicker(false);
    onClose();
  };

  const modalTitle =
    title || (stageToEdit ? "Edit Stage" : "Add Stage for Your Pipeline");
  const isCustomColor = Boolean(
    selectedColor &&
      !PRESET_STAGE_COLORS.some(
        (c) => c.toUpperCase() === selectedColor.toUpperCase()
      )
  );
  const hueColor = `hsl(${hsv.h}, 100%, 50%)`;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1.5,
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      {/* Header: Title in lime green */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          pt: 1,
          px: 2,
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "20px",
            color: "#84CC16",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {modalTitle}
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: "#64748B" }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pt: 1, pb: 1.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          {/* Stage Name Field */}
          <Box>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#475569",
                mb: 1,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Stage Name:
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Negotiation"
              value={stageName}
              onChange={(e) => {
                setStageName(e.target.value);
                if (error) setError("");
              }}
              error={Boolean(error && !error.includes("color"))}
              helperText={error && !error.includes("color") ? error : ""}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#F1F5F9",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#1E293B",
                  "& fieldset": {
                    borderColor: "#E2E8F0",
                  },
                },
              }}
            />
          </Box>

          {/* Select Color Section */}
          <Box>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#475569",
                mb: 1.2,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Select Color*
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.2,
              }}
            >
              {PRESET_STAGE_COLORS.map((hex) => {
                const isActive =
                  Boolean(selectedColor) &&
                  selectedColor.toUpperCase() === hex.toUpperCase();
                return (
                  <Box
                    key={hex}
                    onClick={() => handleSelectPreset(hex)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: hex,
                      cursor: "pointer",
                      border: isActive ? "2px solid #0F172A" : "2px solid #FFFFFF",
                      outline: isActive ? "2px solid #84CC16" : "none",
                      outlineOffset: "1px",
                      transition: "transform 0.15s ease",
                      "&:hover": {
                        transform: "scale(1.15)",
                      },
                    }}
                  />
                );
              })}

              {/* Custom Color Swatch (if not in presets) */}
              {isCustomColor && (
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: selectedColor,
                    cursor: "pointer",
                    border: "2px solid #0F172A",
                    outline: "2px solid #84CC16",
                    outlineOffset: "1px",
                  }}
                />
              )}

              {/* Rainbow / Color Wheel toggle button */}
              <Tooltip title="Custom Color Picker">
                <Box
                  onClick={() => setShowColorPicker((prev) => !prev)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background:
                      "conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)",
                    cursor: "pointer",
                    border: showColorPicker
                      ? "2px solid #84CC16"
                      : "2px solid #FFFFFF",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "transform 0.15s ease",
                    "&:hover": {
                      transform: "scale(1.15)",
                    },
                  }}
                />
              </Tooltip>
            </Box>

            {error && error.includes("color") && (
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#EF4444",
                  mt: 1,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {error}
              </Typography>
            )}
          </Box>

          {/* Expandable Custom Color Picker */}
          {showColorPicker && (
            <Box
              sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {/* 2D Saturation / Value Gradient Box */}
              <Box
                ref={satBoxRef}
                onPointerDown={handleSatPointerDown}
                sx={{
                  width: "100%",
                  height: "140px",
                  borderRadius: "8px",
                  position: "relative",
                  cursor: "crosshair",
                  userSelect: "none",
                  touchAction: "none",
                  backgroundColor: hueColor,
                  backgroundImage:
                    "linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)",
                }}
              >
                {/* Pointer indicator */}
                <Box
                  sx={{
                    position: "absolute",
                    left: `${hsv.s}%`,
                    top: `${100 - hsv.v}%`,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                    backgroundColor: selectedColor,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                />
              </Box>

              {/* Hue Slider and Controls */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {window.EyeDropper && (
                  <IconButton
                    size="small"
                    onClick={handleEyeDropper}
                    sx={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      p: 0.8,
                      "&:hover": { backgroundColor: "#F1F5F9" },
                    }}
                  >
                    <ColorizeOutlinedIcon sx={{ fontSize: 18, color: "#475569" }} />
                  </IconButton>
                )}

                {/* Hue Slider */}
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsv.h}
                  onChange={handleHueChange}
                  style={{
                    flex: 1,
                    height: "12px",
                    borderRadius: "6px",
                    outline: "none",
                    WebkitAppearance: "none",
                    background:
                      "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                    cursor: "pointer",
                  }}
                />

                {/* Current Color Swatch Preview */}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: selectedColor,
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                />
              </Box>

              {/* Mode Toggle: RGB vs HEX */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Box
                  onClick={() =>
                    setInputMode((m) => (m === "rgb" ? "hex" : "rgb"))
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.3,
                    cursor: "pointer",
                    userSelect: "none",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    "&:hover": { backgroundColor: "#F1F5F9" },
                  }}
                >
                  <Typography
                    sx={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}
                  >
                    {inputMode.toUpperCase()}
                  </Typography>
                  <UnfoldMoreOutlinedIcon
                    sx={{ fontSize: 14, color: "#64748B" }}
                  />
                </Box>

                {/* Values Inputs */}
                {inputMode === "rgb" ? (
                  <Box sx={{ display: "flex", gap: 0.8, flex: 1 }}>
                    {["r", "g", "b"].map((channel) => (
                      <Box
                        key={channel}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <TextField
                          size="small"
                          value={rgbInput[channel]}
                          onChange={(e) =>
                            handleRgbFieldChange(channel, e.target.value)
                          }
                          inputProps={{
                            style: {
                              textAlign: "center",
                              padding: "4px 2px",
                              fontSize: "12px",
                            },
                          }}
                          sx={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "4px",
                            "& fieldset": { borderColor: "#CBD5E1" },
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "10px",
                            color: "#94A3B8",
                            fontWeight: 600,
                            mt: 0.3,
                          }}
                        >
                          {channel.toUpperCase()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={hexInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHexInput(val);
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          updateFromHex(val);
                        }
                      }}
                      inputProps={{
                        style: {
                          padding: "4px 8px",
                          fontSize: "12px",
                          fontFamily: "monospace",
                        },
                      }}
                      sx={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "4px",
                        "& fieldset": { borderColor: "#CBD5E1" },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            color: "#64748B",
            borderColor: "#CBD5E1",
            textTransform: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 500,
            px: 2.5,
            py: 0.6,
            "&:hover": {
              borderColor: "#94A3B8",
              backgroundColor: "#F8FAFC",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            backgroundColor: "#84CC16",
            color: "#FFFFFF",
            textTransform: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            px: 2.5,
            py: 0.6,
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#65A30D",
              boxShadow: "none",
            },
          }}
        >
          {stageToEdit ? "Save Stage" : "Add Stage"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
