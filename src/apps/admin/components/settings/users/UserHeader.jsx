import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export default function UsersHeader({
  searchTerm = "",
  onSearchChange,
  onSortChange,
  onAddUserClick,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortOption, setSortOption] = useState("newest");

  const handleSortClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortClose = (option) => {
    setAnchorEl(null);
    if (option) {
      setSortOption(option);
      if (onSortChange) onSortChange(option);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 2.5,
      }}
    >
      {/* 1. LEFT SECTION: Title & Subtitle */}
      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#0F172A", fontSize: "17px" }}
        >
          Users
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#64748B", fontSize: "14px", mt: 0.3,fontWeight:400, }}
        >
          Manage your team with user creation and user deactivation or deletion.
        </Typography>
      </Box>

      {/* 2. RIGHT SECTION: Search, Sort & Add Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          width: { xs: "100%", md: "auto" },
        }}
      >
        {/* Search Field */}
        <TextField
          size="small"
          placeholder="Search by name, phone, etc."
          value={searchTerm}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: "100%", sm: "240px" },
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              backgroundColor: "#F8FAFC",
              fontSize: "14px",fontWeight:400,
              "& fieldset": {
                border:"2px solid #d6dfea",
              },
              "&:hover fieldset": {
                borderColor: "#CBD5E1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#84CC16",
              },
            },
          }}
        />

        {/* Sort By Dropdown Button */}
        <Button
          size="small"
          onClick={handleSortClick}
          startIcon={<SwapVertIcon sx={{ color: "#404347", fontSize: 18 }} />}
          endIcon={
            <KeyboardArrowDownIcon sx={{ color: "#64748B", fontSize: 18 }} />
          }
          sx={{
            textTransform: "none",
            color: "#334155",
            backgroundColor: "#F8FAFC",
            border: "2px solid #d6dfea",
            borderRadius: "8px",
            px: 1.5,
            py: 0.8,
            fontSize: "14px",
            fontWeight: 400,
            "&:hover": {
              backgroundColor: "#F1F5F9",
              borderColor: "#CBD5E1",
            },
          }}
        >
          Sort by
        </Button>

        {/* Sort Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => handleSortClose(null)}
          slotProps={{
            paper: {
              elevation: 3,
              sx: {
                borderRadius: "8px",
                mt: 0.5,
                minWidth: 140,
                overflow: "hidden",
                p: 0,
                boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
                "& .MuiList-root": {
                  py: 0,
                },
              },
            },
          }}
        >
          <MenuItem
            onClick={() => handleSortClose("newest")}
            sx={{
              fontSize: "14px",
              py: 1.2,
              px: 2,
              backgroundColor: sortOption === "newest" ? "#84CC16 !important" : "transparent",
              color: sortOption === "newest" ? "#FFFFFF" : "#1E293B",
              fontWeight: sortOption === "newest" ? 600 : 400,
              "&:hover": {
                backgroundColor: sortOption === "newest" ? "#84CC16 !important" : "#F1F5F9",
              },
            }}
          >
            Newest First
          </MenuItem>
          <MenuItem
            onClick={() => handleSortClose("oldest")}
            sx={{
              fontSize: "14px",
              py: 1.2,
              px: 2,
              backgroundColor: sortOption === "oldest" ? "#84CC16 !important" : "transparent",
              color: sortOption === "oldest" ? "#FFFFFF" : "#1E293B",
              fontWeight: sortOption === "oldest" ? 600 : 400,
              "&:hover": {
                backgroundColor: sortOption === "oldest" ? "#84CC16 !important" : "#F1F5F9",
              },
            }}
          >
            Oldest First
          </MenuItem>
        </Menu>

        {/* Primary Action Button: Add New User */}
        <Button
          variant="contained"
          size="small"
          onClick={onAddUserClick}
          startIcon={<AddIcon />}
          sx={{
            textTransform: "none",
            backgroundColor: "#0205C8",
            color: "#FFFFFF",
            borderRadius: "8px",
            px: 2,
            py: 0.8,
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "none",
          }}
        >
          Add New User
        </Button>
      </Box>
    </Box>
  );
}
