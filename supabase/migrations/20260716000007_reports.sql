-- Reports: backs the "Flag" dialog on ItemDetail. There's no moderation UI
-- in scope yet, so reports are write-only from the client (readable back to
-- the reporter only, for potential future "your reports" UI); a real
-- moderation surface would read these with the service role.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(trim(reason)) > 0),
  created_at timestamptz not null default now()
);

create index reports_listing_id_idx on public.reports (listing_id);

alter table public.reports enable row level security;

create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "reports_select_own"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());
