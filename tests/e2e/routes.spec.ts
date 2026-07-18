import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers";

const PROTECTED_ROUTES: Array<{ path: string; heading: string }> = [
  { path: "/dashboard", heading: "Welcome back," },
  { path: "/browse", heading: "Browse Marketplace" },
  { path: "/create", heading: "Post a New Item" },
  { path: "/my-listings", heading: "My Listings" },
  { path: "/saved", heading: "Saved Items" },
  { path: "/messages", heading: "Messages" },
  { path: "/profile", heading: "Profile" },
];

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("unauthenticated route guards", () => {
  for (const { path } of PROTECTED_ROUTES) {
    test(`direct navigation to ${path} redirects to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL("http://localhost:4173/");
      await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    });
  }

  test("/signup is reachable when logged out", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create Your Account" })).toBeVisible();
  });
});

test.describe("authenticated routes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const { path, heading } of PROTECTED_ROUTES) {
    test(`${path} renders via client-side nav and via a hard reload, with no console errors`, async ({ page }) => {
      const errors = collectPageErrors(page);

      // Client-side navigation (SPA route change, no full page load).
      await page.goto(path);
      await expect(page.getByText(heading).first()).toBeVisible();

      // Hard reload on the same route — this is what a real refresh, or a
      // deep link/bookmark, does; it's the case vercel.json's rewrite and
      // (locally) vite preview's SPA fallback exist to support.
      await page.reload();
      await expect(page.getByText(heading).first()).toBeVisible();

      expect(errors, `console errors on ${path}: ${errors.join(", ")}`).toEqual([]);
    });
  }

  test("logged-in user visiting / or /signup is redirected to the dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("http://localhost:4173/dashboard");

    await page.goto("/signup");
    await expect(page).toHaveURL("http://localhost:4173/dashboard");
  });

  test("an unknown route under the app shell shows the not-found page, not a blank screen", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.locator("#root")).not.toBeEmpty();
  });
});
