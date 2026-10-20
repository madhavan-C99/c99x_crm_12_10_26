import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PhoneMissedIcon from "@mui/icons-material/PhoneMissed";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { getLeadDetail } from "@/apps/admin/services/leadService";

const LeadDetailModal = ({ open, onClose, lead }) => {
  const [liveLeadDetails, setLiveLeadDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !lead) {
      setLiveLeadDetails(null);
      return;
    }

    const fetchDeepDetails = async () => {
      try {
        setLoading(true);
        const targetId = lead.id || lead.lead_id;
        if (targetId) {
          const response = await getLeadDetail({ lead_id: targetId, id: targetId });
          const resData = response?.data?.data || response?.data?.result || response?.data;
          if (resData && typeof resData === "object") {
            setLiveLeadDetails(resData);
          }
        }
      } catch (err) {
        console.warn("getLeadDetail API error (using fallback template):", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeepDetails();
  }, [open, lead]);

  if (!lead) return null;

  // Merge clicked lead object with live API details (Live API takes priority)
  const activeData = liveLeadDetails ? { ...lead, ...liveLeadDetails } : lead;

  const getProp = (val) => {
    if (
      val === undefined ||
      val === null ||
      val === "null" ||
      val === "undefined" ||
      String(val).trim() === ""
    ) {
      return "-";
    }
    return String(val).trim();
  };

  const rawName =
    activeData.full_name ||
    activeData.name ||
    `${activeData.first_name || ""} ${activeData.last_name || ""}`.trim();
  const name = getProp(rawName);
  const phone = getProp(
    activeData.mobile_no ||
      activeData.phone_no ||
      activeData.phone ||
      activeData.contact
  );
  const email = getProp(activeData.email_id || activeData.email || activeData.mail || activeData.email_address);
  const campaign = getProp(
    activeData.campaign || activeData.campaign_name || activeData.campaign_title
  );
  const source = getProp(
    activeData.source || activeData.lead_source || activeData.source_name
  );
  const assignedTo = getProp(
    activeData.assigned_to || activeData.user_name || activeData.telecaller || activeData.assigned_user || activeData.counselor
  );
  const createdDate = getProp(
    activeData.created_at || activeData.created_date || activeData.created || activeData.date || activeData.created_on
  );
  const coursePlan = getProp(
    activeData.course_plan || activeData.plan_name || activeData.plan || activeData.course_plan_name
  );
  const course = getProp(
    activeData.course || activeData.course_name || activeData.course_title || activeData.interested_course
  );
  const lastContacted = getProp(
    activeData.last_contacted || activeData.last_call_date || activeData.last_contacted_date || activeData.last_call
  );
  const nextFollowup = getProp(
    activeData.next_follow_up || activeData.follow_up_date || activeData.next_followup || activeData.followup_date || activeData.next_follow_up_date
  );
  const latestOutcome = getProp(
    activeData.last_conversation_outcome ||
      activeData.outcome ||
      activeData.remarks ||
      activeData.remark ||
      activeData.last_remark ||
      activeData.notes ||
      activeData.note
  );
  const stage = getProp(
    activeData.stage || activeData.pipeline_stage || activeData.stage_name || activeData.status
  );

  // Dynamic timeline history array from live API
  const timelineEvents = Array.isArray(
    activeData.timeline ||
    activeData.activities ||
    activeData.history ||
    activeData.call_logs
  )
    ? (activeData.timeline || activeData.activities || activeData.history || activeData.call_logs)
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      scroll="paper"
      sx={{
        "& .MuiDialog-container": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent !important",
        },
        "& .MuiPaper-root": {
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          boxShadow: "none !important",
          border: "none !important",
          outline: "none !important",
        },
        "& .MuiDialog-paper": {
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          boxShadow: "none !important",
          border: "none !important",
          outline: "none !important",
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 0,
          width: "1150px",
          maxWidth: "92vw",
          maxHeight: "92vh",
          margin: 0,
          backgroundColor: "transparent !important",
          backgroundImage: "none !important",
          boxShadow: "none !important",
          border: "none !important",
          overflow: "visible",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          overflow: "visible",
          backgroundColor: "transparent",
          backgroundImage: "none",
          boxShadow: "none",
        }}
      >
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1, mb: 1, backgroundColor: "transparent" }}>
            <CircularProgress size={24} sx={{ color: "#84CC16" }} />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start",
            gap: 2.5,
            backgroundColor: "transparent",
            backgroundImage: "none",
            boxShadow: "none",
          }}
        >
          {/* LEFT FLOATING WHITE CARD: EXACT FIGMA LEAD DETAILS */}
          <Box
            sx={{
              width: "560px",
              maxWidth: "560px",
              flexShrink: 0,
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              p: 1.4,
              backgroundColor: "#FFFFFF",
              boxSizing: "border-box",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header: Name + Stage Badge */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}
            >
              <Typography
                sx={{ fontSize: "20px", fontWeight: 700, color: "#000000" }}
              >
                {name}
              </Typography>
              <Chip
                size="small"
                label={stage}
                sx={{
                  backgroundColor: "#DDD6FE",
                  color: "#6D28D9",
                  fontWeight: 700,
                  fontSize: "11px",
                  height: "22px",
                  borderRadius: "12px",
                  px: 0.5,
                }}
              />
            </Box>

            {/* 2-Column Info Grid matching exact screenshot font colors & weights */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                rowGap: 2.5,
                mb: 3,
              }}
            >
              {/* Row 1 */}
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pr: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Phone:{" "}
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {phone}
                  </span>
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pl: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Created:{" "}
                  <span style={{ color: "#333333", fontWeight: 500 }}>
                    {createdDate}
                  </span>
                </Typography>
              </Box>

              {/* Row 2 */}
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pr: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                    wordBreak: "break-word",
                  }}
                >
                  Email:{" "}
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {email}
                  </span>
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pl: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Course Plan:{" "}
                  <span style={{ color: "#555555", fontWeight: 500 }}>
                    {coursePlan}
                  </span>
                </Typography>
              </Box>

              {/* Row 3 */}
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pr: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Campaign:{" "}
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {campaign}
                  </span>
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pl: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Course:{" "}
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {course}
                  </span>
                </Typography>
              </Box>

              {/* Row 4 */}
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pr: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Source:{" "}
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {source}
                  </span>
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pl: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Last Conatcted:{" "}
                  <span style={{ color: "#333333", fontWeight: 500 }}>
                    {lastContacted}
                  </span>
                </Typography>
              </Box>

              {/* Row 5 */}
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pr: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Assigned To:{" "}
                  <span style={{ color: "#000000", fontWeight: 700 }}>
                    {assignedTo}
                  </span>
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: "0 0 50%",
                  maxWidth: "50%",
                  boxSizing: "border-box",
                  pl: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: "24px",
                  }}
                >
                  Next Follow-up:{" "}
                  <span style={{ color: "#333333", fontWeight: 500 }}>
                    {nextFollowup}
                  </span>
                </Typography>
              </Box>
            </Box>

            {/* Latest Conversation Outcome */}
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#000000",
                  mb: 0.5,
                }}
              >
                Latest Conversation Outcome:
              </Typography>
              <Typography sx={{ fontSize: "13.5px", color: "#666666" }}>
                {latestOutcome}
              </Typography>
            </Box>

            {/* Bottom Light Divider Line */}
            <Divider sx={{ borderColor: "#E5E7EB", mt: "auto" }} />
          </Box>

          {/* RIGHT FLOATING WHITE CARD: EXACT FIGMA TIMELINE HISTORY */}
          <Box
            sx={{
              width: "560px",
              maxWidth: "560px",
              minHeight: "560px",
              flexShrink: 0,
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              p: 2.2,
              backgroundColor: "#FFFFFF",
              boxSizing: "border-box",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Title + Close Icon */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2.5,
              }}
            >
              <Typography
                sx={{ fontSize: "18px", fontWeight: 700, color: "#000000" }}
              >
                Timeline
              </Typography>
              <IconButton
                onClick={onClose}
                size="small"
                sx={{ color: "#71717A", p: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Timeline Items Stream */}
            <Box
              sx={{
                maxHeight: "480px",
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": { width: "5px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#CBD5E1",
                  borderRadius: "4px",
                },
              }}
            >
              {timelineEvents.length === 0 ? (
                <Box
                  sx={{
                    py: 8,
                    px: 3,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94A3B8",
                  }}
                >
                  <PhoneInTalkIcon sx={{ fontSize: 38, color: "#CBD5E1", mb: 1.5 }} />
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#64748B", mb: 0.5 }}>
                    No Activity Logs Yet
                  </Typography>
                  <Typography sx={{ fontSize: "12.5px", color: "#94A3B8" }}>
                    Call recordings and follow-up timeline events will appear here.
                  </Typography>
                </Box>
              ) : (
                timelineEvents.map((evt, index) => {
                  const evtDate = evt.date || evt.created_at || evt.time || "-";
                  const evtTitle = evt.title || evt.action || evt.status_name || "Lead Activity";
                  const evtSubtitle = evt.subtitle || evt.sub_stage || evt.outcome || "";
                  const evtTime = evt.time || evt.created_time || "";
                  const evtRemark = evt.remark || evt.remarks || evt.note || "";
                  const evtBadges = evt.badges || [];
                  const evtType = (evt.type || evt.action_type || "").toLowerCase();
                  const hasAudio = evt.hasAudio || evt.audio_url;
                  const audioDuration = evt.audioDuration || evt.audio_duration || "0:00";

                  const iconBg =
                    evt.iconBg ||
                    (evtType.includes("not") || evtType.includes("miss")
                      ? "#EF4444"
                      : evtType.includes("progress") || evtType.includes("blue")
                      ? "#2563EB"
                      : evtType.includes("create")
                      ? "#84CC16"
                      : "#22C55E");

                  return (
                    <Box
                      key={evt.id || index}
                      sx={{
                        display: "flex",
                        gap: 2,
                        mb: 2.5,
                        position: "relative",
                      }}
                    >
                      {/* Date Column */}
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#666666",
                          width: "80px",
                          flexShrink: 0,
                          pt: "2px",
                        }}
                      >
                        {evtDate}
                      </Typography>

                      {/* Timeline Node Icon & Vertical Line */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          position: "relative",
                        }}
                      >
                        <Box
                          sx={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            backgroundColor: iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            zIndex: 1,
                          }}
                        >
                          {evtType.includes("not") ? (
                            <PhoneMissedIcon
                              sx={{ fontSize: 15, color: "#FFFFFF" }}
                            />
                          ) : evtType.includes("create") ? (
                            <PersonAddIcon
                              sx={{ fontSize: 15, color: "#FFFFFF" }}
                            />
                          ) : (
                            <PhoneInTalkIcon
                              sx={{ fontSize: 15, color: "#FFFFFF" }}
                            />
                          )}
                        </Box>
                        {index < timelineEvents.length - 1 && (
                          <Box
                            sx={{
                              width: "2px",
                              flex: 1,
                              backgroundColor: "#E5E7EB",
                              mt: 0.5,
                              position: "absolute",
                              top: "26px",
                              bottom: "-20px",
                            }}
                          />
                        )}
                      </Box>

                      {/* Content Card */}
                      <Box sx={{ flex: 1, pt: "1px" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "13.5px",
                              fontWeight: 700,
                              color: "#333333",
                            }}
                          >
                            {evtTitle}
                          </Typography>
                          {evtSubtitle && (
                            <Typography
                              sx={{ fontSize: "12.5px", color: "#666666" }}
                            >
                              | {evtSubtitle}
                            </Typography>
                          )}
                          <Typography
                            sx={{
                              fontSize: "11.5px",
                              color: "#999999",
                              ml: "auto",
                            }}
                          >
                            {evtTime}
                          </Typography>
                        </Box>

                        {/* Badges */}
                        {evtBadges.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.8,
                              my: 0.8,
                              flexWrap: "wrap",
                            }}
                          >
                            {evtBadges.map((b, i) => (
                              <Chip
                                key={i}
                                size="small"
                                label={typeof b === "string" ? b : b.label}
                                sx={{
                                  height: "22px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  backgroundColor: b.color || "#F1F5F9",
                                  color: b.textColor || "#475569",
                                  borderRadius: "4px",
                                }}
                              />
                            ))}
                          </Box>
                        )}

                        {/* Remark */}
                        {evtRemark && (
                          <Box
                            sx={{
                              backgroundColor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              p: 1.2,
                              mt: 0.8,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "11.5px",
                                fontWeight: 700,
                                color: "#333333",
                                mb: 0.2,
                              }}
                            >
                              Remark
                            </Typography>
                            <Typography
                              sx={{ fontSize: "12px", color: "#666666" }}
                            >
                              {evtRemark}
                            </Typography>
                          </Box>
                        )}

                        {/* Audio Player Bar */}
                        {hasAudio && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              backgroundColor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "20px",
                              px: 1.5,
                              py: 0.4,
                              mt: 1,
                              width: "fit-content",
                            }}
                          >
                            <IconButton
                              size="small"
                              sx={{ p: 0.2, color: "#2563EB" }}
                            >
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                            <Box
                              sx={{
                                width: "110px",
                                height: "4px",
                                backgroundColor: "#CBD5E1",
                                borderRadius: "2px",
                                position: "relative",
                              }}
                            >
                              <Box
                                sx={{
                                  width: "30%",
                                  height: "100%",
                                  backgroundColor: "#2563EB",
                                  borderRadius: "2px",
                                }}
                              />
                            </Box>
                            <Typography
                              sx={{
                                fontSize: "11px",
                                color: "#666666",
                                fontWeight: 600,
                              }}
                            >
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
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailModal;
