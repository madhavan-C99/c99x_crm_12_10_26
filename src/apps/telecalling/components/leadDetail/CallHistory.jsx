import { useEffect, useRef, useState } from "react";

import {
    Box,
    Typography,
    IconButton,
    Button,
} from "@mui/material";

import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useParams } from "react-router-dom";
import SouthWestRoundedIcon from "@mui/icons-material/SouthWestRounded";
import { fetchLeadCallHistory } from "@/apps/telecalling/services/callHistoryService";
import { useAuth } from "@/shared/context/AuthContext";

import { API_BASE_URL } from "@/shared/config/env";
const CallHistory = () => {
    const { hasPermission } = useAuth();
    const { id } = useParams();

    const [data, setData] = useState([]);

    const [playingId, setPlayingId] =
        useState(null);

    const [progress, setProgress] =
        useState({});

    const audioRef = useRef(null);

    const BASE_URL =
        API_BASE_URL;

    // API CALL
    const getCallHistory =
        async () => {
            if (!hasPermission("api_fetch_call_history_api")) {
                console.warn("Permission denied: api_fetch_call_history_api");
                return;
            }

            try {

                const response =
                    await fetchLeadCallHistory(
                        id
                    );

                setData(
                    response?.data?.data || []
                );

            } catch (error) {

                setData([]);
            }
        };

    useEffect(() => {

        if (id) {

            getCallHistory();
        }

    }, [id]);

    // FORMAT DATE
    const formatDateTime = (
        date
    ) => {

        if (!date) return "-";

        return new Date(
            date
        ).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // FORMAT DURATION
    const formatDuration = (
        seconds
    ) => {

        if (!seconds)
            return "0:00";

        const mins = Math.floor(
            seconds / 60
        );

        const secs =
            seconds % 60;

        return `${mins}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    // PLAY AUDIO
    const handlePlay = (
        item
    ) => {

        if (
            !item.upload_recording
        ) {
            return;
        }

        const audioUrl =
            `${BASE_URL}/${item.upload_recording}`;

        // PAUSE SAME AUDIO
        if (
            playingId === item.id
        ) {

            audioRef.current.pause();

            setPlayingId(null);

            return;
        }

        // STOP PREVIOUS
        if (
            audioRef.current
        ) {

            audioRef.current.pause();
        }

        const audio =
            new Audio(audioUrl);

        audioRef.current =
            audio;

        audio.play();

        setPlayingId(item.id);

        // UPDATE PROGRESS
        audio.ontimeupdate =
            () => {

                const percent =
                    (audio.currentTime /
                        audio.duration) *
                    100;

                setProgress(
                    (
                        prev
                    ) => ({
                        ...prev,

                        [item.id]:
                            percent,
                    })
                );
            };

        audio.onended =
            () => {

                setPlayingId(null);

                setProgress(
                    (
                        prev
                    ) => ({
                        ...prev,

                        [item.id]:
                            0,
                    })
                );
            };
    };

    return (

        <Box sx={{
            mt: 3,
            background: '#fff',
            p: 3,
            borderRadius: '17px',
            border: '1px solid #00000033'
        }}>

            {/* HEADER */}

            <Box
                sx={{
                    display: "flex",

                    justifyContent:
                        "space-between",

                    alignItems:
                        "center",

                    mb: 3,
                }}
            >

                <Box
                    sx={{
                        display: "flex",

                        alignItems:
                            "center",

                        gap: '7px',
                    }}
                >

                    <PersonOutlineOutlinedIcon
                        sx={{
                            color:
                                "#90D916",
                            fontSize: '24px'
                        }}
                    />

                    <Typography
                        sx={{
                            fontSize: "18px",
                            fontWeight: 600,
                        }}
                    >
                        Call History
                    </Typography>

                </Box>

                <Button
                    sx={{
                        border:
                            "1px solid #90D916",

                        color:
                            "#4D4D4D",

                        textTransform:
                            "none",

                        borderRadius:
                            "4px",

                        minWidth:
                            "71px",

                        height:
                            "31px",

                        fontSize: "16px",

                    }}
                >
                    {data?.length || 0} Calls
                </Button>

            </Box>

            {/* LIST */}

            {data.map((item) => {

                const hasAudio =
                    item.upload_recording;

                const isConnected =
                    item.connection_status === "Connected";

                const isIncoming =
                    item.connection_status === "Incoming";

                const isDisconnected =
                    item.connection_status === "Disconnected";
                return (

                    <Box
                        key={item.id}
                        sx={{
                            border:
                                "0.5px solid #00000033",

                            borderRadius:
                                "14px",

                            p: 2,
                            mb: 2,
                        }}
                    >

                        {/* TOP */}
                        {/* TOP */}

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: {
                                    xs: "flex-start",
                                    md: "center",
                                },
                                flexDirection: {
                                    xs: "column",
                                    md: "row",
                                },
                                gap: 2,
                            }}
                        >

                            {/* LEFT */}

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 2,
                                    width: "100%",
                                }}
                            >

                                {/* ICON */}

                                <Box
                                    sx={{
                                        minWidth: "45px",
                                    }}
                                >

                                    {isConnected ? (

                                        <Box
                                            sx={{
                                                width: "45px",
                                                height: "45px",
                                                borderRadius: "50%",
                                                background: "#E9EFFC",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                position: "relative",
                                            }}
                                        >
                                            <CallOutlinedIcon
                                                sx={{
                                                    color: "#2463EB",
                                                    fontSize: "24px",
                                                }}
                                            />

                                            <NorthEastRoundedIcon
                                                sx={{
                                                    position: "absolute",
                                                    top: "12px",
                                                    right: "12px",
                                                    color: "#2463EB",
                                                    fontSize: "15px",
                                                }}
                                            />
                                        </Box>

                                    ) : isIncoming ? (

                                        <Box
                                            sx={{
                                                width: "45px",
                                                height: "45px",
                                                borderRadius: "50%",
                                                background: "#E9EFFC",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                position: "relative",
                                            }}
                                        >
                                            <CallOutlinedIcon
                                                sx={{
                                                    color: "#2463EB",
                                                    fontSize: "24px",
                                                }}
                                            />

                                            <SouthWestRoundedIcon
                                                sx={{
                                                    position: "absolute",
                                                    top: "10px",
                                                    right: "10px",
                                                    color: "#2463EB",
                                                    fontSize: "15px",
                                                }}
                                            />
                                        </Box>

                                    ) : (

                                        <Box
                                            sx={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "50%",
                                                background: "#FFEAEA",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                position: "relative",
                                            }}
                                        >
                                            <CallOutlinedIcon
                                                sx={{
                                                    color: "#D91616",
                                                    fontSize: "24px",
                                                }}
                                            />

                                            <CloseRoundedIcon
                                                sx={{
                                                    position: "absolute",
                                                    top: "15px",
                                                    right: "15px",
                                                    fontSize: "10px",
                                                    stroke: "#D91616",
                                                    strokeWidth: 3,
                                                }}
                                            />
                                        </Box>

                                    )}

                                </Box>

                                {/* TEXT */}

                                <Box
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: {
                                                xs: "flex-start",
                                                sm: "center",
                                            },
                                            gap: "10px",
                                            flexWrap: "wrap",
                                            flexDirection: {
                                                xs: "column",
                                                sm: "row",
                                            },
                                        }}
                                    >

                                        <Typography
                                            sx={{
                                                fontSize: "16px",
                                                fontWeight: 600,
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {isConnected
                                                ? "Outgoing Call"
                                                : isIncoming
                                                    ? "Incoming Call"
                                                    : "No Response"}
                                        </Typography>

                                        <Box
                                            sx={{
                                                border:
                                                    "0.5px solid #0000003B",
                                                borderRadius: "999px",
                                                fontSize: "16px",
                                                fontWeight: 500,
                                                minHeight: "23px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                px: 1.5,
                                                py: 0.5,
                                                width: "fit-content",
                                                maxWidth: "100%",
                                                textAlign: "center",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {item.name}
                                        </Box>

                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: {
                                                xs: "flex-start",
                                                sm: "center",
                                            },
                                            gap: 1,
                                            mt: 1,
                                            flexWrap: "wrap",
                                            flexDirection: {
                                                xs: "column",
                                                sm: "row",
                                            },
                                        }}
                                    >

                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >

                                            <AccessTimeOutlinedIcon
                                                sx={{
                                                    fontSize: "18px",
                                                    color: "#666",
                                                }}
                                            />

                                            <Typography
                                                sx={{
                                                    color: "#333",
                                                    fontSize: "16px",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {formatDateTime(item.called_at)}
                                            </Typography>

                                        </Box>

                                        <Typography
                                            sx={{
                                                color: "#333",
                                                fontSize: "16px",
                                            }}
                                        >
                                            Duration:{" "}
                                            {formatDuration(
                                                item.duration_seconds
                                            )}
                                        </Typography>

                                    </Box>

                                </Box>

                            </Box>

                            {/* BUTTON */}

                            <Button
                                startIcon={<AddOutlinedIcon />}
                                sx={{
                                    border: "1px solid #90D916",
                                    color: "#000000",
                                    textTransform: "none",
                                    borderRadius: "6px",
                                    height: "31px",
                                    fontSize: "16px",
                                    background: "#E9F6D4",

                                    width: {
                                        xs: "100%",
                                        sm: "fit-content",
                                    },

                                    px: 2,

                                    whiteSpace: "nowrap",

                                    minWidth: "140px",
                                }}
                            >
                                Add Records
                            </Button>

                        </Box>

                        {/* AUDIO */}

                        <Box
                            sx={{
                                mt: 1.5,
                                background: "#F8F8F8",
                                borderRadius: "7px",
                                p: 1.2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                flexWrap: "wrap",
                            }}
                        >

                            {(isConnected || isIncoming) ? (

                                <>

                                    <IconButton
                                        onClick={() =>
                                            handlePlay(item)
                                        }
                                        sx={{
                                            width: "38px",
                                            height: "35px",
                                            background: "#90D916",
                                            color: "#fff",
                                            "&:hover": {
                                                background: "#7DC60E",
                                            },
                                        }}
                                    >

                                        {playingId === item.id ? (
                                            <PauseRoundedIcon />
                                        ) : (
                                            <PlayArrowRoundedIcon />
                                        )}

                                    </IconButton>

                                    <Box
                                        sx={{
                                            flex: 1,
                                            minWidth: {
                                                xs: "100%",
                                                sm: "120px",
                                            },
                                            height: "15px",
                                            background: "#E0E0E0",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                            position: "relative",
                                            order: {
                                                xs: 3,
                                                sm: 0,
                                            },
                                        }}
                                    >

                                        <Box
                                            sx={{
                                                width: `${progress[item.id] || 0}%`,
                                                height: "100%",
                                                background: "#90D916",
                                                transition: "0.2s linear",
                                            }}
                                        />

                                    </Box>

                                    <Typography
                                        sx={{
                                            fontSize: "10px",
                                            color: "#4D4D4D",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {formatDuration(
                                            item.duration_seconds
                                        )}
                                    </Typography>

                                    <IconButton
                                        sx={{
                                            border: "1px solid #D91616",
                                            borderRadius: "6px",
                                            width: "27px",
                                            height: "27px",
                                            background: "#FFEAEA",
                                        }}
                                    >

                                        <DeleteOutlineOutlinedIcon
                                            sx={{
                                                color: "#D91616",
                                                fontSize: "19px",
                                            }}
                                        />

                                    </IconButton>

                                </>

                            ) : (

                                <>
                                    <HeadphonesOutlinedIcon
                                        sx={{
                                            fontSize: "30px",
                                            color: "#4D4D4D",
                                        }}
                                    />

                                    <Typography
                                        sx={{
                                            fontSize: {
                                                xs: "15px",
                                                md: "14px",
                                            },
                                            fontWeight: 400,
                                            color: "#4D4D4D",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        No voice record is added to this call
                                    </Typography>
                                </>

                            )}

                        </Box>

                        {/* NOTES */}

                        {/* CALL NOTES */}

                        <Box
                            sx={{
                                mt: 1.5,
                                background: "#F8F8F8",
                                borderRadius: "8px",
                                px: 2,
                                py: 1.5,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "7px",
                                    mb: 0.8,
                                }}
                            >

                                <PersonOutlineOutlinedIcon
                                    sx={{
                                        color: "#90D916",
                                        fontSize: "19px",
                                        display: "flex",
                                    }}
                                />

                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        color: "#4D4D4D",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Call Notes
                                </Typography>

                            </Box>

                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    lineHeight: 1.5,
                                    color: "#000000",
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                }}
                            >
                                {item.connection_status === "Disconnected"
                                    ? item.retry_notes
                                    : item.call_notes}
                            </Typography>

                        </Box>

                        {/* NEXT FOLLOW UP */}

                        <Box
                            sx={{
                                mt: 1.5,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                background: "#FFF8E5",
                                px: 1.5,
                                borderRadius: "6px",
                                minHeight: "30px",
                                width: {
                                    sm: "fit-content",
                                },
                            }}
                        >

                            <AccessTimeOutlinedIcon
                                sx={{
                                    color: "#E7AA06",
                                    fontSize: "21px",
                                }}
                            />

                            <Typography
                                sx={{
                                    color: "#E7AA06",
                                    fontWeight: 600,
                                    fontSize: "16px",
                                    wordBreak: "break-word",

                                }}
                            >
                                Next Follow Up:{" "}
                                {formatDateTime(
                                    item.next_follow_up
                                )}
                            </Typography>

                        </Box>

                    </Box>
                );
            })}

        </Box>
    );
};

export default CallHistory;
