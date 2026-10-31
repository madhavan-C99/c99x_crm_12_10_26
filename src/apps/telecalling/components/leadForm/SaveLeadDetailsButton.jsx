import { useState, useEffect, useRef } from "react";

import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { fetchOneLeadForm } from "@/apps/telecalling/services/fetchOneLeadFormService";
import { normalizeMobile } from "@/shared/utils/mobile";
import ActionFeedbackModal from "@/apps/telecalling/components/common/ActionFeedbackModal";

const SaveLeadDetailsButton = ({
    isEdit,
    leadData,
    formData,
    setIsEdit,
    validateForm,
    refreshLeadDetails,
    onTabChange

}) => {
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    // ✅ ADD — error dialog state
    const [errorDialog, setErrorDialog] = useState({
        open: false,
        message: "",
    });

    // ✅ ADD — snapshot of formData taken the moment edit mode is turned ON
    const snapshotRef = useRef(null);

    useEffect(() => {
        if (isEdit) {
            // edit mode just started -> freeze current formData as the "before" state
            snapshotRef.current = JSON.stringify(formData);
        }
    }, [isEdit]);

    const handleSaveLeadDetails =
        async () => {
            const validationResult = validateForm();

            if (!validationResult.isValid) {
                setErrorDialog({
                    open: true,
                    message: validationResult.firstError || "Please fill all required fields correctly.",
                });
                return;
            }
            // ✅ ADD — compare current formData with the snapshot taken at edit-start
            const hasChanges = snapshotRef.current !== JSON.stringify(formData);

            if (!hasChanges) {
                setErrorDialog({
                    open: true,
                    message: "No changes were made to save.",
                });
                return;
            }

            try {

                const payload = {

                    lead_id:
                        Number(
                            leadData?.id ?? null
                        ),

                    fullname:
                        formData?.fullname ??
                        leadData?.full_name ??
                        null,

                    mobile:
                        normalizeMobile(formData?.mobile ?? leadData?.mobile_no)
                            ? `+91${normalizeMobile(formData?.mobile ?? leadData?.mobile_no)}`
                            : null,

                    alternative_mobile:
                        normalizeMobile(formData?.alternative_mobile ?? leadData?.alternative_mobile)
                            ? `+91${normalizeMobile(formData?.alternative_mobile ?? leadData?.alternative_mobile)}`
                            : null,

                    email:
                        formData?.email ??
                        leadData?.email ??
                        null,

                    location:
                        formData?.location?.trim() || null,

                    education_id:
                        formData?.education_id ??
                        leadData?.education_id ??
                        null,
                    education:
                        formData?.education ??
                        leadData?.education ??
                        null,

                    passed_out_year:
                        formData?.passed_out_year ??
                        leadData?.passed_out_year ??
                        null,

                    experience:
                        formData?.experience === ""
                            ? null
                            : formData?.experience ??
                            leadData?.experience ??
                            null,

                    enquiry_date:
                        formData?.enquiry_date ??
                        leadData?.enquiry_date ??
                        null,

                    source_status_id:
                        formData?.currnet_status_id ??
                        leadData?.current_status_id ??
                        null,
                    source_status:
                        formData?.current_status ??
                        leadData?.current_status ??
                        null,

                    lead_source_id:
                        formData?.lead_source_id ??
                        leadData?.lead_source_id ??
                        null,
                    lead_source:
                        formData?.lead_source ??
                        leadData?.lead_source ??
                        null,

                    campaign_name_id:
                        formData?.campaign_name_id ??
                        leadData?.campaign_name_id ??
                        null,
                    campaign_name:
                        formData?.campaign_name ??
                        leadData?.campaign_name ??
                        null,

                    course_plan_id:
                        formData?.course_plan_id ??
                        leadData?.course_plan_id ??
                        null,
                    course_plan:
                        formData?.course_plan ??
                        leadData?.course_plan ??
                        null,

                    course_name_id:
                        formData?.course_name_id ??
                        leadData?.course_name_id ??
                        null,
                    course_name:
                        formData?.course_name ??
                        leadData?.course_name ??
                        null,

                    course_fees:
                        formData?.course_fees ?? null,

                    course_id:
                        formData?.course_id ??
                        null,

                    course_timing_id:
                        formData?.course_timing_id ??
                        leadData?.course_timing_id ??
                        null,
                    course_timing:
                        formData?.course_timing ??
                        leadData?.course_timing ??
                        null,

                    preferred_timing_id:
                        formData?.preferred_timing_id ??
                        leadData?.preferred_timing_id ??
                        null,
                    preferred_timing:
                        formData?.preferred_timing ??
                        leadData?.preferred_timing ??
                        null,

                    pipeline_stage_id:
                        formData?.pipeline_stage_id ??
                        leadData?.pipeline_stage_id ??
                        null,
                    pipeline_stage:
                        formData?.pipeline_stage ??
                        leadData?.pipeline_stage ??
                        null,

                    priority_id:
                        formData?.priority_id ??
                        leadData?.priority_id ??
                        null,
                    priority:
                        formData?.priority ??
                        leadData?.priority ??
                        null,

                    amount_paid:
                        formData.amount_paid === ""
                            ? 0
                            : Number(formData.amount_paid),

                    due_date:
                        formData?.due_date ??
                        null,

                    payment_status_id:
                        formData?.payment_status_id ?? null,
                    payment_status:
                        formData?.payment_status ?? null,

                    next_followup:
                        formData?.
                            scheduled_at ??
                        null,

                    notes:
                        formData?.notes ??
                        null,

                    referal_list: (formData?.referal_list ?? [])
                        .filter((item) => item.name?.trim() || item.number?.trim())   // empty rows anुрума
                        .map((item) => ({
                            name: item.name || "",
                            number: item.number ? `+91${item.number}` : "",
                        })),
                    pending_amount:
                        formData?.pending_amount ??
                        null,
                };

                const response =
                    await fetchOneLeadForm(
                        payload
                    );

                await refreshLeadDetails();

                setSuccessMessage("Lead details updated successfully");
                setOpenSuccessDialog(true);

                setIsEdit(true);

            } catch (error) {

                const backendMsg = error?.response?.data?.detail || error?.response?.data?.message;

                setErrorDialog({
                    open: true,
                    message: backendMsg || "Failed to save lead details. Please try again.",
                });
            }
        };
    return (

        <Box
            sx={{
                display: "flex",

                justifyContent:
                    "flex-start",

                mt: 3,

                mb: 3,
            }}
        >

            <Button
                disabled={!isEdit}

                onClick={
                    handleSaveLeadDetails
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

                    "&.Mui-disabled":
                    {

                        background:
                            "#90D916",

                        color: "#fff",

                        opacity: 0.6,
                    },
                }}
            >
                Save Lead Details
            </Button>
            {/* Unified Center Feedback Popup */}
            <ActionFeedbackModal
                open={openSuccessDialog}
                type="success"
                title="Lead Details Saved!"
                message={successMessage || "Lead information updated successfully."}
                buttonText="Continue"
                onClose={() => {
                    setOpenSuccessDialog(false);
                    setSuccessMessage("");
                    onTabChange?.("call_details");
                }}
            />

            {/* Error Action Feedback Modal */}
            <ActionFeedbackModal
                open={errorDialog.open}
                type="error"
                title="Validation Error"
                message={errorDialog.message || "Please check the entered details."}
                buttonText="Close"
                onClose={() => setErrorDialog({ open: false, message: "" })}
            />

        </Box>
    );
};

export default SaveLeadDetailsButton;
