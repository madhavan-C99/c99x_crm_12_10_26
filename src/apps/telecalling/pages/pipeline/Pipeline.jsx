import { useEffect, useMemo, useState } from "react";

import PipelineFilters
    from "@/apps/telecalling/components/pipeline/PipelineFilters";

import PipelineHeader
    from "@/apps/telecalling/components/pipeline/PipelineHeader";



import PipelineCards
    from "@/apps/telecalling/components/pipeline/PipelineCards";

import usePipelineSelector from "@/shared/hooks/usePipelineSelector";

function Pipeline() {

            const {
            pipelines,
            selectedPipelineId,
            handlePipelineChange,
            isReady,
        } = usePipelineSelector("pipeline");

    // ✅ sessionStorage la irundhu saved value edukum, illana default "today"
    const [filterType, setFilterType] = useState(
        () => sessionStorage.getItem("pipeline_filterType") || "today"
    );

    const [fromDate, setFromDate] = useState(
        () => sessionStorage.getItem("pipeline_fromDate") || ""
    );

    const [toDate, setToDate] = useState(
        () => sessionStorage.getItem("pipeline_toDate") || ""
    );

    const [payload, setPayload] = useState(() => {
        const saved = sessionStorage.getItem("pipeline_payload");
        return saved
            ? JSON.parse(saved)
            : { date_filter_type: "today" };
    });

    const [refresh, setRefresh] = useState(false);


    const refreshPipeline = () => {
        setRefresh((prev) => !prev);
    };

    const [selectedFilters, setSelectedFilters] = useState(() => {
        const saved = sessionStorage.getItem("pipeline_selectedFilters");
        return saved
            ? JSON.parse(saved)
            : {
                pipeline_stage_id: 0,
                lead_source_id: 0,
                course_name_id: 0,
                priority_id: 0,
                course_plan_id: 0,
                payment_status: 0,
            };
    });

    useEffect(() => {
        sessionStorage.setItem("last_pipeline_path", "/telecalling/pipeline");
    }, []);

    // ✅ ORU VALUE MAARUMBODHU sessionStorage LA SAVE PANNUM

    useEffect(() => {
        sessionStorage.setItem("pipeline_filterType", filterType);
    }, [filterType]);

    useEffect(() => {
        sessionStorage.setItem("pipeline_fromDate", fromDate || "");
    }, [fromDate]);

    useEffect(() => {
        sessionStorage.setItem("pipeline_toDate", toDate || "");
    }, [toDate]);

    useEffect(() => {
        sessionStorage.setItem(
            "pipeline_payload",
            JSON.stringify(payload)
        );
    }, [payload]);

    useEffect(() => {
        sessionStorage.setItem(
            "pipeline_selectedFilters",
            JSON.stringify(selectedFilters)
        );
    }, [selectedFilters]);


    // Stable identity: a new object on every render made PipelineCards refetch each time.
    const cardsPayload = useMemo(
        () => ({ ...payload, ...selectedFilters, pipeline_id: selectedPipelineId }),
        [payload, selectedFilters, selectedPipelineId],
    );

    return (

        <>

            <PipelineHeader />

            <PipelineFilters

                filterType={filterType}
                setFilterType={setFilterType}

                fromDate={fromDate}
                setFromDate={setFromDate}

                toDate={toDate}
                setToDate={setToDate}

                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}

                setPayload={setPayload}
                refreshPipeline={refreshPipeline}

                pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                handlePipelineChange={handlePipelineChange}
            />

            {isReady && (
                <PipelineCards
                    payload={cardsPayload}
                    refresh={refresh}
                />
            )}

        </>
    );
}

export default Pipeline;
