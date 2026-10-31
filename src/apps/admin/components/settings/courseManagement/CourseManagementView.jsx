import { toast } from "react-toastify";
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
  
  Tooltip,
  Skeleton,
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
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import useDebounce from "@/shared/hooks/useDebounce";
import { useAuth } from "@/shared/context/AuthContext";

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

const COURSE_PALETTES = [
  {
    bg: "linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%)",
    color: "#3F6212",
    border: "#BEF264",
  },
  {
    bg: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
    color: "#0369A1",
    border: "#7DD3FC",
  },
  {
    bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
    color: "#6D28D9",
    border: "#C4B5FD",
  },
  {
    bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
    color: "#B45309",
    border: "#FCD34D",
  },
  {
    bg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)",
    color: "#BE185D",
    border: "#F9A8D4",
  },
  {
    bg: "linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)",
    color: "#0F766E",
    border: "#5EEAD4",
  },
];

const getCoursePalette = (id = "", name = "") => {
  const str = String(id || name || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return COURSE_PALETTES[Math.abs(hash) % COURSE_PALETTES.length];
};

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
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  mb: 0.6,
  fontFamily: FONT,
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
  color: "#1E293B",
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
          sx={{
            fontSize: "18px",
            fontWeight: 600,
            color: ACCENT_GREEN,
            fontFamily: FONT,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: "13.5px",
            fontWeight: 400,
            color: "#64748B",
            mt: 0.4,
            fontFamily: FONT,
          }}
        >
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

function CourseDetailsSkeleton() {
  return (
    <Box
      sx={{
        flex: 1,
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3.5,
      }}
    >
      {/* HEADER BANNER SKELETON */}
      <Paper
        elevation={0}
        sx={{
          p: 2.4,
          borderRadius: "14px",
          border: `1px solid ${BORDER_COLOR}`,
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton
            variant="rounded"
            width={52}
            height={52}
            sx={{ borderRadius: "12px" }}
          />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Skeleton variant="text" width={200} height={30} />
              <Skeleton
                variant="rounded"
                width={65}
                height={24}
                sx={{ borderRadius: "20px" }}
              />
            </Box>
            <Skeleton variant="text" width={260} height={18} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Skeleton
            variant="rounded"
            width={85}
            height={36}
            sx={{ borderRadius: "10px" }}
          />
          <Skeleton
            variant="rounded"
            width={85}
            height={36}
            sx={{ borderRadius: "10px" }}
          />
        </Box>
      </Paper>

      {/* METRIC CARDS SKELETON */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2.2,
        }}
      >
        {[1, 2].map((k) => (
          <Paper
            key={k}
            elevation={0}
            sx={{
              p: 2.4,
              borderRadius: "14px",
              border: `1px solid ${BORDER_COLOR}`,
              backgroundColor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ width: "60%" }}>
              <Skeleton variant="text" width="50%" height={16} />
              <Skeleton
                variant="text"
                width="40%"
                height={36}
                sx={{ mt: 0.5 }}
              />
              <Skeleton
                variant="text"
                width="75%"
                height={16}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Skeleton
              variant="rounded"
              width={50}
              height={50}
              sx={{ borderRadius: "12px" }}
            />
          </Paper>
        ))}
      </Box>

      {/* PLANS SKELETON */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Skeleton variant="text" width={140} height={26} />
          <Skeleton
            variant="rounded"
            width={115}
            height={36}
            sx={{ borderRadius: "8px" }}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2.2,
          }}
        >
          {[1, 2, 3].map((k) => (
            <Paper
              key={k}
              elevation={0}
              sx={{
                p: 2.4,
                borderRadius: "14px",
                border: `1px solid ${BORDER_COLOR}`,
                backgroundColor: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: 1.8,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={24}
                  sx={{ borderRadius: "6px" }}
                />
                <Skeleton variant="circular" width={22} height={22} />
              </Box>
              <Skeleton variant="text" width={110} height={32} />
              <Divider sx={{ borderColor: "#F1F5F9" }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Skeleton variant="text" width="100%" height={18} />
                <Skeleton variant="text" width="85%" height={18} />
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* BATCH TIMINGS TABLE SKELETON */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Skeleton variant="text" width={140} height={26} />
          <Skeleton
            variant="rounded"
            width={125}
            height={36}
            sx={{ borderRadius: "8px" }}
          />
        </Box>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: "14px",
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ py: 1.6 }}>
                  <Skeleton variant="text" width={60} height={16} />
                </TableCell>
                <TableCell sx={{ py: 1.6 }}>
                  <Skeleton variant="text" width={120} height={16} />
                </TableCell>
                <TableCell sx={{ py: 1.6 }}>
                  <Skeleton variant="text" width={90} height={16} />
                </TableCell>
                <TableCell align="right" sx={{ py: 1.6, width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3].map((k) => (
                <TableRow key={k}>
                  <TableCell sx={{ py: 2 }}>
                    <Skeleton variant="text" width={100} height={20} />
                    <Skeleton
                      variant="rounded"
                      width={60}
                      height={18}
                      sx={{ borderRadius: "5px", mt: 0.5 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton
                      variant="text"
                      width={95}
                      height={16}
                      sx={{ mt: 0.5 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Skeleton
                      variant="text"
                      width={90}
                      height={18}
                      sx={{ mb: 0.8 }}
                    />
                    <Skeleton
                      variant="rounded"
                      width="100%"
                      height={6}
                      sx={{ borderRadius: 3 }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <Skeleton variant="circular" width={22} height={22} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

export default function CourseManagementView() {
  const { hasPermission } = useAuth();
  const canCreateCourse = hasPermission("api_create_courses");
  const canEditCourse = hasPermission("api_edit_courses");
  const canDeleteCourse = hasPermission("api_delete_course_admin");
  const canCreatePlan = hasPermission("api_create_course_plan_admin");
  const canEditPlan = hasPermission("api_edit_plans");
  const canDeletePlan = hasPermission("api_delete_course_plan_admin");
  const canCreateBatch = hasPermission("api_create_batches");
  const canEditBatch = hasPermission("api_edit_course_batch_admin");
  const canDeleteBatch = hasPermission("api_delete_course_batch_admin");

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
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => { if (severity === "error") toast.error(message); else if (severity === "warning") toast.warning(message); else toast.success(message); };

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
  const [editingCourseId, setEditingCourseId] = useState(null);
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
    } catch (err) {
      console.error("Error fetching sidebar courses:", err);
      showToast(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch courses.",
        "error",
      );
    } finally {
      setLoadingSidebar(false);
    }
  }, [debouncedSearch]);

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
      showToast(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch course details.",
        "error",
      );
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
    } else {
      setCourseDetails(null);
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
    setEditingCourseId(null);
    setCourseName("");
    setCourseStatus("Active");
    setCourseModalError("");
    setCourseNameError(false);
    setCourseStatusError(false);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course) => {
    const target = course || courseDetails;
    if (!target) return;
    setIsEditMode(true);
    setEditingCourseId(target.id);
    setSelectedCourseId(target.id);
    setCourseName(target.name || "");
    setCourseStatus(target.status || "Active");
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
        const targetId = editingCourseId || selectedCourseId;
        res = await editCourseAdmin({
          course_id: targetId,
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
      const msg =
        res.data?.message ||
        (isEditMode
          ? "Course updated successfully!"
          : "Course created successfully!");
      showToast(msg, "success");
      await loadSidebarCourses();
      const idToReload = isEditMode
        ? editingCourseId || selectedCourseId
        : null;
      if (idToReload && idToReload === selectedCourseId) {
        await loadCourseDetails(selectedCourseId);
      }
    } catch (err) {
      console.error("Error saving course:", err);
      setCourseModalError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to save course.",
      );
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
      const msg =
        res.data?.message ||
        (editingPlanId
          ? "Plan updated successfully!"
          : "Plan created successfully!");
      showToast(msg, "success");
      await loadCourseDetails(selectedCourseId);
    } catch (err) {
      console.error("Error saving plan:", err);
      setPlanModalError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to save plan.",
      );
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

    if (
      totalSeats === "" ||
      totalSeats === null ||
      totalSeats === undefined ||
      isNaN(Number(totalSeats))
    ) {
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
      const msg =
        res.data?.message ||
        (editingBatchId
          ? "Batch updated successfully!"
          : "Batch timing created successfully!");
      showToast(msg, "success");
      await loadCourseDetails(selectedCourseId);
      await loadSidebarCourses();
    } catch (err) {
      console.error("Error saving batch:", err);
      setTimingModalError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to save batch timing.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // Confirmation Dialog Handlers for Delete (Course, Plan, Timing)
  // ---------------------------------------------------------------------
  const handleOpenDeleteCourseConfirm = (course) => {
    const target = course || courseDetails;
    if (!target) return;
    setDeleteType("course");
    setItemToDelete(target);
    setDeleteModalError("");
    setIsDeleteConfirmOpen(true);
  };

  const handleEditItem = () => {
    const item = selectedItem;
    const type = activeMenuType;
    handleMenuClose();
    if (type === "course") {
      handleOpenEditCourse(item);
      return;
    }
    if (!item) return;
    if (type === "plan") handleOpenEditPlan(item);
    else if (type === "timing") handleOpenEditTiming(item);
  };

  const handleDeleteItemClick = () => {
    const item = selectedItem;
    const type = activeMenuType;
    handleMenuClose();
    if (type === "course") {
      handleOpenDeleteCourseConfirm(item);
      return;
    }
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
        const courseIdToDelete = itemToDelete?.id || selectedCourseId;
        res = await deleteCourseAdmin(courseIdToDelete);
        if (selectedCourseId === courseIdToDelete) {
          setSelectedCourseId(null);
          setCourseDetails(null);
        }
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
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to delete item.";
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
        width: "100%",
        maxWidth: "1200px",
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
      {/* Centralized toast handled via react-toastify */}

      {/* TOP BAR BREADCRUMB & HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.8,
          borderBottom: `1px solid ${BORDER_COLOR}`,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              backgroundColor: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SchoolIcon sx={{ color: "#475569", fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: SECONDARY_TEXT,
              fontFamily: FONT,
            }}
          >
            Courses
          </Typography>
          <ChevronRightIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.8,
              px: 1.4,
              py: 0.4,
              borderRadius: "20px",
              backgroundColor: courseDetails ? "#F7FEE7" : "#F8FAFC",
              border: `1px solid ${courseDetails ? "#D9F99D" : "#E2E8F0"}`,
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: courseDetails ? "#3F6212" : "#64748B",
                fontFamily: FONT,
              }}
            >
              {courseDetails ? courseDetails.name : "Select Course"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* MAIN SPLIT LAYOUT */}
      <Box sx={{ display: "flex", minHeight: "650px" }}>
        {/* LEFT SIDEBAR: COURSE LIST */}
        <Box
          sx={{
            width: "260px",
            minWidth: "260px",
            borderRight: `1px solid ${BORDER_COLOR}`,
            p: 1.8,
            display: "flex",
            flexDirection: "column",
            gap: 1.8,
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Search courses */}
          <TextField
            fullWidth
            placeholder="Search courses..."
            size="small"
            value={searchSidebar}
            onChange={(e) => setSearchSidebar(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchSidebar ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchSidebar("")}
                    sx={{
                      p: 0.3,
                      color: "#94A3B8",
                      "&:hover": { color: PRIMARY_TEXT },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#F8FAFC",
                borderRadius: "10px",
                fontSize: "14px",
                fontFamily: FONT,
                transition: "all 0.2s ease",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 0 0 3px rgba(132, 204, 22, 0.18)",
                  "& fieldset": {
                    borderColor: ACCENT_GREEN,
                    borderWidth: "1.5px",
                  },
                },
              },
              "& .MuiInputBase-input": {
                py: "8.5px",
              },
            }}
          />

          {/* Add Course Action Divider */}
          {canCreateCourse && (
            <Divider
              sx={{
                "&::before, &::after": { borderColor: "#E2E8F0" },
                my: 0.2,
              }}
            >
              <Tooltip title="Create New Course" arrow placement="top">
                <Button
                  onClick={handleOpenCreateCourse}
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: "20px",
                    px: 2,
                    py: 0.45,
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: FONT,
                    textTransform: "none",
                    backgroundColor: "#F7FEE7",
                    color: "#3F6212",
                    border: "1px dashed #84CC16",
                    boxShadow: "0 1px 3px rgba(132, 204, 22, 0.12)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: ACCENT_GREEN,
                      color: "#FFFFFF",
                      borderColor: ACCENT_GREEN,
                      boxShadow: "0 4px 12px rgba(132, 204, 22, 0.35)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Add Course
                </Button>
              </Tooltip>
            </Divider>
          )}

          {/* Sidebar Section Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 0.5,
              mt: 0.2,
              mb: -0.8,
            }}
          >
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "#64748B",
                textTransform: "uppercase",
                fontFamily: FONT,
              }}
            >
              Courses ({sidebarCourses.length})
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                color: "#94A3B8",
                fontFamily: FONT,
              }}
            >
              {sidebarCourses.length === 1
                ? "1 item"
                : `${sidebarCourses.length} items`}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {loadingSidebar ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.4,
                    borderRadius: "12px",
                    border: `1px solid ${BORDER_COLOR}`,
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    width={42}
                    height={42}
                    sx={{ borderRadius: "10px" }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="65%" height={18} />
                    <Box sx={{ display: "flex", gap: 0.6, mt: 0.6 }}>
                      <Skeleton
                        variant="rounded"
                        width={48}
                        height={18}
                        sx={{ borderRadius: "4px" }}
                      />
                      <Skeleton
                        variant="rounded"
                        width={52}
                        height={18}
                        sx={{ borderRadius: "4px" }}
                      />
                    </Box>
                  </Box>
                  <Skeleton variant="circular" width={20} height={20} />
                </Box>
              ))
            ) : sidebarCourses.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "#F8FAFC",
                  borderRadius: "12px",
                  border: "1px dashed #E2E8F0",
                }}
              >
                <SchoolIcon sx={{ color: "#CBD5E1", fontSize: 28, mb: 0.8 }} />
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: SECONDARY_TEXT,
                  }}
                >
                  No courses found
                </Typography>
                <Typography
                  sx={{ fontSize: "11.5px", color: "#94A3B8", mt: 0.3 }}
                >
                  Click "Add Course" above to create one
                </Typography>
              </Box>
            ) : (
              sidebarCourses.map((c) => {
                const isSelected = c.id === selectedCourseId;
                const palette = getCoursePalette(c.id, c.name);
                return (
                  <Tooltip
                    key={c.id}
                    title={c.name}
                    placement="right"
                    arrow
                    enterDelay={300}
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#1E293B",
                          color: "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: FONT,
                          borderRadius: "6px",
                          px: 1.2,
                          py: 0.5,
                        },
                      },
                    }}
                  >
                    <Box
                      onClick={() => setSelectedCourseId(c.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.4,
                        p: 1.3,
                        borderRadius: "12px",
                        cursor: "pointer",
                        border: isSelected
                          ? `1.5px solid ${ACCENT_GREEN}`
                          : `1px solid ${BORDER_COLOR}`,
                        borderLeft: isSelected
                          ? `4px solid ${ACCENT_GREEN}`
                          : `1px solid ${BORDER_COLOR}`,
                        background: isSelected
                          ? "linear-gradient(135deg, #F7FEE7 0%, #FFFFFF 100%)"
                          : "#FFFFFF",
                        boxShadow: isSelected
                          ? "0 4px 16px -2px rgba(132, 204, 22, 0.2), 0 2px 6px -1px rgba(132, 204, 22, 0.1)"
                          : "0 1px 3px rgba(0,0,0,0.03)",
                        transform: isSelected ? "translateX(2px)" : "none",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        "&:hover": {
                          backgroundColor: isSelected ? "#F7FEE7" : "#F8FAFC",
                          borderColor: isSelected ? ACCENT_GREEN : "#CBD5E1",
                          transform: "translateX(3px)",
                          boxShadow: isSelected
                            ? "0 6px 18px rgba(132, 204, 22, 0.25)"
                            : "0 4px 12px rgba(15, 23, 42, 0.06)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "10px",
                          background: isSelected
                            ? "linear-gradient(135deg, #84CC16 0%, #65A30D 100%)"
                            : palette.bg,
                          color: isSelected ? "#FFFFFF" : palette.color,
                          border: isSelected
                            ? "none"
                            : `1px solid ${palette.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                          letterSpacing: "0.02em",
                          fontFamily: FONT,
                          flexShrink: 0,
                          boxShadow: isSelected
                            ? "0 3px 10px rgba(132, 204, 22, 0.35)"
                            : "none",
                          transition: "all 0.2s ease",
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
                            color: isSelected ? "#1E293B" : PRIMARY_TEXT,
                            fontFamily: FONT,
                            lineHeight: 1.25,
                          }}
                        >
                          {c.name}
                        </Typography>

                        {/* Micro-pills for Plans & Batches */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                            mt: 0.6,
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.35,
                              px: 0.7,
                              py: 0.2,
                              borderRadius: "5px",
                              backgroundColor: isSelected
                                ? "rgba(132, 204, 22, 0.18)"
                                : "#F1F5F9",
                              color: isSelected ? "#3F6212" : "#64748B",
                              fontSize: "11px",
                              fontWeight: 600,
                              fontFamily: FONT,
                              lineHeight: 1,
                            }}
                          >
                            <LayersOutlinedIcon
                              sx={{ fontSize: 11.5, opacity: 0.85 }}
                            />
                            {c.plan_count ?? 0}{" "}
                            {c.plan_count === 1 ? "Plan" : "Plans"}
                          </Box>

                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.35,
                              px: 0.7,
                              py: 0.2,
                              borderRadius: "5px",
                              backgroundColor: isSelected
                                ? "rgba(132, 204, 22, 0.18)"
                                : "#F1F5F9",
                              color: isSelected ? "#3F6212" : "#64748B",
                              fontSize: "11px",
                              fontWeight: 600,
                              fontFamily: FONT,
                              lineHeight: 1,
                            }}
                          >
                            <GroupsOutlinedIcon
                              sx={{ fontSize: 11.5, opacity: 0.85 }}
                            />
                            {c.active_batches ?? 0}{" "}
                            {c.active_batches === 1 ? "Batch" : "Batches"}
                          </Box>
                        </Box>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.3 }}
                      >
                        {isSelected && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: ACCENT_GREEN,
                              boxShadow: "0 0 0 3px rgba(132, 204, 22, 0.25)",
                              mr: 0.3,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {(canEditCourse || canDeleteCourse) && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, "course", c);
                            }}
                            sx={{
                              color: isSelected ? "#65A30D" : SECONDARY_TEXT,
                              p: 0.5,
                              borderRadius: "6px",
                              flexShrink: 0,
                              "&:hover": {
                                backgroundColor: isSelected
                                  ? "#ECFCCB"
                                  : "#F1F5F9",
                                color: PRIMARY_TEXT,
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })
            )}
          </Box>
        </Box>

        {/* RIGHT DETAIL PANEL */}
        {loadingDetails ? (
          <CourseDetailsSkeleton />
        ) : courseDetails ? (
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              p: { xs: 2, md: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* COURSE HEADER BANNER */}
            <Paper
              elevation={0}
              sx={{
                p: 2.4,
                borderRadius: "14px",
                border: `1px solid ${BORDER_COLOR}`,
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%)",
                    color: "#3F6212",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "18px",
                    boxShadow: "0 2px 8px rgba(132, 204, 22, 0.25)",
                    border: "1px solid rgba(132, 204, 22, 0.3)",
                    flexShrink: 0,
                  }}
                >
                  {courseDetails.avatar_text}
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Typography
                      sx={{
                        fontSize: "20px",
                        fontWeight: 600,
                        color: PRIMARY_TEXT,
                        fontFamily: FONT,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {courseDetails.name}
                    </Typography>
                    <Chip
                      icon={
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor:
                              courseDetails.status === "Active"
                                ? "#16A34A"
                                : SECONDARY_TEXT,
                            ml: "4px !important",
                          }}
                        />
                      }
                      label={courseDetails.status}
                      size="small"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: FONT,
                        height: "24px",
                        backgroundColor:
                          courseDetails.status === "Active"
                            ? "#DCFCE7"
                            : "#F1F5F9",
                        color:
                          courseDetails.status === "Active"
                            ? "#15803D"
                            : SECONDARY_TEXT,
                        borderRadius: "20px",
                        px: 0.5,
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#64748B",
                      fontFamily: FONT,
                      mt: 0.3,
                    }}
                  >
                    Course details, pricing tiers, and active batch timings
                  </Typography>
                </Box>
              </Box>

              {/* Quick Summary Badges on the right */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    px: 1.6,
                    py: 0.7,
                    borderRadius: "10px",
                    backgroundColor: INPUT_BG,
                    border: `1px solid ${BORDER_COLOR}`,
                  }}
                >
                  <LayersOutlinedIcon sx={{ fontSize: 18, color: "#65A30D" }} />
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    {courseDetails?.plans?.length ?? 0}{" "}
                    {courseDetails?.plans?.length === 1 ? "Plan" : "Plans"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    px: 1.6,
                    py: 0.7,
                    borderRadius: "10px",
                    backgroundColor: INPUT_BG,
                    border: `1px solid ${BORDER_COLOR}`,
                  }}
                >
                  <GroupsOutlinedIcon sx={{ fontSize: 18, color: "#2563EB" }} />
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    {courseDetails?.batches?.length ?? 0}{" "}
                    {courseDetails?.batches?.length === 1 ? "Batch" : "Batches"}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* METRIC SUMMARY STATS CARDS */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2.2,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: "14px",
                  border: `1px solid ${BORDER_COLOR}`,
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#CBD5E1",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: SECONDARY_TEXT,
                      fontFamily: FONT,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Total Plans
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "26px",
                      fontWeight: 700,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                      mt: 0.4,
                      lineHeight: 1.1,
                    }}
                  >
                    {courseDetails?.stats?.plans ?? 0}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#65A30D",
                      fontWeight: 500,
                      fontFamily: FONT,
                      mt: 0.6,
                    }}
                  >
                    Pricing & duration options
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "12px",
                    backgroundColor: "#F7FEE7",
                    border: "1px solid #ECFCCB",
                    color: "#65A30D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LayersOutlinedIcon sx={{ fontSize: 26 }} />
                </Box>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: "14px",
                  border: `1px solid ${BORDER_COLOR}`,
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#CBD5E1",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: SECONDARY_TEXT,
                      fontFamily: FONT,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Active Batches
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "26px",
                      fontWeight: 700,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                      mt: 0.4,
                      lineHeight: 1.1,
                    }}
                  >
                    {courseDetails?.stats?.batches ?? 0}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#2563EB",
                      fontWeight: 500,
                      fontFamily: FONT,
                      mt: 0.6,
                    }}
                  >
                    Schedules & trainer allocations
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "12px",
                    backgroundColor: "#EFF6FF",
                    border: "1px solid #DBEAFE",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GroupsOutlinedIcon sx={{ fontSize: 26 }} />
                </Box>
              </Paper>
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Typography
                    sx={{
                      fontSize: "17px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    Plans and fees
                  </Typography>
                  <Chip
                    label={courseDetails?.plans?.length ?? 0}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: "#F1F5F9",
                      color: SECONDARY_TEXT,
                      borderRadius: "6px",
                    }}
                  />
                </Box>

                {canCreatePlan && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 17 }} />}
                    onClick={handleOpenCreatePlan}
                    sx={{
                      color: "#FFFFFF",
                      backgroundColor: PRIMARY_BLUE_BG,
                      fontFamily: FONT,
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: 600,
                      borderRadius: "8px",
                      px: 2,
                      py: 0.7,
                      boxShadow: "0 2px 8px rgba(0, 0, 216, 0.2)",
                      "&:hover": {
                        backgroundColor: "#0000B0",
                        boxShadow: "0 4px 12px rgba(0, 0, 216, 0.3)",
                      },
                    }}
                  >
                    Create plan
                  </Button>
                )}
              </Box>

              {(courseDetails?.plans || []).length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: "12px",
                    border: `1px dashed ${BORDER_COLOR}`,
                    backgroundColor: INPUT_BG,
                  }}
                >
                  <Typography
                    sx={{
                      color: SECONDARY_TEXT,
                      fontSize: "14px",
                      fontFamily: FONT,
                    }}
                  >
                    No plans created yet for this course. Click "Create plan" to
                    add one.
                  </Typography>
                </Paper>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2.2,
                  }}
                >
                  {(courseDetails?.plans || []).map((plan, index) => (
                    <Paper
                      key={plan.plan_id || plan.id || index}
                      elevation={0}
                      sx={{
                        p: 2.4,
                        borderRadius: "14px",
                        border: plan.is_highlighted
                          ? `2px solid ${ACCENT_GREEN}`
                          : `1px solid ${BORDER_COLOR}`,
                        backgroundColor: "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.8,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: LIME,
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Chip
                          label={plan.name}
                          size="small"
                          sx={{
                            backgroundColor: "#F7FEE7",
                            color: "#3F6212",
                            fontWeight: 600,
                            fontSize: "12px",
                            fontFamily: FONT,
                            borderRadius: "6px",
                            border: "1px solid #ECFCCB",
                            px: 0.5,
                          }}
                        />
                        {(canEditPlan || canDeletePlan) && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, "plan", plan)}
                            sx={{
                              color: SECONDARY_TEXT,
                              p: 0.5,
                              borderRadius: "6px",
                              "&:hover": {
                                backgroundColor: "#F1F5F9",
                                color: PRIMARY_TEXT,
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "24px",
                            fontWeight: 700,
                            color: PRIMARY_TEXT,
                            fontFamily: FONT,
                            lineHeight: 1,
                          }}
                        >
                          {plan.price}
                        </Typography>
                      </Box>

                      <Divider sx={{ borderColor: "#F1F5F9" }} />

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.2,
                        }}
                      >
                        {plan.duration && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                              }}
                            >
                              <CalendarTodayOutlinedIcon
                                sx={{ fontSize: 15, color: SECONDARY_TEXT }}
                              />
                              <Typography
                                sx={{
                                  color: SECONDARY_TEXT,
                                  fontSize: "13.5px",
                                  fontFamily: FONT,
                                }}
                              >
                                Duration
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                color: PRIMARY_TEXT,
                                fontWeight: 600,
                                fontSize: "14px",
                                fontFamily: FONT,
                              }}
                            >
                              {plan.duration}
                            </Typography>
                          </Box>
                        )}

                        {plan.hours_per_day && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                              }}
                            >
                              <AccessTimeOutlinedIcon
                                sx={{ fontSize: 15, color: SECONDARY_TEXT }}
                              />
                              <Typography
                                sx={{
                                  color: SECONDARY_TEXT,
                                  fontSize: "13.5px",
                                  fontFamily: FONT,
                                }}
                              >
                                Hours per day
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                color: PRIMARY_TEXT,
                                fontWeight: 600,
                                fontSize: "14px",
                                fontFamily: FONT,
                              }}
                            >
                              {plan.hours_per_day}
                            </Typography>
                          </Box>
                        )}

                        {plan.after_offer && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              sx={{
                                color: SECONDARY_TEXT,
                                fontSize: "13.5px",
                                fontFamily: FONT,
                              }}
                            >
                              After offer
                            </Typography>
                            <Typography
                              sx={{
                                color: "#16A34A",
                                fontWeight: 700,
                                fontSize: "14px",
                                fontFamily: FONT,
                              }}
                            >
                              {plan.after_offer}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Typography
                    sx={{
                      fontSize: "17px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    Batch timings
                  </Typography>
                  <Chip
                    label={courseDetails?.batches?.length ?? 0}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: "#F1F5F9",
                      color: SECONDARY_TEXT,
                      borderRadius: "6px",
                    }}
                  />
                </Box>

                {canCreateBatch && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 17 }} />}
                    onClick={handleOpenCreateTiming}
                    sx={{
                      color: "#FFFFFF",
                      backgroundColor: PRIMARY_BLUE_BG,
                      fontFamily: FONT,
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: 600,
                      borderRadius: "8px",
                      px: 2,
                      py: 0.7,
                      boxShadow: "0 2px 8px rgba(0, 0, 216, 0.2)",
                      "&:hover": {
                        backgroundColor: "#0000B0",
                        boxShadow: "0 4px 12px rgba(0, 0, 216, 0.3)",
                      },
                    }}
                  >
                    Create timing
                  </Button>
                )}
              </Box>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: "14px",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                    <TableRow>
                      <TableCell sx={{ ...tableHeadCellSx, py: 1.6 }}>
                        Batch
                      </TableCell>
                      <TableCell sx={{ ...tableHeadCellSx, py: 1.6 }}>
                        Schedule & Trainer
                      </TableCell>
                      <TableCell sx={{ ...tableHeadCellSx, py: 1.6 }}>
                        Seats Capacity
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.6, width: 60 }} />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {(courseDetails?.batches || []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            py: 4,
                            color: SECONDARY_TEXT,
                            fontSize: "14px",
                            fontFamily: FONT,
                          }}
                        >
                          No batch timings scheduled yet for this course. Click
                          "Create timing" to add one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (courseDetails?.batches || []).map((batch, index) => {
                        const totalSeats = batch.total_seats || 0;
                        const filledSeats = batch.filled_seats || 0;
                        const capacityPercent =
                          totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;
                        const isFull =
                          filledSeats >= totalSeats && totalSeats > 0;
                        const isAlmostFull =
                          batch.note === "almost full" ||
                          (capacityPercent >= 80 && !isFull);
                        const progressColor = isFull
                          ? "#EF4444"
                          : isAlmostFull
                            ? "#F59E0B"
                            : ACCENT_GREEN;

                        return (
                          <TableRow
                            key={batch.batch_id || batch.id || index}
                            sx={{
                              transition: "background-color 0.15s ease",
                              "&:hover": { backgroundColor: "#F8FAFC" },
                              "&:last-child td, &:last-child th": { border: 0 },
                            }}
                          >
                            <TableCell sx={{ py: 2 }}>
                              <Typography
                                sx={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: PRIMARY_TEXT,
                                  fontFamily: FONT,
                                  lineHeight: 1.2,
                                }}
                              >
                                {batch.name}
                              </Typography>
                              {batch.plan_name && (
                                <Chip
                                  label={batch.plan_name}
                                  size="small"
                                  sx={{
                                    height: "20px",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    backgroundColor: "#F1F5F9",
                                    color: SECONDARY_TEXT,
                                    borderRadius: "5px",
                                    mt: 0.6,
                                  }}
                                />
                              )}
                            </TableCell>

                            <TableCell sx={{ py: 2 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.7,
                                }}
                              >
                                <AccessTimeOutlinedIcon
                                  sx={{ fontSize: 16, color: SECONDARY_TEXT }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: PRIMARY_TEXT,
                                    fontFamily: FONT,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {batch.time}
                                </Typography>
                              </Box>
                              {batch.trainer && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.6,
                                    mt: 0.5,
                                  }}
                                >
                                  <PersonOutlineOutlinedIcon
                                    sx={{ fontSize: 15, color: "#94A3B8" }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "13px",
                                      fontWeight: 400,
                                      color: SECONDARY_TEXT,
                                      fontFamily: FONT,
                                    }}
                                  >
                                    {batch.trainer}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>

                            <TableCell sx={{ py: 2, minWidth: 200 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  mb: 0.8,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: isFull ? "#DC2626" : PRIMARY_TEXT,
                                    fontFamily: FONT,
                                  }}
                                >
                                  {filledSeats} / {totalSeats} seats
                                </Typography>
                                {isAlmostFull && !isFull && (
                                  <Chip
                                    label="Almost full"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      backgroundColor: "#FEF3C7",
                                      color: "#D97706",
                                      borderRadius: "4px",
                                    }}
                                  />
                                )}
                                {isFull && (
                                  <Chip
                                    label="Full"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      backgroundColor: "#FEE2E2",
                                      color: "#DC2626",
                                      borderRadius: "4px",
                                    }}
                                  />
                                )}
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={capacityPercent}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: "#E2E8F0",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: progressColor,
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </TableCell>

                            <TableCell align="right" sx={{ py: 2 }}>
                              {(canEditBatch || canDeleteBatch) && (
                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleMenuOpen(e, "timing", batch)
                                  }
                                  sx={{
                                    color: SECONDARY_TEXT,
                                    p: 0.6,
                                    borderRadius: "6px",
                                    "&:hover": {
                                      backgroundColor: "#F1F5F9",
                                      color: PRIMARY_TEXT,
                                    },
                                  }}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 2.5, md: 4 },
              minHeight: "560px",
              backgroundColor: "#F8FAFC",
            }}
          >
            {/* Main Central Hub Card */}
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: "600px",
                p: { xs: 3, sm: 4 },
                borderRadius: "20px",
                border: `1px solid ${BORDER_COLOR}`,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {/* Stacked Icon Graphic */}
              <Box sx={{ position: "relative", mb: 2.2 }}>
                <Box
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: "22px",
                    background:
                      "linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 22px rgba(132, 204, 22, 0.28)",
                    border: "2px solid #FFFFFF",
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 38, color: "#3F6212" }} />
                </Box>
                {/* Floating Plus Badge */}
                <Tooltip title="Create Course" arrow placement="top">
                  <Box
                    onClick={handleOpenCreateCourse}
                    sx={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: ACCENT_GREEN,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2.5px solid #FFFFFF",
                      boxShadow: "0 2px 8px rgba(132, 204, 22, 0.5)",
                      cursor: "pointer",
                      transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": { transform: "scale(1.15)" },
                    }}
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                  </Box>
                </Tooltip>
              </Box>

              {/* Title & Subtitle */}
              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: PRIMARY_TEXT,
                  fontFamily: FONT,
                  mb: 0.8,
                  letterSpacing: "-0.01em",
                }}
              >
                Course Management Hub
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: SECONDARY_TEXT,
                  fontFamily: FONT,
                  lineHeight: 1.6,
                  maxWidth: "460px",
                  mb: 3,
                }}
              >
                {sidebarCourses.length > 0
                  ? "Select a course from the left sidebar to manage its pricing plans and active batch schedules, or create a brand new course below."
                  : "Create your first course to configure pricing tiers, durations, and student batch timings."}
              </Typography>

              {/* Action Button & Hint */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 3.5,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {canCreateCourse && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 19 }} />}
                    onClick={handleOpenCreateCourse}
                    sx={{
                      color: "#FFFFFF",
                      backgroundColor: ACCENT_GREEN,
                      fontFamily: FONT,
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: 600,
                      borderRadius: "10px",
                      px: 3,
                      py: 1,
                      boxShadow: "0 4px 14px rgba(132, 204, 22, 0.38)",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        backgroundColor: "#65A30D",
                        transform: "translateY(-1px)",
                        boxShadow: "0 6px 18px rgba(132, 204, 22, 0.5)",
                      },
                    }}
                  >
                    Create New Course
                  </Button>
                )}

                {sidebarCourses.length > 0 && (
                  <Chip
                    label={`👈 Or pick from ${sidebarCourses.length} course${sidebarCourses.length > 1 ? "s" : ""} on sidebar`}
                    sx={{
                      backgroundColor: "#F1F5F9",
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                      fontSize: "13px",
                      fontWeight: 500,
                      height: "36px",
                      borderRadius: "10px",
                      px: 0.5,
                    }}
                  />
                )}
              </Box>

              <Divider sx={{ width: "100%", borderColor: "#F1F5F9", mb: 3 }} />

              {/* 3 Modern Feature Preview Cards */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 1.5,
                  width: "100%",
                  textAlign: "left",
                }}
              >
                {/* Feature 1 */}
                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: "12px",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.8,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#FFFFFF",
                      borderColor: "#CBD5E1",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      backgroundColor: "#ECFCCB",
                      color: "#3F6212",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 19 }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    Course Profiles
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: SECONDARY_TEXT,
                      fontFamily: FONT,
                      lineHeight: 1.4,
                    }}
                  >
                    Define course names, active status, and custom initials.
                  </Typography>
                </Box>

                {/* Feature 2 */}
                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: "12px",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.8,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#FFFFFF",
                      borderColor: "#CBD5E1",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      backgroundColor: "#FEF3C7",
                      color: "#B45309",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LayersOutlinedIcon sx={{ fontSize: 19 }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    Plans & Fees
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: SECONDARY_TEXT,
                      fontFamily: FONT,
                      lineHeight: 1.4,
                    }}
                  >
                    Configure pricing tiers, course duration, and offer prices.
                  </Typography>
                </Box>

                {/* Feature 3 */}
                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: "12px",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.8,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#FFFFFF",
                      borderColor: "#CBD5E1",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "8px",
                      backgroundColor: "#EFF6FF",
                      color: "#1D4ED8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GroupsOutlinedIcon sx={{ fontSize: 19 }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: PRIMARY_TEXT,
                      fontFamily: FONT,
                    }}
                  >
                    Batch Timings
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: SECONDARY_TEXT,
                      fontFamily: FONT,
                      lineHeight: 1.4,
                    }}
                  >
                    Schedule trainer allocations and track seat capacities.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* OPTIONS MENU */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        MenuListProps={{
          sx: {
            p: 0.5,
          },
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: "10px",
            minWidth: 130,
            border: `1px solid ${BORDER_COLOR}`,
            fontFamily: FONT,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          },
        }}
      >
        <MenuItem
          onClick={handleEditItem}
          sx={{
            fontSize: "13.5px",
            fontWeight: 500,
            color: PRIMARY_TEXT,
            gap: 1.2,
            fontFamily: FONT,
            borderRadius: "6px",
            py: 0.8,
            px: 1.2,
            "&:hover": {
              backgroundColor: "#F7FEE7",
              color: "#3F6212",
            },
          }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ color: "#65A30D" }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={handleDeleteItemClick}
          sx={{
            fontSize: "13.5px",
            fontWeight: 500,
            color: "#EF4444",
            gap: 1.2,
            fontFamily: FONT,
            borderRadius: "6px",
            py: 0.8,
            px: 1.2,
            "&:hover": {
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
            },
          }}
        >
          <DeleteOutlinedIcon fontSize="small" sx={{ color: "#EF4444" }} />{" "}
          Delete
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
                fontFamily: FONT,
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
          <Button
            onClick={handleSaveCourse}
            variant="contained"
            sx={saveBtnSx}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save"
            )}
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
          <Button
            onClick={handleSavePlan}
            variant="contained"
            sx={saveBtnSx}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save"
            )}
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
          <Button
            onClick={handleSaveTiming}
            variant="contained"
            sx={saveBtnSx}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
