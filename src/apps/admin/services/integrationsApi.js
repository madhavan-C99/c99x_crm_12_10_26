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
 * Cache connected accounts and their pages
 */
const connectedAccountsMap = new Map();

/**
 * In-memory connection store (persists across tab switches during session, no localStorage used)
 */
let inMemoryConnections = [
  {
    id: "conn_meta_01",
    pipelineId: 1,
    pipelineName: "Education Pipeline",
    pageId: "page_meta_101",
    pageName: "Code99 Academy Page",
    facebookAccount: {
      id: "fb_acc_01",
      name: "Alex Johnson (Marketing Admin)",
      email: "alex.marketing@code99.edu",
    },
    routing: {
      type: "new",
      campaignName: "Meta Lead Ads - Q4",
      campaignId: null,
    },
    formMode: "specific",
    formIds: ["form_fbd_01", "form_fbd_02"],
    forms: [
      { id: "form_fbd_01", name: "Full Stack Course Inquiry 2026", leadCount: 342, status: "active" },
      { id: "form_fbd_02", name: "Data Science Bootcamp Instant Form", leadCount: 189, status: "active" },
    ],
    fieldMapping: {
      full_name: "Name",
      phone_number: "Phone",
      email: "Email",
      city: "City",
    },
    webhookUrl: "https://api.crm.code99.com/api/v1/integrations/meta/webhook/wh_meta_8849204",
    status: "active",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

/**
 * 1. Fetch available campaigns
 * TODO: Replace with real endpoint: /adm/get_campaigns or use dropdownService
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
    console.warn("API getCampaigns failed, falling back to mock data:", err);
  }
  return [
    { id: 1, name: "Meta Lead Ads - Fullstack" },
    { id: 2, name: "Instagram Stories - Data Science" },
    { id: 3, name: "Google Search Ads" },
    { id: 4, name: "Organic Website Campaign" },
  ];
};

/**
 * 2. Create a new campaign
 * TODO: Replace with real endpoint: /adm/create_campaign
 */
export const createCampaign = async (name, pipelineId) => {
  try {
    const res = await api.post("/adm/create_campaign", { campaign_name: name, pipeline_id: pipelineId });
    if (res?.data?.data) return res.data.data;
  } catch (err) {
    console.warn("API createCampaign failed, using fallback:", err);
  }
  return {
    id: `camp_${Date.now()}`,
    name,
    pipeline_id: pipelineId,
    created_at: new Date().toISOString(),
  };
};

/**
 * 3. Fetch Pipelines
 * TODO: Replace with real endpoint: /adm/get_select_options or /adm/settings_pipeline_categories
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
    console.warn("API getPipelines failed, falling back to mock data:", err);
  }
  return [
    { id: 1, name: "Education Pipeline" },
    { id: 2, name: "Corporate Training" },
    { id: 3, name: "Study Abroad Admissions" },
  ];
};

/**
 * 4. Fetch CRM lead fields for field mapping
 * TODO: Replace with real endpoint: /adm/get_lead_fields
 */
export const getCrmFields = async () => {
  return [
    { key: "Name", label: "Lead Name (full_name)" },
    { key: "Phone", label: "Phone Number (mobile_no)" },
    { key: "Email", label: "Email Address (email_id)" },
    { key: "City", label: "City / Location" },
    { key: "Course", label: "Course / Program Preference" },
    { key: "Notes", label: "Customer Notes / Inquiry Details" },
  ];
};

/**
 * 5. Official Meta Login / Authentication
 * Triggers real FB.login OAuth 2.0 popup when VITE_META_APP_ID is present,
 * or falls back to demo account in local dev without credentials.
 */
export const loginFacebookUser = async ({ reauthenticate = false } = {}) => {
  const appId = import.meta.env.VITE_META_APP_ID;
  if (appId) {
    try {
      const authResponse = await loginWithFacebook({ reauthenticate });
      const profile = await getFacebookProfile();
      const pages = await getMetaSdkPages();

      const account = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        accessToken: authResponse.accessToken,
      };

      connectedAccountsMap.set(account.id, { account, pages });
      return { account, pages };
    } catch (err) {
      console.error("[Meta SDK] Facebook Login error:", err);
      throw err;
    }
  }

  // Graceful development fallback when VITE_META_APP_ID is not configured
  console.info("[Meta SDK] VITE_META_APP_ID not found in .env; utilizing local mock account.");
  const mockAccounts = await getFacebookAccounts();
  const account = reauthenticate ? mockAccounts[1] : mockAccounts[0];
  const pages = await getFacebookPages(account.id);
  return { account, pages };
};

/**
 * 5. Fetch Facebook Accounts connected or available
 * Allows switching / re-authenticating with another account
 */
export const getFacebookAccounts = async () => {
  const cached = Array.from(connectedAccountsMap.values()).map((v) => v.account);
  if (cached.length > 0) return cached;

  return [
    {
      id: "fb_acc_01",
      name: "Alex Johnson (Marketing Admin)",
      email: "alex.marketing@code99.edu",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    {
      id: "fb_acc_02",
      name: "Sarah Miller (Growth Agency)",
      email: "sarah.agency@mediawave.io",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    },
  ];
};

/**
 * 6. Fetch Facebook Pages for an account
 */
export const getFacebookPages = async (accountId = "fb_acc_01") => {
  if (connectedAccountsMap.has(accountId)) {
    return connectedAccountsMap.get(accountId).pages || [];
  }

  if (accountId === "fb_acc_02") {
    return [
      { id: "page_agency_201", name: "Global EdTech Leads Page", followers: "34K", category: "Education" },
      { id: "page_agency_202", name: "Career Accelerator Club", followers: "12K", category: "Community" },
    ];
  }
  return [
    { id: "page_meta_101", name: "Code99 Academy Page", followers: "24.5K", category: "Education" },
    { id: "page_meta_102", name: "Code99 Tech Careers", followers: "15.2K", category: "Consulting & Training" },
    { id: "page_meta_103", name: "Future Engineers Hub", followers: "8.1K", category: "School & University" },
  ];
};

/**
 * 7. Fetch Instant Lead Forms for a Facebook Page
 */
export const getPageForms = async (pageId, pageAccessToken) => {
  // If real page access token or appId exists, try real Meta Graph API
  const appId = import.meta.env.VITE_META_APP_ID;
  if (appId) {
    try {
      const realForms = await getMetaSdkForms(pageId, pageAccessToken);
      if (Array.isArray(realForms) && realForms.length > 0) {
        return realForms;
      }
    } catch (err) {
      console.warn("[Meta SDK] Failed to fetch forms from Graph API, using fallback:", err);
    }
  }

  if (pageId === "page_meta_102") {
    return [
      { id: "form_careers_01", name: "Career Transition Quick Apply Form", leadCount: 142, status: "active" },
      { id: "form_careers_02", name: "Weekend Workshop Registration", leadCount: 96, status: "active" },
    ];
  }
  if (pageId === "page_agency_201" || pageId === "page_agency_202") {
    return [
      { id: "form_agency_01", name: "Global Scholarship Application 2026", leadCount: 520, status: "active" },
      { id: "form_agency_02", name: "Direct Admission Counseling Form", leadCount: 310, status: "active" },
    ];
  }
  return [
    { id: "form_fbd_01", name: "Full Stack Course Inquiry 2026", leadCount: 342, status: "active" },
    { id: "form_fbd_02", name: "Data Science Bootcamp Instant Form", leadCount: 189, status: "active" },
    { id: "form_fbd_03", name: "Free Masterclass Webinar Form", leadCount: 412, status: "active" },
    { id: "form_fbd_04", name: "Campus Walk-in Brochure Request", leadCount: 78, status: "active" },
  ];
};

/**
 * 8. Fetch active connections
 * TODO: Replace with real endpoint: /adm/integrations/facebook/connections
 */
export const getConnections = async () => {
  try {
    const res = await api.get("/adm/integrations/facebook/connections").catch(() => null);
    if (res?.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (err) {
    console.warn("API getConnections failed, using in-memory state:", err);
  }
  return [...inMemoryConnections];
};

/**
 * 9. Create a new Facebook & Instagram connection
 * TODO: Replace with real endpoint: /adm/integrations/facebook/create_connection
 */
export const createConnection = async (payload) => {
  try {
    const res = await api.post("/adm/integrations/facebook/create_connection", payload).catch(() => null);
    if (res?.data?.data) {
      inMemoryConnections.unshift(res.data.data);
      return res.data.data;
    }
  } catch (err) {
    console.warn("API createConnection failed, saving in-memory:", err);
  }

  const generatedId = `conn_meta_${Date.now()}`;
  const webhookUrl = `https://api.crm.code99.com/api/v1/integrations/meta/webhook/wh_meta_${Math.random().toString(36).substring(2, 9)}`;

  const newConnection = {
    id: generatedId,
    pipelineId: payload.pipelineId,
    pipelineName: payload.pipelineName || "Education Pipeline",
    pageId: payload.pageId,
    pageName: payload.pageName,
    facebookAccount: payload.facebookAccount,
    routing: payload.routing,
    formMode: payload.formMode,
    formIds: payload.formIds || [],
    forms: payload.forms || [],
    fieldMapping: payload.fieldMapping,
    webhookUrl,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  inMemoryConnections = [newConnection, ...inMemoryConnections];
  return newConnection;
};

/**
 * 10. Delete / Disconnect connection
 * TODO: Replace with real endpoint: /adm/integrations/facebook/delete_connection
 */
export const deleteConnection = async (connectionId) => {
  try {
    await api.post("/adm/integrations/facebook/delete_connection", { connection_id: connectionId }).catch(() => null);
  } catch (err) {
    console.warn("API deleteConnection failed, removing from in-memory:", err);
  }
  inMemoryConnections = inMemoryConnections.filter((c) => c.id !== connectionId);
  return { success: true };
};
