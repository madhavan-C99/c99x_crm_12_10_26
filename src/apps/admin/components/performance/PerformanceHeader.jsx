import React from "react"

import { Box,Typography,Button,MenuItem,Select,FormControl } from "@mui/material";


const PerformanceHeader=() =>{

    return (
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
          Performance Overview
        </Typography>
        <Typography
          sx={{
            fontSize: {
              xs: "12px",
              sm: "14px",
              md: "16px",
            },
            color: "#777",
            fontWeight: 400,
            lineHeight: 1.5,
            mt: 0.5,
          }}
        >
          Track and monitor telecaller performance
        </Typography>
      </Box>
    );

}

export default PerformanceHeader;