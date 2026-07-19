import { test, expect } from "@playwright/test";
import { login } from "./helpers";
import { signInAs, profileIdFor, userA, userB, createTestListing, deleteListing } from "./fixtures";

test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12/13-ish

async function hasHorizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

test.describe("mobile viewport (390x844)", () => {
  test("login and dashboard render without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    expect(await hasHorizontalOverflow(page), "login page overflows horizontally at mobile width").toBe(false);

    await login(page);
    expect(await hasHorizontalOverflow(page), "dashboard overflows horizontally at mobile width").toBe(false);
    await expect(page.getByText("Welcome back,")).toBeVisible();
  });

  test("the mobile menu (hamburger sheet) lists every destination and each link is functional", async ({ page }) => {
    await login(page);

    // The desktop nav bar is hidden at this width; the hamburger trigger is the only way in.
    await expect(page.locator("nav").getByRole("link", { name: "Dashboard", exact: true })).not.toBeVisible();

    const menuButton = page.locator("header button.md\\:hidden");
    await menuButton.click();

    for (const name of ["Dashboard", "Browse", "Post Item", "My Listings", "Saved", "Messages", "Profile"]) {
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(page.getByText("Log out", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Browse", exact: true }).click();
    await page.waitForURL(/\/browse$/, { timeout: 10000 });
    expect(await hasHorizontalOverflow(page), "browse page overflows horizontally at mobile width").toBe(false);
  });

  test("Post Item is reachable and usable from the mobile menu", async ({ page }) => {
    await login(page);

    const menuButton = page.locator("header button.md\\:hidden");
    await menuButton.click();
    await page.getByRole("link", { name: "Post Item" }).click();

    await page.waitForURL(/\/create$/, { timeout: 10000 });
    expect(await hasHorizontalOverflow(page), "create-listing page overflows horizontally at mobile width").toBe(
      false,
    );
    await expect(page.getByLabel("Title *")).toBeVisible();
    await expect(page.getByRole("button", { name: "Post Item" })).toBeVisible();
  });

  test("Buy Now is visible and reachable on an item's page at mobile width", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, { title: `E2E mobile buy-flow ${Date.now()}` });

    await login(page, userB); // a different user than the seller — otherwise Buy Now is correctly disabled ("Your Listing")
    await page.goto(`/item/${listing.id}`);

    expect(await hasHorizontalOverflow(page), "item detail page overflows horizontally at mobile width").toBe(
      false,
    );
    const buyButton = page.getByRole("button", { name: "Buy Now" });
    await expect(buyButton).toBeVisible();
    await buyButton.click();
    await expect(page.getByRole("heading", { name: "Confirm Purchase" })).toBeVisible();

    await deleteListing(clientA, listing.id);
  });

  test("the mobile menu includes logout and it works", async ({ page }) => {
    await login(page);
    const menuButton = page.locator("header button.md\\:hidden");
    await menuButton.click();
    await page.getByText("Log out", { exact: true }).click();

    await page.waitForURL("http://localhost:4173/", { timeout: 10000 });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
