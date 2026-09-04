import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import sitemap from "vite-plugin-sitemap";

const ROUTES = [
  "/",
  "/about",
  "/how-it-works",
  "/foundation-blueprint",
  "/elevation-blueprint",
  "/lifestyle-blueprint",
  "/campus-connect",
  "/course-connect",
  "/pricing",
  "/free-trial",
  "/for-universities",
  "/for-businesses",
  "/join-handler",
  "/join-coach",
  "/ambassadors",
  "/faqs",
  "/contact",
  "/help",
  "/download",
  "/coming-soon",
  "/blog",
  "/terms",
  "/privacy",
  "/cookies",
  "/refund-policy",
  "/accessibility",
  "/sign-up",
  "/sign-in",
  "/forgot-password",
  "/ad-board",
  "/behind-the-blueprint",
  "/budgeting",
  "/course-compass",
  "/join",
  "/partners",
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    sitemap({ hostname: "https://uniblueprint.ie", dynamicRoutes: ROUTES }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@supabase")) return "supabase";
          if (id.includes("node_modules/lucide-react")) return "icons";
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
}));
