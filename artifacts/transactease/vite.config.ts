import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isBuilding = process.env.npm_lifecycle_event === "build";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

if (!isBuilding && (!rawPort || Number.isNaN(port) || port <= 0)) {
  throw new Error(
    `PORT environment variable is required for dev/preview but was not provided (got: "${rawPort}").`,
  );
}

const basePath = process.env.BASE_PATH ?? "/";

// During a Vercel build the repo root is the working directory, so we write
// the output to <repo-root>/dist where Vercel's "vite" framework preset
// expects to find it.  During local dev we keep the output inside the package
// so the dev workflow stays self-contained.
const outDir = isBuilding
  ? path.resolve(import.meta.dirname, "../../dist")
  : path.resolve(import.meta.dirname, "dist");

export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];

  if (!isBuilding) {
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
