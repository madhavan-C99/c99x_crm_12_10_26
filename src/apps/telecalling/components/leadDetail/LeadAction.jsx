// LeadActionBar.jsx


import {
    Box,
    Button,
} from "@mui/material";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import { normalizeMobile } from "@/shared/utils/mobile";



const LeadActionBar = ({ leadData }) => {

    // Lead number la irundhu 10 digit edukkum (+91 / space / dash ellam remove)
    const mobile = normalizeMobile(leadData?.mobile_no);
    const hasValidMobile = mobile.length === 10;

    const handleWhatsapp = () => {
        if (!hasValidMobile) return;

        // India country code 91 + 10 digit number
        const url = `https://web.whatsapp.com/send?phone=91${mobile}`;

        window.open(url, "_blank", "noopener,noreferrer");
    };

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
              onClick={handleWhatsapp}
              disabled={!hasValidMobile}
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
                    "&.Mui-disabled": {
                    background: "#CFCFCF",
                    color: "#fff",
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
