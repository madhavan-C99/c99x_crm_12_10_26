
import { useEffect, useState } from "react";

import {
    Box,
    Grid,
    Typography,
} from "@mui/material";

import PerformanceCard from "@/apps/telecalling/components/dashboard/PerformanceCard";
import LossAnalysisCard from "@/apps/telecalling/components/dashboard/LossAnalysisCard";
import EnrollmentByCourseCard from "@/apps/telecalling/components/dashboard/EnrollmentByCourseCard";

import { getPerformanceData } from "@/apps/telecalling/services/performanceService";
import { useAuth } from "@/shared/context/AuthContext";

const DashboardBottomCards = ({ selectedPipelineId = 0 }) => {
    const { hasPermission } = useAuth();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

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
                const response = await getPerformanceData({
                    pipeline_id: Number(selectedPipelineId) || 0,
                });

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
    }, [selectedPipelineId, hasPermission]);

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
