import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

if (process.env.npm_lifecycle_event !== "build" && (!rawPort || Number.isNaN(port) || port <= 0)) {
  throw new Error(
    `PORT environment variable is required for dev/preview but was not provided (got: "${rawPort}").`,
  );
}

const basePath = process.env.BASE_PATH ?? "/";

// Always output to ./dist - works for both local and Vercel builds
const outDir = path.resolve(import.meta.dirname, "dist");

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
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
