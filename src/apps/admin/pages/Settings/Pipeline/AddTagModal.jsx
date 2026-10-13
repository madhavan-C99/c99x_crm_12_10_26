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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ColorizeOutlinedIcon from "@mui/icons-material/ColorizeOutlined";
import UnfoldMoreOutlinedIcon from "@mui/icons-material/UnfoldMoreOutlined";

// Preset colors matching user screenshot
const PRESET_COLORS_ROW_1 = [
  "#1D4ED8", // Dark / Royal Blue
  "#F59E0B", // Amber / Orange
  "#3B82F6", // Sky Blue
  "#EC4899", // Magenta / Pink
  "#10B981", // Emerald Green
  "#EF4444", // Coral Red
  "#1E293B", // Dark Navy
  "#14B8A6", // Teal
  "#FBBF24", // Golden Yellow
  "#94A3B8", // Slate / Gray
];

// Color conversion utilities
function hsvToRgb(h, s, v) {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
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
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 29, g: 78, b: 216 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export default function AddTagModal({
  open,
  onClose,
  onAddTag,
  onUpdateTag,
  tagToEdit = null,
  title,
}) {
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#1D4ED8");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState("");

  // HSV state for color picker
  const [hsv, setHsv] = useState({ h: 220, s: 80, v: 80 });
  const [rgbInput, setRgbInput] = useState({ r: 29, g: 78, b: 216 });
  const [inputMode, setInputMode] = useState("rgb"); // "rgb" | "hex"
  const [hexInput, setHexInput] = useState("#1D4ED8");

  const satBoxRef = useRef(null);
  const isDraggingSat = useRef(false);

  // Sync HSV and RGB when selectedColor changes externally
  const updateFromHex = useCallback((hex) => {
    const rgb = hexToRgb(hex);
    const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHsv(newHsv);
    setRgbInput(rgb);
    setHexInput(hex);
    setSelectedColor(hex);
  }, []);

  const handleSelectPreset = (hex) => {
    setSelectedColor(hex);
    updateFromHex(hex);
  };

  // Sync state when opening in edit mode vs add mode
  useEffect(() => {
    if (open) {
      if (tagToEdit) {
        setTagName(tagToEdit.name || "");
        const col = tagToEdit.borderColor || tagToEdit.textColor || "#1D4ED8";
        setSelectedColor(col);
        updateFromHex(col);
      } else {
        setTagName("");
        setSelectedColor("#1D4ED8");
        updateFromHex("#1D4ED8");
      }
      setError("");
      setShowColorPicker(false);
    }
  }, [open, tagToEdit, updateFromHex]);

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
    if (!tagName.trim()) {
      setError("Tag name is required");
      return;
    }

    // Generate soft background tint matching selected color
    const rgb = hexToRgb(selectedColor);
    const bgColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;

    if (tagToEdit && onUpdateTag) {
      onUpdateTag({
        ...tagToEdit,
        name: tagName.trim(),
        color: selectedColor,
        borderColor: selectedColor,
        textColor: selectedColor,
        bgColor: bgColor,
      });
    } else if (onAddTag) {
      onAddTag({
        name: tagName.trim(),
        color: selectedColor,
        borderColor: selectedColor,
        textColor: selectedColor,
        bgColor: bgColor,
      });
    }

    setTagName("");
    setError("");
    setShowColorPicker(false);
    onClose();
  };

  const handleClose = () => {
    setTagName("");
    setError("");
    setShowColorPicker(false);
    onClose();
  };

  const modalTitle = title || (tagToEdit ? "Edit Tag" : "Add a Tag for Your Stage");

  // Pure hue color for 2D saturation/value background
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
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
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
          {/* Tag Name Field */}
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
              Tag Name:
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Hot"
              value={tagName}
              onChange={(e) => {
                setTagName(e.target.value);
                if (error) setError("");
              }}
              error={Boolean(error)}
              helperText={error}
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
                mb: 1.5,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Select Color:
            </Typography>

            {/* Row 1: 10 Circular Swatches */}
            <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap", mb: 1.2 }}>
              {PRESET_COLORS_ROW_1.map((hex) => {
                const isSelected = selectedColor.toUpperCase() === hex.toUpperCase();
                return (
                  <Box
                    key={hex}
                    onClick={() => handleSelectPreset(hex)}
                    sx={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: hex,
                      cursor: "pointer",
                      transition: "transform 0.12s ease",
                      outline: isSelected ? "2.5px solid #2563EB" : "none",
                      outlineOffset: "2.5px",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                  />
                );
              })}
            </Box>

            {/* Row 2: Selected Custom Circle, Rainbow Circle, No-Color Circle */}
            <Box sx={{ display: "flex", gap: "10px", alignItems: "center", mb: 1.5 }}>
              {/* Custom / Currently Selected Color Swatch */}
              <Box
                onClick={() => handleSelectPreset(selectedColor)}
                sx={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: selectedColor,
                  cursor: "pointer",
                  outline: "2.5px solid #2563EB",
                  outlineOffset: "2.5px",
                  transition: "transform 0.12s ease",
                  "&:hover": { transform: "scale(1.1)" },
                }}
              />

              {/* Rainbow Gradient Swatch - Opens Color Picker */}
              <Box
                onClick={() => setShowColorPicker((prev) => !prev)}
                title="Customize color"
                sx={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background:
                    "conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)",
                  cursor: "pointer",
                  transition: "transform 0.12s ease",
                  border: "1px solid #CBD5E1",
                  "&:hover": { transform: "scale(1.1)" },
                }}
              />

              {/* Neutral / Transparent reset circle with red slash */}
              <Box
                onClick={() => handleSelectPreset("#64748B")}
                title="Default / Reset color"
                sx={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  backgroundImage:
                    "linear-gradient(to top right, transparent calc(50% - 1.5px), #EF4444 calc(50% - 1.5px), #EF4444 calc(50% + 1.5px), transparent calc(50% + 1.5px))",
                  cursor: "pointer",
                  transition: "transform 0.12s ease",
                  "&:hover": { transform: "scale(1.1)" },
                }}
              />
            </Box>

            {/* "Customize" Link */}
            <Typography
              onClick={() => setShowColorPicker((prev) => !prev)}
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#2563EB",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                display: "inline-block",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Customize
            </Typography>

            {/* Chromium-Style Color Picker Popover */}
            {showColorPicker && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  border: "1px solid #E2E8F0",
                  width: "260px",
                }}
              >
                {/* 2D Saturation / Value Canvas */}
                <Box
                  ref={satBoxRef}
                  onPointerDown={handleSatPointerDown}
                  sx={{
                    width: "100%",
                    height: "135px",
                    borderRadius: "4px",
                    position: "relative",
                    backgroundColor: hueColor,
                    cursor: "crosshair",
                    userSelect: "none",
                    touchAction: "none",
                    backgroundImage: `
                      linear-gradient(to top, #000000, transparent),
                      linear-gradient(to right, #FFFFFF, transparent)
                    `,
                  }}
                >
                  {/* Draggable Selector Ring */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: `${hsv.s}%`,
                      top: `${100 - hsv.v}%`,
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: "2px solid #FFFFFF",
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.8)",
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                    }}
                  />
                </Box>

                {/* Eyedropper, Swatch Preview, and Hue Slider */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    mt: 1.5,
                  }}
                >
                  {/* Eyedropper icon */}
                  <IconButton
                    size="small"
                    onClick={handleEyeDropper}
                    title="Pick color from screen"
                    sx={{
                      p: 0.5,
                      color: "#475569",
                      "&:hover": { backgroundColor: "#F1F5F9" },
                    }}
                  >
                    <ColorizeOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>

                  {/* Circular Color Preview */}
                  <Box
                    sx={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      backgroundColor: selectedColor,
                      border: "1px solid rgba(0,0,0,0.1)",
                      flexShrink: 0,
                    }}
                  />

                  {/* Rainbow Hue Slider */}
                  <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hsv.h}
                      onChange={handleHueChange}
                      style={{
                        width: "100%",
                        height: "10px",
                        borderRadius: "5px",
                        outline: "none",
                        WebkitAppearance: "none",
                        background:
                          "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
                        cursor: "pointer",
                      }}
                    />
                  </Box>
                </Box>

                {/* RGB / Hex Values Input Row */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 1.5,
                  }}
                >
                  {inputMode === "rgb" ? (
                    <>
                      {/* R */}
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <TextField
                          size="small"
                          value={rgbInput.r}
                          onChange={(e) => handleRgbFieldChange("r", e.target.value)}
                          inputProps={{
                            style: {
                              textAlign: "center",
                              padding: "4px 2px",
                              fontSize: "12px",
                              fontWeight: 600,
                            },
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                              backgroundColor: "#FFFFFF",
                            },
                          }}
                        />
                        <Typography sx={{ fontSize: "11px", color: "#64748B", mt: 0.3 }}>
                          R
                        </Typography>
                      </Box>

                      {/* G */}
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <TextField
                          size="small"
                          value={rgbInput.g}
                          onChange={(e) => handleRgbFieldChange("g", e.target.value)}
                          inputProps={{
                            style: {
                              textAlign: "center",
                              padding: "4px 2px",
                              fontSize: "12px",
                              fontWeight: 600,
                            },
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                              backgroundColor: "#FFFFFF",
                            },
                          }}
                        />
                        <Typography sx={{ fontSize: "11px", color: "#64748B", mt: 0.3 }}>
                          G
                        </Typography>
                      </Box>

                      {/* B */}
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <TextField
                          size="small"
                          value={rgbInput.b}
                          onChange={(e) => handleRgbFieldChange("b", e.target.value)}
                          inputProps={{
                            style: {
                              textAlign: "center",
                              padding: "4px 2px",
                              fontSize: "12px",
                              fontWeight: 600,
                            },
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                              backgroundColor: "#FFFFFF",
                            },
                          }}
                        />
                        <Typography sx={{ fontSize: "11px", color: "#64748B", mt: 0.3 }}>
                          B
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={hexInput}
                        onChange={(e) => {
                          setHexInput(e.target.value);
                          if (/^#?[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                            const val = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                            updateFromHex(val);
                          }
                        }}
                        inputProps={{
                          style: {
                            textAlign: "center",
                            padding: "4px 6px",
                            fontSize: "12px",
                            fontWeight: 600,
                          },
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "4px",
                          },
                        }}
                      />
                      <Typography sx={{ fontSize: "11px", color: "#64748B", mt: 0.3, textAlign: "center" }}>
                        HEX
                      </Typography>
                    </Box>
                  )}

                  {/* Toggle between RGB and HEX */}
                  <IconButton
                    size="small"
                    onClick={() => setInputMode((prev) => (prev === "rgb" ? "hex" : "rgb"))}
                    title="Toggle RGB / HEX"
                    sx={{ p: 0.5, color: "#64748B" }}
                  >
                    <UnfoldMoreOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Action Buttons: Cancel (outlined green) and Save (solid green) */}
      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
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
          onClick={handleSave}
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
          {tagToEdit ? "Save Tag" : "Add Tag"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
