
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";

const TimeSection = ({
  time,
  onEndCall,
  callEnded,
}) => {

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius:
          "17px",
        mb: 3,
        border:
          "1px solid #D0CCCC",
      }}
    >
      <CardContent>

        <Typography
          sx={{
            display: "flex",
            alignItems:
              "center",
            gap: '11px',
            fontWeight: 600,
          }}
        >
          <PersonOutlineOutlinedIcon
            sx={{
              color:
                "#97D927",
            }}
          />
          Time
        </Typography>

        <Box
          sx={{
            textAlign:
              "center",
            mt: 1,
          }}
        >
          <Typography
            sx={{
              fontSize:
                "42px",
              fontWeight: 500,
            }}
          >
            {time}
          </Typography>

          <Button
            startIcon={
              <CallOutlinedIcon
                sx={{ fontSize: '24px !important' }} />
            }
            onClick={
              onEndCall
            }
            sx={{
              bgcolor:
                "#D91616",
              color:
                "#fff",
              borderRadius:
                "10px",
              textTransform:
                "none",

              "&:hover":
              {
                bgcolor:
                  "#c91515",
              },
              height: '35px',
              width: '145px',
              fontSize: '18px'
            }}
          >
            End Call
          </Button>
        </Box>

      </CardContent>
    </Card>
  );
};

export default TimeSection;
