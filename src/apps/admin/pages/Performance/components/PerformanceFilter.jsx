import React, { useState } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  TextField,
  CircularProgress,
} from "@mui/material";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";

import { useAuth } from "@/shared/context/AuthContext";

import { fetchPerformanceFilterDropdowns } from "@/apps/admin/services/performanceAdminService";

const PerformanceFilter = ({
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  filterType = "this_month",
  setFilterType,
  selectedTeam = 0,
  setSelectedTeam,
  teams = [],
  onExport,
  exporting = false,
}) => {
  const { hasPermission } = useAuth();
  const [openCalendar, setOpenCalendar] = useState(false);

  // Teams Menu Anchor
  const [teamsAnchorEl, setTeamsAnchorEl] = useState(null);
  const isTeamsOpen = Boolean(teamsAnchorEl);

  const [internalTeams, setInternalTeams] = useState(null);
  const fetchedRef = React.useRef(false);

  React.useEffect(() => {
    if (isTeamsOpen && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchPerformanceFilterDropdowns()
        .then((res) => {
          const data = res?.data?.data || res?.data;
          if (data && Array.isArray(data.teams)) {
            setInternalTeams(data.teams);
          }
        })
        .catch((err) => {
          console.error("Error loading performance filter dropdowns:", err);
          fetchedRef.current = false;
        });
    }
  }, [isTeamsOpen]);

  const teamList = internalTeams !== null ? internalTeams : (Array.isArray(teams) ? teams : []);

  const handleTeamsClick = (event) => {
    setTeamsAnchorEl(event.currentTarget);
  };

  const handleTeamsClose = () => {
    setTeamsAnchorEl(null);
  };

  const handleTeamSelect = (teamId) => {
    if (setSelectedTeam) setSelectedTeam(teamId);
    setTeamsAnchorEl(null);
  };

  const getTeamLabel = () => {
    const found = teamList.find(
      (t) => Number(t.id ?? t.value) === Number(selectedTeam) || (t.name || t.label || t.code) === selectedTeam
    );
    if (found) return found.name || found.label;
    return "All Teams";
  };

  const handleApplyCustomRange = (from, to) => {
    if (!from || !to) {
      if (setFromDate) setFromDate("");
      if (setToDate) setToDate("");
      if (setFilterType) setFilterType("this_month");
    } else {
      if (setFromDate) setFromDate(from);
      if (setToDate) setToDate(to);
      if (setFilterType) setFilterType("custom");
    }
    setOpenCalendar(false);
  };

  const handleCloseCalendar = () => {
    setOpenCalendar(false);
    if (!fromDate || !toDate) {
      if (setFilterType) setFilterType((prev) => (prev === "custom" ? "this_month" : prev));
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1.5,
          mb: 2.5,
          flexWrap: "wrap",
        }}
      >
        {/* 1. DATE FILTER DROPDOWN (Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Custom Date) */}
        <TextField
          select
          size="small"
          value={filterType || "this_month"}
          onChange={(e) => {
            const val = e.target.value;
            if (setFilterType) setFilterType(val);
            if (val === "custom") {
              setOpenCalendar(true);
            }
          }}
          slotProps={{
            select: {
              IconComponent: KeyboardArrowDownOutlinedIcon,
            },
          }}
          sx={{
            minWidth: "140px",
            "& .MuiOutlinedInput-root": {
              height: "36px",
              borderRadius: "8px",
              background: "#FFFFFF",
              border: "1px solid #D0CCCC",
              "& fieldset": { border: "none" },
              fontSize: "14px",
              fontWeight: 500,
              color: "#1E293B",
            },
          }}
        >
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="yesterday">Yesterday</MenuItem>
          <MenuItem value="last_7_days">Last 7 Days</MenuItem>
          <MenuItem value="last_30_days">Last 30 Days</MenuItem>
          <MenuItem value="this_month">This Month</MenuItem>
          <MenuItem
            value="custom"
            onClick={() => {
              if (setFilterType) setFilterType("custom");
              setOpenCalendar(true);
            }}
          >
            Custom Date
          </MenuItem>
        </TextField>

        {/* 2. Teams Filter Dropdown Button */}
        <Button
          onClick={handleTeamsClick}
          startIcon={<SwapVertIcon sx={{ fontSize: 18, color: "#475569" }} />}
          endIcon={<KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18, color: "#475569" }} />}
          sx={{
            height: "36px",
            px: 2,
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            color: "#1E293B",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid #D0CCCC",
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
            "&:hover": {
              backgroundColor: "#F8FAFC",
              borderColor: "#A0A0A0",
            },
          }}
        >
          {getTeamLabel()}
        </Button>

        {/* Teams Filter Menu */}
        <Menu
          anchorEl={teamsAnchorEl}
          open={isTeamsOpen}
          onClose={handleTeamsClose}
          PaperProps={{
            sx: {
              borderRadius: "8px",
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
              mt: 0.5,
              minWidth: "150px",
            },
          }}
        >
          <MenuItem
            onClick={() => handleTeamSelect(0)}
            selected={Number(selectedTeam) === 0 || selectedTeam === "all"}
          >
            All Teams
          </MenuItem>
          {teamList.map((team, idx) => {
            const teamId = team.id ?? team.value ?? idx + 1;
            const teamName = team.name ?? team.label ?? String(teamId);
            return (
              <MenuItem
                key={teamId}
                onClick={() => handleTeamSelect(teamId)}
                selected={
                  Number(selectedTeam) === Number(teamId) ||
                  (String(selectedTeam).toLowerCase() === String(teamName).toLowerCase())
                }
              >
                {teamName}
              </MenuItem>
            );
          })}
        </Menu>

        {/* 3. Export Button */}
        {(hasPermission("api_export_performance_overview_admin") || hasPermission("export_performance")) && (
          <Button
            onClick={onExport}
            disabled={exporting}
            startIcon={
              exporting ? (
                <CircularProgress size={16} sx={{ color: "#475569" }} />
              ) : (
                <CalendarMonthOutlinedIcon />
              )
            }
            sx={{
              height: "36px",
              px: 2.5,
              borderRadius: "8px",
              backgroundColor: "#D9F99D",
              color: "#1E293B",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #C0E875",
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
              "&:hover": {
                backgroundColor: "#CBEF80",
              },
              "&.Mui-disabled": {
                backgroundColor: "#E2E8F0",
                borderColor: "#CBD5E1",
              },
            }}
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        )}
      </Box>

      {/* CUSTOM DATE POPUP — Exact shared component matching Leads page */}
      <CustomDateRangePicker
        open={openCalendar}
        onClose={handleCloseCalendar}
        onApply={handleApplyCustomRange}
        initialFrom={fromDate}
        initialTo={toDate}
        accentColor="#90D916"
      />
    </>
  );
};

export default PerformanceFilter;