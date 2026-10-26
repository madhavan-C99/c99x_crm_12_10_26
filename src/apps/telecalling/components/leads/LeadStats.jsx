
import {
    Box,
    Typography,
    Button,
    Skeleton,
} from "@mui/material";
const LeadStats = ({

    statsData = {},

    selectedLeadType,

    setSelectedLeadType,

    loading = false,
}) => {

    // BUILD TABS DYNAMICALLY: "Total Leads" first, then one tab per
    // stage that belongs to the currently selected pipeline.
    const stageOptions = statsData?.stage_wise_count || [];

    const leadOptions = [

        {
            key: "total",
            label: "Total Leads",
            value: "",                       // "" => no pipeline_stage_id filter
            count: statsData?.total_leads ?? 0,
        },

        ...stageOptions.map((stage) => ({
            key: `stage-${stage.pipeline_stage_id}`,
            label: stage.label,
            value: stage.pipeline_stage_id,  // send this as pipeline_stage_id
            count: stage.count ?? 0,
        })),
    ];

    // SKELETON TILE - whole tile itself is a skeleton shape, no border/box

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: { xs: "nowrap", lg: "wrap" },
                    overflowX: { xs: "auto", lg: "visible" },
                    mt: { xs: 2, sm: 3 },
                    pb: { xs: 0.5, lg: 0 },
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": {
                        display: "none",
                    },
                }}
            >
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton
                        key={`skeleton-${index}`}
                        variant="rounded"
                        animation="wave"
                        sx={{
                            width: { xs: "125px", sm: "140px" },
                            minWidth: { xs: "125px", sm: "140px" },
                            flexShrink: 0,
                            height: "43px",
                            borderRadius: "5px",
                        }}
                    />
                ))}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: "flex",
                gap: "10px",
                flexWrap: { xs: "nowrap", lg: "wrap" },
                overflowX: { xs: "auto", lg: "visible" },
                mt: { xs: 2, sm: 3 },
                pb: { xs: 0.5, lg: 0 },
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                    display: "none",
                },
            }}
        >

            {leadOptions.map(
                (item) => {

                    const isActive =

                        selectedLeadType ===
                        item.value;

                    return (

                        <Button

                            key={item.key}

                            onClick={() =>
                                setSelectedLeadType(
                                    item.value
                                )
                            }

                            sx={{
                                width: "fit-content",
                                minWidth: "fit-content",
                                flexShrink: 0,
                                height: "43px",
                                px: { xs: 1.25, sm: 1.5 },
                                borderRadius: "5px",
                                border: "1px solid #90D916",
                                whiteSpace: "nowrap",

                                background:
                                    isActive
                                        ? "#90D916"
                                        : "#fff",

                                color:
                                    isActive
                                        ? "#FFFFFF"
                                        : "#90D916",

                                textTransform: "none",

                                display: "flex",

                                alignItems: "center",

                                justifyContent: "space-between",

                                gap: 1,

                                "&:hover": {

                                    background:
                                        isActive
                                            ? "#9BE006"
                                            : "#F7FFE7",
                                },
                            }}
                        >

                            {/* LABEL */}

                            <Typography
                                sx={{

                                    fontWeight: 500,
                                }}
                            >
                                {item.label}

                            </Typography>

                            {/* COUNT */}

                            <Box
                                sx={{

                                    width: "25px",

                                    height: "25px",

                                    borderRadius:
                                        "50%",

                                    background:

                                        isActive

                                            ? "#000"

                                            : "#E9F6D4",

                                    color:

                                        isActive

                                            ? "#fff"

                                            : "#90D916",

                                    display: "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    fontSize:
                                        "10px",

                                    fontWeight: 600,
                                }}
                            >

                                {item.count}

                            </Box>

                        </Button>
                    );
                }
            )}

        </Box>
    );
};

export default LeadStats;
