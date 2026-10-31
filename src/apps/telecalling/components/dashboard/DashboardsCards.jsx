import PipelineSelect from "@/apps/telecalling/components/filters/PipelineSelect";
import {
    Box,
    Button,
    MenuItem,
    Paper,
    Select,
    Typography,
    Skeleton,
    Chip,
} from "@mui/material";

import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Groups from "@mui/icons-material/Groups";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";

import { useEffect, useRef, useState } from "react";

import dayjs from "dayjs";


import ExportPdfTemplate from "@/apps/telecalling/components/dashboard/ExportPdfTemplate";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";
import {     initiateExport,
    getExportDownload, } from "@/apps/telecalling/services/dashboardExportService";
import { getDashboardCards } from "@/apps/telecalling/services/dashboardService";
import { useAuth } from "@/shared/context/AuthContext";
import {DateRangeSelect} from "@/shared/components/filters/DateRangeSelect"


export const DashboardsCards = ({    pipelines = [],
    selectedPipelineId = 0,
    handlePipelineChange,
    isReady = true,
}) => {
    const { hasPermission } = useAuth();
// .......this pipeline selector hook will handle the pipeline selection logic and state management

    const [filterType, setFilterType] = useState(() => {
        return sessionStorage.getItem("dashboard_filterType") || "this_month";
    });

    const [cards, setCards] =
        useState([]);

    const [openCalendar, setOpenCalendar] =
        useState(false);

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    // EXPORT STATES

    const [exporting, setExporting] =
        useState(false);

    const [exportData, setExportData] =
        useState(null);

    const printRef = useRef(null);

    // INITIAL LOAD & SESSIONSTORAGE PERSIST

    useEffect(() => {
        sessionStorage.setItem("dashboard_filterType", filterType);
    }, [filterType]);

// Existing card design colours
const cardStyles = [
    {
        bg: "linear-gradient(110deg,#E1F0FF 50%, #EEF1F4 80%)",
        number: "#194066",
        iconBg: "#DBDFE6",
    },
    {
        bg: "linear-gradient(110deg,#F9E7C5 50%, #FEF8ED 80%)",
        number: "#F59F0A",
        iconBg: "#FCEFD7",
    },
    {
        bg: "linear-gradient(110deg,#D6F1FF 50%, #EEF8FD 80%)",
        number: "#19A2E6",
        iconBg: "#DBF0FB",
    },
    {
        bg: "linear-gradient(110deg,#CFFFEF 50%,#F2FBF8 80%)",
        number: "#2EB88A",
        iconBg: "#DDF3EC",
    },
    {
        bg: "linear-gradient(110deg,#FEDCDC 50%, #FDF1F1 80%)",
        number: "#DC2828",
        iconBg: "#F9DCDC",
    },
];

// Fetch dashboard cards dynamically
const fetchDashboardCards = async (
    type,
    fromDate = "",
    toDate = ""
) => {
    try {
        const payload = {
            filter_type: type,
            pipeline_id: selectedPipelineId || 0,
        };

        if (type === "custom" && fromDate && toDate) {
            payload.from_date = dayjs(fromDate).format("YYYY-MM-DD");
            payload.to_date = dayjs(toDate).format("YYYY-MM-DD");
        }

        const response = await getDashboardCards(payload);

        const apiData =
            response?.data?.data?.data ??
            response?.data?.data ??
            [];

        if (!Array.isArray(apiData)) {
            console.error("Invalid dashboard API response", response.data);
            setCards([]);
            return;
        }

        const formattedCards = apiData.map((item, index) => {
            const title = item.label || "Unknown Stage";

            let style;

            if (title === "Total Leads") {
                style = cardStyles[0];
            } else if (title === "Pending Payments") {
                style = cardStyles[1];
            } else {
                style = cardStyles[
                    (index - 1 + cardStyles.length) % cardStyles.length
                ];
            }

            return {
                title,
                value: item.value ?? "0",
                percentage: item.percentage ?? "0.00",
                ...style,
            };
        });

        setCards(formattedCards);
    } catch (error) {
        console.error(
            "Failed to fetch dashboard cards:",
            error?.response?.data || error
        );
        setCards([]);
    }
};

// Runs once the pipeline is known, and again when the pipeline changes.
// (There used to be a second identical effect, so the tiles API was called twice.)
useEffect(() => {
    if (!isReady) return;
    if (filterType === "custom") {
        if (fromDate && toDate) {
            fetchDashboardCards("custom", fromDate, toDate);
        }
        return;
    }

    fetchDashboardCards(filterType);
}, [isReady, filterType, fromDate, toDate, selectedPipelineId]);

const handleApplyCustomRange = (from, to) => {
    const formattedFrom = dayjs(from).format("YYYY-MM-DD");
    const formattedTo = dayjs(to).format("YYYY-MM-DD");

    setFromDate(formattedFrom);
    setToDate(formattedTo);
    setFilterType("custom");
    setOpenCalendar(false);
};

    const handleCloseCalendar = () => {

        setOpenCalendar(false);

        if (!fromDate || !toDate) {

            setFilterType((prev) =>
                prev === "custom" ? "monthly" : prev
            );
        }
    };

    const handleClearCustomRange = () => {

        setFromDate("");

        setToDate("");

        setFilterType("monthly");

        fetchDashboardCards("monthly");
    };






const handleExportPdf = async () => {
    try {
        setExporting(true);

        const filters = {
            filter_type: filterType,
        };

        if (filterType === "custom" && fromDate && toDate) {
            filters.from_date = dayjs(fromDate).format("YYYY-MM-DD");
            filters.to_date = dayjs(toDate).format("YYYY-MM-DD");
        }

        // 1. Export start
        const initiateRes = await initiateExport({
            entity: "telecalling_dashboard",
            file_format: "pdf",
            filters,
        });

        const exportId = initiateRes?.data?.data?.data?.export_id;

        if (!exportId) {
            throw new Error("export_id kidaikala");
        }

        // 2. Download URL edukkuradhu
        const downloadRes = await getExportDownload({ export_id: exportId });

        const fileUrl = downloadRes?.data?.data?.data?.download_url;

        if (!fileUrl) {
            throw new Error("download_url kidaikala");
        }

        // 3. Download
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const link = document.createElement("a");
        link.href = `${baseUrl}${fileUrl}`;
        link.target = "_blank";
        link.download = "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Export failed:", error?.response?.data || error);
    } finally {
        setExporting(false);
    }
};

    // label to show on the filter bar when a custom range is applied

    const customRangeLabel =
        filterType === "custom" && fromDate && toDate
            ? `${dayjs(fromDate).format("DD MMM")} - ${dayjs(toDate).format("DD MMM")}`
            : "";

    return (

        <Box
            sx={{
                maxWidth: "100%",
                mx: "auto",
                px: {
                    xs: 1,
                    sm: 2,
                    md: 2,
                },

            }}
        >

            {/* HEADING */}

            {/* <Typography
                sx={{
                    fontSize: {
                        xs: "20px",
                        sm: "22px",
                        md: "24px",
                    },
                    fontWeight: 600,
                    color: "#111",
                }}
            >
                Dashboard
            </Typography>

            <Typography
                sx={{
                    mt: 1,
                    fontSize: {
                        xs: "13px",
                        sm: "14px",
                        md: "16px",
                    },
                    color: "#777",
                    fontWeight: 400,
                }}
            >
                Track and manage all pending payment collections from leads
            </Typography> */}

            {/* HEADING */}

<Box
    sx={{
        mb: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: {
            xs: "flex-start",
            md: "center",
        },
        gap: 2,
        flexDirection: {
            xs: "column",
            md: "row",
        },
    }}
>
    {/* LEFT */}
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
            }}
        >
            Dashboard
        </Typography>

        <Typography
            sx={{
                mt: 1,
                fontSize: {
                    xs: "13px",
                    sm: "14px",
                    md: "16px",
                },
                color: "#777",
                fontWeight: 400,
            }}
        >
            Track and manage all pending payment collections from leads
        </Typography>
    </Box>

    {/* RIGHT - PIPELINE */}
    <PipelineSelect
        pipelines={pipelines}
        value={selectedPipelineId}
        onChange={handlePipelineChange}
    />
</Box>

            {/* FILTER SECTION */}

            <Paper
                elevation={0}
                sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: "7px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: {
                        xs: "flex-start",
                        sm: "center",
                    },
                    flexDirection: {
                        xs: "column",
                        sm: "row",
                    },
                    gap: 2,
                    border: "1px solid #ECECEC",
                }}
            >

                {/* shows the applied custom range, if any */}

                <Box>
                    {
                        customRangeLabel && (
                            <Chip
                                icon={<CalendarMonth sx={{ fontSize: "16px !important" }} />}
                                label={customRangeLabel}
                                onDelete={handleClearCustomRange}
                                sx={{
                                    backgroundColor: "#E9F6D4",
                                    color: "#3A6B00",
                                    fontWeight: 500,
                                    fontSize: "12px",
                                }}
                            />
                        )
                    }
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        gap: 2,
                        width: {
                            xs: "100%",
                            sm: "auto",
                        },
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                    }}
                >

                    {/* FILTER DROPDOWN */}

                          <DateRangeSelect
                            filterType={filterType}
                            setFilterType={setFilterType}
                            fromDate={fromDate}
                            setFromDate={setFromDate}
                            toDate={toDate}
                            setToDate={setToDate}
                          />

                    {/* EXPORT */}

                    {(hasPermission("api_get_dashboard_p_d_f_data") || hasPermission("export_dashboard")) && (
                        <Button
                            startIcon={<CalendarMonth />}
                            variant="outlined"
                            disabled={exporting}
                            onClick={handleExportPdf}
                            sx={{
                                borderColor: "#A4CE3C",
                                color: "#111",
                                textTransform: "none",
                                borderRadius: "6px",
                                width: {
                                    xs: "100%",
                                    sm: "104px",
                                },
                                height: "31px",
                                backgroundColor: "#E9F6D4",
                            }}
                        >
                            {exporting ? "Exporting..." : "Export"}
                        </Button>
                        //  <ExportButton
                        //     pageName="dashboard"
                        //     getExportPayload={() => {
                        //         console.log("export payload:", payload);
                        //         return payload;
                        //     }}
                        //     />
                    )}

                </Box>

            </Paper>

            {/* CUSTOM DATE POPUP — shared component, reusable on any page */}

            <CustomDateRangePicker
                open={openCalendar}
                onClose={handleCloseCalendar}
                onApply={handleApplyCustomRange}
                initialFrom={fromDate}
                initialTo={toDate}
            />

            {/* CARDS SECTION */}

            <Box
                sx={{
                    mt: 3,
                    mb: 2,
                    display: "grid",

                    gridTemplateColumns: {
                        xs: "repeat(1,1fr)",
                        sm: "repeat(2,1fr)",
                        md: "repeat(3,1fr)",
                        lg: "repeat(4,1fr)",
                    },

                    gap: 3,
                    width: "100%",
                    justifyContent: 'center',
                    alignItems: 'center',

                }}
            >

                {
                    cards.length === 0
                        ? Array.from({ length: Math.max(cards.length, 7) }).map((_, index) => (
                            <Paper
                                key={index}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    borderRadius: "12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    minHeight: "110px",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 2,
                                    }}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton
                                            variant="text"
                                            width="70%"
                                            height={24}
                                        />

                                        <Skeleton
                                            variant="text"
                                            width="40%"
                                            height={40}
                                        />
                                    </Box>

                                    <Skeleton
                                        variant="rounded"
                                        width={28}
                                        height={28}
                                    />
                                </Box>

                                <Skeleton
                                    variant="text"
                                    width="60%"
                                    height={20}
                                />
                            </Paper>
                        ))
                        : cards.map((item, index) => (
                            <Paper
                                key={index}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    borderRadius: "12px",
                                    background: item.bg,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",

                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 2,
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontSize: {
                                                    xs: "12px",
                                                    sm: "13px",
                                                    md: "14px",
                                                },
                                                color: "#555",
                                            }}
                                        >
                                            {item.title}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize: {
                                                    xs: "20px",
                                                    sm: "22px",
                                                    md: "24px",
                                                },
                                                fontWeight: 700,
                                                color: item.number,
                                            }}
                                        >
                                            {item.title === "Pending Payments" ? `₹ ${item.value}` : item.value}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            width: {
                                                xs: 24,
                                                sm: 28,
                                            },
                                            height: {
                                                xs: 24,
                                                sm: 28,
                                            },
                                            borderRadius: "6px",
                                            background: item.iconBg,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            padding: "6px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Groups
                                            sx={{
                                                color: item.number,
                                                fontSize: {
                                                    xs: "18px",
                                                    sm: "20px",
                                                },
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Typography
                                    sx={{
                                        color:
                                            Number(item.percentage) >= 0
                                                ? "#23B26D"
                                                : "#DC2828",
                                        fontSize: {
                                            xs: "9px",
                                            sm: "10px",
                                        },
                                        fontWeight: 500,
                                    }}
                                >
                                    {Number(item.percentage) >= 0 ? "↗" : "↘"}{" "}
                                    {Math.abs(Number(item.percentage)).toFixed(2)}% vs last period
                                </Typography>
                            </Paper>
                        ))
                }

            </Box>

            {/* HIDDEN EXPORT TEMPLATE — rendered off-screen, captured by html2canvas */}

            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: "-9999px",
                    zIndex: -1,
                }}
            >

                <ExportPdfTemplate
                    ref={printRef}
                    data={exportData}
                    orgName="Code99 IT Academy"
                    weekLabel={filterType}
                />

            </Box>

        </Box>
    );
};
