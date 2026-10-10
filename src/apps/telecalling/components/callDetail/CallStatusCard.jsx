import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  Box,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useNavigate } from "react-router-dom";
import CallEndOutlinedIcon from "@mui/icons-material/CallEndOutlined";

const CallStatusCard = ({ status, setStatus, leadId, onCancelCall }) => {
  const navigate = useNavigate();
  const [activeCallLeadId, setActiveCallLeadId] = useState(
    localStorage.getItem("activeCallLeadId"),
  );
  const [activeCallLeadName, setActiveCallLeadName] = useState(
    localStorage.getItem("activeCallLeadName"),
  );

  useEffect(() => {
    const updateCall = () => {
      setActiveCallLeadId(localStorage.getItem("activeCallLeadId"));
      setActiveCallLeadName(localStorage.getItem("activeCallLeadName"));
    };

    window.addEventListener("activeCallChanged", updateCall);

    return () => {
      window.removeEventListener("activeCallChanged", updateCall);
    };
  }, []);

  const hasOtherActiveCall =
    activeCallLeadId && activeCallLeadId !== String(leadId);

  const getButton = () => {
    switch (status) {
      case "Connected":
        return (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              startIcon={<CallOutlinedIcon />}
              sx={{
                bgcolor: "#97D927",
                color: "#fff",
                width: { xs: "200px", md: "250px" },
                borderRadius: "10px",
                textTransform: "none",
              }}
            >
              Connected
            </Button>

            {/* 🔴 தவறாக அழுத்தியிருந்தால் ரத்து செய்ய இந்த பட்டன் */}
            <Button
              startIcon={<CallEndOutlinedIcon />}
              onClick={onCancelCall}
              sx={{
                bgcolor: "#D91616",
                color: "#fff",
                width: { xs: "200px", md: "250px" },
                borderRadius: "10px",
                textTransform: "none",
                "&:hover": { bgcolor: "#b31212" },
              }}
            >
              Cancel Call
            </Button>
          </Box>
        );

      case "Incoming":
        return (
            <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
          <Button
            startIcon={<CallOutlinedIcon />}
            sx={{
              bgcolor: "#1890FF",
              color: "#fff",
              width: 347,
              borderRadius: "10px",
              textTransform: "none",
            }}
          >
            Incoming
          </Button>
            {/* 🔴 தவறாக அழுத்தியிருந்தால் ரத்து செய்ய இந்த பட்டன் */}
            <Button
              startIcon={<CallEndOutlinedIcon />}
              onClick={onCancelCall}
              sx={{
                bgcolor: "#D91616",
                color: "#fff",
                width: { xs: "200px", md: "250px" },
                borderRadius: "10px",
                textTransform: "none",
                "&:hover": { bgcolor: "#b31212" },
              }}
            >
              Cancel Call
            </Button>
            </Box>
        );

      case "Disconnected":
        return (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
          <Button
            startIcon={<CallOutlinedIcon />}
            sx={{
              bgcolor: "#D91616",
              color: "#fff",
              width: 347,
              borderRadius: "10px",
              textTransform: "none",
            }}
          >
            Disconnected
          </Button>
                      {/* 🔴 தவறாக அழுத்தியிருந்தால் ரத்து செய்ய இந்த பட்டன் */}
            <Button
              startIcon={<CallEndOutlinedIcon />}
              onClick={onCancelCall}
              sx={{
                bgcolor: "#D91616",
                color: "#fff",
                width: { xs: "200px", md: "250px" },
                borderRadius: "10px",
                textTransform: "none",
                "&:hover": { bgcolor: "#b31212" },
              }}
            >
              Cancel Call
            </Button>
        </Box>
        );

      default:
        return (
          <Grid
            container
            spacing={2}
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Grid item>
              <Button
                disabled={hasOtherActiveCall}
                startIcon={<CallOutlinedIcon />}
                onClick={() => setStatus("Connected")}
                sx={{
                  bgcolor: "#97D927",
                  color: "#fff",
                  width: {
                    xs: "250px",
                    md: "347px",
                  },
                  borderRadius: "10px",
                  textTransform: "none",
                }}
              >
                Connected
              </Button>
            </Grid>

            <Grid item>
              <Button
                disabled={hasOtherActiveCall}
                startIcon={<CallOutlinedIcon />}
                onClick={() => setStatus("Disconnected")}
                sx={{
                  bgcolor: "#D91616",
                  color: "#fff",
                  width: {
                    xs: "250px",
                    md: "347px",
                  },
                  borderRadius: "10px",
                  textTransform: "none",
                }}
              >
                Disconnected
              </Button>
            </Grid>

            <Grid item>
              <Button
                disabled={hasOtherActiveCall}
                startIcon={<CallOutlinedIcon />}
                onClick={() => setStatus("Incoming")}
                sx={{
                  bgcolor: "#1890FF",
                  color: "#fff",
                  width: {
                    xs: "250px",
                    md: "347px",
                  },
                  borderRadius: "10px",
                  textTransform: "none",
                }}
              >
                Incoming
              </Button>
            </Grid>
          </Grid>
        );
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "17px",
        mb: 3,
        border: "0.5px solid #D0CCCC",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PersonOutlineOutlinedIcon sx={{ color: "#97D927" }} />
          Call Connection Status
        </Typography>

        {hasOtherActiveCall && (
          <Alert
            severity="warning"
            icon={<WarningAmberRoundedIcon fontSize="medium" />}
            sx={{
              mb: 3,
              borderRadius: "12px",
              border: "1px solid #FFE58F",
              bgcolor: "#FFFBE6",
              color: "#D48806",
              alignItems: "center",
              "& .MuiAlert-message": {
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              },
            }}
          >
            <Box>
              <Typography
                sx={{ fontWeight: 700, fontSize: "14px", color: "#D48806" }}
              >
                Unsaved Call Data Pending!
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#595959", mt: 0.5 }}>
                Last call data for{" "}
                <strong>{activeCallLeadName || "previous lead"}</strong> has not
                been saved yet. Please save that call data first before
                connecting to another person.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate(`/telecalling/lead-details/${activeCallLeadId}`)}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                bgcolor: "#FAAD14",
                color: "#fff",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "8px",
                px: 2,
                py: 0.8,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#D48806",
                  boxShadow: "none",
                },
              }}
            >
              Go to {activeCallLeadName || "Active Lead"}
            </Button>
          </Alert>
        )}

        {getButton()}
      </CardContent>
    </Card>
  );
};

export default CallStatusCard;
