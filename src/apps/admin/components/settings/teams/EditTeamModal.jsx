import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import { toast } from "react-toastify";

const ACCENT = "#90D916";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#F2F2F2",
    borderRadius: "5px",
    height: "36px",
    opacity: 1,
    "& fieldset": { border: "0.5px solid #00000017" },
    "&:hover fieldset": { border: "0.5px solid #00000017" },
    "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
  },
  "& .MuiInputBase-input": {
    padding: "8px 12px",
    fontSize: "13.5px",
    fontFamily: "Inter, sans-serif",
    height: "36px",
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
  backgroundColor: "#F2F2F2",
  borderRadius: "5px",
  height: "36px",
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

const labelStyles = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "13.5px",
  color: "#2B2B2B",
  mb: 0.8,
};

const COLOR_OPTIONS = [
  { label: "Purple", value: "#6366F1" },
  { label: "Orange", value: "#F97316" },
  { label: "Pink", value: "#EC4899" },
  { label: "Green", value: "#10B981" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Light Blue", value: "#E3F2FD" },
  { label: "Light Orange", value: "#FFF3E0" },
  { label: "Light Pink", value: "#FCE4EC" },
];

import { fetchTeamDropdownsAdmin } from "@/apps/admin/services/teamService";

const extractLeadIdFromTeam = (team, leadsOptions = []) => {
  if (!team) return "";
  if (team.lead_id) return team.lead_id;
  if (team.rawLead && typeof team.rawLead === "object" && (team.rawLead.id || team.rawLead.value)) {
    return team.rawLead.id || team.rawLead.value;
  }
  if (team.lead && typeof team.lead === "object" && (team.lead.id || team.lead.value)) {
    return team.lead.id || team.lead.value;
  }
  if (typeof team.lead === "number") return team.lead;
  if (typeof team.lead === "string" && leadsOptions.length > 0) {
    const found = leadsOptions.find(
      (u) => (u.name || u.full_name || u.label || "").toLowerCase() === team.lead.toLowerCase()
    );
    if (found) return found.id ?? found.value;
  }
  return "";
};

const extractMemberIdsFromTeam = (team, usersList = []) => {
  const rawMem = team?.rawMembers || team?.members || [];
  const result = [];
  if (Array.isArray(rawMem)) {
    rawMem.forEach((m) => {
      if (typeof m === "number") {
        result.push(m);
      } else if (typeof m === "object" && m !== null && (m.id || m.value)) {
        result.push(m.id || m.value);
      } else if (typeof m === "string" && usersList.length > 0) {
        const found = usersList.find(
          (u) => (u.name || u.full_name || u.label || "").toLowerCase() === m.toLowerCase()
        );
        if (found) result.push(found.id ?? found.value);
      }
    });
  }
  return result;
};

export default function EditTeamModal({ open, onClose, onSave, team, leadsList = [], usersList = [] }) {
  const [teamName, setTeamName] = useState("");
  const [teamColor, setTeamColor] = useState("#6366F1");
  const [leadId, setLeadId] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [fetchedTeamUsers, setFetchedTeamUsers] = useState(null);
  const [fetchedTeamLeads, setFetchedTeamLeads] = useState(null);
  const [errors, setErrors] = useState({ name: "", color: "", lead: "", members: "" });

  const leadsOptions = leadsList.length > 0 ? leadsList : usersList;

  // Use backend returned team-specific users/leads if fetched, otherwise fallback to props
  const rawUsersToUse = fetchedTeamUsers !== null ? fetchedTeamUsers : usersList;
  const rawLeadsToUse = fetchedTeamLeads !== null ? fetchedTeamLeads : leadsOptions;

  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    let isMounted = true;
    if (open && team) {
      setTeamName(team.name || "");
      setTeamColor(team.color || "#6366F1");
      setLeadId(extractLeadIdFromTeam(team, leadsOptions));
      setMemberIds(extractMemberIdsFromTeam(team, usersList));
      setErrors({ name: "", color: "", lead: "", members: "" });

      // Fetch team-specific dropdowns by passing team_id to backend API
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        fetchTeamDropdownsAdmin({ team_id: team.id })
          .then((res) => {
            if (!isMounted) return;
            const dropData = res?.data?.data || res?.data || {};
            const rawLeads = Array.isArray(dropData.leads) ? dropData.leads : null;
            const rawUsers = Array.isArray(dropData.users)
              ? dropData.users
              : Array.isArray(dropData.telecallers)
              ? dropData.telecallers
              : null;

            if (rawLeads) {
              setFetchedTeamLeads(
                rawLeads.map((u) => ({
                  id: u.id ?? u.value ?? u.user_id,
                  value: u.value ?? u.id ?? u.user_id,
                  name: u.name || u.full_name || u.label || "Lead",
                  label: u.label || u.name || u.full_name || "Lead",
                }))
              );
            }
            if (rawUsers) {
              setFetchedTeamUsers(
                rawUsers.map((u) => ({
                  id: u.id ?? u.value ?? u.user_id,
                  value: u.value ?? u.id ?? u.user_id,
                  name: u.name || u.full_name || u.label || "User",
                  label: u.label || u.name || u.full_name || "User",
                }))
              );
            }
          })
          .catch((err) => {
            console.error("Error fetching team specific dropdowns:", err);
            hasFetchedRef.current = false;
          });
      }
    } else {
      hasFetchedRef.current = false;
      setFetchedTeamUsers(null);
      setFetchedTeamLeads(null);
    }

    return () => {
      isMounted = false;
    };
  }, [open, team, leadsOptions, usersList]);

  if (!open) return null;

  const handleUpdate = () => {
    const newErrors = {
      name: !teamName.trim() ? "Team Name is required" : "",
      color: !teamColor ? "Please select Team Color" : "",
      lead: !leadId ? "Please select Team Lead" : "",
      members: !memberIds || memberIds.length === 0 ? "Please select at least one member" : "",
    };

    if (newErrors.name || newErrors.color || newErrors.lead || newErrors.members) {
      setErrors(newErrors);
      toast.error("Please fill all mandatory fields");
      return;
    }

    if (onSave && team) {
      onSave({
        id: team.id,
        name: teamName.trim(),
        color: teamColor || "#6366F1",
        lead_id: Number(leadId),
        member_ids: memberIds.map(Number),
      });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "550px",
          borderRadius: "8px",
          overflow: "hidden",
          p: 0,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      {/* 1. Header Bar matching Figma design */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <EditOutlinedIcon sx={{ color: ACCENT, fontSize: 20 }} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "16px",
            color: ACCENT,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Edit Team
        </Typography>
      </Box>

      {/* 2. Modal Body Form */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Team Name */}
        <Box>
          <Typography sx={labelStyles}>
            Team Name <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter Name"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            error={Boolean(errors.name)}
            helperText={errors.name}
            sx={{
              ...fieldStyles,
              ...(errors.name
                ? {
                    "& .MuiOutlinedInput-root fieldset": { borderColor: "#EF4444 !important" },
                  }
                : {}),
            }}
          />
        </Box>

        {/* Row 2: Team Color & Team Lead */}
        <Box sx={{ display: "flex", gap: 2.5, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={labelStyles}>
              Team Color <span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            <Select
              fullWidth
              value={teamColor}
              onChange={(e) => {
                setTeamColor(e.target.value);
                if (errors.color) setErrors((prev) => ({ ...prev, color: "" }));
              }}
              IconComponent={KeyboardArrowDownIcon}
              renderValue={(selected) => {
                const found = COLOR_OPTIONS.find(
                  (c) => c.value.toLowerCase() === (selected || "").toLowerCase()
                );
                return (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: selected || "#6366F1",
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    />
                    {found ? found.label : selected}
                  </Box>
                );
              }}
              sx={{
                ...selectFieldStyles,
                ...(errors.color ? { border: "1px solid #EF4444" } : {}),
              }}
            >
              {COLOR_OPTIONS.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: c.value,
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    />
                    {c.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.color && (
              <Typography sx={{ color: "#EF4444", fontSize: "11.5px", mt: 0.5, fontFamily: "Inter, sans-serif" }}>
                {errors.color}
              </Typography>
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={labelStyles}>
              Team Lead <span style={{ color: "#EF4444" }}>*</span>
            </Typography>
            {(() => {
              const currentLeadIdVal = leadId || team?.lead_id || (typeof team?.rawLead === "object" ? team?.rawLead?.id || team?.rawLead?.value : null);
              const currentLeadNameVal = team?.lead_name || (typeof team?.rawLead === "object" ? team?.rawLead?.name || team?.rawLead?.full_name : null) || (typeof team?.lead === "string" ? team?.lead : null) || "Team Lead";

              const combinedLeadsOptions = [...rawLeadsToUse];
              if (currentLeadIdVal && !combinedLeadsOptions.some((u) => String(u.id ?? u.value) === String(currentLeadIdVal))) {
                combinedLeadsOptions.unshift({
                  id: currentLeadIdVal,
                  value: currentLeadIdVal,
                  name: currentLeadNameVal,
                  label: currentLeadNameVal,
                });
              }

              return (
                <Select
                  fullWidth
                  displayEmpty
                  value={leadId}
                  onChange={(e) => {
                    setLeadId(e.target.value);
                    if (errors.lead) setErrors((prev) => ({ ...prev, lead: "" }));
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <Typography sx={{ color: "#9CA3AF", fontSize: "13.5px" }}>
                          Select Team Lead
                        </Typography>
                      );
                    }
                    const found =
                      combinedLeadsOptions.find((u) => String(u.id ?? u.value) === String(selected)) ||
                      rawUsersToUse.find((u) => String(u.id ?? u.value) === String(selected));

                    if (found) return found.name || found.full_name || found.label;
                    if (team?.lead_name) return team.lead_name;
                    if (typeof team?.lead === "string") return team.lead;
                    if (typeof team?.rawLead === "object") return team.rawLead.name || team.rawLead.full_name || selected;
                    return selected;
                  }}
                  sx={{
                    ...selectFieldStyles,
                    ...(errors.lead ? { border: "1px solid #EF4444" } : {}),
                  }}
                >
                  {combinedLeadsOptions.map((u) => (
                    <MenuItem key={u.id ?? u.value} value={u.id ?? u.value}>
                      {u.name || u.full_name || u.label}
                    </MenuItem>
                  ))}
                </Select>
              );
            })()}
            {errors.lead && (
              <Typography sx={{ color: "#EF4444", fontSize: "11.5px", mt: 0.5, fontFamily: "Inter, sans-serif" }}>
                {errors.lead}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 3: Add Members (Full Width) + Icon Button */}
        <Box>
          <Typography sx={labelStyles}>
            Add Members <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Select
              fullWidth
              multiple
              displayEmpty
              value={memberIds}
              onChange={(e) => {
                setMemberIds(e.target.value);
                if (errors.members) setErrors((prev) => ({ ...prev, members: "" }));
              }}
              IconComponent={KeyboardArrowDownIcon}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return (
                    <Typography sx={{ color: "#9CA3AF", fontSize: "13.5px" }}>
                      Select Team Members
                    </Typography>
                  );
                }
                const selectedNames = rawUsersToUse
                  .filter((u) => selected.includes(u.id ?? u.value))
                  .map((u) => u.name || u.full_name || u.label);
                return selectedNames.length > 0
                  ? selectedNames.join(", ")
                  : `${selected.length} members selected`;
              }}
              sx={{
                ...selectFieldStyles,
                flex: 1,
                ...(errors.members ? { border: "1px solid #EF4444" } : {}),
              }}
            >
              {rawUsersToUse.map((u) => (
                <MenuItem key={u.id ?? u.value} value={u.id ?? u.value}>
                  <Checkbox checked={memberIds.includes(u.id ?? u.value)} size="small" />
                  <ListItemText primary={u.name || u.full_name || u.label} />
                </MenuItem>
              ))}
            </Select>

            {/* Right Add User Icon Box */}
            <Box
              sx={{
                width: 42,
                height: 36,
                backgroundColor: "#F2F2F2",
                border: "0.5px solid #00000017",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PersonAddOutlinedIcon sx={{ fontSize: 20, color: "#000000" }} />
            </Box>
          </Box>
          {errors.members && (
            <Typography sx={{ color: "#EF4444", fontSize: "11.5px", mt: 0.5, fontFamily: "Inter, sans-serif" }}>
              {errors.members}
            </Typography>
          )}
        </Box>

        {/* 3. Footer Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
            pt: 1.5,
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
              height: "32px",
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
            onClick={handleUpdate}
            sx={{
              backgroundColor: ACCENT,
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "13.5px",
              textTransform: "none",
              height: "32px",
              px: 2.5,
              borderRadius: "5px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                backgroundColor: "#7EC610",
              },
            }}
          >
            Update
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
