import { useEffect, useState } from "react";

import {
    Box,
    Modal,
    Typography,
    TextField,
    Button,
    MenuItem,
    Checkbox,
    FormControlLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import { addPaymentDetails } from "@/apps/telecalling/services/paymentService";
import { useAuth } from "@/shared/context/AuthContext";

import dayjs from "dayjs";

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
import { getSelectOptions } from "@/shared/services/dropdownService";
import { CATEGORY_ALIAS } from "@/apps/telecalling/components/filters/popup/filterConfig";
import { selectPlaceholderProps } from "@/apps/telecalling/components/common/selectPlaceholder";

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
    "& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected": {
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

const PaymentDetailsModal = ({
    open,
    handleClose,
    leadId,
    pendingAmount = 0,
    refreshPaymentHistory,
    refreshLeadDetails,
    leadData
}) => {
    const { hasPermission } = useAuth();

    const [formData, setFormData] = useState({

        amount_paid: "",

        due_date: "",

        next_followup: "",

        notes: "",

        payment_status: "",
    });
    const [errors, setErrors] = useState({});

    const [originalPendingAmount,
        setOriginalPendingAmount] =
        useState(0);

    const [successDialog, setSuccessDialog] = useState({
        open: false,
        message: "",
    });

    const [paymentStatusOptions, setPaymentStatusOptions] = useState([]);
    const [isOutcomeSaved, setIsOutcomeSaved] = useState(true);   // ✅ ADD

    useEffect(() => {

        setOriginalPendingAmount(
            Number(pendingAmount)
        );

    }, [pendingAmount]);

    useEffect(() => {
        if (open) {
            const flag = localStorage.getItem(`outcomeSaved_${leadId}`);

            setFormData({
                paid_amount: "",
                due_date: String(leadData?.due_date ?? "").split("T")[0],
                next_followup: "",
                notes: "",
                payment_status: leadData?.payment_status ?? "",      // ✅ default seed
                payment_status_id: leadData?.payment_status_id ?? null,
            });

            setFullPayment(false);
            setErrors({});
            setIsOutcomeSaved(flag === null ? true : flag === "true");

        }
    }, [open, leadData]);

    // ✅ ADD — listen for the CallOutcomeSection save event
    useEffect(() => {
        const handleOutcomeSaved = (e) => {
            if (String(e.detail?.leadId) === String(leadId)) {
                setIsOutcomeSaved(true);
            }
        };

        window.addEventListener("callOutcomeSaved", handleOutcomeSaved);

        return () => {
            window.removeEventListener("callOutcomeSaved", handleOutcomeSaved);
        };
    }, [leadId]);

    // ✅ ADD — reset the flag every time the modal opens fresh
    useEffect(() => {
        if (open) {
            setFormData({
                paid_amount: "",
                due_date: String(leadData?.due_date ?? "").split("T")[0],
                next_followup: "",
                notes: "",
                payment_status: leadData?.payment_status ?? "",
                payment_status_id: leadData?.payment_status_id ?? null,
            });

            setFullPayment(false);
            setErrors({});
        }
    }, [open, leadData]);

    const handleQuickFollowup = (
        hours
    ) => {

        const now = new Date();

        now.setHours(
            now.getHours() + hours
        );

        const formatted =
            new Date(
                now.getTime() -
                now.getTimezoneOffset() *
                60000
            )
                .toISOString()
                .slice(0, 16);

        setFormData((prev) => ({
            ...prev,

            next_followup:
                formatted,
        }));

        // Error clear
        setErrors((prev) => ({
            ...prev,
            next_followup: "",
        }));
    };
    const [fullPayment, setFullPayment] = useState(false);

    const pendingAmountValue =
        fullPayment
            ? 0
            : originalPendingAmount -
            (Number(formData.paid_amount) || 0);
    const normalize = (val) => (val || "").toString().trim().toLowerCase().replace(/\s+/g, "");

    // ---- Auto payment status from Due Date / pending amount -------------------
    // pending = 0                -> Paid
    // due date = today           -> Today Due
    // due date in the future     -> Active Due
    // due date in the past       -> Over Due
    const deriveStatusKey = (dueDate, pending) => {
        if (pending <= 0) return "paid";
        if (!dueDate) return null;

        const due = String(dueDate).split("T")[0];
        const today = dayjs().format("YYYY-MM-DD");

        if (due === today) return "today";
        if (due > today) return "active";
        return "over";
    };

    const STATUS_MATCHERS = {
        paid: [/^paid$/, /paid/],
        today: [/^todaydue$/, /today/],
        active: [/^activedue$/, /active/],
        over: [/^overdue$/, /over/],
    };

    const findStatusOption = (key) => {
        if (!key) return null;
        for (const re of STATUS_MATCHERS[key]) {
            const hit = paymentStatusOptions.find((o) => re.test(normalize(o.label)));
            if (hit) return hit;
        }
        return null;
    };

    // returns { payment_status, payment_status_id } to merge into formData ({} if no match)
    const autoStatusFields = (dueDate, pending) => {
        const option = findStatusOption(deriveStatusKey(dueDate, pending));
        return option
            ? { payment_status: option.label, payment_status_id: option.value }
            : {};
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const id = e.target.value;
        const selected = paymentStatusOptions.find((item) => item.value === id);
        if (name === "paid_amount") {
            if (/^\d*$/.test(value)) {
                const nextPending =
                    originalPendingAmount - (Number(value) || 0);

                setFormData((prev) => ({
                    ...prev,
                    paid_amount: value,
                    ...autoStatusFields(prev.due_date, nextPending),
                }));

                // error remove
                setErrors((prev) => ({
                    ...prev,
                    paid_amount: "",
                }));
            }
            return;
        }

        if (name === "payment_status") {

            const selected = paymentStatusOptions.find(
                (item) => item.label === value
            );

            setFormData((prev) => ({
                ...prev,
                payment_status: selected?.label || "",
                payment_status_id: id,
            }));

            setErrors((prev) => ({
                ...prev,
                payment_status: "",
            }));

            return;
        }

        if (name === "due_date") {
            const nextPending =
                fullPayment
                    ? 0
                    : originalPendingAmount - (Number(formData.paid_amount) || 0);

            setFormData((prev) => ({
                ...prev,
                due_date: value,
                ...autoStatusFields(value, nextPending),
            }));

            setErrors((prev) => ({ ...prev, due_date: "", payment_status: "" }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // error remove
        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleSave = async () => {
        if (!hasPermission("api_payment_details")) {
            alert("Permission denied: api_payment_details");
            return;
        }

        // ✅ validation-a API call-கு MUNNADI move pண்ணுங்க
        const newErrors = {};

        if (!formData.paid_amount) {
            newErrors.paid_amount = "Please enter Amount Paid";
        }

        if (pendingAmountValue > 0 && !formData.due_date) {
            newErrors.due_date = "Please select Due Date";
        }

        if (!formData.next_followup) {
            newErrors.next_followup = "Please select Next Follow Up";
        }

        if (!formData.notes?.trim()) {
            newErrors.notes = "Please enter Summary";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;   // ✅ validation fail aana API call trigger aagaathu
        }

        try {

            const payload = {
                lead_id: String(leadId),
                paid_amount: String(formData.paid_amount || 0),
                pending_amount: String(pendingAmountValue < 0 ? 0 : pendingAmountValue),
                due_date: formData.due_date,
                next_followup: formData.next_followup,
                notes: formData.notes,
                payment_status: formData.payment_status ?? null,
                payment_status_id: formData.payment_status_id ?? null,
            };

            await addPaymentDetails(payload);

            refreshPaymentHistory?.();
            refreshLeadDetails?.();

            // ✅ ADD — success dialog kaatrum
            setSuccessDialog({
                open: true,
                message: "Payment details saved successfully",
            });

        } catch (err) {

            // ✅ ADD — error иருந்தா kூட user-ku kaatrum
            setErrors((prev) => ({
                ...prev,
                general: "Failed to save payment details. Please try again.",
            }));
        }
    };

    const currentPaymentStatusId =
        formData?.payment_status_id ??
        paymentStatusOptions.find(
            item => normalize(item.label) === normalize(formData?.payment_status || leadData?.payment_status)
        )?.value ??
        "";

    const getPaymentStatusOptions = async () => {
        try {
            // get_select_options payload: { field, opt_filter }
            const payload = {
                field: CATEGORY_ALIAS.payment_status,
                opt_filter: {},
            };

            const response = await getSelectOptions(payload);

            setPaymentStatusOptions(response?.data?.data || []);
        } catch (error) {
            console.error("Payment Status Options Error:", error);
            setPaymentStatusOptions([]);
        }
    };
    useEffect(() => {
        if (open) getPaymentStatusOptions();
    }, [open]);

    return (

        <>

            <Modal
                open={open}
                onClose={handleClose}
            >
                <Box
                    sx={{

                        position: "absolute",

                        top: "50%",
                        left: "50%",

                        transform:
                            "translate(-50%, -50%)",

                        width: {
                            xs: "88%",
                            sm: "500px",
                            md: "760px",
                            lg: "900px",
                        },

                        maxWidth: "95vw",

                        // Fit all fields without scrolling; only scrolls on very short screens
                        maxHeight: "94vh",

                        overflowY: "auto",

                        bgcolor: "#fff",

                        borderRadius: "17px",

                        p: {
                            xs: 2,
                            sm: 3,
                            md: 4,
                        },

                        boxShadow:
                            "0px 12px 40px rgba(0,0,0,0.18)",

                        outline: "none",

                        scrollbarWidth: "none",

                        "&::-webkit-scrollbar": {
                            display: "none",
                        },
                    }}
                >

                    {/* HEADER */}

                    <Box
                        sx={{
                            display: "flex",

                            justifyContent:
                                "space-between",

                            alignItems:
                                "center",

                            mb: "10px",
                        }}
                    >

                        <Box
                            sx={{
                                display: "flex",

                                alignItems:
                                    "center",

                                gap: 1,
                            }}
                        >

                            <PersonOutlineOutlinedIcon
                                sx={{
                                    color:
                                        "#90D916",

                                    height: "24px",

                                    width: "24px",
                                }}
                            />

                            <Typography
                                sx={{
                                    fontSize:
                                    {
                                        xs: "16px",
                                        md: "18px",
                                    },

                                    fontWeight: 600,
                                }}
                            >
                                Payment Info
                            </Typography>

                        </Box>

                        <IconButton
                            onClick={
                                handleClose
                            }
                        >
                            <CloseIcon />
                        </IconButton>

                    </Box>

                    {/* FORM */}

                    <Box
                        sx={{
                            display: "grid",

                            gridTemplateColumns:
                            {
                                xs: "1fr",
                                md: "1fr 1fr",
                            },

                            gap: "10px",
                        }}
                    >

                        {/* AMOUNT PAID */}

                        <Box>

                            <Typography
                                sx={{
                                    mb: 1,

                                    fontWeight: 600,

                                    color: "#4D4D4D",

                                    fontSize: "16px",
                                }}
                            >
                                Amount Paid
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",

                                    border:
                                        "0.5px solid #00000017",

                                    borderRadius:
                                        "5px",

                                    overflow:
                                        "hidden",

                                    background:
                                        "#F2F2F2",
                                }}
                            >

                                <Box
                                    sx={{
                                        width: "60px",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        color:
                                            "#9B9B9B",

                                        borderRight:
                                            "0.5px solid #00000017",

                                        fontWeight: 400,

                                        fontSize: "14px",
                                    }}
                                >
                                    INR
                                </Box>

                                <TextField
                                    fullWidth

                                    name="paid_amount"

                                    placeholder="Payment Amount"

                                    value={
                                        formData.paid_amount
                                    }

                                    onChange={
                                        handleChange
                                    }

                                    variant="standard"

                                    error={!!errors.paid_amount}

                                    helperText={errors.paid_amount}

                                    InputProps={{
                                        disableUnderline: true,
                                    }}

                                    sx={{

                                        px: 2,

                                        "& .MuiInputBase-root": {

                                            height: "35px",

                                            color: "#9B9B9B",

                                            fontWeight: 400,

                                            fontSize: "14px",
                                        },

                                        "& .MuiInputBase-input": {

                                            padding: 0,
                                        },

                                        "& .MuiInput-underline:before": {

                                            borderBottom: "none !important",
                                        },

                                        "& .MuiInput-underline:after": {

                                            borderBottom: "none !important",
                                        },

                                        "& .MuiInput-underline:hover:not(.Mui-disabled):before":
                                        {

                                            borderBottom:
                                                "none !important",
                                        },
                                    }}
                                />

                            </Box>

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
                                                    paid_amount:
                                                        originalPendingAmount,
                                                    ...autoStatusFields(prev.due_date, 0),
                                                }));
                                            } else {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    paid_amount: "",
                                                    ...autoStatusFields(
                                                        prev.due_date,
                                                        originalPendingAmount
                                                    ),
                                                }));
                                            }
                                        }}
                                    />
                                }

                                label={`Full Payment ₹${originalPendingAmount}`} />

                        </Box>

                        {/* PENDING */}

                        <Box>

                            <Typography
                                sx={{
                                    mb: 1,

                                    fontWeight: 600,

                                    color: "#4D4D4D",

                                    fontSize: "16px",
                                }}
                            >
                                Pending Amount
                            </Typography>

                            <TextField
                                fullWidth

                                value={`₹${pendingAmountValue < 0
                                    ? 0
                                    : pendingAmountValue
                                    }`}

                                InputProps={{
                                    readOnly: true,
                                }}

                                sx={{

                                    "& .MuiOutlinedInput-root": {

                                        height: "35px",

                                        background:
                                            "#F2F2F2",

                                        fontSize: "14px",

                                        fontWeight: 400,

                                        color: "#000000",
                                    },
                                }}
                            />

                        </Box>

                        {/* DUE DATE */}

                        <Box>

                            <Typography
                                sx={{
                                    mb: 1,

                                    fontWeight: 600,

                                    color: "#4D4D4D",

                                    fontSize: "16px",
                                }}
                            >
                                Due Date
                            </Typography>

                            <TextField
                                fullWidth

                                type="date"

                                name="due_date"

                                value={String(formData?.due_date ?? leadData?.due_date ?? "").split("T")[0]}

                                error={!!errors.due_date}

                                helperText={errors.due_date}

                                onChange={
                                    handleChange
                                }

                                sx={{

                                    "& .MuiOutlinedInput-root": {

                                        height: "35px",

                                        background:
                                            "#F2F2F2",

                                        color:
                                            "#9B9B9B",

                                        fontWeight: 400,

                                        fontSize: "14px",
                                    },
                                }}
                            />

                        </Box>

                        {/* STATUS */}

                        <Box>

                            <FieldLabel label="Payment Status" />

                            <TextField
                                select
                                fullWidth
                                name="payment_status"
                                value={currentPaymentStatusId}
                                onChange={handleChange}
                                onMouseDown={getPaymentStatusOptions}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        height: "35px",
                                        background: "#F2F2F2",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        color: "#000000",
                                        textTransform: 'capitalize'
                                    },
                                }}
                                slotProps={{
                                    select: selectPlaceholderProps(
                                        () =>
                                            formData?.payment_status ||
                                            leadData?.payment_status ||
                                            "",
                                        "Select Payment Status"
                                    ),
                                }}
                            >
                                {paymentStatusOptions.map((item) => (
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

                    </Box>

                    {/* FOLLOWUP */}

                    {/* FOLLOWUP */}

                    <Box sx={{ mt: "10px" }}>

                        <Typography sx={{ mb: 2, fontWeight: 600, color: "#4D4D4D", fontSize: "16px" }}>
                            Next Follow Up
                        </Typography>

                        {!isOutcomeSaved && (
                            <Typography sx={{ mb: 1, fontSize: "13px", color: "#D32F2F" }}>
                                Please save Call Outcome first to enable follow-up.
                            </Typography>
                        )}

                        <Box sx={{ display: "flex", gap: "16px", flexDirection: { xs: "column", lg: "row" }, alignItems: { xs: "stretch", lg: "center" } }}>

                            <Box sx={{ display: "flex", gap: "10px", width: { xs: "100%", lg: "auto" }, flexWrap: { xs: "wrap", sm: "nowrap" } }}>

                                {[1, 3, 6].map((hour) => (
                                    <Button
                                        key={hour}
                                        disabled={!isOutcomeSaved}
                                        onClick={() => handleQuickFollowup(hour)}
                                        sx={{
                                            width: { xs: "100%", sm: "144px" },
                                            height: "36px",
                                            background: "#D4E0C5",
                                            color: "#222",
                                            borderRadius: "5px",
                                            textTransform: "none",
                                            fontWeight: 400,
                                            "&.Mui-disabled": {
                                                background: "#EAEAEA",
                                                color: "#AAAAAA",
                                            },
                                        }}
                                    >
                                        {hour} Hour
                                    </Button>
                                ))}

                            </Box>
{/*
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DateTimePicker
                                    label="Enter Manual"
                                    disabled={!isOutcomeSaved}
                                    value={formData.next_followup ? dayjs(formData.next_followup) : null}
                                    onChange={(newValue) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            next_followup: newValue ? newValue.format("YYYY-MM-DDTHH:mm") : "",
                                        }));
                                        setErrors((prev) => ({ ...prev, next_followup: "" }));
                                    }}
                                    slotProps={{
                                        textField: {
                                            error: !!errors.next_followup,
                                            helperText: errors.next_followup,
                                            fullWidth: true,
                                            sx: {
                                                width: { xs: "100%", lg: "325px" },
                                                "& .MuiPickersInputBase-root": {
                                                    height: "36px !important",
                                                    minHeight: "36px !important",
                                                    borderRadius: "5px",
                                                    background: "#F2F2F2",
                                                },
                                                "& .MuiInputLabel-root": { top: "-9px", fontSize: "14px", color: "#000000" },
                                                "& .MuiSvgIcon-root": { color: "#000000A6" },
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider> */}
                             <LocalizationProvider
                                                                dateAdapter={AdapterDayjs}
                                                            >
                                                                <DateTimePicker
                                                                label="Enter Manual"
                                                                disabled={!isOutcomeSaved}
                                                                value={formData.next_followup ? dayjs(formData.next_followup) : null}
                                                                onChange={(newValue) => {
                                                                    setFormData((prev) => ({
                                                                        ...prev,
                                                                        next_followup: newValue ? newValue.format("YYYY-MM-DDTHH:mm") : "",
                                                                    }));
                                                                    setErrors((prev) => ({ ...prev, next_followup: "" }));
                                                                }}
                                                                    viewRenderers={{
                                                                        hours: renderTimeViewClock,
                                                                        minutes: renderTimeViewClock,
                                                                    }}
                                                                    slotProps={{
                                                                        textField: {
                                                                            fullWidth: true,
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

                    </Box>

                    {/* SUMMARY */}

                    <Box sx={{ mt: "20px" }}>

                        <Typography
                            sx={{
                                mb: 1,

                                fontWeight: 600,

                                color: "#4D4D4D",

                                fontSize: "16px",
                            }}
                        >
                            Summary
                        </Typography>

                        <TextField
                            fullWidth

                            multiline

                            rows={3}

                            placeholder="Additional notes about the call......"

                            name="notes"

                            error={!!errors.notes}
                            helperText={errors.notes}

                            value={
                                formData.notes
                            }

                            onChange={
                                handleChange
                            }

                            sx={{

                                "& .MuiOutlinedInput-root": {

                                    borderRadius: "5px",

                                    height: "84px",

                                    border:
                                        "0.5px solid #00000017",

                                    background:
                                        "#F2F2F2",
                                },

                                "& .MuiInputBase-input::placeholder": {

                                    color: "#A6A6A6",

                                    fontSize: "14px",

                                    opacity: 0.7,
                                },
                            }}
                        />

                    </Box>

                    {/* SAVE */}

                    <Box
                        sx={{
                            display: "flex",

                            justifyContent: {
                                xs: "center",
                                sm: "flex-end",
                            },

                            mt: 3,
                        }}
                    >

                        <Button
                            onClick={
                                handleSave
                            }

                            startIcon={
                                <SaveOutlinedIcon />
                            }

                            sx={{

                                background:
                                    "#90D916",

                                color: "#fff",

                                width: {
                                    xs: "100%",
                                    sm: "225px",
                                },

                                height: "47px",

                                borderRadius:
                                    "12px",

                                fontSize:
                                    "18px",

                                fontWeight: 400,

                                textTransform:
                                    "none",

                                "&:hover": {

                                    background:
                                        "#8BCC00",
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
                    <Typography align="center">
                        {successDialog.message}
                    </Typography>
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
                            handleClose();     // ✅ OK click pண்ணின appuram payment modal close aagum
                        }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );

};

const FieldLabel = ({
    label,
}) => {

    return (

        <Typography
            sx={{
                fontSize:
                    "16px",

                fontWeight:
                    600,

                color:
                    "#4D4D4D",

                mb: 1.2,
            }}
        >
            {label}
        </Typography>
    );
};

export default PaymentDetailsModal;
