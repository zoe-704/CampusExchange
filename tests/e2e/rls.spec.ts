import { test, expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { signInAs, profileIdFor, userA, userB, userC, createTestListing, deleteListing } from "./fixtures";
import { dbQuery } from "./db-introspect";

const EXPECTED_TABLES = ["profiles", "schools", "listings", "saved_items", "messages", "reports", "orders"];

test.describe("RLS policy inventory (static — flags a missing policy as a security hole)", () => {
  test("every public table has row level security enabled", () => {
    const rows = dbQuery<{ tablename: string; rls_enabled: boolean }>(
      `select relname as tablename, relrowsecurity as rls_enabled
       from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r';`,
    );
    for (const table of EXPECTED_TABLES) {
      const row = rows.find((r) => r.tablename === table);
      expect(row, `table "${table}" not found in public schema`).toBeTruthy();
      expect(row!.rls_enabled, `SECURITY HOLE: RLS is NOT enabled on public.${table}`).toBe(true);
    }
  });

  test("every public table has at least one RLS policy defined", () => {
    const rows = dbQuery<{ tablename: string; policyname: string; cmd: string }>(
      `select tablename, policyname, cmd from pg_policies where schemaname = 'public';`,
    );
    for (const table of EXPECTED_TABLES) {
      const policies = rows.filter((r) => r.tablename === table);
      expect(policies.length, `SECURITY HOLE: public.${table} has RLS enabled but ZERO policies — enabling RLS with no policies denies everyone by default, but if this table has any bypass (a SECURITY DEFINER function, a service-role usage) that's an easy thing to miss; more commonly this means the table is effectively unreachable, which is its own bug.`).toBeGreaterThan(0);
    }
  });

  test("storage.objects has policies scoping the listing-images bucket", () => {
    const rows = dbQuery<{ policyname: string; cmd: string }>(
      `select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects';`,
    );
    const listingImagePolicies = rows.filter((r) => r.policyname.startsWith("listing_images_"));
    expect(
      listingImagePolicies.length,
      "SECURITY HOLE: no RLS policies found on storage.objects for the listing-images bucket — uploads/reads would be governed only by the bucket's public flag.",
    ).toBeGreaterThan(0);
    for (const cmd of ["INSERT", "SELECT"]) {
      expect(
        listingImagePolicies.some((p) => p.cmd === cmd),
        `no storage.objects policy found for ${cmd} on listing-images`,
      ).toBe(true);
    }
  });
});

test.describe("cross-user bypass attempts — direct Supabase client, no UI involved", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let clientC: SupabaseClient;
  let userAId: string;
  let userBId: string;

  test.beforeAll(async () => {
    [clientA, clientB, clientC] = await Promise.all([signInAs(userA), signInAs(userB), signInAs(userC)]);
    [userAId, userBId] = await Promise.all([profileIdFor(clientA), profileIdFor(clientB)]);
  });

  test("profiles: cannot update another user's profile", async () => {
    const before = await clientA.from("profiles").select("full_name").eq("id", userAId).single();
    const attempt = await clientB.from("profiles").update({ full_name: "HACKED BY B" }).eq("id", userAId).select();

    expect(attempt.data ?? [], "B's update matched a row it shouldn't have RLS access to").toEqual([]);

    const after = await clientA.from("profiles").select("full_name").eq("id", userAId).single();
    expect(after.data?.full_name, "profiles.full_name changed despite RLS supposedly blocking the writer").toBe(
      before.data?.full_name,
    );
  });

  test("profiles: system-managed columns (rating, school_id, email, completed_transactions) are reverted even on a self-update", async () => {
    const before = await clientA
      .from("profiles")
      .select("rating, school_id, email, completed_transactions")
      .eq("id", userAId)
      .single();
    expect(before.error).toBeNull();

    const attempt = await clientA
      .from("profiles")
      .update({ rating: 1.0, completed_transactions: 9999, email: "hacked@menloschool.org" })
      .eq("id", userAId)
      .select()
      .single();

    // The row IS the caller's own, so RLS lets the UPDATE through — the
    // protect_profile_fields trigger is what has to revert these columns.
    expect(attempt.error, "self-update on own profile row should not error").toBeNull();
    expect(attempt.data?.rating, "profiles.rating was client-writable — should be system-managed").toBe(
      before.data?.rating,
    );
    expect(
      attempt.data?.completed_transactions,
      "profiles.completed_transactions was client-writable — should only change via order completion",
    ).toBe(before.data?.completed_transactions);
    expect(attempt.data?.email, "profiles.email was client-writable").toBe(before.data?.email);
  });

  test.describe("listings ownership", () => {
    let listingId: string;

    test.beforeAll(async () => {
      const listing = await createTestListing(clientA, userAId, { title: "RLS test listing (listings ownership)" });
      listingId = listing.id;
    });

    test.afterAll(async () => {
      await deleteListing(clientA, listingId);
    });

    test("cannot update a listing you don't own", async () => {
      const attempt = await clientB.from("listings").update({ title: "HACKED BY B" }).eq("id", listingId).select();
      expect(attempt.data ?? []).toEqual([]);

      const after = await clientA.from("listings").select("title").eq("id", listingId).single();
      expect(after.data?.title).toBe("RLS test listing (listings ownership)");
    });

    test("cannot delete a listing you don't own", async () => {
      const attempt = await clientB.from("listings").delete().eq("id", listingId).select();
      expect(attempt.data ?? []).toEqual([]);

      const after = await clientA.from("listings").select("id").eq("id", listingId).maybeSingle();
      expect(after.data, "listing was deleted by a non-owner").not.toBeNull();
    });

    test("views_count/likes_count are reverted even on an owner self-update (system-managed counters)", async () => {
      const before = await clientA.from("listings").select("views_count, likes_count").eq("id", listingId).single();

      const attempt = await clientA
        .from("listings")
        .update({ views_count: 99999, likes_count: 99999 })
        .eq("id", listingId)
        .select()
        .single();

      expect(attempt.error, "owner self-update should not error").toBeNull();
      expect(attempt.data?.views_count, "listings.views_count is client-writable by its own owner").toBe(
        before.data?.views_count,
      );
      expect(attempt.data?.likes_count, "listings.likes_count is client-writable by its own owner").toBe(
        before.data?.likes_count,
      );
    });
  });

  test.describe("saved_items ownership", () => {
    let listingId: string;

    test.beforeAll(async () => {
      const listing = await createTestListing(clientA, userAId, { title: "RLS test listing (saved_items)" });
      listingId = listing.id;
      const { error } = await clientA.from("saved_items").insert({ user_id: userAId, listing_id: listingId });
      expect(error).toBeNull();
    });

    test.afterAll(async () => {
      await clientA.from("saved_items").delete().eq("user_id", userAId).eq("listing_id", listingId);
      await deleteListing(clientA, listingId);
    });

    test("cannot read another user's saved items", async () => {
      const attempt = await clientB.from("saved_items").select("*").eq("user_id", userAId);
      expect(attempt.data ?? []).toEqual([]);
    });

    test("cannot delete another user's saved item", async () => {
      const attempt = await clientB
        .from("saved_items")
        .delete()
        .eq("user_id", userAId)
        .eq("listing_id", listingId)
        .select();
      expect(attempt.data ?? []).toEqual([]);

      const after = await clientA
        .from("saved_items")
        .select("*")
        .eq("user_id", userAId)
        .eq("listing_id", listingId)
        .maybeSingle();
      expect(after.data, "saved_items row was deleted by a non-owner").not.toBeNull();
    });
  });

  test.describe("messages privacy", () => {
    let listingId: string;
    let messageId: string;

    test.beforeAll(async () => {
      const listing = await createTestListing(clientA, userAId, { title: "RLS test listing (messages)" });
      listingId = listing.id;
      const { data, error } = await clientA
        .from("messages")
        .insert({ listing_id: listingId, sender_id: userAId, recipient_id: userBId, body: "original body" })
        .select()
        .single();
      expect(error).toBeNull();
      messageId = data!.id;
    });

    test.afterAll(async () => {
      await clientA.from("messages").delete().eq("id", messageId);
      await deleteListing(clientA, listingId);
    });

    test("an uninvolved third party cannot read a conversation they're not part of", async () => {
      const attempt = await clientC.from("messages").select("*").eq("id", messageId);
      expect(attempt.data ?? []).toEqual([]);
    });

    test("the recipient can mark it read, but cannot rewrite the body via the same update", async () => {
      const attempt = await clientB
        .from("messages")
        .update({ read: true, body: "REWRITTEN BY RECIPIENT" })
        .eq("id", messageId)
        .select()
        .single();

      expect(attempt.error, "recipient marking a message read should not error").toBeNull();
      expect(attempt.data?.read, "read flag should have been settable by the recipient").toBe(true);
      expect(attempt.data?.body, "messages.body was rewritable by the recipient").toBe("original body");
    });
  });

  test.describe("orders", () => {
    let listingId: string;
    let orderId: string;

    test.beforeAll(async () => {
      const listing = await createTestListing(clientA, userAId, { title: "RLS test listing (orders)" });
      listingId = listing.id;
      const { data, error } = await clientB
        .from("orders")
        .insert({ listing_id: listingId, buyer_id: userBId, seller_id: userAId, status: "pending", meetup_location: "Library" })
        .select()
        .single();
      expect(error).toBeNull();
      orderId = data!.id;
    });

    test.afterAll(async () => {
      await clientA.from("orders").delete().eq("id", orderId);
      await deleteListing(clientA, listingId);
    });

    test("an uninvolved third party cannot read an order they're not part of", async () => {
      const attempt = await clientC.from("orders").select("*").eq("id", orderId);
      expect(attempt.data ?? []).toEqual([]);
    });

    test("the buyer cannot unilaterally mark their own order completed", async () => {
      const attempt = await clientB.from("orders").update({ status: "completed" }).eq("id", orderId).select();

      expect(
        attempt.error,
        "buyer-initiated completion should be rejected by restrict_order_updates — a buyer could otherwise credit the seller's stats and mark the item sold without seller confirmation",
      ).not.toBeNull();

      const after = await clientA.from("orders").select("status").eq("id", orderId).single();
      expect(after.data?.status, "order status changed despite the update being rejected").toBe("pending");
    });
  });

  test.describe("reports privacy", () => {
    let listingId: string;
    let reportId: string;

    test.beforeAll(async () => {
      const listing = await createTestListing(clientA, userAId, { title: "RLS test listing (reports)" });
      listingId = listing.id;
      const { data, error } = await clientB
        .from("reports")
        .insert({ listing_id: listingId, reporter_id: userBId, reason: "e2e test report" })
        .select()
        .single();
      expect(error).toBeNull();
      reportId = data!.id;
    });

    test.afterAll(async () => {
      await clientB.from("reports").delete().eq("id", reportId).select();
      await deleteListing(clientA, listingId);
    });

    test("cannot read a report filed by another user", async () => {
      const attempt = await clientA.from("reports").select("*").eq("id", reportId);
      expect(attempt.data ?? []).toEqual([]);
    });
  });
});

test.describe("Storage RLS", () => {
  test("cannot upload into another user's folder", async () => {
    const clientA = await signInAs(userA);
    const userBId = await profileIdFor(await signInAs(userB));

    // A 1x1 PNG, just enough bytes to be a valid upload payload.
    const pngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );

    const attempt = await clientA.storage
      .from("listing-images")
      .upload(`${userBId}/e2e-hack-attempt.png`, pngBytes, { contentType: "image/png" });

    expect(attempt.error, "uploaded into another user's storage folder — folder-ownership RLS is not enforced").not.toBeNull();
  });

  test("can upload into your own folder", async () => {
    const clientA = await signInAs(userA);
    const userAId = await profileIdFor(clientA);
    const path = `${userAId}/e2e-own-folder-${Date.now()}.png`;

    const pngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );

    const attempt = await clientA.storage
      .from("listing-images")
      .upload(path, pngBytes, { contentType: "image/png" });
    expect(attempt.error).toBeNull();

    await clientA.storage.from("listing-images").remove([path]);
  });
});
