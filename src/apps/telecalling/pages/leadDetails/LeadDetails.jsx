

import {
    useEffect,
    useState,
    useRef,
} from "react";

import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from "@mui/material";

import { useParams } from "react-router-dom";

import LeadTopSection from "@/apps/telecalling/components/leadDetail/LeadTopSection";
import LeadActionBar from "@/apps/telecalling/components/leadDetail/LeadAction";
import LeadViewCards from "@/apps/telecalling/components/leadDetail/LeadViewCards";
import { fetchOneLead } from "@/apps/telecalling/services/fetchOneLeadService";
import PaymentHistory from "@/apps/telecalling/components/leadDetail/PaymentHistory";
import CallHistory from "@/apps/telecalling/components/leadDetail/CallHistory";
import LeadForm from "@/apps/telecalling/components/leadForm/LeadForm";
import CallDetailsPage from "@/apps/telecalling/components/callDetail/CallDetailsPage";
import { fetchOneLeadForm } from "@/apps/telecalling/services/fetchOneLeadFormService";

import usePipelineSelector from "@/shared/hooks/usePipelineSelector";

const LeadDetailsPage = () => {

                const {
            pipelines,
            selectedPipelineId,
            handlePipelineChange,
            isReady,
        } = usePipelineSelector("pipeline");

    const { id } = useParams();

    const [leadData, setLeadData] =
        useState(null);

    const [activeTab, setActiveTab] = useState("call_details");

    const [loading, setLoading] = useState(true);
    const [hasPendingCallStatus, setHasPendingCallStatus] = useState(false);
    const [openUnsavedModal, setOpenUnsavedModal] = useState(false);
    const [isSavingAndEnding, setIsSavingAndEnding] = useState(false);
    const [isEdit, setIsEdit] = useState(true);
    const [formData, setFormData] = useState({});

    const initialFormDataRef = useRef(null);

    useEffect(() => {
        setActiveTab("call_details");
        localStorage.setItem("last_pipeline_path", `/telecalling/lead-details/${id}`);
    }, [id]);

    const checkIfFormDirty = () => {
        if (!initialFormDataRef.current || !formData) return false;
        let base = {};
        try {
            base = JSON.parse(initialFormDataRef.current);
        } catch (e) {
            return false;
        }

        const fieldsToCompare = [
            "fullname", "mobile", "alternative_mobile", "email", "location",
            "education", "passed_out_year", "experience", "current_status",
            "course_name_id", "course_plan_id", "course_timing_id", "preferred_timing_id",
            "lead_source_id", "campaign_name_id", "notes"
        ];

        for (const key of fieldsToCompare) {
            const baseVal = (base[key] ?? "").toString().trim();
            const formVal = (formData[key] ?? "").toString().trim();
            if (baseVal !== formVal) {
                return true; // 🟢 Real user edit detected
            }
        }
        return false; // ⚪ No changes made
    };

    useEffect(() => {
        const handleCallEnded = () => {
            if (checkIfFormDirty()) {
                setOpenUnsavedModal(true);
            } else {
                setActiveTab("call_details");
            }
        };

        window.addEventListener("callEnded", handleCallEnded);

        return () => {
            window.removeEventListener("callEnded", handleCallEnded);
        };
    }, [formData]);
    useEffect(() => {

        localStorage.setItem(
            "activeTab",
            activeTab
        );

    }, [activeTab]);

    useEffect(() => {

        getLeadDetails();

    }, [id]);

    useEffect(() => {
        if (
            activeTab === "lead_view" ||
            activeTab === "lead_form" ||
            activeTab === "call_details"
        ) {
            getLeadDetails();
        }
    }, [activeTab]);

    const getLeadDetails = async () => {
        setLoading(true);

        try {
            const response = await fetchOneLead(Number(id));
            const leadItem = response.data?.data?.[0] || response.data?.data || null;

            setLeadData(leadItem);

            const stripPrefix = (val) =>
                (val || "").toString().replace(/^\+?91/, "");

            setFormData(prev => ({
                ...prev,
                fullname: leadItem?.full_name ?? null,
                mobile: stripPrefix(leadItem?.mobile_no),
                alternative_mobile: stripPrefix(leadItem?.alternative_mobile),
                email: leadItem?.email ?? null,
                location: leadItem?.location ?? null,
                education: leadItem?.education ?? null,
                passed_out_year: leadItem?.passed_out_year ?? null,
                experience: leadItem?.experience ?? null,
                current_status: leadItem?.current_status ?? null,
                payment_status: leadItem?.payment_status || "Fees",
                enquiry_date: leadItem?.enquiry_date ?? null,

                pipeline_stage: leadItem?.pipeline_stage ?? "",
                pipeline_stage_id: leadItem?.pipeline_stage_id ?? null,
                priority: leadItem?.priority ?? "",
                priority_id: leadItem?.priority_id ?? null,
                lead_source: leadItem?.lead_source ?? "",
                lead_source_id: leadItem?.lead_source_id ?? null,
                campaign_name: leadItem?.campaign_name ?? "",
                campaign_name_id: leadItem?.campaign_name_id ?? null,

                course_name: leadItem?.course_name ?? "",
                course_name_id: leadItem?.course_name_id ?? null,

                course_plan: leadItem?.course_plan ?? "",
                course_plan_id: leadItem?.course_plan_id ?? null,

                course_timing: leadItem?.course_timing ?? "",
                course_timing_id: leadItem?.course_timing_id ?? null,

                preferred_timing: leadItem?.preferred_timing ?? "",
                preferred_timing_id: leadItem?.preferred_timing_id ?? null,

                referal_list: leadItem?.referal_list || [{ name: "", number: "" }],
            }));

            const initialForm = {
                fullname: leadItem?.full_name ?? null,
                mobile: stripPrefix(leadItem?.mobile_no),
                alternative_mobile: stripPrefix(leadItem?.alternative_mobile),
                email: leadItem?.email ?? null,
                location: leadItem?.location ?? null,
                education: leadItem?.education ?? null,
                passed_out_year: leadItem?.passed_out_year ?? null,
                experience: leadItem?.experience ?? null,
                current_status: leadItem?.current_status ?? null,
                payment_status: leadItem?.payment_status || "Fees",
                enquiry_date: leadItem?.enquiry_date ?? null,
                pipeline_stage: leadItem?.pipeline_stage ?? "",
                pipeline_stage_id: leadItem?.pipeline_stage_id ?? null,
                priority: leadItem?.priority ?? "",
                priority_id: leadItem?.priority_id ?? null,
                lead_source: leadItem?.lead_source ?? "",
                lead_source_id: leadItem?.lead_source_id ?? null,
                campaign_name: leadItem?.campaign_name ?? "",
                campaign_name_id: leadItem?.campaign_name_id ?? null,
                course_name: leadItem?.course_name ?? "",
                course_name_id: leadItem?.course_name_id ?? null,
                course_plan: leadItem?.course_plan ?? "",
                course_plan_id: leadItem?.course_plan_id ?? null,
                course_timing: leadItem?.course_timing ?? "",
                course_timing_id: leadItem?.course_timing_id ?? null,
                preferred_timing: leadItem?.preferred_timing ?? "",
                preferred_timing_id: leadItem?.preferred_timing_id ?? null,
                referal_list: leadItem?.referal_list || [{ name: "", number: "" }],
            };

            initialFormDataRef.current = JSON.stringify(initialForm);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndEndCall = async () => {
        setIsSavingAndEnding(true);
        try {
            const payload = {
                lead_id: Number(leadData?.id ?? id),
                fullname: formData?.fullname ?? leadData?.full_name ?? null,
                mobile: formData?.mobile ? `+91${formData.mobile}` : leadData?.mobile_no ?? null,
                alternative_mobile: formData?.alternative_mobile ? `+91${formData.alternative_mobile}` : leadData?.alternative_mobile ?? null,
                email: formData?.email ?? leadData?.email ?? null,
                location: formData?.location?.trim() || null,
                education_id: formData?.education_id ?? leadData?.education_id ?? null,
                education: formData?.education ?? leadData?.education ?? null,
                passed_out_year: formData?.passed_out_year ?? leadData?.passed_out_year ?? null,
                experience: formData?.experience ?? leadData?.experience ?? null,
                enquiry_date: formData?.enquiry_date ?? leadData?.enquiry_date ?? null,
                source_status_id: formData?.current_status_id ?? leadData?.current_status_id ?? null,
                source_status: formData?.current_status ?? leadData?.current_status ?? null,
                lead_source_id: formData?.lead_source_id ?? leadData?.lead_source_id ?? null,
                lead_source: formData?.lead_source ?? leadData?.lead_source ?? null,
                campaign_name_id: formData?.campaign_name_id ?? leadData?.campaign_name_id ?? null,
                campaign_name: formData?.campaign_name ?? leadData?.campaign_name ?? null,
                course_plan_id: formData?.course_plan_id ?? leadData?.course_plan_id ?? null,
                course_plan: formData?.course_plan ?? leadData?.course_plan ?? null,
                course_name_id: formData?.course_name_id ?? leadData?.course_name_id ?? null,
                course_name: formData?.course_name ?? leadData?.course_name ?? null,
                course_fees: formData?.course_fees ?? null,
                course_timing_id: formData?.course_timing_id ?? leadData?.course_timing_id ?? null,
                course_timing: formData?.course_timing ?? leadData?.course_timing ?? null,
                preferred_timing_id: formData?.preferred_timing_id ?? leadData?.preferred_timing_id ?? null,
                preferred_timing: formData?.preferred_timing ?? leadData?.preferred_timing ?? null,
                pipeline_stage_id: formData?.pipeline_stage_id ?? leadData?.pipeline_stage_id ?? null,
                pipeline_stage: formData?.pipeline_stage ?? leadData?.pipeline_stage ?? null,
                priority_id: formData?.priority_id ?? leadData?.priority_id ?? null,
                priority: formData?.priority ?? leadData?.priority ?? null,
                amount_paid: formData.amount_paid === "" ? 0 : Number(formData.amount_paid || 0),
                due_date: formData?.due_date ?? null,
                payment_status_id: formData?.payment_status_id ?? null,
                payment_status: formData?.payment_status ?? null,
                next_followup: formData?.scheduled_at ?? null,
                notes: formData?.notes ?? null,
                referal_list: (formData?.referal_list ?? [])
                    .filter((item) => item.name?.trim() || item.number?.trim())
                    .map((item) => ({
                        name: item.name || "",
                        number: item.number ? `+91${item.number}` : "",
                    })),
                pending_amount: formData?.pending_amount ?? null,
            };

            await fetchOneLeadForm(payload);
            await getLeadDetails();
        } catch (error) {
        } finally {
            setIsSavingAndEnding(false);
            setOpenUnsavedModal(false);
            setActiveTab("call_details");
        }
    };

    const handleDiscardAndEndCall = () => {
        setOpenUnsavedModal(false);
        setActiveTab("call_details");
    };

    const handleCancelUnsavedModal = () => {
        setOpenUnsavedModal(false);
        // Remove end time so timer keeps running
        localStorage.removeItem(`callEndTime_${id}`);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem("activeTab", tab);
    };

    return (
        <Box sx={{ minHeight: "100vh" }}>
            {/* COMMON TOP SECTION */}
            <LeadTopSection
                leadData={leadData}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                loading={loading}
                hasPendingCallStatus={hasPendingCallStatus}
            />

            {/* LEAD VIEW */}
            {activeTab === "lead_view" && (
                <>
                    <LeadActionBar />
                    <LeadViewCards leadData={leadData} />
                    <PaymentHistory
                        leadId={id}
                        refreshLeadDetails={getLeadDetails}
                        leadData={leadData}
                        pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                handlePipelineChange={handlePipelineChange}
                        
                    />
                    <CallHistory />
                </>
            )}

            {/* LEAD FORM */}
            {activeTab === "lead_form" && (
                <LeadForm
                    leadData={leadData}
                    formData={formData}
                    setFormData={setFormData}
                    isEdit={isEdit}
                    setIsEdit={setIsEdit}
                    refreshLeadDetails={getLeadDetails}
                    onTabChange={handleTabChange}
                />
            )}

            {/* CALL DETAILS */}
            {activeTab === "call_details" && (
                <CallDetailsPage
                    setHasPendingCallStatus={setHasPendingCallStatus}
                    leadData={leadData}
                    onTabChange={handleTabChange}
                />
            )}

            {/* UNSAVED CHANGES DIALOG ON END CALL */}
            <Dialog
                open={openUnsavedModal}
                onClose={handleCancelUnsavedModal}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, color: "#D48806" }}>
                    ⚠️ Unsaved Lead Form Data!
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: "14px", color: "#444", mt: 1 }}>
                        You have unsaved changes in the Lead Form. What would you like to do before ending the call?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, flexDirection: "column", gap: 1 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        disabled={isSavingAndEnding}
                        onClick={handleSaveAndEndCall}
                        sx={{
                            bgcolor: "#90D916",
                            color: "#fff",
                            fontWeight: 600,
                            textTransform: "none",
                            borderRadius: "8px",
                            "&:hover": { bgcolor: "#7BC500" },
                        }}
                    >
                        {isSavingAndEnding ? "Saving..." : "Save & End Call"}
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={handleDiscardAndEndCall}
                        sx={{
                            textTransform: "none",
                            borderRadius: "8px",
                            fontWeight: 600,
                        }}
                    >
                        Discard & End Call
                    </Button>
                    <Button
                        fullWidth
                        onClick={handleCancelUnsavedModal}
                        sx={{
                            color: "#666",
                            textTransform: "none",
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeadDetailsPage;
