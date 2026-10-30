import { useEffect, useState } from "react";

import { Box, Grid, Typography, CircularProgress } from "@mui/material";

import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import PhoneDisabledOutlinedIcon from "@mui/icons-material/PhoneDisabledOutlined";

import { fetchOneLead } from "@/apps/telecalling/services/fetchOneLeadService";
import { fetchLeadCallHistory } from "@/apps/telecalling/services/callHistoryService";

// shared style for both scrollable cards — responsive height/padding
// so it doesn't feel oversized on small screens, scrollbar always
// visible (overflow: "scroll", not "auto") so the layout never
// shifts based on how much content is there.

const scrollableCardSx = {
  background: "#fff",
  border: "1px solid #5aed1a",
  borderRadius: "14px",
  p: { xs: "14px", sm: "20px", md: "32px" },
  height: { xs: "230px", sm: "220px", md: "200px" },
  overflowY: "scroll",

  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#90D916",
    borderRadius: "10px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "#7DC60E",
  },
  scrollbarWidth: "thin",
  scrollbarColor: "#90D916 transparent",
};

const SectionLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "14px",
      fontWeight: 700,
      color: "#000",
      mt: "16px",
      mb: "4px",
    }}
  >
    {children}
  </Typography>
);

const InfoRow = ({ label, value, last }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      gap: 2,
      py: "8px",
      borderBottom: last ? "none" : "1px solid #EFEFEF",
    }}
  >
    <Typography sx={{ fontSize: "13px", color: "#555" }}>{label}</Typography>
    <Typography
      sx={{
        fontSize: "13px",
        fontWeight: 600,
        color: "#000",
        textAlign: "right",
        wordBreak: "break-word",
      }}
    >
      {value || "-- -- --"}
    </Typography>
  </Box>
);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const LeadRowDetails = ({ leadId }) => {
  const [leadData, setLeadData] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const leadRes = await fetchOneLead(Number(leadId));
        if (!isMounted) return;
        setLeadData(leadRes?.data?.data?.[0] || null);

        const callRes = await fetchLeadCallHistory(leadId);
        if (!isMounted) return;
        setCallHistory(callRes?.data?.data || []);
      } catch (error) {
        if (isMounted) {
          setLeadData(null);
          setCallHistory([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (leadId) load();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 3,
          background: "#fff",
        }}
      >
        <CircularProgress size={22} />
      </Box>
    );
  }

  const remarksList = callHistory.filter(
    (item) => item.call_notes || item.retry_notes
  );

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
        background: "#F7F7F7",
        p: { xs: "10px", sm: "16px", md: "24px" },
        pb: { xs: "14px", sm: "20px" },
        borderBottom: "3px solid #E0E0E0",
      }}
    >
      <Grid container spacing={2} alignItems="flex-start">
        {/* ABOUT LEAD */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0, width: "100%" }}>
          <Box sx={scrollableCardSx}>
            <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>
              About Lead
            </Typography>

            {/* ALL REMARKS */}
            <SectionLabel>Remarks ({remarksList.length})</SectionLabel>

            {remarksList.length === 0 ? (
              <Typography sx={{ fontSize: "13px", color: "#999", py: "6px" }}>
                No remarks yet.
              </Typography>
            ) : (
              remarksList.map((item, index) => (
                <Box
                  key={item.id ?? index}
                  sx={{
                    py: "8px",
                    borderBottom:
                      index === remarksList.length - 1
                        ? "none"
                        : "1px solid #EFEFEF",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {item.connection_status === "Disconnected"
                      ? item.retry_notes
                      : item.call_notes}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "11.5px", color: "#888", mt: "2px" }}
                  >
                    {formatDate(item.called_at)}, {formatTime(item.called_at)}
                  </Typography>
                </Box>
              ))
            )}

            <SectionLabel>Other Details</SectionLabel>
            <InfoRow label="Lead Source" value={leadData?.lead_source} last />

            <SectionLabel>Alternative Number</SectionLabel>
            <InfoRow
              label="Alternative Mobile Number"
              value={leadData?.alternative_mobile}
              last
            />
          </Box>
        </Grid>

        {/* TIMELINE */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0, width: "100%" }}>
          <Box sx={scrollableCardSx}>
            <Typography sx={{ fontWeight: 700, fontSize: "15px", mb: "14px" }}>
              Timeline
            </Typography>

            {callHistory.length === 0 ? (
              <Typography sx={{ fontSize: "13px", color: "#e73535" }}>
                No calls logged yet for this lead.
              </Typography>
            ) : (
              callHistory.map((item, index) => {
                const isNotConnected =
                  item.connection_status === "Disconnected" ||
                  !item.connection_status;

                const hasNote = item.call_notes || item.retry_notes;

                return (
                  <Box
                    key={item.id ?? index}
                    sx={{
                      display: "flex",
                      gap: "10px",
                      pb: index === callHistory.length - 1 ? 0 : "18px",
                    }}
                  >
                    {/* DATE CHIP */}
                    <Box
                      sx={{
                        minWidth: "70px",
                        fontSize: "11px",
                        color: "#555",
                        background: "#F5F5F5",
                        borderRadius: "6px",
                        px: "8px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {formatDate(item.called_at)}
                    </Box>

                    {/* DOT + LINE */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: isNotConnected ? "#E11D1D" : "#22C55E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isNotConnected ? (
                          <PhoneDisabledOutlinedIcon
                            sx={{ color: "#fff", fontSize: "12px" }}
                          />
                        ) : (
                          <BorderColorOutlinedIcon
                            sx={{ color: "#fff", fontSize: "11px" }}
                          />
                        )}
                      </Box>

                      {index !== callHistory.length - 1 && (
                        <Box
                          sx={{
                            width: "2px",
                            flex: 1,
                            background: "#E0E0E0",
                            mt: "4px",
                          }}
                        />
                      )}
                    </Box>

                    {/* CONTENT */}
                    <Box sx={{ flex: 1, minWidth: 0, pt: "1px" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
                          {isNotConnected
                            ? "Not Connected"
                            : `Call History | ${item.connection_status}`}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "12px", color: "#888", ml: "auto" }}
                        >
                          {formatTime(item.called_at)}
                        </Typography>
                      </Box>

                      {hasNote && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            mt: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              fontSize: "11px",
                              fontWeight: 600,
                              background: isNotConnected
                                ? "#FDECEC"
                                : "#FFF3D6",
                              color: isNotConnected ? "#D91616" : "#B8860B",
                              borderRadius: "6px",
                              px: "8px",
                              py: "2px",
                            }}
                          >
                            {item.connection_status === "Disconnected"
                              ? item.retry_notes
                              : item.call_notes}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LeadRowDetails;
