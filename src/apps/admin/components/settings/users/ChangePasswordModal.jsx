import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  OutlinedInput,
  Button,
  Divider,
  Stack,
  IconButton,
  InputAdornment,
  Alert,
} from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { toast } from "react-toastify";

const ACCENT = "#90D916";

// Styles applied directly on OutlinedInput (with dynamic error styling)
const getInputStyles = (hasError) => ({
  mt: 0.5,
  height: "35px",
  backgroundColor: hasError ? "#FEF2F2" : "#F2F2F2",
  borderRadius: "5px",
  pr: "6px",
  opacity: 1,
  "& fieldset": {
    border: hasError
      ? "1.5px solid #EF4444 !important"
      : "0.5px solid #00000017",
  },
  "&:hover fieldset": {
    border: hasError
      ? "1.5px solid #EF4444 !important"
      : "0.5px solid #00000017",
  },
  "&.Mui-focused fieldset": {
    border: hasError ? "1.5px solid #EF4444 !important" : `1px solid ${ACCENT}`,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: hasError
      ? "1.5px solid #EF4444 !important"
      : "0.5px solid #00000017",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: hasError ? "1.5px solid #EF4444 !important" : `1px solid ${ACCENT}`,
  },
  "& input": {
    padding: "6px 12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    height: "35px",
    boxSizing: "border-box",
    "&::-ms-reveal": { display: "none" },
    "&::-ms-clear": { display: "none" },
    "&::placeholder": {
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontSize: "12px",
      lineHeight: "100%",
      letterSpacing: "0%",
      opacity: 1,
      color: "#98A2B3",
    },
  },
});

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "100%",
  letterSpacing: "0%",
  color: "#2b2b2b",
  mb: 0.5,
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={labelStyles}>
      {children}
      {required && (
        <Box component="span" sx={{ color: ACCENT }}>
          {" "}
          *
        </Box>
      )}
    </Typography>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return (
    <Typography
      sx={{
        color: "#EF4444",
        fontSize: "11.5px",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        mt: 0.5,
      }}
    >
      {error}
    </Typography>
  );
}

// Password input with a show / hide eye button on the right
function PasswordField({
  value,
  onChange,
  onBlur,
  placeholder,
  visible,
  onToggle,
  hasError,
}) {
  return (
    <OutlinedInput
      fullWidth
      type={visible ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoComplete="new-password"
      sx={getInputStyles(hasError)}
      endAdornment={
        <InputAdornment position="end" sx={{ flexShrink: 0, ml: 0 }}>
          <IconButton
            size="small"
            edge="end"
            onClick={onToggle}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={visible ? "Hide password" : "Show password"}
            sx={{ color: "#64748B", p: "4px" }}
          >
            {visible ? (
              <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
            ) : (
              <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </InputAdornment>
      }
    />
  );
}

export default function ChangePasswordModal({ open, onClose, user, onSave }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
      setFeedback({ type: "", message: "" });
    }
  }, [open]);

  const clearFieldError = (fieldName) => {
    if (feedback.message) setFeedback({ type: "", message: "" });
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleNewPasswordChange = (e) => {
    const val = e.target.value;
    setNewPassword(val);
    clearFieldError("newPassword");
    if (confirmPassword && errors.confirmPassword && val === confirmPassword) {
      clearFieldError("confirmPassword");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    clearFieldError("confirmPassword");
  };

  const validateField = (field, val, allValues = {}) => {
    const trimmed = (val || "").trim();
    if (field === "newPassword") {
      if (!trimmed) {
        return "New Password is required";
      }
      if (val.length < 8) {
        return "Password must be at least 8 characters";
      }
      if (!/[^a-zA-Z0-9]/.test(val)) {
        return "Password must contain at least one special character (e.g. @, #, $, %)";
      }
    }
    if (field === "confirmPassword") {
      if (!trimmed) {
        return "Confirm New Password is required";
      }
      const newPass =
        allValues.newPassword !== undefined
          ? allValues.newPassword
          : newPassword;
      if (val !== newPass) {
        return "New Password and Confirm New Password do not match";
      }
    }
    return "";
  };

  const handleBlur = (field) => {
    const err = validateField(
      field,
      field === "newPassword" ? newPassword : confirmPassword,
      { newPassword },
    );
    if (err) {
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    const newPassErr = validateField("newPassword", newPassword);
    if (newPassErr) newErrors.newPassword = newPassErr;

    const confirmPassErr = validateField(
      "confirmPassword",
      confirmPassword,
      { newPassword },
    );
    if (confirmPassErr) newErrors.confirmPassword = confirmPassErr;

    setErrors(newErrors);
    return newErrors;
  };

  const handleUpdate = async () => {
    const validationErrors = validateAll();
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      const isMissingRequired = !newPassword.trim() || !confirmPassword.trim();
      const errorMsg = isMissingRequired
        ? "Please fill all mandatory fields!"
        : validationErrors.newPassword ||
          validationErrors.confirmPassword ||
          "Please correct the errors before submitting";

      setFeedback({ type: "error", message: errorMsg });
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setFeedback({ type: "", message: "" });
      if (onSave) {
        await onSave({ user, newPassword, confirmPassword });
      }
      onClose();
    } catch (err) {
      console.error("Error updating password:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update password";
      setFeedback({ type: "error", message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={handleClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "6px",
          width: "435px",
          minHeight: "308px",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 3,
          pt: 2,
          pb: 1.5,
        }}
      >
        <LockResetOutlinedIcon sx={{ color: ACCENT, fontSize: 22 }} />
        <Typography
          sx={{
            color: ACCENT,
            fontWeight: 600,
            fontSize: "17px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Change Password
        </Typography>
      </Box>
      <Divider />

      {/* Content */}
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
        {feedback.message && (
          <Alert
            severity={feedback.type || "error"}
            sx={{
              mb: 2,
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {feedback.message}
          </Alert>
        )}

        <Stack spacing={2}>
          {/* New Password */}
          <Box>
            <FieldLabel required>New Password</FieldLabel>
            <PasswordField
              placeholder="Enter New Password (min 8 chars, 1 special char)"
              value={newPassword}
              onChange={handleNewPasswordChange}
              onBlur={() => handleBlur("newPassword")}
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((prev) => !prev)}
              hasError={Boolean(errors.newPassword)}
            />
            <FieldError error={errors.newPassword} />
          </Box>

          {/* Confirm New Password */}
          <Box>
            <FieldLabel required>Confirm New Password</FieldLabel>
            <PasswordField
              placeholder="Re-enter New Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={() => handleBlur("confirmPassword")}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              hasError={Boolean(errors.confirmPassword)}
            />
            <FieldError error={errors.confirmPassword} />
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: ACCENT,
            borderColor: ACCENT,
            border: `1px solid ${ACCENT}`,
            backgroundColor: "#FFFFFF",
            minWidth: "74px",
            height: "28px",
            borderRadius: "3px",
            padding: "4px 12px",
            textTransform: "none",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "16px",
            lineHeight: "100%",
            letterSpacing: "0%",
            opacity: 1,
            "&:hover": {
              borderColor: ACCENT,
              backgroundColor: "#F7FEE7",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={loading}
          sx={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            minWidth: "74px",
            height: "28px",
            borderRadius: "3px",
            padding: "4px 12px",
            textTransform: "none",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "16px",
            lineHeight: "100%",
            letterSpacing: "0%",
            boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
            opacity: 1,
            "&:hover": {
              backgroundColor: "#7EC610",
              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
            },
            "&.Mui-disabled": {
              backgroundColor: "#D1D5DB",
              color: "#9CA3AF",
            },
          }}
        >
          {loading ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}