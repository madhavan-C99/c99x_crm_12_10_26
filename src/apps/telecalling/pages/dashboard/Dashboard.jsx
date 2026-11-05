import { useState, useEffect } from "react";
import CourseAvailabilityTable from "@/apps/telecalling/components/dashboard/CourseAvailabilityTable";
import DashboardBottomCards from "@/apps/telecalling/components/dashboard/DashboardBottomCards";
import { DashboardsCards } from "@/apps/telecalling/components/dashboard/DashboardsCards";
import PipelineChart from "@/apps/telecalling/components/dashboard/PipelineChart";
import usePipelineSelector from "@/apps/telecalling/hooks/usePipelineSelector";

function Dashboard() {
    // PIPELINE SELECTOR HOOK
    const {
        pipelines,
        selectedPipelineId,
        handlePipelineChange,
    } = usePipelineSelector("dashboard");

    const [filterType, setFilterType] = useState(() => {
        return sessionStorage.getItem("dashboard_filterType") || "this_month";
    });
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        sessionStorage.setItem("dashboard_filterType", filterType);
    }, [filterType]);

    return (
        <>
            <DashboardsCards
                pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                handlePipelineChange={handlePipelineChange}
                filterType={filterType}
                setFilterType={setFilterType}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />
            <CourseAvailabilityTable
                selectedPipelineId={selectedPipelineId}
            />
            <PipelineChart
                selectedPipelineId={selectedPipelineId}
                filterType={filterType}
                fromDate={fromDate}
                toDate={toDate}
            />
            <DashboardBottomCards
                selectedPipelineId={selectedPipelineId}
                filterType={filterType}
                fromDate={fromDate}
                toDate={toDate}
            />
        </>
    );
}

export default Dashboard;
