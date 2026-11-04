
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
    Box,
    Grid,
    Typography,
} from "@mui/material";

import PerformanceCard from "@/apps/telecalling/components/dashboard/PerformanceCard";
import LossAnalysisCard from "@/apps/telecalling/components/dashboard/LossAnalysisCard";
import EnrollmentByCourseCard from "@/apps/telecalling/components/dashboard/EnrollmentByCourseCard";

import { getEnrolledcourse } from "@/apps/telecalling/services/performanceService";
import { useAuth } from "@/shared/context/AuthContext";

const DashboardBottomCards = ({
    selectedPipelineId = 0,
    filterType = "this_month",
    fromDate = "",
    toDate = "",
}) => {
    const { hasPermission } = useAuth();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        if (filterType === "custom" && (!fromDate || !toDate)) {
            return;
        }

        const fetchDashboardData = async () => {
            if (!hasPermission("api_fetch_tele_performance")) {
                setDashboardData(null);
                setError("You don't have permission to view performance.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const payload = {
                    pipeline_id: Number(selectedPipelineId) || 0,
                    filter_type: filterType,
                };

                if (filterType === "custom" && fromDate && toDate) {
                    payload.from_date = dayjs(fromDate).format("YYYY-MM-DD");
                    payload.to_date = dayjs(toDate).format("YYYY-MM-DD");
                }

                const response = await getEnrolledcourse(payload);

                if (isMounted) {
                    setDashboardData(response.data.data);
                }
            } catch (err) {
                console.error("Dashboard performance API error:", err);

                if (isMounted) {
                    setError("Failed to load dashboard data.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboardData();

        return () => {
            isMounted = false;
        };
    }, [selectedPipelineId, filterType, fromDate, toDate, hasPermission]);

    if (error && !dashboardData) {
        return (
            <Box sx={{ width: "100%", mt: 3, mb: 3 }}>
                <Typography color="error">
                    {error}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                mt: 3,
                mb: 3,
                overflow: "hidden",
            }}
        >
            <Grid
                container
                spacing={3}
                justifyContent="center"
            >
                {/* PERFORMANCE */}
                <Grid
                    size={{
                        xs: 12,
                        sm: 5.8,
                        lg: 4,
                    }}
                    sx={{ display: "flex", minWidth: 0 }}
                >
                    <PerformanceCard
                        performance={dashboardData?.performance}
                        loading={loading || !dashboardData}
                    />
                </Grid>

                {/* ENROLLMENT */}
                <Grid
                    size={{
                        xs: 12,
                        sm: 5.8,
                        lg: 4,
                    }}
                    sx={{ display: "flex", minWidth: 0 }}
                >
                    <EnrollmentByCourseCard
                        enrollment={dashboardData?.enrollment ?? []}
                        loading={loading || !dashboardData}
                    />
                </Grid>

                {/* LOSS */}
                <Grid
                    size={{
                        xs: 12,
                        sm: 5.8,
                        lg: 4,
                    }}
                    sx={{
                        display: "flex",
                        minWidth: 0,
                        mx: {
                            sm: "auto",
                            lg: 0,
                        },
                    }}
                >
                    <LossAnalysisCard
                        lossAnalysis={dashboardData?.loss_analysis}
                        loading={loading || !dashboardData}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardBottomCards;
