import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT;
const preferredPort = rawPort ? Number(rawPort) : 5173;
const resolvedPort = Number.isFinite(preferredPort) && preferredPort > 0 ? preferredPort : 5173;

const basePath = process.env.BASE_PATH ?? "/";

const isBuild = process.env.npm_lifecycle_event === "build";
const outDir = path.resolve(import.meta.dirname, isBuild ? "../../dist" : "dist");

export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];

  if (process.env.npm_lifecycle_event !== "build") {
    const { default: runtimeErrorOverlay } = await import(
      "@replit/vite-plugin-runtime-error-modal"
    );
    plugins.push(runtimeErrorOverlay());
  }

  return {
    base: basePath,
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-firebase": [
              "firebase/app",
              "firebase/auth",
              "firebase/firestore",
            ],
            "vendor-charts": ["recharts"],
            "vendor-motion": ["framer-motion"],
            "vendor-qr": ["html5-qrcode", "qrcode"],
          },
        },
      },
    },
    server: {
      port: resolvedPort,
      strictPort: false,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    preview: {
      port: resolvedPort,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
