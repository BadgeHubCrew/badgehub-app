import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import * as path from "node:path";

const publicStaticFileDir = "static"

function injectSharedConfigPlugin() {
  return {
    name: "inject-shared-config",
    transformIndexHtml(html: string) {
      if (process.env.VITE_ENABLE_BROWSER_BACKEND !== "true") return html;
      const keycloakBaseUrl =
        process.env.VITE_KEYCLOAK_BASE_URL ?? "https://auth.example.invalid";
      const keycloakRealm = process.env.VITE_KEYCLOAK_REALM ?? "master";
      const config = {
        BADGE_SLUGS: (
          process.env.VITE_BADGE_SLUGS ?? "why2025,troopers23,mch2022"
        ).split(","),
        CATEGORY_NAMES: (
          process.env.VITE_CATEGORY_NAMES ??
          "Uncategorised,Event related,Games,Graphics,Hardware,Utility,Wearable,Data,Silly,Hacking,Troll,Unusable,Adult,Virus,SAO,Interpreter"
        ).split(","),
        ADMIN_CATEGORY_NAMES: (
          process.env.VITE_ADMIN_CATEGORY_NAMES ?? "Default"
        ).split(","),
        BADGEHUB_API_BASE_URL:
          process.env.VITE_BADGEHUB_API_BASE_URL ??
          "https://api.example.invalid",
        keycloakPublic: {
          KEYCLOAK_BASE_URL: keycloakBaseUrl,
          KEYCLOAK_REALM: keycloakRealm,
          KEYCLOAK_CLIENT_ID:
            process.env.VITE_KEYCLOAK_CLIENT_ID ?? "badgehub-frontend",
        },
        isDevEnvironment: process.env.NODE_ENV === "development",
      };
      return html.replace(
        "<!-- __SHARED_CONFIG_SCRIPT_PLACEHOLDER__ -->",
        `<script type="application/javascript">globalThis.__SHARED_CONFIG__ = ${JSON.stringify(config)};</script>`,
      );
    },
  };
}

const browserBackendDefines =
  process.env.VITE_ENABLE_BROWSER_BACKEND === "true"
    ? {
        "import.meta.env.VITE_KEYCLOAK_CLIENT_ID": JSON.stringify(
          process.env.VITE_KEYCLOAK_CLIENT_ID ?? "badgehub-frontend",
        ),
        "import.meta.env.VITE_KEYCLOAK_BASE_URL": JSON.stringify(
          process.env.VITE_KEYCLOAK_BASE_URL ?? "https://auth.example.invalid",
        ),
        "import.meta.env.VITE_KEYCLOAK_REALM": JSON.stringify(
          process.env.VITE_KEYCLOAK_REALM ?? "master",
        ),
        "import.meta.env.VITE_BADGEHUB_API_BASE_URL": JSON.stringify(
          process.env.VITE_BADGEHUB_API_BASE_URL ?? "https://api.example.invalid",
        ),
        "import.meta.env.VITE_BADGE_SLUGS": JSON.stringify(
          process.env.VITE_BADGE_SLUGS ?? "why2025,troopers23,mch2022",
        ),
      }
    : {};

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  define: browserBackendDefines,
  server: {
    host: true,          // bind to all interfaces so remote machines can reach it
    port: 5173,          // fixed port so index-indirect-dev.html can reference it
    cors: true,          // allow the backend origin to load Vite assets
    allowedHosts: true,  // allow any Host header (e.g. op5b.local)
  },
  plugins: [...react(), tsconfigPaths(), injectSharedConfigPlugin()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: publicStaticFileDir + "/entry_[name]-[hash].js",
        chunkFileNames: publicStaticFileDir + "/chunks/[name]-[hash].js",
        assetFileNames: publicStaticFileDir + "/assets/[name]-[hash].[ext]",
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          return null;
        },
      },
    },
  },
});
