// LeadTopSection.jsx

import {useState} from "react";

import {
    Avatar,
    Box,
    Button,
    Typography,
    Skeleton
} from "@mui/material";
import { Snackbar, Alert } from "@mui/material";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";

const LeadTopSection = ({
  leadData,
  activeTab,
  onTabChange,
  loading,
  hasPendingCallStatus,
}) => {
  const navigate = useNavigate();

  const [showRestrictAlert, setShowRestrictAlert] = useState(false);

  return (
    <Box>
      {/* TOP SECTION */}

      <Box
        sx={{
          display: "flex",

          justifyContent: "space-between",

          alignItems: {
            xs: "flex-start",
            lg: "center",
          },

          flexDirection: {
            xs: "column",
            lg: "row",
          },

          gap: 3,
        }}
      >
        {/* LEFT */}

        <Box
          sx={{
            display: "flex",

            alignItems: "flex-start",

            gap: 2,

            width: "100%",
          }}
        >
          {/* BACK BUTTON */}

          <Box

            sx={{
              cursor: "pointer",

              mt: "8px",
            }}
          >
            <ArrowBackRoundedIcon
              onClick={() => {
                if (hasPendingCallStatus) {
                  setShowRestrictAlert(true); // block pண்ணுங்க
                  return;
                }
               let rawPath = localStorage.getItem("lead_return_path") || sessionStorage.getItem("lead_return_path") || "/telecalling/pipeline";
               const targetPath = rawPath.startsWith("/telecalling") ? rawPath : `/telecalling${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
               navigate(targetPath);
              }}
              sx={{
                color: "#111",

                fontSize: "29px",
              }}
            />
          </Box>

          {/* AVATAR */}

          {loading ? (
            <Skeleton variant="circular" width={47} height={47} />
          ) : (
            <Avatar
              sx={{
                width: { xs: 40, md: 47 },
                height: { xs: 40, md: 47 },
                background: "#90D916",
                fontSize: { xs: "26px", md: "32px" },
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {leadData?.full_name?.charAt(0)}
            </Avatar>
          )}

          {/* DETAILS */}

          <Box
            sx={{
              flex: 1,
            }}
          >
            {/* NAME */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {loading ? (
                <>
                  <Skeleton variant="text" width={180} height={35} />
                  <Skeleton variant="rounded" width={45} height={18} />
                  <Skeleton variant="rounded" width={70} height={18} />
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      fontSize: { xs: "20px", md: "22px" },
                      fontWeight: 500,
                    }}
                  >
                    {leadData?.full_name}
                  </Typography>


                  {Boolean(leadData?.priority_id && leadData?.priority) && (
                    <Box
                      sx={{
                        width: "fit-content",
                        px: 1,
                        height: "15px",
                        borderRadius: "4px",
                        border:
                          leadData?.priority === "Hot"
                            ? "1px solid #F96F70"
                            : "1px solid #7B61FF",
                        color:
                          leadData?.priority === "Hot" ? "#F96F70" : "#7B61FF",
                        background: "#FFF1F0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                      }}
                    >
                      {leadData?.priority}
                    </Box>
                  )}

                  <Box
                    sx={{
                      minWidth: "60px",
                      width: "fit-content",
                      px: 1,
                      height: "15px",
                      borderRadius: "4px",
                      border: "1px solid #9091FD",
                      color: "#7B61FF",
                      background: "#F7F0FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      textTransform: "capitalize",
                    }}
                  >
                    {leadData?.pipeline_stage}
                  </Box>
                </>
              )}
            </Box>
            {/* MOBILE + EMAIL */}

            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                gap: "15px",

                flexWrap: "wrap",
              }}
            >
              {loading ? (
                <>
                  <Skeleton variant="text" width={150} height={28} />
                  <Skeleton variant="text" width={220} height={28} />
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      fontSize: { xs: "16px", md: "18px" },
                      color: "#7B7B7B",
                    }}
                  >
                    {leadData?.mobile_no}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: "16px", md: "18px" },
                      color: "#7B7B7B",
                    }}
                  >
                    {leadData?.email || "-"}
                  </Typography>
                </>
              )}
            </Box>

            {/* LEAD SOURCE */}

            {loading ? (
              <Skeleton variant="rounded" width={180} height={28} />
            ) : (
              <Box
                sx={{
                  width: "fit-content",
                  background: "#E6E6E6",
                  borderRadius: "20px",
                  height: "27px",
                  display: "flex",
                  alignItems: "center",
                  px: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#4D4D4D",
                  }}
                >
                  Lead Source: {leadData?.lead_source}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* TAB BUTTONS */}

      <Box
        sx={{
          mt: { xs: "16px", sm: "32px" },

          maxWidth: { xs: "100%", sm: "598px" },

          background: "#E6E6E6",

          border: "1px solid #D0CCCC",

          borderRadius: "6px",

          display: "flex",

          flexWrap: { xs: "nowrap", sm: "wrap" },
          overflowX: { xs: "auto", sm: "visible" },

          gap: {
            xs: "6px",
            sm: "20px",
            md: "52px",
          },

          justifyContent: { xs: "flex-start", sm: "center" },

          alignItems: "center",

          px: {
            xs: 0.75,
            sm: 2,
          },

          py: {
            xs: 0.75,
            sm: 1,
          },

          minHeight: "auto",

          ml: {
            xs: 0,
            sm: 1,
          },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {/* CALL DETAILS */}

        <Button
          startIcon={
            <CallOutlinedIcon
              sx={{
                color: "#90D916",
                height: { xs: "18px", sm: "24px" },
                width: { xs: "18px", sm: "24px" },
              }}
            />
          }
          onClick={() => onTabChange("call_details")}
          sx={{
            flex: { xs: 1, sm: "none" },
            minWidth: { xs: "100px", sm: "152px" },
            width: {
              xs: "auto",
              sm: "152px",
            },

            height: { xs: "36px", sm: "42px" },

            borderRadius: "8px",

            background:
              activeTab === "call_details" ? "#FFFFFF" : "transparent",

            color: "#000000",

            textTransform: "none",

            fontSize: { xs: "13px", sm: "16px", md: "18px" },

            fontWeight: 500,
            whiteSpace: "nowrap",
            px: { xs: 1, sm: 2 },

            boxShadow:
              activeTab === "call_details"
                ? "0px 4px 10px rgba(0,0,0,0.12)"
                : "none",

            "&:hover": {
              background: "#fff",
            },
          }}
        >
          Call Details
        </Button>

        {/* LEAD FORM */}

        <Button
          startIcon={
            <DescriptionOutlinedIcon
              sx={{
                color: "#90D916",
                height: { xs: "18px", sm: "24px" },
                width: { xs: "18px", sm: "24px" },
              }}
            />
          }
          onClick={() => onTabChange("lead_form")}
          sx={{
            flex: { xs: 1, sm: "none" },
            minWidth: { xs: "100px", sm: "152px" },
            width: {
              xs: "auto",
              sm: "152px",
            },

            height: { xs: "36px", sm: "42px" },

            borderRadius: "8px",

            background: activeTab === "lead_form" ? "#FFFFFF" : "transparent",

            color: "#000000",

            textTransform: "none",

            fontSize: { xs: "13px", sm: "16px", md: "18px" },

            fontWeight: 500,
            whiteSpace: "nowrap",
            px: { xs: 1, sm: 2 },

            boxShadow:
              activeTab === "lead_form"
                ? "0px 4px 10px rgba(0,0,0,0.12)"
                : "none",

            "&:hover": {
              background: "#fff",
            },
          }}
        >
          Lead Form
        </Button>

        {/* LEAD VIEW */}

        <Button
          startIcon={
            <VisibilityOutlinedIcon
              sx={{
                color: "#90D916",
                height: { xs: "18px", sm: "24px" },
                width: { xs: "18px", sm: "24px" },
              }}
            />
          }
          onClick={() => onTabChange("lead_view")}
          sx={{
            flex: { xs: 1, sm: "none" },
            minWidth: { xs: "100px", sm: "152px" },
            width: {
              xs: "auto",
              sm: "152px",
            },

            height: { xs: "36px", sm: "42px" },

            borderRadius: "8px",

            background: activeTab === "lead_view" ? "#FFFFFF" : "transparent",

            color: "#000000",

            textTransform: "none",

            fontSize: { xs: "13px", sm: "16px", md: "18px" },

            fontWeight: 500,
            whiteSpace: "nowrap",
            px: { xs: 1, sm: 2 },

            boxShadow:
              activeTab === "lead_view"
                ? "0px 4px 10px rgba(0,0,0,0.12)"
                : "none",

            "&:hover": {
              background: "#fff",
            },
          }}
        >
          Lead View
        </Button>
      </Box>
      <Snackbar
        open={showRestrictAlert}
        autoHideDuration={3000}
        onClose={() => setShowRestrictAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setShowRestrictAlert(false)}>
          Please submit the call status before leaving this page.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadTopSection;
