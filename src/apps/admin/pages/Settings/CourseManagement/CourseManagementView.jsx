import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  Menu,
  LinearProgress,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from "@mui/icons-material/School";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import useDebounce from "@/shared/hooks/useDebounce";

import {
  fetchCoursesSidebarAdmin,
  fetchCourseDetailsAdmin,
  createCourseAdmin,
  editCourseAdmin,
  deleteCourseAdmin,
  createCoursePlanAdmin,
  editPlanAdmin,
  deleteCoursePlanAdmin,
  createBatchAdmin,
  editCourseBatchAdmin,
  deleteCourseBatchAdmin,
} from "@/apps/admin/services/courseManagementService";

// Design Token Constants
const PRIMARY_TEXT = "#0F172A";
const SECONDARY_TEXT = "#64748B";
const BORDER_COLOR = "#E2E8F0";
const INPUT_BG = "#F8FAFC";
const ACCENT_GREEN = "#84CC16";
const LIME = "#90D916";
const PRIMARY_BLUE_BG = "#0000D8";
const RED_BTN = "#D32F2F";
const FONT = "Inter, sans-serif";

const customInputStyle = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#F3F4F6",
    borderRadius: "8px",
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "1px solid #84CC16 !important",
    },
    "&.Mui-error .MuiOutlinedInput-notchedOutline": {
      border: "1px solid #EF4444 !important",
    },
  },
  "& .MuiInputBase-input": { padding: "10px 14px", fontSize: "14px" },
  "& .MuiSelect-select": { padding: "10px 14px", fontSize: "14px" },
  "& .MuiFormHelperText-root": {
    marginLeft: "4px",
    marginTop: "4px",
    fontSize: "12px",
    color: "#EF4444",
  },
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  mb: 0.5,
};

const dialogPaperProps = {
  sx: { borderRadius: "16px", padding: "12px 8px" },
};

const cancelBtnSx = {
  borderColor: "#84CC16",
  color: "#84CC16",
  textTransform: "none",
  borderRadius: "8px",
  px: 3,
  fontWeight: 600,
  fontSize: "14px",
  "&:hover": { borderColor: "#65A30D", backgroundColor: "#F7FEE7" },
};

const saveBtnSx = {
  backgroundColor: "#84CC16",
  color: "#FFF",
  textTransform: "none",
  borderRadius: "8px",
  px: 3,
  fontWeight: 600,
  fontSize: "14px",
  boxShadow: "none",
  "&:hover": { backgroundColor: "#65A30D" },
};

const tableHeadCellSx = {
  fontSize: "14px",
  fontWeight: 600,
  color: SECONDARY_TEXT,
  fontFamily: FONT,
  py: 1.4,
};

function DialogHeader({ title, subtitle, onClose }) {
  return (
    <DialogTitle
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        pb: 1,
      }}
    >
      <Box>
        <Typography
          sx={{ fontSize: "20px", fontWeight: 700, color: ACCENT_GREEN }}
        >
          {title}
        </Typography>
        <Typography sx={{ fontSize: "13px", color: "#6B7280", mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>
      <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>
  );
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography
        sx={{
          color: SECONDARY_TEXT,
          fontWeight: 400,
          fontSize: "14px",
          fontFamily: FONT,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: PRIMARY_TEXT,
          fontWeight: 600,
          fontSize: "14px",
          fontFamily: FONT,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function CourseManagementView() {
  // Sidebar Courses List
  const [sidebarCourses, setSidebarCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [searchSidebar, setSearchSidebar] = useState("");
  const debouncedSearch = useDebounce(searchSidebar, 400);

  // Active Selected Course Details
  const [courseDetails, setCourseDetails] = useState(null);

  // Loading & Popup Toast States
  const [loadingSidebar, setLoadingSidebar] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = (event, reason) => {
    if (reason === "clickaway") return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  // Options Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeMenuType, setActiveMenuType] = useState(null); // 'plan' | 'timing'
  const [selectedItem, setSelectedItem] = useState(null);

  // Modals Open State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'course' | 'plan' | 'timing'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteModalError, setDeleteModalError] = useState("");

  // Form Mode & Tracking
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingBatchId, setEditingBatchId] = useState(null);

  // Form State: Course
  const [courseName, setCourseName] = useState("");
  const [courseStatus, setCourseStatus] = useState("");
  const [courseModalError, setCourseModalError] = useState("");
  const [courseNameError, setCourseNameError] = useState(false);
  const [courseStatusError, setCourseStatusError] = useState(false);

  // Form State: Plan
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planHours, setPlanHours] = useState("");
  const [planModalError, setPlanModalError] = useState("");
  const [planNameError, setPlanNameError] = useState(false);
  const [planPriceError, setPlanPriceError] = useState(false);
  const [planDurationError, setPlanDurationError] = useState(false);
  const [planHoursError, setPlanHoursError] = useState(false);

  // Form State: Timing / Batch
  const [batchName, setBatchName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [timingTime, setTimingTime] = useState("");
  const [timingTrainer, setTimingTrainer] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [startDate, setStartDate] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [timingModalError, setTimingModalError] = useState("");
  const [batchNameError, setBatchNameError] = useState(false);
  const [selectedPlanIdError, setSelectedPlanIdError] = useState(false);
  const [timingTimeError, setTimingTimeError] = useState(false);
  const [totalSeatsError, setTotalSeatsError] = useState(false);
  const [startDateError, setStartDateError] = useState(false);
  const [closingDateError, setClosingDateError] = useState(false);

  // ---------------------------------------------------------------------
  // API 1: Fetch Courses Sidebar
  // ---------------------------------------------------------------------
  const loadSidebarCourses = useCallback(async () => {
    try {
      setLoadingSidebar(true);
      const response = await fetchCoursesSidebarAdmin(debouncedSearch);
      const list = response?.data?.data || [];
      setSidebarCourses(list);

      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(list[0].id);
      }
    } catch (err) {
      console.error("Error fetching sidebar courses:", err);
      showToast(err.response?.data?.detail || err.response?.data?.message || "Failed to fetch courses.", "error");
    } finally {
      setLoadingSidebar(false);
    }
  }, [debouncedSearch, selectedCourseId]);

  // ---------------------------------------------------------------------
  // API 2: Fetch Course Details
  // ---------------------------------------------------------------------
  const loadCourseDetails = useCallback(async (courseId) => {
    if (!courseId) return;
    try {
      setLoadingDetails(true);
      const response = await fetchCourseDetailsAdmin(courseId);
      const data = response.data.data;
      setCourseDetails(data);
    } catch (err) {
      console.error("Error fetching course details:", err);
      showToast(err.response?.data?.detail || err.response?.data?.message || "Failed to fetch course details.", "error");
      setCourseDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadSidebarCourses();
  }, [loadSidebarCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseDetails(selectedCourseId);
    }
  }, [selectedCourseId, loadCourseDetails]);

  // ---------------------------------------------------------------------
  // Menu Handlers
  // ---------------------------------------------------------------------
  const handleMenuOpen = (event, type, item) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveMenuType(type);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveMenuType(null);
    setSelectedItem(null);
  };

  // ---------------------------------------------------------------------
  // Course CRUD Handlers (API 3, 4, 5)
  // ---------------------------------------------------------------------
  const handleOpenCreateCourse = () => {
    setIsEditMode(false);
    setCourseName("");
    setCourseStatus("Active");
    setCourseModalError("");
    setCourseNameError(false);
    setCourseStatusError(false);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = () => {
    if (!courseDetails) return;
    setIsEditMode(true);
    setCourseName(courseDetails.name || "");
    setCourseStatus(courseDetails.status || "Active");
    setCourseModalError("");
    setCourseNameError(false);
    setCourseStatusError(false);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async () => {
    let hasError = false;
    if (!courseName || !courseName.trim()) {
      setCourseNameError(true);
      hasError = true;
    } else {
      setCourseNameError(false);
    }

    if (!courseStatus || !courseStatus.trim()) {
      setCourseStatusError(true);
      hasError = true;
    } else {
      setCourseStatusError(false);
    }

    if (hasError) {
      setCourseModalError("Please fill out all mandatory fields.");
      return;
    }

    setCourseModalError("");

    try {
      setActionLoading(true);
      let res;
      if (isEditMode) {
        // API 4: Edit Course
        res = await editCourseAdmin({
          course_id: selectedCourseId,
          name: courseName.trim(),
          status: courseStatus,
        });
      } else {
        // API 3: Create Course
        res = await createCourseAdmin({
          name: courseName.trim(),
          status: courseStatus,
        });
        const createdId = res.data.data.id;
        setSelectedCourseId(createdId);
      }
      setIsCourseModalOpen(false);
      const msg = res.data?.message || (isEditMode ? "Course updated successfully!" : "Course created successfully!");
      showToast(msg, "success");
      await loadSidebarCourses();
      if (selectedCourseId) await loadCourseDetails(selectedCourseId);
    } catch (err) {
      console.error("Error saving course:", err);
      setCourseModalError(err.response?.data?.detail || err.response?.data?.message || "Failed to save course.");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // Plan CRUD Handlers (API 6, 7, 8)
  // ---------------------------------------------------------------------
  const handleOpenCreatePlan = () => {
    setEditingPlanId(null);
    setPlanName("");
    setPlanPrice("");
    setPlanDuration("");
    setPlanHours("");
    setPlanModalError("");
    setPlanNameError(false);
    setPlanPriceError(false);
    setPlanDurationError(false);
    setPlanHoursError(false);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name || "");
    setPlanPrice(plan.price || "");
    setPlanDuration(plan.duration || "");
    setPlanHours(plan.hours_per_day || "");
    setPlanModalError("");
    setPlanNameError(false);
    setPlanPriceError(false);
    setPlanDurationError(false);
    setPlanHoursError(false);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    let hasError = false;

    if (!planName || !planName.trim()) {
      setPlanNameError(true);
      hasError = true;
    } else {
      setPlanNameError(false);
    }

    if (!planPrice || !String(planPrice).trim()) {
      setPlanPriceError(true);
      hasError = true;
    } else {
      setPlanPriceError(false);
    }

    if (!planDuration || !String(planDuration).trim()) {
      setPlanDurationError(true);
      hasError = true;
    } else {
      setPlanDurationError(false);
    }

    if (!planHours || !String(planHours).trim()) {
      setPlanHoursError(true);
      hasError = true;
    } else {
      setPlanHoursError(false);
    }

    if (hasError) {
      setPlanModalError("Please fill out all mandatory fields.");
      return;
    }

    setPlanModalError("");

    try {
      setActionLoading(true);
      let res;
      if (editingPlanId) {
        // API 7: Edit Plan
        res = await editPlanAdmin({
          plan_id: editingPlanId,
          name: planName.trim(),
          price: planPrice.trim(),
          duration: planDuration.trim(),
          hours_per_day: planHours.trim(),
        });
      } else {
        // API 6: Create Course Plan
        res = await createCoursePlanAdmin({
          course_id: selectedCourseId,
          name: planName.trim(),
          price: planPrice.trim(),
          duration: planDuration.trim(),
          hours_per_day: planHours.trim(),
        });
      }
      setIsPlanModalOpen(false);
      const msg = res.data?.message || (editingPlanId ? "Plan updated successfully!" : "Plan created successfully!");
      showToast(msg, "success");
      await loadCourseDetails(selectedCourseId);
    } catch (err) {
      console.error("Error saving plan:", err);
      setPlanModalError(err.response?.data?.detail || err.response?.data?.message || "Failed to save plan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // Batch / Timing CRUD Handlers (API 9, 10, 11)
  // ---------------------------------------------------------------------
  const handleOpenCreateTiming = () => {
    setEditingBatchId(null);
    setBatchName("");
    setSelectedPlanId(courseDetails?.plans?.[0]?.id || "");
    setTimingTime("");
    setTimingTrainer("");
    setTotalSeats("");
    setStartDate("");
    setClosingDate("");
    setTimingModalError("");
    setBatchNameError(false);
    setSelectedPlanIdError(false);
    setTimingTimeError(false);
    setTotalSeatsError(false);
    setStartDateError(false);
    setClosingDateError(false);
    setIsTimingModalOpen(true);
  };

  const handleOpenEditTiming = (batch) => {
    setEditingBatchId(batch.id);
    setBatchName(batch.name || "");
    setSelectedPlanId(batch.plan || "");
    setTimingTime(batch.time || "");
    setTimingTrainer(batch.trainer || "");
    setTotalSeats(batch.total_seats ?? "");
    setStartDate(batch.start_date || "");
    setClosingDate(batch.closing_date || "");
    setTimingModalError("");
    setBatchNameError(false);
    setSelectedPlanIdError(false);
    setTimingTimeError(false);
    setTotalSeatsError(false);
    setStartDateError(false);
    setClosingDateError(false);
    setIsTimingModalOpen(true);
  };

  const handleSaveTiming = async () => {
    let hasError = false;

    if (!batchName || !batchName.trim()) {
      setBatchNameError(true);
      hasError = true;
    } else {
      setBatchNameError(false);
    }

    if (!selectedPlanId) {
      setSelectedPlanIdError(true);
      hasError = true;
    } else {
      setSelectedPlanIdError(false);
    }

    if (!timingTime || !timingTime.trim()) {
      setTimingTimeError(true);
      hasError = true;
    } else {
      setTimingTimeError(false);
    }

    if (totalSeats === "" || totalSeats === null || totalSeats === undefined || isNaN(Number(totalSeats))) {
      setTotalSeatsError(true);
      hasError = true;
    } else {
      setTotalSeatsError(false);
    }

    if (!startDate) {
      setStartDateError(true);
      hasError = true;
    } else {
      setStartDateError(false);
    }

    if (!closingDate) {
      setClosingDateError(true);
      hasError = true;
    } else {
      setClosingDateError(false);
    }

    if (hasError) {
      setTimingModalError("Please fill out all mandatory fields.");
      return;
    }

    setTimingModalError("");

    try {
      setActionLoading(true);
      let res;
      if (editingBatchId) {
        // API 10: Edit Course Batch
        res = await editCourseBatchAdmin({
          batch_id: editingBatchId,
          name: batchName.trim(),
          plan: selectedPlanId,
          time: timingTime.trim(),
          trainer: timingTrainer.trim(),
          total_seats: Number(totalSeats),
          start_date: startDate,
          closing_date: closingDate,
        });
      } else {
        // API 9: Create Batch
        res = await createBatchAdmin({
          course_id: selectedCourseId,
          plan: selectedPlanId,
          name: batchName.trim(),
          time: timingTime.trim(),
          trainer: timingTrainer.trim(),
          total_seats: Number(totalSeats),
          start_date: startDate,
          closing_date: closingDate,
        });
      }
      setIsTimingModalOpen(false);
      const msg = res.data?.message || (editingBatchId ? "Batch updated successfully!" : "Batch timing created successfully!");
      showToast(msg, "success");
      await loadCourseDetails(selectedCourseId);
      await loadSidebarCourses();
    } catch (err) {
      console.error("Error saving batch:", err);
      setTimingModalError(err.response?.data?.detail || err.response?.data?.message || "Failed to save batch timing.");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // Confirmation Dialog Handlers for Delete (Course, Plan, Timing)
  // ---------------------------------------------------------------------
  const handleOpenDeleteCourseConfirm = () => {
    if (!selectedCourseId || !courseDetails) return;
    setDeleteType("course");
    setItemToDelete(courseDetails);
    setDeleteModalError("");
    setIsDeleteConfirmOpen(true);
  };

  const handleEditItem = () => {
    const item = selectedItem;
    const type = activeMenuType;
    handleMenuClose();
    if (!item) return;
    if (type === "plan") handleOpenEditPlan(item);
    else if (type === "timing") handleOpenEditTiming(item);
  };

  const handleDeleteItemClick = () => {
    const item = selectedItem;
    const type = activeMenuType;
    handleMenuClose();
    if (!item) return;
    setDeleteType(type); // 'plan' | 'timing'
    setItemToDelete(item);
    setDeleteModalError("");
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setActionLoading(true);
      setDeleteModalError("");
      let res;

      if (deleteType === "course") {
        // API 5: Delete Course
        res = await deleteCourseAdmin(selectedCourseId);
        setSelectedCourseId(null);
        setCourseDetails(null);
        await loadSidebarCourses();
      } else if (deleteType === "plan") {
        // API 8: Delete Course Plan
        res = await deleteCoursePlanAdmin(itemToDelete.id, selectedCourseId);
        await loadCourseDetails(selectedCourseId);
        await loadSidebarCourses();
      } else if (deleteType === "timing") {
        // API 11: Delete Course Batch
        res = await deleteCourseBatchAdmin(itemToDelete.id);
        await loadCourseDetails(selectedCourseId);
        await loadSidebarCourses();
      }

      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
      const msg = res?.data?.message || "Deleted successfully!";
      showToast(msg, "success");
    } catch (err) {
      console.error("Error during deletion:", err);
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to delete item.";
      setDeleteModalError(msg);
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getDeleteModalText = () => {
    if (deleteType === "course") {
      return `Are you sure, you want to delete the course "${itemToDelete?.name || ""}"? This will delete all associated plans and batches.`;
    }
    if (deleteType === "plan") {
      return `Are you sure, you want to delete the plan "${itemToDelete?.name || ""}"?`;
    }
    if (deleteType === "timing") {
      return `Are you sure, you want to delete the batch timing "${itemToDelete?.name || ""}"?`;
    }
    return "Are you sure, you want to delete this item?";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        border: `1px solid ${BORDER_COLOR}`,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
        fontFamily: FONT,
      }}
    >
      {(loadingSidebar || loadingDetails || actionLoading) && (
        <LinearProgress sx={{ backgroundColor: ACCENT_GREEN }} />
      )}

      {/* FLOATING TOP-CENTER PILL TOAST POPUP */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 1 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            px: 3,
            py: 1.2,
            borderRadius: "50px",
            border:
              toast.severity === "error"
                ? "1.5px solid #EF4444"
                : "1.5px solid #84CC16",
            boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
            fontFamily: FONT,
          }}
        >
          {toast.severity === "error" ? (
            <ErrorIcon sx={{ color: "#EF4444", fontSize: 22 }} />
          ) : (
            <CheckCircleIcon sx={{ color: "#84CC16", fontSize: 22 }} />
          )}
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: "14px",
              fontWeight: 500,
              color: "#0F172A",
            }}
          >
            {toast.message}
          </Typography>
        </Box>
      </Snackbar>

      {/* TOP BAR BREADCRUMB & HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderBottom: `1px solid ${BORDER_COLOR}`,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SchoolIcon sx={{ color: SECONDARY_TEXT, fontSize: 20 }} />
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 500,
              color: SECONDARY_TEXT,
              fontFamily: FONT,
            }}
          >
            Courses
          </Typography>
          <ChevronRightIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
          <Typography
            sx={{
              fontSize: "14.5px",
              fontWeight: 700,
              color: LIME,
              fontFamily: FONT,
            }}
          >
            {courseDetails ? courseDetails.name : "Select Course"}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 19 }} />}
          onClick={handleOpenCreateCourse}
          sx={{
            backgroundColor: PRIMARY_BLUE_BG,
            color: "#FFFFFF",
            fontFamily: FONT,
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "8px",
            px: 2.2,
            py: 0.9,
            boxShadow: "none",
            "&:hover": { backgroundColor: "#0000B0", boxShadow: "none" },
          }}
        >
          Create course
        </Button>
      </Box>

      {/* MAIN SPLIT LAYOUT */}
      <Box sx={{ display: "flex", minHeight: "650px" }}>
        {/* LEFT SIDEBAR: COURSE LIST */}
        <Box
          sx={{
            width: "280px",
            minWidth: "280px",
            borderRight: `1px solid ${BORDER_COLOR}`,
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            backgroundColor: "#FFFFFF",
          }}
        >
          <TextField
            fullWidth
            placeholder="Search courses"
            size="small"
            value={searchSidebar}
            onChange={(e) => setSearchSidebar(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: INPUT_BG,
                borderRadius: "8px",
                fontSize: "13.5px",
                fontFamily: FONT,
                "& fieldset": { borderColor: ACCENT_GREEN },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": {
                  borderColor: ACCENT_GREEN,
                  borderWidth: "1.5px",
                },
              },
            }}
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {sidebarCourses.length === 0 && !loadingSidebar ? (
              <Typography sx={{ fontSize: "13px", color: SECONDARY_TEXT, p: 2, textAlign: "center" }}>
                No courses found.
              </Typography>
            ) : (
              sidebarCourses.map((c) => {
                const isSelected = c.id === selectedCourseId;
                return (
                  <Box
                    key={c.id}
                    onClick={() => setSelectedCourseId(c.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: "10px",
                      cursor: "pointer",
                      border: isSelected
                        ? `1.5px solid ${LIME}`
                        : `1px solid ${BORDER_COLOR}`,
                      backgroundColor: "#FFFFFF",
                      boxShadow: isSelected
                        ? "0 2px 5px rgba(0,0,0,0.05)"
                        : "none",
                      transition: "all 0.15s ease",
                      "&:hover": { backgroundColor: INPUT_BG },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        backgroundColor: "#ECFCCB",
                        color: "#3F6212",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        flexShrink: 0,
                      }}
                    >
                      {c.avatar_text}
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: PRIMARY_TEXT,
                          fontFamily: FONT,
                          lineHeight: 1.2,
                        }}
                      >
                        {c.name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: "13px",
                          fontWeight: 400,
                          color: SECONDARY_TEXT,
                          fontFamily: FONT,
                          mt: 0.3,
                        }}
                      >
                        Plan : {c.plan_count ?? 0}, Batch : {c.active_batches ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* RIGHT DETAIL PANEL */}
        {courseDetails ? (
          <Box
            sx={{
              flex: 1,
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 3.5,
            }}
          >
            {/* COURSE HEADER BANNER */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "10px",
                    backgroundColor: "#ECFCCB",
                    color: "#3F6212",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  {courseDetails.avatar_text}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Typography
                    sx={{
                      fontSize: "20px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    {courseDetails.name}
                  </Typography>
                  <Chip
                    label={courseDetails.status}
                    size="small"
                    sx={{
                      fontSize: "12px",
                      fontWeight: 400,
                      fontFamily: FONT,
                      height: "22px",
                      backgroundColor:
                        courseDetails.status === "Active"
                          ? "#DCFCE7"
                          : "#F1F5F9",
                      color:
                        courseDetails.status === "Active"
                          ? "#16A34A"
                          : SECONDARY_TEXT,
                      borderRadius: "6px",
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={handleOpenEditCourse}
                  sx={{
                    color: LIME,
                    borderColor: LIME,
                    backgroundColor: "#FFFFFF",
                    fontFamily: FONT,
                    textTransform: "none",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 1.8,
                    py: 0.7,
                  }}
                >
                  Edit course
                </Button>
                <IconButton
                  size="small"
                  onClick={handleOpenDeleteCourseConfirm}
                  sx={{
                    border: `1px solid ${BORDER_COLOR}`,
                    borderRadius: "8px",
                    p: 0.7,
                    color: "#EF4444",
                    "&:hover": { backgroundColor: "#FEF2F2" },
                  }}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* METRIC SUMMARY STATS CARDS */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
              }}
            >
              {[
                { label: "Plans", value: courseDetails?.stats?.plans ?? 0 },
                { label: "Batches", value: courseDetails?.stats?.batches ?? 0 },
              ].map((stat) => (
                <Paper
                  key={stat.label}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "10px",
                    border: `1px solid ${BORDER_COLOR}`,
                    backgroundColor: INPUT_BG,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#4D4D4D",
                      fontFamily: FONT,
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "black",
                      fontFamily: FONT,
                      mt: 0.5,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* SECTION 1: PLANS AND FEES */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: PRIMARY_TEXT,
                    fontFamily: FONT,
                  }}
                >
                  Plans and fees
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={handleOpenCreatePlan}
                  sx={{
                    color: "#ffffff",
                    borderColor: BORDER_COLOR,
                    backgroundColor: PRIMARY_BLUE_BG,
                    fontFamily: FONT,
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 1.6,
                    py: 0.6,
                    "&:hover": { backgroundColor: "#0000B0" },
                  }}
                >
                  Create plan
                </Button>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                {(courseDetails?.plans || []).map((plan, index) => (
                  <Paper
                    key={plan.plan_id || plan.id || index}
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "12px",
                      border: plan.is_highlighted
                        ? `2px solid ${ACCENT_GREEN}`
                        : `1px solid ${BORDER_COLOR}`,
                      backgroundColor: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.8,
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: LIME,
                          fontFamily: FONT,
                        }}
                      >
                        {plan.name}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, "plan", plan)}
                          sx={{ color: SECONDARY_TEXT, p: 0.3 }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: PRIMARY_TEXT,
                        fontFamily: FONT,
                        lineHeight: 1,
                      }}
                    >
                      {plan.price}
                    </Typography>

                    <Divider sx={{ borderColor: "#F1F5F9" }} />

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {plan.duration && <DetailRow label="Duration" value={plan.duration} />}
                      {plan.hours_per_day && (
                        <DetailRow label="Hours per day" value={plan.hours_per_day} />
                      )}
                      {plan.after_offer && (
                        <DetailRow label="After offer" value={plan.after_offer} />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>

            {/* SECTION 2: BATCH TIMINGS TABLE */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: PRIMARY_TEXT,
                    fontFamily: FONT,
                  }}
                >
                  Batch timings
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={handleOpenCreateTiming}
                  sx={{
                    color: "#FFFFFF",
                    borderColor: BORDER_COLOR,
                    backgroundColor: PRIMARY_BLUE_BG,
                    fontFamily: FONT,
                    textTransform: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 1.6,
                    py: 0.6,
                    "&:hover": { backgroundColor: "#0000B0" },
                  }}
                >
                  Create timing
                </Button>
              </Box>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Table>
                  <TableHead sx={{ backgroundColor: INPUT_BG }}>
                    <TableRow>
                      <TableCell sx={tableHeadCellSx}>Batch</TableCell>
                      <TableCell sx={tableHeadCellSx}>Schedule</TableCell>
                      <TableCell sx={tableHeadCellSx}>Seats</TableCell>
                      <TableCell align="right" sx={{ py: 1.4, width: 50 }} />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {(courseDetails?.batches || []).map((batch, index) => {
                      const capacityPercent =
                        batch.total_seats > 0
                          ? ((batch.filled_seats || 0) / batch.total_seats) * 100
                          : 0;
                      const isFullNote = batch.note === "almost full";

                      return (
                        <TableRow
                          key={batch.batch_id || batch.id || index}
                          sx={{ "&:hover": { backgroundColor: INPUT_BG } }}
                        >
                          <TableCell sx={{ py: 1.8 }}>
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: PRIMARY_TEXT,
                                fontFamily: FONT,
                                lineHeight: 1.2,
                              }}
                            >
                              {batch.name}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: SECONDARY_TEXT,
                                fontFamily: FONT,
                                mt: 0.3,
                              }}
                            >
                              {batch.plan_name}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ py: 1.8 }}>
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: PRIMARY_TEXT,
                                fontFamily: FONT,
                                lineHeight: 1.2,
                              }}
                            >
                              {batch.time}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: SECONDARY_TEXT,
                                fontFamily: FONT,
                                mt: 0.3,
                              }}
                            >
                              {batch.trainer}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ py: 1.8, minWidth: 180 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: PRIMARY_TEXT,
                                  fontFamily: FONT,
                                }}
                              >
                                {batch.filled_seats} / {batch.total_seats}
                              </Typography>
                              {batch.note && (
                                <Typography
                                  sx={{
                                    fontSize: "12.5px",
                                    fontWeight: 500,
                                    color: PRIMARY_BLUE_BG,
                                    fontFamily: FONT,
                                  }}
                                >
                                  · {batch.note}
                                </Typography>
                              )}
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={capacityPercent}
                              sx={{
                                height: 5,
                                borderRadius: 3,
                                backgroundColor: "#E2E8F0",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: isFullNote ? PRIMARY_BLUE_BG : ACCENT_GREEN,
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </TableCell>

                          <TableCell align="right" sx={{ py: 1.8 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, "timing", batch)}
                              sx={{ color: SECONDARY_TEXT }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
            {loadingDetails ? (
              <CircularProgress size={30} sx={{ color: ACCENT_GREEN }} />
            ) : (
              <Typography sx={{ color: SECONDARY_TEXT, fontSize: "15px" }}>
                Select a course from the sidebar to view details, or click "Create Course" to add a new course.
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* OPTIONS MENU */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: "8px",
            minWidth: 140,
            border: `1px solid ${BORDER_COLOR}`,
            fontFamily: FONT,
          },
        }}
      >
        <MenuItem
          onClick={handleEditItem}
          sx={{ fontSize: "13.5px", gap: 1, fontFamily: FONT }}
        >
          <EditOutlinedIcon fontSize="small" /> Edit
        </MenuItem>
        <MenuItem
          onClick={handleDeleteItemClick}
          sx={{
            fontSize: "13.5px",
            color: "#EF4444",
            gap: 1,
            fontFamily: FONT,
          }}
        >
          <DeleteOutlinedIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* CONFIRM DELETION MODAL */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        maxWidth={false}
        sx={{
          "& .MuiDialog-paper": {
            width: "380px !important",
            borderRadius: "8px !important",
            backgroundColor: "#FFFFFF !important",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15) !important",
            p: 0,
          },
        }}
      >
        <DialogContent
          sx={{
            padding: "24px !important",
            display: "flex",
            flexDirection: "column",
            gap: "16px !important",
          }}
        >
          {deleteModalError && (
            <Alert
              severity="error"
              onClose={() => setDeleteModalError("")}
              sx={{ borderRadius: "8px", fontSize: "13px" }}
            >
              {deleteModalError}
            </Alert>
          )}
          {/* Header Frame */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <DeleteOutlinedIcon
              sx={{
                color: LIME,
                fontSize: "22px",
              }}
            />
            <Typography
              sx={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                color: LIME,
              }}
            >
              Confirm Deletion
            </Typography>
          </Box>

          {/* Body Text */}
          <Typography
            sx={{
              fontFamily: FONT,
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "21px",
              color: "#4D4D4D",
            }}
          >
            {getDeleteModalText()}
          </Typography>

          {/* Button Group Frame */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "12px",
              mt: 1,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={actionLoading}
              sx={{
                height: "32px",
                borderRadius: "6px",
                border: `1px solid ${LIME}`,
                color: LIME,
                backgroundColor: "#FFFFFF",
                textTransform: "none",
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: "14px",
                px: 2,
                "&:hover": {
                  borderColor: LIME,
                  backgroundColor: "#F7FEE7",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              sx={{
                height: "32px",
                borderRadius: "6px",
                backgroundColor: RED_BTN,
                color: "#FFFFFF",
                textTransform: "none",
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: "14px",
                px: 2.5,
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
                "&:hover": {
                  backgroundColor: "#B71C1C",
                },
              }}
            >
              {actionLoading ? "Deleting..." : "Yes"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT COURSE DIALOG */}
      <Dialog
        open={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogHeader
          title={isEditMode ? "Edit Course" : "Create New Course"}
          subtitle={
            isEditMode
              ? "Update the course details below."
              : "Enter the course details below to add a new course."
          }
          onClose={() => setIsCourseModalOpen(false)}
        />

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}
        >
          {courseModalError && (
            <Alert
              severity="warning"
              onClose={() => setCourseModalError("")}
              sx={{ borderRadius: "8px", fontSize: "13px", py: 0.5 }}
            >
              {courseModalError}
            </Alert>
          )}

          <Box>
            <Typography sx={labelStyle}>Course Name*</Typography>
            <TextField
              fullWidth
              name="courseName"
              placeholder=""
              value={courseName}
              onChange={(e) => {
                setCourseName(e.target.value);
                if (courseNameError) setCourseNameError(false);
                if (courseModalError) setCourseModalError("");
              }}
              error={courseNameError}
              helperText={courseNameError ? "Course Name is required" : ""}
              sx={customInputStyle}
            />
          </Box>

          <Box>
            <Typography sx={labelStyle}>Status*</Typography>
            <TextField
              select
              fullWidth
              name="courseStatus"
              value={courseStatus}
              onChange={(e) => {
                setCourseStatus(e.target.value);
                if (courseStatusError) setCourseStatusError(false);
                if (courseModalError) setCourseModalError("");
              }}
              error={courseStatusError}
              helperText={courseStatusError ? "Status is required" : ""}
              sx={customInputStyle}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{ justifyContent: "flex-end", gap: 1.5, px: 3, pb: 2, pt: 1 }}
        >
          <Button
            onClick={() => setIsCourseModalOpen(false)}
            variant="outlined"
            sx={cancelBtnSx}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveCourse} variant="contained" sx={saveBtnSx} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE / EDIT PLAN DIALOG */}
      <Dialog
        open={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogHeader
          title={editingPlanId ? "Edit Course Plan" : "Create Course Plan"}
          subtitle={
            editingPlanId
              ? "Update the plan details below."
              : "Enter the plan details below to create a course plan."
          }
          onClose={() => setIsPlanModalOpen(false)}
        />

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}
        >
          {planModalError && (
            <Alert
              severity="warning"
              onClose={() => setPlanModalError("")}
              sx={{ borderRadius: "8px", fontSize: "13px", py: 0.5 }}
            >
              {planModalError}
            </Alert>
          )}

          <Box>
            <Typography sx={labelStyle}>Plan Name*</Typography>
            <TextField
              fullWidth
              name="planName"
              placeholder=""
              value={planName}
              onChange={(e) => {
                setPlanName(e.target.value);
                if (planNameError) setPlanNameError(false);
                if (planModalError) setPlanModalError("");
              }}
              error={planNameError}
              helperText={planNameError ? "Plan Name is required" : ""}
              sx={customInputStyle}
            />
          </Box>

          <Box>
            <Typography sx={labelStyle}>Fee Amount*</Typography>
            <TextField
              fullWidth
              name="planPrice"
              placeholder=""
              value={planPrice}
              onChange={(e) => {
                setPlanPrice(e.target.value);
                if (planPriceError) setPlanPriceError(false);
                if (planModalError) setPlanModalError("");
              }}
              error={planPriceError}
              helperText={planPriceError ? "Fee Amount is required" : ""}
              sx={customInputStyle}
            />
          </Box>

          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
          >
            <Box>
              <Typography sx={labelStyle}>Duration in months*</Typography>
              <TextField
                fullWidth
                name="planDuration"
                placeholder=""
                value={planDuration}
                onChange={(e) => {
                  setPlanDuration(e.target.value);
                  if (planDurationError) setPlanDurationError(false);
                  if (planModalError) setPlanModalError("");
                }}
                error={planDurationError}
                helperText={planDurationError ? "Duration is required" : ""}
                sx={customInputStyle}
              />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Hours/Day*</Typography>
              <TextField
                fullWidth
                name="planHours"
                placeholder=""
                value={planHours}
                onChange={(e) => {
                  setPlanHours(e.target.value);
                  if (planHoursError) setPlanHoursError(false);
                  if (planModalError) setPlanModalError("");
                }}
                error={planHoursError}
                helperText={planHoursError ? "Hours/Day is required" : ""}
                sx={customInputStyle}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{ justifyContent: "flex-end", gap: 1.5, px: 3, pb: 2, pt: 1 }}
        >
          <Button
            onClick={() => setIsPlanModalOpen(false)}
            variant="outlined"
            sx={cancelBtnSx}
          >
            Cancel
          </Button>
          <Button onClick={handleSavePlan} variant="contained" sx={saveBtnSx} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE / EDIT TIMING DIALOG */}
      <Dialog
        open={isTimingModalOpen}
        onClose={() => setIsTimingModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogHeader
          title={editingBatchId ? "Edit Batch Timing" : "Create Batch Timing"}
          subtitle={
            editingBatchId
              ? "Update the batch timing details below."
              : "Enter the batch timing details below to add a new timing schedule."
          }
          onClose={() => setIsTimingModalOpen(false)}
        />

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}
        >
          {timingModalError && (
            <Alert
              severity="warning"
              onClose={() => setTimingModalError("")}
              sx={{ borderRadius: "8px", fontSize: "13px", py: 0.5 }}
            >
              {timingModalError}
            </Alert>
          )}

          <Box>
            <Typography sx={labelStyle}>Batch Name*</Typography>
            <TextField
              fullWidth
              name="batchName"
              placeholder=""
              value={batchName}
              onChange={(e) => {
                setBatchName(e.target.value);
                if (batchNameError) setBatchNameError(false);
                if (timingModalError) setTimingModalError("");
              }}
              error={batchNameError}
              helperText={batchNameError ? "Batch Name is required" : ""}
              sx={customInputStyle}
            />
          </Box>

          <Box>
            <Typography sx={labelStyle}>Plan*</Typography>
            <TextField
              select
              fullWidth
              name="selectedPlanId"
              value={selectedPlanId}
              onChange={(e) => {
                setSelectedPlanId(e.target.value);
                if (selectedPlanIdError) setSelectedPlanIdError(false);
                if (timingModalError) setTimingModalError("");
              }}
              error={selectedPlanIdError}
              helperText={selectedPlanIdError ? "Plan is required" : ""}
              sx={customInputStyle}
            >
              {(courseDetails?.plans || []).map((p, index) => (
                <MenuItem key={p.plan_id || p.id || index} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography sx={labelStyle}>Time Slot*</Typography>
            <TextField
              fullWidth
              name="timingTime"
              placeholder=""
              value={timingTime}
              onChange={(e) => {
                setTimingTime(e.target.value);
                if (timingTimeError) setTimingTimeError(false);
                if (timingModalError) setTimingModalError("");
              }}
              error={timingTimeError}
              helperText={timingTimeError ? "Time Slot is required" : ""}
              sx={customInputStyle}
            />
          </Box>

          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
          >
            <Box>
              <Typography sx={labelStyle}>Trainer Name</Typography>
              <TextField
                fullWidth
                name="timingTrainer"
                placeholder=""
                value={timingTrainer}
                onChange={(e) => setTimingTrainer(e.target.value)}
                sx={customInputStyle}
              />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Total Seats*</Typography>
              <TextField
                type="number"
                fullWidth
                name="totalSeats"
                placeholder=""
                value={totalSeats}
                onChange={(e) => {
                  setTotalSeats(e.target.value);
                  if (totalSeatsError) setTotalSeatsError(false);
                  if (timingModalError) setTimingModalError("");
                }}
                error={totalSeatsError}
                helperText={totalSeatsError ? "Total Seats is required" : ""}
                sx={customInputStyle}
              />
            </Box>
          </Box>

          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
          >
            <Box>
              <Typography sx={labelStyle}>Starting Date*</Typography>
              <TextField
                type="date"
                fullWidth
                name="startDate"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (startDateError) setStartDateError(false);
                  if (timingModalError) setTimingModalError("");
                }}
                error={startDateError}
                helperText={startDateError ? "Starting Date is required" : ""}
                sx={customInputStyle}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Closing Date*</Typography>
              <TextField
                type="date"
                fullWidth
                name="closingDate"
                value={closingDate}
                onChange={(e) => {
                  setClosingDate(e.target.value);
                  if (closingDateError) setClosingDateError(false);
                  if (timingModalError) setTimingModalError("");
                }}
                error={closingDateError}
                helperText={closingDateError ? "Closing Date is required" : ""}
                sx={customInputStyle}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{ justifyContent: "flex-end", gap: 1.5, px: 3, pb: 2, pt: 1 }}
        >
          <Button
            onClick={() => setIsTimingModalOpen(false)}
            variant="outlined"
            sx={cancelBtnSx}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveTiming} variant="contained" sx={saveBtnSx} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
