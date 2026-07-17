-- Saved/liked items. A user's own saves are private; the aggregate
-- likes_count on listings (kept in sync by the trigger below) is what's
-- shown publicly on listing cards.

create table public.saved_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index saved_items_listing_id_idx on public.saved_items (listing_id);

alter table public.saved_items enable row level security;

create policy "saved_items_select_own"
  on public.saved_items for select
  to authenticated
  using (user_id = auth.uid());

create policy "saved_items_insert_own"
  on public.saved_items for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "saved_items_delete_own"
  on public.saved_items for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public.sync_listing_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.bypass_listing_counter_protection', 'true', true);

  if tg_op = 'INSERT' then
    update public.listings set likes_count = likes_count + 1 where id = new.listing_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.listings set likes_count = greatest(likes_count - 1, 0) where id = old.listing_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger saved_items_sync_likes_count
  after insert or delete on public.saved_items
  for each row execute function public.sync_listing_likes_count();
