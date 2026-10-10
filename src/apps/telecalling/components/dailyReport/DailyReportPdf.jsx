import { Box, Typography, Grid, Paper } from "@mui/material";

const DailyReportPdf = ({ report }) => {
    if (!report) return null;

    return (
        <Box
            id="daily-report-pdf"
            sx={{
                width: "794px", // A4 width
                background: "#fff",
                p: 4,
                color: "#000",
            }}
        >
            {/* Header */}

            <Box
                sx={{
                    bgcolor: "#90D916",
                    color: "#fff",
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                }}
            >
                <Typography fontSize={24} fontWeight={700}>
                    Code 99 IT Acadmey
                </Typography>

                <Typography fontSize={16}>
                    Daily Telecaller Report
                </Typography>
            </Box>

            {/* User Details */}

            <Grid container spacing={2} mb={3}>
                <Grid size={6}>
                    <Typography>
                        <b>Employee :</b> {report.user_name}
                    </Typography>
                </Grid>

                <Grid size={6}>
                    <Typography>
                        <b>Role :</b> {report.user_role}
                    </Typography>
                </Grid>

                <Grid size={6}>
                    <Typography>
                        <b>Date :</b> {report.data.report_date}
                    </Typography>
                </Grid>

                <Grid size={6}>
                    <Typography>
                        <b>Generated :</b>{" "}
                        {new Date().toLocaleString()}
                    </Typography>
                </Grid>
            </Grid>

            {/* Activity */}

            <Typography
                fontSize={18}
                fontWeight={700}
                mb={2}
            >
                Today's Activity
            </Typography>

            <Paper variant="outlined">
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background: "#90D916",
                                color: "#fff",
                            }}
                        >
                            <th
                                style={{
                                    padding: 10,
                                    border: "1px solid #ddd",
                                }}
                            >
                                Activity
                            </th>

                            <th
                                style={{
                                    padding: 10,
                                    border: "1px solid #ddd",
                                }}
                            >
                                Count
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {[
                            ["Total Leads", report.data.total_leads],
                            ["New Leads", report.data.new_leads],
                            ["Call Spoked", report.data.call_spoked],
                            ["Not Respond", report.data.not_respond],
                            ["Follow Up", report.data.follow_up],
                            ["Pending Follow Up", report.data.pending_follow_up],
                            ["Partial Payment", report.data.partial_payment],
                            ["Full Payment", report.data.full_payment],
                        ].map(([label, value]) => (
                            <tr key={label}>
                                <td
                                    style={{
                                        padding: 10,
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    {label}
                                </td>

                                <td
                                    style={{
                                        padding: 10,
                                        textAlign: "center",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    {value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Paper>

            {/* Manual Entry */}

            <Typography
                fontSize={18}
                fontWeight={700}
                mt={4}
                mb={2}
            >
                Manual Entry
            </Typography>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography>
                    <b>Tomorrow Conversation :</b>{" "}
                    {report.data.tomorrow_conversation}
                </Typography>

                <Typography mt={1}>
                    <b>Lead For Tomorrow :</b>{" "}
                    {report.data.lead_for_tomorrow}
                </Typography>

                <Typography mt={3} fontWeight={700}>
                    Manager Notes
                </Typography>

                <Typography mt={1}>
                    {report.data.own_message}
                </Typography>
            </Paper>

            <Typography
                mt={5}
                align="center"
                color="gray"
            >
                Generated by CRM System
            </Typography>
        </Box>
    );
};

export default DailyReportPdf;
