-- Listings: the marketplace items themselves.

create type public.item_category as enum (
  'Textbooks',
  'Uniforms',
  'Electronics',
  'Stationery',
  'Sports Equipment',
  'Other'
);

create type public.item_condition as enum ('New', 'Like New', 'Good', 'Fair');

create type public.listing_status as enum ('available', 'sold', 'removed');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null check (char_length(trim(description)) > 0),
  price numeric(10, 2) not null check (price >= 0),
  category public.item_category not null,
  condition public.item_condition not null,
  image_url text,
  status public.listing_status not null default 'available',
  views_count integer not null default 0 check (views_count >= 0),
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_school_id_idx on public.listings (school_id);
create index listings_seller_id_idx on public.listings (seller_id);
create index listings_status_idx on public.listings (status);
create index listings_category_idx on public.listings (category);
create index listings_created_at_idx on public.listings (created_at desc);

create trigger set_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

alter table public.listings enable row level security;

create policy "listings_select_same_school"
  on public.listings for select
  to authenticated
  using (school_id = public.current_school_id());

create policy "listings_insert_own"
  on public.listings for insert
  to authenticated
  with check (seller_id = auth.uid() and school_id = public.current_school_id());

create policy "listings_update_own"
  on public.listings for update
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid() and school_id = public.current_school_id());

create policy "listings_delete_own"
  on public.listings for delete
  to authenticated
  using (seller_id = auth.uid());

-- listings_update_own lets a seller change any column on their own row —
-- intentional, that's the Edit Listing feature. But views_count/likes_count
-- are supposed to be exclusively maintained by increment_listing_views()
-- and the saved_items trigger below, not owner-writable: without this,
-- a seller could `update listings set likes_count = 9999` directly and RLS
-- would allow it, since the owner-update policy only constrains seller_id/
-- school_id. Lock both counters to their old value on any client-driven
-- UPDATE; trusted paths bypass via the same transaction-local GUC pattern
-- used for profiles/messages (see protect_profile_fields).
create or replace function public.protect_listing_counters()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.bypass_listing_counter_protection', true), 'false') = 'true' then
    return new;
  end if;

  new.views_count := old.views_count;
  new.likes_count := old.likes_count;
  return new;
end;
$$;

create trigger protect_listing_counters
  before update on public.listings
  for each row execute function public.protect_listing_counters();

-- View counts need to increment regardless of who's looking (any signed-in
-- same-school student viewing someone else's listing), which the owner-only
-- UPDATE policy above deliberately doesn't allow. This SECURITY DEFINER RPC
-- is the one narrow bypass, scoped to just this counter.
create or replace function public.increment_listing_views(listing_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.bypass_listing_counter_protection', 'true', true);

  update public.listings
  set views_count = views_count + 1
  where id = listing_id_input
    and school_id = public.current_school_id();
end;
$$;

revoke all on function public.increment_listing_views(uuid) from public;
grant execute on function public.increment_listing_views(uuid) to authenticated;
