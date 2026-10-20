import React from "react";
import { Box, Typography } from "@mui/material";
import Table from "@/shared/components/table/Table";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";

const PendingPaymentTable = ({
    tableData = [],
    loading = false,
    page = 1,
    pageSize = 50,
    totalRecords = 0,
    onPageChange,
    onRowsPerPageChange,
}) => {
    const safeTableData = Array.isArray(tableData) ? tableData : [];

    const columns = [
        {
            field: "s_no",
            headerName: "S.No",
            minWidth: 70,
            renderCell: (row, index) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, color: isOverdue ? "#E53935" : "#000" }}>
                        {row?.s_no ?? ((page - 1) * pageSize + index + 1)}
                    </Typography>
                );
            }
        },
        {
            field: "name",
            headerName: "Name",
            minWidth: 160,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, color: isOverdue ? "#E53935" : "#000" }}>
                        {row?.name || row?.full_name || "-"}
                    </Typography>
                );
            }
        },
        {
            field: "contact",
            headerName: "Contact",
            minWidth: 160,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                        <CallOutlinedIcon sx={{ fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }} />
                        <Typography sx={{ fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }}>
                            {row?.contact || row?.mobile_no || "-"}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: "assigned_to",
            headerName: "Assign To",
            minWidth: 150,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 400, color: isOverdue ? "#E53935" : "#333" }}>
                        {row?.assigned_to || "-"}
                    </Typography>
                );
            }
        },
        {
            field: "campaign",
            headerName: "Campaign",
            minWidth: 180,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 400, color: isOverdue ? "#E53935" : "#333" }}>
                        {row?.campaign || "-"}
                    </Typography>
                );
            }
        },
        {
            field: "course_plan",
            headerName: "Course Plan",
            minWidth: 150,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 500, color: isOverdue ? "#E53935" : "#333" }}>
                        {row?.course_plan || "-"}
                    </Typography>
                );
            }
        },
        {
            field: "course",
            headerName: "Course",
            minWidth: 220,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 500, color: isOverdue ? "#E53935" : "#000" }}>
                        {row?.course || row?.course_name || "-"}
                    </Typography>
                );
            }
        },
        {
            field: "joining_date",
            headerName: "Joining Date",
            minWidth: 160,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                        <EventOutlinedIcon sx={{ fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }} />
                        <Typography sx={{ fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }}>
                            {row?.joining_date || row?.enquiry_date || "-"}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: "batch_timing",
            headerName: "Batch & Timing",
            minWidth: 180,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                        <EventOutlinedIcon sx={{ fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }} />
                        <Typography sx={{ fontWeight: 400, fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }}>
                            {row?.batch_timing || row?.course_timing || "-"}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: "amount_paid",
            headerName: "Amount Paid",
            minWidth: 140,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                const amt = parseFloat(row?.amount_paid) || 0;
                return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 500, color: isOverdue ? "#E53935" : "#000" }}>
                        ₹{amt.toLocaleString()}
                    </Typography>
                );
            }
        },
        {
            field: "pending_amount",
            headerName: "Pending Amount",
            minWidth: 170,
            renderCell: (row) => {
                const amt = parseFloat(row?.pending_amount ?? row?.payment_amount) || 0;
                return (
                    <Typography sx={{ fontSize: "14px", color: "#E53935", fontWeight: 600 }}>
                        ₹{amt.toLocaleString()} pending
                    </Typography>
                );
            }
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 110,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.3,
                            borderRadius: "4px",
                            background: isOverdue ? "#E53935" : "#0205C8",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 500,
                            m: "auto",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textTransform: "capitalize",
                        }}
                    >
                        {row?.status || row?.due_status || "Active"}
                    </Box>
                );
            }
        },
        {
            field: "next_followup",
            headerName: "Next Follow up",
            minWidth: 160,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                        <EventOutlinedIcon sx={{ fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }} />
                        <Typography sx={{ fontSize: "14px", color: isOverdue ? "#E53935" : "#4D4D4D" }}>
                            {row?.next_followup || row?.next_follow_up || "-"}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: "last_conversation",
            headerName: "Last Conversation",
            minWidth: 260,
            renderCell: (row) => {
                const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
                return (
                    <Typography sx={{ whiteSpace: "normal", color: isOverdue ? "#E53935" : "#333", fontSize: "14px" }}>
                        {row?.last_conversation || "-"}
                    </Typography>
                );
            }
        }
    ];

    const getRowStyle = (row) => {
        const isOverdue = String(row?.status || row?.due_status || "").toLowerCase().includes("over");
        return isOverdue
            ? {
                color: "#E53935 !important",
                "& td, & p, & span, & svg": {
                    color: "#E53935 !important",
                }
            }
            : {};
    };

    return (
        <>
            <Box sx={{ mt: 2.5, mb: -1.5, color: "#666", fontSize: "14px", fontWeight: 500 }}>
                Showing <Box component="span" sx={{ fontWeight: 600, color: "#000" }}>{totalRecords}</Box> leads
            </Box>
            <Table
                serverSide={true}
                page={page - 1}
                rowsPerPage={pageSize}
                totalCount={totalRecords}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
                columns={columns}
                rows={safeTableData}
                loading={loading}
                minWidth={1900}
                maxHeight={500}
                sx={{ mt: 3 }}
                getRowStyle={getRowStyle}
                getRowId={(row, index) => row?.id || row?.payment_id || index}
            />
        </>
    );
};

export default PendingPaymentTable;