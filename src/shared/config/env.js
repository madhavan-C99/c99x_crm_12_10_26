const stripTrailingSlash = (value = "") => String(value || "").trim().replace(/\/+$/, "");

/** REST base URL, e.g. http://127.0.0.1:8000 (no trailing slash). */
export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_BASE_URL,
);

if (import.meta.env.PROD && !API_BASE_URL) {
  console.error(
    "Configuration Error: VITE_API_BASE_URL is not set in production build. API requests and WebSockets will fail without a valid base URL.",
  );
}

const resolveWsBaseUrl = () => {
  const customWs = stripTrailingSlash(import.meta.env.VITE_WS_BASE_URL);
  if (customWs) {
    return customWs.replace(/^http/, "ws");
  }

  if (API_BASE_URL) {
    return API_BASE_URL.replace(/^http/, "ws");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/^http/, "ws");
  }

  return "ws://localhost:8000";
};

/** WebSocket base URL. http(s) is converted to ws(s) automatically. */
export const WS_BASE_URL = resolveWsBaseUrl();

export const LOGIN_PATH = "/login";
