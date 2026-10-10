// LeadActionBar.jsx


import {
    Box,
    Button,
} from "@mui/material";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";

const LeadActionBar = () => {

    return (

        <Box
            sx={{
                mt: 4,

                display: "flex",

                justifyContent:
                {
                    xs: 'center',
                    md: "flex-end"
                },

                gap: '16px',

                flexWrap: "wrap",
                mr: 0.5
            }}
        >

            <Button
                startIcon={
                    <WhatsAppIcon
                        sx={{
                            height: '19px',
                            width: '19px'
                        }}
                    />
                }

                sx={{
                    background:
                        "#90D916",

                    color: "#fff",

                    textTransform:
                        "none",

                    borderRadius:
                        "4px",

                    px: 2.5,

                    height: "31px",
                    width: '110px',

                    fontWeight: 400,

                    "&:hover": {
                        background:
                            "#79BE12",
                    },
                    border: "1px solid #C3C3C3"
                }}
            >
                Whatsapp
            </Button>

            <Button
                startIcon={
                    <MailOutlineRoundedIcon
                        sx={{
                            height: '19px',
                            width: '19px'
                        }}
                    />
                }

                variant="outlined"

                sx={{
                    textTransform:
                        "none",

                    borderRadius:
                        "4px",

                    height: "31px",

                    border:
                        "1px solid #C3C3C3",

                    color: "#222",

                    fontWeight: 400,
                    width: '79px'
                }}
            >
                Mail
            </Button>

            <Button
                startIcon={
                    <CallOutlinedIcon
                        sx={{
                            height: '19px',
                            width: '19px'
                        }}
                    />
                }

                variant="outlined"

                sx={{
                    textTransform:
                        "none",

                    borderRadius:
                        "4px",

                    height: "31px",

                    border:
                        "1px solid #C3C3C3",

                    color: "#222",

                    fontWeight: 400,
                    width: '71px'
                }}
            >
                Call
            </Button>

        </Box>
    );
};

export default LeadActionBar;
