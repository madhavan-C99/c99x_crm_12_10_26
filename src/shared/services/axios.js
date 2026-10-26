import axios from "axios";
import { API_BASE_URL, LOGIN_PATH } from "@/shared/config/env";

const REFRESH_URL = "/adm/api/token/refresh/";
const LOGIN_URL = "/adm/create_token";
const IS_NGROK = API_BASE_URL.includes("ngrok");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Custom headers force a CORS pre-flight on every call, so only send this
  // one when we are really talking to an ngrok tunnel.
  if (IS_NGROK) config.headers["ngrok-skip-browser-warning"] = "true";
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

/**
 * Single-flight refresh: if 10 requests fail with 401 at the same time,
 * only ONE refresh call goes out and all of them wait for the same result.
 */
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return Promise.reject(new Error("No refresh token"));

    refreshPromise = axios
      .post(`${API_BASE_URL}${REFRESH_URL}`, { refresh })
      .then((res) => {
        const access = res.data?.data?.access;
        if (!access) throw new Error("Refresh response had no access token");
        localStorage.setItem("token", access);
        return access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const forceLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthCall = [LOGIN_URL, REFRESH_URL].some((u) =>
      original?.url?.includes(u),
    );

    // Wrong password on the login form must NOT trigger refresh / logout.
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthCall
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const newToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      forceLogout();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
