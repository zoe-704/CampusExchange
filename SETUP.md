# Setup

Campus Exchange is a Vite + React + TypeScript frontend backed directly by
Supabase (Postgres + Auth + Storage + RLS) — no separate API server.

## Prerequisites

- Node.js 18+ and npm
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`npm install -g supabase`, or use `npx supabase`)
- [Docker](https://docs.docker.com/get-docker/) — required to run Supabase locally

## 1. Start Supabase locally

```bash
npx supabase start
```

This boots local Postgres, Auth, Storage, and Studio in Docker, and prints
an API URL + anon key. First run also applies every migration in
`supabase/migrations/` and loads `supabase/seed.sql` automatically.

To re-apply migrations/seed later (e.g. after pulling new migrations, or to
reset to a clean seeded state):

```bash
npx supabase db reset
```

Studio (a web UI for browsing tables, running SQL, etc.) is at
`http://127.0.0.1:54323` once `supabase start` is running.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the output of
`supabase start` (or re-print them anytime with `npx supabase status`).

For a hosted Supabase project instead of local dev, use Project Settings >
API in the Supabase dashboard for these values, and see "Deploying to a
hosted project" below.

## 3. Install dependencies and run

```bash
npm install
npm run dev
```

The site runs at `http://localhost:5173` (or whatever port Vite picks).

Other scripts:

- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`; no build-time type errors are wired
  into `npm run build` itself (matches the original Figma Make export,
  which also skipped type-checking), so run this explicitly in CI/pre-push
  if you want it enforced.

## 4. Sign in with seeded demo data

`supabase/seed.sql` creates several demo Menlo School accounts (all sharing
one password, since it's local-dev-only seed data) and ~20 listings. The
account meant for interactive testing is:

- **Email:** `student@menloschool.org`
- **Password:** `menlo-demo-2026`

That account owns 2 listings (for testing MyListings/Edit/Delete), has 3
message threads, and a couple of saved items already exist for other seeded
users. Or sign up a fresh account — signup accepts any `@menloschool.org`
address and is rejected (client-side and by a database trigger) otherwise.

## Schema and migrations

All schema lives in `supabase/migrations/*.sql`, applied in filename order.
Summary:

| File | Contents |
|---|---|
| `..._extensions_and_helpers.sql` | pgcrypto, a shared `set_updated_at()` trigger function |
| `..._schools.sql` | `schools` table + the one Menlo School row (functional data, not demo content) |
| `..._profiles.sql` | `profiles` (extends `auth.users`), the `current_school_id()` RLS helper, and the signup domain-gate trigger |
| `..._listings.sql` | `listings`, its enums, and the `increment_listing_views()` RPC |
| `..._saved_items.sql` | `saved_items` + a trigger that keeps `listings.likes_count` in sync |
| `..._messages.sql` | `messages` (threaded per listing via `(listing_id, participants)`, no separate threads table) |
| `..._reports.sql` | `reports` (backs the "Flag" dialog) |
| `..._orders.sql` | `orders` (Buy Now flow) + a trigger crediting `profiles.completed_transactions` on completion |
| `..._storage.sql` | the `listing-images` bucket + its RLS policies |

To add a migration: `npx supabase migration new <name>`, edit the generated
file, then `npx supabase db reset` to apply it locally alongside the seed
data.

### Adding a second school

The schema was written so this is a config change, not a refactor: insert a
row into `schools` (name + email domain), and any `@thatdomain` signup is
automatically routed to it by the existing trigger. Every RLS policy already
filters by `school_id = current_school_id()` rather than assuming Menlo.

## Generating TypeScript types

`src/app/lib/database.types.ts` is currently **hand-written** to match the
migrations (there was no live Supabase project to generate against while
building this). Once you have a project running, replace it for real:

```bash
npx supabase gen types typescript --local > src/app/lib/database.types.ts
```

(swap `--local` for `--project-id <ref>` against a hosted project). Nothing
else needs to change — the file's shape (`Database`, `Json` exports) matches
the CLI's output format.

## Storage

Listing photos go in a single `listing-images` bucket, uploaded to
`<uploader_uid>/<random>.<ext>`. RLS on `storage.objects` restricts
insert/update/delete to the uploader's own folder. The bucket is marked
`public` so the frontend can use plain `<img src>` tags (matching the
original UI, which never had per-image loading states) — a `select` RLS
policy is still defined for the authenticated API path, so switching to a
fully private bucket + signed URLs later is a one-line change in
`src/app/lib/storage.ts::resolveListingImageUrl`, not a redesign.

## Known gaps / deliberate scope boundaries

- **Ratings** (`profiles.rating`) have no real scoring system behind them —
  there's no reviews feature in this app, so the column is seeded with
  plausible values and otherwise never changes. `completed_transactions`
  *is* real (incremented when an order reaches `completed`), but nothing in
  the UI currently marks an order completed — that transition would need a
  "confirm meetup happened" affordance that doesn't exist in the original
  design.
- **Notification preference checkboxes** on the Profile page are visual only
  (no `notification_preferences` table) — they weren't part of the
  requested schema and there's no email/push delivery mechanism to back
  them.
- **Meetup locations** are a frontend constant (`src/app/lib/types.ts`), not
  a database table — see the comment in `..._orders.sql` for why.
- **Moderation**: `reports` is insert-only from the client (readable back to
  the reporter). There's no moderation queue UI in scope.

## Deploying to a hosted project

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This applies the migrations (not `seed.sql` — don't run the demo-account
seed against a real project; it creates real auth.users rows with a shared
published password). Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in
your hosting provider's environment to the values from Project Settings >
API, then `npm run build`.

Since Supabase auth/data access is entirely governed by RLS, the anon key
is meant to be public (it's the same key a browser using the app already
sees) — safe to bake into a static, client-only build like the one below.

### Deploying to GitHub Pages

The repo ships `.github/workflows/deploy.yml`, which builds and deploys to
GitHub Pages automatically on every push to `main`.

One-time setup:

1. In the repo's GitHub Settings > Pages, set **Source** to "GitHub
   Actions".
2. In Settings > Secrets and variables > Actions, add repository secrets
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as your
   local `.env`, pointed at your real/hosted Supabase project — Pages
   can't reach a `supabase start` running on your laptop).
3. Push to `main`. The Actions tab shows the build/deploy run; the site
   then serves from `https://<your-username>.github.io/CampusExchange/`.

This is a project page (served from a `/CampusExchange/` subpath, not the
repo owner's root `username.github.io`), which two things account for:

- `vite.config.ts`'s `base` is `/CampusExchange/` when `GITHUB_PAGES=true`
  (set by the workflow) and `/` otherwise, so local dev is unaffected.
- `src/app/routes.ts` passes that same `base` as the router's `basename`,
  and `public/404.html` + a matching decode script in `index.html`
  implement the standard [SPA-on-GitHub-Pages
  redirect](https://github.com/rafgraph/spa-github-pages) — without it,
  GitHub Pages 404s on refresh or a direct link to anything but `/`,
  since it has no way to run React Router's client-side matching itself.

If you rename the repo, update `pathSegmentsToKeep` in `public/404.html`
(currently `1`, matching the one `/CampusExchange` path segment) and the
`base` in `vite.config.ts` to match.
