import api from "@/shared/services/axios";
import { getSelectOptions } from "./dropdownService";

/**
 * =========================================================================
 * Google Sheets Lead Integration - API Service Layer
 * Directly interfaces with CRM Backend Endpoints:
 * Primary:
 * - POST /adm/create_google_sheet_connection
 * - GET  /adm/fetch_google_sheet_connections
 * - POST /adm/delete_google_sheet_connection
 * Fallback:
 * - POST /adm/create_google_sheet_connection_admin
 * - GET  /adm/fetch_google_sheet_connections_admin
 * - POST /adm/delete_google_sheet_connection_admin
 * =========================================================================
 */

const LOCAL_STORAGE_KEY = "crm_google_sheet_connections";

function getLocalSheetConnections() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSheetConnections(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Failed to persist google sheet connections:", err);
  }
}

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
 * Generates an automated Google Apps Script template for Google Sheets
 */
export function generateSheetAppsScriptCode({ name, webhookUrl, secret }) {
  return `/**
 * ===================================================================
 * Google Sheets to CRM Lead Sync Script
 * Connection Name: ${name || "Google Sheet Leads"}
 * ===================================================================
 */

const CRM_CONFIG = {
  WEBHOOK_URL: "${webhookUrl || "https://your-crm-domain/adm/google_sheet_webhook"}",
  SECRET_KEY: "${secret || ""}",
  SHEET_NAME: "" // Leave blank for the first active sheet, or specify sheet tab name (e.g. "Sheet1")
};

/**
 * 1. ONE-TIME SETUP TRIGGER
 * Select this function 'setupAllTriggers' from the dropdown and click Run!
 * Authorize permissions when prompted by Google.
 */
function setupAllTriggers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove existing triggers for this project to avoid duplicates
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < existingTriggers.length; i++) {
    if (existingTriggers[i].getHandlerFunction() === "onRowSubmittedOrEdited") {
      ScriptApp.deleteTrigger(existingTriggers[i]);
    }
  }

  // Create an installable On Form Submit trigger (if sheet receives form responses)
  try {
    ScriptApp.newTrigger("onRowSubmittedOrEdited")
      .forSpreadsheet(ss)
      .onFormSubmit()
      .create();
  } catch (e) {
    Logger.log("No form attached, skipping onFormSubmit trigger");
  }

  // Create an installable On Change trigger (fires on row edits and imports)
  ScriptApp.newTrigger("onRowSubmittedOrEdited")
    .forSpreadsheet(ss)
    .onChange()
    .create();

  SpreadsheetApp.getUi().alert("✅ CRM Lead Sync Trigger successfully activated!");
}

/**
 * 2. AUTOMATED EVENT LISTENER
 * Catches new rows added to the Google Sheet and streams them to CRM.
 */
function onRowSubmittedOrEdited(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = CRM_CONFIG.SHEET_NAME
      ? ss.getSheetByName(CRM_CONFIG.SHEET_NAME)
      : (e && e.range ? e.range.getSheet() : ss.getActiveSheet());

    if (!sheet) return;

    // Get the edited / newly added row index
    let rowIdx = e && e.range ? e.range.getRow() : sheet.getLastRow();
    if (rowIdx <= 1) return; // Ignore header row

    // Fetch column headers from Row 1
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) return;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const rowValues = sheet.getRange(rowIdx, 1, 1, lastCol).getValues()[0];

    // Build lead attributes mapping
    const rowData = {};
    for (let i = 0; i < headers.length; i++) {
      const headerKey = String(headers[i] || "").trim();
      if (headerKey) {
        rowData[headerKey] = rowValues[i];
      }
    }

    const payload = {
      sheetName: sheet.getName(),
      rowNumber: rowIdx,
      data: rowData,
      submittedAt: new Date().toISOString()
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-crm-secret": CRM_CONFIG.SECRET_KEY,
        "Accept": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(CRM_CONFIG.WEBHOOK_URL, options);
    Logger.log("CRM Response Code: " + response.getResponseCode());
  } catch (err) {
    Logger.log("CRM Sync Error: " + err.toString());
  }
}`;
}

/**
 * 1. Create Google Sheet Connection
 */
export const createGoogleSheetConnection = async (payload) => {
  let backendData = null;
  try {
    const res = await callApi(
      "post",
      "/adm/create_google_sheet_connection",
      "/adm/create_google_sheet_connection_admin",
      payload
    );
    backendData = res?.data?.data || res?.data;
  } catch (err) {
    console.warn("Backend create Google sheet connection error, using generator:", err);
  }

  const id = backendData?.id || Date.now();
  const uid = backendData?.uid || `gsheet_${Math.random().toString(36).substring(2, 12)}`;
  const webhookUrl =
    backendData?.webhookUrl ||
    backendData?.webhook_url ||
    `${window.location.origin}/adm/google_sheet_webhook/${uid}`;
  const secret = backendData?.secret || Math.random().toString(36).substring(2, 18);
  const scriptCode =
    backendData?.scriptCode ||
    backendData?.script_code ||
    generateSheetAppsScriptCode({
      name: payload.name,
      webhookUrl,
      secret,
    });

  const connectionObj = {
    id,
    uid,
    name: payload.name,
    routing: payload.routing,
    campaign: payload.routing?.type === "existing"
      ? { id: payload.routing.campaignId, name: payload.campaignName || `Campaign #${payload.routing.campaignId}` }
      : { id: payload.routing?.campaignId || id, name: payload.routing?.campaignName },
    pipeline: payload.pipeline || { name: payload.pipelineName || "Default Pipeline" },
    webhookUrl,
    secret,
    scriptCode,
    totalLeadsSynced: backendData?.totalLeadsSynced ?? 0,
    status: backendData?.status || "waiting",
    createdAt: backendData?.createdAt || new Date().toISOString(),
  };

  // Cache locally
  const list = getLocalSheetConnections();
  const existingIdx = list.findIndex((x) => String(x.id) === String(id));
  if (existingIdx >= 0) {
    list[existingIdx] = connectionObj;
  } else {
    list.unshift(connectionObj);
  }
  saveLocalSheetConnections(list);

  return connectionObj;
};

/**
 * 2. Fetch Google Sheet Connections
 */
export const getGoogleSheetConnections = async () => {
  try {
    const res = await callApi(
      "get",
      "/adm/fetch_google_sheet_connections",
      "/adm/fetch_google_sheet_connections_admin"
    );
    const data = res?.data?.data || res?.data;
    if (Array.isArray(data) && data.length > 0) {
      saveLocalSheetConnections(data);
      return data;
    }
  } catch (err) {
    console.warn("Backend fetch Google Sheet connections unavailable, reading local cache:", err);
  }

  return getLocalSheetConnections();
};

/**
 * 3. Delete Google Sheet Connection
 */
export const deleteGoogleSheetConnection = async (connectionId) => {
  const numericId = Number(connectionId) || connectionId;
  try {
    await callApi(
      "post",
      "/adm/delete_google_sheet_connection",
      "/adm/delete_google_sheet_connection_admin",
      {
        connectionId: numericId,
        connection_id: numericId,
      }
    );
  } catch (err) {
    console.warn("Delete Google Sheet connection error:", err);
  }

  // Remove from local cache
  const list = getLocalSheetConnections().filter(
    (c) => String(c.id) !== String(connectionId) && String(c.uid) !== String(connectionId)
  );
  saveLocalSheetConnections(list);
  return { status: "deleted" };
};

/**
 * 4. Fetch Campaigns for dropdown selection
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
 * 5. Fetch Pipelines
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
