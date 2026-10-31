import React from "react";
import { toast } from "react-toastify";
import { Box, Typography } from "@mui/material";

export const TOAST_COLORS = {
  success: "#84CC16", // Lime green matching reference design
  error: "#EF4444",   // Red
  warning: "#F59E0B", // Amber / Yellow
  info: "#3B82F6",    // Blue
};

export const CLOSE_BTN_COLORS = {
  success: {
    color: "#84CC16",
    hoverColor: "#65A30D",
    hoverBg: "rgba(132, 204, 22, 0.14)",
  },
  error: {
    color: "#EF4444",
    hoverColor: "#DC2626",
    hoverBg: "rgba(239, 68, 68, 0.14)",
  },
  warning: {
    color: "#F59E0B",
    hoverColor: "#D97706",
    hoverBg: "rgba(245, 158, 11, 0.14)",
  },
  info: {
    color: "#3B82F6",
    hoverColor: "#2563EB",
    hoverBg: "rgba(59, 130, 246, 0.14)",
  },
};

/**
 * Extracts a clean string from any message input:
 * - Plain string
 * - Array of strings (e.g. backend validation errors ["A campaign with this name already exists."])
 * - Axios error objects
 * - Standard Error instances
 */
export const extractMessage = (input) => {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (Array.isArray(input)) {
    return input.filter(Boolean).map(extractMessage).join(", ");
  }

  // Axios response error structure
  if (input?.response?.data) {
    const data = input.response.data;
    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return data.detail.join(", ");
    if (typeof data.error === "string") return data.error;
    if (Array.isArray(data.error)) return data.error.join(", ");
  }

  // Standard Error or object with message property
  if (input?.message) {
    if (typeof input.message === "string") return input.message;
    if (Array.isArray(input.message)) return input.message.join(", ");
  }

  return String(input);
};

/**
 * Custom Toast Content Component matching the Reference Design:
 * - Pure white card with rounded corners (10-12px) and soft shadow
 * - Solid circular icon on the left (lime green for success, red for error)
 * - Single-line / neat wrapping message in dark slate text (~15.5px)
 * - Thick colored accent bar (6px) at the bottom edge of the card
 * - Vertically centered, comfortable padding (16px 24px)
 */
export const CustomToastContent = ({ type = "success", message, onCloseClick }) => {
  const accentColor = TOAST_COLORS[type] || TOAST_COLORS.info;
  const btnStyle = CLOSE_BTN_COLORS[type] || CLOSE_BTN_COLORS.info;
  const displayMsg = extractMessage(message);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        px: { xs: "18px", sm: "24px" },
        pt: "16px",
        pb: "22px",
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "580px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Solid Circular Icon */}
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          backgroundColor: accentColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mt: "1px",
        }}
      >
        {type === "success" && (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {type === "error" && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
        {type === "warning" && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="8" x2="12" y2="13" />
            <circle cx="12" cy="17" r="1.2" fill="#FFFFFF" />
          </svg>
        )}
        {type === "info" && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7" r="1.2" fill="#FFFFFF" />
            <line x1="12" y1="11" x2="12" y2="17" />
          </svg>
        )}
      </Box>

      {/* Message Text */}
      <Typography
        sx={{
          fontSize: "15px",
          fontWeight: 500,
          color: "#334155",
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.5,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          letterSpacing: "-0.1px",
          flex: 1,
          pr: "8px",
        }}
      >
        {displayMsg}
      </Typography>

      {/* Clickable 'X' Close Button */}
      <Box
        component="button"
        type="button"
        aria-label="Close notification"
        onClick={(e) => {
          e.stopPropagation();
          if (onCloseClick) onCloseClick();
        }}
        sx={{
          background: "none",
          border: "none",
          outline: "none",
          cursor: "pointer",
          p: "5px",
          m: 0,
          mt: "-2px",
          mr: { xs: "-4px", sm: "-8px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          color: btnStyle.color,
          flexShrink: 0,
          transition: "all 0.18s ease-in-out",
          "&:hover": {
            color: btnStyle.hoverColor,
            backgroundColor: btnStyle.hoverBg,
          },
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Box>

      {/* Thick 6px Bottom Accent Bar */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "6px",
          backgroundColor: accentColor,
        }}
      />
    </Box>
  );
};

// Prevent duplicate stacking of the exact same message
const activeToastKeys = new Set();
const rawToast = toast;

export const showToast = (type, message, options = {}) => {
  const cleanMsg = extractMessage(message);
  if (!cleanMsg || !cleanMsg.trim()) return;

  const msgKey = `${type}:${cleanMsg.trim()}`;

  if (activeToastKeys.has(msgKey)) return;

  activeToastKeys.add(msgKey);

  // Manual close mode: false by default so it stays until user clicks 'X'
  const autoCloseDuration = options.autoClose !== undefined ? options.autoClose : false;

  let toastId = null;

  const dismiss = () => {
    activeToastKeys.delete(msgKey);
    if (toastId !== null) {
      try {
        rawToast.dismiss(toastId);
      } catch {
        // ignore
      }
    }
  };

  toastId = rawToast(
    ({ closeToast }) => (
      <CustomToastContent
        type={type}
        message={cleanMsg}
        onCloseClick={() => {
          if (closeToast) closeToast();
          dismiss();
        }}
      />
    ),
    {
      type,
      autoClose: autoCloseDuration,
      hideProgressBar: true,
      closeButton: false,
      closeOnClick: false,
      pauseOnHover: false,
      pauseOnFocusLoss: false,
      icon: false,
      className: `custom-app-toast toast-${type}`,
      onClose: () => {
        activeToastKeys.delete(msgKey);
        options.onClose?.();
      },
      ...options,
    }
  );

  // If explicit autoClose duration is specified, auto-dismiss
  if (autoCloseDuration && typeof autoCloseDuration === "number") {
    setTimeout(() => {
      dismiss();
    }, autoCloseDuration);
  }

  return toastId;
};

export const showSuccess = (message, options) => showToast("success", message, options);
export const showError = (message, options) => showToast("error", message, options);
export const showWarning = (message, options) => showToast("warning", message, options);
export const showInfo = (message, options) => showToast("info", message, options);

export const notify = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
};

// Globally patch react-toastify so that ANY existing toast.success/error/warn calls in the project automatically use the reference design
try {
  toast.success = (message, options) => showSuccess(message, options);
  toast.error = (message, options) => showError(message, options);
  toast.warn = (message, options) => showWarning(message, options);
  toast.warning = (message, options) => showWarning(message, options);
  toast.info = (message, options) => showInfo(message, options);
} catch (e) {
  console.warn("Could not patch global toast:", e);
}

// Globally intercept native browser alert(...) calls so they NEVER show the browser dialog
// and instead render the standardized red error toast matching the reference design
if (typeof window !== "undefined") {
  window.alert = (message) => {
    showError(message);
  };
}

export default notify;
