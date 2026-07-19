import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Signs in each shared test account exactly once for the whole run and
// caches the resulting session tokens to disk. Every worker's signInAs()
// (fixtures.ts) restores from this cache via setSession() instead of
// calling signInWithPassword() again — password sign-ins are what
// Supabase's auth rate limit actually throttles, and a full run across
// every spec file, each calling signInAs several times, was hitting it.
const USERS = [
  { key: "A", email: process.env.E2E_TEST_USER_A_EMAIL, password: process.env.E2E_TEST_USER_A_PASSWORD },
  { key: "B", email: process.env.E2E_TEST_USER_B_EMAIL, password: process.env.E2E_TEST_USER_B_PASSWORD },
  { key: "C", email: process.env.E2E_TEST_USER_C_EMAIL, password: process.env.E2E_TEST_USER_C_PASSWORD },
];

export const AUTH_CACHE_PATH = path.join(dirname, ".auth-cache.json");

export default async function globalSetup() {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY must be set — see .env.example.");

  const sessions: Record<string, { access_token: string; refresh_token: string }> = {};

  for (const u of USERS) {
    if (!u.email || !u.password) throw new Error(`E2E_TEST_USER_${u.key}_EMAIL/PASSWORD must be set — see .env.example.`);
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signInWithPassword({ email: u.email, password: u.password });
    if (error || !data.session) {
      throw new Error(`global-setup: failed to sign in as ${u.email}: ${error?.message}`);
    }
    sessions[u.email] = { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
    // Small stagger — even sequential sign-ins in a tight loop can trip a
    // burst limit that a full test run's normal pacing wouldn't.
    await new Promise((r) => setTimeout(r, 300));
  }

  writeFileSync(AUTH_CACHE_PATH, JSON.stringify(sessions, null, 2));
}
