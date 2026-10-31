import {
  useState,
  useEffect,
} from "react";

import { Box } from "@mui/material";
import { useLocation } from "react-router-dom";
import CallStatusCard from "@/apps/telecalling/components/callDetail/CallStatusCard";
import TimeSection from "@/apps/telecalling/components/callDetail/TimeSection";
import CallOutcomeSection from "@/apps/telecalling/components/callDetail/CallOutcomeSection";
import DisconnectedCall from "@/apps/telecalling/components/callDetail/DisconnectedCall";
import { useParams } from "react-router-dom";

const CallDetailsPage = ({
  setHasPendingCallStatus,
  leadData,
  onTabChange,
}) => {
  const { id } = useParams();

 const [status, setStatus] = useState(() => {
  return localStorage.getItem(`callStatus_${id}`) || "";
});

  const [seconds, setSeconds] = useState(0);

  const [callEnded, setCallEnded] = useState(false);

  const [callStartTime, setCallStartTime] = useState(null);
  const location = useLocation();

  // Restore running call

  useEffect(() => {
    const savedStart = localStorage.getItem(`callStartTime_${id}`);

    const savedEnd = localStorage.getItem(`callEndTime_${id}`);

    const savedStatus = localStorage.getItem(`callStatus_${id}`);

    if (savedStatus) {
      setStatus(savedStatus);
      setHasPendingCallStatus?.(true);
    }

    if (savedStart) {
      const start = Number(savedStart);

      setCallStartTime(start);

      if (savedEnd) {
        const end = Number(savedEnd);

        setCallEnded(true);

        setSeconds(Math.floor((end - start) / 1000));
      } else {
        setCallEnded(false);

        setSeconds(Math.floor((Date.now() - start) / 1000));
      }
    }
  }, [id, location.pathname]);

  // Listen for activeCallChanged event to sync status
  useEffect(() => {
    const syncStatus = () => {
      const savedStatus = localStorage.getItem(`callStatus_${id}`);
      if (savedStatus) {
        setStatus(savedStatus);
        setHasPendingCallStatus?.(true);
      }
    };

    window.addEventListener("activeCallChanged", syncStatus);
    return () => {
      window.removeEventListener("activeCallChanged", syncStatus);
    };
  }, [id]);

  // Timer
  useEffect(() => {
    if (!callStartTime || callEnded) return;

    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime, callEnded]);

  // To make use of popup in the call detailpage

  useEffect(() => {
    const handlePopupEndCall = () => {
      const endTime = localStorage.getItem(`callEndTime_${id}`);

      if (endTime) {
        setCallEnded(true);

        const startTime = localStorage.getItem(`callStartTime_${id}`);

        if (startTime) {
          setSeconds(Math.floor((Number(endTime) - Number(startTime)) / 1000));
        }
      }
    };

    window.addEventListener("callEnded", handlePopupEndCall);

    return () => {
      window.removeEventListener("callEnded", handlePopupEndCall);
    };
  }, [id]);

  const handleStatusChange = (newStatus) => {
    if (
      newStatus === "Connected" ||
      newStatus === "Incoming"
    ) {
      const startTime = Date.now();

      setSeconds(0);

      setCallStartTime(startTime);

      setCallEnded(false);

      localStorage.removeItem(`callEndTime_${id}`);

      localStorage.setItem(`callStartTime_${id}`, startTime);

      localStorage.setItem(`callStatus_${id}`, newStatus);

      localStorage.setItem("activeCallLeadId", id);

      try {
        const leadName =
          (typeof leadData !== "undefined" &&
            (leadData?.full_name || leadData?.name)) ||
          "";
        if (leadName) {
          localStorage.setItem("activeCallLeadName", leadName);
        }
      } catch (e) {
      }

      localStorage.setItem("activeTab", "call_details");

      localStorage.setItem("callPageRoute", window.location.pathname);

      localStorage.setItem("leadId", id);

      // LAST-aa dispatch pannunga
      window.dispatchEvent(new Event("activeCallChanged"));
    }

    setStatus(newStatus);
    if (newStatus) {
      setHasPendingCallStatus?.(true);
    }
    if (newStatus === "Connected") {
      onTabChange?.("lead_form");
    }
  };
  const handleEndCall = () => {
    if (callEnded) return;

    if (!callStartTime) return;

    const endTime = Date.now();

    localStorage.setItem(`callEndTime_${id}`, endTime);

    const duration = Math.floor((endTime - callStartTime) / 1000);

    setSeconds(duration);

    setCallEnded(true);
  };
  const formatTime = () => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");

    const secs = String(seconds % 60).padStart(2, "0");

    return `${mins}:${secs}`;
  };

  const handleCallSaved = () => {
    localStorage.removeItem(`callStartTime_${id}`);

    localStorage.removeItem(`callEndTime_${id}`);

    localStorage.removeItem(`callStatus_${id}`);

    localStorage.removeItem("activeCallLeadId");
    localStorage.removeItem("activeCallLeadName");
    localStorage.removeItem("leadId");
    localStorage.removeItem("activeCallStatus");
    localStorage.setItem("last_pipeline_path", "/crm.c99x.in/telecalling/pipeline");
    localStorage.setItem("lead_return_path", "/crm.c99x.in/telecalling/pipeline");
    localStorage.setItem("activeTab", "lead_view");
    setSeconds(0);

    setCallStartTime(null);

    setCallEnded(false);

    setStatus("");

    setHasPendingCallStatus?.(false);
  };
  const handleCancelCall = () => {
    // 1. Remove EVERY localStorage item that a call status click creates
    //    (handleStatusChange + CallOutcomeSection set these)
    [
      `callStartTime_${id}`,
      `callEndTime_${id}`,
      `callStatus_${id}`,
      `outcomeSaved_${id}`,
      "activeCallLeadId",
      "activeCallLeadName",
      "activeCallStatus",
      "callPageRoute",
      "leadId",
    ].forEach((key) => localStorage.removeItem(key));


    // 2. State-களை ஆரம்ப நிலைக்கு (Reset) கொண்டு வருகிறது
    setSeconds(0);
    setCallStartTime(null);
    setCallEnded(false);
    setStatus("");
    setHasPendingCallStatus?.(false);

    // 3. Header Timer-ஐ புதுப்பிக்கிறது
    window.dispatchEvent(new Event("activeCallChanged"));
  };
  return (
    <Box sx={{ mt: 3 }}>
      <CallStatusCard
        status={status}
        setStatus={handleStatusChange}
        leadId={id}
        onCancelCall={handleCancelCall}
      />

      {(status?.toLowerCase() === "connected" ||
        status?.toLowerCase() === "incoming") && (
        <>
          <TimeSection
            time={formatTime()}
            onEndCall={handleEndCall}
            callEnded={callEnded}
          />

          <CallOutcomeSection
            status={status}
            duration={seconds}
            leadId={id}
            leadData={leadData}
            onCallSaved={handleCallSaved}
          />
        </>
      )}

      {status?.toLowerCase() === "disconnected" && (
        <DisconnectedCall leadId={id} onCallSaved={handleCallSaved} />
      )}
    </Box>
  );
};

export default CallDetailsPage;
