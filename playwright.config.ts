import { defineConfig, devices } from "@playwright/test";

// `lovable-agent-playwright-config` (previously imported here) is a Lovable
// platform-internal package that is only resolvable inside Lovable's own
// cloud build environment — it is not a real, usable package outside it (its
// published npm artifact is an empty placeholder with no exports). Importing
// it from a standalone checkout like this one made every `playwright test`
// invocation fail before a single test could run. This is a plain,
// self-contained Playwright config so e2e tooling works in any environment.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
