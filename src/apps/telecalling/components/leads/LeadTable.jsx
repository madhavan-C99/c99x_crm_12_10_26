import { useEffect, useState } from "react";

import { Box, Typography } from "@mui/material";

import LeadRowDetails from "@/apps/telecalling/components/leads/LeadRowDetails";
import GenericTable
    from "@/shared/components/table/Table";

const LeadTable = ({

    tableData = [],

    loading = false,

}) => {
    const [expandedLeadId, setExpandedLeadId] = useState(null);

    const handleRowClick = (row) => {
        setExpandedLeadId((prev) => (prev === row.id ? null : row.id));
    };

    // DATE FORMAT

    const formatDate = (
        date
    ) => {

        if (!date) return "-";

        return new Date(
            date
        ).toLocaleDateString(
            "en-GB"
        );
    };

    // TABLE COLUMNS
    // Stage styles
    const getStageStyle = (stages) => {

        switch (stages?.toLowerCase()) {

            case "new":
                return {
                    background: "#0205C8",

                };

            case "cold":
                return {
                    background: "#1890FF",

                };

            case "warm":
                return {
                    background: "#FA8C16",

                };

            case "hot":
                return {
                    background: "#D91616",

                };

            default:
                return {
                    background: "#FA8C16",

                };
        }
    };

    const columns = [

        {
            field: "s_no",

            headerName: "S.No",

            minWidth: 50,
            sticky: true, stickyWidth: 70, hideable: false,
            renderCell: (
                row,
                index
            ) => (

                <Typography
                    sx={{
                        color: '#4D4D4D',
                        fontSize: "14px",
                        
                    }}
                >
                    {index + 1}
                </Typography>
            ),
        },

        {
            field: "full_name",

            headerName: "Name",

            minWidth: 130,

            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontWeight: 600,
                        fontSize: "14px",
                    }}
                >
                    {row.full_name}
                </Typography>
            ),
        },

        {
            field: "mobile_no",

            headerName: "Contact",

            minWidth: 100,

            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontSize: "14px",
                        color: "#4D4D4D",
                    }}
                >
                    {row.mobile_no}
                </Typography>

            ),
        },

        {
            field: "email",

            headerName: "Mail Id",

            minWidth: 180,
            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontSize: "14px",
                        color: "#4D4D4D",
                    }}
                >
                    {row.email}
                </Typography>

            ),
        },

        {
            field: "source",

            headerName: "Source",

            minWidth: 90,
        },
        {
            field: "campaign_name",

            headerName: "Campaign",

            minWidth: 130,

            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontWeight: 600,
                        fontSize: "14px",
                    }}
                >
                    {row.campaign_name}
                </Typography>
            ),
        },

        {
            field: "stage",

            headerName: "Stage",

            minWidth: 130,

            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontWeight: 600,
                        fontSize: "14px",
                    }}
                >
                    {row.stage}
                </Typography>
            ),
        },
          {
            field: "stages",

            headerName: "Tag",

            minWidth: 130,

            renderCell: (
                row
            ) => (

                <Box
                    sx={{

                        width: "80px",
                        height: '19px',
                        borderRadius: "4px",

                        fontSize: "14px",

                        fontWeight: 500,

                        textTransform: "capitalize",

                        m: "auto",

                        ...getStageStyle(row.tag),

                        color: 'white'
                    }}
                >

                    {row.tag}

                </Box>
            ),
        },

        {
            field: "course_plan",

            headerName:
                "Course Plan",

            minWidth: 180,
        },

        {
            field: "course_name",

            headerName:
                "Course",

            minWidth: 240,
        },

        {
            field: "payment_amount",

            headerName: "Payment",

            minWidth: 150,

            renderCell: (row) => {
                const isFullyPaid = row.is_full_payment || (row.pending_amount !== null && row.pending_amount !== undefined && Number(row.pending_amount) === 0 && Number(row.amount_paid) > 0);
                const hasPending = row.pending_amount !== null && row.pending_amount !== undefined && Number(row.pending_amount) > 0;

                if (isFullyPaid) {
                    return (
                        <Typography
                            sx={{
                                color: "#10B981",
                                fontWeight: 700,
                                fontSize: "14px",
                            }}
                        >
                            Fully Paid
                        </Typography>
                    );
                }

                if (hasPending) {
                    return (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <Typography
                                sx={{
                                    color: "#D91616",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                }}
                            >
                                ₹ {row.pending_amount} Pending
                            </Typography>
                            {row.total_amount && (
                                <Typography
                                    sx={{
                                        fontSize: "11px",
                                        color: "#6B7280",
                                    }}
                                >
                                    Total: ₹ {row.total_amount}
                                </Typography>
                            )}
                        </Box>
                    );
                }

                return (
                    <Typography
                        sx={{
                            color: "#9CA3AF",
                            fontSize: "14px",
                        }}
                    >
                        -
                    </Typography>
                );
            },
        },

        {
            field:
                "enquiry_date",

            headerName:
                "Lead Created On",

            minWidth: 150,

            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontSize: "14px",
                        color: '#4D4D4D'
                    }}
                >
                    {
                        formatDate(
                            row.enquiry_date
                        )
                    }
                </Typography>

            ),
        },

        {
            field:
                "called_at",

            headerName:
                "Last Contacted",

            minWidth: 150,

            renderCell: (
                row
            ) => (
                <Typography
                    sx={{
                        fontSize: "14px",
                        color: '#4D4D4D'
                    }}
                >
                    {
                        formatDate(
                            row.called_at
                        )
                    }
                </Typography>

            ),
        },
    ];
    useEffect(() => {
    }, [tableData]);

    return (

        <GenericTable

            columns={columns}

            rows={tableData}

            loading={loading}

            minWidth={1700}

            maxHeight={700}
            sx={{
                mt: 3,

            }}
            onRowClick={handleRowClick}
            getRowId={(row) => row.id}
            expandedRowId={expandedLeadId}
            renderExpandedRow={(row) => <LeadRowDetails leadId={row.id} />}
        />
    );
};

export default LeadTable;
