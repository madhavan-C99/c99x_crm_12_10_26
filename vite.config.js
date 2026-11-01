import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || env.VITE_API_BASE_URL;
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : [];

  const proxyConfig = devProxyTarget
    ? {
        "/adm": {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          bypass: (req) => {
            if (req.headers.accept && req.headers.accept.includes("html")) {
              return "/index.html";
            }
          },
        },
        "/telecalling": {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          bypass: (req) => {
            if (req.headers.accept && req.headers.accept.includes("html")) {
              return "/index.html";
            }
          },
        },
        "/admin": {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          bypass: (req) => {
            if (req.headers.accept && req.headers.accept.includes("html")) {
              return "/index.html";
            }
          },
        },
        "/media": {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        },
      }
    : undefined;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        stream: path.resolve(__dirname, "./src/shared/utils/streamPolyfill.js"),
      },
    },
    server: {
      host: "0.0.0.0",
      ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
      ...(proxyConfig ? { proxy: proxyConfig } : {}),
    },
  };
});
