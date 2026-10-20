import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  MenuItem,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";

const ACCENT = "#90D916";
const ERROR_COLOR = "#D32F2F";

// Mandatory fields: key -> label shown in the error message.
// Joined Date and Employee Id are disabled (read-only), so they are not validated.
const REQUIRED_FIELDS = {
  fullName: "Full Name",
  contactNo: "Contact No",
  email: "Email",
  role: "Role",
  reportingTo: "Reporting To",
  location: "Location",
};

// role / reportingTo can be numeric ids, so don't call .trim() blindly
const isEmpty = (v) =>
  v === "" ||
  v === null ||
  v === undefined ||
  (typeof v === "string" && !v.trim());

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "5px",
    height: "35px",
    opacity: 1,
    "& fieldset": { border: "0.5px solid #00000085" },
    "&:hover fieldset": { border: "0.5px solid #00000085" },
    "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
    "&.Mui-error fieldset": { border: `1px solid ${ERROR_COLOR}` },
  },
  "& .MuiInputBase-input": {
    padding: "6px 12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    height: "35px",
    boxSizing: "border-box",
    color: "#344054",
  },
  "& .MuiSelect-select": {
    padding: "6px 12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    height: "35px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    color: "#344054",
  },
  "& .MuiFormHelperText-root": {
    margin: "2px 0 0",
    fontSize: "12px",
    fontFamily: "Inter, sans-serif",
  },
};

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "100%",
  letterSpacing: "0%",
  color: "#2b2b2b",
  mb: 0.8,
};

function FieldLabel({ children, required }) {
  return (
    <Typography sx={labelStyles}>
      {children}
      {required && (
        <Box component="span" sx={{ color: ERROR_COLOR }}>
          {" "}
          *
        </Box>
      )}
    </Typography>
  );
}

export default function EditUserModal({
  open,
  onClose,
  user,
  onSave,
  rolesList = [],
  managersList = [],
}) {
  const [form, setForm] = useState({
    fullName: "",
    contactNo: "",
    email: "",
    role: "",
    reportingTo: "",
    location: "",
    joinedDate: "",
    employeeId: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      const rawRepTo =
        user.reporting_to_id ??
        user.raw?.reporting_to_id ??
        user.reporting_to ??
        user.reportingTo ??
        user.raw?.reporting_to ??
        "";

      let matchedRepTo = rawRepTo;
      if (managersList.length > 0) {
        const found = managersList.find(
          (m) =>
            String(m.id || m.value) === String(rawRepTo) ||
            String(m.name || m.label || m.full_name || "").toLowerCase() ===
              String(user.reporting_to || rawRepTo).toLowerCase(),
        );
        if (found) {
          matchedRepTo = found.id ?? found.value ?? rawRepTo;
        }
      }

      const rawJoinedDate =
        user.joined_date ||
        user.joinedDate ||
        user.raw?.joined_date ||
        user.raw?.joinedDate ||
        "";

      const formattedJoinedDate = rawJoinedDate
        ? String(rawJoinedDate).slice(0, 10)
        : "";

      setForm({
        fullName:
          user.name || user.fullName || user.full_name || user.raw?.name || "",
        contactNo:
          user.mobile_no ||
          user.contactNo ||
          user.contact_no ||
          user.raw?.mobile_no ||
          "",
        email: user.email || user.raw?.email || "",
        role:
          (typeof user.role === "object"
            ? user.role?.name || user.role?.role_name
            : user.role) ||
          user.role_name ||
          user.raw?.role ||
          "",
        reportingTo: matchedRepTo,
        location: user.location || user.raw?.location || "",
        joinedDate: formattedJoinedDate,
        employeeId:
          user.emp_id ||
          user.employeeId ||
          user.employee_id ||
          user.raw?.emp_id ||
          "",
      });
      setErrors({});
    }
  }, [user, open, managersList]);

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === "contactNo") {
      value = value.replace(/[^0-9+\s]/g, "").slice(0, 16);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    // clear this field's error as soon as the user edits it
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    Object.entries(REQUIRED_FIELDS).forEach(([key, label]) => {
      if (isEmpty(form[key])) newErrors[key] = `${label} is required`;
    });

    if (!newErrors.contactNo) {
      let rawDigits = String(form.contactNo).replace(/\D/g, "");
      if (rawDigits.startsWith("91") && rawDigits.length > 10) {
        rawDigits = rawDigits.slice(2);
      }
      if (rawDigits.length !== 10) {
        newErrors.contactNo = "Enter a valid 10-digit mobile number";
      }
    }

    if (!newErrors.email && !/^\S+@\S+\.\S+$/.test(String(form.email).trim())) {
      newErrors.email = "Enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fill all mandatory fields");
      return;
    }

    try {
      setLoading(true);
      if (onSave) {
        await onSave({ ...user, ...form });
      }
      toast.success("User updated successfully!");
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error(err?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "6px",
          width: "838px",
          maxWidth: "838px",
          maxHeight: "580px",
          opacity: 1,
          overflow: "hidden",
        },
      }}
    >
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
        <EditIcon sx={{ color: ACCENT, fontSize: 20 }} />
        <Typography sx={{ color: ACCENT, fontWeight: 600, fontSize: "17px" }}>
          Edit User Profile
        </Typography>
      </Box>
      <Divider />

      <DialogContent
        sx={{
          px: 3,
          pt: 2,
          pb: 3,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Full Name</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter Full Name"
                value={form.fullName}
                onChange={handleChange("fullName")}
                sx={fieldStyles}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Contact No</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter Contact No"
                value={form.contactNo}
                onChange={handleChange("contactNo")}
                inputProps={{ maxLength: 16 }}
                sx={fieldStyles}
                error={Boolean(errors.contactNo)}
                helperText={errors.contactNo}
              />
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Email</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter Email"
                value={form.email}
                onChange={handleChange("email")}
                sx={fieldStyles}
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Role</FieldLabel>
              <TextField
                select={rolesList.length > 0}
                fullWidth
                placeholder="Enter or Select Role"
                value={form.role}
                onChange={handleChange("role")}
                sx={fieldStyles}
                error={Boolean(errors.role)}
                helperText={errors.role}
              >
                {rolesList.length > 0 ? (
                  rolesList.map((r, idx) => {
                    const val =
                      typeof r === "object"
                        ? r.label || r.name || r.role_name || r.value || r.id
                        : r;
                    const label =
                      typeof r === "object"
                        ? r.label || r.name || r.role_name || String(val)
                        : String(r);
                    return (
                      <MenuItem key={idx} value={val}>
                        {label}
                      </MenuItem>
                    );
                  })
                ) : (
                  <MenuItem value={form.role || ""} disabled={!form.role}>
                    {form.role || "No Roles Loaded"}
                  </MenuItem>
                )}
              </TextField>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Reporting To</FieldLabel>
              <TextField
                select={managersList.length > 0}
                fullWidth
                placeholder="Enter or Select Manager"
                value={form.reportingTo}
                onChange={handleChange("reportingTo")}
                sx={fieldStyles}
                error={Boolean(errors.reportingTo)}
                helperText={errors.reportingTo}
              >
                {managersList.length > 0 ? (
                  managersList.map((m, idx) => {
                    const val =
                      typeof m === "object"
                        ? m.id || m.value || m.name || m.full_name
                        : m;
                    const label =
                      typeof m === "object"
                        ? m.label || m.name || m.full_name || String(val)
                        : String(m);
                    return (
                      <MenuItem key={idx} value={val}>
                        {label}
                      </MenuItem>
                    );
                  })
                ) : (
                  <MenuItem
                    value={form.reportingTo || ""}
                    disabled={!form.reportingTo}
                  >
                    {form.reportingTo || "No Managers Loaded"}
                  </MenuItem>
                )}
              </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Location</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter Location"
                value={form.location}
                onChange={handleChange("location")}
                sx={fieldStyles}
                error={Boolean(errors.location)}
                helperText={errors.location}
              />
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>Joined Date</FieldLabel>
              <TextField
                fullWidth
                type="date"
                value={form.joinedDate}
                onChange={handleChange("joinedDate")}
                sx={fieldStyles}
                disabled
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>Employee Id</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter Employee Id"
                value={form.employeeId}
                onChange={handleChange("employeeId")}
                sx={fieldStyles}
                disabled
              />
            </Box>
          </Stack>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            border: `1px solid ${ACCENT}`,
            color: ACCENT,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            textTransform: "none",
            height: "36px",
            px: 3,
            borderRadius: "5px",
            "&:hover": {
              backgroundColor: "rgba(144, 217, 22, 0.08)",
              border: `1px solid ${ACCENT}`,
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
            fontWeight: 500,
            fontSize: "14px",
            textTransform: "none",
            height: "36px",
            px: 3,
            borderRadius: "5px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#7EC610",
              boxShadow: "none",
            },
          }}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
