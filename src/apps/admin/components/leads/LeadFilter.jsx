import React, { useState } from "react";
import { Box, Button, MenuItem, TextField, Menu } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";

import FilterPopup from "./AdminLeadFilterPopup";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";

const CommonFilters = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  sortType,
  setSortType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  selectedFilters,
  setSelectedFilters,
  fetchLeadData,
  dropdownCategory = "lead_filter",
  viewType: viewTypeProp,
  onViewTypeChange,
  selectedPipeline,
}) => {
  const [openCalendar, setOpenCalendar] = useState(false);
  const [internalViewType, setInternalViewType] = useState("list");

  const viewType = viewTypeProp ?? internalViewType;

  const handleViewTypeChange = (value) => {
    setInternalViewType(value);
    onViewTypeChange?.(value);
  };

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);

  const handleApplyCustomRange = (from, to) => {
    if (!from || !to) {
      setFromDate("");
      setToDate("");
      setFilterType("monthly");
    } else {
      setFromDate(from);
      setToDate(to);
      setFilterType("custom");
    }
    setOpenCalendar(false);
  };

  const handleCloseCalendar = () => {
    setOpenCalendar(false);
    if (!fromDate || !toDate) {
      setFilterType((prev) => (prev === "custom" ? "monthly" : prev));
    }
  };

  return (
    <>
      <Box
        sx={{
          background: "#fff",
          border: "1px solid #E5E5E5",
          borderRadius: "7px",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mt: 1.5,
          mb: 1.5,
        }}
      >
        {/* LEFT: Search Bar */}
        <Box
          sx={{
            position: "relative",
            minWidth: {
              xs: "100%",
              md: "350px",
            },
            flex: 1,
          }}
        >
          <AddOutlinedIcon
            sx={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9E9E9E",
              fontSize: "18px",
              zIndex: 1,
            }}
          />

          <TextField
            fullWidth
            placeholder="Search by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "36px",
                borderRadius: "6px",
                background: "#E6E6E6",
                pl: "28px",
                "& fieldset": {
                  border: "none",
                },
              },
              "& input::placeholder": {
                color: "#9E9E9E",
                opacity: 1,
                fontSize: "14px",
              },
            }}
          />
        </Box>

        {/* RIGHT: Filter & View Toggle Controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          {/* PIPELINE / LIST TOGGLE GROUP */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              height: "36px",
              borderRadius: "6px",
              border: "1px solid #E0E0E0",
              background: "#fff",
              p: "3px",
              boxSizing: "border-box",
            }}
          >
            <Button
              startIcon={<FilterListOutlinedIcon sx={{ fontSize: "16px !important" }} />}
              onClick={() => handleViewTypeChange("pipeline")}
              sx={{
                height: "28px",
                minWidth: "auto",
                px: 1.5,
                borderRadius: "5px",
                background: viewType === "pipeline" ? "#90D916" : "transparent",
                color: viewType === "pipeline" ? "#fff" : "#666",
                textTransform: "none",
                fontSize: "13px",
                fontWeight: 500,
                "&:hover": {
                  background: viewType === "pipeline" ? "#7fc311" : "#F0F0F0",
                },
              }}
            >
              Pipeline
            </Button>

            <Button
              startIcon={
                <FormatListBulletedOutlinedIcon
                  sx={{ fontSize: "16px !important" }}
                />
              }
              onClick={() => handleViewTypeChange("list")}
              sx={{
                height: "28px",
                minWidth: "auto",
                px: 1.5,
                borderRadius: "5px",
                background: viewType === "list" ? "#90D916" : "transparent",
                color: viewType === "list" ? "#fff" : "#666",
                textTransform: "none",
                fontSize: "13px",
                fontWeight: 500,
                "&:hover": {
                  background: viewType === "list" ? "#7fc311" : "#F0F0F0",
                },
              }}
            >
              List
            </Button>
          </Box>

          {/* DATE */}
          <Button
            endIcon={<KeyboardArrowDownOutlinedIcon />}
            onClick={() => setOpenCalendar(true)}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "6px",
              background: "#E6E6E6",
              color: "#333",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                background: "#ECECEC",
              },
            }}
          >
            Date
          </Button>

          {/* FILTER */}
          <Button
            startIcon={<FilterListOutlinedIcon />}
            endIcon={<KeyboardArrowDownOutlinedIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "6px",
              background: "#E6E6E6",
              color: "#333",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                background: "#ECECEC",
              },
            }}
          >
            Filter
          </Button>

          {/* SORT */}
          <Button
            startIcon={<ImportExportOutlinedIcon />}
            endIcon={<KeyboardArrowDownOutlinedIcon />}
            onClick={(e) => setSortAnchor(e.currentTarget)}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "6px",
              background: "#E6E6E6",
              color: "#333",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                background: "#ECECEC",
              },
            }}
          >
            Sort by
          </Button>
        </Box>
      </Box>

      <CustomDateRangePicker
        allowSingleDate
        open={openCalendar}
        onClose={handleCloseCalendar}
        onApply={handleApplyCustomRange}
        initialFrom={fromDate}
        initialTo={toDate}
      />

      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
        keepMounted
        disableAutoFocusItem
        slotProps={{
          paper: {
            sx: { width: 430, overflow: "hidden", borderRadius: "12px" },
          },
        }}
      >
        <FilterPopup
          filterType={filterType}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          fetchLeadData={fetchLeadData}
          onClose={() => setFilterAnchor(null)}
          dropdownCategory={dropdownCategory}
          open={Boolean(filterAnchor)}
          selectedPipeline={selectedPipeline}
        />
      </Menu>

      <Menu
        anchorEl={sortAnchor}
        open={Boolean(sortAnchor)}
        onClose={() => setSortAnchor(null)}
      >
        <MenuItem
          selected={sortType === "newest"}
          onClick={() => {
            setSortType("newest");
            setSortAnchor(null);
          }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#90D916 !important",
              color: "#FFF",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#b9e76f !important",
            },
          }}
        >
          Newest First
        </MenuItem>

        <MenuItem
          selected={sortType === "oldest"}
          onClick={() => {
            setSortType("oldest");
            setSortAnchor(null);
          }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#90D916 !important",
              color: "#FFF",
            },
            "&.Mui-selected:hover": {
              backgroundColor: "#b9e76f !important",
            },
          }}
        >
          Oldest First
        </MenuItem>
      </Menu>
    </>
  );
};

export default CommonFilters;
