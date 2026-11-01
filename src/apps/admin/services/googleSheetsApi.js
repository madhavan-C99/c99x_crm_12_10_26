import api from "@/shared/services/axios";
import { API_BASE_URL } from "@/shared/config/env";
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

// Older builds cached connections (including their secrets) in localStorage.
// The backend is the only source of truth now, so purge that cache once.
try {
  localStorage.removeItem("crm_google_sheet_connections");
} catch {
  /* storage unavailable - nothing to purge */
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
  WEBHOOK_URL: "${webhookUrl || `${API_BASE_URL}/adm/google_sheet_webhook`}",
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
 * Backend is the single source of truth. If the backend call fails, the error
 * is thrown so the UI can show it - no fake connection is ever generated.
 */
export const createGoogleSheetConnection = async (payload) => {
  const res = await callApi(
    "post",
    "/adm/create_google_sheet_connection",
    "/adm/create_google_sheet_connection_admin",
    payload,
  );
  const backendData = res?.data?.data || res?.data;

  const id = backendData?.id;
  const uid = backendData?.uid;
  const webhookUrl = backendData?.webhookUrl || backendData?.webhook_url;
  const secret = backendData?.secret;

  if (!id || !webhookUrl || !secret) {
    throw new Error(
      "The server did not return a valid connection (webhook URL / secret missing). Please try again.",
    );
  }

  const scriptCode =
    backendData?.scriptCode ||
    backendData?.script_code ||
    generateSheetAppsScriptCode({
      name: payload.name,
      webhookUrl,
      secret,
    });

  return {
    id,
    uid,
    name: backendData?.name || payload.name,
    routing: payload.routing,
    campaign:
      backendData?.campaign ||
      (payload.routing?.type === "existing"
        ? {
            id: payload.routing.campaignId,
            name:
              payload.campaignName || `Campaign #${payload.routing.campaignId}`,
          }
        : {
            id: payload.routing?.campaignId,
            name: payload.routing?.campaignName,
          }),
    pipeline:
      backendData?.pipeline ||
      payload.pipeline ||
      (payload.pipelineName ? { name: payload.pipelineName } : null),
    webhookUrl,
    secret,
    scriptCode,
    totalLeadsSynced: backendData?.totalLeadsSynced ?? 0,
    status: backendData?.status || "waiting",
    createdAt: backendData?.createdAt || backendData?.created_at || null,
  };
};

/**
 * 2. Fetch Google Sheet Connections
 * Errors are thrown (the page already shows an error state). An empty list
 * from the backend is a real empty list - never replaced by cached data.
 */
export const getGoogleSheetConnections = async () => {
  const res = await callApi(
    "get",
    "/adm/fetch_google_sheet_connections",
    "/adm/fetch_google_sheet_connections_admin",
  );
  const data = res?.data?.data || res?.data;
  return Array.isArray(data) ? data : [];
};

/**
 * 3. Delete Google Sheet Connection
 * Throws if the backend delete fails, so the UI never shows a connection as
 * removed when it still exists on the server.
 */
export const deleteGoogleSheetConnection = async (connectionId) => {
  const numericId = Number(connectionId) || connectionId;
  await callApi(
    "post",
    "/adm/delete_google_sheet_connection",
    "/adm/delete_google_sheet_connection_admin",
    {
      connectionId: numericId,
      connection_id: numericId,
    },
  );
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
