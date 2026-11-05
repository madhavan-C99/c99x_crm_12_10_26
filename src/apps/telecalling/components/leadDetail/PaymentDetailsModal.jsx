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

} from "@mui/material";



import CloseIcon from "@mui/icons-material/Close";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import ActionFeedbackModal from "@/apps/telecalling/components/common/ActionFeedbackModal";

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



    // ✅ Fix 1: Initial state key matched to paid_amount

    const [formData, setFormData] = useState({

        paid_amount: "",

        due_date: "",

        next_followup: "",

        notes: "",

        payment_status: "",

        payment_status_id: null,

    });

    const [errors, setErrors] = useState({});



    const [originalPendingAmount, setOriginalPendingAmount] = useState(0);



    const [successDialog, setSuccessDialog] = useState({

        open: false,

        message: "",

    });



    // ✅ Fix 2: Error Dialog state enabled

    const [errorDialog, setErrorDialog] = useState({

        open: false,

        message: "",

    });



    const [paymentStatusOptions, setPaymentStatusOptions] = useState([]);

    const [isOutcomeSaved, setIsOutcomeSaved] = useState(true);

    const [fullPayment, setFullPayment] = useState(false);



    useEffect(() => {

        setOriginalPendingAmount(Number(pendingAmount));

    }, [pendingAmount]);



    // ✅ Clean single useEffect on modal open

    useEffect(() => {

        if (open) {

            const flag = localStorage.getItem(`outcomeSaved_${leadId}`);



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

            setIsOutcomeSaved(flag === null ? true : flag === "true");

        }

    }, [open, leadData, leadId]);



    // Listen for CallOutcomeSection save event

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



    const handleQuickFollowup = (hours) => {

        const now = new Date();

        now.setHours(now.getHours() + hours);



        const formatted = new Date(

            now.getTime() - now.getTimezoneOffset() * 60000

        )

            .toISOString()

            .slice(0, 16);



        setFormData((prev) => ({

            ...prev,

            next_followup: formatted,

        }));



        setErrors((prev) => ({

            ...prev,

            next_followup: "",

        }));

    };



    const pendingAmountValue = fullPayment

        ? 0

        : originalPendingAmount - (Number(formData.paid_amount) || 0);



    const normalize = (val) => (val || "").toString().trim().toLowerCase().replace(/\s+/g, "");



    // Auto payment status from Due Date / pending amount

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



    const autoStatusFields = (dueDate, pending) => {

        const option = findStatusOption(deriveStatusKey(dueDate, pending));

        return option

            ? { payment_status: option.label, payment_status_id: option.value }

            : {};

    };



    const handleChange = (e) => {

        const { name, value } = e.target;



        if (name === "paid_amount") {

            if (/^\d*$/.test(value)) {

                const nextPending = originalPendingAmount - (Number(value) || 0);



                setFormData((prev) => ({

                    ...prev,

                    paid_amount: value,

                    ...autoStatusFields(prev.due_date, nextPending),

                }));



                setErrors((prev) => ({

                    ...prev,

                    paid_amount: "",

                }));

            }

            return;

        }



        // ✅ Fix 3: Match by value (ID) rather than label

        if (name === "payment_status") {

            const selected = paymentStatusOptions.find(

                (item) => String(item.value) === String(value)

            );



            setFormData((prev) => ({

                ...prev,

                payment_status: selected?.label || "",

                payment_status_id: selected?.value || value,

            }));



            setErrors((prev) => ({

                ...prev,

                payment_status: "",

            }));



            return;

        }



        if (name === "due_date") {

            const nextPending = fullPayment

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

            return;

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



            setSuccessDialog({

                open: true,

                message: "Payment details saved successfully",

            });

        } catch (err) {

            // ✅ Fix 4: Error dialog will popup on failure

            setErrorDialog({

                open: true,

                message: err?.response?.data?.message || err?.message || "Failed to save payment details. Please try again.",

            });

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

            <Modal open={open} onClose={handleClose}>

                <Box

                    sx={{

                        position: "absolute",

                        top: "50%",

                        left: "50%",

                        transform: "translate(-50%, -50%)",

                        width: {

                            xs: "92%",

                            sm: "520px",

                            md: "760px",

                            lg: "880px",

                        },

                        maxWidth: "95vw",

                        maxHeight: "90vh",

                        display: "flex",

                        flexDirection: "column",

                        bgcolor: "#fff",

                        borderRadius: "16px",

                        boxShadow: "0px 16px 48px rgba(0,0,0,0.18)",

                        outline: "none",

                        overflow: "hidden",

                    }}

                >

                    {/* HEADER */}

                    <Box

                        sx={{

                            display: "flex",

                            justifyContent: "space-between",

                            alignItems: "center",

                            px: { xs: 2.5, sm: 3.5 },

                            py: 2,

                            borderBottom: "1px solid #F0F0F0",

                            flexShrink: 0,

                        }}

                    >

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

                            <PersonOutlineOutlinedIcon

                                sx={{

                                    color: "#90D916",

                                    height: "24px",

                                    width: "24px",

                                }}

                            />

                            <Typography

                                sx={{

                                    fontSize: {

                                        xs: "16px",

                                        md: "18px",

                                    },

                                    fontWeight: 600,

                                }}

                            >

                                Payment Info

                            </Typography>

                        </Box>



                        <IconButton onClick={handleClose}>

                            <CloseIcon />

                        </IconButton>

                    </Box>



                    {/* SCROLLABLE BODY */}

                    <Box

                        sx={{

                            flex: 1,

                            overflowY: "auto",

                            px: { xs: 2.5, sm: 3.5 },

                            py: 2.5,

                            "&::-webkit-scrollbar": {

                                width: "6px",

                            },

                            "&::-webkit-scrollbar-thumb": {

                                background: "#CBD5E1",

                                borderRadius: "4px",

                            },

                        }}

                    >

                    {/* FORM */}

                    <Box

                        sx={{

                            display: "grid",

                            gridTemplateColumns: {

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

                                    border: "0.5px solid #00000017",

                                    borderRadius: "5px",

                                    overflow: "hidden",

                                    background: "#F2F2F2",

                                }}

                            >

                                <Box

                                    sx={{

                                        width: "60px",

                                        display: "flex",

                                        alignItems: "center",

                                        justifyContent: "center",

                                        color: "#9B9B9B",

                                        borderRight: "0.5px solid #00000017",

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

                                    value={formData.paid_amount}

                                    onChange={handleChange}

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

                                        "& .MuiInput-underline:hover:not(.Mui-disabled):before": {

                                            borderBottom: "none !important",

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

                                                    paid_amount: originalPendingAmount,

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

                                label={`Full Payment ₹${originalPendingAmount}`}

                            />

                        </Box>



                        {/* PENDING AMOUNT */}

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

                                value={`₹${pendingAmountValue < 0 ? 0 : pendingAmountValue}`}

                                InputProps={{

                                    readOnly: true,

                                }}

                                sx={{

                                    "& .MuiOutlinedInput-root": {

                                        height: "35px",

                                        background: "#F2F2F2",

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

                                onChange={handleChange}

                                sx={{

                                    "& .MuiOutlinedInput-root": {

                                        height: "35px",

                                        background: "#F2F2F2",

                                        color: "#9B9B9B",

                                        fontWeight: 400,

                                        fontSize: "14px",

                                    },

                                }}

                            />

                        </Box>



                        {/* PAYMENT STATUS */}

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

                                        textTransform: "capitalize",

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



                    {/* FOLLOW UP */}

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
                                                    color: "#000000A6",
                                                },
                                            },
                                        },
                                        popper: {
                                            sx: datePickerPopupSx,
                                            placement: "bottom-end",
                                            modifiers: [
                                                {
                                                    name: "offset",
                                                    options: {
                                                        offset: [0, 8],
                                                    },
                                                },
                                                {
                                                    name: "flip",
                                                    options: {
                                                        fallbackPlacements: ["top-end", "bottom-end", "left", "left-start"],
                                                    },
                                                },
                                                {
                                                    name: "preventOverflow",
                                                    options: {
                                                        boundary: "viewport",
                                                        padding: 16,
                                                    },
                                                },
                                            ],
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

                            value={formData.notes}

                            onChange={handleChange}

                            sx={{

                                "& .MuiOutlinedInput-root": {

                                    borderRadius: "5px",

                                    height: "84px",

                                    border: "0.5px solid #00000017",

                                    background: "#F2F2F2",

                                },

                                "& .MuiInputBase-input::placeholder": {

                                    color: "#A6A6A6",

                                    fontSize: "14px",

                                    opacity: 0.7,

                                },

                            }}

                        />

                    </Box>



                    </Box>



                    {/* STICKY FOOTER */}

                    <Box

                        sx={{

                            px: { xs: 2.5, sm: 3.5 },

                            py: 1.8,

                            borderTop: "1px solid #F0F0F0",

                            bgcolor: "#FAFAFA",

                            display: "flex",

                            justifyContent: {

                                xs: "center",

                                sm: "flex-end",

                            },

                            flexShrink: 0,

                        }}

                    >

                        <Button

                            onClick={handleSave}

                            startIcon={<SaveOutlinedIcon />}

                            sx={{

                                background: "#90D916",

                                color: "#fff",

                                width: {

                                    xs: "100%",

                                    sm: "220px",

                                },

                                height: "44px",

                                borderRadius: "10px",

                                fontSize: "16px",

                                fontWeight: 600,

                                textTransform: "none",

                                boxShadow: "0 4px 14px rgba(144, 217, 22, 0.35)",

                                "&:hover": {

                                    background: "#7CB342",

                                },

                            }}

                        >

                            Save Lead Details

                        </Button>

                    </Box>

                </Box>

            </Modal>



            {/* ✅ Action Feedback Popup for Payment Saved */}

            <ActionFeedbackModal

                open={successDialog.open}

                type="success"

                title="Payment Successfully Updated! 🎉"

                message={successDialog.message || "Payment details saved successfully."}

                buttonText="Done"

                onClose={() => {

                    setSuccessDialog({ open: false, message: "" });

                    handleClose();

                }}

            />



            {/* ✅ Action Feedback Popup for Error */}

            <ActionFeedbackModal

                open={errorDialog.open}

                type="error"

                title="Action Failed"

                message={errorDialog.message || "An error occurred while saving."}

                buttonText="Close"

                onClose={() => setErrorDialog({ open: false, message: "" })}

            />

        </>

    );

};



const FieldLabel = ({ label }) => {

    return (

        <Typography

            sx={{

                fontSize: "16px",

                fontWeight: 600,

                color: "#4D4D4D",

                mb: 1.2,

            }}

        >

            {label}

        </Typography>

    );

};



export default PaymentDetailsModal;