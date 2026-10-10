import {
    useEffect,
    useState,
} from "react";

import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Collapse,
    IconButton,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { getSelectOptions } from "@/shared/services/dropdownService";
import{CATEGORY_ALIAS} from "@/shared/components/filters/popup/filterConfig";
const PaymentInfoSection = ({
    leadData = {},
    isEdit,
    formData,
    setFormData,
        pipelines = [],
    selectedPipelineId = 0,
    handlePipelineChange,
}) => {

    const [open, setOpen] =
        useState(true);
    const [paymentStatusOptions, setPaymentStatusOptions] = useState([]);

    const [originalPendingAmount,
        setOriginalPendingAmount] =
        useState(0);
    const isWonStage =
        (
            formData?.pipeline_stage ??
            leadData?.pipeline_stage ??
            ""
        ).toLowerCase() === "won";
    useEffect(() => {

        if (leadData) {

            setOriginalPendingAmount(
                Number(
                    leadData?.pending_amount
                ) ||
                Number(
                    leadData?.course_fees
                ) ||
                0
            );

            setFormData((prev) => ({

                ...prev,

                amount_paid: "",

                due_date:
                    leadData?.due_date
                        ? (typeof leadData.due_date === "string" && leadData.due_date.includes("T")
                            ? leadData.due_date.split("T")[0]
                            : leadData.due_date)
                        : null,

                scheduled_at:
                    leadData?.scheduled_at ?? null,

                notes:
                    leadData?.notes ?? null,

                payment_status:
                    leadData?.payment_status ?? null,

                pending_amount:
                    Number(leadData?.pending_amount) < 0
                        ? 0
                        : Number.isNaN(Number(leadData?.pending_amount))
                            ? null
                            : Number(leadData?.pending_amount),

                course_fees:
                    leadData?.course_fees ?? null,
            }));
        }

    }, [leadData]);

    useEffect(() => {
        if (formData?.course_fees) {

            const fees = Number(formData.course_fees);
            const paid = Number(formData.amount_paid || 0);
            const newPending = fees - paid;

            setOriginalPendingAmount(fees);

            setFormData((prev) => ({
                ...prev,
                pending_amount: newPending < 0 ? 0 : newPending,
            }));
        }
    }, [formData?.course_fees]);

    useEffect(() => {

        if (isWonStage) {

            const fees = Number(
                formData?.course_fees ?? leadData?.course_fees ?? 0
            );

            const alreadyPaid = Number(formData?.amount_paid || 0);

            const pending = fees - alreadyPaid;

            setOriginalPendingAmount(fees);

            setFormData((prev) => ({
                ...prev,
                course_fees: fees,
                pending_amount: pending < 0 ? 0 : pending,
            }));

            setOpen(true);          // ✅ Won aana udanடே panel open pannும் (explicit-a)

        } else {
            setOpen(false);
        }

    }, [isWonStage]);

    useEffect(() => {
        getPaymentStatusOptions();
    }, []);

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

            scheduled_at:
                formatted,
        }));
    };

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        if (name === "payment_status") {

            const selected = paymentStatusOptions.find(
                (item) => item.label === value
            );

            setFormData((prev) => ({
                ...prev,
                payment_status: value,
                payment_status_id: selected?.value || null,
            }));

            return;
        }

        if (name === "amount_paid") {

            const paid =
                Number(value) || 0;

            setFormData((prev) => ({

                ...prev,

                amount_paid: value,

                pending_amount:
                    originalPendingAmount - paid,
            }));

            return;
        }

        if (name === "due_date") {
            const dueDateStr = value; // YYYY-MM-DD
            let autoStatusLabel = "";

            if (dueDateStr) {
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                if (dueDateStr < todayStr) {
                    autoStatusLabel = "over due";
                } else if (dueDateStr === todayStr) {
                    autoStatusLabel = "today due";
                } else {
                    autoStatusLabel = "active due";
                }
            }

            const selectedOption = paymentStatusOptions.find(
                (item) => (item.label || "").toLowerCase() === autoStatusLabel.toLowerCase()
            );

            setFormData((prev) => ({
                ...prev,
                due_date: value,
                payment_status: selectedOption?.label || autoStatusLabel,
                payment_status_id: selectedOption?.value || null,
            }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const getPaymentStatusOptions = async () => {
        try {
            const payload = {
                field: CATEGORY_ALIAS.payment_status,
                filter_id: "",
                opt_filter:{"pipeline_id":selectedPipelineId || 0}
            };

            const response = await getSelectOptions(payload);

            setPaymentStatusOptions(response.data.data || []);
        } catch (error) {
        }
    };

    return (

        <Box
            sx={{
                mt: 3,
                background: "#fff",
                p: {
                    xs: 2,
                    md: 4,
                },
                borderRadius: "17px",
                border:
                    "1px solid #00000017",
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

                    cursor: "pointer",

                    mb: open
                        ? "20px"
                        : 0,
                }}

                onClick={() => {

                    if (isWonStage) {
                        setOpen((prev) => !prev);
                    }
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
                    disabled={!isWonStage}
                    onClick={(e) => {

                        e.stopPropagation();

                        if (!isWonStage) return;

                        setOpen((prev) => !prev);
                    }}
                >
                    {open ? (
                        <KeyboardArrowUpRoundedIcon
                            sx={{
                                fontSize:
                                    "28px",

                                color:
                                    isWonStage
                                        ? "#111"
                                        : "#BDBDBD",
                            }}
                        />
                    ) : (
                        <KeyboardArrowDownRoundedIcon
                            sx={{
                                fontSize:
                                    "28px",

                                color:
                                    isWonStage
                                        ? "#111"
                                        : "#BDBDBD",
                            }}
                        />
                    )}
                </IconButton>

            </Box>

            <Collapse in={isWonStage && open}>

                {/* FORM */}

                <Box
                    sx={{
                        display: "grid",

                        gridTemplateColumns:
                        {
                            xs: "1fr",
                            md: "1fr 1fr",
                        },

                        gap: "20px",
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
                                type="number"
                                fullWidth

                                disabled={!isEdit}

                                name="amount_paid"

                                value={
                                    formData.amount_paid
                                }

                                onChange={
                                    handleChange
                                }

                                variant="standard"

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
                                    disabled={!isEdit}

                                    checked={
                                        Number(
                                            formData.pending_amount == 0
                                        )
                                    }
                                    onChange={(e) => {

                                        const checked = e.target.checked;

                                        if (checked) {

                                            setFormData((prev) => ({
                                                ...prev,

                                                amount_paid:
                                                    originalPendingAmount,

                                                pending_amount: 0,
                                            }));

                                        } else {

                                            setFormData((prev) => ({
                                                ...prev,

                                                amount_paid: "",

                                                pending_amount:
                                                    originalPendingAmount,
                                            }));
                                        }
                                    }}
                                />
                            }

                            label={`Full Payment ₹${originalPendingAmount || 0}`} />

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

                            value={`₹${Number(formData.pending_amount) < 0
                                ? 0
                                : formData.pending_amount
                                }`}

                            disabled={!isEdit}

                            name="pending_amount"

                            onChange={
                                handleChange
                            }

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

                            disabled={!isEdit}

                            type="date"

                            name="due_date"

                            value={
                                formData.due_date
                            }

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

                        <Typography
                            sx={{
                                mb: 1,

                                fontWeight: 600,

                                color: "#4D4D4D",

                                fontSize: "16px",
                            }}
                        >
                            Payment Status
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            disabled={!isEdit}
                            name="payment_status"
                            value={
                                (() => {
                                    const raw = formData?.payment_status ?? leadData?.payment_status ?? "";
                                    const matched = paymentStatusOptions.find(
                                        (opt) => (opt.label || "").toLowerCase() === raw.toString().toLowerCase()
                                    );
                                    return matched ? matched.label : raw;
                                })()
                            }
                            onChange={handleChange}
                            onMouseDown={getPaymentStatusOptions}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    height: "35px",
                                    background: "#F2F2F2",
                                    fontSize: "14px",
                                    fontWeight: 400,
                                    color: "#000000",
                                    textTransform:'capitalize'
                                },
                            }}
                        >
                            {formData?.payment_status && !paymentStatusOptions.some(item => (item.label || "").toLowerCase() === (formData.payment_status || "").toLowerCase()) && (
                                <MenuItem key="fallback_status" value={formData.payment_status} sx={{ textTransform: "capitalize" }}>
                                    {formData.payment_status}
                                </MenuItem>
                            )}
                            {paymentStatusOptions.map((item) => (
                                <MenuItem
                                    key={item.value}
                                    value={item.label}
                                    sx={{ textTransform: "capitalize" }}
                                >
                                    {item.label}
                                </MenuItem>
                            ))}
                        </TextField>

                    </Box>

                </Box>

                {/* FOLLOWUP */}
                {/*
                <Box sx={{ mt: "20px" }}>

                    <Typography
                        sx={{
                            mb: 2,

                            fontWeight: 600,

                            color: "#4D4D4D",

                            fontSize: "16px",
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
                                md: "row",
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
                                    sm: "auto",
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

                                    disabled={!isEdit}

                                    onClick={() =>
                                        handleQuickFollowup(hour)
                                    }

                                    sx={{

                                        width: {
                                            xs: "100%",
                                            sm: "144px",
                                        },

                                        height: "36px",

                                        background:
                                            "#D4E0C5",

                                        color: "#222",

                                        borderRadius:
                                            "5px",

                                        textTransform:
                                            "none",

                                        fontWeight: 400,
                                    }}
                                >
                                    {hour} Hour
                                </Button>

                            ))}

                        </Box>

                        <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                        >

                            <DateTimePicker
                                label="Enter Manual"

                                disabled={!isEdit}

                                value={
                                    formData.scheduled_at
                                        ? dayjs(
                                            formData.scheduled_at
                                        )
                                        : null
                                }

                                onChange={(newValue) => {

                                    setFormData((prev) => ({
                                        ...prev,

                                        scheduled_at:
                                            newValue
                                                ? newValue.format(
                                                    "YYYY-MM-DDTHH:mm"
                                                )
                                                : "",
                                    }));
                                }}

                                slotProps={{

                                    textField: {

                                        fullWidth: true,

                                        sx: {

                                            width: {
                                                xs: "100%",
                                                md: "325px",
                                            },

                                            "& .MuiPickersInputBase-root": {

                                                height: "36px !important",

                                                minHeight:
                                                    "36px !important",

                                                borderRadius:
                                                    "5px",

                                                background:
                                                    "#F2F2F2",
                                            },
                                            "& .MuiInputLabel-root": {

                                                top: "-9px",

                                                fontSize: "14px",

                                                color: "#000000",
                                            },
                                        },
                                    },
                                }}
                            />

                        </LocalizationProvider>

                    </Box>

                </Box> */}

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

                        disabled={!isEdit}

                        multiline

                        rows={3}

                        placeholder="Additional notes about the call......"

                        name="notes"

                        value={
                            formData.notes
                        }

                        onChange={
                            handleChange
                        }

                        sx={{

                            "& .MuiOutlinedInput-root": {

                                borderRadius: "5px",

                                minHeight: "84px",

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

                {/* SAVE BUTTON */}

            </Collapse>

        </Box>
    );
};

export default PaymentInfoSection;
