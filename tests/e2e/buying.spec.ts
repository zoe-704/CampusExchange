import { test, expect } from "@playwright/test";
import { login } from "./helpers";
import { signInAs, profileIdFor, userA, userB, userC, createTestListing, deleteListing } from "./fixtures";

test.describe("buying as a different user", () => {
  test("creates a pending order with the correct buyer/seller in Supabase", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, { title: `E2E buy-flow listing ${Date.now()}` });

    const clientB = await signInAs(userB);
    const userBId = await profileIdFor(clientB);

    await login(page, userB);
    await page.goto(`/item/${listing.id}`);
    await page.getByRole("button", { name: "Buy Now" }).click();
    await page.getByText("Choose a verified location...").click();
    await page.getByRole("option", { name: "Main Library Entrance" }).click();

    const orderResponse = page.waitForResponse(
      (res) => res.url().includes("/rest/v1/orders") && res.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Confirm Purchase" }).click();
    await orderResponse;

    await page.waitForURL(/\/messages/, { timeout: 10000 });

    const { data, error } = await clientA
      .from("orders")
      .select("*")
      .eq("listing_id", listing.id)
      .eq("buyer_id", userBId)
      .single();
    expect(error).toBeNull();
    expect(data?.seller_id).toBe(userAId);
    expect(data?.status).toBe("pending");
    expect(data?.meetup_location).toBe("Main Library Entrance");

    // FINDING: the listing itself is NOT flipped to unavailable by placing
    // an order — only order *completion* does that (sync_order_completion
    // trigger). So immediately after a successful Buy Now, the item is
    // still shown/sellable as available. Documenting actual behavior here
    // rather than asserting behavior the app doesn't implement.
    const { data: listingAfter } = await clientA.from("listings").select("status").eq("id", listing.id).single();
    expect(listingAfter?.status, "documents current behavior: status stays available after a pending order").toBe(
      "available",
    );

    await clientA.from("orders").delete().eq("id", data!.id);
    await deleteListing(clientA, listing.id);
  });
});

test.describe("buying your own item", () => {
  test("Buy Now is disabled in the UI for your own listing", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, { title: `E2E own-item listing ${Date.now()}` });

    await login(page);
    await page.goto(`/item/${listing.id}`);

    const buyButton = page.getByRole("button", { name: "Your Listing" });
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toBeDisabled();

    await deleteListing(clientA, listing.id);
  });

  test("the backend also rejects a self-purchase, bypassing the UI entirely", async () => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const listing = await createTestListing(clientA, userAId, { title: `E2E self-purchase-bypass ${Date.now()}` });

    const attempt = await clientA
      .from("orders")
      .insert({ listing_id: listing.id, buyer_id: userAId, seller_id: userAId, status: "pending", meetup_location: "Library" });

    expect(
      attempt.error,
      "self-purchase should be rejected by orders_buyer_seller_distinct — a buyer_id = seller_id row should never be insertable",
    ).not.toBeNull();

    await deleteListing(clientA, listing.id);
  });
});

test.describe("buying an already-sold item", () => {
  test("Buy Now is disabled and shows Sold once the listing's status flips to sold", async ({ page }) => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const clientB = await signInAs(userB);
    const userBId = await profileIdFor(clientB);
    const listing = await createTestListing(clientA, userAId, { title: `E2E already-sold listing ${Date.now()}` });

    // Get a real order into a sellable-completed state directly (there's no
    // UI affordance to confirm/complete an order — a documented gap — so we
    // set this up the same way the RLS suite does, via the seller's own
    // authenticated client, which is exactly who's allowed to do this).
    const { data: order, error: orderError } = await clientB
      .from("orders")
      .insert({ listing_id: listing.id, buyer_id: userBId, seller_id: userAId, status: "pending", meetup_location: "Library" })
      .select()
      .single();
    expect(orderError).toBeNull();

    const { error: completeError } = await clientA.from("orders").update({ status: "completed" }).eq("id", order!.id);
    expect(completeError).toBeNull();

    const { data: listingAfter } = await clientA.from("listings").select("status").eq("id", listing.id).single();
    expect(listingAfter?.status).toBe("sold");

    // A third party viewing it now sees it as sold and can't buy it.
    await login(page, userC);
    await page.goto(`/item/${listing.id}`);
    const buyButton = page.getByRole("button", { name: "Sold" });
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toBeDisabled();

    await clientA.from("orders").delete().eq("id", order!.id);
    await deleteListing(clientA, listing.id);
  });

  test("the backend rejects a direct order-insert attempt against a sold listing", async () => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const clientB = await signInAs(userB);
    const userBId = await profileIdFor(clientB);
    const clientC = await signInAs(userC);
    const userCId = await profileIdFor(clientC);
    const listing = await createTestListing(clientA, userAId, { title: `E2E sold-backend-bypass ${Date.now()}` });

    const { data: order } = await clientB
      .from("orders")
      .insert({ listing_id: listing.id, buyer_id: userBId, seller_id: userAId, status: "pending", meetup_location: "Library" })
      .select()
      .single();
    await clientA.from("orders").update({ status: "completed" }).eq("id", order!.id);

    const attempt = await clientC
      .from("orders")
      .insert({ listing_id: listing.id, buyer_id: userCId, seller_id: userAId, status: "pending", meetup_location: "Library" });

    expect(attempt.error, "orders_insert_buyer's l.status = 'available' check should reject this").not.toBeNull();

    await clientA.from("orders").delete().eq("id", order!.id);
    await deleteListing(clientA, listing.id);
  });
});
