import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    // env.ts caches at module scope; tests that mutate process.env must reset it.
    unstubEnvs: true,
    clearMocks: true,
    restoreMocks: true,
    reporters: process.env.CI ? ["default"] : ["default"],
  },
});
