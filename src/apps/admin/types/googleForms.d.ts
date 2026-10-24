/**
 * TypeScript Type Definitions for Google Forms CRM Lead Integration
 * Request and Response Shapes matching the API Contract.
 */

export type GoogleConnectionStatus = "waiting" | "active" | "error";

export interface GoogleFormRoutingExisting {
  type: "existing";
  campaignId: number;
}

export interface GoogleFormRoutingNew {
  type: "new";
  campaignName: string;
}

export interface GoogleFormRoutingRule {
  field?: string;
  operator?: "equals" | "contains" | "not_equals";
  value?: string;
  campaignId: number;
}

export interface GoogleFormRoutingRules {
  type: "rules";
  rules: GoogleFormRoutingRule[];
  fallbackCampaignId: number;
}

export type GoogleFormRouting =
  | GoogleFormRoutingExisting
  | GoogleFormRoutingNew
  | GoogleFormRoutingRules;

/**
 * 1. POST /adm/create_google_connection_admin
 */
export interface CreateGoogleConnectionRequest {
  name: string;
  pipelineId?: number;
  routing: GoogleFormRouting;
}

export interface CreateGoogleConnectionData {
  id: number;
  uid: string;
  name: string;
  webhookUrl: string;
  secret: string;
  scriptCode: string;
  status: GoogleConnectionStatus;
}

export interface CreateGoogleConnectionResponse {
  data: CreateGoogleConnectionData;
}

/**
 * 2. GET /adm/fetch_google_connections_admin
 */
export interface GoogleConnectionPipeline {
  id: number;
  name: string;
}

export interface GoogleConnectionCampaign {
  id: number;
  name: string;
}

export interface GoogleConnection {
  id: number;
  uid: string;
  name: string;
  pipeline: GoogleConnectionPipeline;
  campaign: GoogleConnectionCampaign;
  totalLeadsSynced: number;
  failedLeadsCount: number;
  status: GoogleConnectionStatus;
  scriptCode: string;
  secret?: string;
  webhookUrl?: string;
  createdAt: string;
}

export interface FetchGoogleConnectionsResponse {
  data: GoogleConnection[];
}

/**
 * 3. POST /adm/delete_google_connection_admin
 */
export interface DeleteGoogleConnectionRequest {
  connectionId: number;
}

export interface DeleteGoogleConnectionResponse {
  data: {
    status: "deleted";
  };
}

/**
 * Standard API Error Shape
 */
export interface ApiErrorResponse {
  status: "error";
  message: string | Record<string, string[]> | string[];
  code: number;
}
