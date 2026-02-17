import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router-dom")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@supabase/")) return "supabase";
          if (id.includes("@dnd-kit/")) return "dnd";
          if (id.includes("html2canvas")) return "html2canvas";
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("/zod/")) return "zod";
          if (id.includes("/lodash/")) return "lodash";
          return "vendor";
        },
      },
    },
  },
});
