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
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";
import { fetchPendingPaymentFilterDropdowns } from "@/apps/admin/services/pendingPaymentAdminService";

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
    tableData = [],
}) => {
    const [openCalendar, setOpenCalendar] = useState(false);

    const handleApplyCustomRange = (from, to) => {
        if (!from || !to) {
            setFromDate("");
            setToDate("");
            setFilterType("today");
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
            setFilterType(prev => prev === "custom" ? "today" : prev);
        }
    };

    // Popover Anchor states
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [sortAnchor, setSortAnchor] = useState(null);

    const [apiDropdowns, setApiDropdowns] = useState(null);

    useEffect(() => {
        if (Boolean(filterAnchor) && !apiDropdowns) {
            fetchPendingPaymentFilterDropdowns()
                .then(res => {
                    const data = res?.data?.data || res?.data || null;
                    if (data) setApiDropdowns(data);
                })
                .catch(err => {
                    console.log("Filter dropdowns API error, using fallback tableData options:", err);
                });
        }
    }, [filterAnchor, apiDropdowns]);

    // Temp filters for Popover form draft state
    const [tempFilters, setTempFilters] = useState(selectedFilters || {
        course_name: "All",
        course_plan: "All",
        course_time: "All",
        payment_stage: "All",
        pending_amount: "All"
    });

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

    // Extract dynamic courseOptions specifically from API response (or fallback to tableData)
    const courseOptions = useMemo(() => {
        if (apiDropdowns) {
            const rawCourses = 
                apiDropdowns.courses || 
                apiDropdowns.course_names || 
                apiDropdowns.course_name || 
                apiDropdowns.data ||
                (Array.isArray(apiDropdowns) ? apiDropdowns : null);

            if (Array.isArray(rawCourses) && rawCourses.length > 0) {
                const parsed = rawCourses.map(item => {
                    if (typeof item === "string") return item;
                    if (typeof item === "object" && item !== null) {
                        return item.label || item.name || item.course_name || item.course || item.title || item.value || String(item);
                    }
                    return String(item);
                }).filter(Boolean);

                if (parsed.length > 0) return Array.from(new Set(parsed));
            }
        }

        const set = new Set();
        (tableData || []).forEach(row => {
            const val = row.course || row.course_name;
            if (val) set.add(String(val).trim());
        });
        return Array.from(set);
    }, [apiDropdowns, tableData]);

    const planOptions = useMemo(() => {
        if (apiDropdowns) {
            const raw = apiDropdowns.course_plans || apiDropdowns.course_plan || apiDropdowns.plans || apiDropdowns.plan || apiDropdowns.courses;
            if (Array.isArray(raw) && raw.length > 0) {
                return Array.from(new Set(raw.map(item => typeof item === "object" && item !== null ? (item.label || item.name || item.course_plan || item.value || String(item)) : String(item)).filter(Boolean)));
            }
        }
        const set = new Set();
        (tableData || []).forEach(row => {
            const val = row.course_plan;
            if (val) set.add(String(val).trim());
        });
        return Array.from(set);
    }, [apiDropdowns, tableData]);

    const timeOptions = useMemo(() => {
        if (apiDropdowns) {
            const raw = apiDropdowns.course_times || apiDropdowns.course_time || apiDropdowns.timings || apiDropdowns.timing || apiDropdowns.batch_timing;
            if (Array.isArray(raw) && raw.length > 0) {
                return Array.from(new Set(raw.map(item => typeof item === "object" && item !== null ? (item.label || item.name || item.course_time || item.timing || item.value || String(item)) : String(item)).filter(Boolean)));
            }
        }
        const set = new Set();
        (tableData || []).forEach(row => {
            const val = row.batch_timing || row.course_timing;
            if (val) set.add(String(val).trim());
        });
        return Array.from(set);
    }, [apiDropdowns, tableData]);

    const stageOptions = useMemo(() => {
        if (apiDropdowns) {
            const raw = apiDropdowns.payment_stages || apiDropdowns.payment_stage || apiDropdowns.stages || apiDropdowns.statuses || apiDropdowns.payment_statuses;
            if (Array.isArray(raw) && raw.length > 0) {
                return Array.from(new Set(raw.map(item => typeof item === "object" && item !== null ? (item.label || item.name || item.payment_stage || item.value || String(item)) : String(item)).filter(Boolean)));
            }
        }
        const set = new Set();
        (tableData || []).forEach(row => {
            const val = row.status || row.due_status;
            if (val) set.add(String(val).trim());
        });
        return Array.from(set);
    }, [apiDropdowns, tableData]);

    const amountOptions = useMemo(() => {
        if (apiDropdowns) {
            const raw = apiDropdowns.pending_amounts || apiDropdowns.pending_amount || apiDropdowns.amounts || apiDropdowns.amount_stages;
            if (Array.isArray(raw) && raw.length > 0) {
                return Array.from(new Set(raw.map(item => typeof item === "object" && item !== null ? (item.label || item.name || item.pending_amount || item.value || String(item)) : String(item)).filter(Boolean)));
            }
        }
        const set = new Set();
        (tableData || []).forEach(row => {
            const val = row.pending_amount || row.payment_amount;
            if (val !== undefined && val !== null && val !== "") {
                const num = Number(val);
                if (!isNaN(num)) {
                    if (num < 5000) set.add("< 5000");
                    else if (num <= 10000) set.add("5000 - 10000");
                    else set.add("> 10000");
                }
            }
        });
        return Array.from(set);
    }, [apiDropdowns, tableData]);

    const isFilterActive = useMemo(() => {
        return Object.values(selectedFilters || {}).some(val => val !== "All");
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
                sx={{ transform: "rotate(90deg)", fontSize: "20px",mt:"8px" }}
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
                  height: "31px",
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
            {/* DATE FILTER DROPDOWN (Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Custom Date) */}
            <TextField
              select
              size="small"
              value={filterType || "this_month"}
              onChange={(e) => {
                const val = e.target.value;
                setFilterType(val);
                if (val === "custom") {
                  setOpenCalendar(true);
                }
              }}
              SelectProps={{
                IconComponent: KeyboardArrowDownOutlinedIcon,
              }}
              sx={{
                minWidth: "125px",
                "& .MuiOutlinedInput-root": {
                  height: "31px",
                  borderRadius: "6px",
                  background: "#E6E6E6",
                  "& fieldset": { border: "none" },
                  fontSize: "14px",
                },
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="last_7_days">Last 7 Days</MenuItem>
              <MenuItem value="last_30_days">Last 30 Days</MenuItem>
              <MenuItem value="this_month">This Month</MenuItem>
              <MenuItem
                value="custom"
                onClick={() => {
                  setFilterType("custom");
                  setOpenCalendar(true);
                }}
              >
                Custom Date
              </MenuItem>
            </TextField>

            {/* FILTER BUTTON */}
            <Button
              startIcon={<FilterListOutlinedIcon />}
              endIcon={<KeyboardArrowDownOutlinedIcon />}
              onClick={handleOpenFilterPopover}
              sx={{
                height: "31px",
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
                      value={tempFilters.course_name}
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
                      value={tempFilters.course_plan}
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
                      value={tempFilters.course_time}
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
                      value={tempFilters.payment_stage}
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
                      value={tempFilters.pending_amount}
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
                          {amt === "< 5000"
                            ? "Below ₹5,000"
                            : amt === "5000 - 10000"
                              ? "₹5,000 - ₹10,000"
                              : amt === "> 10000"
                                ? "Above ₹10,000"
                                : amt}
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
                height: "31px",
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

        {/* CUSTOM DATE POPUP — shared component matching Leads page */}
        <CustomDateRangePicker
          open={openCalendar}
          onClose={handleCloseCalendar}
          onApply={handleApplyCustomRange}
          initialFrom={fromDate}
          initialTo={toDate}
          accentColor="#8BC34A"
        />
      </>
    );
};

export default PendingPaymentFilters;