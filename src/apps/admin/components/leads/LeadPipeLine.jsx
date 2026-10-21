import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, CircularProgress, Skeleton } from "@mui/material";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import dayjs from "dayjs";

import { getPipelineLeads } from "@/apps/admin/services/leadService";
import { useAuth } from "@/shared/context/AuthContext";

// Lead Card Component matching exact UI/UX design
const LeadCard = ({ lead, onClick }) => {
  const name =
    lead.full_name ||
    lead.name ||
    `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
    "";
  const counselor = lead.assigned_to || lead.user_name || lead.telecaller || "";
  const rawPhone = lead.mobile_no || lead.phone_no || lead.phone || lead.contact || "";
  const phone = rawPhone ? (rawPhone.startsWith("+") ? rawPhone : `+91 ${rawPhone}`) : "-";
  const source = lead.source_name || lead.source || lead.lead_source || "";
  const date = lead.created_at || lead.created_date || lead.date || "";
  const isHot = lead.is_hot ?? lead.isHot ?? false;



  return (
    <Box
      onClick={onClick}
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        p: 2,
        mb: 1.5,
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
        transition: "box-shadow 0.15s ease",
        "&:hover": {
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      {/* Top Row: Name + Badges */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.2,
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#000000",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          {isHot && (
            <Box
              sx={{
                border: "1px solid #D91616",
                color: "#D91616",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "5px",
                px: "7px",
                py: "1px",
                lineHeight: "16px",
              }}
            >
              Hot
            </Box>
          )}

          {counselor && (
            <Box
              sx={{
                backgroundColor: "#EFEFEF",
                color: "#333333",
                fontSize: "11px",
                fontWeight: 500,
                borderRadius: "5px",
                px: "8px",
                py: "2px",
                lineHeight: "16px",
                whiteSpace: "nowrap",
              }}
            >
              {counselor}
            </Box>
          )}
        </Box>
      </Box>

      {/* Phone */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
        <PhoneOutlinedIcon sx={{ fontSize: 16, color: "#666666" }} />
        <Typography sx={{ fontSize: "13px", color: "#333333", fontWeight: 400 }}>
          {phone}
        </Typography>
      </Box>

      {/* Source */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
        <PeopleAltOutlinedIcon sx={{ fontSize: 16, color: "#666666" }} />
        <Typography sx={{ fontSize: "13px", color: "#333333", fontWeight: 400 }}>
          Source: {source}
        </Typography>
      </Box>

      {/* Date */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: "#666666" }} />
        <Typography sx={{ fontSize: "13px", color: "#333333", fontWeight: 400 }}>
          {date}
        </Typography>
      </Box>
    </Box>
  );
};

// Skeleton loading placeholder for Kanban board
const PipelineSkeleton = ({ columnCount = 5 }) => {
  const count = Math.max(columnCount, 3);


  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        pb: 2,
        pt: 0.5,
        mt: 2,
        "&::-webkit-scrollbar": { height: "8px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#CCCCCC",
          borderRadius: "4px",
        },
      }}
    >
      {Array.from({ length: count }).map((_, colIdx) => (
        <Box
          key={colIdx}
          sx={{
            minWidth: "310px",
            maxWidth: "310px",
            backgroundColor: "#F2F2F4",
            borderRadius: "14px",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header Skeleton */}
          <Skeleton
            variant="rounded"
            height={56}
            sx={{
              borderRadius: "8px",
              mb: 1.5,
              backgroundColor: "#E2E8F0",
            }}
          />

          {/* Card Skeletons */}
          {Array.from({ length: 4 }).map((_, cardIdx) => (
            <Box
              key={cardIdx}
              sx={{
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                p: 2,
                mb: 1.5,
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.2,
                }}
              >
                <Skeleton variant="text" width="55%" height={24} />
                <Skeleton
                  variant="rounded"
                  width={60}
                  height={20}
                  sx={{ borderRadius: "5px" }}
                />
              </Box>

              <Skeleton variant="text" width="65%" height={18} sx={{ mb: 0.8 }} />
              <Skeleton variant="text" width="45%" height={18} sx={{ mb: 0.8 }} />
              <Skeleton variant="text" width="50%" height={18} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Column Header Chevron Arrow Ribbon Component
const ChevronHeader = ({ column }) => {


  return (
    <Box
      sx={{
        position: "relative",
        mb: 1.5,
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
        backgroundColor: "#FFFFFF",
        pt: 1.5,
        pb: 1.5,
        pl: 2,
        pr: 3.5,
        minHeight: "56px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Top Line: Title + Total Count Badge */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#000000",
            whiteSpace: "nowrap",
          }}
        >
          {column.title}
        </Typography>

        <Box
          sx={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#E8E7FB",
            color: "#5438FF",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {column.totalCount ?? column.leads?.length ?? 0}
        </Box>
      </Box>
    </Box>
  );
};

// Column Container Component
const PipelineColumn = ({ column, onCardClick }) => {
  const displayedLeads = column.leads || [];



  return (
    <Box
      sx={{
        minWidth: "310px",
        maxWidth: "310px",
        backgroundColor: "#F2F2F4",
        borderRadius: "14px",
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      {/* Chevron Header */}
      <ChevronHeader column={column} />

      {/* Cards List */}
      <Box
        sx={{
          overflowY: "auto",
          pr: 0.5,
          flex: 1,
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CCCCCC",
            borderRadius: "4px",
          },
        }}
      >
        {displayedLeads.length === 0 ? (
          <Typography
            sx={{
              fontSize: "13px",
              color: "#888888",
              textAlign: "center",
              mt: 3,
            }}
          >
            No leads for this tab
          </Typography>
        ) : (
          displayedLeads.map((lead, idx) => (
            <LeadCard
              key={lead.id || lead.lead_id || idx}
              lead={lead}
              onClick={onCardClick ? () => onCardClick(lead) : undefined}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

// Root Pipeline Board Component
const LeadPipeLine = ({
  tableData = [],

  searchTerm = "",
  dateFilterType = "all",
  fromDate = null,
  toDate = null,
  selectedFilters = {},
  stagesList = [],
  selectedPipeline = null,
  onCardClick,

}) => {
  const { hasPermission } = useAuth();
  const [apiPipelineData, setApiPipelineData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch pipeline board leads from API endpoint: /adm/fetch_pipeline_leads_admin
  const fetchPipelineData = async () => {
    if (!hasPermission("api_fetch_pipeline_leads_admin")) {
      console.warn("Permission denied: api_fetch_pipeline_leads_admin");
      return;
    }
    try {
      setLoading(true);
      const pipeId = Number(
        selectedPipeline?.id ??
          selectedPipeline?.value ??
          selectedPipeline ??
          0
      );

      const payload = {
        pipeline_id: pipeId,
        search: searchTerm || "",
      };

      if (selectedFilters?.assigned_to_id && selectedFilters.assigned_to_id !== 0) {
        payload.telecaller_id = selectedFilters.assigned_to_id;
      }
      
      const stageId = selectedFilters?.pipeline_stage_id || selectedFilters?.stage_id;
      if (stageId && stageId !== 0 && stageId !== "all") {
        payload.pipeline_stage_id = Number(stageId);
    }

      if (selectedFilters?.lead_source_id && selectedFilters.lead_source_id !== 0 && selectedFilters.lead_source_id !== "all") {
        payload.lead_source_id = selectedFilters.lead_source_id;
      }
      if (selectedFilters?.campaign_name_id && selectedFilters.campaign_name_id !== 0 && selectedFilters.campaign_name_id !== "all") {
        payload.campaign_id = selectedFilters.campaign_name_id;
      }
      if (selectedFilters?.course_plan_id && selectedFilters.course_plan_id !== 0 && selectedFilters.course_plan_id !== "all") {
        payload.course_plan_id = selectedFilters.course_plan_id;
      }
      if (selectedFilters?.course_id && selectedFilters.course_id !== 0 && selectedFilters.course_id !== "all") {
        payload.course_name_id = selectedFilters.course_id;
      }

      if (dateFilterType && dateFilterType !== "all") {
        payload.date_filter_type = dateFilterType === "monthly" ? "this_month" : dateFilterType;
      }
      if (dateFilterType === "custom" && fromDate && toDate) {
        payload.from_date = dayjs(fromDate).format("YYYY-MM-DD");
        payload.to_date = dayjs(toDate).format("YYYY-MM-DD");
      }

      const response = await getPipelineLeads(payload);
      const resData = response?.data?.data || response?.data?.result || response?.data;
      if (resData && typeof resData === "object") {
        setApiPipelineData(resData);
      }
    } catch (error) {
      console.warn("getPipelineLeads API call error (falling back to tableData):", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedFiltersStr = JSON.stringify(selectedFilters);

  const prevPipelineRef = useRef(selectedPipeline);
  useEffect(() => {
    if (prevPipelineRef.current !== selectedPipeline) {
      prevPipelineRef.current = selectedPipeline;
      setApiPipelineData(null);
    }
  }, [selectedPipeline]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPipelineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPipeline,
    searchTerm,
    dateFilterType,
    fromDate,
    toDate,
    selectedFiltersStr,
  ]);

  // Group tableData by stage_id when API pipeline response is not present
  const columnsData = React.useMemo(() => {
    // 1. Structure from API response: stage_list array with pipeline_stage_name and leads array
    const stageList =
      apiPipelineData?.stage_list ||
      apiPipelineData?.stages ||
      (Array.isArray(apiPipelineData) ? apiPipelineData : null);

    if (Array.isArray(stageList) && stageList.length > 0) {
      return stageList.map((stg) => ({
        id: stg.pipeline_stage_id ?? stg.id ?? stg.pipeline_stage_name,
        title:
          stg.pipeline_stage_name ||
          stg.name ||
          stg.stage_name ||
          stg.label ||
          `Stage ${stg.pipeline_stage_id}`,
        totalCount:
          stg.total_count ?? (Array.isArray(stg.leads) ? stg.leads.length : 0),
        leads: Array.isArray(stg.leads) ? stg.leads : [],
      }));
    }

    // 2. Dictionary format under apiPipelineData.data: { "New Lead": [...], "Follow Up": [...] }
    const stageDict = apiPipelineData?.data;
    if (stageDict && typeof stageDict === "object" && !Array.isArray(stageDict)) {
      const result = [];
      Object.keys(stageDict).forEach((stageName) => {
        const leads = stageDict[stageName];
        if (Array.isArray(leads)) {
          result.push({
            id: stageName,
            title: stageName,
            totalCount: leads.length,
            leads: leads,
          });
        }
      });
      if (result.length > 0) return result;
    }

    if (apiPipelineData && typeof apiPipelineData === "object" && !Array.isArray(apiPipelineData)) {
      const result = [];
      const metaKeys = ["status", "message", "pipeline_id", "pipeline_name", "data", "stage_list", "stages"];
      Object.keys(apiPipelineData).forEach((key) => {
        if (metaKeys.includes(key)) return;
        const item = apiPipelineData[key];
        if (Array.isArray(item)) {
          result.push({
            id: key,
            title: key,
            leads: item,
          });
        } else if (item && typeof item === "object") {
          result.push({
            id: key,
            title: item.title || item.name || key,
            leads: item.leads || item.rows || [],
          });
        }
      });
      if (result.length > 0) return result;
    }

    if (!loading && Array.isArray(stagesList) && stagesList.length > 0) {
      return stagesList.map((stg) => {
        const stageId = Number(stg.id ?? stg.value ?? 0);
        const stageName = stg.label || stg.name || stg.stage_name || `Stage ${stageId}`;

        const stageLeads = tableData.filter((item) => {
          const itemStageId = Number(item.stage_id || item.status_id || item.lead_stage_id || 0);
          return itemStageId === stageId;
        });

        return {
          id: stageId,
          title: stageName,
          leads: stageLeads,
        };
      });
    }

    return [];
  }, [apiPipelineData, stagesList, tableData, loading]);

  if (loading && !apiPipelineData) {
    return <PipelineSkeleton columnCount={stagesList?.length || 5} />;
  }



  return (
    <Box sx={{ mt: 2, position: "relative" }}>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={36} sx={{ color: "#84CC16" }} />
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 2,
          pt: 0.5,
          "&::-webkit-scrollbar": { height: "8px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CCCCCC",
            borderRadius: "4px",
          },
        }}
      >
        {columnsData.map((col) => (
          <PipelineColumn key={col.id} column={col} onCardClick={onCardClick} />
        ))}
      </Box>
    </Box>
  );
};

export default LeadPipeLine;
