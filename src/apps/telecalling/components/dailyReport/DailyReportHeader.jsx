
import {
    Box,
    Typography,
} from "@mui/material";

const DailyReportHeader = () => {
    return (

        <Box
            sx={{
                mb: 4,
            }}
        >

            <Typography
                sx={{
                    fontSize: {
                        xs: "20px",
                        sm: "22px",
                        md: "24px",
                    },

                    fontWeight: 600,

                    color: "#111",

                    lineHeight: 1.2,
                }}
            >
                Daily Report
            </Typography>

            <Typography
                sx={{
                    fontSize: {
                        xs: "13px",
                        sm: "14px",
                        md: "16px",
                    },

                    color: "#777",

                    fontWeight: 400,

                    lineHeight: 1.5,

                    mt: 0.5,
                }}
            >
                Auto-synced from today's activity
            </Typography>

        </Box>
    );
};

export default DailyReportHeader;
