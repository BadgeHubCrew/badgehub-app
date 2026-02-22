import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import type { CoverageOptions } from "vitest/node";
import * as path from "node:path";
import { isInDebugMode } from "./src/__test__/isInDebugMode";
import { config } from "dotenv";

const coverageConfig: CoverageOptions = {
  reporter: ["text", "json-summary", "json"],
  reportOnFailure: true,
  provider: "v8",
};

export default defineConfig({
  plugins: [...react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    env: {
      NODE_ENV: "test",
      VITE_KEYCLOAK_CLIENT_ID: "test-client",
      VITE_BADGEHUB_API_BASE_URL: "http://localhost:8081",
      VITE_KEYCLOAK_BASE_URL: "http://localhost:8080",
      VITE_KEYCLOAK_REALM: "master",
      VITE_BADGE_SLUGS: "mch2022,why2025",
      ...config({ path: "../backend/.env.test" }).parsed,
    },
    setupFiles: ["./src/setupTests.ts"],
    coverage: coverageConfig,
    testTimeout: isInDebugMode() ? 3600_000 : 5000,
  },
});
