import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Standalone config — works without Replit environment variables.
// Use this when running outside of Replit: `vite --config vite.config.standalone.ts`
const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Resolve the workspace API client to the local source
      "@workspace/api-client-react": path.resolve(
        import.meta.dirname,
        "../../lib/api-client-react/src/index.ts"
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    // Proxy API calls to the Express backend
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from the lib directory (workspace packages)
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "../../lib"),
      ],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
