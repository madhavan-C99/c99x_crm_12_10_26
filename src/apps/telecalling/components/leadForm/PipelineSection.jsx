import { useEffect, useState, useCallback } from "react";

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
    const [open, setOpen] = useState(true);
    const [pipelineStageOptions, setPipelineStageOptions] = useState([]);
    const [priorityOptions, setPriorityOptions] = useState([]);

    const getPipelineStageOptions = useCallback(async () => {
        try {
            const activePipelineId =
                leadData?.pipeline_id ||
                leadData?.pipeline_category_id ||
                sessionStorage.getItem("telecalling_pipeline_selected_leads") ||
                sessionStorage.getItem("telecalling_pipeline_selected_pipeline") ||
                0;

            const response = await getSelectOptions({
                field: "L_STAGES",
                opt_filter: { pipeline_id: Number(activePipelineId) || 0 }
            }, true);

            const rawList = response?.data?.data || response?.data || [];
            const list = Array.isArray(rawList) ? rawList : [];
            setPipelineStageOptions(list);

            // Sync formData labels/ids with the fetched options
            if (formData?.pipeline_stage_id) {
                const matched = list.find((item) => Number(item.value) === Number(formData.pipeline_stage_id));
                if (matched && matched.label !== formData.pipeline_stage) {
                    setFormData((prev) => ({ ...prev, pipeline_stage: matched.label }));
                }
            } else if (formData?.pipeline_stage) {
                const matched = list.find((item) => (item.label || "").toLowerCase() === (formData.pipeline_stage || "").toLowerCase());
                if (matched && matched.value !== formData.pipeline_stage_id) {
                    setFormData((prev) => ({ ...prev, pipeline_stage_id: matched.value }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch pipeline stage options:", error);
        }
    }, [leadData?.pipeline_id, leadData?.pipeline_category_id, formData?.pipeline_stage_id, formData?.pipeline_stage, setFormData]);

    const getPriorityOptions = useCallback(async (stageId) => {
        try {
            const validStageId = (typeof stageId === "number" || typeof stageId === "string")
                ? stageId
                : formData?.pipeline_stage_id || "";

            if (!validStageId) {
                setPriorityOptions([]);
                setFormData((prev) => ({
                    ...prev,
                    priority: "",
                    priority_id: null,
                }));
                return;
            }

            const response = await getSelectOptions({
                field: "L_TAGS",
                opt_filter: { pipeline_stage_id: validStageId }
            }, true);

            const rawList = response?.data?.data || response?.data || [];
            const list = Array.isArray(rawList) ? rawList : [];
            setPriorityOptions(list);

            if (list.length === 0) {
                setFormData((prev) => ({
                    ...prev,
                    priority: "",
                    priority_id: null,
                }));
            } else if (formData?.priority_id) {
                const matched = list.find((item) => Number(item.value) === Number(formData.priority_id));
                if (matched && matched.label !== formData.priority) {
                    setFormData((prev) => ({ ...prev, priority: matched.label }));
                } else if (!matched) {
                    setFormData((prev) => ({ ...prev, priority: "", priority_id: null }));
                }
            } else if (formData?.priority) {
                const matched = list.find((item) => (item.label || "").toLowerCase() === (formData.priority || "").toLowerCase());
                if (matched && matched.value !== formData.priority_id) {
                    setFormData((prev) => ({ ...prev, priority_id: matched.value }));
                } else if (!matched) {
                    setFormData((prev) => ({ ...prev, priority: "", priority_id: null }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch priority options:", error);
        }
    }, [formData?.pipeline_stage_id, formData?.priority_id, formData?.priority, setFormData]);

    useEffect(() => {
        getPipelineStageOptions();
    }, [leadData?.pipeline_id, leadData?.pipeline_category_id, leadData?.id]);

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
            pipeline_stage: prev.pipeline_stage || leadData?.pipeline_stage || "",
            pipeline_stage_id: prev.pipeline_stage_id || leadData?.pipeline_stage_id || null,
            priority: prev.priority || leadData?.priority || "",
            priority_id: prev.priority_id || leadData?.priority_id || null,
        }));
    }, [leadData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "pipeline_stage") {
            const selected = pipelineStageOptions.find(
                (item) => item.label === value || String(item.value) === String(value)
            );

            const newStageId = selected?.value || null;
            const newStageLabel = selected?.label || value;

            setFormData((prev) => ({
                ...prev,
                pipeline_stage: newStageLabel,
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
                (item) => item.label === value || String(item.value) === String(value)
            );

            setFormData((prev) => ({
                ...prev,
                priority: selected?.label || value,
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
            background: "#F2F2F2",
            borderRadius: "5px",
            "& fieldset": {
                border: "0.5px solid #00000017 ",
            },
            "&:hover fieldset": {
                borderColor: "#ECECEC !important",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#90D916 !important",
                borderWidth: "1px",
            },
            textTransform: "capitalize"
        },
        "& .MuiInputBase-input": {
            padding: "13px 16px",
            fontSize: "14px",
            color: "#000000",
            fontWeight: 400,
        },
        "& .MuiSelect-select": {
            padding: "13px 16px !important",
        },
    };

    return (
        <Box
            sx={{
                background: "#fff",
                border: "1px solid #D8D8D8",
                borderRadius: "20px",
                px: { xs: 2, md: 4 },
                py: 3,
                mb: 4,
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                }}
                onClick={() => setOpen(!open)}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: '7px',
                    }}
                >
                    <PersonOutlineOutlinedIcon
                        sx={{
                            color: "#90D916",
                            fontSize: "24px",
                        }}
                    />
                    <Typography
                        sx={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#000000",
                        }}
                    >
                        Pipeline Details
                    </Typography>
                </Box>

                <IconButton sx={{ p: 0 }}>
                    {open ? (
                        <KeyboardArrowDownRoundedIcon sx={{ fontSize: "28px", color: "#111" }} />
                    ) : (
                        <KeyboardArrowUpRoundedIcon sx={{ fontSize: "28px", color: "#111" }} />
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
                            onClick={getPipelineStageOptions}
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

                    {/* TAG / PRIORITY */}
                    <Box>
                        <FieldLabel label="Tag" />
                        <TextField
                            select
                            fullWidth
                            disabled={!isEdit || !formData?.pipeline_stage_id || priorityOptions.length === 0}
                            name="priority"
                            value={(!formData?.pipeline_stage_id || priorityOptions.length === 0) ? "" : (formData?.priority || "")}
                            onChange={handleChange}
                            onClick={() => formData?.pipeline_stage_id && getPriorityOptions(formData.pipeline_stage_id)}
                            onMouseDown={() => formData?.pipeline_stage_id && getPriorityOptions(formData.pipeline_stage_id)}
                            helperText={
                                !formData?.pipeline_stage_id
                                    ? "Select Pipeline Stage first"
                                    : priorityOptions.length === 0
                                    ? "No tags available for this stage"
                                    : ""
                            }
                            sx={{
                                ...fieldStyle,
                                "& .MuiOutlinedInput-root": {
                                    ...fieldStyle["& .MuiOutlinedInput-root"],
                                    background:
                                        (!isEdit || !formData?.pipeline_stage_id || priorityOptions.length === 0)
                                            ? "#EAEAEA"
                                            : (formData?.priority || "").toLowerCase() === "hot"
                                            ? "#D91616"
                                            : "#F2F2F2",
                                },
                                "& .MuiSelect-select": {
                                    color:
                                        (!isEdit || !formData?.pipeline_stage_id || priorityOptions.length === 0)
                                            ? "#757575"
                                            : (formData?.priority || "").toLowerCase() === "hot"
                                            ? "#fff"
                                            : "#000",
                                },
                                "& .MuiSvgIcon-root": {
                                    color:
                                        (!isEdit || !formData?.pipeline_stage_id || priorityOptions.length === 0)
                                            ? "#757575"
                                            : (formData?.priority || "").toLowerCase() === "hot"
                                            ? "#fff"
                                            : "#000",
                                },
                            }}
                        >
                            {(!formData?.pipeline_stage_id || priorityOptions.length === 0) && (
                                <MenuItem value="" disabled>
                                    {!formData?.pipeline_stage_id ? "Select Pipeline Stage first" : "No tags available"}
                                </MenuItem>
                            )}
                            {formData?.pipeline_stage_id && priorityOptions.length > 0 && formData?.priority && !priorityOptions.some(item => (item.label || "").toLowerCase() === (formData.priority || "").toLowerCase()) && (
                                <MenuItem key="fallback_priority" value={formData.priority} sx={{ textTransform: "capitalize" }}>
                                    {formData.priority}
                                </MenuItem>
                            )}
                            {formData?.pipeline_stage_id && priorityOptions.map((item) => (
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

const FieldLabel = ({ label }) => {
    return (
        <Typography
            sx={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#4D4D4D",
                mb: '11px',
            }}
        >
            {label}
        </Typography>
    );
};

export default PipelineSection;
