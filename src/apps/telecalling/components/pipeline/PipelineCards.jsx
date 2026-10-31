import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { Box, Chip, Typography, Skeleton } from "@mui/material";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import { useNavigate } from "react-router-dom";
import { getPipelinePageData } from "../../services/pipelinePageService";

const priorityStyles = {
  hot: {
    border: "1px solid #FF4D4F",
    color: "#FF4D4F",
    background: "#FFF1F0",
  },
  prospective: {
    border: "1px solid #FF4D4F",
    color: "#FF4D4F",
    background: "#FFF1F0",
  },
  warm: {
    border: "1px solid #FA8C16",
    color: "#FA8C16",
    background: "#FFF7E6",
  },
  interested: {
    border: "1px solid #FA8C16",
    color: "#FA8C16",
    background: "#FFF7E6",
  },
  cold: {
    border: "1px solid #0205C8",
    color: "#0205C8",
    background: "#CFEEFE",
  },
  just_follow_up: {
    border: "1px solid #0205C8",
    color: "#0205C8",
    background: "#CFEEFE",
  },
  "just follow-up": {
    border: "1px solid #0205C8",
    color: "#0205C8",
    background: "#CFEEFE",
  },
  new: {
    border: "1px solid #0205C8",
    color: "#FFFFFF",
    background: "#0205C8",
  },
};

const getPriorityChipStyle = (priority, priorityColor) => {
  if (priorityColor) {
    return {
      border: `1px solid ${priorityColor}`,
      color: priorityColor,
      background: `${priorityColor}18`,
    };
  }
  const key = priority?.toLowerCase()?.replace(/\s+/g, "_");
  if (priorityStyles[key]) {
    return priorityStyles[key];
  }
  return {
    border: "1px solid #0205C8",
    color: "#0205C8",
    background: "#CFEEFE",
  };
};


const InfoRow = ({ icon, children }) => (
  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
    {icon}
    <Typography sx={{ fontSize: "14px" }}>{children}</Typography>
  </Box>
);

const iconSx = { height: "17px", width: "17px" };


const PipelineCards = ({ payload, refresh, onDataLoaded }) => {
  const navigate = useNavigate();

  const handleLeadClick = (id) => {
    const activeCallLeadId = localStorage.getItem("activeCallLeadId");

    if (activeCallLeadId && String(activeCallLeadId) !== String(id)) {
      navigate(`/crm.c99x.in/telecalling/lead-details/${activeCallLeadId}`);
      return;
    }
    localStorage.setItem("last_pipeline_path", "/crm.c99x.in/telecalling/pipeline");
    localStorage.setItem("lead_return_path", "/crm.c99x.in/telecalling/pipeline");
    navigate(`/crm.c99x.in/telecalling/lead-details/${id}`);
  };

  const [stages, setStages] = useState([]);
  const [pipelineData, setPipelineData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  const [expandedStages, setExpandedStages] = useState({});

  useEffect(() => {
    fetchPipelineCardData(payload);
  }, [payload, refresh]);

  const fetchPipelineCardData = async (filterPayload) => {
    try {
      setLoading(true);

      const savedPipeline = sessionStorage.getItem(
        "telecalling_pipeline_selected_pipeline"
      );
      const finalPayload = {
        ...filterPayload,
        pipeline_id:
          filterPayload?.pipeline_id !== undefined
            ? filterPayload.pipeline_id
            : savedPipeline
            ? Number(savedPipeline)
            : 0,
      };

      const response = await getPipelinePageData(finalPayload);
      const raw = response?.data?.data?.[0];
      const resData = Array.isArray(raw?.pipeline_data) ? raw.pipeline_data[0] : raw;

      if (resData) {
        setStages(resData.stages || []);
        setPipelineData(resData.pipeline_data || {});
        onDataLoaded?.(resData.stages || []);
      } else {
        setStages([]);
        setPipelineData({});
        onDataLoaded?.([]);
      }
    } catch (error) {
      console.error("Error fetching pipeline card data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (stageId) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Build dynamic columns list from stages & their expanded tags
  const columns = [];
  stages.forEach((stage, stageIndex) => {
    const isFirst = stage.is_first || stageIndex === 0;
    const hasTags = Boolean(stage.tags && stage.tags.length > 0);
    const isExpanded = !!expandedStages[stage.id];

    columns.push({
      key: `stage_${stage.id}`,
      type: "stage",
      id: stage.id,
      title: stage.name,
      isFirst: isFirst,
      hasTags: hasTags,
      isExpanded: isExpanded,
      totalCount: stage.total_count ?? 0,
      data: stage.data || [],
      past: stage.past || { count: 0, data: [] },
      current: stage.current || { count: 0, data: [] },
      future: stage.future || { count: 0, data: [] },
    });

    if (hasTags && isExpanded) {
      stage.tags.forEach((tag) => {
        columns.push({
          key: `tag_${stage.id}_${tag.id}`,
          type: "tag",
          id: tag.id,
          parentStageId: stage.id,
          title: tag.name,
          color: tag.color,
          isFirst: false,
          hasTags: false,
          isExpanded: false,
          totalCount: tag.total_count ?? 0,
          data: tag.data || [],
          past: tag.past || { count: 0, data: [] },
          current: tag.current || { count: 0, data: [] },
          future: tag.future || { count: 0, data: [] },
        });
      });
    }
  });

  // SKELETON CARD - shown while data is loading
  const renderSkeletonCard = (key) => (
    <Box
      key={key}
      sx={{
        background: "#FFFFFF",
        borderRadius: "5px",
        p: 2,
        mb: 0.8,
        border: "1px solid #ECECEC",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="rounded" width={42} height={15} />
      </Box>
      <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="70%" height={20} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="55%" height={20} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="65%" height={20} sx={{ mt: 1 }} />
    </Box>
  );

  return (
    <Box
      sx={{
        width: "100%",
        // height: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        mt: 3,
        "&::-webkit-scrollbar": {
          height: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "#C8C8C8",
          borderRadius: "20px",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: "5px",
          width: "max-content",
        }}
      >
        {loading ? (
          [1, 2, 3, 4, 5].map((colIndex) => (
            <Box
              key={`skeleton-col-${colIndex}`}
              sx={{
                width: "290px",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  height: "72px",
                  background: "#fff",
                  clipPath:
                    colIndex === 1
                      ? "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)"
                      : "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%, 5% 50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 3,
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                <Skeleton variant="text" width={120} height={30} />
                <Skeleton variant="circular" width={30} height={30} />
              </Box>
              <Box
                sx={{
                  mt: 0.8,
                  maxHeight: "72vh",
                  width: "280px",
                  overflowY: "auto",
                  pr: 0.5,
                  "&::-webkit-scrollbar": {
                    width: "5px",
                  },
                }}
              >
                {[1, 2, 3].map((skIndex) =>
                  renderSkeletonCard(`skeleton-${colIndex}-${skIndex}`)
                )}
              </Box>
            </Box>
          ))
        ) : columns.length > 0 ? (
          columns.map((column, columnIndex) => {
            const activeTab = activeFilters[column.key] || "current";
            const columnData = column.isFirst
              ? column.data || []
              : column[activeTab]?.data || [];

            // ---------- NEW: Loss column flags ----------
            // "Loss Request" = pending (admin approval waiting)
            // "Loss"         = approved by admin
            const stageLower = (column.title || "").toLowerCase();
            const isLossRequestCol =
              stageLower.includes("loss") && stageLower.includes("request");
            const isLossCol =
              stageLower.includes("loss") && !stageLower.includes("request");

            return (
              <Box
                key={column.key}
                sx={{
                  width: "290px",
                  flexShrink: 0,
                  animation:
                    column.type === "tag"
                      ? "followUpSlideFromInside 0.35s ease-out forwards"
                      : "none",
                  "@keyframes followUpSlideFromInside": {
                    "0%": {
                      opacity: 0,
                      transform: "translateX(-40px)",
                    },
                    "100%": {
                      opacity: 1,
                      transform: "translateX(0)",
                    },
                  },
                }}
              >
                {/* COLUMN HEADER */}
                <Box
                  sx={{
                    height: "72px",
                    background: "#ffffff",
                    clipPath:
                      columnIndex === 0
                        ? "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)"
                        : "polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%, 5% 50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    position: "sticky",
                    // overflow:"hidden",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <Box sx={{ maxWidth: "200px" }}>
                    <Typography
                      sx={{
                        fontSize: column.type === "tag" ? "16px" : "18px",
                        fontWeight: 500,
                        color: "#000000",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {column.type === "tag" && column.color && (
                        <Box
                          component="span"
                          sx={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: column.color,
                            display: "inline-block",
                            mr: 0.8,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {column.title}

                      {/* Expand/Collapse Chevron if stage has tags */}
                      {column.hasTags && (
                        <Box
                          onClick={() => toggleExpand(column.id)}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            ml: 1,
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: column.isExpanded
                              ? "#FA8C16"
                              : "#0205C8",
                            color: "#ffffff",
                            cursor: "pointer",
                            transition:
                              "transform 0.2s ease, background 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.15)",
                            },
                          }}
                          title={
                            column.isExpanded
                              ? `Collapse ${column.title}`
                              : `Expand ${column.title}`
                          }
                        >
                          {column.isExpanded ? (
                            <ChevronLeftOutlinedIcon
                              sx={{ fontSize: "16px" }}
                            />
                          ) : (
                            <ChevronRightOutlinedIcon
                              sx={{ fontSize: "16px" }}
                            />
                          )}
                        </Box>
                      )}
                    </Typography>

                    {/* PAST / CURRENT / FUTURE PILLS (shown on ALL stages & tags EXCEPT the first stage) */}
                    {!column.isFirst && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {["past", "current", "future"].map((tab) => {
                          const tabCount = column[tab]?.count || 0;

                          return (
                            <Box
                              key={tab}
                              onClick={() =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  [column.key]: tab,
                                }))
                              }
                              sx={{
                                px: 0.8,
                                py: 0.2,
                                borderRadius: "2px",
                                fontSize: "8px",
                                cursor: "pointer",
                                border: "1px solid #D9D9D9",
                                background:
                                  activeTab === tab ? "#A3E635" : "#F5F5F5",
                                color: activeTab === tab ? "#FFFFFF" : "#666",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                              }}
                            >
                              {tab === "past"
                                ? "Past"
                                : tab === "current"
                                ? "Current"
                                : "Future"}

                              <Typography
                                component="span"
                                sx={{
                                  fontSize: "9px",
                                  fontWeight: 500,
                                }}
                              >
                                {tabCount}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>

                  {/* TOTAL COUNT BADGE */}
                  <Box
                    sx={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background:
                        column.type === "tag"
                          ? column.color
                            ? `${column.color}20`
                            : "#F3E8FF"
                          : "#E9E9FF",
                      color:
                        column.type === "tag"
                          ? column.color || "#7C3AED"
                          : "#0205C8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 500,
                      fontSize: "12px",
                      flexShrink: 0,
                    }}
                  >
                    {column.totalCount || 0}
                  </Box>
                </Box>

                {/* CARDS LIST */}
                <Box
                  sx={{
                    mt: 0.8,
                    maxHeight: "75vh",
                    width: "280px",
                    overflowY: "auto",
                    pr: 0.5,
                    "&::-webkit-scrollbar": {
                      width: "5px",
                    },
                  }}
                >
                  {columnData.length > 0 ? (
                    columnData.map((item, index) => (
                      <Box
                        key={item.id || index}
                        onClick={() => handleLeadClick(item.id)}
                        sx={{
                          background: "#FFFFFF",
                          borderRadius: "5px",
                          p: 2,
                          mb: 0.8,
                          border: "1px solid #ECECEC",
                          color: "#4D4D4D",
                          fontWeight: 400,
                          cursor: "pointer",
                          "&:hover": {
                            boxShadow: "0px 2px 10px rgba(0,0,0,0.08)",
                          },
                        }}
                      >
                        {/* TOP: Name & Priority Chip */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: "16px",
                              color: "#000000",
                            }}
                          >
                            {item.name || "-"}
                          </Typography>

                          {item.priority && (
                            <Chip
                              label={item.priority}
                              size="small"
                              sx={{
                                height: "15px",
                                minWidth: "42px",
                                width: "fit-content",
                                px: 0.5,
                                fontSize: "9px",
                                borderRadius: "4px",
                                ...getPriorityChipStyle(
                                  item.priority,
                                  item.priority_color
                                ),
                              }}
                            />
                          )}
                        </Box>

                        {/* MOBILE */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            mt: 1,
                          }}
                        >
                          <CallOutlinedIcon sx={{ fontSize: "17px" }} />
                          <Typography sx={{ fontSize: "14px" }}>
                            {item.mobile || "-"}
                          </Typography>
                        </Box>

                        {/* FIRST STAGE ONLY (New Lead Style) */}
                        {column.isFirst ? (
                          <>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                mt: 1,
                              }}
                            >
                              <Groups2OutlinedIcon
                                sx={{
                                  height: "17px",
                                  width: "17px",
                                }}
                              />
                              <Typography sx={{ fontSize: "14px" }}>
                                Source: {item.source || "-"}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 1,
                              }}
                            >
                              <CalendarMonthOutlinedIcon
                                sx={{
                                  height: "17px",
                                  width: "17px",
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: "14px",
                                  color: "#555",
                                }}
                              >
                                {item.date
                                  ? dayjs(item.date).format("DD MMM, hh:mm A")
                                  : "-"}
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          /* OTHER STAGES & TAGS */
                          <>
                            <Box
                              sx={{
                                borderBottom: "1px solid #EAEAEA",
                                my: 1.5,
                              }}
                            />

{isLossRequestCol || isLossCol ? (
  <>
    <InfoRow icon={<Groups2OutlinedIcon sx={iconSx} />}>
      Source: {item.source || "-"}
    </InfoRow>

    <InfoRow icon={<SchoolOutlinedIcon sx={iconSx} />}>
      Reason: {item.loss_reason || "-"}
    </InfoRow>

    {item.loss_notes && (
      <InfoRow icon={<SchoolOutlinedIcon sx={iconSx} />}>
        {isLossCol ? "Admin remarks" : "Notes"}: {item.loss_notes}
      </InfoRow>
    )}

    <InfoRow icon={<CallOutlinedIcon sx={iconSx} />}>
      Call attempts: {item.total_calls ?? 0}
    </InfoRow>
{/* 
    {isLossRequestCol && item.loss_requested_at && (
      <InfoRow icon={<AccessTimeOutlinedIcon sx={iconSx} />}>
        Requested: {dayjs(item.loss_requested_at).format("DD MMM, hh:mm A")}
      </InfoRow>
    )} */}

    {/* {isLossCol && item.loss_approved_at && (
      <InfoRow icon={<AccessTimeOutlinedIcon sx={iconSx} />}>
        Approved: {dayjs(item.loss_approved_at).format("DD MMM, hh:mm A")}
      </InfoRow>
    )} */}

    {isLossRequestCol && (
      <Chip
        size="small"
        label="Waiting for admin approval"
        sx={{ mt: 1, height: "20px", fontSize: "11px", background: "#FEF3C7", color: "#92400E" }}
      />
    )}
  </>
) : (
  <>
    {/* COURSE */}
    <InfoRow icon={<SchoolOutlinedIcon sx={iconSx} />}>{item.course_name || "-"}</InfoRow>
    {/* PLAN */}
    <InfoRow icon={<SchoolOutlinedIcon sx={iconSx} />}>Plan: {item.course_plan || "-"}</InfoRow>
    {/* SOURCE */}
    <InfoRow icon={<Groups2OutlinedIcon sx={iconSx} />}>Source: {item.source || "-"}</InfoRow>
    {/* TIMING */}
    <InfoRow icon={<AccessTimeOutlinedIcon sx={iconSx} />}>Timing: {item.timing || "-"}</InfoRow>
  </>
)}

                            {/* CALL NOTES */}
                            {(item.call_summary ||
                              item.notes ||
                              item.summary) && (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  mt: 1,
                                }}
                              >
                                <AccessTimeOutlinedIcon
                                  sx={{
                                    height: "17px",
                                    width: "17px",
                                  }}
                                />
                                <Typography sx={{ fontSize: "14px" }}>
                                  Call Notes:{" "}
                                  {item.call_summary ||
                                    item.notes ||
                                    item.summary}
                                </Typography>
                              </Box>
                            )}

                            {/* ATTEMPTS & LAST TRIED */}
                            {Boolean(
                              item.attempts !== undefined &&
                                item.attempts !== null &&
                                item.attempts > 0
                            ) && (
                              <>
                                <Box
                                  sx={{
                                    borderBottom: "1px solid #EAEAEA",
                                    my: 1.5,
                                  }}
                                />
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 1,
                                  }}
                                >
                                  <SchoolOutlinedIcon
                                    sx={{
                                      width: "17px",
                                      height: "17px",
                                    }}
                                  />
                                  <Typography sx={{ fontSize: "14px" }}>
                                    Attempt: {item.attempts}
                                  </Typography>
                                </Box>

                                {item.last_tried && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: 1,
                                    }}
                                  >
                                    <Groups2OutlinedIcon
                                      sx={{
                                        width: "17px",
                                        height: "17px",
                                      }}
                                    />
                                    <Typography sx={{ fontSize: "14px" }}>
                                      Last Tried:{" "}
                                      {dayjs(item.last_tried).fromNow
                                        ? dayjs(item.last_tried).fromNow()
                                        : dayjs(item.last_tried).format(
                                            "DD MMM, hh:mm A"
                                          )}
                                    </Typography>
                                  </Box>
                                )}

                                {item.retry_after && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: 1,
                                    }}
                                  >
                                    <AccessTimeOutlinedIcon
                                      sx={{
                                        width: "17px",
                                        height: "17px",
                                      }}
                                    />
                                    <Typography sx={{ fontSize: "14px" }}>
                                      Retry After:{" "}
                                      {dayjs(item.retry_after).fromNow
                                        ? dayjs(item.retry_after).fromNow()
                                        : dayjs(item.retry_after).format(
                                            "DD MMM, hh:mm A"
                                          )}
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            )}

                            {/* PENDING PAYMENT (Loss card la hide) */}
                            {Boolean(
                              !isLossCol &&
                                item.pending_amount &&
                                Number(item.pending_amount) > 0
                            ) && (
                              <>
                                <Box
                                  sx={{
                                    borderTop: "1px solid #ECECEC",
                                    mt: 2,
                                    pt: 1.5,
                                  }}
                                />
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 1,
                                    color: "#FF0000",
                                  }}
                                >
                                  <Groups2OutlinedIcon
                                    sx={{
                                      width: "17px",
                                      height: "17px",
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "14px",
                                      fontWeight: 400,
                                    }}
                                  >
                                    Pending: ₹ {item.pending_amount || "-"}
                                  </Typography>
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 1,
                                  }}
                                >
                                  <SchoolOutlinedIcon
                                    sx={{
                                      width: "17px",
                                      height: "17px",
                                    }}
                                  />
                                  <Typography sx={{ fontSize: "14px" }}>
                                    Amount: ₹ {item.total_fees || "-"}
                                  </Typography>
                                </Box>

                                {(() => {
                                  const isPast = activeTab === "past";
                                  const isCurrent = activeTab === "current";

                                  let label = "";
                                  if (isPast) {
                                    let ovDays = item.overdue_days;
                                    if ((ovDays === undefined || ovDays === null || ovDays === "-") && item.due_date) {
                                      const due = dayjs(item.due_date).startOf("day");
                                      const today = dayjs().startOf("day");
                                      const diff = today.diff(due, "day");
                                      if (diff >= 0) ovDays = diff;
                                    }
                                    label = `Over Due: ${ovDays ?? "-"} Days`;
                                  } else if (isCurrent) {
                                    label = "Today Due";
                                  } else {
                                    let remDays = null;
                                    if (item.due_date) {
                                      const due = dayjs(item.due_date).startOf(
                                        "day"
                                      );
                                      const today = dayjs().startOf("day");
                                      remDays = due.diff(today, "day");
                                    }
                                    label = `Remaining: ${
                                      remDays !== null && remDays >= 0
                                        ? remDays
                                        : item.remaining_days ?? "-"
                                    } Days`;
                                  }

                                  const isRed = isPast;

                                  return (
                                    <Box
                                      sx={{
                                        mt: 1.5,
                                        border: isRed
                                          ? "1px solid #FF1212"
                                          : "1px solid #1976D2",
                                        color: isRed ? "#FF1212" : "#1976D2",
                                        borderRadius: "4px",
                                        width: "fit-content",
                                        minWidth: "130px",
                                        px: 1.5,
                                        fontSize: "14px",
                                        height: "24px",
                                        backgroundColor: isRed
                                          ? "#FFF2F2"
                                          : "#E3F2FD",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {label}
                                    </Box>
                                  );
                                })()}
                              </>
                            )}



                            {/* CLOSED / LOST REASON */}
                            {item.lost_reason && (
                              <>
                                <Box
                                  sx={{
                                    borderBottom: "1px solid #EAEAEA",
                                    my: 1.5,
                                  }}
                                />
                                <Box
                                  sx={{
                                    mt: 1.5,
                                    background: "#E6E6E6",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    width: "195px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    p: 0.5,
                                  }}
                                >
                                  Lost reason: {item.lost_reason || "-"}
                                </Box>
                              </>
                            )}

                            {/* DATE / CLOSED ON */}
{/* DATE / CLOSED ON */}
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 1,
    mt: 2,
    pt: 1.5,
    borderTop: "1px solid #ECECEC",
  }}
>
  <CalendarMonthOutlinedIcon sx={{ height: "17px", width: "17px" }} />
  <Typography sx={{ fontSize: "14px", color: "#4D4D4D" }}>
    {(() => {
      const fmt = (d) => dayjs(d).format("DD MMM, hh:mm A");

      if (isLossRequestCol && item.loss_requested_at)
        return `Requested: ${fmt(item.loss_requested_at)}`;
      if (isLossCol && item.loss_approved_at)
        return `Approved: ${fmt(item.loss_approved_at)}`;
      if (item.closed_on) return `Closed on: ${fmt(item.closed_on)}`;
      if (item.date) return fmt(item.date);
      return "-";
    })()}
  </Typography>
</Box>

                            {/* CALLBACK (Loss card la hide) */}
                            {!isLossCol && item.call_back && (
                              <Box
                                sx={{
                                  mt: 1.5,
                                  background: "#F4FFE2",
                                  border: "0.6px solid #4A700B",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  color: "#4A700B",
                                  fontWeight: 500,
                                  height: "27px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: 0.7,
                                }}
                              >
                                <Groups2OutlinedIcon
                                  sx={{
                                    fontSize: "16px",
                                    color: "#4A700B",
                                  }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    color: "#4A700B",
                                    fontWeight: 500,
                                  }}
                                >
                                  Call back:{" "}
                                  {new Date(item.call_back).toLocaleTimeString(
                                    "en-IN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    }
                                  )}
                                </Typography>
                              </Box>
                            )}
                          </>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Box
                      sx={{
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px dashed #D8D8D8",
                        height: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9E9E9E",
                        fontSize: "14px",
                      }}
                    >
                      No Leads
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        ) : (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              color: "#888",
              width: "100%",
              background: "#fff",
              borderRadius: "8px",
              my: 2,
            }}
          >
            No stages configured for this pipeline.
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PipelineCards;