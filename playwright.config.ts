import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PW_PORT ?? 4173);
const BASE_URL = process.env.PW_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__screenshots__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
  },
  expect: {
    // Be tolerant of sub-pixel font/AA noise across machines.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: process.env.PW_SKIP_WEBSERVER
    ? undefined
    : {
        command: `bun run build && bunx vite preview --port ${PORT} --host 127.0.0.1 --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
