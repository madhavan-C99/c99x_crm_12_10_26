import api from "@/shared/services/axios";
import { getSelectOptions } from "./dropdownService";
import {
  initFacebookSdk,
  loginWithFacebook,
  getFacebookProfile,
  getFacebookPages as getMetaSdkPages,
  getFacebookPageForms as getMetaSdkForms,
} from "./metaSdk";

/**
 * Cache authenticated Facebook accounts and their pages during active session
 */
const connectedAccountsMap = new Map();

/**
 * 1. Fetch available CRM campaigns
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
    console.warn("API getCampaigns failed:", err);
  }
  return [];
};

/**
 * 2. Create a new campaign
 * Endpoint: POST /adm/create_campaign
 */
export const createCampaign = async (name, pipelineId) => {
  const res = await api.post("/adm/create_campaign", {
    campaign_name: name,
    pipeline_id: pipelineId,
  });
  return res?.data?.data;
};

/**
 * 3. Fetch Pipelines
 * Source: Dropdown Service (L_CATEGORIES)
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
    console.warn("API getPipelines failed:", err);
  }
  return [];
};

/**
 * 4. Fetch CRM lead fields for field mapping from Backend API
 * Endpoint: GET /adm/fetch_fb_fields_admin
 */
export const getCrmFields = async () => {
  try {
    const res = await api.get("/adm/fetch_fb_fields_admin");
    if (res?.data?.data && Array.isArray(res.data.data)) {
      return res.data.data.map((f) => ({
        key: f.name || f.key,
        name: f.name || f.key,
        label: f.label || f.name || f.key,
        required: Boolean(f.required),
      }));
    }
  } catch (err) {
    console.warn("API /adm/fetch_fb_fields_admin error:", err);
  }
  return [];
};

/**
 * 5. Official Meta Login / Authentication
 * Uses Meta Facebook JavaScript SDK popup to log in with real Facebook credentials
 */
export const loginFacebookUser = async ({ reauthenticate = false } = {}) => {
  const authResponse = await loginWithFacebook({ reauthenticate });
  const profile = await getFacebookProfile();
  const pages = await getMetaSdkPages();

  const account = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
    accessToken: authResponse.accessToken,
    userID: authResponse.userID,
  };

  connectedAccountsMap.set(account.id, { account, pages });
  return { account, pages };
};

/**
 * 6. Get authenticated Facebook accounts from active session
 */
export const getFacebookAccounts = async () => {
  return Array.from(connectedAccountsMap.values()).map((v) => v.account);
};

/**
 * 7. Fetch Facebook Pages for an authenticated account
 */
export const getFacebookPages = async (accountId) => {
  if (connectedAccountsMap.has(accountId)) {
    return connectedAccountsMap.get(accountId).pages || [];
  }
  return [];
};

/**
 * 8. Fetch Instant Lead Forms for a Facebook Page
 * Source: Meta Graph API /{page-id}/leadgen_forms
 */
export const getPageForms = async (pageId, pageAccessToken) => {
  return await getMetaSdkForms(pageId, pageAccessToken);
};

/**
 * 9. Fetch active connections from Backend
 * Endpoint: GET /adm/integrations/facebook/connections
 */
export const getConnections = async () => {
  try {
    const res = await api.get("/adm/integrations/facebook/connections");
    if (res?.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (err) {
    console.warn("API /adm/integrations/facebook/connections error:", err);
  }
  return [];
};

/**
 * 10. Create a new Facebook & Instagram connection
 * Endpoint: POST /adm/integrations/facebook/create_connection
 */
export const createConnection = async (payload) => {
  const res = await api.post("/adm/integrations/facebook/create_connection", payload);
  return res?.data?.data;
};

/**
 * 11. Delete / Disconnect connection
 * Endpoint: POST /adm/integrations/facebook/delete_connection
 */
export const deleteConnection = async (connectionId) => {
  const cleanId = typeof connectionId === "string" ? connectionId.replace("conn_", "").trim() : connectionId;
  const res = await api.post("/adm/integrations/facebook/delete_connection", {
    connection_id: cleanId,
    connectionId: cleanId,
  });
  return res?.data?.data || { success: true };
};
