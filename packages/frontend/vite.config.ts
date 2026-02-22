import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import * as path from "node:path";

const publicStaticFileDir = "static"

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [...react(), tsconfigPaths()],
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
