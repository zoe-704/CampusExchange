import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  // The suite shares 3 real Supabase test accounts across every spec file.
  // global-setup.ts signs each in once and caches the session to disk;
  // every worker restores from that cache instead of re-authenticating
  // (Supabase's auth rate limit is what a full parallel run without this
  // was hitting). With workers > 1, multiple worker *processes* still race
  // to restore the same cached refresh token at startup — refresh token
  // rotation then invalidates it for whichever process loses the race.
  // 1 worker sidesteps that entirely; revisit if the suite's runtime
  // becomes a real problem, ideally by giving each worker its own cached
  // session slice rather than raising this back up.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Reuses whatever's already listening on 4173 (e.g. a manually started
  // `npm run preview`) instead of double-starting it; always fresh in CI.
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
