import { useEffect, useState } from "react";

import {
    Box,
    Typography,
    TextField,
    Button,
    Collapse,
    IconButton,
    InputAdornment,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";

const ReferralSection = ({
    formData,
    setFormData,
    isEdit,

}) => {

    const [open, setOpen] =
        useState(true);
    const [referrals, setReferrals] = useState([
        {
            name: "",
            number: "",
        },
    ]);

    const [errors, setErrors] = useState([
        {
            name: "",
            number: "",
        },
    ]);
    useEffect(() => {
        if (formData && !formData.referal_list) {
            setFormData((prev) => {
                if (prev.referal_list) return prev;
                return {
                    ...prev,
                    referal_list: [
                        {
                            name: "",
                            number: "",
                        },
                    ],
                };
            });
        }
    }, [formData?.referal_list]);

    const handleReferralChange = (index, e) => {
        const { name, value } = e.target;

        const updated = [...(formData.referal_list || [])];

        if (name === "referral_name") {
            updated[index].name = value.replace(/[^a-zA-Z\s]/g, "");
        }

        if (name === "referral_mobile") {
            const numbersOnly = value.replace(/\D/g, "").slice(0, 10);

            updated[index].number = numbersOnly;

            setErrors((prev) => ({
                ...prev,
                [`referral_mobile_${index}`]:
                    numbersOnly.length > 0 && numbersOnly.length < 10
                        ? "Mobile number must be 10 digits"
                        : "",
            }));
        }

        setFormData((prev) => ({
            ...prev,
            referal_list: updated,
        }));
    };

    const fieldStyle = {

        "& .MuiOutlinedInput-root": {

            height: "35px",

            background: "#F2F2F2",

            borderRadius: "5px",

            fontSize: "14px",

            color: "#000",

            "& fieldset": {

                border:
                    "0.5px solid #00000017",
            },

            "& input": {

                padding:
                    "10px 14px",
            },
        },

        "& .MuiInputBase-input::placeholder":
        {

            color: "#A6A6A6",

            opacity: 1,
        },
    };

    const addReferral = () => {
        setFormData((prev) => ({
            ...prev,
            referal_list: [
                ...(prev.referal_list || []),
                {
                    name: "",
                    number: "",
                },
            ],
        }));

        setErrors((prev) => [
            ...prev,
            {
                name: "",
                number: "",
            },
        ]);
    };

    return (

        <Box
            sx={{
                mt: 3,

                background: "#fff",

                border:
                    "1px solid #00000017",

                borderRadius: "17px",

                p: {
                    xs: 2,
                    md: 3,
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

                    mb: open
                        ? 0
                        : 0,
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

                            fontSize:
                                "22px",
                        }}
                    />

                    <Typography
                        sx={{
                            fontWeight: 600,

                            fontSize:
                                "18px",

                            color:
                                "#1A1A1A",
                        }}
                    >
                        Referral
                    </Typography>

                </Box>

                <Box
                    sx={{
                        display: "flex",

                        alignItems:
                            "center",

                        gap: 1,
                    }}
                >

                    <IconButton
                        onClick={() =>
                            setOpen(!open)
                        }
                    >

                        {open ? (

                            <KeyboardArrowDownRoundedIcon
                                sx={{
                                    fontSize:
                                        "28px",

                                    color:
                                        "#111",
                                }}
                            />

                        ) : (

                            <KeyboardArrowUpRoundedIcon
                                sx={{
                                    fontSize:
                                        "28px",

                                    color:
                                        "#111",
                                }}
                            />
                        )}

                    </IconButton>

                </Box>

            </Box>

            {/* BODY */}

            <Collapse in={open}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 0,
                    }}
                >

                    <Button
                        disabled={!isEdit}
                        onClick={addReferral}
                        startIcon={
                            <AddOutlinedIcon
                                sx={{
                                    fontSize:
                                        "16px !important",
                                }}
                            />
                        }

                        sx={{

                            background:
                                "#90D916",

                            color: "#fff",

                            textTransform:
                                "none",

                            height: "28px",

                            minWidth:
                                "110px",

                            borderRadius:
                                "5px",

                            fontSize:
                                "12px",

                            fontWeight: 500,

                            "&:hover": {

                                background:
                                    "#7FC700",
                            },

                            "&.Mui-disabled":
                            {

                                background:
                                    "#90D916",

                                color: "#fff",

                                opacity: 1,
                            },
                        }}
                    >
                        Add Referral
                    </Button>

                </Box>

                {(formData.referal_list || []).map((item, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "1fr 1fr",
                            },
                            gap: "24px",
                            mt: index > 0 ? 2 : 0,
                        }}
                    >
                        {/* Full Name */}
                        <Box>
                            <FieldLabel label="Full Name" />

                            <TextField
                                fullWidth
                                disabled={!isEdit}
                                placeholder="Enter Full Name"
                                name="referral_name"
                                value={item.name}
                                error={!!errors[`referral_name_${index}`]}
                                helperText={errors[`referral_name_${index}`]}
                                onChange={(e) =>
                                    handleReferralChange(index, e)
                                }
                                sx={fieldStyle}
                            />
                        </Box>

                        {/* Mobile Number */}
                        <Box>
                            <FieldLabel label="Mobile Number" />

                            <TextField
                                fullWidth
                                disabled={!isEdit}
                                placeholder="Enter Mobile Number"
                                name="referral_mobile"
                                value={
                                    (item.number ?? "")
                                        .toString()
                                        .replace(/^\+?91/, "")
                                }
                                error={!!errors[`referral_mobile_${index}`]}
                                helperText={errors[`referral_mobile_${index}`]}
                                onChange={(e) =>
                                    handleReferralChange(index, e)
                                }
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment
                                                position="start"
                                                sx={{
                                                    height: "100%",
                                                    maxHeight: "none",
                                                    alignItems: "center",
                                                    display: "flex",
                                                    marginRight: "8px",      // ✅ fixed small gap, mr theme-spacing multiplier illama
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: "14px",
                                                        fontWeight: 500,
                                                        color: "#444",
                                                        borderRight: "1px solid #D9D9D9",
                                                        paddingRight: "8px",   // ✅ mr/pr theme units ku badhula fixed px
                                                        lineHeight: "normal",
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    +91
                                                </Typography>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    ...fieldStyle,
                                    "& .MuiOutlinedInput-root": {
                                        ...fieldStyle["& .MuiOutlinedInput-root"],
                                        alignItems: "center",
                                        display: "flex",
                                        paddingLeft: "10px",           // ✅ ADD — root-oda left padding fix pண்ணுங்க
                                    },
                                    "& .MuiInputBase-input": {
                                        ...fieldStyle["& .MuiInputBase-input"],
                                        padding: "0 !important",
                                        paddingLeft: "0 !important",   // ✅ input text-oda extra left padding remove pண்ணுங்க
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                ))}

            </Collapse>

        </Box>
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

export default ReferralSection;
