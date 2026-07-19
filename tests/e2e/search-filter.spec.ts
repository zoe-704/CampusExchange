import { test, expect } from "@playwright/test";
import { login } from "./helpers";
import { signInAs, profileIdFor, userA, userB, createTestListing, deleteListing } from "./fixtures";

// A stable, collision-free marker so assertions don't depend on whatever
// else happens to be in the live marketplace at test time.
const MARK = `Zzyxq${Date.now()}`;

test.describe("search / filter / sort", () => {
  let clientA: import("@supabase/supabase-js").SupabaseClient;
  let userAId: string;
  let cheap: Awaited<ReturnType<typeof createTestListing>>;
  let expensive: Awaited<ReturnType<typeof createTestListing>>;
  let electronics: Awaited<ReturnType<typeof createTestListing>>;

  test.beforeAll(async () => {
    clientA = await signInAs(userA);
    userAId = await profileIdFor(clientA);
    cheap = await createTestListing(clientA, userAId, {
      title: `${MARK} Cheap Item`,
      price: 3,
      category: "Textbooks",
    });
    expensive = await createTestListing(clientA, userAId, {
      title: `${MARK} Expensive Item`,
      price: 900,
      category: "Textbooks",
    });
    electronics = await createTestListing(clientA, userAId, {
      title: `${MARK} Electronics Item`,
      price: 50,
      category: "Electronics",
    });

    // Give "Expensive Item" a like so it's the more-popular of the three.
    const clientB = await signInAs(userB);
    const userBId = await profileIdFor(clientB);
    await clientB.from("saved_items").insert({ user_id: userBId, listing_id: expensive.id });
  });

  test.afterAll(async () => {
    const clientB = await signInAs(userB);
    const userBId = await profileIdFor(clientB);
    await clientB.from("saved_items").delete().eq("user_id", userBId).eq("listing_id", expensive.id);
    await Promise.all([cheap, expensive, electronics].map((l) => deleteListing(clientA, l.id)));
  });

  test("search narrows to matching titles only", async ({ page }) => {
    await login(page);
    await page.goto("/browse");
    await page.getByPlaceholder("Search for items...").fill(MARK);

    await expect(page.getByText(`${MARK} Cheap Item`)).toBeVisible();
    await expect(page.getByText(`${MARK} Expensive Item`)).toBeVisible();
    await expect(page.getByText(`${MARK} Electronics Item`)).toBeVisible();

    await page.getByPlaceholder("Search for items...").fill(`${MARK} Cheap`);
    await expect(page.getByText(`${MARK} Cheap Item`)).toBeVisible();
    await expect(page.getByText(`${MARK} Expensive Item`)).not.toBeVisible();
    await expect(page.getByText(`${MARK} Electronics Item`)).not.toBeVisible();
  });

  test("category filter narrows correctly", async ({ page }) => {
    await login(page);
    await page.goto("/browse");
    await page.getByPlaceholder("Search for items...").fill(MARK);

    await page.getByRole("button", { name: "Electronics", exact: true }).click();
    await expect(page.getByText(`${MARK} Electronics Item`)).toBeVisible();
    await expect(page.getByText(`${MARK} Cheap Item`)).not.toBeVisible();
    await expect(page.getByText(`${MARK} Expensive Item`)).not.toBeVisible();

    await page.getByRole("button", { name: "All Items" }).click();
    await expect(page.getByText(`${MARK} Cheap Item`)).toBeVisible();
    await expect(page.getByText(`${MARK} Expensive Item`)).toBeVisible();
  });

  test("sort by price low-to-high and high-to-low reorders matching items correctly", async ({ page }) => {
    await login(page);
    await page.goto("/browse");
    await page.getByPlaceholder("Search for items...").fill(MARK);

    await page.getByRole("combobox").filter({ hasText: "Most Recent" }).click();
    await page.getByRole("option", { name: "Price: Low to High" }).click();

    const cardsAsc = page.locator(".grid > a", { hasText: MARK });
    await expect(cardsAsc.first()).toContainText("Cheap Item");
    await expect(cardsAsc.last()).toContainText("Expensive Item");

    await page.getByRole("combobox").filter({ hasText: "Price: Low to High" }).click();
    await page.getByRole("option", { name: "Price: High to Low" }).click();

    const cardsDesc = page.locator(".grid > a", { hasText: MARK });
    await expect(cardsDesc.first()).toContainText("Expensive Item");
    await expect(cardsDesc.last()).toContainText("Cheap Item");
  });

  test("sort by most popular puts the more-liked item first", async ({ page }) => {
    await login(page);
    await page.goto("/browse");
    await page.getByPlaceholder("Search for items...").fill(MARK);
    // Restrict to the two comparable items to keep ordering unambiguous.
    await page.getByPlaceholder("Search for items...").fill(`${MARK}`);

    await page.getByRole("combobox").filter({ hasText: "Most Recent" }).click();
    await page.getByRole("option", { name: "Most Popular" }).click();

    const cards = page.locator(".grid > a", { hasText: MARK });
    const texts = await cards.allTextContents();
    const expensiveIdx = texts.findIndex((t) => t.includes("Expensive Item"));
    const cheapIdx = texts.findIndex((t) => t.includes("Cheap Item"));
    expect(expensiveIdx).toBeGreaterThanOrEqual(0);
    expect(cheapIdx).toBeGreaterThanOrEqual(0);
    expect(expensiveIdx, "the liked item should sort before the unliked one under Most Popular").toBeLessThan(
      cheapIdx,
    );
  });

  test("clearing filters (via the empty-state action) restores the full list", async ({ page }) => {
    await login(page);
    await page.goto("/browse");
    await page.getByPlaceholder("Search for items...").fill("zzz-guaranteed-no-matches-xyz-123");
    await expect(page.getByText("No items found matching your criteria")).toBeVisible();

    await page.getByRole("button", { name: "Clear Filters" }).click();
    await expect(page.getByPlaceholder("Search for items...")).toHaveValue("");
    await expect(page.getByText("No items found matching your criteria")).not.toBeVisible();
    await expect(page.getByText(`${MARK} Cheap Item`)).toBeVisible();
  });
});
