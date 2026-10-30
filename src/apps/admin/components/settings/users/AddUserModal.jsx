import { useState, useEffect } from "react";
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
import { sanitizeMobileInput, validateMobile } from "@/shared/utils/mobile";

const ACCENT = "#90D916";
const ERROR_COLOR = "#D32F2F";
const DEFAULT_ERROR = "Failed to add user";

// Mandatory fields: key -> label shown in the error message
const REQUIRED_FIELDS = {
  fullName: "Full Name",
  contactNo: "Contact No",
  email: "Email",
  location: "Location",
  role: "Role",
  reportingTo: "Reporting To",
  joinedDate: "Joined Date",
  employeeId: "Employee Id",
};

const isEmpty = (v) =>
  v === "" ||
  v === null ||
  v === undefined ||
  (typeof v === "string" && !v.trim());

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#F2F2F2",
    borderRadius: "5px",
    height: "35px",
    opacity: 1,
    "& fieldset": { border: "0.5px solid #00000017" },
    "&:hover fieldset": { border: "0.5px solid #00000017" },
    "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
    "&.Mui-error fieldset": { border: `1px solid ${ERROR_COLOR}` },
  },
  "& .MuiInputBase-input": {
    padding: "6px 12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    height: "35px",
    boxSizing: "border-box",
    "&::placeholder": {
      fontFamily: "Inter, sans-serif",
      fontWeight: 400,
      fontSize: "14px",
      lineHeight: "100%",
      letterSpacing: "0%",
      opacity: 1,
      color: "#98A2B3",
    },
  },
  "& .MuiSelect-select": {
    padding: "6px 12px",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    height: "35px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
  },
  "& .MuiFormHelperText-root": {
    margin: "3px 0 0",
    fontSize: "12px",
    fontFamily: "Inter, sans-serif",
    lineHeight: 1.25,
  },
  "& .MuiFormHelperText-root.Mui-error": {
    color: ERROR_COLOR,
  },
};

const statusFieldStyles = {
  ...fieldStyles,
  "& .MuiOutlinedInput-root": {
    ...fieldStyles["& .MuiOutlinedInput-root"],
    backgroundColor: "#E9F3D9",
    color: ACCENT,
    fontWeight: 600,
  },
};

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
        <Box component="span" sx={{ color: ERROR_COLOR }}>
          {" "}
          *
        </Box>
      )}
    </Typography>
  );
}

const EMPTY_FORM = {
  fullName: "",
  contactNo: "",
  email: "",
  location: "",
  role: "",
  reportingTo: "",
  status: "Active",
  joinedDate: "",
  employeeId: "",
  team: "",
};

/* -------------------------------------------------------------------------- */
/*  Backend error parsing                                                     */
/*  Goal: show the backend error directly under the matching field.           */
/* -------------------------------------------------------------------------- */

// Backend key -> form field key
const KEY_MAP = {
  full_name: "fullName",
  fullname: "fullName",
  name: "fullName",
  contact_no: "contactNo",
  contactno: "contactNo",
  mobile_no: "contactNo",
  mobileno: "contactNo",
  mobile: "contactNo",
  phone: "contactNo",
  email: "email",
  location: "location",
  role: "role",
  role_name: "role",
  role_id: "role",
  reporting_to: "reportingTo",
  reportingto: "reportingTo",
  reporting_to_id: "reportingTo",
  manager: "reportingTo",
  joined_date: "joinedDate",
  joineddate: "joinedDate",
  emp_id: "employeeId",
  empid: "employeeId",
  employee_id: "employeeId",
  employeeid: "employeeId",
  team: "team",
  team_id: "team",
};

// Fallback keyword matching (only used when backend gives no field-wise errors).
// Specific keywords are checked first, vague ones last.
const STRONG_KEYWORDS = [
  ["email", ["email", "e-mail"]],
  ["contactNo", ["mobile", "contact", "phone"]],
  [
    "employeeId",
    [
      "employee id",
      "employee_id",
      "emp id",
      "emp_id",
      "empid",
      "employee code",
    ],
  ],
  ["reportingTo", ["reporting", "manager"]],
  ["role", ["role"]],
  ["location", ["location"]],
  ["joinedDate", ["joined"]],
  ["team", ["team"]],
];

const WEAK_KEYWORDS = [
  ["employeeId", ["employee"]],
  ["fullName", ["full name", "fullname", "name"]],
  ["joinedDate", ["date"]],
];

const isPlainObject = (o) => o && typeof o === "object" && !Array.isArray(o);

// Converts string / array / nested object into one readable string
const toText = (v) => {
  if (Array.isArray(v)) {
    return v.flat(Infinity).filter(Boolean).map(String).join(", ");
  }
  if (isPlainObject(v)) return toText(Object.values(v));
  return v === null || v === undefined ? "" : String(v);
};

const parseBackendError = (err) => {
  const fieldErrors = {};
  const respData = err?.response?.data;

  // 1. General error message
  let errorMsg =
    (typeof respData === "string" && respData) ||
    toText(respData?.message) ||
    toText(respData?.detail) ||
    toText(respData?.error) ||
    (err?.message && !err.message.startsWith("Request failed with status code")
      ? err.message
      : "") ||
    DEFAULT_ERROR;

  // 2. Structured field errors: { errors: {...} } | { data: {...} } | { email: [...] }
  const sources = [respData?.errors, respData?.data, respData];
  for (const src of sources) {
    if (!isPlainObject(src) || src.id) continue;
    for (const [key, value] of Object.entries(src)) {
      const mapped = KEY_MAP[String(key).toLowerCase()];
      const msg = toText(value);
      if (mapped && msg && !fieldErrors[mapped]) fieldErrors[mapped] = msg;
    }
    if (Object.keys(fieldErrors).length > 0) break;
  }

  // 3. Fallback: keyword match on the message (only if step 2 found nothing)
  if (Object.keys(fieldErrors).length === 0 && errorMsg) {
    const lower = errorMsg.toLowerCase();
    const hit =
      STRONG_KEYWORDS.find(([, kws]) => kws.some((w) => lower.includes(w))) ||
      WEAK_KEYWORDS.find(([, kws]) => kws.some((w) => lower.includes(w)));
    if (hit) fieldErrors[hit[0]] = errorMsg;
  }

  // If backend only sent field errors, use the first one as toast text
  if (errorMsg === DEFAULT_ERROR) {
    const first = Object.values(fieldErrors)[0];
    if (first) errorMsg = first;
  }

  return { fieldErrors, errorMsg };
};

// Helpers to build dropdown options from string / object lists
const getOptionValue = (item, keys) => {
  if (item && typeof item === "object") {
    for (const k of keys) {
      if (item[k] !== undefined && item[k] !== null) return item[k];
    }
    return "";
  }
  return item;
};

const getOptionLabel = (item, keys, fallback) => {
  if (item && typeof item === "object") {
    for (const k of keys) {
      if (item[k]) return item[k];
    }
    return String(fallback);
  }
  return String(item);
};

function renderOptions(list, valueKeys, labelKeys, emptyText) {
  if (!list || list.length === 0) {
    return (
      <MenuItem value="" disabled>
        {emptyText}
      </MenuItem>
    );
  }
  return list.map((item, idx) => {
    const val = getOptionValue(item, valueKeys);
    const label = getOptionLabel(item, labelKeys, val);
    return (
      <MenuItem key={idx} value={val}>
        {label}
      </MenuItem>
    );
  });
}

export default function AddUserModal({
  open,
  onClose,
  onSave,
  rolesList = [],
  managersList = [],
  teamsList = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open]);

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === "contactNo") {
      value = sanitizeMobileInput(value);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    Object.entries(REQUIRED_FIELDS).forEach(([key, label]) => {
      if (isEmpty(form[key])) newErrors[key] = `${label} is required`;
    });

    if (!newErrors.contactNo) {
      const contactErr = validateMobile(form.contactNo, "Contact No");
      if (contactErr) {
        newErrors.contactNo = contactErr;
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
        await onSave(form);
      }
      toast.success("User added successfully!");
      onClose();
    } catch (err) {
      console.error("Error saving user:", err);
      const { fieldErrors, errorMsg } = parseBackendError(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Do not allow closing while the save request is running
  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "6px",
          width: "100%",
          maxWidth: "838px",
          maxHeight: "92vh",
          opacity: 1,
          display: "flex",
          flexDirection: "column",
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
          Add New User
        </Typography>
      </Box>
      <Divider />

      <DialogContent
        sx={{
          px: 3,
          pt: 2,
          pb: 2.5,
          overflowY: "auto",
        }}
      >
        <Stack spacing={1.5}>
          {/* Row 1: Full Name & Contact No */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
                placeholder="Enter 10-digit Mobile No"
                value={form.contactNo}
                onChange={handleChange("contactNo")}
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                sx={fieldStyles}
                error={Boolean(errors.contactNo)}
                helperText={errors.contactNo}
              />
            </Box>
          </Stack>

          {/* Row 2: Email & Location */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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

          {/* Row 3: Role & Reporting To */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Role</FieldLabel>
              <TextField
                select
                fullWidth
                value={form.role}
                onChange={handleChange("role")}
                sx={fieldStyles}
                SelectProps={{ displayEmpty: true }}
                error={Boolean(errors.role)}
                helperText={errors.role}
              >
                <MenuItem value="" disabled>
                  Select Role
                </MenuItem>
                {renderOptions(
                  rolesList,
                  ["id", "value", "name", "role_name"],
                  ["label", "name", "role_name"],
                  "No Roles Available",
                )}
              </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Reporting To</FieldLabel>
              <TextField
                select
                fullWidth
                value={form.reportingTo}
                onChange={handleChange("reportingTo")}
                sx={fieldStyles}
                SelectProps={{ displayEmpty: true }}
                error={Boolean(errors.reportingTo)}
                helperText={errors.reportingTo}
              >
                <MenuItem value="" disabled>
                  Select Manager
                </MenuItem>
                {renderOptions(
                  managersList,
                  ["id", "value", "name", "full_name"],
                  ["label", "name", "full_name"],
                  "No Managers Available",
                )}
              </TextField>
            </Box>
          </Stack>

          {/* Row 4: Status & Joined Date */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>Status</FieldLabel>
              <TextField
                select
                fullWidth
                value={form.status}
                onChange={handleChange("status")}
                sx={statusFieldStyles}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Joined Date</FieldLabel>
              <TextField
                fullWidth
                type="date"
                value={form.joinedDate}
                onChange={handleChange("joinedDate")}
                InputLabelProps={{ shrink: true }}
                sx={fieldStyles}
                error={Boolean(errors.joinedDate)}
                helperText={errors.joinedDate}
              />
            </Box>
          </Stack>

          {/* Row 5: Employee Id & Team */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <FieldLabel required>Employee Id</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter Employee Id"
                value={form.employeeId}
                onChange={handleChange("employeeId")}
                sx={fieldStyles}
                error={Boolean(errors.employeeId)}
                helperText={errors.employeeId}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FieldLabel>Team</FieldLabel>
              <TextField
                select
                fullWidth
                value={form.team}
                onChange={handleChange("team")}
                sx={fieldStyles}
                SelectProps={{ displayEmpty: true }}
                error={Boolean(errors.team)}
                helperText={errors.team}
              >
                <MenuItem value="" disabled>
                  Select Team
                </MenuItem>
                {renderOptions(
                  teamsList,
                  ["id", "value", "name", "team_name"],
                  ["label", "name", "team_name"],
                  "No Teams Available",
                )}
              </TextField>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
        <Button
          onClick={handleClose}
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
