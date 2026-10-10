import { useState } from "react";

import {
    Box,
    Typography,
    Button,
    Snackbar,
    Alert,
} from "@mui/material";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { LossDetailsModal } from "@/apps/telecalling/components/leadForm/LossDetailsModal";
import WonDetailsModal from "@/apps/telecalling/components/leadForm/WonDetailsModal";

const LeadActionBar = ({ isEdit, setIsEdit, leadData, formData }) => {

    const [openLossModal, setOpenLossModal] = useState(false);
    const [openWonModal, setOpenWonModal] = useState(false);

    const [showCourseAlert, setShowCourseAlert] = useState(false);

    // Course Name, Course Plan, Course Timing choose panirukanum validation
    const isCourseNameSelected = Boolean(
        formData?.course_name || formData?.course_name_id || leadData?.course_name || leadData?.course_name_id
    );
    const isCoursePlanSelected = Boolean(
        formData?.course_plan || formData?.course_plan_id || leadData?.course_plan || leadData?.course_plan_id
    );
    const isCourseTimingSelected = Boolean(
        formData?.course_timing || formData?.course_timing_id || formData?.preferred_timing || formData?.preferred_timing_id || formData?.timing || leadData?.course_timing || leadData?.course_timing_id || leadData?.preferred_timing || leadData?.preferred_timing_id || leadData?.timing
    );

    const handleWonClick = () => {
        if (isCourseNameSelected && isCoursePlanSelected && isCourseTimingSelected) {
            setOpenWonModal(true);
        } else {
            setShowCourseAlert(true);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: {
                    xs: "flex-start",
                    md: "center",
                },
                flexDirection: {
                    xs: "column",
                    md: "row",
                },
                gap: 2,
                mb: 3,
                ml: 0.5
            }}
        >
            {/* LEFT SIDE */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <DescriptionOutlinedIcon
                    sx={{
                        color: "#90D916",
                        fontSize: "31px",
                    }}
                />

                <Typography
                    sx={{
                        fontSize: {
                            xs: "20px",
                            md: "24px",
                        },
                        fontWeight: 700,
                        color: "#111",
                        lineHeight: 1,
                    }}
                >
                    Lead Form Entry
                </Typography>
            </Box>

            {/* RIGHT SIDE */}
            <Box
                sx={{
                    display: "flex",
                    gap: '26px',
                    flexWrap: "wrap",
                    width: {
                        xs: "100%",
                        md: "auto",
                    },
                }}
            >
                <Button
                    startIcon={<AddOutlinedIcon />}
                    onClick={handleWonClick}
                    // 👆 direct setOpenWonModal(true) ku badhila handleWonClick call pannunga
                    sx={{
                        border: "1px solid #90D916",
                        color: "#000000",
                        textTransform: "none",
                        borderRadius: "6px",
                        height: "31px",
                        fontSize: "14px",
                        background: "#fff",
                        px: 2,
                        width: {
                            xs: "100%",
                            sm: "auto",
                        },
                        "& .MuiButton-startIcon svg": {
                            fontSize: "17px",
                        },
                    }}
                >
                    Mark as Won
                </Button>

                <WonDetailsModal
                    open={openWonModal}
                    handleClose={() => setOpenWonModal(false)}
                    leadData={leadData}
                    pipelineId={leadData?.pipeline_category_id || sessionStorage.getItem("telecalling_pipeline_selected_pipeline")}
                />

                <Button
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => setOpenLossModal(true)}
                    sx={{
                        border: "1px solid #D91616",
                        color: "#000000",
                        textTransform: "none",
                        borderRadius: "6px",
                        height: "31px",
                        fontSize: "14px",
                        background: "#fff",
                        px: 2,
                        width: {
                            xs: "100%",
                            sm: "auto",
                        },
                        "& .MuiButton-startIcon svg": {
                            fontSize: "17px",
                        },
                    }}
                >
                    Mark as Loss
                </Button>
                <LossDetailsModal
                    open={openLossModal}
                    handleClose={() => setOpenLossModal(false)}
                    leadData={leadData}
                    pipelineId={leadData?.pipeline_category_id || sessionStorage.getItem("telecalling_pipeline_selected_pipeline")}
                />

                {/* <Button
                    startIcon={<AddOutlinedIcon />}
                    sx={{
                        background: "#90D916",
                        color: "#fff",
                        textTransform: "none",
                        borderRadius: "6px",
                        height: "31px",
                        fontSize: "14px",
                        px: 2,
                        width: {
                            xs: "100%",
                            sm: "auto",
                        },
                        "&:hover": {
                            background: "#7BC500",
                        },
                        "& .MuiButton-startIcon svg": {
                            fontSize: "17px",
                        },
                    }}
                    onClick={() => setIsEdit(true)}
                >
                    Edit Details
                </Button> */}
            </Box>

            {/* COURSE NOT SELECTED ALERT */}
            <Snackbar
                open={showCourseAlert}
                autoHideDuration={3000}
                onClose={() => setShowCourseAlert(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity="warning"
                    onClose={() => setShowCourseAlert(false)}
                >
                    Please select Course Name, Course Plan, and Course Timing before marking as Won.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LeadActionBar;
