import dayjs from "dayjs";

import LeadHeader from "@/apps/telecalling/components/leads/LeadHeader";
import LeadStats from "@/apps/telecalling/components/leads/LeadStats";
import LeadTable from "@/apps/telecalling/components/leads/LeadTable";
import CommonFilters from "@/apps/telecalling/components/filters/CommonFilters";
import usePipelineSelector from "@/apps/telecalling/hooks/usePipelineSelector";
import useListFilters from "@/apps/telecalling/hooks/useListFilters";
import useRemoteData from "@/apps/telecalling/hooks/useRemoteData";
import useSessionState from "@/apps/telecalling/hooks/useSessionState";
import { searchRows, sortRows } from "@/apps/telecalling/utils/listUtils";
import { getLeadData } from "@/apps/telecalling/services/leadService";

const DEFAULT_FILTERS = {
    pipeline_stage_id: 0,
    lead_source_id: 0,
    course_name_id: 0,
    priority_id: 0,
    course_plan_id: 0,
    payment_status: 0,
    campaign_name_id: 0,
};

const EMPTY = { leads: [], stats: {} };

// API returns [leads[], stats{}]
const parseLeadResponse = (res) => {
    const [leads, stats] = res?.data?.data || [];
    return { leads: leads || [], stats: stats || {} };
};

const Leads = () => {
    const { pipelines, selectedPipelineId, handlePipelineChange, isReady } =
        usePipelineSelector("leads");

    const filters = useListFilters("leads", { defaultFilters: DEFAULT_FILTERS });
    const { selectedFilters, filterType, fromDate, toDate, debouncedSearch } = filters;

    const [selectedLeadType, setSelectedLeadType] = useSessionState("leads_selectedLeadType", "");

    // The stats tab the user clicked wins over the "Pipeline Stage" dropdown filter.
    const buildPayload = () => {
        const payload = {
            date_filter_type: filterType,
            pipeline_stage_id: selectedLeadType
                ? Number(selectedLeadType)
                : selectedFilters.pipeline_stage_id || 0,
            lead_source_id: selectedFilters.lead_source_id,
            course_name_id: selectedFilters.course_name_id,
            priority_id: selectedFilters.priority_id,
            course_plan_id: selectedFilters.course_plan_id,
            payment_status: selectedFilters.payment_status,
            campaign_name_id: selectedFilters.campaign_name_id,
            pipeline_id: selectedPipelineId || 0,
            search: debouncedSearch || "",
        };

        if (filterType === "custom" && fromDate && toDate) {
            payload.from_date = dayjs(fromDate).format("YYYY-MM-DD");
            payload.to_date = dayjs(toDate).format("YYYY-MM-DD");
        }
        return payload;
    };

    const { data, loading } = useRemoteData({
        fetcher: getLeadData,
        params: buildPayload(),
        enabled: isReady,
        parse: parseLeadResponse,
        initialData: EMPTY,
    });

    const rows = sortRows(searchRows(data.leads, filters.searchTerm), filters.sortType);

    return (
        <>
            <LeadHeader
                pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                handlePipelineChange={handlePipelineChange}
            />

            <LeadStats
                statsData={data.stats}
                selectedLeadType={selectedLeadType}
                setSelectedLeadType={(value) =>
                    setSelectedLeadType(value === "" ? "" : String(value))
                }
                loading={loading}
            />

            <CommonFilters
                searchTerm={filters.searchTerm}
                setSearchTerm={filters.setSearchTerm}
                filterType={filters.filterType}
                setFilterType={filters.setFilterType}
                sortType={filters.sortType}
                setSortType={filters.setSortType}
                fromDate={filters.fromDate}
                setFromDate={filters.setFromDate}
                toDate={filters.toDate}
                setToDate={filters.setToDate}
                selectedFilters={filters.selectedFilters}
                setSelectedFilters={filters.setSelectedFilters}
                dropdownCategory="L_FETCH_FILTER_LEAD"
                pageName="lead"
                getExportPayload={buildPayload}
                exportRows={data.leads}
                selectedPipelineId={selectedPipelineId}
            />

            <LeadTable tableData={rows} loading={loading} />
        </>
    );
};

export default Leads;
