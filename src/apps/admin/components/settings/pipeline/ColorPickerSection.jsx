import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
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
  let c = (hex || "#84CC16").replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 132, g: 204, b: 22 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export default function ColorPickerSection({
  selectedColor = "",
  onChange,
  label = "Stage Color:*",
  disabled = false,
  error = "",
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hsv, setHsv] = useState({ h: 220, s: 80, v: 80 });
  const [rgbInput, setRgbInput] = useState({ r: 29, g: 78, b: 216 });
  const [inputMode, setInputMode] = useState("rgb"); // "rgb" | "hex"
  const [hexInput, setHexInput] = useState(selectedColor || "");

  const satBoxRef = useRef(null);
  const isDraggingSat = useRef(false);

  const updateFromHex = useCallback(
    (hex) => {
      if (!hex) return;
      const rgb = hexToRgb(hex);
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(newHsv);
      setRgbInput(rgb);
      setHexInput(hex);
      if (onChange) onChange(hex);
    },
    [onChange]
  );

  useEffect(() => {
    if (selectedColor) {
      const rgb = hexToRgb(selectedColor);
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(newHsv);
      setRgbInput(rgb);
      setHexInput(selectedColor);
    } else {
      setHexInput("");
    }
  }, [selectedColor]);

  // Saturation/Value 2D pointer movement
  const handleSatPointerMove = useCallback(
    (e) => {
      if (!satBoxRef.current || disabled) return;
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
        if (onChange) onChange(hex);
        return nextHsv;
      });
    },
    [disabled, onChange]
  );

  const handleSatPointerDown = (e) => {
    if (disabled) return;
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
    if (disabled) return;
    const newHue = Number(e.target.value);
    setHsv((prev) => {
      const nextHsv = { ...prev, h: newHue };
      const rgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setRgbInput(rgb);
      setHexInput(hex);
      if (onChange) onChange(hex);
      return nextHsv;
    });
  };

  // EyeDropper tool
  const handleEyeDropper = async () => {
    if (disabled) return;
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          updateFromHex(result.sRGBHex);
        }
      } catch {
        // Cancelled
      }
    }
  };

  const hueColor = `hsl(${hsv.h}, 100%, 50%)`;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        sx={{
          fontSize: "13px",
          fontWeight: 500,
          color: "#475569",
          mb: 1.2,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {label}
      </Typography>

      {/* Row 1: Preset Colors */}
      <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap", mb: 1.2 }}>
        {PRESET_STAGE_COLORS.map((hex) => {
          const isSelected =
            String(selectedColor || "").toUpperCase() === hex.toUpperCase();
          return (
            <Tooltip key={hex} title={hex}>
              <Box
                onClick={() => {
                  if (!disabled) updateFromHex(hex);
                }}
                sx={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: hex,
                  cursor: disabled ? "default" : "pointer",
                  transition: "transform 0.12s ease",
                  outline: isSelected ? "2.5px solid #2563EB" : "none",
                  outlineOffset: "2px",
                  "&:hover": disabled ? {} : { transform: "scale(1.15)" },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      {/* Row 2: Selected swatch, Rainbow toggle, and Customize link */}
      <Box
        sx={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          mb: showColorPicker ? 1.5 : 0,
        }}
      >
        {/* Selected Swatch */}
        {selectedColor ? (
          <Box
            sx={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              backgroundColor: selectedColor,
              outline: "2.5px solid #2563EB",
              outlineOffset: "2px",
            }}
          />
        ) : (
          <Tooltip title="No color selected">
            <Box
              sx={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                backgroundColor: "transparent",
                border: "1.5px dashed #94A3B8",
              }}
            />
          </Tooltip>
        )}

        {/* Rainbow Button */}
        <Tooltip title="Custom Color Picker">
          <Box
            onClick={() => {
              if (!disabled) setShowColorPicker((prev) => !prev);
            }}
            sx={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background:
                "conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)",
              cursor: disabled ? "default" : "pointer",
              transition: "transform 0.12s ease",
              border: "1px solid #CBD5E1",
              "&:hover": disabled ? {} : { transform: "scale(1.15)" },
            }}
          />
        </Tooltip>

        {!disabled && (
          <Typography
            onClick={() => setShowColorPicker((prev) => !prev)}
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#2563EB",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              userSelect: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {showColorPicker ? "Hide Color Picker" : "Customize"}
          </Typography>
        )}
      </Box>

      {/* Expandable Custom Color Picker */}
      {showColorPicker && !disabled && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* 2D Saturation / Value Canvas */}
          <Box
            ref={satBoxRef}
            onPointerDown={handleSatPointerDown}
            sx={{
              width: "100%",
              height: "120px",
              borderRadius: "6px",
              position: "relative",
              cursor: "crosshair",
              overflow: "hidden",
              userSelect: "none",
              touchAction: "none",
              backgroundColor: hueColor,
              backgroundImage:
                "linear-gradient(to right, #FFF, transparent), linear-gradient(to top, #000, transparent)",
            }}
          >
            {/* Draggable Circle Thumb */}
            <Box
              sx={{
                position: "absolute",
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "2px solid #FFFFFF",
                boxShadow: "0 0 3px rgba(0,0,0,0.6)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                backgroundColor: selectedColor,
              }}
            />
          </Box>

          {/* Controls Bar: EyeDropper + Hue Slider + Swatch */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 1.5,
              mb: 1.2,
            }}
          >
            {window.EyeDropper && (
              <Tooltip title="EyeDropper">
                <IconButton
                  size="small"
                  onClick={handleEyeDropper}
                  sx={{
                    color: "#64748B",
                    p: 0.5,
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                  }}
                >
                  <ColorizeOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

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
                  appearance: "none",
                  outline: "none",
                  cursor: "pointer",
                  background:
                    "linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)",
                }}
              />
            </Box>

            {/* Current Color Indicator */}
            <Box
              sx={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: selectedColor,
                border: "1px solid #CBD5E1",
                flexShrink: 0,
              }}
            />
          </Box>

          {/* RGB / Hex Value Display */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pt: 1,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            {inputMode === "rgb" ? (
              <Box sx={{ display: "flex", gap: 0.8, flex: 1 }}>
                {["r", "g", "b"].map((ch) => (
                  <Box key={ch} sx={{ flex: 1, textAlign: "center" }}>
                    <TextField
                      size="small"
                      value={rgbInput[ch]}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(255, Number(e.target.value) || 0)
                        );
                        const nextRgb = { ...rgbInput, [ch]: val };
                        setRgbInput(nextRgb);
                        const hex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
                        setHexInput(hex);
                        if (onChange) onChange(hex);
                        setHsv(rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b));
                      }}
                      inputProps={{
                        style: {
                          padding: "3px 4px",
                          fontSize: "11px",
                          textAlign: "center",
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "4px",
                          backgroundColor: "#F8FAFC",
                        },
                      }}
                    />
                    <Typography
                      sx={{ fontSize: "10px", color: "#94A3B8", mt: 0.3 }}
                    >
                      {ch.toUpperCase()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ flex: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={hexInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setHexInput(raw);
                    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
                      updateFromHex(raw);
                    }
                  }}
                  inputProps={{
                    style: {
                      padding: "4px 8px",
                      fontSize: "12px",
                      fontWeight: 600,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "4px",
                      backgroundColor: "#F8FAFC",
                    },
                  }}
                />
                <Typography
                  sx={{ fontSize: "10px", color: "#94A3B8", mt: 0.3 }}
                >
                  HEX
                </Typography>
              </Box>
            )}

            <Tooltip title="Toggle RGB / HEX mode">
              <IconButton
                size="small"
                onClick={() =>
                  setInputMode((prev) => (prev === "rgb" ? "hex" : "rgb"))
                }
                sx={{
                  color: "#64748B",
                  p: 0.4,
                  border: "1px solid #E2E8F0",
                  borderRadius: "4px",
                }}
              >
                <UnfoldMoreOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {error && (
        <Typography
          sx={{
            fontSize: "12px",
            color: "#EF4444",
            mt: 0.8,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
