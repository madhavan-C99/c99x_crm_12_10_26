
import {
    Box,
    Typography,
} from "@mui/material";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

const DetailCard = ({
    title,
    data = [],
}) => {

    return (

        <Box
            sx={{
                background: "#fff",

                border:
                    "1px solid #E4E4E4",

                borderRadius:
                    "20px",

                p: 3,

                width: "100%",

                boxSizing:
                    "border-box",
                mt: 3,
                maxWidth: '100%'

            }}
        >

            {/* TITLE */}

            <Box
                sx={{
                    display: "flex",

                    alignItems:
                        "center",

                    gap: '7px',

                    mb: 1,
                }}
            >

                <PersonOutlineRoundedIcon
                    sx={{
                        color:
                            "#8DD91A",
                    }}
                />

                <Typography
                    sx={{
                        fontSize:
                            "18px",

                        fontWeight: 600,

                        color: "#111",
                    }}
                >
                    {title}
                </Typography>

            </Box>

            {/* ROWS */}

            {data.map(
                (
                    item,
                    index
                ) => (
                    <Box
                        key={index}

                        sx={{
                            display: "flex",

                            justifyContent:
                                "space-between",

                            alignItems:
                                "center",

                            minHeight: "50px",

                            borderBottom: "0.8px solid #00000033",

                            gap: 2,
                        }}
                    >

                        {/* LABEL */}

                        <Typography
                            sx={{
                                width: "50%",

                                color:
                                    "#4D4D4D",

                                fontSize:
                                {
                                    xs: "14px",
                                    md: "16px",
                                },

                                fontWeight: 400,
                            }}
                        >
                            {item.label}
                        </Typography>

                        {/* VALUE */}

                        <Typography
                            sx={{
                                width: "50%",

                                textAlign:
                                    "right",

                                color:
                                    "#4D4D4D",

                                fontSize:
                                {
                                    xs: "14px",
                                    md: "16px",
                                },

                                fontWeight: 400,

                                wordBreak:
                                    "break-word",
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                            }}
                        >
                            {item.value || "-"}
                        </Typography>

                    </Box>

                )
            )}

        </Box>
    );
};

export default DetailCard;
