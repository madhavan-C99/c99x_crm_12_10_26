

import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
} from "@mui/material";






import CallOutlinedIcon
    from "@mui/icons-material/CallOutlined";

import EventOutlinedIcon
    from "@mui/icons-material/EventOutlined";
import GenericTable
    from "@/shared/components/table/Table";

const PendingPaymentTable = ({
    tableData,
    loading,
    searchTerm
}) => {

    const navigate = useNavigate();

    const handleRowClick = (row) => {
        sessionStorage.setItem("lead_return_path", "/crm.c99x.in/telecalling/pending-payments");
        navigate(`/crm.c99x.in/telecalling/lead-details/${row.id}`);
    };

    // FETCH TABLE DATA

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
    //Search bar logic
    const filteredRows =
        tableData.filter((row) => {

            const search =
                searchTerm?.toLowerCase() || "";

            return (

                row.full_name
                    ?.toLowerCase()
                    .includes(search)

                ||

                row.mobile_no
                    ?.toString()
                    .includes(search)

                ||

                row.course_name
                    ?.toLowerCase()
                    .includes(search)
            );
        });

    // TABLE COLUMNS

    const columns = [

        {
            field: "s_no",

            headerName: "S.No",

            minWidth: 80,
             sticky: true, stickyWidth: 70, hideable: false,
            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontWeight: 600,
                        fontSize: '14px',

                    }}
                >
                    {row.s_no}
                </Typography>
            ),
        },

        {
            field: "full_name",

            headerName: "Name",

            minWidth: 180,

            renderCell: (
                row
            ) => (

                <Typography
                    sx={{
                        fontWeight: 600,
                        fontSize: '14px',
                    }}
                >
                    {row.full_name}
                </Typography>
            ),
        },

        {
            field: "mobile_no",

            headerName: "Contact",

            minWidth: 150,
            renderCell: (
                row
            ) => {
                const isHighPending =
                    row.due_status == "Over Due";
                return (

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: '4px',
                            justifyContent: 'center'
                        }}
                    >

                        <CallOutlinedIcon
                            sx={{
                                fontSize: "17px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",
                            }}
                        />

                        <Typography
                            sx={{
                                fontWeight: 400,
                                fontSize: "14px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",
                            }}
                        >
                            {row.mobile_no}
                        </Typography>

                    </Box>
                )
            }
        },

        {
            field: "course_plan",

            headerName:
                "Course Plan",

            minWidth: 170,

            renderCell: (
                row
            ) => (

                <Box
                    sx={{

                        width:
                            "fit-content",
                        fontSize:
                            "16px",
                        fontWeight: 400,
                        m: 'auto',

                    }}
                >

                    {
                        row.course_plan
                    }

                </Box>
            ),
        },

        {
            field: "course_name",

            headerName:
                "Course",

            minWidth: 230,
        },

        {
            field: "enquiry_date",

            headerName:
                "Joining Date",

            minWidth: 140,

            renderCell: (
                row
            ) => {
                const isHighPending =
                    row.due_status == "Over Due";
                return (

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: '2px',
                            justifyContent: 'center'
                        }}
                    >

                        <EventOutlinedIcon
                            sx={{
                                fontSize: "14px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: "14px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",

                            }}
                        >

                            {formatDate(
                                row.enquiry_date
                            )}

                        </Typography>

                    </Box>

                )
            }
        },

        {
            field:
                "course_timing",

            headerName:
                "Batch & Timing",

            minWidth: 180,
            renderCell: (
                row
            ) => {
                const isHighPending =
                    row.due_status == "Over Due";
                return (

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: '2px',
                            justifyContent: 'center'
                        }}
                    >

                        <EventOutlinedIcon
                            sx={{
                                fontSize: "14px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",
                            }}
                        />

                        <Typography
                            sx={{
                                fontWeight: 400,
                                fontSize: "14px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",
                            }}
                        >

                            {row.course_timing}

                        </Typography>

                    </Box>
                )

            }
        },

        {
            field:
                "amount_paid",

            headerName:
                "Amount Paid",

            minWidth: 150,

            renderCell: (
                row
            ) => (

                <Typography>
                    ₹
                    {
                        row.amount_paid
                    }
                </Typography>
            ),
        },

        {
            field:
                "payment_amount",

            headerName:
                "Pending Amount",

            minWidth: 170,

            renderCell: (
                row
            ) => {
                const isHighPending =
                    row.due_status == "Over Due";
                return (

                    <Typography
                        sx={{

                            color: isHighPending
                                ? "#fff"
                                : "#4D4D4D",

                            fontWeight: 600,
                        }}
                    >
                        ₹
                        {
                            row.pending_amount
                        }
                    </Typography>
                )
            }
        },

        {
            field:
                "payment_status",

            headerName:
                "Stage",

            minWidth: 120,

            renderCell: (
                row
            ) => {
                const isHighPending =
                    row.due_status == "over due";
                return (

                    <Box
                        sx={{

                            width:
                                "80px",
                            height: '21px',

                            borderRadius:
                                "4px",

                            background: isHighPending
                                ? "#E53935"
                                : "#0205C8",

                            color: "#ffffff",
                            fontSize:
                                "14px",

                            fontWeight: 500,

                            m: 'auto',
                            textTransform: 'capitalize'
                        }}
                    >

                        {
                            row.due_status
                        }

                    </Box>
                )
            }
        },

        {
            field: "followup",

            headerName:
                "Next Follow Up",

            minWidth: 160,

            renderCell: (
                row
            ) => {
                const isHighPending =
                    row.due_status == "Over Due";
                return (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: '2px',
                            justifyContent: 'center'
                        }}
                    >

                        <EventOutlinedIcon
                            sx={{
                                fontSize: "14px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: "14px",
                                color: isHighPending
                                    ? "#fff"
                                    : "#4D4D4D",

                            }}
                        >

                            {formatDate(
                                row.next_follow_up
                            )}

                        </Typography>

                    </Box>)
            }
        },

        {
            field:
                "last_conversation",

            headerName:
                "Last Conversation",

            minWidth: 280,

            renderCell: (
                row
            ) => (

                <Typography
                    sx={{

                        whiteSpace:
                            "normal",
                    }}
                >

                    {
                        row.last_conversation
                    }

                </Typography>
            ),
        },
    ];
    const getRowStyle = (row) => {

        return (
            row.due_status == "Over Due"
        )

            ? {

                backgroundColor:
                    "#E53935",

                "& td": {
                    color: "#fff",
                },
            }

            : {};
    };

    return (

        <GenericTable

            columns={columns}

            rows={filteredRows}

            loading={loading}

            minWidth={1400}

            maxHeight={285}
            sx={{
                mt: 3,
            }}
            getRowStyle={getRowStyle}
            onRowClick={handleRowClick}

        />
    );
};

export default PendingPaymentTable;
