import {
    useEffect,
    useState,
} from "react";

import {
    Box,
    Modal,
    Typography,
    TextField,
    MenuItem,
    Button,
    IconButton,
    Checkbox,
    FormControlLabel,
    Dialog,          // ✅ ADD
    DialogTitle,     // ✅ ADD
    DialogContent,   // ✅ ADD
    DialogActions,   // ✅ ADD
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import { useParams } from "react-router-dom";
import { fetchOneWonData, submitWonLead } from "@/apps/telecalling/services/fetchOneWonDataService";
import { useAuth } from "@/shared/context/AuthContext";
import { getSelectOptions } from "@/shared/services/dropdownService";
import { CATEGORY_ALIAS } from "@/shared/components/filters/popup/filterConfig";
import { selectPlaceholderProps } from "@/shared/components/form/selectPlaceholder";

const WonDetailsModal = ({ open, handleClose, leadData, pipelineId }) => {
  const { hasPermission } = useAuth();
  const { id } = useParams();

  const [wonData, setWonData] = useState({});
  const [apiDataLoaded, setApiDataLoaded] = useState(null);
  const [fullPayment, setFullPayment] = useState(false);

  const [originalPendingAmount, setOriginalPendingAmount] = useState(0);
  const [formData, setFormData] = useState({
    pipeline_stage: "",
    pipeline_stage_id: "",

    paid_amount: "",

    payment_status: "",

    due_date: "",

    summary: "",
    notes: "",
  });
  const [pipelineStageOptions, setPipelineStageOptions] = useState([]);
  const [errors, setErrors] = useState({});

  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: "",
  });

  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    if (open) {
      setErrors({});
      getWonDetails();
      getPipelineStageOptions();
    }
  }, [open]);

  const getWonDetails = async () => {
    if (!hasPermission("api_fetch_one_won_lead_detail")) {
      console.warn("Permission denied: api_fetch_one_won_lead_detail");
      return;
    }
    try {
      const response = await fetchOneWonData(Number(id));
      const apiData = response.data?.data?.[0] || response.data?.data || {};

      setWonData(apiData);
      setApiDataLoaded(apiData);

      // 🟢 Smart Pending Amount Calculation:
      let fetchedPending = 0;
      if (apiData?.payment_status === "Paid" && Number(apiData?.paid_amount) > 0 && Number(apiData?.pending_amount) === 0) {
        fetchedPending = 0;
      } else if (apiData?.pending_amount && Number(apiData.pending_amount) > 0) {
        fetchedPending = Number(apiData.pending_amount);
      } else if (apiData?.total_fees && Number(apiData.total_fees) > 0) {
        fetchedPending = Number(apiData.total_fees);
      } else if (apiData?.course_fees && Number(apiData.course_fees) > 0) {
        fetchedPending = Number(apiData.course_fees);
      } else {
        fetchedPending = 16000;
      }

      setOriginalPendingAmount(fetchedPending);

      setFormData((prev) => ({
        ...prev,
        paid_amount: "",
        pending_amount: fetchedPending,
        due_date: apiData?.due_date
          ? typeof apiData.due_date === "string" &&
            apiData.due_date.includes("T")
            ? apiData.due_date.split("T")[0]
            : apiData.due_date
          : "",
        payment_status: apiData?.payment_status ?? "",
      }));
    } catch (error) {
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "pipeline_stage") {
      // select works with the option id; keep the label next to it
      const selected = pipelineStageOptions.find(
        (item) => String(item.value) === String(value),
      );

      setFormData((prev) => ({
        ...prev,
        pipeline_stage: selected?.label || "",
        pipeline_stage_id: selected?.value ?? "",
      }));

      setErrors((prev) => ({ ...prev, pipeline_stage: "" }));

      return;
    }

    if (name === "paid_amount") {
      const paid = Number(value) || 0;
      const calcPending = Math.max(originalPendingAmount - paid, 0);

      setFormData((prev) => ({
        ...prev,
        paid_amount: paid,
        pending_amount: calcPending,
        due_date: calcPending === 0 ? "" : prev.due_date,
      }));

      if (value !== "") {
        setErrors((prev) => ({ ...prev, paid_amount: "" }));
      }

      if (calcPending === 0) {
        setErrors((prev) => ({ ...prev, due_date: "" }));
      }

      return;
    }

    if (name === "due_date") {
      setFormData((prev) => ({
        ...prev,
        due_date: value,
      }));

      setErrors((prev) => ({ ...prev, due_date: "" }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const newInstallmentPaid = Number(formData?.paid_amount) || 0;

  const pendingAmount = Math.max(originalPendingAmount - newInstallmentPaid, 0);

  // ✅ Dynamic Payment Status calculation based on Due Date & Pending Amount
  const derivePaymentStatus = () => {
    if (pendingAmount === 0) {
      return "Paid";
    }
    if (!formData.due_date) {
      return newInstallmentPaid > 0 ? "Partial" : "Pending";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize selected due_date
    let dateStr = formData.due_date;
    if (typeof dateStr === "string" && dateStr.includes("T")) {
      dateStr = dateStr.split("T")[0];
    }

    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);

    if (isNaN(due.getTime())) {
      return newInstallmentPaid > 0 ? "Partial" : "Pending";
    }

    const diffTime = due.getTime() - today.getTime();

    if (diffTime === 0) {
      return "Today Due";
    } else if (diffTime > 0) {
      return "Active Due";
    } else {
      return "Over Due";
    }
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      height: "30px",

      background: "#F2F2F2",

      borderRadius: "5px",

      fontSize: "14px",

      "& fieldset": {
        border: "0.5px solid #00000017",
      },
    },

    "& .MuiInputBase-input": {
      fontSize: "14px",
      textTransform: "capitalize",
    },
  };

  const handleSubmit = async () => {
    const tempErrors = {};

    if (!formData?.pipeline_stage_id) {
      tempErrors.pipeline_stage = "Please select pipeline stage";
    }

    if (
      formData?.paid_amount === "" ||
      formData?.paid_amount === null ||
      formData?.paid_amount === undefined
    ) {
      tempErrors.paid_amount = "Amount Paid is required";
    }

    const parsedPending = Number(formData?.pending_amount);
    const currentPending = Number.isNaN(parsedPending) ? pendingAmount : parsedPending;

    if (currentPending > 0 && !formData?.due_date) {
      tempErrors.due_date = "Please select due date";
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      return;
    }

    try {
      const calculatedStatus = derivePaymentStatus();

      const payload = {
        lead_id: Number(id),
        pipeline_stage: formData?.pipeline_stage,
        pipeline_stage_id: Number(formData?.pipeline_stage_id),
        paid_amount: Number(formData?.paid_amount) || 0,
        pending_amount: currentPending,
        due_date: currentPending > 0 ? formData?.due_date || null : null,
        payment_status: calculatedStatus,
        notes: formData?.notes || null,
      };

      const response = await submitWonLead(payload);

      setSuccessDialog({
        open: true,
        message: "Won lead details saved successfully",
      });
    } catch (error) {

      const backendMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error;

      setErrorDialog({
        open: true,
        message:
          backendMessage ||
          "Failed to save won lead details. Please try again.",
      });
    }
  };
  const getPipelineStageOptions = async () => {
    try {
      const activePipelineId =
        pipelineId ||
        leadData?.pipeline_category_id ||
        leadData?.pipeline_id ||
        sessionStorage.getItem("telecalling_pipeline_selected_pipeline") ||
        0;

      // get_select_options payload: { field, opt_filter }
      const payload = {
        field: CATEGORY_ALIAS.pipeline_stage,
        opt_filter: {
          pipeline_id: Number(activePipelineId) || 0,
        },
      };

      const response = await getSelectOptions(payload);
      const options = response?.data?.data || [];

      // This modal is only for the "Won" stage
      setPipelineStageOptions(options// ✅ Show all stages, not just "Won"
        // options.filter((opt) => opt.label?.trim().toLowerCase() === "won"),
      );
    } catch (error) {
      console.error("Won Pipeline Stage Options Error:", error);
      setPipelineStageOptions([]);
    }
  };

  // Once options + fetch_one_won_data are both available, show the saved stage
  // (matched by id first, then label). If the API has none -> placeholder stays.
  useEffect(() => {
    if (!open || !pipelineStageOptions.length || !apiDataLoaded) return;

    const savedId = apiDataLoaded.pipeline_stage_id;
    const savedLabel = (apiDataLoaded.pipeline_stage || "").trim().toLowerCase();

    const selected = pipelineStageOptions.find(
      (item) =>
        (savedId && String(item.value) === String(savedId)) ||
        (savedLabel && item.label?.trim().toLowerCase() === savedLabel),
    );

    setFormData((prev) => ({
      ...prev,
      pipeline_stage: selected?.label || "",
      pipeline_stage_id: selected?.value ?? "",
    }));
  }, [open, pipelineStageOptions, apiDataLoaded]);

  return (
    <>
      <Modal
        open={Boolean(open)}
        onClose={handleClose}
        sx={{
          display: "flex",

          justifyContent: "center",

          alignItems: "center",

          p: 1,
        }}
      >
        <Box
          sx={{
            width: {
              xs: "95%",
              sm: "85%",
              md: "820px",
            },

            maxWidth: "820px",

            maxHeight: {
              xs: "92vh",
              md: "90vh",
            },

            overflowY: "auto",

            background: "#fff",

            borderRadius: "14px",

            p: {
              xs: 2,
              sm: 2,
            },

            outline: "none",

            scrollbarWidth: "thin",

            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#d1d5db",
              borderRadius: "4px",
            },
          }}
        >
          {/* HEADER */}

          <Box
            sx={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              mb: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                gap: 1,
              }}
            >
              <PersonOutlineOutlinedIcon
                sx={{
                  color: "#90D916",

                  fontSize: "22px",
                }}
              />

              <Typography
                sx={{
                  fontSize: "20px",

                  fontWeight: 600,

                  color: "#1A1A1A",
                }}
              >
                Won Lead Detail
              </Typography>
            </Box>

            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* FORM */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
              },

              gap: "18px",
            }}
          >
            {/* PIPELINE */}

            <Box>
              <Typography
                sx={{
                  mb: 1,

                  fontWeight: 600,

                  fontSize: "15px",

                  color: "#4D4D4D",
                }}
              >
                Pipeline Stage
              </Typography>

              <TextField
                select
                fullWidth
                name="pipeline_stage"
                value={formData.pipeline_stage_id ?? ""}
                onChange={handleChange}
                onMouseDown={() => {
                  if (!pipelineStageOptions.length) getPipelineStageOptions();
                }}
                error={!!errors.pipeline_stage}
                helperText={errors.pipeline_stage}
                slotProps={{
                  select: selectPlaceholderProps(
                    (v) =>
                      pipelineStageOptions.find(
                        (item) => String(item.value) === String(v),
                      )?.label || "",
                    "Select Pipeline Stage",
                  ),
                }}
                sx={fieldStyle}
              >
                {pipelineStageOptions.map((item) => (
                  <MenuItem
                    key={item.value}
                    value={item.value}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* AMOUNT PAID */}

            <Box>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "#4D4D4D",
                }}
              >
                Amount Paid <span style={{ color: "red" }}>*</span>
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  border: errors.paid_amount
                    ? "1px solid #d32f2f"
                    : "0.5px solid #00000017",
                  borderRadius: "5px",
                  overflow: "hidden",
                  background: "#F2F2F2",
                }}
              >
                <Box
                  sx={{
                    width: "55px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRight: "0.5px solid #00000017",
                    fontSize: "14px",
                    color: "#888",
                  }}
                >
                  INR
                </Box>

                <TextField
                  fullWidth
                  variant="standard"
                  name="paid_amount"
                  placeholder="Payment Amount"
                  value={formData.paid_amount}
                  onChange={handleChange}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    px: 2,
                    "& .MuiInputBase-root": {
                      height: "35px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>

              {/* ✅ இந்த FULL PAYMENT CHECKBOX-ஐ இங்கதான் சேர்க்க வேண்டும் */}
              <FormControlLabel
                sx={{
                  mt: 1,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#444",
                  },
                }}
                control={
                  <Checkbox
                    checked={fullPayment}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFullPayment(checked);

                      if (checked) {
                        setFormData((prev) => ({
                          ...prev,
                          paid_amount: originalPendingAmount,
                          pending_amount: 0,
                          due_date: "",
                        }));
                        setErrors((prev) => ({
                          ...prev,
                          paid_amount: "",
                          due_date: "",
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          paid_amount: "",
                          pending_amount: originalPendingAmount,
                        }));
                      }
                    }}
                  />
                }
                label={`Full Payment ₹${originalPendingAmount}`}
              />

              {errors.paid_amount && (
                <Typography
                  sx={{
                    color: "#d32f2f",
                    fontSize: "12px",
                    mt: "4px",
                    ml: "4px",
                  }}
                >
                  {errors.paid_amount}
                </Typography>
              )}
            </Box>

            {/* PENDING */}

            <Box>
              <Typography
                sx={{
                  mb: 1,

                  fontWeight: 600,

                  fontSize: "15px",

                  color: "#4D4D4D",
                }}
              >
                Pending Amount
              </Typography>

              <TextField
                fullWidth
                disabled
                value={`₹${pendingAmount}`}
                sx={fieldStyle}
              />
            </Box>

            {/* DUE DATE */}

            <Box>
              <Typography
                sx={{
                  mb: 1,

                  fontWeight: 600,

                  fontSize: "15px",

                  color: "#4D4D4D",
                }}
              >
                Due Date
              </Typography>

              <TextField
                fullWidth
                type="date"
                name="due_date"
                disabled={
                  pendingAmount === 0 || Number(formData?.pending_amount) === 0
                }
                value={formData.due_date || ""}
                onChange={handleChange}
                error={!!errors.due_date}
                helperText={errors.due_date}
                sx={fieldStyle}
              />
            </Box>

            {/* STATUS */}

            <Box>
              <Typography
                sx={{
                  mb: 1,

                  fontWeight: 600,

                  fontSize: "15px",

                  color: "#4D4D4D",
                }}
              >
                Payment Status
              </Typography>

              <TextField
                fullWidth
                name="payment_status"
                value={derivePaymentStatus()}
                InputProps={{
                  readOnly: true,
                }}
                sx={fieldStyle}
              />
            </Box>
          </Box>

          {/* SUMMARY */}

          <Box sx={{ mt: 2 }}>
            <Typography
              sx={{
                mb: 1,

                fontWeight: 600,

                fontSize: "15px",

                color: "#4D4D4D",
              }}
            >
              Summary
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Additional notes about the call......"
              name="notes"
              value={formData.notes ?? ""}
              onChange={handleChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: "#F2F2F2",

                  borderRadius: "5px",

                  "& fieldset": {
                    border: "0.5px solid #00000017",
                  },
                },

                "& textarea": {
                  height: "60px !important",
                },
              }}
            />
          </Box>

          {/* BUTTON */}

          <Box
            sx={{
              display: "flex",

              justifyContent: "flex-end",

              mt: 3,
            }}
          >
            <Button
              onClick={handleSubmit}
              startIcon={<SaveOutlinedIcon />}
              sx={{
                background: "#90D916",

                color: "#fff",

                width: {
                  xs: "100%",
                  sm: "220px",
                },

                height: "48px",

                borderRadius: "10px",

                textTransform: "none",

                fontSize: "18px",

                fontWeight: 500,

                "&:hover": {
                  background: "#7FC700",
                },
              }}
            >
              Save Lead Details
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ ADD — SUCCESS DIALOG */}
      <Dialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, message: "" })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
          Success
        </DialogTitle>

        <DialogContent>
          <Typography align="center">{successDialog.message}</Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#90D916",
              textTransform: "none",
              "&:hover": { bgcolor: "#7FC700" },
            }}
            onClick={() => {
              setSuccessDialog({ open: false, message: "" });
              handleClose();
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ ADD — ERROR DIALOG */}
      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, message: "" })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: "#D32F2F" }}>Error</DialogTitle>

        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setErrorDialog({ open: false, message: "" })}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WonDetailsModal;
