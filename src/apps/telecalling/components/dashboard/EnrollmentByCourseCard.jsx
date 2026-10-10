import { useState, useMemo } from "react";

import { Box, Card, Typography, Skeleton } from "@mui/material";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Sector,
} from "recharts";

import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import empty_gif from "@/shared/assets/empty.gif";

const EnrollmentByCourseCard = ({
    enrollment = [],
    loading = false,
}) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const renderActiveShape = (props) => {

        const {
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle,
            fill,
            payload,
        } = props;

        const RADIAN = Math.PI / 180;

        const sx =
            cx + (outerRadius + 0) *
            Math.cos(-RADIAN * midAngle);

        const sy =
            cy + (outerRadius + 10) *
            Math.sin(-RADIAN * midAngle);

        const mx =
            cx + (outerRadius + 20) *
            Math.cos(-RADIAN * midAngle);

        const my =
            cy + (outerRadius + 40) *
            Math.sin(-RADIAN * midAngle);

        const ex =
            mx +
            (Math.cos(-RADIAN * midAngle) >= 0
                ? 25
                : -25);

        const ey = my;

        const textAnchor =
            ex > cx ? "start" : "end";
        const shortNameMap = {
            "full stack java": ["Java"],
            "full stack python": ["Python"],
            "ui/ux design": ["UI /", "UX"],
            "digital marketing": ["Digital", "Marketing"],
            "full stack web development": ["Web", "Development"],
            "data analytics": ["Data", "Analytics"],
        };

        const labelLines =
            shortNameMap[payload.name?.toLowerCase()] ||
            [payload.name];
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />

                <path
                    d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                    stroke="#666"
                    fill="none"
                />

                <circle
                    cx={ex}
                    cy={ey}
                    r={2}
                    fill="#666"
                />

                <text
                    x={
                        textAnchor === "start"
                            ? ex + 8
                            : ex - 8
                    }
                    y={ey}
                    textAnchor={textAnchor}
                    fill="#000"
                    fontSize="12"
                    fontWeight="500"
                >
                    {labelLines.map((line, index) => (
                        <tspan
                            key={index}
                            x={
                                textAnchor === "start"
                                    ? ex + 8
                                    : ex - 8
                            }
                            dy={index === 0 ? 0 : 14}
                        >
                            {line}
                        </tspan>
                    ))}
                </text>

            </g>
        );
    };

    // 🔥 API → chart format
const courses = useMemo(() => {
    return enrollment.map((item, index) => ({
        name: item.label,
        actualValue: Number(item.value) || 0,
        value: Number(item.value) === 0 ? 0.05 : Number(item.value),
        color: getColor(index),
    }));
}, [enrollment]);
    const pieData = useMemo(() => {
        const allZero = courses.every(
            (item) => item.actualValue === 0
        );

        if (allZero) {
            return courses.map((item) => ({
                ...item,
                value: 1,
            }));
        }

        return courses;
    }, [courses]);

    const mid = Math.ceil(courses.length / 2);
    const left = courses.slice(0, mid);
    const right = courses.slice(mid);
    const allValuesZero =
        courses.length > 0 &&
        courses.every(
            (item) => Number(item.actualValue) === 0
        );
    // skeleton
    if (loading || !enrollment.length) {
        return (
            <Card
                sx={{
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    borderRadius: "13px",
                    p: { xs: 2, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    boxSizing: "border-box",

                }}
            >
                {/* HEADER */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "11px",
                        }}
                    >
                        <Skeleton
                            variant="circular"
                            width={24}
                            height={24}
                        />

                        <Skeleton
                            variant="text"
                            width={180}
                            height={30}
                        />
                    </Box>

                    <Skeleton
                        variant="text"
                        width={60}
                        height={30}
                    />
                </Box>

                {/* CHART */}
                <Box
                    sx={{
                        width: "100%",
                        height: 260,
                        overflow: "visible",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Skeleton
                        variant="circular"
                        width={200}
                        height={200}
                    />
                </Box>

                {/* LEGENDS */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 3,
                        width: "100%",
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        {[1, 2, 3].map((item) => (
                            <Box
                                key={item}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Skeleton
                                        variant="circular"
                                        width={15}
                                        height={15}
                                    />

                                    <Skeleton
                                        variant="text"
                                        width={120}
                                        height={25}
                                    />
                                </Box>

                                <Skeleton
                                    variant="text"
                                    width={25}
                                    height={25}
                                />
                            </Box>
                        ))}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        {[1, 2].map((item) => (
                            <Box
                                key={item}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Skeleton
                                        variant="circular"
                                        width={15}
                                        height={15}
                                    />

                                    <Skeleton
                                        variant="text"
                                        width={100}
                                        height={25}
                                    />
                                </Box>

                                <Skeleton
                                    variant="text"
                                    width={25}
                                    height={25}
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Card>
        );
    }
    return (
        <Card
            onClick={() => setActiveIndex(null)}
            sx={{
                width: "100%",
                height: "100%",
                borderRadius: "13px",
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                boxSizing: "border-box",
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: "11px" }}>
                    <SchoolOutlinedIcon sx={{ color: "#90D916" }} />

                    <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "grey" }}>
                        Enrollment by Courses
                    </Typography>
                </Box>

                <Typography sx={{ fontSize: "16px", color: "#4D4D4D" }}>
                    Total:
                    <Box component="span" sx={{ fontWeight: "bold", ml: 0.5 }}>
                       {enrollment.reduce(
                            (total, item) => total + (Number(item.value) || 0),
                            0
                        )}
                    </Box>
                </Typography>
            </Box>

            {/* CHART */}
            <Box sx={{ width: "100%", height: 285 }}>
                {allValuesZero ? (
                    <Box
                        sx={{
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <img
                            src={empty_gif}
                            alt="No Data"
                            style={{
                                width: "180px",
                                height: "180px",
                                objectFit: "contain",
                            }}
                        />
                    </Box>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart
                            margin={{
                                top: 0,
                                right: 100,
                                bottom: 0,
                                left: 100,
                            }}
                        >
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                onMouseEnter={(_, index) =>
                                    setActiveIndex(index)
                                }
                                onMouseLeave={() =>
                                    setActiveIndex(null)
                                }
                                data={pieData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={85}
                                startAngle={160}
                                endAngle={-270}
                                paddingAngle={2}
                                cornerRadius={8}
                            >
                                {pieData.map((item, index) => (
                                    <Cell
                                        key={index}
                                        fill={item.color}
                                        style={{
                                            cursor: "pointer",
                                            opacity:
                                                activeIndex === null
                                                    ? 1
                                                    : activeIndex === index
                                                        ? 1
                                                        : 0.25,
                                            transition: "0.3s ease",
                                        }}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Box>

            {/* LEGENDS (AUTO SPLIT) */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 3,
                    width: "100%",
                    flexWrap: "wrap",
                }}
            >
                {/* LEFT */}
                <Box sx={{ flex: 1 }}>
                    {left.map((item, index) => {
                        const realIndex = index;
                        return (
                            <LegendItem
                                key={realIndex}
                                color={item.color}
                                title={item.name}
                                value={item.actualValue}
                            />
                        );
                    })}
                </Box>

                {/* RIGHT */}
                <Box sx={{ flex: 1 }}>
                    {right.map((item, index) => {
                        const realIndex = index + mid;
                        return (
                            <LegendItem
                                key={realIndex}
                                color={item.color}
                                title={item.name}
                                value={item.actualValue}
                                active={activeIndex === realIndex}
                                dim={
                                    activeIndex !== null &&
                                    activeIndex !== realIndex
                                }
                            />
                        );
                    })}
                </Box>
            </Box>
        </Card>
    );
};

export default EnrollmentByCourseCard;

/* ================= LEGEND COMPONENT ================= */

const LegendItem = ({ color, title, value }) => {
    const formatTitle = (title) => {
        if (!title) return "";

        if (
            title.toLowerCase() === "ui/ux" ||
            title.toLowerCase() === "ui / ux" ||
            title.toLowerCase() === "ui/ux design"
        ) {
            return "UI/UX Design";
        }

        return title
            .toLowerCase()
            .split(" ")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
            )
            .join(" ");
    };
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                opacity: 1,
                transition: "0.3s ease",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1
                }}>
                <Box
                    sx={{
                        width: 15,
                        height: 15,
                        borderRadius: "50%",
                        backgroundColor: color,
                        transform: "scale(1)",
                        transition: "0.3s",
                    }}
                />

                <Typography
                    sx={{
                        fontSize: {
                            xs: "14px",
                            md: "11px",
                        },
                        color: "#555",
                        fontWeight: 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {formatTitle(title)}
                </Typography>
            </Box>

            <Typography
                sx={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#555",
                    ml: 1,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
};

/* ================= COLORS ================= */

const getColor = (index) => {
    const colors = ["#EF4444", "#90D916", "#78BFFF", "#FFC35A", "#7948FF", '#BBa56A'];
    return colors[index % colors.length];
};
