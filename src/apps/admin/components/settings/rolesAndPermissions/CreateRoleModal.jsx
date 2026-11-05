import { useState } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Alert,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { toast } from "react-toastify";

const ACCENT = "#90D916";

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "13.5px",
  color: "#2B2B2B",
  mb: 0.8,
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={labelStyles}>
      {children}
      {required && (
        <Box component="span" sx={{ color: "#EF4444" }}>
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

const getFieldStyles = (hasError) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: hasError ? "#FEF2F2" : "#F2F2F2",
    borderRadius: "5px",
    height: "38px",
    "& fieldset, & .MuiOutlinedInput-notchedOutline": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : "0.5px solid #00000017",
    },
    "&:hover fieldset, &:hover .MuiOutlinedInput-notchedOutline": {
      border: hasError
        ? "1.5px solid #EF4444 !important"
        : "0.5px solid #00000017",
    },
    "&.Mui-focused fieldset, &.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: hasError ? "1.5px solid #EF4444 !important" : `1px solid ${ACCENT}`,
    },
  },
  "& .MuiInputBase-input": {
    padding: "8px 12px",
    fontSize: "13.5px",
    fontFamily: "Inter, sans-serif",
    height: "38px",
    boxSizing: "border-box",
    "&::placeholder": {
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontSize: "13.5px",
      color: "#9CA3AF",
      opacity: 1,
    },
  },
});

const selectFieldStyles = {
  backgroundColor: "#F2F2F2",
  borderRadius: "5px",
  height: "38px",
  fontFamily: "Inter, sans-serif",
  fontSize: "13.5px",
  color: "#2B2B2B",
  "& fieldset": { border: "0.5px solid #00000017" },
  "&:hover fieldset": { border: "0.5px solid #00000017" },
  "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
  "& .MuiSelect-select": {
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
  },
};

const DATA_SCOPES = [
  { id: "own", label: "Own leads" },
  { id: "team", label: "Team Leads" },
  { id: "all", label: "All leads" },
];

export default function CreateRoleModal({
  open,
  onClose,
  onSave,
  existingRoles = [],
}) {
  const [roleName, setRoleName] = useState("");
  const [duplicateFrom, setDuplicateFrom] = useState("blank");
  const [dataScope, setDataScope] = useState("own");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);



  if (!open) return null;

  const handleSave = async () => {
    const trimmed = roleName.trim();
    if (!trimmed) {
      setError("Please enter Role Name");
      return;
    }

    try {
      setLoading(true);
      setFeedback({ type: "", message: "" });
      if (onSave) {
        await onSave({
          name: trimmed,
          duplicateFrom,
          dataScope,
        });
      }
      resetForm();
      onClose();
    } catch (err) {
      console.error("Error creating role:", err);
      const errMsg =
        err?.response?.data?.message || err?.message || "Failed to create role";
      setFeedback({ type: "error", message: errMsg });
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoleName("");
    setDuplicateFrom("blank");
    setDataScope("own");
    setError("");
    setFeedback({ type: "", message: "" });
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "500px",
          borderRadius: "8px",
          overflow: "hidden",
          p: 0,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EditOutlinedIcon sx={{ color: ACCENT, fontSize: 20 }} />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "16px",
              color: ACCENT,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Create Role
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          disabled={loading}
          sx={{ color: "#64748B" }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Modal Body Form */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          backgroundColor: "#FFFFFF",
        }}
      >
        {feedback.message && (
          <Alert
            severity={feedback.type || "error"}
            sx={{
              borderRadius: "6px",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Role Name */}
        <Box>
          <FieldLabel required>Role Name</FieldLabel>
          <TextField
            fullWidth
            placeholder="Role Name"
            value={roleName}
            onChange={(e) => {
              setRoleName(e.target.value);
              if (error) setError("");
              if (feedback.message) setFeedback({ type: "", message: "" });
            }}
            error={Boolean(error)}
            onBlur={() => {
              if (!roleName.trim()) {
                setError("Please enter Role Name");
              }
            }}
            sx={getFieldStyles(Boolean(error))}
          />
          <FieldError error={error} />
        </Box>

        {/* Duplicate from (optional) */}
        <Box>
          <Typography sx={labelStyles}>Duplicate from (optional)</Typography>
          <Select
            fullWidth
            value={duplicateFrom}
            onChange={(e) => setDuplicateFrom(e.target.value)}
            IconComponent={KeyboardArrowDownIcon}
            MenuProps={{
              anchorOrigin: { vertical: "bottom", horizontal: "left" },
              transformOrigin: { vertical: "top", horizontal: "left" },
              autoFocus: false,
              disableAutoFocusItem: true,
              PaperProps: {
                sx: {
                  mt: 0.5,
                  maxHeight: 250,
                },
              },
            }}
            sx={selectFieldStyles}
          >
            <MenuItem value="blank">Start from blank</MenuItem>
            {existingRoles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Data Scope */}
        <Box>
          <Typography sx={labelStyles}>Data Scope</Typography>
          <Box sx={{ display: "flex", gap: 1.5, width: "100%" }}>
            {DATA_SCOPES.map((scope) => {
              const isSelected = dataScope === scope.id;
              return (
                <Button
                  key={scope.id}
                  onClick={() => setDataScope(scope.id)}
                  sx={{
                    flex: 1,
                    height: "36px",
                    borderRadius: "6px",
                    textTransform: "none",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: isSelected
                      ? "1.5px solid #3B82F6"
                      : "1px solid #CBD5E1",
                    backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                    color: isSelected ? "#1E293B" : "#334155",
                    "&:hover": {
                      backgroundColor: isSelected ? "#DBEAFE" : "#F8FAFC",
                    },
                  }}
                >
                  {scope.label}
                </Button>
              );
            })}
          </Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
              mt: 1,
            }}
          >
            Controls which records this role can see, separate from feature
            access below.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
            pt: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={loading}
            sx={{
              borderColor: ACCENT,
              color: ACCENT,
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "13.5px",
              textTransform: "none",
              height: "36px",
              px: 2.5,
              borderRadius: "5px",
              backgroundColor: "#FFFFFF",
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
            onClick={handleSave}
            disabled={loading}
            sx={{
              backgroundColor: ACCENT,
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "13.5px",
              textTransform: "none",
              height: "36px",
              px: 2.5,
              borderRadius: "5px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                backgroundColor: "#7EC610",
              },
              "&.Mui-disabled": {
                backgroundColor: "#D1D5DB",
                color: "#9CA3AF",
              },
            }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
