import React from "react";
import {
    Box,
    Typography,
    Button,
    MenuItem,
    Select,
    FormControl
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { useAuth } from "@/shared/context/AuthContext";

const PendingPaymentHeader = ({ onExport, pipelinesList = [], selectedPipeline, onPipelineChange }) => {
    const { hasPermission } = useAuth();

    const handlePipelineSelect = (e) => {
        if (onPipelineChange) {
            onPipelineChange(e.target.value);
        }
    };

    const currentPipelineObj = (Array.isArray(pipelinesList) ? pipelinesList : []).find(
        (p) => (p.id ?? p.value) === selectedPipeline || p === selectedPipeline
    );

    return (
        <Box
            sx={{
                mb: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2
            }}
        >
            {/* LEFT TITLE & SUBTITLE */}
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
                    Track and manage all pending payment collections from leads
                </Typography>
            </Box>

            {/* RIGHT CONTROLS: PIPELINE DROPDOWN & EXPORT BUTTON */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5
                }}
            >
                {/* PIPELINE DROPDOWN */}
                <FormControl size="small">
                    <Select
                        value={selectedPipeline || ""}
                        onChange={handlePipelineSelect}
                        displayEmpty
                        IconComponent={KeyboardArrowDownIcon}
                        renderValue={(selected) => {
                            if (!selected) {
                                return <span style={{ color: "#9CA3AF" }}>Select Pipeline</span>;
                            }
                            return currentPipelineObj?.name || currentPipelineObj?.label || (typeof selected === "string" ? selected : String(selected));
                        }}
                        sx={{
                            height: "36px",
                            minWidth: "140px",
                            borderRadius: "8px",
                            background: "#fff",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#333",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#D0CCCC",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#A0A0A0",
                            },
                        }}
                    >
                        <MenuItem value="" disabled sx={{ color: "#9CA3AF" }}>
                            Select Pipeline
                        </MenuItem>
                        {Array.isArray(pipelinesList) && pipelinesList.length > 0 ? (
                            pipelinesList.map((pipe) => {
                                const val = pipe.id ?? pipe.value;
                                const label = pipe.name || pipe.label || String(val);
                                return (
                                    <MenuItem key={val} value={val}>
                                        {label}
                                    </MenuItem>
                                );
                            })
                        ) : (
                            <MenuItem value="" disabled>
                                No Pipelines Available
                            </MenuItem>
                        )}
                    </Select>
                </FormControl>

                {/* EXPORT BUTTON */}
                {(hasPermission("api_export_pending_payments_admin") || hasPermission("export_pending_payments")) && (
                    <Button
                        onClick={onExport}
                        startIcon={<CalendarMonthOutlinedIcon sx={{ color: "#1E293B", fontSize: "18px" }} />}
                        sx={{
                            height: "36px",
                            px: 2.5,
                            borderRadius: "8px",
                            background: "#D9F99D",
                            color: "#1E293B",
                            textTransform: "none",
                            fontSize: "14px",
                            fontWeight: 500,
                            border: "1px solid #C0E875",
                            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
                            "&:hover": {
                                background: "#CBEF80",
                            },
                        }}
                    >
                        Export
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default PendingPaymentHeader;