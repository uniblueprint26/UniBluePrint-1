import { test, expect } from "../playwright-fixture";

// Smoke test: verifies the e2e harness itself works (dev server boots,
// Playwright can drive a real browser against it, and the fixture resolves).
test("home page loads and renders the app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  // The SPA mounts into #root — if this is empty, the bundle failed to boot.
  await expect(page.locator("#root")).not.toBeEmpty();
});
