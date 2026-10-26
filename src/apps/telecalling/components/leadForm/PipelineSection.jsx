import { useEffect, useState } from "react";

import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Collapse,
    IconButton,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { getSelectOptions } from "@/shared/services/dropdownService";

const PipelineSection = ({
    leadData = {},
    formData,
    setFormData,
    isEdit,
}) => {

    const [open, setOpen] =
        useState(true);
    const [pipelineStageOptions, setPipelineStageOptions] = useState([]);
    const [priorityOptions, setPriorityOptions] = useState([]);
    useEffect(() => {
        getPipelineStageOptions();
    }, [leadData?.pipeline_category_id]);

    useEffect(() => {
        if (formData?.pipeline_stage_id) {
            getPriorityOptions(formData.pipeline_stage_id);
        } else {
            setPriorityOptions([]);
        }
    }, [formData?.pipeline_stage_id]);

    useEffect(() => {
        if (!leadData) return;

        setFormData((prev) => ({
            ...prev,
            pipeline_stage: leadData?.pipeline_stage || "",
            pipeline_stage_id: leadData?.pipeline_stage_id || null,
            priority: leadData?.priority || "",
            priority_id: leadData?.priority_id || null,
        }));
    }, [leadData]);

    const handleChange = (
        e
    ) => {

        const {
            name,
            value,
        } = e.target;

        if (name === "pipeline_stage") {

            const selected = pipelineStageOptions.find(
                (item) => item.label === value
            );

            const newStageId = selected?.value || null;

            setFormData((prev) => ({
                ...prev,
                pipeline_stage: value,
                pipeline_stage_id: newStageId,
                priority: "",
                priority_id: null,
            }));

            if (newStageId) {
                getPriorityOptions(newStageId);
            } else {
                setPriorityOptions([]);
            }

            return;
        }

        if (name === "priority") {

            const selected = priorityOptions.find(
                (item) => item.label === value
            );

            setFormData((prev) => ({
                ...prev,
                priority: value,
                priority_id: selected?.value || null,
            }));

            return;
        }

        setFormData((prev) => ({

            ...prev,

            [name]: value,
        }));
    };

    const fieldStyle = {

        "& .MuiOutlinedInput-root": {

            height: "35px",

            background:
                "#F2F2F2",

            borderRadius:
                "5px",

            "& fieldset": {

                border:
                    "0.5px solid #00000017 ",
            },

            "&:hover fieldset":
            {

                borderColor:
                    "#ECECEC !important",
            },

            "&.Mui-focused fieldset":
            {

                borderColor:
                    "#90D916 !important",

                borderWidth:
                    "1px",
            },
            textTransform: "capitalize"

        },

        "& .MuiInputBase-input": {

            padding:
                "13px 16px",

            fontSize:
                "14px",

            color:
                "#000000",

            fontWeight:
                400,
        },

        "& .MuiSelect-select": {

            padding:
                "13px 16px !important",
        },
    };
    const getPipelineStageOptions = async () => {
        try {
            const activePipelineId =
                leadData?.pipeline_category_id ||
                sessionStorage.getItem("telecalling_pipeline_selected_pipeline") ||
                "";

            const payload = {
                dropdown_category: "pipeline_stage",
                filter_id: activePipelineId,
            };

            const response = await getSelectOptions(payload);

            setPipelineStageOptions(response.data.data || []);
        } catch (error) {
        }
    };

    const getPriorityOptions = async (stageId) => {
        try {
            const validStageId = (typeof stageId === "number" || typeof stageId === "string")
                ? stageId
                : formData?.pipeline_stage_id || "";

            const payload = {
                dropdown_category: "priority",
                filter_id: validStageId,
            };

            const response = await getSelectOptions(payload);

            setPriorityOptions(response.data.data || []);
        } catch (error) {
        }
    };

    return (

        <Box
            sx={{
                background:
                    "#fff",

                border:
                    "1px solid #D8D8D8",

                borderRadius:
                    "20px",

                px: {
                    xs: 2,
                    md: 4,
                },

                py: 3,

                mb: 4,
            }}
        >

            {/* HEADER */}

            <Box
                sx={{
                    display:
                        "flex",

                    justifyContent:
                        "space-between",

                    alignItems:
                        "center",

                    cursor:
                        "pointer",
                }}

                onClick={() =>
                    setOpen(!open)
                }
            >

                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap: '7px',
                    }}
                >

                    <PersonOutlineOutlinedIcon
                        sx={{
                            color:
                                "#90D916",

                            fontSize:
                                "24px",
                        }}
                    />

                    <Typography
                        sx={{
                            fontSize:
                                "18px",

                            fontWeight:
                                600,

                            color:
                                "#000000",
                        }}
                    >
                        Pipeline Details
                    </Typography>

                </Box>

                <IconButton
                    sx={{
                        p: 0,
                    }}
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

            {/* BODY */}

            <Collapse in={open}>

                <Box
                    sx={{
                        mt: 3,

                        display: "grid",

                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "1fr 1fr",
                        },

                        columnGap: "36px",

                        rowGap: "26px",
                    }}
                >

                    {/* PIPELINE STAGE */}

                    <Box>

                        <FieldLabel label="Pipeline Stage" />

                        <TextField
                            select
                            fullWidth
                            disabled={!isEdit}
                            name="pipeline_stage"
                            value={formData?.pipeline_stage || ""}
                            onChange={handleChange}
                            onMouseDown={getPipelineStageOptions}
                            sx={fieldStyle}
                        >
                            {formData?.pipeline_stage && !pipelineStageOptions.some(item => (item.label || "").toLowerCase() === (formData.pipeline_stage || "").toLowerCase()) && (
                                <MenuItem key="fallback_stage" value={formData.pipeline_stage} sx={{ textTransform: "capitalize" }}>
                                    {formData.pipeline_stage}
                                </MenuItem>
                            )}
                            {pipelineStageOptions.map((item) => (
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

                    {/* PRIORITY */}

                    <Box>

                        <FieldLabel label="Priority" />

                        <TextField
                            select
                            fullWidth
                            disabled={!isEdit}
                            name="priority"
                            value={formData?.priority || ""}
                            onChange={handleChange}
                            onMouseDown={getPriorityOptions}
                            sx={{
                                ...fieldStyle,

                                "& .MuiOutlinedInput-root": {
                                    ...fieldStyle["& .MuiOutlinedInput-root"],
                                    background:
                                        (formData?.priority || "").toLowerCase() === "hot"
                                            ? "#D91616"
                                            : "#F2F2F2",
                                },

                                // Selected value color
                                "& .MuiSelect-select": {
                                    color:
                                        (formData?.priority || "").toLowerCase() === "hot"
                                            ? "#fff"
                                            : "#000",
                                },

                                // Dropdown arrow color
                                "& .MuiSvgIcon-root": {
                                    color:
                                        (formData?.priority || "").toLowerCase() === "hot"
                                            ? "#fff"
                                            : "#000",
                                },

                            }}
                        >
                            {formData?.priority && !priorityOptions.some(item => (item.label || "").toLowerCase() === (formData.priority || "").toLowerCase()) && (
                                <MenuItem key="fallback_priority" value={formData.priority} sx={{ textTransform: "capitalize" }}>
                                    {formData.priority}
                                </MenuItem>
                            )}
                            {priorityOptions.map((item) => (
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

            </Collapse>

        </Box>
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

                mb: '11px',
            }}
        >
            {label}
        </Typography>
    );
};

export default PipelineSection;
