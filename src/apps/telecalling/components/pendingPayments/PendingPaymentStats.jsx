import {
    useEffect,
    useState,
} from "react";

import {
    Grid,
    Card,
    Typography,
    Skeleton,
} from "@mui/material";
import { getPendingPaymentStats } from "@/apps/telecalling/services/pendingPaymentService";
import { useAuth } from "@/shared/context/AuthContext";

const PendingPaymentStats = ({  selectedPipelineId = 0,}) => {
    const { hasPermission } = useAuth();
    const [statsData, setStatsData] =
        useState(null);

    useEffect(() => {
        fetchStats();
    }, [selectedPipelineId]);

    const fetchStats = async () => {
        if (!hasPermission("api_pending_payment_tiles")) {
            console.warn("Permission denied: api_pending_payment_tiles");
            return;
        }

        try {
            const response =
                await getPendingPaymentStats({pipeline_id: selectedPipelineId || 0});

            setStatsData(
                response.data.data[0]
            );

        } catch (error) {

        }
    };
    if (!statsData) {
        return (
            <Grid container spacing={3}>
                {[1, 2, 3].map((item) => (
                    <Grid
                        key={item}
                        size={{
                            xs: 12,
                            md: 4,
                        }}
                    >
                        <Card
                            sx={{
                                p: 3,
                                borderRadius: "10px",
                            }}
                        >
                            <Skeleton
                                variant="text"
                                width="40%"
                                height={25}
                            />

                            <Skeleton
                                variant="text"
                                width="70%"
                                height={40}
                                sx={{ mt: 1 }}
                            />

                            <Skeleton
                                variant="text"
                                width="30%"
                                height={20}
                            />
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }
    const cards = [

        {
            title: "Total Pending",

            amount:
                statsData.total_pending_amount,

            subtitle:
                `${statsData.total_leads} Leads`,

            color: "#000000",
        },

        {
            title: "Due Today",

            amount:
                statsData.today_due_amount,

            subtitle:
                `${statsData.today_due_leads} Leads`,

            color: "#0205C8",
        },

        {
            title: "Overdue Amount",

            amount:
                statsData.overdue_amount,

            subtitle:
                `${statsData.overdue_leads} Leads`,

            color: "#D91616",
        },
    ];

    return (

        <Grid
            container
            spacing={3}
        >

            {cards.map((item, index) => (

                <Grid
                    key={index}

                    size={{
                        xs: 12,
                        md: 4,
                    }}
                >

                    <Card
                        sx={{
                            p: 3,
                            borderRadius: "10px",
                        }}
                    >

                        <Typography sx={{
                            fontSize: '14px',
                            color: '#A2A2A2',
                            fontWeight: 400
                        }}>
                            {item.title}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: "22px",
                                fontWeight: 500,
                                color: item.color,
                            }}
                        >
                            ₹ {item.amount}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: '14px',
                                color: '#A2A2A2',
                                fontWeight: 400
                            }}>
                            {item.subtitle}
                        </Typography>

                    </Card>

                </Grid>

            ))}

        </Grid>
    );
};

export default PendingPaymentStats;
