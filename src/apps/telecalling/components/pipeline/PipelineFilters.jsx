import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import AddNewLead from "@/apps/telecalling/components/pipeline/AddNewLead";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import FilterButton from "@/shared/components/filters/FilterButton";
import PipelineSelect from "@/shared/components/filters/PipelineSelect";
import ExportButton from "@/shared/components/export/ExportButton";
import { filterBarSx } from "@/shared/components/filters/filterStyles";

const PipelineFilters = ({
    refreshPipeline,

    filterType,
    setFilterType,
    fromDate,
    setFromDate,
    toDate,
    setToDate,

    selectedFilters,
    setSelectedFilters,

    setPayload,

    pipelines = [],
    selectedPipelineId = 0,
    handlePipelineChange,
}) => {
    const [addLeadOpen, setAddLeadOpen] = useState(false);

    // Rebuild the pipeline payload whenever a filter changes (parent reloads the board)
    useEffect(() => {

        const newPayload = {
            date_filter_type: filterType,
            pipeline_stage_id: selectedFilters.pipeline_stage_id,
            lead_source_id: selectedFilters.lead_source_id,
            course_name_id: selectedFilters.course_name_id,
            priority_id: selectedFilters.priority_id,
            course_plan_id: selectedFilters.course_plan_id,
            payment_status: selectedFilters.payment_status,
            campaign_name_id: selectedFilters.campaign_name_id,
            pipeline_id: selectedPipelineId || 0,
        };

        if (filterType === "custom") {
            newPayload.from_date = fromDate;
            newPayload.to_date = toDate;
        }

        setPayload(newPayload);

    }, [
        filterType,
        fromDate,
        toDate,
        selectedFilters,      // ✅ ADD THIS
        selectedPipelineId,
    ]);

    const getExportPayload = () => {
        const payload = {
            date_filter_type: filterType,
            pipeline_stage_id: selectedFilters.pipeline_stage_id ?? 0,
            lead_source_id: selectedFilters.lead_source_id ?? 0,
            course_name_id: selectedFilters.course_name_id ?? 0,
            priority_id: selectedFilters.priority_id ?? 0,
            course_plan_id: selectedFilters.course_plan_id ?? 0,
            payment_status: selectedFilters.payment_status ?? 0,
            campaign_name_id: selectedFilters.campaign_name_id ?? 0,
            pipeline_id: selectedPipelineId ?? 0,
        };

        if (filterType === "custom" && fromDate && toDate) {
            payload.from_date = fromDate;
            payload.to_date = toDate;
        }
        return payload;
    };

    return (
        <Box sx={{ ...filterBarSx, justifyContent: { xs: "center", sm: "space-between" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                    startIcon={<AddOutlinedIcon />}
                    variant="contained"
                    onClick={() => setAddLeadOpen(true)}
                    sx={{
                        height: "31px",
                        px: 2,
                        borderRadius: "6px",
                        background: "#0205C8",
                        color: "#fff",
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: 500,
                        boxShadow: "none",
                        "&:hover": { background: "#0205c8de", boxShadow: "none" },
                    }}
                >
                    Add New Lead
                </Button>
                <AddNewLead
                    open={addLeadOpen}
                    setOpen={setAddLeadOpen}
                    refreshPipeline={refreshPipeline}
                />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, flexWrap: "wrap" }}>
                <PipelineSelect
                    variant="toolbar"
                    pipelines={pipelines}
                    value={selectedPipelineId}
                    onChange={handlePipelineChange}
                />

                <DateRangeSelect
                    filterType={filterType}
                    setFilterType={setFilterType}
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                />

                <FilterButton
                    selectedFilters={selectedFilters}
                    setSelectedFilters={setSelectedFilters}
                    dropdownCategory="L_FETCH_FILTER_PIPELINE_TYPE"
                    selectedPipelineId={selectedPipelineId}
                />

                <ExportButton
                    pageName="pipeline-lead"
                    getExportPayload={getExportPayload}
                />
            </Box>
        </Box>
    );
};

export default PipelineFilters;
