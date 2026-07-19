import { execFileSync } from "node:child_process";

/**
 * Runs a read-only SQL query against the linked Supabase project via the
 * Supabase CLI (`supabase db query --linked`), for introspection that the
 * PostgREST API can't do (pg_catalog isn't exposed over REST). Requires
 * `npx supabase login` + `supabase link` to already be set up locally —
 * see SETUP.md. Not usable in a CI environment without that auth.
 */
export function dbQuery<T = Record<string, unknown>>(sql: string): T[] {
  const stdout = execFileSync("npx", ["--yes", "supabase", "db", "query", "--linked", sql], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "ignore"],
    encoding: "utf-8",
    timeout: 30_000,
  });
  const parsed = JSON.parse(stdout) as { rows: T[] };
  return parsed.rows;
}
