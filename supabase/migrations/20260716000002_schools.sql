-- Schools table. Adding a second school later is a matter of inserting a row
-- here (with its email domain) — no query or RLS policy elsewhere hardcodes
-- Menlo School specifically; they all filter by school_id.

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_domain text not null unique,
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;

create policy "schools_select_authenticated"
  on public.schools for select
  to authenticated
  using (true);

-- Seed the one school this deployment currently serves. This is functional
-- reference data (the signup trigger needs it to exist), not demo content,
-- so it lives in a migration rather than supabase/seed.sql.
insert into public.schools (name, email_domain)
values ('Menlo School', 'menloschool.org');
