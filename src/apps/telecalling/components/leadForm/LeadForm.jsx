import { useState } from "react";

import {
    Box,
} from "@mui/material";

import LeadActionBar from "@/apps/telecalling/components/leadForm/LeadActionBar";
import PersonalInformationSection from "@/apps/telecalling/components/leadForm/PersonalInformationSection";
import LeadSourceSection from "@/apps/telecalling/components/leadForm/LeadSourceSection";
import SaveLeadDetailsButton from "@/apps/telecalling/components/leadForm/SaveLeadDetailsButton";

const LeadForm = ({
    leadData,
    formData,
    setFormData,
    isEdit,
    setIsEdit,
    refreshLeadDetails,
    onTabChange

}) => {

    const [errors, setErrors] = useState({});
    const validateForm = () => {

        let tempErrors = {};

        if (!formData?.fullname?.trim()) {
            tempErrors.fullname = "Full Name is required";
        }

        if (!formData?.mobile?.trim()) {

            tempErrors.mobile =
                "Mobile number is required";

        } else if (
            !/^\d{10}$/.test(formData.mobile)
        ) {

            tempErrors.mobile =
                "Mobile number must be 10 digits";
        }
        if (
            formData?.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            tempErrors.email =
                "Enter a valid email address";
        }

        if (
            formData?.referral_mobile &&
            !/^\d{10}$/.test(
                formData.referral_mobile
            )
        ) {
            tempErrors.referral_mobile =
                "Mobile number must be 10 digits";
        }

        // ✅ WON STAGE VALIDATION: If pipeline stage is "Won" or ID 3
        const isWonStage =
            (formData?.pipeline_stage || "").toLowerCase() === "won" ||
            formData?.pipeline_stage_id === 3;

        if (isWonStage) {
            if (!formData?.course_name && !formData?.course_name_id) {
                tempErrors.course_name = "Please fill this required field";
            }
            if (!formData?.course_plan && !formData?.course_plan_id) {
                tempErrors.course_plan = "Please fill this required field";
            }
            if (!formData?.course_timing && !formData?.course_timing_id) {
                tempErrors.course_timing = "Please fill this required field";
            }
        }

        setErrors(tempErrors);

        return {
            isValid: Object.keys(tempErrors).length === 0,
            firstError: Object.values(tempErrors)[0] || "",   // ✅ ADD
        };
    };

    return (

        <Box sx={{ mt: 2.5 }}>

            <LeadActionBar
                isEdit={isEdit}
                setIsEdit={setIsEdit}
                formData={formData}
                leadData={leadData}

            />

            <PersonalInformationSection
                formData={formData}
                setFormData={setFormData}
                leadData={leadData}
                isEdit={isEdit}
                errors={errors}
                setErrors={setErrors}
            />

            <LeadSourceSection
                formData={formData}
                setFormData={setFormData}
                leadData={leadData}
                isEdit={isEdit}
                errors={errors}
                setErrors={setErrors}
            />

            {/* <PipelineSection
                formData={formData}
                setFormData={setFormData}
                leadData={leadData}
                isEdit={isEdit}
            />

            <PaymentInfoSection
                formData={formData}
                setFormData={setFormData}
                leadData={leadData}
                isEdit={isEdit}
            /> */}

            {/* <ReferralSection
                formData={formData}
                setFormData={setFormData}
                isEdit={isEdit}
                errors={errors}
                setErrors={setErrors}
            /> */}

            <SaveLeadDetailsButton
                isEdit={isEdit}
                leadData={leadData}
                formData={formData}
                setIsEdit={setIsEdit}
                validateForm={validateForm}
                refreshLeadDetails={refreshLeadDetails}
                onTabChange={onTabChange}
            />
            {/* <LossDetailsModal /> */}

        </Box>
    );
};

export default LeadForm;
