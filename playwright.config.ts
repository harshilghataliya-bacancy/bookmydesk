import { defineConfig } from "@playwright/test";
import path from "path";

export const STORAGE_STATE = path.join(__dirname, "tests/.auth/state.json");

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3001",
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "api-tests",
      testMatch: /api\..+\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: { storageState: STORAGE_STATE },
    },
    {
      name: "e2e-tests",
      testMatch: /e2e\..+\.spec\.ts/,
      dependencies: ["auth-setup"],
      use: { storageState: STORAGE_STATE },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
