import {
    Box,
    Button,
    Typography,
    Dialog,
    Chip,
    Stack,
    Divider,
} from "@mui/material";

import ArrowForward from "@mui/icons-material/ArrowForward";

import { useRef, useState } from "react";

import dayjs from "dayjs";

import {
    LocalizationProvider
} from "@mui/x-date-pickers/LocalizationProvider";

import {
    AdapterDayjs
} from "@mui/x-date-pickers/AdapterDayjs";

import {
    StaticDatePicker
} from "@mui/x-date-pickers/StaticDatePicker";

/**
 * CustomDateRangePicker
 * ----------------------
 * Fully self contained "From date -> To date" picker dialog.
 * Drop this into ANY page/component that needs a custom date range
 * filter — it doesn't know anything about dashboards, filters, or
 * APIs, it only asks for a from/to date and hands it back.
 *
 * PROPS
 *  - open            : boolean            -> controls dialog visibility
 *  - onClose()        : called on Cancel / backdrop click / esc
 *  - onApply(from,to)  : called with "YYYY-MM-DD" strings when user hits Apply
 *  - initialFrom       : optional "YYYY-MM-DD" to prefill (e.g. re-opening to edit)
 *  - initialTo         : optional "YYYY-MM-DD" to prefill
 *  - accentColor       : optional hex, defaults to the app's lime green
 *
 * USAGE
 *  const [openCalendar, setOpenCalendar] = useState(false);
 *
 *  <CustomDateRangePicker
 *      open={openCalendar}
 *      onClose={() => setOpenCalendar(false)}
 *      onApply={(from, to) => {
 *          setFromDate(from);
 *          setToDate(to);
 *          setOpenCalendar(false);
 *      }}
 *  />
 */
const CustomDateRangePicker = ({
    open,
    onClose,
    onApply,
    initialFrom = "",
    initialTo = "",
    accentColor = "#90D916",
    mode = "range",
    allowSingleDate = false,
}) => {

    const [selectedDate, setSelectedDate] =
        useState(dayjs());

    const [draftFromDate, setDraftFromDate] =
        useState(initialFrom);

    const [draftToDate, setDraftToDate] =
        useState(initialTo);

    const [isSelectingEnd, setIsSelectingEnd] =
        useState(false);

    const [dateError, setDateError] =
        useState("");

    const lastClickRef = useRef({ date: null, isSelectingEnd: false, time: 0 });

    // reset draft state fresh every time the dialog opens
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setDraftFromDate(initialFrom || "");
            setDraftToDate(initialTo || "");
            setIsSelectingEnd(false);
            setDateError("");
            setSelectedDate(
                initialFrom ? dayjs(initialFrom) : dayjs()
            );
        }
    }

    const handleDateChange = (newValue) => {
        if (!newValue || !dayjs(newValue).isValid()) return;

        const dateStr = dayjs(newValue).format("YYYY-MM-DD");
        const now = Date.now();

        // Prevent duplicate calls fired within 150ms for the exact same date and step
        if (
            lastClickRef.current.date === dateStr &&
            lastClickRef.current.isSelectingEnd === isSelectingEnd &&
            now - lastClickRef.current.time < 150
        ) {
            return;
        }
        lastClickRef.current = { date: dateStr, isSelectingEnd, time: now };

        setSelectedDate(newValue);
        setDateError("");

        if (mode === "single") {
            setDraftFromDate(dateStr);
            setDraftToDate(dateStr);
            setIsSelectingEnd(false);
            return;
        }

        // FROM DATE
        if (!isSelectingEnd) {
            setDraftFromDate(dateStr);
            setDraftToDate("");
            setIsSelectingEnd(true);
            return;
        }

        // TO DATE
        if (dayjs(newValue).isBefore(dayjs(draftFromDate), "day")) {
            setDateError("To date can't be before the From date");
            return;
        }

        setDraftToDate(dateStr);
    };

    const handleRestart = () => {
        setDraftFromDate("");
        setDraftToDate("");
        setIsSelectingEnd(false);
        setDateError("");
        setSelectedDate(dayjs());
        lastClickRef.current = { date: null, isSelectingEnd: false, time: 0 };
    };

    const handleApply = () => {
        if (mode === "single") {
            if (!draftFromDate) {
                setDateError("Please select a date");
                return;
            }
            onApply?.(draftFromDate, draftToDate || draftFromDate);
            return;
        }

        if (allowSingleDate) {
            if (!draftFromDate && !draftToDate) {
                setDateError("Please select a date or date range");
                return;
            }
            const from = draftFromDate || draftToDate;
            const to = draftToDate || draftFromDate;
            onApply?.(from, to);
            return;
        }

        if ((draftFromDate && !draftToDate) || (!draftFromDate && draftToDate) || (!draftFromDate && !draftToDate)) {
            setDateError("Please select both From and To dates");
            return;
        }

        onApply?.(draftFromDate, draftToDate);
    };

    return (

        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: "12px",
                    overflow: "hidden",
                },
            }}
        >

            <Box sx={{ width: { xs: "100%", sm: 360 } }}>

                {/* HEADER - step indicator + live selection preview */}

                <Box
                    sx={{
                        px: 2.5,
                        py: 2,
                        backgroundColor: "#111",
                        color: "#fff",
                    }}
                >

                    <Typography
                        sx={{
                            fontSize: "13px",
                            color: "#B9C2CC",
                            mb: 0.5,
                        }}
                    >
                        {mode === "single"
                            ? "Select date"
                            : allowSingleDate
                                ? (draftFromDate && draftToDate
                                    ? "Custom date range"
                                    : draftFromDate
                                        ? "Single date"
                                        : "Select date or range")
                                : "Custom date range"}
                    </Typography>

                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                    >

                        <Chip
                            label={
                                draftFromDate
                                    ? dayjs(draftFromDate).format("DD MMM YYYY")
                                    : (mode === "single" ? "Select date" : "From date")
                            }
                            onClick={() => {
                                setIsSelectingEnd(false);
                                setDateError("");
                            }}
                            sx={{
                                backgroundColor: !isSelectingEnd
                                    ? accentColor
                                    : "#2B2B2B",
                                color: !isSelectingEnd ? "#111" : "#EDEDED",
                                fontWeight: 600,
                                fontSize: "12px",
                                cursor: "pointer",
                            }}
                        />

                        {mode !== "single" && (
                            <>
                                <ArrowForward sx={{ fontSize: "16px", color: "#777" }} />

                                <Chip
                                    label={
                                        draftToDate
                                            ? dayjs(draftToDate).format("DD MMM YYYY")
                                            : "To date"
                                    }
                                    onClick={() => {
                                        if (draftFromDate) {
                                            setIsSelectingEnd(true);
                                            setDateError("");
                                        }
                                    }}
                                    sx={{
                                        backgroundColor: isSelectingEnd
                                            ? accentColor
                                            : "#2B2B2B",
                                        color: isSelectingEnd ? "#111" : "#EDEDED",
                                        fontWeight: 600,
                                        fontSize: "12px",
                                        cursor: draftFromDate ? "pointer" : "default",
                                    }}
                                />
                            </>
                        )}

                    </Stack>

                    {mode !== "single" && (
                        <Typography
                            sx={{
                                mt: 1,
                                fontSize: "12px",
                                color: "#B9C2CC",
                            }}
                        >
                            {allowSingleDate
                                ? (!draftFromDate
                                    ? "Pick a date — or pick start date for range"
                                    : !draftToDate
                                        ? "Single date selected — click Apply, or pick end date for range"
                                        : "Date range selected")
                                : (!isSelectingEnd
                                    ? "Step 1 of 2 — pick the start date"
                                    : "Step 2 of 2 — pick the end date")}
                        </Typography>
                    )}

                </Box>

                {/* CALENDAR */}

                <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                >

                    <StaticDatePicker

                        displayStaticWrapperAs="desktop"

                        value={
                            mode === "single"
                                ? (draftFromDate ? dayjs(draftFromDate) : selectedDate)
                                : isSelectingEnd
                                    ? (draftToDate ? dayjs(draftToDate) : null)
                                    : (draftFromDate ? dayjs(draftFromDate) : null)
                        }

                        referenceDate={
                            draftFromDate ? dayjs(draftFromDate) : selectedDate || dayjs()
                        }

                        minDate={
                            mode !== "single" && isSelectingEnd && draftFromDate
                                ? dayjs(draftFromDate).startOf("day")
                                : undefined
                        }

                        onChange={handleDateChange}

                        slotProps={{
                            actionBar: {
                                actions: [],
                            },
                            toolbar: {
                                hidden: true,
                            },
                            day: (ownerState) => {
                                const isFromDay =
                                    draftFromDate &&
                                    dayjs(ownerState.day).isSame(dayjs(draftFromDate), "day");
                                return {
                                    onClick: () => {
                                        if (!ownerState.isDayDisabled) {
                                            handleDateChange(ownerState.day);
                                        }
                                    },
                                    sx:
                                        isFromDay && isSelectingEnd && !draftToDate
                                            ? {
                                                  border: `2px solid ${accentColor} !important`,
                                                  fontWeight: 700,
                                              }
                                            : undefined,
                                };
                            },
                        }}

                        sx={{
                            "& .MuiPickersDay-root.Mui-selected": {
                                backgroundColor: `${accentColor} !important`,
                                color: "#111 !important",
                                fontWeight: 700,
                            },
                        }}
                    />

                </LocalizationProvider>

                {
                    dateError && (

                        <Typography
                            sx={{
                                textAlign: "center",
                                fontSize: "12px",
                                color: "#DC2828",
                                px: 2,
                            }}
                        >
                            {dateError}
                        </Typography>
                    )
                }

                <Divider />

                {/* FOOTER ACTIONS */}

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 2, py: 1.5 }}
                >

                    <Button
                        onClick={handleRestart}
                        size="small"
                        sx={{
                            textTransform: "none",
                            color: "#555",
                        }}
                    >
                        Reset
                    </Button>

                    <Stack direction="row" spacing={1}>

                        <Button
                            onClick={onClose}
                            size="small"
                            sx={{
                                textTransform: "none",
                                color: "#555",
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleApply}
                            size="small"
                            variant="contained"
                            disabled={
                                mode === "single"
                                    ? !draftFromDate
                                    : allowSingleDate
                                        ? !draftFromDate && !draftToDate
                                        : (draftFromDate && !draftToDate) || (!draftFromDate && draftToDate)
                            }
                            sx={{
                                textTransform: "none",
                                backgroundColor: accentColor,
                                color: "#111",
                                fontWeight: 600,
                                "&:hover": {
                                    backgroundColor: accentColor,
                                    filter: "brightness(0.92)",
                                },
                                "&.Mui-disabled": {
                                    backgroundColor: "#E0E0E0",
                                },
                            }}
                        >
                            Apply
                        </Button>

                    </Stack>

                </Stack>

            </Box>

        </Dialog>
    );
};

export default CustomDateRangePicker;
