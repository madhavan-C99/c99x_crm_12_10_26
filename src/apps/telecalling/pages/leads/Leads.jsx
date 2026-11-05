import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { getLeadData, lookupLeadByNumber } from "@/apps/telecalling/services/leadService";
import LeadLookupModal from "@/apps/telecalling/components/leads/LeadLookupModal";

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
    const {
        selectedFilters,
        setSelectedFilters,
        filterType,
        setFilterType,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        debouncedSearch,
        searchTerm,
        setSearchTerm,
        sortType,
        setSortType,
    } = filters;

    const [selectedLeadType, setSelectedLeadType] = useSessionState("leads_selectedLeadType", "");

    const [lookupLead, setLookupLead] = useState(null);
    const [lookupOpen, setLookupOpen] = useState(false);
    const [injectedLead, setInjectedLead] = useState(null);

    // Track the last queried 10-digit number to prevent redundant queries
    const lastLookedUpRef = useRef("");

    const handleGlobalSearch = useCallback(async (text) => {
        const query = typeof text === "string" ? text : searchTerm;
        const cleanDigits = (query || "").replace(/\D/g, "");

        if (cleanDigits.length < 10) {
            lastLookedUpRef.current = "";
            setInjectedLead(null);
            setLookupOpen(false);
            setLookupLead(null);
            return;
        }

        if (lastLookedUpRef.current === cleanDigits) {
            return;
        }
        lastLookedUpRef.current = cleanDigits;

        try {
            const res = await lookupLeadByNumber(cleanDigits);
            if (res.data?.data?.found && res.data.data.lead) {
                const foundLead = res.data.data.lead;
                if (foundLead.is_assigned_to_me) {
                    // Current telecaller-kku assign aagi irundha:
                    // Table row-la show aaganum, popup open aaga koodadhu
                    setLookupOpen(false);
                    setLookupLead(null);

                    // Vera pipeline-la irundha, antha pipeline-kku switch pannu
                    if (foundLead.pipeline_id && selectedPipelineId !== foundLead.pipeline_id) {
                        handlePipelineChange(foundLead.pipeline_id);
                    }

                    // Active stage tab filter irundha clear pannu
                    if (selectedLeadType) {
                        setSelectedLeadType("");
                    }

                    // Table rows-la inject pannu
                    setInjectedLead(foundLead);
                } else {
                    // Vera telecaller kitta irundha: popup modal show pannu
                    setInjectedLead(null);
                    setLookupLead(foundLead);
                    setLookupOpen(true);
                }
            } else {
                setInjectedLead(null);
                setLookupOpen(false);
                setLookupLead(null);
            }
        } catch (err) {
            console.error("Global search error:", err);
        }
    }, [searchTerm, selectedPipelineId, selectedLeadType, handlePipelineChange, setSelectedLeadType]);

    // Auto-trigger lookup if search reaches 10 digits
    useEffect(() => {
        const clean = (debouncedSearch || "").replace(/\D/g, "");
        if (clean.length === 10) {
            handleGlobalSearch(clean);
        } else {
            lastLookedUpRef.current = "";
            setInjectedLead(null);
            setLookupOpen(false);
            setLookupLead(null);
        }
    }, [debouncedSearch, handleGlobalSearch]);

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

    const allLeads = useMemo(() => {
        if (!injectedLead) return data.leads;
        if (data.leads.some((l) => l.id === injectedLead.id)) return data.leads;
        return [injectedLead, ...data.leads];
    }, [data.leads, injectedLead]);

    const rows = sortRows(searchRows(allLeads, searchTerm), sortType);

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
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleGlobalSearch}
                filterType={filterType}
                setFilterType={setFilterType}
                sortType={sortType}
                setSortType={setSortType}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                dropdownCategory="L_FETCH_FILTER_LEAD"
                pageName="lead"
                getExportPayload={buildPayload}
                exportRows={data.leads}
                selectedPipelineId={selectedPipelineId}
            />

            <LeadTable tableData={rows} loading={loading} />

            <LeadLookupModal
                open={lookupOpen}
                onClose={() => setLookupOpen(false)}
                lead={lookupLead}
            />
        </>
    );
};

export default Leads;
