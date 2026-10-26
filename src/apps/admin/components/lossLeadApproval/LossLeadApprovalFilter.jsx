import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  MenuItem,
  Menu,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import { fetchLossLeadApprovalFilterDropdowns } from "@/apps/admin/services/leadService";

const LossLeadApprovalFilter = ({
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
  tableData = [],
  selectedPipeline,
}) => {
  // Popover Anchor states
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);

  const [apiDropdowns, setApiDropdowns] = useState(null);

  useEffect(() => {
    if (Boolean(filterAnchor)) {
      fetchLossLeadApprovalFilterDropdowns(selectedPipeline)
        .then((res) => {
          const data = res?.data?.data || res?.data || null;
          if (data) setApiDropdowns(data);
        })
        .catch((err) => {
          console.error("Loss Lead Approval Filter dropdowns API error:", err);
        });
    }
  }, [filterAnchor, selectedPipeline]);

  // Temp filters for Popover form draft state
  const [tempFilters, setTempFilters] = useState(
    selectedFilters || {
      loss_reason: "All",
      telecaller: "All",
      lead_source: "All",
    },
  );

  const handleOpenFilterPopover = (e) => {
    setTempFilters(selectedFilters);
    setFilterAnchor(e.currentTarget);
  };

  const handleApplyFilters = () => {
    setSelectedFilters(tempFilters);
    setFilterAnchor(null);
  };

  const handleResetFilters = () => {
    const resetObj = {
      loss_reason: "All",
      telecaller: "All",
      lead_source: "All",
    };
    setTempFilters(resetObj);
    setSelectedFilters(resetObj);
    setFilterAnchor(null);
  };

  const parseOptionsArray = (raw) => {
    if (!raw) return [];
    let arr = [];
    if (Array.isArray(raw)) {
      arr = raw;
    } else if (typeof raw === "object") {
      const found = Object.values(raw).find((v) => Array.isArray(v));
      if (found) arr = found;
    }
    if (!arr || arr.length === 0) return [];
    const parsed = arr
      .map((item) => {
        if (item === null || item === undefined) return null;
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (typeof item === "object") {
          return item.label || item.name || item.value || item.id || "";
        }
        return String(item);
      })
      .filter(Boolean);
    return Array.from(new Set(parsed));
  };

  // 1. Loss Reason Options
  const lossReasonOptions = useMemo(() => {
    return parseOptionsArray(apiDropdowns?.loss_reasons || apiDropdowns?.reasons);
  }, [apiDropdowns]);

  // 2. Telecaller Options
  const telecallerOptions = useMemo(() => {
    return parseOptionsArray(apiDropdowns?.telecallers);
  }, [apiDropdowns]);

  // 3. Lead Source Options
  const leadSourceOptions = useMemo(() => {
    return parseOptionsArray(apiDropdowns?.lead_sources || apiDropdowns?.sources);
  }, [apiDropdowns]);

  const isFilterActive = useMemo(() => {
    return Object.values(selectedFilters || {}).some((val) => val !== "All");
  }, [selectedFilters]);

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
          mt: 3,
        }}
      >
        {/* LEFT: Search bar */}
        <Box
          sx={{
            position: "relative",
            minWidth: { xs: "100%", md: "350px" },
            flex: 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9E9E9E",
              fontSize: "18px",
              zIndex: 1,
            }}
          >
            <AddOutlinedIcon
              sx={{ transform: "rotate(90deg)", fontSize: "20px", mt: "8px" }}
            />
          </Box>

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
                "& fieldset": { border: "none" },
              },
              "& input::placeholder": {
                color: "#9E9E9E",
                opacity: 1,
                fontSize: "14px",
              },
            }}
          />
        </Box>

        {/* RIGHT: Date Filter, Filter Button, Sort Button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          {/* DATE FILTER DROPDOWN */}
          <DateRangeSelect
            filterType={filterType}
            setFilterType={setFilterType}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />

          {/* FILTER BUTTON */}
          <Button
            startIcon={<FilterListOutlinedIcon />}
            endIcon={<KeyboardArrowDownOutlinedIcon />}
            onClick={handleOpenFilterPopover}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "6px",
              background: isFilterActive ? "#8BC34A" : "#E6E6E6",
              color: isFilterActive ? "#FFF" : "#333",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                background: isFilterActive ? "#79B22F" : "#ECECEC",
              },
            }}
          >
            Filter
          </Button>

          {/* FILTER LEADS POPOVER with width 450px */}
          <Popover
            open={Boolean(filterAnchor)}
            anchorEl={filterAnchor}
            onClose={() => setFilterAnchor(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                borderRadius: "12px",
                boxShadow: "0px 10px 40px rgba(0, 0, 0, 0.12)",
                overflow: "hidden",
                bgcolor: "#fff",
                mt: 0.5,
              },
            }}
          >
            {/* MAIN INNER CONTAINER WITH EXACT WIDTH 450px */}
            <Box
              sx={{
                width: 450,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              {/* HEADER BOX */}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #ECECEC",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Filter Leads
                </Typography>

                <Typography
                  onClick={handleResetFilters}
                  sx={{
                    color: "#8BC34A",
                    cursor: "pointer",
                    fontWeight: 600,
                    userSelect: "none",
                  }}
                >
                  Reset
                </Typography>
              </Box>

              {/* CONTENT GRID PANEL */}
              <Box
                sx={{
                  flex: 1,
                  px: 2.5,
                  py: 1.5,
                  overflow: "hidden",
                }}
              >
                {/* 1. Loss Reason */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "150px 1fr",
                    alignItems: "center",
                    columnGap: 1,
                    mb: 1.1,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: "#333" }}
                  >
                    Loss Reason
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={tempFilters.loss_reason}
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        loss_reason: e.target.value,
                      }))
                    }
                    slotProps={{
                      select: {
                        IconComponent: KeyboardArrowDownOutlinedIcon,
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 34,
                        fontSize: 14,
                        borderRadius: "6px",
                      },
                      "& .MuiSelect-select": {
                        py: 0.7,
                      },
                      textTransform: "capitalize",
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {lossReasonOptions.map((r, i) => (
                      <MenuItem
                        key={i}
                        value={r}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {r}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* 2. Telecaller / Assigned To */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "150px 1fr",
                    alignItems: "center",
                    columnGap: 1,
                    mb: 1.1,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: "#333" }}
                  >
                    Telecaller
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={tempFilters.telecaller}
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        telecaller: e.target.value,
                      }))
                    }
                    slotProps={{
                      select: {
                        IconComponent: KeyboardArrowDownOutlinedIcon,
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 34,
                        fontSize: 14,
                        borderRadius: "6px",
                      },
                      "& .MuiSelect-select": {
                        py: 0.7,
                      },
                      textTransform: "capitalize",
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {telecallerOptions.map((t, i) => (
                      <MenuItem
                        key={i}
                        value={t}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* 3. Lead Source */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "150px 1fr",
                    alignItems: "center",
                    columnGap: 1,
                    mb: 1.1,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: "#333" }}
                  >
                    Lead Source
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={tempFilters.lead_source}
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        lead_source: e.target.value,
                      }))
                    }
                    slotProps={{
                      select: {
                        IconComponent: KeyboardArrowDownOutlinedIcon,
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 34,
                        fontSize: 14,
                        borderRadius: "6px",
                      },
                      "& .MuiSelect-select": {
                        py: 0.7,
                      },
                      textTransform: "capitalize",
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {leadSourceOptions.map((src, i) => (
                      <MenuItem
                        key={i}
                        value={src}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {src}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>

              {/* FOOTER BUTTONS */}
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  gap: 1.5,
                  borderTop: "1px solid #ECECEC",
                }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{
                    height: 36,
                    textTransform: "none",
                  }}
                >
                  Reset Filters
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleApplyFilters}
                  sx={{
                    height: 36,
                    background: "#8BC34A",
                    textTransform: "none",
                    "&:hover": {
                      background: "#79B22F",
                    },
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </Box>
          </Popover>

          {/* SORT BY BUTTON */}
          <Button
            startIcon={<ImportExportOutlinedIcon />}
            endIcon={<KeyboardArrowDownOutlinedIcon />}
            onClick={(e) => setSortAnchor(e.currentTarget)}
            sx={{
              height: "36px",
              px: 2,
              borderRadius: "6px",
              background: sortType === "oldest" ? "#8BC34A" : "#E6E6E6",
              color: sortType === "oldest" ? "#FFF" : "#333",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 400,
              "&:hover": {
                background: sortType === "oldest" ? "#79B22F" : "#ECECEC",
              },
            }}
          >
            {sortType === "oldest" ? "Oldest First" : "Sort by"}
          </Button>

          <Menu
            anchorEl={sortAnchor}
            open={Boolean(sortAnchor)}
            onClose={() => setSortAnchor(null)}
            PaperProps={{
              sx: {
                width: 160,
                borderRadius: "8px",
                boxShadow: "0px 4px 20px rgba(0,0,0,0.12)",
                mt: 0.5,
              },
            }}
          >
            <MenuItem
              selected={sortType === "newest"}
              onClick={() => {
                setSortType("newest");
                setSortAnchor(null);
              }}
              sx={{
                fontSize: "14px",
                "&.Mui-selected": {
                  backgroundColor: "#8BC34A !important",
                  color: "#FFF",
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
                fontSize: "14px",
                "&.Mui-selected": {
                  backgroundColor: "#8BC34A !important",
                  color: "#FFF",
                },
              }}
            >
              Oldest First
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </>
  );
};

export default LossLeadApprovalFilter;
