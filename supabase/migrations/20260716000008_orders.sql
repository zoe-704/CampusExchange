-- Orders: backs the Buy Now / meetup-location flow and Profile's "Recent
-- Activity". meetup_location is stored as plain text rather than a foreign
-- key — the list of safe campus meetup spots is small, Menlo-specific, and
-- edited about as often as the rest of the UI copy, so it lives as a
-- frontend constant rather than an admin-managed table.

create type public.order_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  status public.order_status not null default 'pending',
  meetup_location text,
  meetup_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_buyer_seller_distinct check (buyer_id <> seller_id)
);

create index orders_listing_id_idx on public.orders (listing_id);
create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_seller_id_idx on public.orders (seller_id);

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

create policy "orders_select_participant"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "orders_insert_buyer"
  on public.orders for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = orders.listing_id
        and l.seller_id = orders.seller_id
        and l.status = 'available'
        and l.school_id = public.current_school_id()
    )
  );

create policy "orders_update_participant"
  on public.orders for update
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- When an order is marked completed, credit the seller's completed-sales
-- count and flip the listing to sold. This is the only place
-- profiles.completed_transactions changes after signup.
create or replace function public.sync_order_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.profiles
    set completed_transactions = completed_transactions + 1
    where id = new.seller_id;

    update public.listings
    set status = 'sold'
    where id = new.listing_id;
  end if;
  return new;
end;
$$;

create trigger orders_sync_completion
  after update on public.orders
  for each row execute function public.sync_order_completion();
