import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, IconButton, Tooltip } from "@mui/material";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import PhoneDisabledOutlinedIcon from "@mui/icons-material/PhoneDisabledOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CloseIcon from "@mui/icons-material/Close";
import { getLeadDetail } from "@/apps/admin/services/leadService";
import { useAuth } from "@/shared/context/AuthContext";

// Shared style for both scrollable cards matching telecalling LeadRowDetails
const scrollableCardSx = {
  background: "#fff",
  border: "1px solid #5aed1a",
  borderRadius: "14px",
  p: { xs: "16px", sm: "20px", md: "24px" },
  height: { xs: "250px", sm: "230px", md: "220px" },
  overflowY: "scroll",
  boxSizing: "border-box",

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
  scrollbarWidth: "thin", // Firefox
  scrollbarColor: "#90D916 transparent", // Firefox
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

const AdminLeadRowDetails = ({ row, onClose }) => {
  const { hasPermission } = useAuth();
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!row) return;
      if (!hasPermission("api_fetch_lead_details_admin")) {
        console.warn("Permission denied: api_fetch_lead_details_admin");
        if (isMounted) {
          setDetailData(row);
          setLoading(false);
        }
        return;
      }
      const targetId = row.id || row.lead_id;
      try {
        setLoading(true);
        const res = await getLeadDetail({ lead_id: targetId, id: targetId });
        const raw = res?.data?.data || res?.data;
        const leadInfo = raw?.lead_info || (Array.isArray(raw) ? raw[0] : raw) || {};
        const timeline = raw?.timeline || raw?.call_logs || raw?.activities || raw?.history || [];

        if (isMounted) {
          setDetailData({ ...row, ...leadInfo, timeline });
        }
      } catch (err) {
        console.warn("Failed to fetch expandable lead details, using row data:", err);
        if (isMounted) setDetailData(row);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [row]);

  const activeData = detailData || row || {};

  const capitalize = (str) => {
    if (!str) return "";
    return String(str)
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getProp = (val, fallback = "-- -- --") => {
    if (val === undefined || val === null || val === "" || val === "null" || val === "-") return fallback;
    return String(val);
  };

  const name = capitalize(getProp(activeData.full_name || activeData.name || activeData.student_name || row?.full_name || row?.name, "Lead Details"));
  const phone = getProp(activeData.mobile_no || activeData.phone || activeData.contact || row?.mobile_no);
  const email = getProp(activeData.email || activeData.email_id || row?.email || row?.email_id);
  const course = capitalize(getProp(activeData.course || activeData.course_name || activeData.interested_course || row?.course || row?.course_name));
  const coursePlan = capitalize(getProp(activeData.course_plan || activeData.plan || row?.course_plan || row?.plan));
  const altPhone = getProp(activeData.alternative_mobile || activeData.alt_phone || activeData.alt_mobile || row?.alternative_mobile);
  const source = capitalize(getProp(activeData.source || activeData.lead_source || activeData.source_type || row?.source || row?.lead_source));
  const campaign = capitalize(getProp(activeData.campaign || activeData.campaign_name || row?.campaign || row?.campaign_name));
  const assignedTo = capitalize(getProp(activeData.assigned_to || activeData.user_name || activeData.telecaller || row?.assigned_to));
  const createdDate = getProp(activeData.created || activeData.created_at || activeData.enquiry_date || row?.created || row?.created_at);
  const lastContacted = getProp(activeData.last_contacted || activeData.last_call_date || row?.last_contacted);
  const nextFollowup = getProp(activeData.next_followup || activeData.next_follow_up || activeData.follow_up_date || row?.next_followup || row?.next_follow_up);
  const stage = capitalize(getProp(activeData.stage || activeData.pipeline_stage || activeData.stage_name || activeData.status || row?.stage, "New Lead"));

  // Dynamic timeline history array from live API
  const rawTimeline =
    activeData.timeline ||
    activeData.activities ||
    activeData.history ||
    activeData.call_logs ||
    [];

  const timelineEvents = Array.isArray(rawTimeline) ? rawTimeline : [];
  const totalAttempts = getProp(activeData.total_attempts || activeData.attempts_count || (timelineEvents.length ? `${timelineEvents.length} Calls done` : "0 Calls done"));

  // Extract all remarks list
  const remarksList = timelineEvents.filter(
    (item) => item.remark || item.remarks || item.note || item.call_notes || item.retry_notes
  );

  return (
    <Box
      sx={{
        background: "#F7F7F7",
        p: { xs: "10px", sm: "16px" },
        pb: { xs: "14px", sm: "20px" },
        borderBottom: "3px solid #E0E0E0",
        position: "sticky",
        left: 0,
        width: {
          xs: "94vw",
          sm: "90vw",
          md: "calc(100vw - 110px)",
          lg: "calc(100vw - 130px)",
        },
        maxWidth: "1380px",
        boxSizing: "border-box",
        zIndex: 2,
      }}
    >
      {/* Close (X) Button */}
      {onClose && (
        <Tooltip title="Close Details" arrow placement="left">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            sx={{
              position: "absolute",
              top: "8px",
              right: "12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              color: "#475569",
              width: "28px",
              height: "28px",
              "&:hover": {
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                borderColor: "#DC2626",
              },
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.08)",
              zIndex: 10,
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3, background: "#fff", borderRadius: "14px" }}>
          <CircularProgress size={22} sx={{ color: "#90D916" }} />
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
              gap: 2,
              alignItems: "flex-start",
            }}
          >
            {/* ABOUT LEAD (Matching Telecalling LeadRowDetails) */}
            <Box sx={scrollableCardSx}>
              <Typography sx={{ fontWeight: 700, fontSize: "15px", color: "#000" }}>
                About Lead
              </Typography>

              {/* ALL REMARKS */}
              <SectionLabel>Remarks ({remarksList.length})</SectionLabel>
              {remarksList.length === 0 ? (
                <Typography sx={{ fontSize: "13px", color: "#999", py: "6px" }}>
                  No remarks yet.
                </Typography>
              ) : (
                remarksList.map((item, index) => {
                  const rDate = item.called_at || item.created_at || item.date || item.time;
                  const rText =
                    item.remark ||
                    item.remarks ||
                    item.call_notes ||
                    item.retry_notes ||
                    item.note ||
                    "";

                  return (
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
                        {rText}
                      </Typography>
                      {rDate && (
                        <Typography sx={{ fontSize: "11.5px", color: "#888", mt: "2px" }}>
                          {formatDate(rDate)}, {formatTime(rDate)}
                        </Typography>
                      )}
                    </Box>
                  );
                })
              )}

              <SectionLabel>Lead Information</SectionLabel>
              <InfoRow label="Student Name" value={name} />
              <InfoRow label="Mobile Number" value={phone} />
              <InfoRow label="Email ID" value={email} />
              <InfoRow label="Alternative Mobile" value={altPhone} />
              <InfoRow label="Lead Source" value={source} />
              <InfoRow label="Campaign Name" value={campaign} />
              <InfoRow label="Course" value={course} />
              <InfoRow label="Course Plan" value={coursePlan} />
              <InfoRow label="Assigned Telecaller" value={assignedTo} />
              <InfoRow label="Pipeline Stage" value={stage} />
              <InfoRow label="Total Attempts" value={totalAttempts} />
              <InfoRow label="Created Date" value={createdDate} />
              <InfoRow label="Last Contacted" value={lastContacted} />
              <InfoRow label="Next Follow-up" value={nextFollowup} last />
            </Box>

            {/* TIMELINE (Matching Telecalling LeadRowDetails) */}
            <Box sx={scrollableCardSx}>
              <Typography sx={{ fontWeight: 700, fontSize: "15px", mb: "14px", color: "#000" }}>
                Timeline
              </Typography>

              {timelineEvents.length === 0 ? (
                <Typography sx={{ fontSize: "13px", color: "#e73535" }}>
                  No calls logged yet for this lead.
                </Typography>
              ) : (
                timelineEvents.map((item, index) => {
                  const isNotConnected =
                    item.connection_status === "Disconnected" ||
                    (item.type && item.type.toLowerCase().includes("not")) ||
                    (item.action && item.action.toLowerCase().includes("not")) ||
                    (item.title && item.title.toLowerCase().includes("not"));

                  const evtDate = item.called_at || item.created_at || item.date || item.time;
                  const evtTitle =
                    item.title ||
                    item.action ||
                    (isNotConnected
                      ? "Not Connected"
                      : `Call History | ${item.connection_status || "Connected"}`);
                  const evtBadges = item.badges || (item.name ? [item.name] : []);
                  const evtRemark =
                    item.remark ||
                    item.remarks ||
                    item.call_notes ||
                    item.retry_notes ||
                    item.note ||
                    "";
                  const hasAudio = item.hasAudio || item.audio_url;
                  const audioDuration = item.audioDuration || item.audio_duration || "0:00";

                  return (
                    <Box
                      key={item.id ?? index}
                      sx={{
                        display: "flex",
                        gap: "10px",
                        pb: index === timelineEvents.length - 1 ? 0 : "18px",
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
                        {formatDate(evtDate)}
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

                        {index !== timelineEvents.length - 1 && (
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
                          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#000" }}>
                            {evtTitle}
                          </Typography>
                          <Typography sx={{ fontSize: "12px", color: "#888", ml: "auto" }}>
                            {formatTime(evtDate)}
                          </Typography>
                        </Box>

                        {/* BADGES */}
                        {evtBadges.length > 0 && (
                          <Box sx={{ display: "flex", gap: 1, mt: "6px", flexWrap: "wrap" }}>
                            {evtBadges.map((badge, bIdx) => {
                              const bLabel = typeof badge === "string" ? badge : badge.label;
                              return (
                                <Box
                                  key={bIdx}
                                  sx={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    background: isNotConnected ? "#FDECEC" : "#FFF3D6",
                                    color: isNotConnected ? "#D91616" : "#B8860B",
                                    borderRadius: "4px",
                                    px: "8px",
                                    py: "2px",
                                  }}
                                >
                                  {bLabel}
                                </Box>
                              );
                            })}
                          </Box>
                        )}

                        {/* REMARK / NOTE */}
                        {evtRemark && (
                          <Typography sx={{ fontSize: "12px", color: "#666", mt: "4px" }}>
                            {evtRemark}
                          </Typography>
                        )}

                        {/* AUDIO PLAYER BAR */}
                        {hasAudio && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              backgroundColor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "20px",
                              px: 1.2,
                              py: 0.3,
                              mt: 0.8,
                              width: "fit-content",
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => setPlayingAudioId((prev) => (prev === (item.id || index) ? null : (item.id || index)))}
                              sx={{ p: 0.2, color: "#2563EB" }}
                            >
                              {playingAudioId === (item.id || index) ? (
                                <PauseIcon fontSize="small" />
                              ) : (
                                <PlayArrowIcon fontSize="small" />
                              )}
                            </IconButton>
                            <Box
                              sx={{
                                width: "90px",
                                height: "4px",
                                backgroundColor: "#CBD5E1",
                                borderRadius: "2px",
                                position: "relative",
                              }}
                            >
                              <Box
                                sx={{
                                  width: playingAudioId === (item.id || index) ? "60%" : "30%",
                                  height: "100%",
                                  backgroundColor: "#2563EB",
                                  borderRadius: "2px",
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: "10.5px", color: "#64748B", fontWeight: 600 }}>
                              {audioDuration}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdminLeadRowDetails;
