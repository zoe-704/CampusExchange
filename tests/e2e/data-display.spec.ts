import { test, expect } from "@playwright/test";
import { login } from "./helpers";
import { signInAs, profileIdFor, userA, userB, userC, createTestListing, deleteListing } from "./fixtures";

test.describe("refresh-free updates", () => {
  test("a listing created directly in Supabase appears in Browse on next client-side navigation, no manual reload", async ({
    page,
  }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, {
      title: `E2E fresh-mount listing ${Date.now()}`,
    });

    await login(page);
    // Land somewhere else first, then navigate to Browse via the nav link
    // (client-side route change, not a full page load) — this proves
    // Browse's fetch-on-mount isn't serving stale/cached data from an
    // earlier mount in this session.
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.locator("nav").getByRole("link", { name: "Browse", exact: true }).click();
    await page.waitForURL(/\/browse$/);

    await expect(page.getByText(listing.title)).toBeVisible({ timeout: 10000 });

    await deleteListing(clientA, listing.id);
  });

  test("editing a listing and navigating back shows the updated data without a manual reload", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, { title: `E2E stale-check listing ${Date.now()}` });

    await login(page);
    await page.goto("/browse");
    await expect(page.getByText(listing.title)).toBeVisible();

    // Edit it directly (simulating the change coming from elsewhere —
    // another tab, another device) and navigate away and back via the nav,
    // not a hard reload.
    const newTitle = `${listing.title} (updated elsewhere)`;
    await clientA.from("listings").update({ title: newTitle }).eq("id", listing.id);

    await page.locator("nav").getByRole("link", { name: "Dashboard", exact: true }).click();
    await page.waitForURL(/\/dashboard$/);
    await page.locator("nav").getByRole("link", { name: "Browse", exact: true }).click();
    await page.waitForURL(/\/browse$/);

    await expect(page.getByText(newTitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(listing.title, { exact: true })).not.toBeVisible();

    await deleteListing(clientA, listing.id);
  });
});

test.describe("other users' listings", () => {
  test("Browse shows listings from other users, not just your own", async ({ page }) => {
    const clientB = await signInAs(userB);
    const userBId = await profileIdFor(clientB);
    const listing = await createTestListing(clientB, userBId, { title: `E2E cross-user listing ${Date.now()}` });

    await login(page, userA); // logged in as A, viewing B's listing
    await page.goto("/browse");

    await expect(page.getByText(listing.title)).toBeVisible({ timeout: 10000 });
    const card = page.locator(".overflow-hidden", { hasText: listing.title });
    await expect(card.getByText("E2E Test User B")).toBeVisible();

    await deleteListing(clientB, listing.id);
  });
});

test.describe("empty states", () => {
  test("a new user with no listings sees the empty My Listings state, not a crash", async ({ page }) => {
    // userC is never given fixture listings by any other spec file.
    await login(page, userC);
    await page.goto("/my-listings");

    await expect(page.getByText("No listings yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Post Your First Item" })).toBeVisible();
    await expect(page.getByText("0", { exact: true }).first()).toBeVisible(); // stats row all zero, not broken
  });

  test("a search with no matches shows the empty state with a working Clear Filters action", async ({ page }) => {
    await login(page);
    await page.goto("/browse");
    await page.getByPlaceholder("Search for items...").fill("zzz-no-such-item-zzz-nonsense-query");

    await expect(page.getByText("No items found matching your criteria")).toBeVisible();
    await page.getByRole("button", { name: "Clear Filters" }).click();
    await expect(page.getByText("No items found matching your criteria")).not.toBeVisible();
  });
});
