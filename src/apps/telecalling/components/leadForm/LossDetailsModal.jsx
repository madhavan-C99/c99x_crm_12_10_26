import {
    useEffect,
    useState,
} from "react";

import {
    Box,
    Modal,
    Typography,
    TextField,
    MenuItem,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import { useParams } from "react-router-dom";

import { fetchOneLossData, submitLossLead } from "@/apps/telecalling/services/fetchOneLossDataService";
import { getSelectOptions } from "@/shared/services/dropdownService";
import { CATEGORY_ALIAS } from "@/apps/telecalling/components/filters/popup/filterConfig";
import { selectPlaceholderProps } from "@/apps/telecalling/components/common/selectPlaceholder";
import { useAuth } from "@/shared/context/AuthContext";
import ActionFeedbackModal from "@/apps/telecalling/components/common/ActionFeedbackModal";

export const LossDetailsModal = ({
    open = false,
    handleClose,
    leadData,
    pipelineId,
}) => {
    const { hasPermission } = useAuth();
    const { id } = useParams();

    const [lossData, setLossData] =
        useState({});
    const [pipelineStageOptions, setPipelineStageOptions] = useState([]);
    const [reasonOptions, setReasonOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        pipeline_stage: "",
        pipeline_stage_id: "",
        main_reason: "",
        main_reason_id: null,
        loss_reason: "",
    });
    const [successDialog, setSuccessDialog] = useState({
        open: false,
        message: "",
    });

    useEffect(() => {

        if (open) {

            getLossDetails();
        }

    }, [id, open]);

    useEffect(() => {
        getReasonOptions();
        getPipelineStageOptions();
    }, []);
    // Once stage options + fetch_one_loss_data are both available, show the saved
    // stage (id first, then label). Nothing saved -> the placeholder stays.
    useEffect(() => {
        if (!open || pipelineStageOptions.length === 0 || !lossData) return;

        const savedId = lossData.pipeline_stage_id;
        const savedLabel = (lossData.pipeline_stage || "").trim().toLowerCase();

        const selected = pipelineStageOptions.find(
            (item) =>
                (savedId && String(item.value) === String(savedId)) ||
                (savedLabel && item.label?.trim().toLowerCase() === savedLabel)
        );

        setFormData((prev) => ({
            ...prev,
            pipeline_stage: selected?.label || "",
            pipeline_stage_id: selected?.value ?? "",
        }));
    }, [open, pipelineStageOptions, lossData]);

    // Saved main reason (id -> label) once the reason options are loaded
    useEffect(() => {
        if (!reasonOptions.length || !lossData?.main_reason_id) return;

        const selected = reasonOptions.find(
            (item) => String(item.value) === String(lossData.main_reason_id)
        );

        if (selected) {
            setFormData((prev) => ({
                ...prev,
                main_reason: selected.label,
                main_reason_id: selected.value,
            }));
        }
    }, [reasonOptions, lossData]);

    const getLossDetails = async () => {
        if (!hasPermission("api_fetch_one_loss_lead_detail")) {
            console.warn("Permission denied: api_fetch_one_loss_lead_detail");
            return;
        }

        try {

            const response =
                await fetchOneLossData(
                    Number(id)
                );

            const apiData =
                response?.data?.data?.[0] || response?.data?.data || {};

            setLossData(apiData);

            setFormData((prev) => ({
                ...prev,
                main_reason: apiData?.main_reason || "",
                main_reason_id: apiData?.main_reason_id || null,

                loss_reason: apiData?.loss_reason || "",
            }));

        } catch (error) {

        }
    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        if (name === "pipeline_stage") {
            const selected = pipelineStageOptions.find(
                (item) => String(item.value) === String(value)
            );

            setFormData((prev) => ({
                ...prev,
                pipeline_stage: selected?.label || "",
                pipeline_stage_id: selected?.value ?? "",
            }));

            setErrors((prev) => ({ ...prev, pipeline_stage: "" }));

            return;
        }

        if (name === "main_reason") {
            const selected = reasonOptions.find(
                (item) => item.label === value
            );

            setFormData((prev) => ({
                ...prev,
                main_reason: value,
                main_reason_id: selected?.value || null,
            }));

            setErrors((prev) => ({ ...prev, main_reason: "" }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const fieldStyle = {

        "& .MuiOutlinedInput-root": {

            height: "30px",

            background: "#F2F2F2",

            borderRadius: "5px",

            fontSize: "13px",

            "& fieldset": {

                border:
                    "0.5px solid #00000017",
            },
        },

        "& .MuiInputBase-input": {

            fontSize: "14px",
            fontWeight: 400,
            textTransform: 'Capitalize'
        },
    };

    const handleSubmit = async () => {

        // ✅ ADD — validation
        const tempErrors = {};

        if (!formData?.pipeline_stage_id) {
            tempErrors.pipeline_stage = "Please select pipeline stage";
        }

        if (!formData?.main_reason) {
            tempErrors.main_reason = "Please select a reason";
        }

        setErrors(tempErrors);

        if (Object.keys(tempErrors).length > 0) {
            return;   // ✅ validation fail aana API call trigger aagaathu
        }

        try {

            const payload = {

                lead_id:
                    String(id),

                follow_up_days:
                    String(
                        lossData?.follow_up_days || "1"
                    ),

                enquiry_date:
                    lossData?.enquiry_date,
                pipeline_stage_id: Number(formData.pipeline_stage_id),
                main_reason_id: formData.main_reason_id,
                loss_reason:
                    formData.loss_reason || "",
            };

            const response =
                await submitLossLead(
                    payload
                );
            setSuccessDialog({
                open: true,
                message: "Loss lead details saved successfully",
            });

        } catch (error) {

        }
    };

 const getPipelineStageOptions = async () => {
    try {
        const activePipelineId =
            pipelineId ||
            leadData?.pipeline_category_id ||
            leadData?.pipeline_id ||
            sessionStorage.getItem(
                "telecalling_pipeline_selected_pipeline"
            ) ||
            0;

        // get_select_options payload: { field, opt_filter }
        const payload = {
            field: CATEGORY_ALIAS.pipeline_stage,
            opt_filter: {
                pipeline_id: Number(activePipelineId) || 0,
            },
        };

        const response = await getSelectOptions(payload);

        const options = response?.data?.data || [];

        // This modal is only for the "Loss" stage
        setPipelineStageOptions(
            options.filter(
                (opt) => opt.label?.trim().toLowerCase() === "loss request"
            )
        );
    } catch (error) {
        console.error("Pipeline Stage Options Error:", error);
        setPipelineStageOptions([]);
    }
};

const getReasonOptions = async () => {
    try {
        const activePipelineId =
            pipelineId ||
            leadData?.pipeline_category_id ||
            leadData?.pipeline_id ||
            sessionStorage.getItem(
                "telecalling_pipeline_selected_pipeline"
            ) ||
            0;

        const payload = {
            field: CATEGORY_ALIAS.loss_reason,
            opt_filter: {
                pipeline_id: Number(activePipelineId) || 0,
            },
        };

        const response = await getSelectOptions(payload);

        const options = response?.data?.data || [];

        setReasonOptions(options);
    } catch (error) {
        console.error("Loss Reason Options Error:", error);
        setReasonOptions([]);
    }
};

    return (
        <>
            <Modal
                open={Boolean(open)}
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
                            xs: "95%",
                            sm: "85%",
                            md: "820px",
                        },

                        maxWidth: "820px",

                        maxHeight: {
                            xs: "92vh",
                            md: "88vh",
                        },

                        overflowY: "auto",

                        background:
                            "#fff",

                        borderRadius: {
                            xs: "10px",
                            sm: "14px",
                        },

                        p: {
                            xs: 2,
                            sm: 3,
                        },

                        outline: "none",

                        scrollbarWidth: "thin",

                        "&::-webkit-scrollbar":
                        {
                            width: "6px",
                        },
                        "&::-webkit-scrollbar-thumb":
                        {
                            backgroundColor: "#d1d5db",
                            borderRadius: "4px",
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

                            mb: 1,
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
                                        "24px",
                                }}
                            />

                            <Typography
                                sx={{
                                    fontSize:
                                        "18px",

                                    fontWeight: 600,

                                    color:
                                        "#1A1A1A",
                                }}
                            >
                                Loss Lead Detail
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

                            gap: "18px",
                        }}
                    >

                        {/* PIPELINE */}

                        <Box>

                            <Typography
                                sx={{
                                    mb: 1,

                                    fontWeight: 600,

                                    fontSize:
                                        "16px",

                                    color:
                                        "#4D4D4D",
                                }}
                            >
                                Pipeline Stage
                            </Typography>

                            <TextField
                                select
                                fullWidth
                                name="pipeline_stage"
                                value={formData.pipeline_stage_id ?? ""}
                                onChange={handleChange}
                                onMouseDown={() => {
                                    if (!pipelineStageOptions.length) getPipelineStageOptions();
                                }}
                                error={!!errors.pipeline_stage}
                                helperText={errors.pipeline_stage}
                                slotProps={{
                                    select: selectPlaceholderProps(
                                        (v) =>
                                            pipelineStageOptions.find(
                                                (item) => String(item.value) === String(v)
                                            )?.label || "",
                                        "Select Pipeline Stage"
                                    ),
                                }}
                                sx={fieldStyle}
                            >
                                {pipelineStageOptions.map((item) => (
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

                        {/* ENQUIRY DATE */}

                        <Box>

                            <Typography
                                sx={{
                                    mb: 1,

                                    fontWeight: 600,

                                    fontSize:
                                        "16px",

                                    color:
                                        "#4D4D4D",
                                }}
                            >
                                Enquiry Date
                            </Typography>

                            <TextField
                                fullWidth

                                disabled

                                value={
                                    lossData?.enquiry_date
                                        ?.split(
                                            "T"
                                        )[0] || ""
                                }

                                sx={fieldStyle}
                            />

                        </Box>

                        {/* FOLLOWUP */}

                        <Box>

                            <Typography
                                sx={{
                                    mb: 1,

                                    fontWeight: 600,

                                    fontSize:
                                        "16px",

                                    color:
                                        "#4D4D4D",
                                }}
                            >
                                Follow Up Days
                            </Typography>

                            <TextField
                                fullWidth

                                disabled

                                value={`${lossData?.follow_up_days || ""
                                    } Days`}

                                sx={fieldStyle}
                            />

                        </Box>

                    </Box>
                    {/* MAIN REASON */}

                    <Box>
                        <Typography
                            sx={{
                                mb: 1,
                                fontWeight: 600,
                                fontSize: "16px",
                                color: "#4D4D4D",
                                mt: 1
                            }}
                        >
                            Reason
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            name="main_reason"
                            value={formData.main_reason || ""}
                            onChange={handleChange}
                            onMouseDown={getReasonOptions}
                            error={!!errors.main_reason}
                            helperText={errors.main_reason}
                            sx={fieldStyle}
                            slotProps={{
                                select: selectPlaceholderProps((v) => v, "Select Reason"),
                            }}
                        >
                            {reasonOptions.map((item) => (
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

                    {/* LOSS REASON */}

                    <Box sx={{ mt: 2 }}>

                        <Typography
                            sx={{
                                mb: 1,

                                fontWeight: 600,

                                fontSize:
                                    "16px",

                                color:
                                    "#4D4D4D",
                            }}
                        >
                            Detailed Reason for Loss
                        </Typography>

                        <TextField
                            fullWidth

                            multiline

                            minRows={3}

                            placeholder="Enter detailed reason for loss"

                            name="loss_reason"

                            value={
                                formData.loss_reason
                            }

                            onChange={
                                handleChange
                            }

                            sx={{

                                "& .MuiOutlinedInput-root":
                                {

                                    background:
                                        "#F2F2F2",

                                    borderRadius:
                                        "5px",

                                    "& fieldset":
                                    {

                                        border:
                                            "0.5px solid #00000017",
                                    },
                                },

                                "& .MuiInputBase-input::placeholder":
                                {

                                    color:
                                        "#A6A6A6",

                                    opacity: 1,

                                    fontSize:
                                        "14px",

                                },
                                "& textarea":
                                {
                                    height:
                                        "84px !important",
                                }
                            }}
                        />

                    </Box>

                    {/* BUTTON */}

                    <Box
                        sx={{
                            display: "flex",

                            justifyContent:
                                "flex-end",

                            mt: 3,
                        }}
                    >

                        <Button
                            onClick={
                                handleSubmit
                            }

                            startIcon={
                                <SaveOutlinedIcon />
                            }

                            sx={{

                                background:
                                    "#90D916",

                                color: "#fff",

                                width: "160px",

                                height: "42px",

                                borderRadius:
                                    "8px",

                                textTransform:
                                    "none",

                                fontSize:
                                    "16px",

                                fontWeight: 500,

                                "&:hover": {

                                    background:
                                        "#7FC700",
                                },
                            }}
                        >
                            Submit
                        </Button>

                    </Box>

                </Box>

            </Modal>

            <ActionFeedbackModal
                open={successDialog.open}
                type="error"
                title="Moved to Loss"
                message={successDialog.message || "Lead marked as Loss and submitted."}
                buttonText="Done"
                onClose={() => {
                    setSuccessDialog({ open: false, message: "" });
                    handleClose();
                }}
            />
        </>
    );
};

export default LossDetailsModal;
