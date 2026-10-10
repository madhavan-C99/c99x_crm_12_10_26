
import PipelineSelect from "@/shared/components/filters/PipelineSelect";
import {
    Box,
    Typography,
} from "@mui/material";

const PendingPaymentHeader = ({
    pipelines = [],
    selectedPipelineId = 0,
    handlePipelineChange,
}) => {
    return (
        <Box
            sx={{
                mb: 4,
                display: "flex",
                alignItems: {
                    xs: "flex-start",
                    md: "center",
                },
                justifyContent: "space-between",
                gap: 2,
                flexDirection: {
                    xs: "column",
                    md: "row",
                },
            }}
        >
            {/* LEFT SIDE */}
            <Box>
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
                    Pending Payments
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
                    Track and manage all pending payment collections from leads
                </Typography>
            </Box>

            {/* RIGHT SIDE - PIPELINE */}
            <PipelineSelect
                pipelines={pipelines}
                value={selectedPipelineId}
                onChange={handlePipelineChange}
            />
        </Box>
    );
};

export default PendingPaymentHeader;
