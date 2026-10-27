import api from "@/shared/services/axios";
import { getSelectOptions } from "./dropdownService";

/**
 * =========================================================================
 * WhatsApp CRM Integration - API Service Layer
 * =========================================================================
 * Backend Endpoints (CRM Admin Portal):
 * 1. POST /adm/create_whatsapp_connection_admin  { campaign_id, whatsapp_number, client_name }
 * 2. GET  /adm/fetch_whatsapp_connections_admin  -> [ ...connections ]
 * 3. POST /adm/delete_whatsapp_connection_admin  { connection_id }
 *
 * Public Webhook Endpoints (Chrome Extension):
 * 4. GET  /adm/whatsapp_connect/:token/config
 * 5. POST /adm/whatsapp_connect/:token/leads    { whatsappNumber, leads: [...] }
 * =========================================================================
 */

/**
 * Chrome Web Store extension URL for WhatsApp Lead Sync extension
 */
export const WHATSAPP_EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/whatsapp-lead-sync/placeholder-extension-id";

/**
 * 1. Create a WhatsApp connection and generate connection link
 *
 * @param {Object} params
 * @param {string|number} params.campaignId - CRM Campaign ID
 * @param {string} params.mobile - Normalized mobile number (e.g. 917639761616)
 * @param {string} [params.clientName] - Client / Admin name (defaults to logged-in user or "Code99 Admin")
 * @param {string} [params.campaignName] - Campaign name for display
 * @returns {Promise<Object>} { id, token, connectionUrl, url, clientName, whatsappNumber, campaignId, campaignName, status }
 */
export const createWhatsAppConnection = async ({
  campaignId,
  mobile,
  clientName,
  campaignName = "",
}) => {
  const client_name =
    clientName ||
    localStorage.getItem("username") ||
    localStorage.getItem("client_name") ||
    "Code99 Admin";

  const response = await api.post("/adm/create_whatsapp_connection_admin", {
    campaign_id: Number(campaignId) || campaignId,
    whatsapp_number: String(mobile),
    client_name,
  });

  const resData = response?.data?.data || response?.data;
  const link =
    resData?.connectionUrl ||
    resData?.connection_url ||
    resData?.url ||
    "";

  return {
    ...resData,
    id: resData?.id,
    token: resData?.token,
    url: link,
    connectionUrl: link,
    clientName: resData?.clientName || resData?.client_name || client_name,
    whatsappNumber:
      resData?.whatsappNumber || resData?.whatsapp_number || String(mobile),
    mobile:
      resData?.whatsappNumber || resData?.whatsapp_number || String(mobile),
    campaignId: resData?.campaignId || resData?.campaign_id || campaignId,
    campaignName:
      resData?.campaignName || resData?.campaign_name || campaignName,
    pipelineId: resData?.pipelineId || resData?.pipeline_id,
    status: resData?.status || "pending",
  };
};

/**
 * 2. Fetch all WhatsApp connections for current account
 *
 * @returns {Promise<Array>} List of WhatsApp connection objects
 */
export const getWhatsAppConnections = async () => {
  const response = await api.get("/adm/fetch_whatsapp_connections_admin");
  const rawList = response?.data?.data ?? response?.data;
  const list = Array.isArray(rawList) ? rawList : [];

  return list.map((item) => {
    const link =
      item?.connectionUrl ||
      item?.connection_url ||
      item?.url ||
      "";
    const mobile =
      item?.whatsappNumber ||
      item?.whatsapp_number ||
      item?.mobile ||
      "";
    const campName =
      item?.campaign?.name ||
      item?.campaignName ||
      item?.campaign_name ||
      "";
    const campId =
      item?.campaign?.id ||
      item?.campaignId ||
      item?.campaign_id ||
      "";
    const pipeName =
      item?.pipeline?.name ||
      item?.pipelineName ||
      item?.pipeline_name ||
      "";
    const pipeId =
      item?.pipeline?.id ||
      item?.pipelineId ||
      item?.pipeline_id ||
      "";

    const isConnected =
      item?.is_connected === true ||
      String(item?.status || "").toLowerCase().trim() === "active";

    return {
      ...item,
      id: item?.id,
      token: item?.token,
      url: link,
      connectionUrl: link,
      clientName: item?.clientName || item?.client_name,
      mobile,
      whatsappNumber: mobile,
      campaignId: campId,
      campaignName: campName,
      pipelineId: pipeId,
      pipelineName: pipeName,
      totalLeadsSynced:
        item?.totalLeadsSynced ?? item?.total_leads_synced ?? 0,
      status: item?.status || (isConnected ? "active" : "pending"),
      is_connected: isConnected,
      createdAt:
        item?.createdAt || item?.created_at || new Date().toISOString(),
    };
  });
};

/**
 * 3. Delete / Disconnect a WhatsApp connection
 *
 * @param {string|number} connectionId
 * @returns {Promise<Object>}
 */
export const deleteWhatsAppConnection = async (connectionId) => {
  const response = await api.post("/adm/delete_whatsapp_connection_admin", {
    connection_id: Number(connectionId) || connectionId,
  });
  return response?.data?.data || response?.data || { success: true };
};

/**
 * 4. Extension Handshake Config (Public Webhook for Chrome Extension)
 *
 * @param {string} token - Connection token
 * @returns {Promise<Object>} { clientName, campaignName, whatsappNumber }
 */
export const getWhatsAppExtensionConfig = async (token) => {
  const response = await api.get(`/adm/whatsapp_connect/${token}/config`);
  return response?.data;
};

/**
 * 5. Ingest WhatsApp Leads (Public Webhook for Chrome Extension)
 *
 * @param {string} token - Connection token
 * @param {Object} payload - { whatsappNumber, leads: [...] }
 * @returns {Promise<Object>} { created, duplicates }
 */
export const ingestWhatsAppLeads = async (token, { whatsappNumber, leads }) => {
  const response = await api.post(`/adm/whatsapp_connect/${token}/leads`, {
    whatsappNumber,
    leads,
  });
  return response?.data;
};

/**
 * 6. Fetch Campaigns for dropdown selection
 * Source: Dropdown Service (L_CAMPAIGN_NAMES)
 */
export const getCampaigns = async () => {
  try {
    const res = await getSelectOptions("L_CAMPAIGN_NAMES");
    if (Array.isArray(res) && res.length > 0) {
      return res.map((c) => ({
        id: c.id ?? c.value,
        name: c.label || c.name || c.campaign_name || String(c),
      }));
    }
  } catch (err) {
    console.warn("getCampaigns error:", err);
  }
  return [];
};
