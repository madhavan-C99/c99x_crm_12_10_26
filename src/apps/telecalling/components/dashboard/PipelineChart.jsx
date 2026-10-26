import { useEffect, useState } from "react";

import {
    Box,
    Paper,
    Typography,
} from "@mui/material";

import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { getPipelineData } from "@/apps/telecalling/services/pipelineService";
import { useAuth } from "@/shared/context/AuthContext";

function PipelineChart({selectedPipelineId = 0,}) {
    const { hasPermission } = useAuth();
    const [pipelineData, setPipelineData] = useState([]);

    const [activeIndex, setActiveIndex] =
        useState(null);

    useEffect(() => {
        fetchPipelineData();
    }, [selectedPipelineId]);

    const fetchPipelineData = async () => {
    if (!hasPermission("api_fetch_pipeline_funnel")) {
        console.warn(
            "Permission denied: api_fetch_pipeline_funnel"
        );
        return;
    }

    try {
        const payload = {
            pipeline_id: Number(selectedPipelineId) || 0,
        };

        const response = await getPipelineData(payload);

        const funnelData =
            response?.data?.data?.funnel || [];

        const processedData = funnelData.map((item) => ({
            ...item,

            stage_id: item.stage_id,

            stage_name:
                item.stage_name || "Unnamed Stage",

            value: Number(item.value) || 0,

            // Backend percentage
            percentage:
                Number(item.percentage) || 0,
        }));

        setPipelineData(processedData);

        setActiveIndex(null);

    } catch (error) {
        console.error(
            "Failed to fetch pipeline data:",
            error
        );

        setPipelineData([]);
    }
};
    const colors = [
        "#4AA9FF",
        "#FFC35A",
        "#7948FF",
        "#FFF642",
        "#BC16D9",
        "#90D916",
        "#FF3333",
    ];

    const MAX_HEIGHT = 120;
    const MIN_HEIGHT = 25;

    const getBarHeight = (percentage) => {
        const scaled =
            MIN_HEIGHT +
            (percentage / 100) * (MAX_HEIGHT - MIN_HEIGHT);

        return `${Math.max(scaled, MIN_HEIGHT)}px`;
    };

    const MAX_INSET = 40; // controls how narrow the bottom point is (0-50)

    const buildLinearBoundaries = (count) => {
        if (count === 0) return [];

        return Array.from({ length: count + 1 }, (_, i) =>
            (i / count) * MAX_INSET
        );
    };

    const boundaries = buildLinearBoundaries(pipelineData.length);

    return (

        <Paper
            elevation={0}
            sx={{
                mt: 4,

                p: {
                    xs: 2,
                    md: 4,
                },

                borderRadius: "30px",

                border:
                    "1px solid #E5E5E5",

                background: "#fff",

                overflow: "hidden",
            }}
        >

            {/* HEADER */}

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
                                xs: "22px",
                                md: "30px",
                            },

                            fontWeight: 700,
                        }}
                    >
                        Pipeline
                    </Typography>

                </Box>

                <Typography
                    sx={{
                        fontSize: {
                            xs: "18px",
                            md: "22px",
                        },

                        fontWeight: 500,
                    }}
                >
                    Total Lost :
                    <Box
                        component="span"
                        sx={{
                            color: "#E53935",
                            fontWeight: 700,
                            ml: 1,
                        }}
                    >
                        {
                            pipelineData.find(
                                (item) =>
                                    item.label ===
                                    "Loss"
                            )?.value || 0
                        }
                    </Box>
                </Typography>

            </Box>

            {/* BODY */}

            <Box
                sx={{
                    display: "flex",
                    justifyContent: 'center',
                    alignItems: 'center',

                    gap: 5,

                    flexDirection: {
                        xs: "column",
                        lg: "row",
                    },
                }}
            >

                {/* LEFT CARDS */}

                <Box
                    sx={{
                        width: {
                            xs: "100%",
                            lg: "300px",
                        },

                        display: "flex",

                        flexDirection: "column",

                        gap: 2,
                    }}
                >

                    {pipelineData.map(
                        (item, index) => (

                            <Box
                                key={index}
                                sx={{
                                    border:
                                        "1px solid #D9D9D9",

                                    borderRadius:
                                        "14px",

                                    height: "56px",

                                    px: 2,

                                    display: "flex",

                                    justifyContent:
                                        "space-between",

                                    alignItems:
                                        "center",
                                }}
                            >

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",

                                        gap: 1,
                                    }}
                                >

                                    <Box
                                        sx={{
                                            width: "12px",
                                            height: "12px",

                                            borderRadius:
                                                "50%",

                                            background:
                                                colors[
                                                index
                                                ],
                                        }}
                                    />

                                    <Typography
                                        sx={{
                                            fontSize:
                                                "18px",

                                            fontWeight: 500,
                                        }}
                                    >
                                        {item.stage_name}
                                    </Typography>

                                </Box>

                                <Typography
                                    sx={{
                                        fontSize:
                                            "28px",

                                        fontWeight: 700,

                                        color:
                                            "#8BDD08",
                                    }}
                                >
                                    {item.value}
                                </Typography>

                            </Box>
                        )
                    )}

                </Box>

                {/* FUNNEL (mukkona / triangle shape, straight edges) */}

                <Box
                    sx={{
                        flex: 1,

                        minWidth: 0,

                        px: {
                            xs: 4,
                            sm: 0,
                        },

                        display: "flex",

                        justifyContent: "center",

                        py: 1,

                        "&::-webkit-scrollbar": {
                            height: "6px",
                        },
                        position: 'relative',
                    }}
                >

                    {/* INNER FUNNEL */}

                    <Box
                        sx={{
                            width: {
                                xs: "100%",
                                sm: "520px",
                                md: "600px",
                            },
                            minWidth: {
                                xs: "260px",
                                sm: "450px",
                                md: "600px",
                            },
                            maxWidth: "100%",

                            display: "flex",

                            flexDirection: "column",

                            alignItems: "center",

                            gap: "2px",
                        }}
                    >

                        {pipelineData.map(
                            (item, index) => {

                                const isActive =
                                    activeIndex === index;

                                const isDimmed =
                                    activeIndex !== null &&
                                    activeIndex !== index;

                                const barHeight = getBarHeight(item.percentage);

                                // Continuous linear insets — segment's top
                                // matches previous segment's bottom exactly,
                                // and the overall taper is a straight line
                                // (mukkona / triangle shape).
                                const topInset = boundaries[index];
                                const bottomInset = boundaries[index + 1];

                                return (
                                    <Box
                                        key={index}

                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }

                                        onMouseLeave={() =>
                                            setActiveIndex(null)
                                        }

                                        sx={{
                                            width: "100%",

                                            minheight: "20px",

                                            display: "flex",

                                            justifyContent: "flex-end",

                                            flexDirection: "column",

                                            transition: "0.3s ease",

                                            position: "relative",
                                            overflow: 'visible',
                                            flexShrink: 0
                                        }}
                                    >
                                        {isActive && (
                                            <Typography
                                                sx={{
                                                    position: "absolute",

                                                    left: `calc(${100 - bottomInset}% + 3rem)`,

                                                    fontSize: {
                                                        xs: "14px",
                                                        md: "18px",
                                                    },

                                                    fontWeight: 600,

                                                    color: colors[index],

                                                    whiteSpace: "nowrap",

                                                    pointerEvents: "none",

                                                    zIndex: 999,
                                                }}
                                            >
                                                {item.percentage}%
                                            </Typography>
                                        )}

                                        {/* ACTUAL BAR */}
                                        <Box
                                            sx={{
                                                width: "100%",

                                                height: barHeight,

                                                background:
                                                    colors[index],

                                                clipPath: `polygon(${topInset}% 0, ${100 - topInset}% 0, ${100 - bottomInset}% 100%, ${bottomInset}% 100%)`,

                                                transition:
                                                    "all .3s ease",

                                                position: "relative",

                                                opacity:
                                                    isDimmed ? 0.3 : 1,
                                                overflow: "visible"
                                            }}
                                        >

                                        </Box>

                                    </Box>
                                );
                            }
                        )}

                    </Box>

                </Box>

            </Box>

        </Paper>
    );
}

export default PipelineChart;
