import { useEffect, useState ,useRef} from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Skeleton,
    Alert,
    Snackbar
} from "@mui/material";

import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AddChartOutlinedIcon from "@mui/icons-material/AddchartOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import CallMissedOutgoingOutlinedIcon from "@mui/icons-material/CallMissedOutgoingOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { getDailyReportData,DailyReportSubmitData,DailyReportPdfDownload } from "@/apps/telecalling/services/dailyReportService";
import DailyReportPdf from "@/apps/telecalling/components/dailyReport/DailyReportPdf";
import { useAuth } from "@/shared/context/AuthContext";

function DailyReportCards() {
    const { hasPermission } = useAuth();

    const [manualData, setManualData] =
        useState({
            total_expected_conversion:"",
            actual_expected_conversion: "",
            notes: "",
        });
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);

    const [pdfData, setPdfData] = useState(null);
    const pdfRef = useRef();

    const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
});

    useEffect(() => {

        getDailyReport();

    }, []);

    const getDailyReport = async () => {
        try {
            const response = await getDailyReportData(
                Number(localStorage.getItem("user_id"))
            );

            const data = response.data.data;

            // Dashboard Data
            setReportData(data.dashboard_data.dashboard_data);

            // Manual Data
            setManualData({
                total_expected_conversion:
                    data.manual_data?.tomorrow_conversation ?? "",
                actual_expected_conversion:
                    data.manual_data?.lead_for_tomorrow ?? "",
                notes:
                    data.manual_data?.own_message ?? "",
            });
        } catch (err) {
            setReportData([]);
        }
    };

    const activityConfig = {
        "Total Leads": {
            icon: <GroupOutlinedIcon sx={{ color: "#8DDC1F" }} />,
            bg: "#EAF7D8",
        },

        "New Leads": {
            icon: <AddChartOutlinedIcon sx={{ color: "#224BFF" }} />,
            bg: "#DCE8FF",
        },

        "Call Spoked": {
            icon: <CallOutlinedIcon sx={{ color: "#E6B400" }} />,
            bg: "#FFF5CC",
        },

        "Not Respond": {
            icon: (
                <CallMissedOutgoingOutlinedIcon
                    sx={{ color: "#F44336" }}
                />
            ),
            bg: "#FFE1E1",
        },

        "Follow Up": {
            icon: (
                <AutorenewOutlinedIcon
                    sx={{ color: "#00B894" }}
                />
            ),
            bg: "#D8FFF5",
        },

        "Pending Follow Up": {
            icon: (
                <PendingActionsOutlinedIcon
                    sx={{ color: "#FF2D8D" }}
                />
            ),
            bg: "#FFE4F1",
        },

        "Partial Payment": {
            icon: (
                <CurrencyRupeeOutlinedIcon
                    sx={{ color: "#F59E0B" }}
                />
            ),
            bg: "#FFF0DD",
        },

        "Full Payment": {
            icon: (
                <AccountBalanceWalletOutlinedIcon
                    sx={{ color: "#00C853" }}
                />
            ),
            bg: "#DDFBE8",
        },
    };

const handleSubmit = async () => {
    try {
        const payload = {
            id: Number(localStorage.getItem("user_id")),
            data: {
                total_leads: reportData?.find(x => x.label === "Total Leads")?.value || 0,
                new_leads: reportData?.find(x => x.label === "New Leads")?.value || 0,
                call_spoked: reportData?.find(x => x.label === "Call Spoked")?.value || 0,
                not_respond: reportData?.find(x => x.label === "Not Respond")?.value || 0,
                follow_up: reportData?.find(x => x.label === "Follow Up")?.value || 0,
                pending_follow_up: reportData?.find(x => x.label === "Pending Follow Up")?.value || 0,
                partial_payment: reportData?.find(x => x.label === "Partial Payment")?.value || 0,
                full_payment: reportData?.find(x => x.label === "Full Payment")?.value || 0,
            },
            tomorrow_conversation: manualData.total_expected_conversion.toString(),
            lead_for_tomorrow: manualData.actual_expected_conversion.toString(),
            own_message: manualData.notes,
        };

        const response = await DailyReportSubmitData(payload);

        setSnackbar({
            open: true,
            message: "Daily Report Submitted Successfully.",
            severity: "success",
        });
    } catch (error) {
            setSnackbar({
        open: true,
        message: "Failed to submit report.",
        severity: "error",
    });
    }
};

const handleDownloadPdf = async () => {
    try {
        const response = await DailyReportPdfDownload();

        setPdfData(response.data);
        setTimeout(async () => {
            await downloadPDF();
        }, 100);

                setSnackbar({
            open: true,
            message: "Daily Report PDF Downloaded Successfully.",
            severity: "success",
        });

    } catch (err) {
            setSnackbar({
        open: true,
        message: "PDF Download Failed.",
        severity: "error",
    });
    }
};

const downloadPDF = async () => {
    if (!pdfRef.current) return;

    // PDF libraries are big - download them only when Export is clicked
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
    ]);

    const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save("Daily_Report.pdf");
};

    return (
<>
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    lg: "1.4fr 1fr",
                },
                gap: 3,
                mb: 5
            }}
        >

            {/* LEFT CARD */}

            <Paper
                elevation={0}
                sx={{
                    border:
                        "1px solid #E5E5E5",
                    borderRadius: "12px",
                    overflow: "hidden",
                }}
            >

                <Box
                    sx={{
                        p: 2,
                        borderBottom:
                            "1px solid #E5E5E5",
                        display: "flex",
                        justifyContent:
                            "space-between",
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: "20px",
                        }}
                    >
                        Today Activity Breakdown
                    </Typography>

                    <Box
                        sx={{
                            bgcolor:
                                "#E1E1FE",
                            color:
                                "#0205C8",
                            borderRadius:
                                "6px",
                            fontSize:
                                "13px",
                            width: '100px',
                            height: '23px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '1px solid #A3A4FF'
                        }}
                    >
                        Auto-Synced
                    </Box>
                </Box>

                {reportData === null ? (
                    Array.from({ length: 8 }).map((_, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 1.5,
                                borderBottom: "1px solid #E5E5E5",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <Skeleton
                                    variant="rounded"
                                    width={35}
                                    height={35}
                                />

                                <Skeleton
                                    variant="text"
                                    width={180}
                                    height={30}
                                />
                            </Box>

                            <Skeleton
                                variant="text"
                                width={40}
                                height={30}
                            />
                        </Box>
                    )))
                    : reportData.map((item, index) => {
                        const config =
                            activityConfig[item.label] || {};

                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    p: 1.5,
                                    borderBottom:
                                        index !== reportData.length - 1
                                            ? "1px solid #E5E5E5"
                                            : "none",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 35,
                                            height: 35,
                                            borderRadius: "9px",
                                            background: config.bg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {config.icon}
                                    </Box>

                                    <Typography
                                        sx={{
                                            fontSize: "20px",
                                            color: "#000",
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                </Box>

                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "20px",
                                    }}
                                >
                                    {item.value}
                                </Typography>
                            </Box>
                        );
                    })}
            </Paper>

            {/* RIGHT CARD */}
            <Box>
                <Paper
                    elevation={0}
                    sx={{
                        border:
                            "1px solid #E5E5E5",
                        borderRadius: "12px",
                        p: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            mb: 3,
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: "20px",
                            }}
                        >
                            Manual Entry
                        </Typography>

                        <Box
                            sx={{
                                bgcolor:
                                    "#FEF3C7",
                                color:
                                    "#91400E",
                                borderRadius:
                                    "6px",
                                fontSize:
                                    "13px",
                                width: '100px',
                                height: '23px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '1px solid #F6E086'
                            }}
                        >
                            Auto-Synced
                        </Box>
                    </Box>

                    <Typography
                        sx={{
                            mb: '10px'
                        }}
                    >
                        Total Expected Conversion
                    </Typography>

                    <TextField
                        fullWidth
                        type="number"
                        value={manualData.total_expected_conversion}
                        onChange={(e) =>
                            setManualData((prev) => ({
                                ...prev,
                                total_expected_conversion: Number(e.target.value),
                            }))
                        }
                        sx={{
                            mb: '22px',
                            "& .MuiInputBase-root": {
                                height: "33px",
                                borderRadius: '5px'
                            },
                        }}
                    />
                    <Typography
                        sx={{
                            mb: '10px'
                        }}
                    >
                        Actual Expected Conversion
                    </Typography>

                    <TextField
                        fullWidth
                        type="number"
                        value={manualData.actual_expected_conversion}
                        onChange={(e) =>
                            setManualData((prev) => ({
                                ...prev,
                                actual_expected_conversion: Number(e.target.value),
                            }))
                        }
                        sx={{
                            mb: '22px',
                            "& .MuiInputBase-root": {
                                height: "33px",
                                borderRadius: '5px'

                            },
                        }}
                    />

                    <Typography
                        sx={{
                            mb: '10px'
                        }}
                    >
                        Notes For Manager
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={5}
                        value={manualData.notes}
                        onChange={(e) =>

                            setManualData((prev) => ({
                                ...prev,
                                notes: e.target.value,

                            }))

                        }
                    />
                </Paper>

                {/* BUTTONS */}
                <Box
                    sx={{
                        mt: '40px',
                        display: "flex",
                        flexDirection: "column",
                        gap: '15px',
                    }}
                >
                    {hasPermission("api_submit_daily_report_view") && (
                        <Button
                            onClick={handleSubmit}
                            sx={{
                                bgcolor: "#90D916",
                                color: "#ffffff",
                                height: "34px",
                                fontSize: '16px',
                                fontWeight: 600,

                                "&:hover": {
                                    bgcolor: "#8DDC1F",
                                },
                            }}
                        >
                            Submit Report
                        </Button>
                    )}

                    {hasPermission("api_download_daily_report_view") && (
                        <Button
                            variant="outlined"
                            onClick={handleDownloadPdf}
                            sx={{
                                borderColor: "#90D916",
                                color: "#000",
                                height: "34px",
                                fontWeight: 500,
                                fontSize: '15px'
                            }}
                        >
                            Download PDF
                        </Button>
                    )}
                </Box>

            </Box>
        </Box>

<Box
    ref={pdfRef}
    sx={{
        position: "absolute",
        left: "-9999px",
        top: 0,
    }}
>
    <DailyReportPdf report={pdfData} />
</Box>
<Snackbar
    open={snackbar.open}
    autoHideDuration={3000}
    onClose={() =>
        setSnackbar((prev) => ({
            ...prev,
            open: false,
        }))
    }
    anchorOrigin={{
        vertical: "top",
        horizontal: "right",
    }}
>
    <Alert
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: "100%" }}
        onClose={() =>
            setSnackbar((prev) => ({
                ...prev,
                open: false,
            }))
        }
    >
        {snackbar.message}
    </Alert>
</Snackbar>
</>

    );
}

export default DailyReportCards;
