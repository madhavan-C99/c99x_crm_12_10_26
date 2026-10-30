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
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";

import { useAuth } from "@/shared/context/AuthContext";

import { fetchPerformanceFilterDropdowns } from "@/apps/admin/services/performanceAdminService";
import { invalidateSelectOptions } from "@/apps/admin/services/dropdownService";

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

  // Teams Menu Anchor
  const [teamsAnchorEl, setTeamsAnchorEl] = useState(null);
  const isTeamsOpen = Boolean(teamsAnchorEl);

  const [internalTeams, setInternalTeams] = useState(null);
  const fetchedRef = React.useRef(false);

  React.useEffect(() => {
    if (isTeamsOpen) {
      invalidateSelectOptions();

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
        <DateRangeSelect
          filterType={filterType || "this_month"}
          setFilterType={setFilterType}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          defaultType="this_month"
          sx={{
            height: "36px",
            minWidth: "105px",
            "& .MuiOutlinedInput-root": {
              height: "36px",
              borderRadius: "6px",
              background: "#E6E6E6",
              color: "#333",
              fontSize: "14px",
              fontWeight: 400,
              "& fieldset": { border: "none" },
              "&:hover fieldset": { border: "none" },
              "&.Mui-focused fieldset": { border: "none" },
            },
            "& .MuiSelect-select": {
              height: "36px !important",
              display: "flex",
              alignItems: "center",
              paddingTop: "0 !important",
              paddingBottom: "0 !important",
              paddingLeft: "14px !important",
              paddingRight: "30px !important",
              boxSizing: "border-box",
              fontSize: "14px",
              fontWeight: 400,
              color: "#333",
            },
            "& .MuiSelect-icon": {
              color: "#333",
              right: "6px",
            },
          }}
        />

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


    </>
  );
};

export default PerformanceFilter;