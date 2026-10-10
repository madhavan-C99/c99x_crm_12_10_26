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

import { useEffect, useState } from "react";

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

    // reset draft state fresh every time the dialog opens

    useEffect(() => {

        if (open) {

            setDraftFromDate(initialFrom || "");

            setDraftToDate(initialTo || "");

            setIsSelectingEnd(false);

            setDateError("");

            setSelectedDate(
                initialFrom ? dayjs(initialFrom) : dayjs()
            );
        }

    }, [open, initialFrom, initialTo]);

    const handleDateChange = (newValue) => {

        setSelectedDate(newValue);

        setDateError("");

        // FROM DATE

        if (!isSelectingEnd) {

            setDraftFromDate(
                dayjs(newValue).format("YYYY-MM-DD")
            );

            setDraftToDate("");

            setIsSelectingEnd(true);

            return;
        }

        // TO DATE

        if (
            dayjs(newValue).isBefore(
                dayjs(draftFromDate)
            )
        ) {

            setDateError(
                "To date can't be before the From date"
            );

            return;
        }

        setDraftToDate(
            dayjs(newValue).format("YYYY-MM-DD")
        );
    };

    const handleRestart = () => {
        setDraftFromDate("");
        setDraftToDate("");
        setIsSelectingEnd(false);
        setDateError("");
        setSelectedDate(dayjs());
    };

    const handleApply = () => {
        if ((draftFromDate && !draftToDate) || (!draftFromDate && draftToDate)) {
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
                        Custom date range
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
                                    : "From date"
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

                        <ArrowForward sx={{ fontSize: "16px", color: "#777" }} />

                        <Chip
                            label={
                                draftToDate
                                    ? dayjs(draftToDate).format("DD MMM YYYY")
                                    : "To date"
                            }
                            sx={{
                                backgroundColor: isSelectingEnd
                                    ? accentColor
                                    : "#2B2B2B",
                                color: isSelectingEnd ? "#111" : "#EDEDED",
                                fontWeight: 600,
                                fontSize: "12px",
                            }}
                        />

                    </Stack>

                    <Typography
                        sx={{
                            mt: 1,
                            fontSize: "12px",
                            color: "#B9C2CC",
                        }}
                    >
                        {
                            !isSelectingEnd
                                ? "Step 1 of 2 — pick the start date"
                                : "Step 2 of 2 — pick the end date"
                        }
                    </Typography>

                </Box>

                {/* CALENDAR */}

                <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                >

                    <StaticDatePicker

                        displayStaticWrapperAs="desktop"

                        value={selectedDate}

                        minDate={
                            isSelectingEnd && draftFromDate
                                ? dayjs(draftFromDate)
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
                        }}

                        sx={{
                            "& .MuiPickersDay-root.Mui-selected": {
                                backgroundColor: `${accentColor} !important`,
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
                            disabled={(draftFromDate && !draftToDate) || (!draftFromDate && draftToDate)}
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
