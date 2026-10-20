import React from "react";
import { Grid, Card, Typography, Skeleton } from "@mui/material";

const PendingPaymentStats = ({ summaryCards, loading = false }) => {
    const parseAmount = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === "object") {
            const num = parseFloat(val?.amount ?? val?.value ?? val?.total_amount ?? val?.pending_amount);
            return isNaN(num) ? 0 : num;
        }
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    const parseCount = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === "object") {
            const num = parseInt(val?.count ?? val?.leads ?? val?.leads_count ?? val?.total_leads, 10);
            return isNaN(num) ? 0 : num;
        }
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
    };

    const totalPendingAmount = parseAmount(summaryCards?.total_pending);
    const totalPendingCount = parseCount(summaryCards?.total_pending);

    const dueTodayAmount = parseAmount(summaryCards?.due_today);
    const dueTodayCount = parseCount(summaryCards?.due_today);

    const overdueAmount = parseAmount(summaryCards?.overdue);
    const overdueCount = parseCount(summaryCards?.overdue);

    if (loading && !summaryCards) {
        return (
            <Grid container spacing={3}>
                {[1, 2, 3].map((item) => (
                    <Grid key={item} size={{ xs: 12, md: 4 }}>
                        <Card sx={{ p: 3, borderRadius: "10px" }}>
                            <Skeleton variant="text" width="40%" height={25} />
                            <Skeleton variant="text" width="70%" height={40} sx={{ mt: 1 }} />
                            <Skeleton variant="text" width="30%" height={20} />
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }

    const cards = [
        {
            title: "Total Pending",
            amount: totalPendingAmount,
            subtitle: `${totalPendingCount} Leads`,
            color: "#000000",
        },
        {
            title: "Due Today",
            amount: dueTodayAmount,
            subtitle: `${dueTodayCount} Leads`,
            color: "#0205C8",
        },
        {
            title: "Overdue Amount",
            amount: overdueAmount,
            subtitle: overdueCount > 0 ? `${overdueCount} Leads` : "Need Immediate Action",
            color: "#D91616",
        },
    ];

    return (
        <Grid container spacing={3}>
            {cards.map((item, index) => (
                <Grid key={index} size={{ xs: 12, md: 4 }}>
                    <Card sx={{ p: 3, borderRadius: "10px" }}>
                        <Typography sx={{ fontSize: '14px', color: '#A2A2A2', fontWeight: 400 }}>
                            {item.title}
                        </Typography>
                        <Typography sx={{ fontSize: "22px", fontWeight: 500, color: item.color, my: 0.5 }}>
                            ₹ {item.amount.toLocaleString()}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: item.title === "Overdue Amount" && overdueCount > 0 ? "#D91616" : "#A2A2A2", fontWeight: 400 }}>
                            {item.subtitle}
                        </Typography>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default PendingPaymentStats;