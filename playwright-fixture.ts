// Re-export the base fixture.
// `lovable-agent-playwright-config` is a Lovable platform-internal package
// not resolvable outside Lovable's own cloud environment (see
// playwright.config.ts for detail) — re-export straight from @playwright/test
// instead so this fixture resolves in any environment.
// Override or extend test/expect here if needed.
export { test, expect } from "@playwright/test";
