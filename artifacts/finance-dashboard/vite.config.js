import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// Resolving __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Mock alias if workspace API client is needed, avoiding breaking standalone builds
      "@workspace/api-client-react": path.resolve(__dirname, "../../lib/api-client-react/src/index.ts")
    }
  }
});
