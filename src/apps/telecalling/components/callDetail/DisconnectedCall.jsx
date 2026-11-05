import { useEffect, useState, useRef } from "react";

import {
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  Grid,
  Chip,
} from "@mui/material";
import { useParams } from "react-router-dom";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import dayjs from "dayjs";
import { useAuth } from "@/shared/context/AuthContext";
import { getDisconnecetdCallDetails } from "@/apps/telecalling/services/disconnectedCallService";
import { getSelectOptions } from "@/shared/services/dropdownService";
import { CATEGORY_ALIAS } from "@/apps/telecalling/components/filters/popup/filterConfig";
import { fetchLeadCallHistory } from "@/apps/telecalling/services/callHistoryService";

import InputAdornment from "@mui/material/InputAdornment";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import ActionFeedbackModal from "@/apps/telecalling/components/common/ActionFeedbackModal";

const BRAND_GREEN = "#90D916";
const BRAND_GREEN_DARK = "#74B010";
const BRAND_GREEN_LIGHT = "#F4FFD9";

const datePickerPopupSx = {
  "& .MuiPaper-root": {
    borderRadius: "14px",
    border: "1px solid #ECECEC",
    boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
    overflow: "hidden",
  },

  "& .MuiPickersCalendarHeader-root": {
    px: 2,
    pt: 1.5,
    pb: 0.5,
  },

  "& .MuiPickersCalendarHeader-label": {
    fontWeight: 700,
    fontSize: "15px",
    color: "#222",
  },

  "& .MuiPickersCalendarHeader-switchViewButton": {
    color: BRAND_GREEN_DARK,
  },

  "& .MuiPickersArrowSwitcher-button": {
    color: BRAND_GREEN_DARK,
    "&:hover": {
      background: BRAND_GREEN_LIGHT,
    },
  },

  "& .MuiDayCalendar-weekDayLabel": {
    color: "#9A9A9A",
    fontWeight: 600,
    fontSize: "12px",
  },

  "& .MuiPickersDay-root": {
    borderRadius: "8px",
    fontSize: "13px",
    "&:hover": {
      background: BRAND_GREEN_LIGHT,
    },
  },

  "& .MuiPickersDay-today": {
    border: `1.5px solid ${BRAND_GREEN} !important`,
  },

  "& .MuiPickersDay-root.Mui-selected": {
    background: `${BRAND_GREEN} !important`,
    color: "#FFFFFF !important",
    fontWeight: 700,
    "&:hover": {
      background: `${BRAND_GREEN_DARK} !important`,
    },
  },

  "& .MuiClock-clock": {
    background: "#F5F8EF",
  },

  "& .MuiClock-pin, & .MuiClockPointer-root": {
    background: `${BRAND_GREEN} !important`,
  },

  "& .MuiClockPointer-thumb": {
    border: `14px solid ${BRAND_GREEN} !important`,
    background: "#FFFFFF !important",
  },

  "& .MuiClockNumber-root.Mui-selected": {
    color: "#FFFFFF !important",
    fontWeight: 700,
  },

  "& .MuiPickersLayout-actionBar": {
    px: 2,
    pb: 1.5,
    pt: 0.5,

    "& .MuiButton-root": {
      textTransform: "none",
      fontWeight: 600,
      borderRadius: "6px",
    },

    "& .MuiButton-root:last-of-type": {
      background: BRAND_GREEN,
      color: "#FFFFFF",
      "&:hover": {
        background: BRAND_GREEN_DARK,
      },
    },
  },
};

const DisconnectedCall = ({ leadId, leadData, onCallSaved }) => {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const [errors, setErrors] = useState({});
  const [pipelineStageOptions, setPipelineStageOptions] = useState([]);
  const [dynamicIntervalInfo, setDynamicIntervalInfo] = useState(null);
  const initialFollowupRef = useRef("");

  const [formData, setFormData] = useState({
    pipeline_stage: "",
    pipeline_stage_id: null,
    retry_notes: "",
    next_followup: "",
  });

  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: "",
  });

  // Track initial follow-up from leadData without overwriting automatically
  useEffect(() => {
    const initDate =
      leadData?.scheduled_at ||
      leadData?.next_followup ||
      leadData?.next_follow_up ||
      "";
    if (initDate && dayjs(initDate).isValid()) {
      initialFollowupRef.current = dayjs(initDate).format("YYYY-MM-DD HH:mm:ss");
      setFormData((prev) => ({
        ...prev,
        next_followup: prev.next_followup || initialFollowupRef.current,
      }));
    }
  }, [leadData]);

  const isUncontactedStage = (stageLabel) => {
    const name = (stageLabel || "").toLowerCase().trim();
    return (
      name.includes("uncontacted") ||
      name.includes("unconnected") ||
      name.includes("not connected")
    );
  };

  const isUnreachedStage = (stageLabel) => {
    const name = (stageLabel || "").toLowerCase().trim();
    return name.includes("unreached");
  };

  const applyUnreachedFollowup = (unreachedStage) => {
    const nextDate = dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss");
    setDynamicIntervalInfo({
      label: "1 Day",
      attempt: null,
    });
    setFormData((prev) => ({
      ...prev,
      ...(unreachedStage
        ? {
            pipeline_stage: unreachedStage.label,
            pipeline_stage_id: unreachedStage.value,
          }
        : {}),
      next_followup: nextDate,
    }));
  };

  const applyUncontactedFollowup = async (uncontactedStage, currentLead) => {
    try {
      let disconnectedCount = 0;
      const targetId = leadId || id;
      if (targetId) {
        try {
          const res = await fetchLeadCallHistory(targetId);
          const history = res?.data?.data || [];
          disconnectedCount = history.filter(
            (item) => item.connection_status?.toLowerCase() === "disconnected"
          ).length;
        } catch (e) {
          console.warn("Could not fetch call history, fallback to 1st attempt:", e);
        }
      }

      // 1st disconnect attempt (0 prior) -> 1 hour
      // 2nd disconnect attempt (1 prior) -> 1 day
      // 3rd+ disconnect attempt (2+ prior) -> 3 weeks
      let intervalValue = 1;
      let intervalUnit = "hour";
      let intervalLabel = "1 Hour";

      if (disconnectedCount === 1) {
        intervalValue = 1;
        intervalUnit = "day";
        intervalLabel = "1 Day";
        } else if (disconnectedCount >= 2) {
        intervalValue = 3;
        intervalUnit = "days";
        intervalLabel = "3 Days";
      }
       else if (disconnectedCount >= 3) {
        intervalValue = 3;
        intervalUnit = "week";
        intervalLabel = "3 Weeks";
      }

      setDynamicIntervalInfo({
        label: intervalLabel,
        attempt: disconnectedCount + 1,
      });

      // Base date: check if lead already has a next_followup / scheduled_at date
      const prevFollowup =
        initialFollowupRef.current ||
        currentLead?.scheduled_at ||
        currentLead?.next_followup ||
        currentLead?.next_follow_up ||
        leadData?.scheduled_at ||
        leadData?.next_followup;

      const baseDate =
        prevFollowup && dayjs(prevFollowup).isValid()
          ? dayjs(prevFollowup)
          : dayjs();

      const nextCalculatedDate = baseDate.add(intervalValue, intervalUnit);

      setFormData((prev) => ({
        ...prev,
        ...(uncontactedStage
          ? {
              pipeline_stage: uncontactedStage.label,
              pipeline_stage_id: uncontactedStage.value,
            }
          : {}),
        next_followup: nextCalculatedDate.format("YYYY-MM-DD HH:mm:ss"),
      }));
    } catch (err) {
      console.error("Error calculating dynamic followup:", err);
      setFormData((prev) => ({
        ...prev,
        ...(uncontactedStage
          ? {
              pipeline_stage: uncontactedStage.label,
              pipeline_stage_id: uncontactedStage.value,
            }
          : {}),
        next_followup: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
      }));
    }
  };

  const handleQuickFollowup = (hours) => {
    const date = dayjs().add(hours, "hour");
    setDynamicIntervalInfo(null);
    setFormData((prev) => ({
      ...prev,
      next_followup: date.format("YYYY-MM-DD HH:mm:ss"),
    }));
    setErrors((prev) => ({
      ...prev,
      next_followup: "",
    }));
  };

  const getPipelineStageOptions = async () => {
    try {
      const activePipelineId =
        leadData?.pipeline_category_id ||
        leadData?.pipeline_id ||
        sessionStorage.getItem("telecalling_pipeline_selected_pipeline") ||
        0;

      const payload = {
        field: CATEGORY_ALIAS.pipeline_stage,
        opt_filter: {
          pipeline_id: Number(activePipelineId) || 0,
        },
      };

      const response = await getSelectOptions(payload);
      const allStages = response?.data?.data || [];

      // Filter stages related to disconnected
      let filtered = allStages.filter((item) => {
        const name = (item.label || "").toLowerCase().trim();
        return (
          name.includes("not connected") ||
          name.includes("unconnected") ||
          name.includes("uncontacted") ||
          name.includes("unreached")
        );
      });

      const notConnectedStage =
        filtered.find((item) => isUncontactedStage(item.label)) || allStages[0];

      let displayStages = [];
      if (filtered.length > 0) {
        displayStages = [...filtered];
      } else if (allStages.length > 0) {
        displayStages = [...allStages];
      }

      // Ensure "Uncontacted" and "Unreached" exist in options
      const hasUncontacted = displayStages.some((s) => isUncontactedStage(s.label));
      const hasUnreached = displayStages.some((s) =>
        (s.label || "").toLowerCase().includes("unreached")
      );

      if (!hasUncontacted && notConnectedStage) {
        displayStages.unshift({
          value: notConnectedStage.value,
          label: "Uncontacted",
        });
      }
      if (!hasUnreached && notConnectedStage) {
        displayStages.push({
          value: notConnectedStage.value,
          label: "Unreached",
        });
      }

      setPipelineStageOptions(displayStages);

      // 🟢 Check Call History to auto-determine initial stage & follow-up:
      let hasConnectedCall = false;
      const targetId = leadId || id;
      if (targetId) {
        try {
          const res = await fetchLeadCallHistory(targetId);
          const history = res?.data?.data || [];
          hasConnectedCall = history.some(
            (item) => item.connection_status?.toLowerCase() === "connected"
          );
        } catch (e) {
          console.warn("Could not fetch call history for auto-stage:", e);
        }
      }

      if (hasConnectedCall) {
        // ✅ 1+ Connected Calls -> Default to "Unreached" (Current Date Time + 1 Day)
        const unreachedStage =
          displayStages.find((s) => isUnreachedStage(s.label)) || displayStages[0];
        applyUnreachedFollowup(unreachedStage);
      } else {
        // ✅ 0 Connected Calls -> Default to "Uncontacted" (Dynamic Retry: 1h / 1d / 3w)
        const uncontactedStage =
          displayStages.find((s) => isUncontactedStage(s.label)) || displayStages[0];
        applyUncontactedFollowup(uncontactedStage, leadData);
      }
    } catch (error) {
      console.error("Failed to fetch pipeline stages for disconnect:", error);
    }
  };

  useEffect(() => {
    getPipelineStageOptions();
  }, [id, leadId, leadData?.pipeline_category_id]);

  const handleStageChange = (e) => {
    const val = e.target.value;
    const selected = pipelineStageOptions.find((item) => item.label === val);

    setFormData((prev) => ({
      ...prev,
      pipeline_stage: val,
      pipeline_stage_id: selected?.value || null,
    }));

    setErrors((prev) => ({
      ...prev,
      pipeline_stage: "",
    }));

    // ✅ uncontacted choose pannatha condition apply aganum next followup
    if (isUncontactedStage(val)) {
      applyUncontactedFollowup(null, leadData);
    } else if (isUnreachedStage(val)) {
      // ✅ unreached choose panna current date time oda 1 day add condition
      applyUnreachedFollowup(null);
    } else {
      setDynamicIntervalInfo(null);
      if (initialFollowupRef.current) {
        setFormData((prev) => ({
          ...prev,
          next_followup: initialFollowupRef.current,
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!hasPermission("api_call_disconnect_form")) {
      alert("Permission denied: api_call_disconnect_form");
      return;
    }
    let tempErrors = {};

    if (!formData?.pipeline_stage_id) {
      tempErrors.pipeline_stage = "Pipeline Stage is required";
    }

    if (!formData?.next_followup) {
      tempErrors.next_followup = "Next Follow Up is required";
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      return;
    }

    const payload = {
      lead_id: leadId || id,
      stage_id: formData.pipeline_stage_id,
      retry_notes: formData.retry_notes,
      next_followup: formData.next_followup,
      connection_status: "Disconnected",
    };
    localStorage.removeItem("activeCallLeadId");

    try {
      const response = await getDisconnecetdCallDetails(payload);

      if (response?.status === 201 || (response?.status >= 200 && response?.status < 300)) {
        setSuccessDialog({
          open: true,
          message: "Lead details updated successfully",
        });
        localStorage.setItem(`outcomeSaved_${leadId || id}`, "true");
        window.dispatchEvent(
          new CustomEvent("callOutcomeSaved", {
            detail: { leadId: leadId || id },
          })
        );
      }
    } catch (error) {
      console.error("Failed to update disconnected call details:", error);
    }
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: "0.5px solid #D0CCCC",
          borderRadius: "17px",
          mt: 3,
        }}
      >
        <CardContent
          sx={{
            p: 3,
          }}
        >
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 600,
              mb: 3,
            }}
          >
            <PersonOutlineOutlinedIcon
              sx={{
                color: "#97D927",
              }}
            />
            Disconnected Details
          </Typography>

          <Grid container spacing={3}>
            {/* Pipeline Stage */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Pipeline Stage
              </Typography>

              <TextField
                select
                fullWidth
                name="pipeline_stage"
                value={formData.pipeline_stage || ""}
                onChange={handleStageChange}
                error={!!errors.pipeline_stage}
                helperText={errors.pipeline_stage}
                slotProps={{
                  select: {
                    displayEmpty: true,
                    renderValue: (selected) =>
                      selected ? (
                        <span style={{ textTransform: "capitalize" }}>{selected}</span>
                      ) : (
                        <span style={{ color: "#9A9A9A" }}>Select Pipeline Stage</span>
                      ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "#F5F5F5",
                    height: "40px",
                    color: "#000000",
                  },
                }}
              >
                <MenuItem disabled value="">
                  Select Pipeline Stage
                </MenuItem>
                {pipelineStageOptions.map((item) => (
                  <MenuItem
                    key={item.value + item.label}
                    value={item.label}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Next Follow Up (Original buttons + DateTimePicker preserved) */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Next Follow Up
                </Typography>
                {dynamicIntervalInfo?.label && (
                  <Chip
                    label={
                      dynamicIntervalInfo.attempt
                        ? `Auto: ${dynamicIntervalInfo.label} (Attempt ${dynamicIntervalInfo.attempt})`
                        : `Auto: ${dynamicIntervalInfo.label}`
                    }
                    size="small"
                    sx={{
                      backgroundColor: BRAND_GREEN_LIGHT,
                      color: BRAND_GREEN_DARK,
                      fontWeight: 600,
                      fontSize: "11px",
                      border: `1px solid ${BRAND_GREEN}`,
                      height: "22px",
                    }}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {[1, 3, 6].map((hour) => (
                  <Button
                    key={hour}
                    onClick={() => handleQuickFollowup(hour)}
                    sx={{
                      width: "75px",
                      height: "35px",
                      background: "#D4E0C5",
                      color: "#222",
                      textTransform: "none",

                      "&:hover": {
                        background: "#D4E0C5",
                      },
                    }}
                  >
                    {hour} Hour
                  </Button>
                ))}

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label="Enter Manual"
                    value={
                      formData.next_followup
                        ? dayjs(formData.next_followup)
                        : null
                    }
                    onChange={(newValue) => {
                      setDynamicIntervalInfo(null);
                      setFormData((prev) => ({
                        ...prev,
                        next_followup:
                          newValue && newValue.isValid()
                            ? newValue.format("YYYY-MM-DD HH:mm:ss")
                            : "",
                      }));

                      setErrors((prev) => ({
                        ...prev,
                        next_followup: "",
                      }));
                    }}
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.next_followup,
                        helperText: errors.next_followup,
                        InputProps: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <CalendarTodayOutlinedIcon
                                sx={{
                                  fontSize: 18,
                                  color: BRAND_GREEN_DARK,
                                  cursor: "pointer",
                                }}
                              />
                            </InputAdornment>
                          ),
                        },
                        sx: {
                          width: {
                            xs: "100%",
                            lg: "325px",
                          },

                          "& .MuiPickersInputBase-root": {
                            height: "36px !important",
                            minHeight: "36px !important",
                            background: "#F5F5F5",
                            borderRadius: "5px",
                          },

                          "& .MuiInputLabel-root": {
                            top: "-9px",
                            fontSize: "14px",
                            color: "#000000",
                          },

                          "& .MuiSvgIcon-root": {
                            color: "#000000A6",
                          },
                        },
                      },

                      popper: {
                        sx: datePickerPopupSx,
                      },

                      actionBar: {
                        actions: ["cancel", "accept"],
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Grid>

            {/* Retry Notes */}
            <Grid size={{ xs: 12 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Retry Notes
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Additional notes about the call......"
                value={formData.retry_notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    retry_notes: e.target.value,
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "#F5F5F5",
                  },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: 3,
        }}
      >
        <Button
          startIcon={<SaveOutlinedIcon />}
          onClick={handleSave}
          sx={{
            bgcolor: "#97D927",
            color: "#fff",
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            height: "44px",

            "&:hover": {
              bgcolor: "#97D927",
            },
            mb: 4,
          }}
        >
          Save Call Details
        </Button>
        <ActionFeedbackModal
          open={Boolean(successDialog.open && successDialog.message)}
          type="success"
          title="Call Outcome Saved!"
          message={successDialog.message || "Lead details and call outcome updated successfully."}
          buttonText="Continue"
          onClose={() => {
            setSuccessDialog({
              open: false,
              message: "",
            });
            onCallSaved?.();
          }}
        />
      </Box>
    </>
  );
};

export default DisconnectedCall;
