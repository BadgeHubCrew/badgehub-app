import { config } from "dotenv";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { CoverageOptions } from "vitest/node";
import * as path from "node:path";

const coverageConfig: CoverageOptions = {
  reporter: ["text", "json-summary", "json"],
  reportOnFailure: true,
  provider: "v8",
};

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  test: {
    fileParallelism: false,
    env: {
      ...config({ path: ".env.test" }).parsed,
    },
    coverage: coverageConfig,
  },
});
