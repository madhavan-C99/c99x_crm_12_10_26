import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Skeleton, IconButton, Tooltip } from "@mui/material";
import BorderColorOutlinedIcon from "@mui/icons-material/BorderColorOutlined";
import PhoneDisabledOutlinedIcon from "@mui/icons-material/PhoneDisabledOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { getLeadDetail } from "@/apps/admin/services/leadService";
import { useAuth } from "@/shared/context/AuthContext";

// Shared style for both scrollable cards
const scrollableCardSx = {
  background: "#fff",
  border: "1px solid #5aed1a",
  borderRadius: "14px",
  p: { xs: "14px", sm: "18px", md: "20px" },
  height: { xs: "280px", sm: "260px", md: "250px" },
  overflowY: "auto",
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
  scrollbarWidth: "thin",
  scrollbarColor: "#90D916 transparent",
};

const SectionLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "13.5px",
      fontWeight: 700,
      color: "#111827",
      mt: "12px",
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
      py: "7px",
      borderBottom: last ? "none" : "1px solid #EFEFEF",
    }}
  >
    <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>{label}</Typography>
    <Typography
      sx={{
        fontSize: "13px",
        fontWeight: 600,
        color: "#111827",
        textAlign: "right",
        wordBreak: "break-word",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

// Format duration from seconds to MM:SS
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const AdminLeadRowDetails = ({ row, onClose }) => {
  const { hasPermission } = useAuth();
  const [leadInfo, setLeadInfo] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!row) return;

      if (!hasPermission("api_fetch_lead_details_admin")) {
        console.warn("Permission denied: api_fetch_lead_details_admin");
        if (isMounted) {
          setLeadInfo(row);
          setLoading(false);
        }
        return;
      }

      const targetId = row.id || row.lead_id;
      try {
        setLoading(true);
        const res = await getLeadDetail({ lead_id: targetId, id: targetId });
        const resData = res?.data?.data || res?.data;

        if (isMounted) {
          if (resData?.lead_info) {
            setLeadInfo(resData.lead_info);
            setTimeline(
              Array.isArray(resData.timeline) ? resData.timeline : [],
            );
          } else {
            setLeadInfo(resData || row);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch lead details:", err);
        if (isMounted) setLeadInfo(row);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [row]);

  // Audio Play / Pause handler
  const handleToggleAudio = (id, recordingUrl) => {
    if (!recordingUrl) return;

    if (playingAudioId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(recordingUrl);
      audioRef.current = audio;
      audio.play();
      setPlayingAudioId(id);

      audio.onended = () => {
        setPlayingAudioId(null);
      };
    }
  };

  const data = leadInfo || {};
  const remarksList = timeline.filter(
    (item) => item.remark && item.remark.trim() !== "",
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        background: "#F7F7F7",
        p: { xs: "12px", sm: "16px", md: "20px" },
        pb: { xs: "14px", sm: "20px" },
        borderBottom: "3px solid #E0E0E0",
      }}
    >
      {/* Top Header Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          px: 0.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}
          >
            {data.full_name || "-"}
          </Typography>
          {data.mobile_no && (
            <Typography
              sx={{ fontSize: "13px", color: "#6B7280", fontWeight: 500 }}
            >
              • {data.mobile_no}
            </Typography>
          )}
          {data.stage && (
            <Box
              sx={{
                backgroundColor: "#E0F2FE",
                color: "#0369A1",
                fontSize: "11.5px",
                fontWeight: 600,
                px: 1.2,
                py: 0.3,
                borderRadius: "12px",
              }}
            >
              {data.stage}
            </Box>
          )}
        </Box>

        {onClose && (
          <Tooltip title="Close Details" arrow placement="left">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              sx={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #D1D5DB",
                color: "#475569",
                width: "30px",
                height: "30px",
                "&:hover": {
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  borderColor: "#DC2626",
                },
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                cursor: "pointer",
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            p: 2,
            background: "#fff",
            borderRadius: "14px",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Skeleton
              variant="rectangular"
              width={180}
              height={22}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width="90%"
              height={18}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width="70%"
              height={18}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width="80%"
              height={18}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Skeleton
              variant="rectangular"
              width={180}
              height={22}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width="85%"
              height={18}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width="60%"
              height={18}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            alignItems: "stretch",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* ABOUT LEAD */}
          <Box sx={scrollableCardSx}>
            <Typography
              sx={{ fontWeight: 700, fontSize: "15px", color: "#000", mb: 0.5 }}
            >
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
                  key={item.id || index}
                  sx={{
                    py: "8px",
                    borderBottom:
                      index === remarksList.length - 1
                        ? "none"
                        : "1px solid #EFEFEF",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {item.remark}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "11.5px", color: "#888", mt: "2px" }}
                  >
                    {item.date} {item.time}{" "}
                    {item.created_by ? `• by ${item.created_by}` : ""}
                  </Typography>
                </Box>
              ))
            )}

            <SectionLabel>Lead Information</SectionLabel>
            <InfoRow label="Student Name" value={data.full_name} />
            <InfoRow label="Mobile Number" value={data.mobile_no} />
            <InfoRow label="Email ID" value={data.email} />
            <InfoRow
              label="Alternative Mobile"
              value={data.alternative_mobile}
            />
            <InfoRow label="Location" value={data.location} />
            <InfoRow label="Passed Out Year" value={data.passed_out_year} />
            <InfoRow label="Experience" value={data.experience} />
            <InfoRow label="Pipeline" value={data.pipeline} />
            <InfoRow label="Campaign Name" value={data.campaign} />
            <InfoRow label="Lead Source" value={data.source} />
            <InfoRow label="Course" value={data.course} />
            <InfoRow label="Course Plan" value={data.course_plan} />
            <InfoRow label="Assigned Telecaller" value={data.assigned_to} />
            <InfoRow label="Pipeline Stage" value={data.stage} />
            <InfoRow
              label="Amount"
              value={
                data.amount !== undefined
                  ? `₹${Number(data.amount).toLocaleString("en-IN")}`
                  : "-"
              }
            />
            <InfoRow
              label="Pending Amount"
              value={
                data.pending_amount !== undefined
                  ? `₹${Number(data.pending_amount).toLocaleString("en-IN")}`
                  : "-"
              }
            />
            <InfoRow label="Created Date" value={data.created} />
            <InfoRow label="Last Contacted" value={data.last_contacted} />
            <InfoRow label="Next Follow-up" value={data.next_followup} last />
          </Box>

          {/* TIMELINE */}
          <Box sx={scrollableCardSx}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "15px",
                mb: "14px",
                color: "#000",
              }}
            >
              Timeline
            </Typography>

            {timeline.length === 0 ? (
              <Typography sx={{ fontSize: "13px", color: "#999" }}>
                No timeline events logged yet for this lead.
              </Typography>
            ) : (
              timeline.map((item, index) => {
                const isCreated = item.type === "created";
                const isDisconnected =
                  item.title?.toLowerCase().includes("not connected") ||
                  item.title?.toLowerCase().includes("disconnected");

                return (
                  <Box
                    key={item.id || index}
                    sx={{
                      display: "flex",
                      gap: "10px",
                      pb: index === timeline.length - 1 ? 0 : "18px",
                    }}
                  >
                    {/* DATE CHIP */}
                    <Box
                      sx={{
                        minWidth: "75px",
                        fontSize: "11px",
                        color: "#555",
                        background: "#F5F5F5",
                        borderRadius: "6px",
                        px: "8px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.date || "-"}
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
                          background: isCreated
                            ? "#3B82F6"
                            : isDisconnected
                              ? "#E11D1D"
                              : "#22C55E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isCreated ? (
                          <AddCircleOutlinedIcon
                            sx={{ color: "#fff", fontSize: "13px" }}
                          />
                        ) : isDisconnected ? (
                          <PhoneDisabledOutlinedIcon
                            sx={{ color: "#fff", fontSize: "12px" }}
                          />
                        ) : (
                          <BorderColorOutlinedIcon
                            sx={{ color: "#fff", fontSize: "11px" }}
                          />
                        )}
                      </Box>

                      {index !== timeline.length - 1 && (
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
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#000",
                          }}
                        >
                          {item.title}
                        </Typography>
                        {item.time && (
                          <Typography
                            sx={{ fontSize: "12px", color: "#888", ml: "auto" }}
                          >
                            {item.time}
                          </Typography>
                        )}
                      </Box>

                      {/* BADGES: stage_tag & sub_tag */}
                      {(item.stage_tag || item.sub_tag) && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            mt: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {item.stage_tag && (
                            <Box
                              sx={{
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "#E0F2FE",
                                color: "#0369A1",
                                borderRadius: "4px",
                                px: "8px",
                                py: "2px",
                              }}
                            >
                              {item.stage_tag}
                            </Box>
                          )}
                          {item.sub_tag && (
                            <Box
                              sx={{
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "#FEF3C7",
                                color: "#B45309",
                                borderRadius: "4px",
                                px: "8px",
                                py: "2px",
                              }}
                            >
                              {item.sub_tag}
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* REMARK / NOTE */}
                      {item.remark && (
                        <Typography
                          sx={{ fontSize: "12px", color: "#666", mt: "4px" }}
                        >
                          {item.remark}
                        </Typography>
                      )}

                      {/* CREATED BY */}
                      {item.created_by && (
                        <Typography
                          sx={{ fontSize: "11px", color: "#9CA3AF", mt: "2px" }}
                        >
                          by {item.created_by}
                        </Typography>
                      )}

                      {/* AUDIO PLAYER BAR */}
                      {item.recording_url && (
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
                            onClick={() =>
                              handleToggleAudio(
                                item.id || index,
                                item.recording_url,
                              )
                            }
                            sx={{ p: 0.2, color: "#2563EB" }}
                          >
                            {playingAudioId === (item.id || index) ? (
                              <PauseIcon fontSize="small" />
                            ) : (
                              <PlayArrowIcon fontSize="small" />
                            )}
                          </IconButton>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "#64748B",
                              fontWeight: 600,
                            }}
                          >
                            {formatDuration(item.duration_seconds)}
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
      )}
    </Box>
  );
};

export default AdminLeadRowDetails;
