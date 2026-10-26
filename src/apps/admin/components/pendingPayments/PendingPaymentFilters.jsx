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
import { fetchPendingPaymentFilterDropdowns } from "@/apps/admin/services/pendingPaymentAdminService";

const extractOptions = (list) => {
    if (!Array.isArray(list)) return [];
    const set = new Set();
    list.forEach((item) => {
        if (typeof item === "string" && item.trim()) {
            if (item.trim().toLowerCase() !== "all") set.add(item.trim());
        } else if (item && typeof item === "object") {
            const val = item.label || item.name || item.course_name || item.course_plan || item.course_time || item.payment_stage || item.amount_stage || item.value;
            if (val && String(val).trim() && String(val).trim().toLowerCase() !== "all") {
                set.add(String(val).trim());
            }
        }
    });
    return Array.from(set);
};

const PendingPaymentFilters = ({
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
    selectedPipeline,
}) => {
    // Popover Anchor states
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [sortAnchor, setSortAnchor] = useState(null);

    const [apiDropdowns, setApiDropdowns] = useState(null);

    useEffect(() => {
        if (Boolean(filterAnchor)) {
            fetchPendingPaymentFilterDropdowns(selectedPipeline)
                .then(res => {
                    const data = res?.data || res || null;
                    if (data) setApiDropdowns(data);
                })
                .catch(err => {
                    console.error("Pending Payment Filter dropdowns API error:", err);
                });
        }
    }, [filterAnchor, selectedPipeline]);

    // Temp filters for Popover form draft state
    const [tempFilters, setTempFilters] = useState(selectedFilters || {
        course_name: "All",
        course_plan: "All",
        course_time: "All",
        payment_stage: "All",
        pending_amount: "All"
    });

    useEffect(() => {
        if (selectedFilters) {
            setTempFilters(selectedFilters);
        }
    }, [selectedFilters]);

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
            course_name: "All",
            course_plan: "All",
            course_time: "All",
            payment_stage: "All",
            pending_amount: "All"
        };
        setTempFilters(resetObj);
        setSelectedFilters(resetObj);
        setFilterAnchor(null);
    };

    // Extract dynamic options strictly from API response
    const courseOptions = useMemo(() => extractOptions(apiDropdowns?.courses), [apiDropdowns]);
    const planOptions = useMemo(() => extractOptions(apiDropdowns?.course_plans), [apiDropdowns]);
    const timeOptions = useMemo(() => extractOptions(apiDropdowns?.course_times), [apiDropdowns]);
    const stageOptions = useMemo(() => extractOptions(apiDropdowns?.payment_stages), [apiDropdowns]);
    const amountOptions = useMemo(() => extractOptions(apiDropdowns?.pending_amounts), [apiDropdowns]);

    const isFilterActive = useMemo(() => {
        return Object.values(selectedFilters || {}).some(val => val && val !== "All");
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
              placeholder="Search by name, phone, course......"
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
            <DateRangeSelect
              filterType={filterType || "today"}
              setFilterType={setFilterType}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
              defaultType="today"
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
                  {/* Course Name */}
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
                      Course Name
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={tempFilters.course_name || "All"}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          course_name: e.target.value,
                        }))
                      }
                      SelectProps={{
                        IconComponent: KeyboardArrowDownOutlinedIcon,
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
                      {courseOptions.map((c, i) => (
                        <MenuItem
                          key={i}
                          value={c}
                          sx={{ textTransform: "capitalize" }}
                        >
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Course Plan */}
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
                      Course Plan
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={tempFilters.course_plan || "All"}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          course_plan: e.target.value,
                        }))
                      }
                      SelectProps={{
                        IconComponent: KeyboardArrowDownOutlinedIcon,
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
                      {planOptions.map((p, i) => (
                        <MenuItem
                          key={i}
                          value={p}
                          sx={{ textTransform: "capitalize" }}
                        >
                          {p}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Course Time */}
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
                      Course Time
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={tempFilters.course_time || "All"}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          course_time: e.target.value,
                        }))
                      }
                      SelectProps={{
                        IconComponent: KeyboardArrowDownOutlinedIcon,
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
                      {timeOptions.map((t, i) => (
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

                  {/* Payment Stage */}
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
                      Payment Stage
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={tempFilters.payment_stage || "All"}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          payment_stage: e.target.value,
                        }))
                      }
                      SelectProps={{
                        IconComponent: KeyboardArrowDownOutlinedIcon,
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
                      {stageOptions.map((s, i) => (
                        <MenuItem
                          key={i}
                          value={s}
                          sx={{ textTransform: "capitalize" }}
                        >
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Pending Amount */}
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
                      Pending Amount
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={tempFilters.pending_amount || "All"}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          pending_amount: e.target.value,
                        }))
                      }
                      SelectProps={{
                        IconComponent: KeyboardArrowDownOutlinedIcon,
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
                      {amountOptions.map((amt, i) => (
                        <MenuItem key={i} value={amt}>
                          {amt}
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
                    onClick={() => setFilterAnchor(null)}
                    sx={{
                      height: 36,
                      textTransform: "none",
                    }}
                  >
                    Cancel
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

export default PendingPaymentFilters;
