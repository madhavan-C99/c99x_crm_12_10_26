import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Avatar,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";

const ACCENT = "#90D916";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FFFFFF",
    borderRadius: "6px",
    height: "38px",
    "& fieldset": { border: "1px solid #D1D5DB" },
    "&:hover fieldset": { border: "1px solid #9CA3AF" },
    "&.Mui-focused fieldset": { border: `1.5px solid ${ACCENT}` },
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
};

const selectFieldStyles = {
  backgroundColor: "#FFFFFF",
  borderRadius: "6px",
  height: "38px",
  fontFamily: "Inter, sans-serif",
  fontSize: "13.5px",
  color: "#2B2B2B",
  "& fieldset": { border: "1px solid #D1D5DB" },
  "&:hover fieldset": { border: "1px solid #9CA3AF" },
  "&.Mui-focused fieldset": { border: `1.5px solid ${ACCENT}` },
  "& .MuiSelect-select": {
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
  },
};

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  color: "#2B2B2B",
  mb: 0.6,
};

const generateDynamicMonths = () => {
  const months = [];
  const now = new Date();
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const monthNamesLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const mIdx = d.getMonth();
    const year = d.getFullYear();
    const label = `${monthNamesLong[mIdx]} ${year}`;
    const value = monthNamesShort[mIdx];
    months.push({ label, value, full: label });
  }
  return months;
};

const MONTHS = generateDynamicMonths();

export default function SetTargetModal({
  open,
  onClose,
  onSave,
  teamsList = [],
  employeesList = [],
}) {
  const currentMonthName = dayjs().format("MMMM YYYY");
  const [monthLabel, setMonthLabel] = useState(currentMonthName);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openCalendar, setOpenCalendar] = useState(false);

  const [targetFor, setTargetFor] = useState("Team");
  const [team, setTeam] = useState("");
  const [employee, setEmployee] = useState("");
  const [leadTarget, setLeadTarget] = useState("");
  const [amountTarget, setAmountTarget] = useState("");
  const [customMemberAllocations, setCustomMemberAllocations] = useState({});
  const [distributeToMembers, setDistributeToMembers] = useState(false);
  const [errors, setErrors] = useState({ team: "", employee: "", target: "" });

  useEffect(() => {
    if (open) {
      setMonthLabel(currentMonthName);
      setFromDate("");
      setToDate("");
      setTargetFor("Team");
      setTeam("");
      setEmployee("");
      setLeadTarget("");
      setAmountTarget("");
      setCustomMemberAllocations({});
      setDistributeToMembers(false);
      setErrors({ team: "", employee: "", target: "" });
    }
  }, [open, currentMonthName]);

  if (!open) return null;

  const handleApplyCustomRange = (from, to) => {
    if (from && to) {
      setFromDate(from);
      setToDate(to);
      setMonthLabel(
        `${dayjs(from).format("DD MMM YYYY")} - ${dayjs(to).format("DD MMM YYYY")}`
      );
    }
    setOpenCalendar(false);
  };

  const handleSubmit = () => {
    const newErrors = {
      team: targetFor === "Team" && !team ? "Please select a Team" : "",
      employee: targetFor === "Individual" && !employee ? "Please select an Employee" : "",
      target: !leadTarget.toString().trim() && !amountTarget.toString().trim() ? "Please enter Lead Target or Amount Target" : "",
    };

    if (newErrors.team || newErrors.employee || newErrors.target) {
      setErrors(newErrors);
      if (newErrors.team) toast.error("Please select Team");
      else if (newErrors.employee) toast.error("Please select Employee");
      else toast.error("Please enter a Target value");
      return;
    }

    // Find team / employee object for ID matching backend API schema
    const selectedTeamObj = teamsList.find(
      (t) => (typeof t === "object" ? t.team || t.name || t.team_name || t.label || String(t.id) : String(t)) === team
    );
    const selectedEmpObj = employeesList.find((e) => {
      if (typeof e === "object") {
        return (
          String(e.id) === String(employee) ||
          String(e.value) === String(employee) ||
          e.name === employee ||
          e.label === employee
        );
      }
      return String(e) === String(employee);
    });

    // Construct individual_allocations for Team Target scenario matching Django Serializer spec
    let individualAllocations = [];
    if (targetFor === "Team" && team && distributeToMembers) {
      let members = [];
      if (selectedTeamObj && typeof selectedTeamObj === "object") {
        if (Array.isArray(selectedTeamObj.members) && selectedTeamObj.members.length > 0) {
          members = selectedTeamObj.members;
        } else if (Array.isArray(selectedTeamObj.employees) && selectedTeamObj.employees.length > 0) {
          members = selectedTeamObj.employees;
        }
      }
      if (members.length === 0 && employeesList.length > 0) {
        members = employeesList.filter((emp) => {
          if (typeof emp === "object") {
            return (
              (emp.team && (emp.team || "").toLowerCase() === team.toLowerCase()) ||
              (emp.team_name && (emp.team_name || "").toLowerCase() === team.toLowerCase())
            );
          }
          return false;
        });
      }
      const numericLead = Number(leadTarget) || 0;
      const memberCount = members.length || 1;
      const baseSplit = Math.floor(numericLead / memberCount);
      const remainder = numericLead % memberCount;

      let totalDistributedSum = 0;
      individualAllocations = members.map((m, idx) => {
        const memberName =
          typeof m === "object"
            ? m.name || m.full_name || m.username || m.employee || `Member ${idx + 1}`
            : String(m);
        const empId = typeof m === "object" ? m.id || m.employee_id || m.user_id : null;
        const defaultLeads = baseSplit + (idx < remainder ? 1 : 0);
        const assignedLeads =
          customMemberAllocations[memberName] !== undefined
            ? customMemberAllocations[memberName]
            : defaultLeads;
        totalDistributedSum += Number(assignedLeads);

        return {
          employee_id: empId || null,
          employee_name: memberName,
          lead_target: Number(assignedLeads),
          amount_target: Number(amountTarget) > 0 && memberCount > 0 ? Number(amountTarget) / memberCount : 0.0,
          target_calls: 0,
        };
      });

      if (leadTarget && totalDistributedSum !== numericLead) {
        toast.error(`Total distributed leads (${totalDistributedSum}) must equal Lead Target (${numericLead})`);
        return;
      }
    }

    const apiTargetFor = targetFor === "Team" ? "Team" : "Employee";

    if (onSave) {
      onSave({
        month: monthLabel,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        target_for: apiTargetFor,
        targetFor: apiTargetFor,
        team_id: selectedTeamObj?.id || null,
        team_name: selectedTeamObj?.name || selectedTeamObj?.team || team || null,
        teamName: selectedTeamObj?.name || selectedTeamObj?.team || team || null,
        employee_id: selectedEmpObj?.id || null,
        employeeId: selectedEmpObj?.id || null,
        lead_target: leadTarget ? Number(leadTarget) : 0,
        leadTarget: leadTarget ? Number(leadTarget) : 0,
        amount_target: amountTarget ? Number(amountTarget) : 0.0,
        amountTarget: amountTarget ? Number(amountTarget) : 0.0,
        target_calls: 0,
        individual_allocations: individualAllocations,
        name: targetFor === "Team" ? team || "Team Target" : employee || "Employee Target",
        type: apiTargetFor,
        target: leadTarget ? Number(leadTarget) : 0,
      });
    }

    onClose();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "438px",
          maxHeight: "607px",
          borderRadius: "6px",
          overflow: "hidden",
          p: 0,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* 1. Header Bar matching image media_1788942040554.png */}
      <Box
        sx={{
          px: 3,
          py: 1.8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EditOutlinedIcon sx={{ color: ACCENT, fontSize: 20 }} />
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "17px",
              color: ACCENT,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Set Monthly Target
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#374151" }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* 2. Scrollable Modal Body Form */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          backgroundColor: "#FFFFFF",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {/* Month */}
        <Box>
          <Typography sx={labelStyles}>Month</Typography>
          <Box
            onClick={() => setOpenCalendar(true)}
            sx={{
              ...selectFieldStyles,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              px: 1.5,
              border: "1px solid #D1D5DB",
              backgroundColor: "#FFFFFF",
              "&:hover": { borderColor: "#9CA3AF" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: "#6B7280" }} />
              <Typography sx={{ fontSize: "13.5px", color: "#2B2B2B", fontFamily: "Inter, sans-serif" }}>
                {monthLabel}
              </Typography>
            </Box>
            <KeyboardArrowDownIcon sx={{ fontSize: 20, color: "#6B7280" }} />
          </Box>
        </Box>

        {/* Target For */}
        <Box>
          <Typography sx={labelStyles}>Target For</Typography>
          <RadioGroup
            row
            value={targetFor}
            onChange={(e) => setTargetFor(e.target.value)}
            sx={{ gap: 3 }}
          >
            <FormControlLabel
              value="Team"
              control={
                <Radio
                  size="small"
                  sx={{
                    color: ACCENT,
                    "&.Mui-checked": { color: ACCENT },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: "13px",
                    color: "#2B2B2B",
                  }}
                >
                  Team
                </Typography>
              }
            />
            <FormControlLabel
              value="Individual"
              control={
                <Radio
                  size="small"
                  sx={{
                    color: ACCENT,
                    "&.Mui-checked": { color: ACCENT },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: "13px",
                    color: "#2B2B2B",
                  }}
                >
                  Individual
                </Typography>
              }
            />
          </RadioGroup>
        </Box>

        {/* Dynamic Field based on Target For Selection */}
        {targetFor === "Team" ? (
          <Box>
            <Typography sx={labelStyles}>
              Team <span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={team}
              onChange={(e) => {
                setTeam(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, team: "" }));
              }}
              IconComponent={KeyboardArrowDownIcon}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <Typography sx={{ color: "#2B2B2B", fontSize: "13.5px" }}>
                      Start from blank
                    </Typography>
                  );
                }
                return selected;
              }}
              sx={{
                ...selectFieldStyles,
                ...(errors.team
                  ? {
                      "& fieldset": { border: "1px solid #EF4444 !important" },
                      "&:hover fieldset": { border: "1px solid #EF4444 !important" },
                    }
                  : {}),
              }}
            >
              <MenuItem value="">Start from blank</MenuItem>
              {teamsList.map((t, idx) => {
                const val = typeof t === "object" ? t.team || t.name || t.team_name || t.label || String(t.id) : String(t);
                return (
                  <MenuItem key={idx} value={val}>
                    {val}
                  </MenuItem>
                );
              })}
            </Select>
            {errors.team && (
              <Typography sx={{ color: "#EF4444", fontSize: "12px", mt: 0.5, fontFamily: "Inter, sans-serif" }}>
                {errors.team}
              </Typography>
            )}
          </Box>
        ) : (
          <Box>
            <Typography sx={labelStyles}>
              Employee <span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={employee}
              onChange={(e) => {
                setEmployee(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, employee: "" }));
              }}
              IconComponent={KeyboardArrowDownIcon}
              renderValue={(selected) => {
                if (!selected) {
                  return (
                    <Typography sx={{ color: "#2B2B2B", fontSize: "13.5px" }}>
                      Start from blank
                    </Typography>
                  );
                }
                const foundEmp = employeesList.find((e) => {
                  if (typeof e === "object") {
                    return (
                      String(e.id) === String(selected) ||
                      String(e.value) === String(selected) ||
                      e.name === selected ||
                      e.label === selected
                    );
                  }
                  return String(e) === String(selected);
                });
                if (foundEmp && typeof foundEmp === "object") {
                  return foundEmp.name || foundEmp.label || foundEmp.full_name || selected;
                }
                return selected;
              }}
              sx={{
                ...selectFieldStyles,
                ...(errors.employee
                  ? {
                      "& fieldset": { border: "1px solid #EF4444 !important" },
                      "&:hover fieldset": { border: "1px solid #EF4444 !important" },
                    }
                  : {}),
              }}
            >
              <MenuItem value="">Start from blank</MenuItem>
              {employeesList.map((emp, idx) => {
                const val = typeof emp === "object" ? emp.id ?? emp.value ?? emp.name : String(emp);
                const label = typeof emp === "object" ? emp.name || emp.label || emp.full_name || emp.user_name || String(emp.id ?? emp.value) : String(emp);
                return (
                  <MenuItem key={idx} value={val}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
            {errors.employee && (
              <Typography sx={{ color: "#EF4444", fontSize: "12px", mt: 0.5, fontFamily: "Inter, sans-serif" }}>
                {errors.employee}
              </Typography>
            )}
          </Box>
        )}

        {/* Lead Target */}
        <Box>
          <Typography sx={labelStyles}>
            Lead Target <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            placeholder="Start from blank"
            value={leadTarget}
            onChange={(e) => {
              setLeadTarget(e.target.value);
              setCustomMemberAllocations({});
              if (e.target.value || amountTarget) setErrors((prev) => ({ ...prev, target: "" }));
            }}
            sx={{
              ...fieldStyles,
              ...(errors.target
                ? {
                    "& .MuiOutlinedInput-root fieldset": { border: "1px solid #EF4444 !important" },
                    "& .MuiOutlinedInput-root:hover fieldset": { border: "1px solid #EF4444 !important" },
                  }
                : {}),
            }}
          />
        </Box>

        {/* Amount Target */}
        <Box>
          <Typography sx={labelStyles}>Amount Target</Typography>
          <TextField
            fullWidth
            placeholder="Start from blank"
            value={amountTarget}
            onChange={(e) => {
              setAmountTarget(e.target.value);
              if (e.target.value || leadTarget) setErrors((prev) => ({ ...prev, target: "" }));
            }}
            sx={{
              ...fieldStyles,
              ...(errors.target
                ? {
                    "& .MuiOutlinedInput-root fieldset": { border: "1px solid #EF4444 !important" },
                    "& .MuiOutlinedInput-root:hover fieldset": { border: "1px solid #EF4444 !important" },
                  }
                : {}),
            }}
          />
          {errors.target && (
            <Typography sx={{ color: "#EF4444", fontSize: "12px", mt: 0.5, fontFamily: "Inter, sans-serif" }}>
              {errors.target}
            </Typography>
          )}
        </Box>

        {/* Checkbox to opt-in to individual member lead distribution */}
        {targetFor === "Team" && team && (
          <Box sx={{ mt: 1.5, mb: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={distributeToMembers}
                  onChange={(e) => setDistributeToMembers(e.target.checked)}
                  sx={{
                    color: ACCENT,
                    "&.Mui-checked": { color: ACCENT },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: "13.5px",
                    color: "#2B2B2B",
                  }}
                >
                  Distribute lead target to individual team members
                </Typography>
              }
            />
          </Box>
        )}

        {/* Distribution Summary Card matching Image 1 */}
        {targetFor === "Team" && team && distributeToMembers && (
          (() => {
            const selectedTeamObj = teamsList.find(
              (t) =>
                (typeof t === "object"
                  ? t.name || t.team_name || t.team || t.label
                  : String(t)) === team
            );

            let members = [];
            if (selectedTeamObj && typeof selectedTeamObj === "object") {
              if (Array.isArray(selectedTeamObj.members) && selectedTeamObj.members.length > 0) {
                members = selectedTeamObj.members;
              } else if (Array.isArray(selectedTeamObj.employees) && selectedTeamObj.employees.length > 0) {
                members = selectedTeamObj.employees;
              }
            }

            if (members.length === 0 && employeesList.length > 0) {
              members = employeesList.filter((emp) => {
                if (typeof emp === "object") {
                  return (
                    (emp.team && (emp.team || "").toLowerCase() === team.toLowerCase()) ||
                    (emp.team_name && (emp.team_name || "").toLowerCase() === team.toLowerCase())
                  );
                }
                return false;
              });
            }

            const numericLead = Number(leadTarget) || 0;
            const memberCount = members.length || 1;
            const baseSplit = Math.floor(numericLead / memberCount);
            const remainder = numericLead % memberCount;

            const getMemberCurrentLead = (m, idx) => {
              const memberName =
                typeof m === "object"
                  ? m.name || m.full_name || m.username || m.employee || `Member ${idx + 1}`
                  : String(m);
              const defaultLeads = baseSplit + (idx < remainder ? 1 : 0);
              return customMemberAllocations[memberName] !== undefined
                ? customMemberAllocations[memberName]
                : defaultLeads;
            };

            const totalDistributed = members.reduce((sum, m, idx) => {
              return sum + Number(getMemberCurrentLead(m, idx) || 0);
            }, 0);

            const diff = totalDistributed - numericLead;

            const handleIncrementMember = (memberName, currentVal) => {
              setCustomMemberAllocations((prev) => ({
                ...prev,
                [memberName]: Math.max(0, Number(currentVal) + 1),
              }));
            };

            const handleDecrementMember = (memberName, currentVal) => {
              setCustomMemberAllocations((prev) => ({
                ...prev,
                [memberName]: Math.max(0, Number(currentVal) - 1),
              }));
            };

            const handleInputChangeMember = (memberName, rawVal) => {
              const parsed = rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);
              setCustomMemberAllocations((prev) => ({
                ...prev,
                [memberName]: parsed,
              }));
            };

            return (
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  p: 2,
                  mt: 1,
                }}
              >
                {/* Header with Title and Total Allocated Badge */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1E293B",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Distribution Summary
                  </Typography>

                  {numericLead > 0 && (
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif",
                        px: 1.2,
                        py: 0.3,
                        borderRadius: "12px",
                        backgroundColor: totalDistributed === numericLead ? "#DCFCE7" : "#FEF3C7",
                        color: totalDistributed === numericLead ? "#15803D" : "#B45309",
                        border: totalDistributed === numericLead ? "1px solid #86EFAC" : "1px solid #FCD34D",
                      }}
                    >
                      Total: {totalDistributed} / {numericLead}
                    </Typography>
                  )}
                </Box>

                {/* Warning Banner Alert if Total Distributed != Lead Target */}
                {numericLead > 0 && totalDistributed !== numericLead && (
                  <Box
                    sx={{
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      borderRadius: "6px",
                      p: 1.2,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12.5px",
                        color: "#991B1B",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      ⚠️ Total distributed ({totalDistributed}) does not match Lead Target ({numericLead}). {diff > 0 ? `Exceeds target by ${diff}` : `Short by ${Math.abs(diff)}`}.
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                  {members.map((m, idx) => {
                    const memberName =
                      typeof m === "object"
                        ? m.name || m.full_name || m.username || m.employee || `Member ${idx + 1}`
                        : String(m);

                    const assignedLeads = getMemberCurrentLead(m, idx);

                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 0.5,
                          borderBottom: idx < members.length - 1 ? "1px solid #F1F5F9" : "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "13px",
                              backgroundColor: "#DBEAFE",
                              color: "#1D4ED8",
                              fontWeight: 600,
                            }}
                          >
                            {memberName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            sx={{
                              fontSize: "13.5px",
                              fontWeight: 500,
                              color: "#334155",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            {memberName}
                          </Typography>
                        </Box>

                        {/* Interactive Stepper Widget [ - | Input Text Field | + ] */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            backgroundColor: "#FFFFFF",
                            height: "30px",
                            overflow: "hidden",
                            "&:focus-within": {
                              borderColor: ACCENT,
                            },
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleDecrementMember(memberName, assignedLeads)}
                            sx={{
                              borderRadius: 0,
                              width: "30px",
                              height: "30px",
                              borderRight: "1px solid #E2E8F0",
                              color: "#64748B",
                              p: 0,
                              "&:hover": { backgroundColor: "#F1F5F9" },
                            }}
                          >
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </IconButton>

                          <Box
                            component="input"
                            type="number"
                            value={assignedLeads}
                            onChange={(e) => handleInputChangeMember(memberName, e.target.value)}
                            sx={{
                              width: "46px",
                              textAlign: "center",
                              fontSize: "13.5px",
                              fontWeight: 600,
                              color: "#334155",
                              fontFamily: "Inter, sans-serif",
                              border: "none",
                              outline: "none",
                              backgroundColor: "transparent",
                              p: 0,
                              margin: 0,
                              "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                                "-webkit-appearance": "none",
                                margin: 0,
                              },
                              "-moz-appearance": "textfield",
                            }}
                          />

                          <IconButton
                            size="small"
                            onClick={() => handleIncrementMember(memberName, assignedLeads)}
                            sx={{
                              borderRadius: 0,
                              width: "30px",
                              height: "30px",
                              borderLeft: "1px solid #E2E8F0",
                              color: "#64748B",
                              p: 0,
                              "&:hover": { backgroundColor: "#F1F5F9" },
                            }}
                          >
                            <AddIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            );
          })()
        )}
      </Box>

      {/* 3. Fixed Footer Action Buttons Always Visible at Bottom */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 2.5,
          borderTop: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderColor: ACCENT,
            color: ACCENT,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13.5px",
            textTransform: "none",
            height: "34px",
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
          onClick={handleSubmit}
          sx={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13.5px",
            textTransform: "none",
            height: "34px",
            px: 2.5,
            borderRadius: "5px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
            "&:hover": {
              backgroundColor: "#7EC610",
            },
          }}
        >
          Set Target
        </Button>
      </Box>

      <CustomDateRangePicker
        open={openCalendar}
        onClose={() => setOpenCalendar(false)}
        onApply={handleApplyCustomRange}
        initialFrom={fromDate}
        initialTo={toDate}
      />
    </Dialog>
  );
}
