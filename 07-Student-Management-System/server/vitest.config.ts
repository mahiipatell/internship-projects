import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Dummy values so config.js import succeeds for unit tests that don't
    // need a real DB. Integration suites set RUN_INTEGRATION_TESTS + a real
    // DATABASE_URL in CI.
    env: {
      JWT_SECRET: "test-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
      // Placeholder keeps config.js importable during test collection. A real
      // test DATABASE_URL is injected via the environment (e.g. CI); it is never
      // sms_dev. Integration suites only connect when RUN_INTEGRATION_TESTS is set.
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test",
    },
    include: ["src/**/*.test.ts"],
  },
});
