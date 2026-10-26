import { useEffect, useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import { useAuth } from "@/shared/context/AuthContext";
import AddNewLead from "@/apps/telecalling/components/pipeline/AddNewLead";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import FilterButton from "@/shared/components/filters/FilterButton";
import PipelineSelect from "@/shared/components/filters/PipelineSelect";
import ExportButton from "@/shared/components/export/ExportButton";
import { buildStageSheets, getPipelineExportColumns } from "./pipelineExport";
import { filterBarSx } from "@/shared/components/filters/filterStyles";

const PipelineFilters = ({
    refreshPipeline,
    boardStages,

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
    const { hasPermission } = useAuth();
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

    const exportColumns = useMemo(() => getPipelineExportColumns(boardStages), [boardStages]);

    return (
        <Box sx={{ ...filterBarSx, justifyContent: { xs: "center", sm: "space-between" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {(hasPermission("api_add_new_lead") || hasPermission("feat_lead_add")) && (
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
                )}
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

                {/* one Excel file, one sheet per stage */}
                {(hasPermission("api_dynamic_export_excel") || hasPermission("feat_lead_export")) && (
                    <ExportButton
                        columns={exportColumns}
                        fileName="pipeline"
                        buildSheets={(keys) => buildStageSheets(boardStages, keys, exportColumns)}
                    />
                )}
            </Box>
        </Box>
    );
};

export default PipelineFilters;
