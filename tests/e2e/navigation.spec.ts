import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers";

const NAV_LINKS: Array<{ name: string; url: RegExp }> = [
  { name: "Dashboard", url: /\/dashboard$/ },
  { name: "Browse", url: /\/browse$/ },
  { name: "Post Item", url: /\/create$/ },
  { name: "My Listings", url: /\/my-listings$/ },
  { name: "Saved", url: /\/saved$/ },
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test.describe("nav links resolve to real routes", () => {
  test("every primary header nav link lands on its real route, not 404 or a dead link", async ({ page }) => {
    const errors = collectErrors(page);
    await login(page);

    for (const { name, url } of NAV_LINKS) {
      await page.locator("nav").getByRole("link", { name, exact: true }).click();
      await page.waitForURL(url, { timeout: 10000 });
      await expect(page.getByText("Page Not Found")).not.toBeVisible();
    }

    expect(errors, `console errors while clicking through nav: ${errors.join(", ")}`).toEqual([]);
  });

  test("the logo links back to the dashboard from any page", async ({ page }) => {
    await login(page);
    await page.goto("/profile");
    await page.getByRole("link", { name: /Campus Exchange Logo/ }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
  });

  test("footer quick links (Browse Items, Post an Item, My Listings) resolve to real routes", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");

    const footer = page.locator("footer");
    await footer.getByRole("link", { name: "Browse Items" }).click();
    await page.waitForURL(/\/browse$/, { timeout: 10000 });
    await expect(page.getByText("Page Not Found")).not.toBeVisible();

    await page.goto("/dashboard");
    await footer.getByRole("link", { name: "Post an Item" }).click();
    await page.waitForURL(/\/create$/, { timeout: 10000 });

    await page.goto("/dashboard");
    await footer.getByRole("link", { name: "My Listings" }).click();
    await page.waitForURL(/\/my-listings$/, { timeout: 10000 });
  });

  test("an actually-unknown URL shows the 404 page with a working way back, not a blank/broken layout", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/this-page-does-not-exist-at-all");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Page Not Found")).toBeVisible();
    await page.getByRole("link", { name: "Back to Dashboard" }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
  });
});

test.describe("browser back button", () => {
  test("back button retraces client-side navigation correctly", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.locator("nav").getByRole("link", { name: "Browse", exact: true }).click();
    await page.waitForURL(/\/browse$/);

    await page.locator("nav").getByRole("link", { name: "My Listings", exact: true }).click();
    await page.waitForURL(/\/my-listings$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/browse$/, { timeout: 10000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });

    await page.goForward();
    await expect(page).toHaveURL(/\/browse$/, { timeout: 10000 });
  });

  test("back button after logout does not resurrect a protected page from bfcache", async ({ page }) => {
    await login(page);
    await page.goto("/profile");

    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout-button").click();
    await page.waitForURL("http://localhost:4173/", { timeout: 10000 });

    await page.goBack();
    // Whether the browser serves a bfcache snapshot of /profile or
    // re-runs the router, RequireAuth must not leave protected content
    // on screen for a signed-out session.
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible({ timeout: 10000 });
  });
});
