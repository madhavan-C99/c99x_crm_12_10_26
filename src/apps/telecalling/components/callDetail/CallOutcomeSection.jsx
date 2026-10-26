import { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { getConnecetdCallDetails } from "@/apps/telecalling/services/connectedCallService";
import {
    LocalizationProvider,
} from "@mui/x-date-pickers/LocalizationProvider";

import {
    AdapterDayjs,
} from "@mui/x-date-pickers/AdapterDayjs";

import {
    DateTimePicker,
} from "@mui/x-date-pickers/DateTimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";

import dayjs from "dayjs";
import { useAuth } from "@/shared/context/AuthContext";
import { getSelectOptions } from "@/shared/services/dropdownService";
import { CATEGORY_ALIAS } from "@/shared/components/filters/popup/filterConfig";
import { fetchOneLead } from "@/apps/telecalling/services/fetchOneLeadService";
import { LossDetailsModal } from "@/apps/telecalling/components/leadForm/LossDetailsModal";
import WonDetailsModal from "@/apps/telecalling/components/leadForm/WonDetailsModal";

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
    "&:hover": { background: BRAND_GREEN_LIGHT },
    "&.Mui-disabled": { color: "#CCCCCC" },
  },

  "& .MuiDayCalendar-weekDayLabel": {
    color: "#9A9A9A",
    fontWeight: 600,
    fontSize: "12px",
  },

  "& .MuiPickersDay-root": {
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#333",
    "&:hover": { background: BRAND_GREEN_LIGHT },
    "&:focus.Mui-selected": { background: BRAND_GREEN },
  },
  "& .MuiPickersDay-today": {
    border: `1.5px solid ${BRAND_GREEN} !important`,
  },
  "& .MuiPickersDay-root.Mui-selected": {
    background: `${BRAND_GREEN} !important`,
    color: "#FFFFFF !important",
    fontWeight: 700,
    "&:hover": { background: `${BRAND_GREEN_DARK} !important` },
  },

  "& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton": {
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    "&:hover": { background: BRAND_GREEN_LIGHT },
  },
  "& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected":
    {
      background: `${BRAND_GREEN} !important`,
      color: "#FFFFFF !important",
      fontWeight: 700,
      "&:hover": { background: `${BRAND_GREEN_DARK} !important` },
    },

  "& .MuiClock-clock": {
    background: "#F5F8EF",
  },
  "& .MuiClock-pin": {
    background: `${BRAND_GREEN} !important`,
  },
  "& .MuiClockPointer-root": {
    background: `${BRAND_GREEN} !important`,
  },
  "& .MuiClockPointer-thumb": {
    border: `14px solid ${BRAND_GREEN} !important`,
    background: "#FFFFFF !important",
  },
  "& .MuiClockNumber-root": {
    fontSize: "13px",
    fontWeight: 500,
    color: "#333",
  },
  "& .MuiClockNumber-root.Mui-selected": {
    color: "#FFFFFF !important",
    fontWeight: 700,
  },

  "& .MuiTimeClock-meridiemText, & .MuiPickersToolbarButton-root": {
    color: "#333",
  },

  "& .MuiDateTimePickerTabs-root": {
    borderBottom: "1px solid #EEEEEE",
    "& .MuiTab-root": {
      color: "#9A9A9A",
      minHeight: "44px",
    },
    "& .MuiTab-root.Mui-selected": {
      color: BRAND_GREEN_DARK,
    },
    "& .MuiTabs-indicator": {
      background: BRAND_GREEN,
    },
  },

  "& .MuiPickersLayout-actionBar, & .MuiDialogActions-root": {
    px: 2,
    pb: 1.5,
    pt: 0.5,
    "& .MuiButton-root": {
      textTransform: "none",
      fontWeight: 600,
      fontSize: "13px",
      borderRadius: "6px",
      minWidth: "72px",
    },
    // last button = "OK" / accept — filled brand green
    "& .MuiButton-root:last-of-type": {
      background: BRAND_GREEN,
      color: "#FFFFFF",
      "&:hover": { background: BRAND_GREEN_DARK },
    },
    // first button = "Cancel" — quiet outline
    "& .MuiButton-root:first-of-type": {
      color: "#666666",
      "&:hover": { background: "#F2F2F2" },
    },
  },
};

const CallOutcomeSection = ({
  status,
  duration,
  leadId,
  leadData,
  onCallSaved,
}) => {
  const { hasPermission } = useAuth();
  const [conversationOutcome, setConversationOutcome] = useState("Interested");

  const [keyObjective, setKeyObjective] = useState("Fees");

  const [summary, setSummary] = useState("");

  const [recording, setRecording] = useState(null);

  const [followUpDate, setFollowUpDate] = useState(null);

  const handleQuickFollowup = (hours) => {
    const nextDate = dayjs().add(hours, "hour");

    setFollowUpDate(nextDate);
  };
  const [conversationStageOptions, setConversationStageOptions] = useState([]);

  const [conversationFormData, setConversationFormData] = useState({
    conversation_stage: "",
    conversation_stage_id: null,
  });
  const [openWonModal, setOpenWonModal] = useState(false);
  const [selectTagOptions, setSelectTagOptions] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState(null);

  const [errors, setErrors] = useState({
    select_tag: "",
    conversation_stage: "",
  });
  const [tagOpen, setTagOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: "",
  });
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: "",
  });
  useEffect(() => {
    const pId =
      leadData?.pipeline_category_id ||
      sessionStorage.getItem("telecalling_pipeline_selected_pipeline") ||
      "";
    getConversationStageOptions(pId);
  }, [leadData?.pipeline_category_id]);
  const [openLossModal, setOpenLossModal] = useState(false);
  useEffect(() => {
    const loadSavedOutcome = async () => {
      try {
        let currentLead = leadData;

        // If leadData is not passed from parent, fetch using leadId
        if (!currentLead && leadId) {
          const response = await fetchOneLead(leadId);
          currentLead = response?.data?.data?.[0] || response?.data?.[0];
        }

        if (currentLead) {
          const pId =
            currentLead.pipeline_category_id ||
            leadData?.pipeline_category_id ||
            sessionStorage.getItem("telecalling_pipeline_selected_pipeline") ||
            "";
          // 1. Stage Options-ஐ அந்த Pipeline-க்கு Fetch பண்ணுகிறோம்
          const stageRes = await getSelectOptions({
              field: CATEGORY_ALIAS.pipeline_stage,
              opt_filter: {
                pipeline_id: pId || 0,

            },
          });
          const stages = stageRes?.data?.data || [];
          // 🟢 Call Not Connected ஆகியவற்றை Dropdown-ல் இருந்து மறைக்க:
          const filteredStages = stages.filter(
            (item) =>
              !["call not connected"].includes(
                item.label?.toLowerCase()?.trim(),
              ),
          );
          setConversationStageOptions(filteredStages);

          // 2. Save செய்யப்பட்ட Stage ID-க்கு பொருத்தமான Label-ஐ கண்டுபிடிக்கிறோம்
          const savedStageId =
            currentLead.pipeline_stage_id || currentLead.stage_id;
          const matchedStage = stages.find(
            (s) => Number(s.value) === Number(savedStageId),
          );

          if (matchedStage) {
            setConversationFormData({
              conversation_stage: matchedStage.label,
              conversation_stage_id: matchedStage.value,
            });

            // 3. அந்த Stage-க்கு உரிய Tag Options-ஐ Fetch பண்ணுகிறோம்
            const tagRes = await getSelectOptions({
              field: CATEGORY_ALIAS.priority,
                opt_filter: {
                  pipeline_id: pId || 0,
                  pipeline_stage_id: matchedStage.value || 0,
            },
            });
            const tags = tagRes?.data?.data || [];
            setSelectTagOptions(tags);

            // 4. Save செய்யப்பட்ட Tag ID-க்கு பொருத்தமான Label-ஐ கண்டுபிடிக்கிறோம்
            const savedTagId =
              currentLead.priority_id || currentLead.select_tag_id;
            const matchedTag = tags.find(
              (t) => Number(t.value) === Number(savedTagId),
            );

            if (matchedTag) {
              setKeyObjective(matchedTag.label);
              setSelectedTagId(matchedTag.value);
            }
          }
        }
      } catch (error) {
        console.error("Error loading previous lead outcome:", error);
      }
    };

    loadSavedOutcome();
  }, [leadId, leadData]);

  useEffect(() => {
    if (conversationFormData.conversation_stage_id) {
      getSelectTagOptions();
    } else {
      setSelectTagOptions([]);
      setKeyObjective("");
      setSelectedTagId(null);
    }
  }, [conversationFormData.conversation_stage_id]);

  useEffect(() => {
    if (leadId && status) {
      localStorage.setItem(`outcomeSaved_${leadId}`, "false");
    }
  }, [leadId, status]);
  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      height: "35px",
      backgroundColor: "#F2F2F2",
      borderRadius: "4px",

      "& fieldset": {
        border: "1px solid #E5E5E5",
      },

      "&:hover fieldset": {
        border: "1px solid #E5E5E5",
      },

      "&.Mui-focused fieldset": {
        border: "1px solid #97D927",
      },
    },

    "& .MuiSelect-select": {
      paddingTop: "10px",
      paddingBottom: "10px",
    },
  };

  const handleFollowUp = (hours) => {
    const date = new Date();

    date.setHours(date.getHours() + hours);

    const formatted = date.toLocaleString();

    setFollowUpDate(formatted);
  };
  const handleSave = async () => {
    if (!hasPermission("api_call_connect_form")) {
      setErrorDialog({
        open: true,
        message: "Permission denied: api_call_connect_form",
      });
      return;
    }

    // ✅ Mandatory validation for Pipeline Stage and Priority
    let tempErrors = {};

    if (!conversationFormData.conversation_stage_id) {
      tempErrors.conversation_stage = "Pipeline Stage is required";
    }

    if (isStageSelected && selectTagOptions.length > 0 && !selectedTagId) {
      tempErrors.select_tag = "Priority is required";
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      setErrorDialog({
        open: true,
        message:
          "Please fill the mandatory fields (Pipeline Stage & Priority) before saving call details.",
      });
      return; // ✅ API call trigger aagaathu
    }

    const formData = new FormData();

    formData.append("lead_id", leadId);

    formData.append("connection_status", status);

    formData.append("stage_id", conversationFormData.conversation_stage_id);
    formData.append("call_duration", duration);

    formData.append("select_tag_id", selectedTagId || "");

    formData.append("call_summary", summary);

    formData.append(
      "next_followup",
      followUpDate ? followUpDate.format("YYYY-MM-DD HH:mm:ss") : "",
    );

    if (recording) {
      formData.append("upload_record", recording);
    }

    try {
      const response = await getConnecetdCallDetails(formData);

      if (response?.status >= 200 && response?.status < 300) {
        setSuccessDialog({
          open: true,
          message: "Lead details updated successfully",
        });

        // ✅ outcome successfully saved-nu mark pண்ணுங்க
        localStorage.setItem(`outcomeSaved_${leadId}`, "true");

        window.dispatchEvent(
          new CustomEvent("callOutcomeSaved", {
            detail: { leadId },
          }),
        );
      }
    } catch (error) {

      if (error?.response?.data?.detail) {
        setErrorDialog({
          open: true,
          message: error.response.data.detail,
        });

        return;
      }

      setErrorDialog({
        open: true,
        message: "Something went wrong.",
      });
    }
  };
  const getConversationStageOptions = async (pId) => {
    try {
      const activePipelineId =
        pId ||
        leadData?.pipeline_category_id ||
        sessionStorage.getItem("telecalling_pipeline_selected_pipeline") ||
        "";

      const payload = {
          field: CATEGORY_ALIAS.pipeline_stage,
              opt_filter: {
                pipeline_id: activePipelineId || 0,
      }
    }

      const response = await getSelectOptions(payload);

      const filtered = (response.data.data || []).filter(
        (item) =>
          !["call not connected"].includes(
            item.label?.toLowerCase()?.trim(),
          ),
      );
      setConversationStageOptions(filtered);
    } catch (error) {
    }
  };

  const getSelectTagOptions = async (
  stageId = conversationFormData.conversation_stage_id
) => {
  if (!stageId) {
    setSelectTagOptions([]);
    setKeyObjective("");
    setSelectedTagId(null);
    return;
  }

  try {
    const activePipelineId =
      leadData?.pipeline_category_id ||
      sessionStorage.getItem(
        "telecalling_pipeline_selected_pipeline"
      ) ||
      "";

    const payload = {
      field: CATEGORY_ALIAS.priority,

      opt_filter: {
        pipeline_id: Number(activePipelineId) || 0,
        pipeline_stage_id: Number(stageId) || 0,
      },
    };

    const response = await getSelectOptions(payload);

    const tags = response?.data?.data || [];

    setSelectTagOptions(tags);

    // Tags இல்லையென்றால் old selection clear
    if (tags.length === 0) {
      setKeyObjective("");
      setSelectedTagId(null);
    }

  } catch (error) {
    console.error(
      "Error fetching priority tags:",
      error
    );

    setSelectTagOptions([]);
    setKeyObjective("");
    setSelectedTagId(null);
  }
};

useEffect(() => {
  if (conversationFormData.conversation_stage_id) {
    getSelectTagOptions(
      conversationFormData.conversation_stage_id
    );
  } else {
    setSelectTagOptions([]);
    setKeyObjective("");
    setSelectedTagId(null);
  }
}, [
  conversationFormData.conversation_stage_id
]);

  const isStageSelected = !!conversationFormData.conversation_stage_id;
  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: "1px solid #D6D6D6",
          borderRadius: "18px",
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: 4,
          }}
        >
          {/* Header */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 4,
            }}
          >
            <PersonOutlineOutlinedIcon
              sx={{
                color: "#97D927",
                fontSize: 24,
              }}
            />

            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              Call Outcome
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Conversation Outcome */}

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                sx={{
                  mb: "11px",
                  fontWeight: 600,
                  color: "#4D4D4D",
                }}
              >
                Pipeline Stage
              </Typography>

              <TextField
                select
                fullWidth
                value={conversationFormData.conversation_stage}
                onChange={(e) => {
                  const value = e.target.value;

                  const selected = conversationStageOptions.find(
                    (item) => item.label === value,
                  );

                  setConversationFormData({
                    conversation_stage: value,
                    conversation_stage_id: selected?.value || null,
                  });
                  if (value?.toLowerCase() === "won") {
                    setOpenWonModal(true);
                  }
                  if (value?.toLowerCase() === "loss") {
                    setOpenLossModal(true);
                  }
                  // reset tag
                  setKeyObjective("");
                  setSelectedTagId(null);

                  // ✅ ADD — error udanடே clear pண்ணுங்க
                  setErrors((prev) => ({
                    ...prev,
                    conversation_stage: "",
                  }));
                }}
                SelectProps={{
                  MenuProps: {
                    disableAutoFocusItem: true,
                    MenuListProps: {
                      autoFocus: false,
                    },
                  },
                }}
                error={!!errors.conversation_stage}
                helperText={errors.conversation_stage}
                sx={inputStyle}
              >
                {conversationStageOptions.map((item) => (
                  <MenuItem key={item.value} value={item.label}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Priority */}

<Grid size={{ xs: 12, md: 6 }}>
  <Typography
    sx={{ mb: "11px", fontWeight: 600, color: "#4D4D4D" }}
  >
    Tag
  </Typography>

  <TextField
    select
    fullWidth
    value={keyObjective || ""}
    disabled={!isStageSelected || selectTagOptions.length === 0}
    error={!!errors.select_tag}
    helperText={
      !isStageSelected
        ? "Please choose Pipeline Stage first"
        : selectTagOptions.length === 0
          ? "No priority tags available for this stage"
          : errors.select_tag
    }
    onChange={(e) => {
      const value = e.target.value;

      const selected = selectTagOptions.find(
        (item) => item.label === value,
      );

      setKeyObjective(value);
      setSelectedTagId(selected?.value || null);

      setErrors((prev) => ({
        ...prev,
        select_tag: "",
      }));
    }}
    slotProps={{
      select: {
        displayEmpty: true,
        renderValue: (selected) =>
          selected ? (
            <span style={{ textTransform: "capitalize" }}>{selected}</span>
          ) : (
            <span style={{ color: "#9A9A9A" }}>Select Tag</span>
          ),
        MenuProps: {
          disableAutoFocusItem: true,
          MenuListProps: { autoFocus: false },
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          transformOrigin: { vertical: "top", horizontal: "left" },
        },
      },
    }}
    sx={{
      ...inputStyle,
      opacity:
        !isStageSelected || selectTagOptions.length === 0 ? 0.6 : 1,
    }}
  >
    {selectTagOptions.length === 0 ? (
      <MenuItem value="" disabled>
        No tags available
      </MenuItem>
    ) : (
      selectTagOptions.map((item) => (
        <MenuItem
          key={item.value}
          value={item.label}
          sx={{ textTransform: "capitalize" }}
        >
          {item.label}
        </MenuItem>
      ))
    )}
  </TextField>
</Grid>
            {/* Follow Up */}
            <Grid size={{ xs: 12 }}>
              <Typography
                sx={{
                  mb: "11px",
                  fontWeight: 600,
                  color: "#4D4D4D",
                }}
              >
                Next Follow Up
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: "16px",
                  flexDirection: {
                    xs: "column",
                    lg: "row",
                  },
                  alignItems: {
                    xs: "stretch",
                    lg: "center",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "12px",
                    width: {
                      xs: "100%",
                      lg: "auto",
                    },
                    flexWrap: {
                      xs: "wrap",
                      sm: "nowrap",
                    },
                  }}
                >
                  {[1, 3, 6].map((hour) => (
                    <Button
                      key={hour}
                      onClick={() => handleQuickFollowup(hour)}
                      sx={{
                        width: {
                          xs: "100%",
                          sm: "120px",
                        },
                        height: "36px",
                        background: "#D4E0C5",
                        color: "#222",
                        borderRadius: "5px",
                        textTransform: "none",
                        fontWeight: 500,

                        "&:hover": {
                          background: "#D4E0C5",
                        },
                      }}
                    >
                      {hour} Hour
                    </Button>
                  ))}
                </Box>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label="Enter Manual"
                    value={followUpDate}
                    onChange={(newValue) => {
                      setFollowUpDate(newValue);
                    }}
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <CalendarTodayOutlinedIcon
                                sx={{ fontSize: 18, color: BRAND_GREEN_DARK }}
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
                            color: "#000000A6", // your color
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

            {/* Summary */}

            <Grid size={{ xs: 12 }}>
              <Typography
                sx={{
                  mb: "11px",
                  fontWeight: 600,
                  color: "#4D4D4D",
                }}
              >
                Conversation Summary
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Additional notes about the call......"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "5px",

                    height: "84px",

                    background: "#F2F2F2",
                  },
                  "& fieldset": {
                    border: "0.5px solid #00000017",
                  },

                  "&:hover fieldset": {
                    border: "0.5px solid #00000017",
                  },

                  "&.Mui-focused fieldset": {
                    border: "0.5px solid #00000017",
                  },

                  "& .MuiInputBase-input::placeholder": {
                    color: "#A6A6A6",

                    fontSize: "14px",

                    opacity: 0.7,
                  },
                }}
              />
            </Grid>

            {/* Upload Recording */}

            <Grid size={{ xs: 12 }}>
              <Typography
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: "#555",
                }}
              >
                Upload Recording
              </Typography>

              <Box
                sx={{
                  position: "relative",
                  height: "169px",
                  border: "1px solid #00000017",
                  borderRadius: "5px",
                  background: "#F2F2F2",
                }}
              >
                {/* Center Content */}

                <Box
                  sx={{
                    position: "absolute",
                    top: {
                      xs: "35%",
                      sm: "50%",
                    },
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "7px",
                    textAlign: "center",
                    px: 2,
                    width: "100%",
                    maxWidth: "300px",
                  }}
                >
                  <CloudUploadOutlinedIcon
                    sx={{
                      fontSize: 33,
                      color: "#111",
                    }}
                  />

                  <Typography
                    sx={{
                      color: "#909090",
                    }}
                  >
                    Drag/ Drop your file here
                  </Typography>
                </Box>

                {/* Bottom Left */}

                <Box
                  sx={{
                    position: "absolute",
                    left: {
                      xs: 12,
                      sm: 30,
                    },
                    right: {
                      xs: 12,
                      sm: "auto",
                    },
                    bottom: {
                      xs: "5px",
                      md: "24px",
                    },
                    display: "flex",
                    flexDirection: {
                      xs: "column",
                      sm: "row",
                    },
                    alignItems: {
                      xs: "stretch",
                      sm: "center",
                    },
                    gap: 1.5,
                  }}
                >
                  <Button
                    component="label"
                    sx={{
                      bgcolor: "#90D916",
                      color: "#FFFFFF",
                      minWidth: "112px",
                      height: "28px",
                      borderRadius: "4px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "16px",
                      px: 2,

                      "&:hover": {
                        bgcolor: "#97D927",
                      },
                    }}
                  >
                    Choose File
                    <input
                      hidden
                      type="file"
                      onChange={(e) => setRecording(e.target.files[0])}
                    />
                  </Button>

                  <Typography
                    sx={{
                      color: "#000000",
                      wordBreak: "break-word",
                      textAlign: "center",
                    }}
                  >
                    {recording ? recording.name : "No File Choosen"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Save Button */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: 3,
        }}
      >
        <Button
          onClick={handleSave}
          startIcon={<SaveOutlinedIcon />}
          sx={{
            width: "225px",
            height: "47px",
            background: "#90D916",
            color: "#fff",
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "18px",
            fontWeight: 600,

            "&:hover": {
              background: "#97D927",
            },
            mb: 7,

            "& .MuiButton-startIcon svg": {
              fontSize: "24px",
            },
          }}
        >
          Save Call Details
        </Button>
        <Dialog
          open={errorDialog.open}
          onClose={() =>
            setErrorDialog({
              open: false,
              message: "",
            })
          }
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Message</DialogTitle>

          <DialogContent>
            <Typography>{errorDialog.message}</Typography>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => {
                setErrorDialog({
                  open: false,
                  message: "",
                });
              }}
              variant="contained"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={Boolean(successDialog.open && successDialog.message)}
          onClose={() =>
            setSuccessDialog({
              open: false,
              message: "",
            })
          }
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            Success
          </DialogTitle>

          <DialogContent>
            <Typography sx={{ textAlign: "center" }}>
              {successDialog.message}
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              pb: 2,
            }}
          >
            <Button
              onClick={() => {
                setSuccessDialog({
                  open: false,
                  message: "",
                });

                onCallSaved();
              }}
              variant="contained"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        <WonDetailsModal
          open={openWonModal}
          handleClose={() => setOpenWonModal(false)}
          leadData={leadData}
          pipelineId={leadData?.pipeline_category_id || sessionStorage.getItem("telecalling_pipeline_selected_pipeline")}
        />
        {/* ✅ Loss Lead Detail Modal */}
        <LossDetailsModal
          open={openLossModal}
          handleClose={() => setOpenLossModal(false)}
          leadData={leadData}
          pipelineId={leadData?.pipeline_category_id || sessionStorage.getItem("telecalling_pipeline_selected_pipeline")}
        />
      </Box>
    </>
  );
};

export default CallOutcomeSection;
