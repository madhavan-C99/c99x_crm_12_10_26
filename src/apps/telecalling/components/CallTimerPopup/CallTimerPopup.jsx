import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
} from "@mui/material";

import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const CallTimerPopup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeLeadId, setActiveLeadId] =
        useState(
            localStorage.getItem(
                "activeCallLeadId"
            )
        );

    const status =
        localStorage.getItem(
            `callStatus_${activeLeadId}`
        );

    const currentEndTime =
        localStorage.getItem(
            `callEndTime_${activeLeadId}`
        );

    const [seconds, setSeconds] = useState(0);

    const [refresh, setRefresh] =
        useState(0);

    useEffect(() => {

        const updatePopup = () => {

            setRefresh(
                prev => prev + 1
            );

        };

        window.addEventListener(
            "activeCallChanged",
            updatePopup
        );

        return () => {

            window.removeEventListener(
                "activeCallChanged",
                updatePopup
            );

        };

    }, []);

    useEffect(() => {

        const interval = setInterval(() => {

            setActiveLeadId(
                localStorage.getItem(
                    "activeCallLeadId"
                )
            );

        }, 500);

        return () => clearInterval(interval);

    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const startTime =
                localStorage.getItem(
                    `callStartTime_${activeLeadId}`
                );

            if (startTime && !currentEndTime) {
                setSeconds(
                    Math.floor(
                        (Date.now() - Number(startTime)) /
                        1000
                    )
                );
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeLeadId, currentEndTime]);

    useEffect(() => {

        setSeconds(0);

        const startTime =
            localStorage.getItem(
                `callStartTime_${activeLeadId}`
            );

        const endTime =
            localStorage.getItem(
                `callEndTime_${activeLeadId}`
            );

        if (startTime && !endTime) {

            setSeconds(
                Math.floor(
                    (Date.now() - Number(startTime)) /
                    1000
                )
            );

        }

    }, [activeLeadId]);

    if (!status || currentEndTime) {
        return null;
    }

    const mins = String(
        Math.floor(seconds / 60)
    ).padStart(2, "0");

    const secs = String(
        seconds % 60
    ).padStart(2, "0");
    const handleEndCall = () => {

        localStorage.setItem(
            `callEndTime_${activeLeadId}`,
            Date.now()
        );

        localStorage.setItem(
            "activeTab",
            "call_details"
        );

        window.dispatchEvent(
            new Event("callEnded")
        );

        if (activeLeadId) {
            navigate(`/crm.c99x.in/telecalling/lead-details/${activeLeadId}`);
        }
    };

    if (location.pathname === "/") {
        return null;
    }
    return (
        <Box
            sx={{
                position: "fixed",
                right: 25,
                bottom: 25,
                width: "134px",
                height: '101px',
                background: "#E6E6E6",
                borderRadius: "9px",
                zIndex: 9999,
                boxShadow: "0px 0px 7.65px 0px #00000052",
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >

            <Typography
                sx={{
                    fontSize: "29px",
                    fontWeight: 500,
                }}
            >
                {mins}:{secs}
            </Typography>

            <Button
                fullWidth
                startIcon={<CallOutlinedIcon />}
                onClick={handleEndCall}
                sx={{
                    mt: 0.5,
                    background: "#D91616",
                    color: "#ffffff",
                    borderRadius: "7px",
                    textTransform: "none",
                    height: '25px',
                    width: "101px",
                    fontSize: '12px',

                    "&:hover": {
                        background: "#E11919",
                    },
                    "& .MuiButton-startIcon svg": {
                        fontSize: "17px",
                    },
                }}
            >
                End Call
            </Button>
        </Box>
    );
};

export default CallTimerPopup;
