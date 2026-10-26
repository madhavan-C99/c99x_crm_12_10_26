const stripTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

/** REST base URL, e.g. http://127.0.0.1:8000 (no trailing slash). */
export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_BASE_URL,
);

/** WebSocket base URL. http(s) is converted to ws(s) automatically. */
export const WS_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_WS_BASE_URL || API_BASE_URL,
).replace(/^http/, "ws");

export const LOGIN_PATH = "/telecalling/login";
