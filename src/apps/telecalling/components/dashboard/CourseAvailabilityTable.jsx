import { useEffect, useState } from "react";

import {
    Box,
    Button,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import { WS_BASE_URL } from "@/shared/config/env";
import { getSelectOptions } from "@/shared/services/dropdownService";
import { CATEGORY_ALIAS } from "@/apps/telecalling/components/filters/popup/filterConfig";

function CourseAvailabilityTable(
    {selectedPipelineId = 0,}

) {

    const [data, setData] = useState([]);

    const [selectedFilter, setSelectedFilter] =
        useState("All Plans");

    const [planOptions, setPlanOptions] = useState(["All Plans"]);

    // Fetch dynamic course plans using getSelectOptions
    useEffect(() => {
        const fetchCoursePlans = async () => {
            try {
                const response = await getSelectOptions({
                    field: CATEGORY_ALIAS.course_plan,
                    filter_id: "",
                    opt_filter: {
                        pipeline_id: Number(selectedPipelineId) || 0,
                    },
                });

                const rawOptions = response?.data?.data || [];
                const planNames = rawOptions.map(
                    (item) => item.course_plan_name || item.name || item.label
                ).filter(Boolean);

                setPlanOptions(["All Plans", ...Array.from(new Set(planNames))]);
            } catch (error) {
                console.error("Failed to fetch course plans:", error);
            }
        };

        fetchCoursePlans();
    }, [selectedPipelineId]);

    useEffect(() => {
        let socket;
        try {
            socket = new WebSocket(
                `${WS_BASE_URL}/ws/course/`
            );

            socket.onopen = () => {
                socket.send(
                    JSON.stringify({
                        action: "course_details",
                        pipeline_id: selectedPipelineId || 0,
                    })
                );
            };

            socket.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.payload && response.payload.length > 0) {
                    setData(response.payload);
                }
            };

            socket.onerror = (err) => {
            };

            socket.onclose = () => {
            };
        } catch (e) {
        }

        return () => {
            if (socket) socket.close();
        };

    },  [selectedPipelineId]);

    // FILTER DATA

    const filteredData =
        selectedFilter === "All Plans"

            ? data

            : data.filter((item) =>

                item.course_plan
                    ?.toLowerCase()
                    .includes(
                        selectedFilter.toLowerCase()
                    )
            );

    return (

        <Paper
            elevation={0}
            sx={{
                mt: 4,
                borderRadius: "20px",
                border: "1px solid #E5E5E5",
                background: "#fff",

                width: "100%",
                maxWidth: "100%",

                overflow: "hidden",
            }}
        >

            {/* HEADER */}

            <Box
                sx={{
                    px: 3,
                    py: 3,

                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",

                    gap: 2,

                    flexWrap: {
                        xs: "wrap",
                        md: "nowrap",
                    },
                }}
            >

                {/* LEFT */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >

                    <SchoolOutlinedIcon
                        sx={{
                            color: "#9CD326",
                            fontSize: "28px",
                        }}
                    />

                    <Typography
                        sx={{
                            fontSize: {
                                xs: "16px",
                                md: "18px",
                            },
                            fontWeight: 700,
                        }}
                    >
                        Course Availability
                    </Typography>

                </Box>

                {/* RIGHT */}

                <Box
                    sx={{
                        display: "flex",
                        gap: 1,

                        background: "#F1F1F1",

                        p: "5px",

                        borderRadius: "10px",

                        overflowX: "auto",

                        width: {
                            xs: "100%",
                            md: "auto",
                        },
                        maxWidth: {
                            xs: "100%",
                            md: "480px",
                            lg: "550px",
                        },

                        "&::-webkit-scrollbar": {
                            height: "4px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            background: "#ccc",
                            borderRadius: "4px",
                        },

                        scrollbarWidth: "thin",
                        justifyContent: "flex-start",
                        flexShrink: 0,
                    }}
                >

                    {planOptions.map((filter) => (

                        <Button
                            key={filter}

                            onClick={() =>
                                setSelectedFilter(filter)
                            }

                            variant="contained"

                            sx={{
        background:
            selectedFilter === filter ? "#fff" : "transparent",

        color:
            selectedFilter === filter ? "#111" : "#555",

        textTransform: "none",

        fontSize: {
            xs: "11px",
            md: "13px",
        },

        fontWeight: 500,

        px: 2,
        py: 0.8,

        minWidth: "fit-content",
        flexShrink: 0,

        borderRadius: "8px",

        boxShadow:
            selectedFilter === filter
                ? "0px 2px 5px rgba(0,0,0,0.15)"
                : "none",

        whiteSpace: "nowrap",

        "&:hover": {
            background:
                selectedFilter === filter
                    ? "#fff"
                    : "transparent",
        },
    }}
                        >
                            {filter}
                        </Button>

                    ))}

                </Box>

            </Box>

            {/* TABLE */}

            <TableContainer
                sx={{
                    width: "100%",
                    maxWidth: "100%",

                    overflowX: "auto",
                    overflowY: "hidden",

                    WebkitOverflowScrolling: "touch",

                    "&::-webkit-scrollbar": {
                        height: "6px",
                    },
                }}
            >

                <Table
                    sx={{
                        minWidth: "1100px",

                        borderCollapse: "collapse",

                        "& th": {
                            borderRadius: 0,
                            whiteSpace: "nowrap",
                        },

                        "& td": {
                            borderRadius: 0,
                            whiteSpace: "nowrap",
                        },
                    }}
                >

                    {/* TABLE HEAD */}

                    <TableHead>

                        <TableRow
                            sx={{
                                background: "#ECECEC",

                            }}
                        >

                            {[
                                "S.No",
                                "Course",
                                "Course Plan",
                                "Timing",
                                "Starting Date",
                                "Closing Date",
                                "Admission Count",
                                "Seat Left",
                                "Status",
                            ].map((head) => (

                                <TableCell
                                    key={head}
                                    sx={{
                                        fontWeight: 600,
                                        color: "#666",

                                        fontSize: {
                                            xs: "12px",
                                            md: "14px",
                                        },

                                        borderTop:
                                            "1.5px solid lightgrey",

                                        borderBottom:
                                            "2px solid lightgrey",

                                        textAlign: "center",

                                        py: 1.5,
                                                ...(head === "S.No" && {
                                        position: "sticky",
                                        left: 0,
                                        zIndex: 3,
                                        background: "#ECECEC",
                                        minWidth: "10px",
                                    }),
                                    }}
                                >
                                    {head}
                                </TableCell>

                            ))}

                        </TableRow>

                    </TableHead>

                    {/* TABLE BODY */}

                    <TableBody>

                        {filteredData.length > 0 ? (

                            filteredData.map((item, index) => {

                                const isFast_track =
                                    item.course_plan
                                        ?.toLowerCase()
                                        ?.includes("fast track");

                                const isClosed =
                                    Number(item.seats_left) === 30;

                                const isClosingSoon =
                                    Number(item.seats_left) <= 40;

                                return (

                                    <TableRow
                                        key={item.id}
                                        hover
                                        sx={{
                                            "& td": {
                                                borderBottom:
                                                    index === data.length - 1
                                                        ? "none"
                                                        : undefined,
                                            },
                                        }}
                                    >

                                        {/* S.NO */}

                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                py: 1,
                                                position: "sticky",
                                                left: 0,
                                                background: "#fff",
                                                zIndex: 2,
                                            }}
                                        >
                                            {index + 1}
                                        </TableCell>

                                        {/* COURSE */}

                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                    fontSize: {
                                                    xs: "12px",
                                                    md: "14px",
                                                },
                                                color: "#222",
                                                py: 1.5,
                                                textAlign: "center",
                                            }}
                                        >
                                            {item.course_name
                                                ?.toLowerCase()
                                                .split(" ")
                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(" ")}
                                        </TableCell>

                                        {/* COURSE PLAN */}

                                        <TableCell
                                            sx={{
                                                py: 1.5,
                                            }}
                                        >

                                            <Box
                                                sx={{
                                                    width: "130px",
                                                    height: "30px",

                                                    borderRadius: "10px",

                                                    display: "flex",
                                                    justifyContent:
                                                        "center",
                                                    alignItems:
                                                        "center",

                                                    fontSize: "12px",
                                                    fontWeight: 500,

                                                    mx: "auto",

                                                    border: isFast_track
                                                        ? "1px solid #1DA1F2"
                                                        : "1px solid #FF2D7A",

                                                    color: isFast_track
                                                        ? "#1DA1F2"
                                                        : "#FF2D7A",

                                                    background: isFast_track
                                                        ? "#EAF6FF"
                                                        : "#FFF0F6",
                                                }}
                                            >
                                                {item.course_plan
                                                    ?.toLowerCase()
                                                    .split(" ")
                                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                    .join(" ")}
                                            </Box>

                                        </TableCell>

                                        {/* Timing */}
                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                py: 1.5,
                                            }}
                                        >
                                            {item.course_time
                                            }
                                        </TableCell>

                                        {/* START DATE */}

                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                py: 1.5,
                                            }}
                                        >
                                            {item.starting_date}
                                        </TableCell>

                                        {/* CLOSE DATE */}

                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                py: 1.5,
                                            }}
                                        >
                                            {item.closing_date}
                                        </TableCell>

                                        {/* ADMISSION */}

                                        <TableCell
                                            sx={{
                                                fontWeight: 500,
                                                textAlign: "center",
                                                py: 1.5,
                                            }}
                                        >
                                            <span style={{ fontWeight: 700 }}>
                                                {item.admission_count}
                                            </span>
                                            /
                                            {item.total_seats}
                                        </TableCell>

                                        {/* SEAT LEFT */}

                                        <TableCell
                                            sx={{
                                                textAlign: "center",
                                                py: 1.5,
                                            }}
                                        >
                                            {item.seats_left}
                                        </TableCell>

                                        {/* STATUS */}

                                        <TableCell
                                            sx={{
                                                py: 1.5,
                                            }}
                                        >

                                            <Box
                                                sx={{
                                                    width: "110px",
                                                    height: "30px",

                                                    borderRadius: "10px",

                                                    display: "flex",
                                                    justifyContent:
                                                        "center",
                                                    alignItems:
                                                        "center",

                                                    fontWeight: 500,
                                                    fontSize: "12px",

                                                    mx: "auto",

                                                    border: isClosed
                                                        ? "1px solid #BDBDBD"
                                                        : isClosingSoon
                                                            ? "1px solid #F2B01E"
                                                            : "1px solid #9CD326",

                                                    color: isClosed
                                                        ? "#666"
                                                        : isClosingSoon
                                                            ? "#666"
                                                            : "#666",

                                                    background: isClosed
                                                        ? "#EEEEEE"
                                                        : isClosingSoon
                                                            ? "#FFF6DE"
                                                            : "#EEF9D7",
                                                }}
                                            >

                                                {isClosed
                                                    ? "Closed"
                                                    : isClosingSoon
                                                        ? "Closing Soon"
                                                        : "Open"}

                                            </Box>

                                        </TableCell>

                                    </TableRow>
                                );
                            })

                        ) : (

                            <TableRow>

                                <TableCell
                                    colSpan={8}

                                    sx={{
                                        textAlign: "center",

                                        py: 5,

                                        fontSize: "16px",

                                        color: "#777",

                                        fontWeight: 500,
                                    }}
                                >
                                    No Courses Available
                                </TableCell>

                            </TableRow>

                        )}

                    </TableBody>

                </Table>

            </TableContainer>

        </Paper>
    );
}

export default CourseAvailabilityTable;
