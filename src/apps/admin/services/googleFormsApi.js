import api from "@/shared/services/axios";
import { getSelectOptions } from "./dropdownService";

/**
 * =========================================================================
 * Google Forms Lead Integration - API Service Layer
 * Directly interfaces with CRM Backend Endpoints:
 * Primary:
 * - POST /adm/create_google_form_connection
 * - GET  /adm/fetch_google_form_connections
 * - POST /adm/delete_google_form_connection
 * Fallback (for older backend versions):
 * - POST /adm/create_google_connection_admin
 * - GET  /adm/fetch_google_connections_admin
 * - POST /adm/delete_google_connection_admin
 * =========================================================================
 */

/**
 * Helper to call primary endpoint with automatic fallback
 */
async function callApi(method, primaryUrl, fallbackUrl, data = null) {
  try {
    if (method === "get") {
      return await api.get(primaryUrl, { params: data });
    }
    return await api.post(primaryUrl, data);
  } catch (err) {
    if (err?.response?.status === 404 && fallbackUrl) {
      if (method === "get") {
        return await api.get(fallbackUrl, { params: data });
      }
      return await api.post(fallbackUrl, data);
    }
    throw err;
  }
}

/**
 * 1. Create Google Form Connection
 * Creates a new connection, generates a unique Webhook URL, Secret Key,
 * and the pre-filled ready-to-use Google Apps Script code.
 *
 * @param {Object} payload
 * @param {string} payload.name
 * @param {Object} payload.routing - { type: "existing", campaignId: number } | { type: "new", campaignName: string }
 * @returns {Promise<Object>} { id, uid, name, webhookUrl, secret, scriptCode, status }
 */
export const createGoogleConnection = async (payload) => {
  const res = await callApi(
    "post",
    "/adm/create_google_form_connection",
    "/adm/create_google_connection_admin",
    payload
  );
  return res?.data?.data || res?.data;
};

/**
 * 2. Fetch Google Form Connections
 * Fetches all Google Form connections for the current organization.
 * 
 * @returns {Promise<Array>} List of connection objects
 */
export const getGoogleConnections = async () => {
  try {
    const res = await callApi(
      "get",
      "/adm/fetch_google_form_connections",
      "/adm/fetch_google_connections_admin"
    );
    const data = res?.data?.data || res?.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch Google Form connections:", err);
    return [];
  }
};

/**
 * 3. Delete Google Form Connection
 * Deletes a Google Form connection from the CRM.
 * 
 * @param {number|string} connectionId
 * @returns {Promise<Object>} { status: "deleted" }
 */
export const deleteGoogleConnection = async (connectionId) => {
  const numericId = Number(connectionId) || connectionId;
  const res = await callApi(
    "post",
    "/adm/delete_google_form_connection",
    "/adm/delete_google_connection_admin",
    { connectionId: numericId }
  );
  return res?.data?.data || res?.data;
};

/**
 * 4. Fetch Campaigns for dropdown selection
 * Source: Dropdown Service (L_CAMPAIGN_NAMES)
 * 
 * @returns {Promise<Array>} List of campaigns { id, name }
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
    console.error("API getCampaigns failed:", err);
  }
  return [];
};

/**
 * 5. Fetch Pipelines for category mapping
 * Source: Dropdown Service (L_CATEGORIES)
 * 
 * @returns {Promise<Array>} List of pipelines { id, name }
 */
export const getPipelines = async () => {
  try {
    const res = await getSelectOptions("L_CATEGORIES");
    if (Array.isArray(res) && res.length > 0) {
      return res.map((p) => ({
        id: p.id ?? p.value,
        name: p.label || p.name || String(p),
      }));
    }
  } catch (err) {
    console.error("API getPipelines failed:", err);
  }
  return [];
};
