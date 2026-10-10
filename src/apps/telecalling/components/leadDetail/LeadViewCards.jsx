


import {
    Grid,
} from "@mui/material";


import DetailCard from "@/apps/telecalling/components/leadDetail/DetailCard";

// Same labels/colors as PaymentDetailsModal.jsx, so status looks
// identical everywhere in the app — Over Due = red, Today Due =
// orange, Active Due = green.

const LeadViewCards = ({
    leadData,
}) => {

    const personalDetails = [
        {
            label: "Name",
            value: leadData?.full_name,
        },

        {
            label: "Mobile Number",
            value: leadData?.mobile_no,
        },

        {
            label: "Alternative Mobile Number",
            value:
                leadData?.alternative_mobile,
        },

        {
            label: "Email Id",
            value: leadData?.email,
        },

        {
            label: "Location",
            value: leadData?.location,
        },

        {
            label: "Education",
            value: leadData?.education,
        },

        {
            label: "Passed Out Year",
            value:
                leadData?.passed_out_year,
        },

        {
            label: "Experience",
            value: leadData?.experience,
        },
    ];

    const leadCourseDetails = [
        {
            label: "Enquiry Date",

            value:
                leadData?.enquiry_date
                    ? new Date(
                        leadData.enquiry_date
                    ).toLocaleDateString(
                        "en-GB"
                    )
                    : "-",
        },

        {
            label: "Current Status",
            value:
                leadData?.current_status,
        },

        {
            label: "Lead Source",
            value:
                leadData?.lead_source,
        },

        {
            label: "Campaign Name",
            value:
                leadData?.campaign_name,
        },

        {
            label: "Course Plan",
            value:
                leadData?.course_plan,
        },

        {
            label: "Course Name",
            value:
                leadData?.course_name,
        },

        {
            label: "Course Timing",
            value:
                leadData?.course_timing,
        },

        {
            label: "Preferred Timing",
            value:
                leadData?.preferred_timing,
        },
    ];

    const referralList = leadData?.referal_list || [];

    const referralDetails = referralList.length > 0
        ? referralList.flatMap((ref, index) => [
            {
                label: `Referral ${index + 1} Name`,
                value: ref?.name || "-",
            },
            {
                label: `Referral ${index + 1} Mobile No`,
                value: ref?.number || "-",
            },
        ])
        : [
            { label: "Referral Name", value: "-" },
            { label: "Referral Mobile No", value: "-" },
        ];

    const paymentDetails = [
        {
            label: "Pipeline Stage",
            value:
                leadData?.pipeline_stage,
        },

        {
            label: "Priority",
            value: leadData?.priority,
        },

        {
            label: "Amount Paid",
            value:
                leadData?.amount_paid,
        },

        {
            label: "Pending Amount",
            value:
                leadData?.pending_amount,
        },

        {
            label: "Due Date",

            value:
                leadData?.due_date
                    ? new Date(
                        leadData.due_date
                    ).toLocaleDateString(
                        "en-GB"
                    )
                    : "-",
        },

        {
            label: "Payment Status",
            value:
                leadData?.payment_status,
        },

        {
            label: "Referral Name",
            value:
                leadData?.referral_name,
        },

        {
            label: "Referral Mobile No",
            value:
                leadData?.referral_mobile_no,
        },
    ];

    return (

        <Grid
            container

            spacing={3}

            sx={{
                justifyContent: "center",
                mt: 1,

                width: "100%",

                mx: "auto",
            }}
        >
            <Grid
                size={{
                    xs: 12,
                    md: 6,
                    lg: 4,
                }}

                sx={{
                    display: "flex",
                }}
            >
                <DetailCard
                    title="Personal Details"
                    data={personalDetails}
                />
            </Grid>

            <Grid
                size={{
                    xs: 12,
                    md: 6,
                    lg: 4,
                }}

                sx={{
                    display: "flex",
                }}
            >
                <DetailCard
                    title="Lead & Course Details"
                    data={leadCourseDetails}
                />
            </Grid>

            <Grid
                size={{
                    xs: 12,
                    md: 6,
                    lg: 4,
                }}

                sx={{
                    display: "flex",
                    mx: 'auto'

                }}
            >
                <DetailCard
                    title="Payment Info"
                    data={paymentDetails}
                />
            </Grid>
        </Grid>
    );
};

export default LeadViewCards;
