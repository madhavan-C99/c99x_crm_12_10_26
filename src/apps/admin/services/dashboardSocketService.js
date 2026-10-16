import { WS_BASE_URL } from "@/shared/config/env";

/**
 * Dashboard WebSocket Service
 * Handles live bidirectional communication between the Admin Dashboard and the backend.
 * Connects once on component mount, sends filter changes without disconnecting, and cleans up on unmount.
 */

export function connectDashboardSocket({
  token,
  initialPipelineId = 1,
  initialCampaignId = null,
  initialDateFilter = "Today",
  onMessage,
  onStatusChange,
}) {
  const authToken = token || localStorage.getItem("token") || "";
  let socket = null;
  let isClosedManually = false;
  let reconnectTimer = null;
  let hasSubscribed = false;

  // Track latest filter parameters to ensure initial subscribe and reconnections send the right filters
  let currentFilters = {
    pipeline_id: initialPipelineId,
    campaign_id: initialCampaignId === "all" ? null : initialCampaignId,
    date_filter: initialDateFilter,
  };

  const getWsUrl = () => {
    const base = WS_BASE_URL || "ws://localhost:8000";
    return `${base}/ws/admin/dashboard/?token=${encodeURIComponent(authToken)}`;
  };

  const connect = () => {
    if (isClosedManually) return;

    try {
      if (onStatusChange) onStatusChange("connecting");
      socket = new WebSocket(getWsUrl());

      socket.onopen = () => {
        if (onStatusChange) onStatusChange("connected");
        // Always send subscribe_dashboard immediately on connect / reconnect
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              action: "subscribe_dashboard",
              pipeline_id: currentFilters.pipeline_id || 1,
              campaign_id: currentFilters.campaign_id === "all" ? null : currentFilters.campaign_id,
              date_filter: currentFilters.date_filter || "Today",
            })
          );
          hasSubscribed = true;
        }
      };

      socket.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          if (res?.action === "dashboard_update" || res?.payload || res?.data) {
            const payload = res.payload || res.data || res;
            if (onMessage) onMessage(payload);
          }
        } catch (err) {
          console.error("Dashboard WebSocket parse error:", err);
        }
      };

      socket.onerror = (err) => {
        console.warn("Dashboard WebSocket notice (waiting for backend channel):", err);
        if (onStatusChange) onStatusChange("error");
      };

      socket.onclose = () => {
        if (onStatusChange) onStatusChange("disconnected");
        hasSubscribed = false;
        if (!isClosedManually) {
          // Attempt safe auto-reconnect after 5 seconds
          reconnectTimer = setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    } catch (e) {
      console.warn("Dashboard WebSocket init error:", e);
      if (onStatusChange) onStatusChange("error");
    }
  };

  connect();

  const sendFilterChange = (newPipelineId, newCampaignId, newDateFilter) => {
    const cleanCampaignId = newCampaignId === "all" || !newCampaignId ? null : newCampaignId;
    currentFilters = {
      pipeline_id: newPipelineId || currentFilters.pipeline_id || 1,
      campaign_id: cleanCampaignId,
      date_filter: newDateFilter || currentFilters.date_filter || "Today",
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
      if (!hasSubscribed) {
        // If haven't subscribed yet, send subscribe_dashboard
        socket.send(
          JSON.stringify({
            action: "subscribe_dashboard",
            pipeline_id: currentFilters.pipeline_id,
            campaign_id: currentFilters.campaign_id,
            date_filter: currentFilters.date_filter,
          })
        );
        hasSubscribed = true;
      } else {
        // If already connected and subscribed, send filter_change WITHOUT closing socket
        socket.send(
          JSON.stringify({
            action: "filter_change",
            pipeline_id: currentFilters.pipeline_id,
            campaign_id: currentFilters.campaign_id,
            date_filter: currentFilters.date_filter,
          })
        );
      }
    }
  };

  const disconnect = () => {
    isClosedManually = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (socket) {
      socket.close();
      socket = null;
    }
    if (onStatusChange) onStatusChange("closed");
  };

  return {
    sendFilterChange,
    disconnect,
  };
}
