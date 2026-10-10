import {
    useEffect,
    useState,
} from "react";

import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import { useParams } from "react-router-dom";


import {
    fetchPaymentHistory,
} from "@/apps/telecalling/services/paymentService";

import PaymentDetailsModal from "@/apps/telecalling/components/leadDetail/PaymentDetailsModal";
import { useAuth } from "@/shared/context/AuthContext";

const PaymentHistory = ({ leadId, refreshLeadDetails, leadData }) => {
    const { hasPermission } = useAuth();
    const { id } = useParams();
    const [openModal, setOpenModal] =
        useState(false);

    const [
        paymentHistory,
        setPaymentHistory,
    ] = useState([]);
    const [fullyPaidDialog, setFullyPaidDialog] = useState(false);
    const [notWonDialog, setNotWonDialog] = useState(false);
    const latestPendingAmount =
        paymentHistory?.length > 0

            ? paymentHistory[
                paymentHistory.length - 1
            ]?.pending_amount

            : 0;

    // FETCH API

    useEffect(() => {

        getPaymentHistory();

    }, [id]);

    const getPaymentHistory =
        async () => {
            if (!hasPermission("api_payment_history_api")) {
                console.warn("Permission denied: api_payment_history_api");
                return;
            }

            try {

                const response =
                    await fetchPaymentHistory(
                        id
                    );

                setPaymentHistory(
                    response.data.data
                );

            } catch (error) {

            }
        };

    const isWonStage =
        (leadData?.pipeline_stage || "").toLowerCase() === "won";

    const handlePaymentOpen = () => {

        // ✅ 1. Stage Won illайெনில் — course/stage select pண்ணும்படி sollunga
        if (!isWonStage) {
            setNotWonDialog(true);
            return;
        }

        // ✅ 2. Stage Won, aana pending amount 0 — already fully paid
        if (Number(latestPendingAmount) <= 0) {
            setFullyPaidDialog(true);
            return;
        }

        // ✅ 3. Stage Won, pending amount иருக்கு — normal-a modal open
        setOpenModal(true);
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

    return (

        <Box
            sx={{
                background: "#fff",

                border: '1px solid #00000033',

                borderRadius: "22px",

                p: {
                    xs: 2,
                    md: 4,
                },

                mt: 4,

            }}
        >

            {/* TOP */}

            <Box
                sx={{
                    display: "flex",

                    justifyContent:
                        "space-between",

                    alignItems: "center",

                    flexWrap: "wrap",

                    gap: 2,

                    mb: 3,
                }}
            >

                <Box
                    sx={{
                        display: "flex",

                        alignItems: "center",

                        gap: '7px',
                    }}
                >

                    <PersonOutlineRoundedIcon
                        sx={{
                            color: "#90D916",
                            height: '24px',
                            width: '24px'
                        }}
                    />

                    <Typography
                        sx={{
                            fontSize: "18px",

                            fontWeight: 600,

                            color: "#000000",
                        }}
                    >
                        Payment History
                    </Typography>

                </Box>

                <Button
                    startIcon={<AddIcon sx={{ height: '24px', width: '24px' }} />}
                    onClick={handlePaymentOpen}
                    sx={{
                        border: isWonStage ? "1px solid #90D916" : "1px solid #D9D9D9",
                        color: isWonStage ? "#000000" : "#A0A0A0",
                        borderRadius: "6px",
                        textTransform: "none",
                        width: '126px',
                        height: "31px",
                        fontWeight: 400,
                        background: isWonStage ? "#E9F6D4" : "#F2F2F2",
                    }}
                >
                    Add Details
                </Button>

            </Box>

            {/* TABLE */}

            <Box
                sx={{
                    width: "100%",

                    overflowX: "auto",
                }}
            >

                <Box
                    sx={{
                        minWidth: "950px",
                    }}
                >

                    {/* HEADER */}

                    <Box
                        sx={{
                            display: "grid",

                            gridTemplateColumns:
                                "1fr 1fr 1fr 1fr 1fr 2fr",

                            background:
                                "#E6E6E6",

                            py: 2,

                            borderRadius:
                                "7px 7px 0 0",
                            textAlign: 'center'
                        }}
                    >

                        {[
                            "Date",
                            "Amount Paid",
                            "Pending Amount",
                            "Due Date",
                            "Status",
                            "Description",
                        ].map(
                            (item) => (

                                <Typography
                                    key={item}

                                    sx={{
                                        fontSize:
                                            "16px",

                                        fontWeight: 600,

                                        color: "#000000",
                                    }}
                                >
                                    {item}
                                </Typography>

                            )
                        )}

                    </Box>

                    {/* BODY */}

                    {paymentHistory.length >
                        0 ? (

                        paymentHistory.map(
                            (
                                item,
                                index
                            ) => (

                                <Box
                                    key={index}

                                    sx={{
                                        display:
                                            "grid",

                                        gridTemplateColumns:
                                            "1fr 1fr 1fr 1fr 1fr 2fr",

                                        py: 1,

                                        borderBottom:
                                            "1px solid #ECECEC",

                                        alignItems:
                                            "center",
                                        textAlign: 'center',

                                        "& .MuiTypography-root": {
                                            fontSize: "14px",
                                            fontWeight: 400,
                                            color: '#4D4D4D',
                                        },

                                    }}
                                >

                                    <Typography>
                                        {formatDate(
                                            item.date
                                        )}
                                    </Typography>

                                    <Typography>
                                        ₹
                                        {
                                            item.amount_paid
                                        }
                                    </Typography>

                                    <Typography>
                                        ₹
                                        {
                                            item.pending_amount
                                        }
                                    </Typography>

                                    <Typography>
                                        {formatDate(
                                            item.due_date
                                        )}
                                    </Typography>

                                    <Typography>
                                        {
                                            item.status
                                        }
                                    </Typography>

                                    <Typography>
                                        {
                                            item.description ||
                                            "-"
                                        }
                                    </Typography>

                                </Box>

                            )
                        )

                    ) : (

                        <Box
                            sx={{
                                py: 5,

                                textAlign:
                                    "center",
                            }}
                        >

                            <Typography>
                                No Payment History
                                Found
                            </Typography>

                        </Box>

                    )}

                </Box>

            </Box>
            <PaymentDetailsModal

                open={openModal}

                handleClose={() =>
                    setOpenModal(false)
                }

                leadId={id}

                pendingAmount={latestPendingAmount}

                refreshLeadDetails={refreshLeadDetails}

                refreshPaymentHistory={
                    getPaymentHistory
                }
                leadData={leadData}

            />
            <Dialog
                open={fullyPaidDialog}
                onClose={() => setFullyPaidDialog(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
                    Payment Complete
                </DialogTitle>

                <DialogContent>
                    <Typography align="center">
                        Full amount already paid by the lead.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: "#90D916",
                            textTransform: "none",
                            "&:hover": { bgcolor: "#7FC700" },
                        }}
                        onClick={() => setFullyPaidDialog(false)}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={notWonDialog}
                onClose={() => setNotWonDialog(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
                    Stage Not Won
                </DialogTitle>

                <DialogContent>
                    <Typography align="center">
                        Please choose the course and set the pipeline stage to "Won" in the Lead Form first.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: "#90D916",
                            textTransform: "none",
                            "&:hover": { bgcolor: "#7FC700" },
                        }}
                        onClick={() => setNotWonDialog(false)}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>

    );
};

export default PaymentHistory;
