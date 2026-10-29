import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import PendingPaymentHeader from "@/apps/telecalling/components/pendingPayments/PendingPaymentHeader";
import PendingPaymentStats from "@/apps/telecalling/components/pendingPayments/PendingPaymentStats";
import PendingPaymentTable from "@/apps/telecalling/components/pendingPayments/PendingPaymentTable";
import CommonFilters from "@/shared/components/filters/CommonFilters";
import usePipelineSelector from "@/shared/hooks/usePipelineSelector";
import useListFilters from "@/shared/hooks/useListFilters";
import useRemoteData from "@/shared/hooks/useRemoteData";
import { searchRows, sortRows } from "@/shared/utils/listUtils";
import { getPendingPaymentTableData } from "@/apps/telecalling/services/pendingPaymentTableService";

const DEFAULT_FILTERS = {
    course_name_id: 0,
    course_plan_id: 0,
    payment_stage_id: 0,
    pending_amount_id: 0,
    course_time_id: 0,
};

const parseRows = (res) => res?.data?.data || [];
const NO_ROWS = [];

const PendingPayments = () => {
    const { hasPermission } = useAuth();

    if (!hasPermission("api_fetch_all_payment") && !hasPermission("feat_payments_collection")) {
        return <Navigate to="/telecalling/dashboard" replace />;
    }
    const { pipelines, selectedPipelineId, handlePipelineChange, isReady } =
        usePipelineSelector("pending_payment");

    const filters = useListFilters("pending", { defaultPeriod: "this_month", defaultFilters: DEFAULT_FILTERS });
    const { selectedFilters, filterType, fromDate, toDate, debouncedSearch, sortType } = filters;

    const buildPayload = () => {
        const payload = {
            search: debouncedSearch || "",
            date_filter_type: filterType,
            sort_type: sortType,
            course_name_id: selectedFilters.course_name_id,
            course_plan_id: selectedFilters.course_plan_id,
            payment_stage_id: selectedFilters.payment_stage_id,
            pending_amount_id: selectedFilters.pending_amount_id,
            course_time_id: selectedFilters.course_time_id,
            pipeline_id: selectedPipelineId || 0,
        };

        // date fields are only sent for a custom range
        if (filterType === "custom" && fromDate && toDate) {
            payload.from_date = fromDate;
            payload.to_date = toDate;
        }
        return payload;
    };

    const { data: tableData, loading } = useRemoteData({
        fetcher: getPendingPaymentTableData,
        params: buildPayload(),
        enabled: isReady && !filters.isRangeIncomplete,
        parse: parseRows,
        initialData: NO_ROWS,
    });

    const rows = sortRows(searchRows(tableData, filters.searchTerm), sortType);

    return (
        <>
            <PendingPaymentHeader
                pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                handlePipelineChange={handlePipelineChange}
            />

            <PendingPaymentStats
            selectedPipelineId={selectedPipelineId}
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
                dropdownCategory="L_FETCH_FILTER_PAYMENT"
                pageName="pending-payments"
                getExportPayload={buildPayload}
                exportRows={tableData}
                selectedPipelineId={selectedPipelineId}
            />

            <PendingPaymentTable
                tableData={rows}
                loading={loading}
                searchTerm={filters.searchTerm}
            />
        </>
    );
};

export default PendingPayments;
