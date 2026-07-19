import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { AUTH_CACHE_PATH } from "./global-setup";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env — see .env.example.`);
  }
  return value;
}

export const SUPABASE_URL = () => env("VITE_SUPABASE_URL");
export const SUPABASE_ANON_KEY = () => env("VITE_SUPABASE_ANON_KEY");

export type TestUser = { email: string; password: string };

export const userA: TestUser = {
  get email() {
    return env("E2E_TEST_USER_A_EMAIL");
  },
  get password() {
    return env("E2E_TEST_USER_A_PASSWORD");
  },
};

export const userB: TestUser = {
  get email() {
    return env("E2E_TEST_USER_B_EMAIL");
  },
  get password() {
    return env("E2E_TEST_USER_B_PASSWORD");
  },
};

/** An uninvolved third party — for tests where "not the owner" isn't enough and we need "not a participant at all" (e.g. reading a message between A and B). */
export const userC: TestUser = {
  get email() {
    return env("E2E_TEST_USER_C_EMAIL");
  },
  get password() {
    return env("E2E_TEST_USER_C_PASSWORD");
  },
};

/**
 * A Supabase client authenticated as a real test user via the public anon
 * key — i.e. exactly what an attacker armed only with devtools and the
 * anon key (which ships in the built JS bundle) would have. Used to probe
 * RLS/ownership directly, bypassing the UI entirely.
 *
 * Cached per (worker process, email): many spec files call this several
 * times per file for the same user, and Supabase's auth endpoint has a
 * request-rate limit that a full parallel run can hit if every call
 * re-authenticates from scratch. The cached client's session auto-refreshes
 * as needed, so reusing it is also just correct, not merely faster.
 */
const clientCache = new Map<string, Promise<SupabaseClient>>();

async function establishSession(user: TestUser): Promise<SupabaseClient> {
  // persistSession/detectSessionInUrl default to browser-oriented behavior
  // (localStorage, URL parsing) that doesn't apply in Node — these clients
  // are short-lived and only need the in-memory session.
  const client = createClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  // Restore from global-setup's one-time sign-in instead of hitting
  // signInWithPassword again — that endpoint is what Supabase's auth rate
  // limit actually throttles, and every spec file calling signInAs several
  // times adds up fast across a full run.
  let cachedSession: { access_token: string; refresh_token: string } | undefined;
  try {
    const cache = JSON.parse(readFileSync(AUTH_CACHE_PATH, "utf-8"));
    cachedSession = cache[user.email];
  } catch {
    // No cache on disk (e.g. a single spec file run without globalSetup
    // wired up) — fall through to a real sign-in below.
  }

  if (cachedSession) {
    const { error: setError } = await client.auth.setSession(cachedSession);
    if (!setError && (await client.auth.getUser()).error === null) return client;
  }

  const { data, error } = await client.auth.signInWithPassword(user);
  if (error || !data.session) {
    throw new Error(`Failed to sign in as ${user.email}: ${error?.message}`);
  }
  return client;
}

/**
 * Cached per (worker process, email) — but every call re-verifies the
 * cached client with a cheap getUser() and transparently re-establishes
 * the session if it's gone stale (observed occasionally over a long full
 * suite run, e.g. after many real UI logins for the same shared account
 * elsewhere in the suite), rather than the caller getting a confusing
 * "Auth session missing!" deep inside some later call.
 */
export async function signInAs(user: TestUser): Promise<SupabaseClient> {
  const cached = clientCache.get(user.email);
  if (cached) {
    const client = await cached;
    const { error } = await client.auth.getUser();
    if (!error) return client;
    clientCache.delete(user.email);
  }

  const promise = establishSession(user).catch((err) => {
    clientCache.delete(user.email);
    throw err;
  });
  clientCache.set(user.email, promise);
  return promise;
}

export async function profileIdFor(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error(`Could not resolve current user: ${error?.message}`);
  return data.user.id;
}

/** Creates a listing directly via the DB (bypassing the UI) for fast, isolated test setup. */
export async function createTestListing(
  client: SupabaseClient,
  sellerId: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const schoolIdRes = await client.from("profiles").select("school_id").eq("id", sellerId).single();
  if (schoolIdRes.error) throw schoolIdRes.error;

  const { data, error } = await client
    .from("listings")
    .insert({
      school_id: schoolIdRes.data.school_id,
      seller_id: sellerId,
      title: `E2E fixture listing ${Date.now()}`,
      description: "Created directly by the e2e suite for test setup.",
      category: "Textbooks",
      condition: "Good",
      price: 10,
      ...overrides,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Best-effort cleanup — swallows errors so one missing row doesn't fail a whole afterAll. */
export async function deleteListing(client: SupabaseClient, id: string) {
  await client.from("listings").delete().eq("id", id);
}
