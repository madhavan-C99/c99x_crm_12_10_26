
import {
    Box,
    Typography,
} from "@mui/material";

const PipelineHeader = () => {

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
        Pipeline
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
    );
};

export default PipelineHeader;
