import {
    Avatar,
    Box,
    Card,
    Grid,
    Typography,
    Skeleton,
} from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const PerformanceCard = ({ performance, loading = false }) => {
    if (loading || !performance)  {
        return (
            <Card
                sx={{
                    width: "100%",
                    minWidth: 0,
                    height: "100%",
                    borderRadius: "13px",
                    p: { xs: 2, md: 3 },
                    overflow: "hidden",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "11px" }}>
                    <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                    />

                    <Skeleton
                        variant="text"
                        width={170}
                        height={30}
                    />
                </Box>

                {/* Circle */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 2,
                    }}
                >
                    <Skeleton
                        variant="circular"
                        width={105}
                        height={105}
                    />
                </Box>

                {/* Name */}
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Skeleton
                        variant="text"
                        width={140}
                        height={30}
                        sx={{ mx: "auto" }}
                    />

                    <Skeleton
                        variant="text"
                        width={100}
                        height={20}
                        sx={{ mx: "auto" }}
                    />
                </Box>

                {/* Percentage */}
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Skeleton
                        variant="text"
                        width={80}
                        height={40}
                        sx={{ mx: "auto" }}
                    />

                    <Skeleton
                        variant="text"
                        width={160}
                        height={25}
                        sx={{ mx: "auto" }}
                    />
                </Box>

                {/* Stats */}
                <Grid container spacing={2} sx={{ mt: 3 }}>
                    {[1, 2, 3].map((item) => (
                        <Grid size={4} key={item}>
                            <Skeleton
                                variant="rounded"
                                height={40}
                                sx={{ borderRadius: "7px" }}
                            />
                        </Grid>
                    ))}
                </Grid>

                {/* Bottom Text */}
                <Box sx={{ mt: 3 }}>
                    <Skeleton
                        variant="text"
                        width="70%"
                        height={25}
                        sx={{ mx: "auto" }}
                    />
                </Box>
            </Card>
        );
    }

    const percentage = performance.performance_score

    return (
        <Card
            sx={{
                width: "100%",
                minWidth: 0,
                height: "100%",
                borderRadius: "13px",

                p: {
                    xs: 2,
                    md: 3,
                },

                overflow: "hidden",

                boxSizing: "border-box",

                display: "flex",
                flexDirection: "column",
            }}
        >

            {/* Heading */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: '11px',
                }}
            >

                <SchoolOutlinedIcon
                    sx={{
                        color: "#90D916",
                        fontSize: "24px",
                    }}
                />

                <Typography
                    sx={{
                        fontSize: {
                            xs: "16px",
                            md: "18px",
                        },

                        fontWeight: 600,
                        color: 'grey'
                    }}
                >
                    Performance
                </Typography>

            </Box>

            {/* Circle */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 2,
                }}
            >
                <Box
                    sx={{
                        position: "relative",
                        width: 105,
                        height: 105,
                    }}
                >
                    {/* Percentage Border */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",

                            background: `conic-gradient(
                #90D916 ${percentage * 3.6}deg,
                white ${percentage * 3.6}deg
              )`,

                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            p: "6px",
                            boxSizing: "border-box",

                        }}
                    >

                        {/* Inner Circle */}
                        <Box
                            sx={{
                                width: 95,
                                height: 95,
                                borderRadius: "50%",
                                backgroundColor: "white",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",

                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 87,
                                    height: 87,
                                }}
                            />
                        </Box>

                    </Box>
                </Box>
            </Box>

            {/* Name */}
            <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography
                    sx={{
                        fontSize: '18px',
                        fontWeight: '500',

                    }}
                >
                    {performance.first_name}
                </Typography>

                <Typography
                    sx={{
                        color: "#8b8b8b",
                        fontSize: '10px',
                        fontWeight: '500'

                    }}
                >
                    {performance.role_name}
                </Typography>
            </Box>

            {/* Percentage */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography
                    sx={{
                        fontSize: '22px',
                        fontWeight: '400'
                    }}
                >
                    {percentage}%
                </Typography>

                <Typography
                    variant="h5"
                    sx={{
                        color: "#000000B2",
                        fontSize: '18px',
                        fontWeight: '400'

                    }}
                >
                    Performance Score
                </Typography>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{
                mt: 3,
            }}>

                <Grid size={4}>
                    <Box
                        sx={{
                            backgroundColor: "#FCEFD7",
                            borderRadius: "7px",
                            height: "40px",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'

                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '12px',
                                fontWeight: '700'
                            }}
                        >
                            {performance.total_leads}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: '10px',
                                fontWeight: '400'
                            }}>
                            Total Leads
                        </Typography>
                    </Box>
                </Grid>

                <Grid size={4}>
                    <Box
                        sx={{
                            backgroundColor: "#DBF0FB",
                            borderRadius: "7px",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: "40px",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '12px',
                                fontWeight: '700'
                            }}
                        >
                            {performance.contacted}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: '10px',
                                fontWeight: '400'
                            }}>
                            Contacted
                        </Typography>
                    </Box>
                </Grid>

                <Grid size={4}>
                    <Box
                        sx={{
                            backgroundColor: "#DCFFA1",
                            borderRadius: "7px",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: "40px",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '12px',
                                fontWeight: '700'
                            }}
                        >
                            {performance.won_leads}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: '10px',
                                fontWeight: '400'
                            }}>
                            Won Leads
                        </Typography>
                    </Box>
                </Grid>

            </Grid>

            {/* Bottom Text */}
            <Typography
                sx={{
                    color: "#1D5A19",
                    fontSize: "14px",
                    fontWeight: "700",
                    mt: 3,
                    textAlign: 'center'
                }}
            >
                ↗ {100 - percentage}% is more to reach the target
            </Typography>

        </Card>
    );
};

export default PerformanceCard;
