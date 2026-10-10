import CourseAvailabilityTable from "@/apps/telecalling/components/dashboard/CourseAvailabilityTable";
import DashboardBottomCards from "@/apps/telecalling/components/dashboard/DashboardBottomCards";
import { DashboardsCards } from "@/apps/telecalling/components/dashboard/DashboardsCards";
import PipelineChart from "@/apps/telecalling/components/dashboard/PipelineChart";
import usePipelineSelector from "@/shared/hooks/usePipelineSelector";

function Dashboard() {
// PIPELINE SELECTOR HOOK
    const {
    pipelines,
    selectedPipelineId,
    handlePipelineChange,
    isReady,
} = usePipelineSelector("dashboard");

    return (
        <>
            <DashboardsCards
            pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                handlePipelineChange={handlePipelineChange}
            />
            <CourseAvailabilityTable
                selectedPipelineId={selectedPipelineId}
            />
            <PipelineChart
                selectedPipelineId={selectedPipelineId}
            />
            <DashboardBottomCards
            selectedPipelineId={selectedPipelineId}
            />
        </>
    );
}

export default Dashboard;
