import { test, expect } from "@playwright/test";
import { login } from "./helpers";
import { signInAs, profileIdFor, userA, userB, createTestListing, deleteListing } from "./fixtures";

const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.describe("posting", () => {
  test("creates a listing with all fields via the UI; appears in Browse and persists in Supabase", async ({
    page,
  }) => {
    await login(page);
    const title = `E2E post-flow listing ${Date.now()}`;

    await page.goto("/create");
    await page.getByLabel("Title *").fill(title);
    await page.getByLabel("Description *").fill("A full end-to-end test listing with every field filled in.");
    await page.getByLabel("Category *").click();
    await page.getByRole("option", { name: "Textbooks" }).click();
    await page.getByText("Good", { exact: true }).click();
    await page.getByLabel("Price (USD) *").fill("42.50");

    await page.getByRole("button", { name: "Post Item" }).click();
    await page.waitForURL("**/my-listings", { timeout: 10000 });
    await expect(page.getByText(title)).toBeVisible();

    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const { data, error } = await clientA
      .from("listings")
      .select("*")
      .eq("seller_id", userAId)
      .eq("title", title)
      .single();

    expect(error).toBeNull();
    expect(data?.description).toBe("A full end-to-end test listing with every field filled in.");
    expect(data?.category).toBe("Textbooks");
    expect(data?.condition).toBe("Good");
    expect(Number(data?.price)).toBe(42.5);
    expect(data?.status).toBe("available");

    await deleteListing(clientA, data!.id);
  });

  test("blocks submission when a required field is missing (title) — no listing is created", async ({ page }) => {
    await login(page);
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const uniqueMarker = `E2E missing-title guard ${Date.now()}`;

    await page.goto("/create");
    // Title deliberately left blank.
    await page.getByLabel("Description *").fill(uniqueMarker);
    await page.getByLabel("Category *").click();
    await page.getByRole("option", { name: "Textbooks" }).click();
    await page.getByLabel("Price (USD) *").fill("10");
    await page.getByRole("button", { name: "Post Item" }).click();

    // Native HTML5 required-field validation blocks the submit — no
    // navigation, no network call, no row.
    await expect(page).toHaveURL(/\/create$/);
    const { data } = await clientA.from("listings").select("id").eq("seller_id", userAId).eq("description", uniqueMarker);
    expect(data ?? []).toEqual([]);
  });

  test("blocks submission when no category is selected (Post Item stays disabled)", async ({ page }) => {
    await login(page);
    await page.goto("/create");
    await page.getByLabel("Title *").fill("Category-less listing attempt");
    await page.getByLabel("Description *").fill("Should not be postable without a category.");
    await page.getByLabel("Price (USD) *").fill("10");

    await expect(page.getByRole("button", { name: "Post Item" })).toBeDisabled();
  });

  test("blocks submission with an invalid price (negative)", async ({ page }) => {
    await login(page);
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const uniqueMarker = `E2E negative-price guard ${Date.now()}`;

    await page.goto("/create");
    await page.getByLabel("Title *").fill(uniqueMarker);
    await page.getByLabel("Description *").fill("Should be blocked by min=0 validation.");
    await page.getByLabel("Category *").click();
    await page.getByRole("option", { name: "Textbooks" }).click();
    await page.getByLabel("Price (USD) *").fill("-5");
    await page.getByRole("button", { name: "Post Item" }).click();

    await expect(page).toHaveURL(/\/create$/);
    const { data } = await clientA.from("listings").select("id").eq("seller_id", userAId).eq("title", uniqueMarker);
    expect(data ?? []).toEqual([]);
  });

  test("uploads a photo; it persists and displays after posting", async ({ page }) => {
    await login(page);
    const title = `E2E photo-upload listing ${Date.now()}`;

    await page.goto("/create");
    await page.getByLabel("Title *").fill(title);
    await page.getByLabel("Description *").fill("Has a real photo attached.");
    await page.getByLabel("Category *").click();
    await page.getByRole("option", { name: "Textbooks" }).click();
    await page.getByLabel("Price (USD) *").fill("15");
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-image.png",
      mimeType: "image/png",
      buffer: ONE_PX_PNG,
    });
    // Two elements share alt="Preview" (main form card + sidebar thumbnail) — .first() is fine, we just want proof a preview rendered.
    await expect(page.getByAltText("Preview").first()).toBeVisible();

    await page.getByRole("button", { name: "Post Item" }).click();
    await page.waitForURL("**/my-listings", { timeout: 10000 });

    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const { data } = await clientA.from("listings").select("*").eq("seller_id", userAId).eq("title", title).single();
    expect(data?.image_url, "image_url should be set after a successful upload").toBeTruthy();

    // The listing card in My Listings should render that same image, not a broken/placeholder src.
    const img = page.locator(`img[alt="${title}"]`);
    await expect(img).toBeVisible();
    const src = await img.getAttribute("src");
    expect(src).toContain(data!.image_url);

    await deleteListing(clientA, data!.id);
  });

  test("a wrong file type is rejected with a visible error, not silently dropped", async ({ page }) => {
    await login(page);
    await page.goto("/create");
    await page.getByLabel("Title *").fill(`E2E bad-filetype ${Date.now()}`);
    await page.getByLabel("Description *").fill("Attaching a disallowed file type.");
    await page.getByLabel("Category *").click();
    await page.getByRole("option", { name: "Textbooks" }).click();
    await page.getByLabel("Price (USD) *").fill("10");

    // Bypasses the file picker's `accept` filter entirely — exactly what a
    // malicious or just-non-standard client could do, since `accept` is a
    // UI hint, not a security boundary. The real boundary is the Storage
    // bucket's allowed_mime_types.
    await page.locator('input[type="file"]').setInputFiles({
      name: "not-an-image.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("this is not an image"),
    });

    await page.getByRole("button", { name: "Post Item" }).click();
    await expect(page).toHaveURL(/\/create$/, { timeout: 10000 });
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 10000 });
  });

  test("an oversized file is rejected with a visible error, not silently dropped", async ({ page }) => {
    await login(page);
    await page.goto("/create");
    await page.getByLabel("Title *").fill(`E2E oversized-file ${Date.now()}`);
    await page.getByLabel("Description *").fill("Attaching a file over the 5MB limit.");
    await page.getByLabel("Category *").click();
    await page.getByRole("option", { name: "Textbooks" }).click();
    await page.getByLabel("Price (USD) *").fill("10");

    const oversized = Buffer.alloc(6 * 1024 * 1024, 1); // 6MB, over the bucket's 5MB file_size_limit
    await page.locator('input[type="file"]').setInputFiles({
      name: "oversized.png",
      mimeType: "image/png",
      buffer: oversized,
    });

    await page.getByRole("button", { name: "Post Item" }).click();
    await expect(page).toHaveURL(/\/create$/, { timeout: 15000 });
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("editing", () => {
  test("editing your own item persists changes and re-renders", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, {
      title: `E2E editable listing ${Date.now()}`,
      price: 20,
    });

    await login(page);
    await page.goto(`/my-listings/${listing.id}/edit`);
    await expect(page.getByLabel("Title *")).toHaveValue(listing.title);

    const newTitle = `${listing.title} (edited)`;
    await page.getByLabel("Title *").fill(newTitle);
    await page.getByLabel("Price (USD) *").fill("35");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await page.waitForURL("**/my-listings", { timeout: 10000 });
    await expect(page.getByText(newTitle)).toBeVisible();
    await expect(page.getByText("$35")).toBeVisible();

    const { data } = await clientA.from("listings").select("title, price").eq("id", listing.id).single();
    expect(data?.title).toBe(newTitle);
    expect(Number(data?.price)).toBe(35);

    await deleteListing(clientA, listing.id);
  });

  test("cannot reach the edit form for an item you don't own — redirected back to My Listings", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, { title: `E2E not-your-listing ${Date.now()}` });

    await login(page, userB);
    await page.goto(`/my-listings/${listing.id}/edit`);

    await expect(page).toHaveURL(/\/my-listings$/, { timeout: 10000 });
    // And, belt-and-suspenders, the backend rejects it too even if the redirect were bypassed.
    const attempt = await (await signInAs(userB)).from("listings").update({ title: "HACKED" }).eq("id", listing.id).select();
    expect(attempt.data ?? []).toEqual([]);

    await deleteListing(clientA, listing.id);
  });
});

test.describe("deleting", () => {
  test("deleting your own item removes it from listings and from Supabase", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, { title: `E2E delete-me listing ${Date.now()}` });

    await login(page);
    await page.goto("/my-listings");
    await expect(page.getByText(listing.title)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    const card = page.locator(".overflow-hidden", { hasText: listing.title });
    const deleteResponse = page.waitForResponse(
      (res) => res.url().includes("/rest/v1/listings") && res.request().method() === "DELETE",
    );
    await card.getByTestId("listing-delete-button").click();

    // The UI removes the row optimistically (before the network call
    // resolves) — wait for the actual DELETE response, not just the DOM
    // update, before checking Supabase directly.
    await deleteResponse;
    await expect(page.getByText(listing.title)).not.toBeVisible({ timeout: 10000 });

    const { data } = await clientA.from("listings").select("id").eq("id", listing.id).maybeSingle();
    expect(data, "listing row should be gone from Supabase after delete").toBeNull();
  });
});
