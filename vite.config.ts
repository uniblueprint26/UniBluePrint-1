import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import sitemap from "vite-plugin-sitemap";

// This list feeds vite-plugin-sitemap, which generates dist/sitemap.xml at build time and
// overwrites the hand-maintained public/sitemap.xml with it — so every real, public,
// indexable route needs to be here or it silently drops out of the sitemap that actually
// ships. Keep this in sync with src/App.jsx's public routes. Excluded on purpose: anything
// gated (admin/*, portal/*), auth-flow pages already in robots.txt's Disallow list
// (sign-in/up already listed below only because they predate that decision — the others,
// reset-password/subscription-management/subscription-success/verify-email, are correctly
// left out), and /blog/:slug (dynamic, not a static path this array can enumerate).
const ROUTES = [
  "/",
  "/about",
  "/how-it-works",
  "/behind-the-blueprint",
  "/foundation-blueprint",
  "/elevation-blueprint",
  "/lifestyle-blueprint",
  "/campus-connect",
  "/course-connect",
  "/course-compass",
  "/budgeting",
  "/ad-board",
  "/partners",
  "/pricing",
  "/free-trial",
  "/for-universities",
  "/for-businesses",
  "/join",
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
