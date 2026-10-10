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
import { CATEGORY_ALIAS } from "@/shared/components/filters/popup/filterConfig";
import { useAuth } from "@/shared/context/AuthContext";

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
        pipeline_stage: "Loss",
        pipeline_stage_id: 4,
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
    useEffect(() => {
        if (pipelineStageOptions.length === 0) return;

        const selected = pipelineStageOptions.find(
            (item) => item.label.toLowerCase() === (formData.pipeline_stage || "loss").toLowerCase()
        );

        if (selected?.value && selected.value !== formData.pipeline_stage_id) {
            setFormData((prev) => ({
                ...prev,
                pipeline_stage: selected.label,
                pipeline_stage_id: selected.value,
            }));
        }
    }, [pipelineStageOptions, formData.pipeline_stage]);

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
                response.data.data[0];

            setLossData(apiData);

            setFormData({
                pipeline_stage: "Loss",
                pipeline_stage_id: 4,

                main_reason: apiData?.main_reason || "",
                main_reason_id: apiData?.main_reason_id || null,

                loss_reason: apiData?.loss_reason || "",
            });

        } catch (error) {

        }
    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        if (name === "pipeline_stage") {
            const selected = pipelineStageOptions.find(
                (item) => item.label === value
            );

            setFormData((prev) => ({
                ...prev,
                pipeline_stage: value,
                pipeline_stage_id: selected?.value || 4,
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

            height: "35px",

            background: "#F2F2F2",

            borderRadius: "5px",

            fontSize: "14px",

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
                pipeline_stage_id: formData.pipeline_stage_id || 4,
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

        const payload = {
            field: CATEGORY_ALIAS.pipeline_stage,
            filter_id: "",
            opt_filter: {
                pipeline_id: Number(activePipelineId) || 0,
            },
        };

        const response = await getSelectOptions(payload);

        const options = response?.data?.data || [];

        setPipelineStageOptions(options);

        const lossOption = options.find(
            (opt) =>
                opt.label?.trim().toLowerCase() === "loss"
        );

        if (lossOption) {
            setFormData((prev) => ({
                ...prev,
                pipeline_stage: lossOption.label,
                pipeline_stage_id: lossOption.value,
            }));
        }
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
            filter_id: "",
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
                            xs: "88%",
                            sm: "80%",
                            md: "820px",
                        },

                        maxWidth: "820px",

                        maxHeight: "85vh",

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

                        scrollbarWidth: "none",

                        "&::-webkit-scrollbar":
                        {
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

                            mb: 3,
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
                                // select
                                fullWidth
                                name="pipeline_stage"
                                value={formData.pipeline_stage || ""}
                                onChange={handleChange}
                                onMouseDown={getPipelineStageOptions}
                                error={!!errors.pipeline_stage}
                                helperText={errors.pipeline_stage}
                                InputProps={{
                                    readOnly: true,
                                }}
                                sx={fieldStyle}
                            >
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

                    <Box sx={{ mt: 3 }}>

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

                            placeholder="Additional notes about the call......"

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
                            handleClose();
                        }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default LossDetailsModal;
