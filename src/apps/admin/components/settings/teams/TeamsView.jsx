import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Button, Paper, IconButton, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CreateTeamModal from "./CreateTeamModal";
import EditTeamModal from "./EditTeamModal";
import DeleteTeamModal from "./DeleteTeamModal";
import {
  fetchAllTeamsAdmin,
  createTeamAdmin,
  editTeamAdmin,
  deleteTeamAdmin,
  fetchTeamDropdownsAdmin,
} from "@/apps/admin/services/teamService";
import { toast } from "react-toastify";

function TeamPeopleIcon({ color = "#6366F1" }) {
  return (
    <Box
      component="svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Box>
  );
}

const ACCENT = "#90D916";

function getIconColors(colorHex) {
  if (!colorHex) return { iconBg: "#EEF2FF", iconColor: "#6366F1" };
  const hex = colorHex.toUpperCase();
  if (hex === "#E3F2FD") return { iconBg: "#E3F2FD", iconColor: "#1E88E5" };
  if (hex === "#FFF3E0") return { iconBg: "#FFF3E0", iconColor: "#F57C00" };
  if (hex === "#FCE4EC") return { iconBg: "#FCE4EC", iconColor: "#D81B60" };
  if (hex === "#E8F5E9") return { iconBg: "#E8F5E9", iconColor: "#43A047" };
  if (hex.startsWith("#E") || hex.startsWith("#F")) {
    return { iconBg: colorHex, iconColor: "#6366F1" };
  }
  return { iconBg: colorHex + "1F", iconColor: colorHex };
}

const extractTeamsResponseList = (teamsRes) => {
  const rawRes = teamsRes?.data;
  const innerData = rawRes?.data || rawRes || {};
  if (Array.isArray(innerData)) return innerData;
  if (Array.isArray(innerData.data)) return innerData.data;
  if (Array.isArray(innerData.teams)) return innerData.teams;
  if (Array.isArray(innerData.team_list)) return innerData.team_list;
  if (Array.isArray(innerData.results)) return innerData.results;
  if (Array.isArray(rawRes?.data)) return rawRes.data;
  if (Array.isArray(rawRes?.teams)) return rawRes.teams;
  if (Array.isArray(rawRes)) return rawRes;
  return [];
};

const resolveLeadDisplayName = (item) => {
  if (item?.lead_name) return item.lead_name;
  if (item?.lead_obj && typeof item.lead_obj === "object" && item.lead_obj.name) return item.lead_obj.name;
  if (item?.lead && typeof item.lead === "object" && item.lead.name) return item.lead.name;
  if (typeof item?.lead === "string") return item.lead;
  return "Unassigned";
};

export default function TeamsView() {
  const [teamsList, setTeamsList] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(null);

  const dropFetchedRef = React.useRef(false);
  // Fetch Team Dropdowns (Leads, Users) lazily on modal open
  const loadDropdowns = useCallback(async () => {
    if (dropFetchedRef.current) return;
    try {
      dropFetchedRef.current = true;
      const dropRes = await fetchTeamDropdownsAdmin();
      const dropData = dropRes?.data?.data || dropRes?.data || {};

      const rawLeads = Array.isArray(dropData.leads)
        ? dropData.leads
        : Array.isArray(dropData.telecallers)
        ? dropData.telecallers
        : [];
      const rawUsers = Array.isArray(dropData.users)
        ? dropData.users
        : Array.isArray(dropData.members)
        ? dropData.members
        : [];

      const formattedLeads = rawLeads.map((u) => ({
        id: u.id ?? u.value,
        value: u.value ?? u.id,
        name: u.name || u.full_name || u.label || "Lead",
        label: u.label || u.name || u.full_name || "Lead",
      }));

      const formattedUsers = rawUsers.map((u) => ({
        id: u.id ?? u.value,
        value: u.value ?? u.id,
        name: u.name || u.full_name || u.label || "User",
        label: u.label || u.name || u.full_name || "User",
      }));

      setLeadsList(formattedLeads);
      setUsersList(formattedUsers);
    } catch (dErr) {
      console.error("Error fetching team dropdowns:", dErr);
      dropFetchedRef.current = false;
      setLeadsList([]);
      setUsersList([]);
    }
  }, []);

  // Load Teams from Backend API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Teams from backend
      const teamsRes = await fetchAllTeamsAdmin();
      const list = extractTeamsResponseList(teamsRes);

      const formattedTeams = list.map((item) => {
        const leadName = resolveLeadDisplayName(item);

        // Members array
        let memberNames = [];
        if (Array.isArray(item.members)) {
          memberNames = item.members.map((m) =>
            typeof m === "object" && m !== null ? m.name || m.full_name || "-" : String(m)
          );
        }

        // Icon BG & Color from backend API hex string
        const { iconBg, iconColor } = getIconColors(item.color);

        return {
          id: item.id,
          name: item.name || "Unnamed Team",
          lead: leadName,
          rawLead: item.lead_obj || item.lead,
          membersCount: item.membersCount !== undefined ? item.membersCount : memberNames.length,
          members: memberNames,
          rawMembers: item.members,
          color: item.color || "#6366F1",
          iconBg,
          iconColor,
        };
      });

      setTeamsList(formattedTeams);
    } catch (err) {
      console.error("Error fetching teams from backend:", err);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isCreateModalOpen) {
      loadDropdowns();
    }
  }, [isCreateModalOpen, loadDropdowns]);

  const handleOpenDeleteTeam = (team) => {
    setDeletingTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteTeam = async (targetTeam) => {
    try {
      const res = await deleteTeamAdmin({ id: targetTeam.id });
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "Team deleted successfully");
        loadData();
      } else {
        toast.error(res?.data?.message || "Failed to delete team");
      }
    } catch (err) {
      console.error("Error deleting team:", err);
      toast.error(err?.response?.data?.message || "Error deleting team");
    }
  };

  const handleOpenEditTeam = (team) => {
    setEditingTeam(team);
    setIsEditModalOpen(true);
  };

  const handleUpdateTeam = async (updatedTeamData) => {
    try {
      const res = await editTeamAdmin(updatedTeamData);
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "Team updated successfully");
        loadData();
      } else {
        toast.error(res?.data?.message || "Failed to update team");
      }
    } catch (err) {
      console.error("Error updating team:", err);
      toast.error(err?.response?.data?.message || "Error updating team");
    }
  };

  const handleSaveTeam = async (newTeamData) => {
    try {
      const res = await createTeamAdmin(newTeamData);
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "Team created successfully");
        loadData();
      } else {
        toast.error(res?.data?.message || "Failed to create team");
      }
    } catch (err) {
      console.error("Error creating team:", err);
      toast.error(err?.response?.data?.message || "Error creating team");
    }
  };

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Header Bar (Sub-heading & Create Team Action Button) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3.5,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* Left Sub-heading & Description */}
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "17px",
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
              mb: 0.5,
            }}
          >
            Teams
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 400,
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Organize your workforce into teams with designated leads
          </Typography>
        </Box>

        {/* Right Action Button: + Create Team */}
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 20 }} />}
          onClick={() => setIsCreateModalOpen(true)}
          sx={{
            backgroundColor: "#0205C8",
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            textTransform: "none",
            height: "36px",
            px: 2.5,
            mr: 8,
            borderRadius: "6px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.12)",
            "&:hover": {
              backgroundColor: "#0104A0",
            },
          }}
        >
          Create Team
        </Button>
      </Box>

      {/* Loading Indicator or Teams Cards Row */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
      ) : teamsList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "#64748B" }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
            No teams found. Click "Create Team" to add a new team.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 3,
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          {teamsList.map((team) => (
            <Paper
              key={team.id}
              elevation={0}
              sx={{
                flex: "1 1 300px",
                maxWidth: "380px",
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                p: 2.5,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {/* Top Row: Icon + Name + Action Icons */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                {/* Left Icon + Team Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {/* Team Color Avatar Icon */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "8px",
                      backgroundColor: team.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <TeamPeopleIcon color={team.iconColor} />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#0F172A",
                        fontFamily: "Inter, sans-serif",
                        lineHeight: 1.2,
                      }}
                    >
                      {team.name}
                    </Typography>
                  </Box>
                </Box>

                {/* Right Edit & Delete Action Icons */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEditTeam(team)}
                    sx={{
                      p: 0.4,
                      color: "#64748B",
                      "&:hover": { backgroundColor: "#F1F5F9" },
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDeleteTeam(team)}
                    sx={{
                      p: 0.4,
                      color: "#DC2626",
                      "&:hover": { backgroundColor: "#FEE2E2" },
                    }}
                  >
                    <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Middle Row: Lead Info */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    mr: 1,
                  }}
                >
                  Team Lead:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: ACCENT,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {team.lead}
                </Typography>
              </Box>

              {/* Bottom Row: Members List */}
              <Box>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#64748B",
                    fontFamily: "Inter, sans-serif",
                    mb: 0.8,
                  }}
                >
                  Members ({team.membersCount})
                </Typography>

                {/* Member Name Pills */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  {team.members.map((memberName, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        backgroundColor: "#F1F5F9",
                        color: "#334155",
                        fontSize: "12px",
                        fontWeight: 400,
                        fontFamily: "Inter, sans-serif",
                        px: 1.5,
                        py: 0.4,
                        borderRadius: "4px",
                      }}
                    >
                      {memberName}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create Team Modal Dialog */}
      <CreateTeamModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveTeam}
        leadsList={leadsList}
        usersList={usersList}
      />

      {/* Edit Team Modal Dialog */}
      <EditTeamModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateTeam}
        team={editingTeam}
        leadsList={leadsList}
        usersList={usersList}
      />

      {/* Delete Team Modal Dialog */}
      <DeleteTeamModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteTeam}
        team={deletingTeam}
      />
    </Box>
  );
}
