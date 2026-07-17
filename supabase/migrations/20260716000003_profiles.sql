-- Profiles extend auth.users with school membership and marketplace stats.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid not null references public.schools (id),
  email text not null,
  full_name text not null,
  avatar_url text,
  rating numeric(2, 1) not null default 5.0 check (rating >= 0 and rating <= 5),
  completed_transactions integer not null default 0 check (completed_transactions >= 0),
  created_at timestamptz not null default now()
);

create index profiles_school_id_idx on public.profiles (school_id);

-- SECURITY DEFINER so it can read the caller's own profile row without
-- re-entering profiles' SELECT policy (which itself depends on this
-- function) — avoids RLS recursion and gives every other table's policies
-- a cheap "what school is the caller in" lookup.
create or replace function public.current_school_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select school_id from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_same_school"
  on public.profiles for select
  to authenticated
  using (school_id = public.current_school_id());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No INSERT policy: profile rows are only ever created by the
-- handle_new_user trigger below (SECURITY DEFINER, bypasses RLS), never
-- directly by a client.

-- Prevent a user from editing their own school_id, email, rating, or
-- completed_transactions via a client-side UPDATE (e.g. through the Profile
-- screen's "Edit Profile" form, which should only ever touch full_name /
-- avatar_url). These fields are system-managed.
--
-- Trusted server-side paths (e.g. sync_order_completion crediting a sale)
-- need to bypass this — they set the app.bypass_profile_protection GUC
-- (transaction-local, via set_config(..., true)) immediately before their
-- UPDATE. Without this escape hatch, this trigger would silently revert
-- their write too, since it can't otherwise distinguish "the owning user
-- editing their own row" from "a trusted function updating this row".
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.bypass_profile_protection', true), 'false') = 'true' then
    return new;
  end if;

  new.school_id := old.school_id;
  new.email := old.email;
  new.rating := old.rating;
  new.completed_transactions := old.completed_transactions;
  return new;
end;
$$;

create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Domain-gated signup: fires after Supabase Auth creates the auth.users row.
-- If the email's domain doesn't match any row in public.schools, this raises
-- an exception, which rolls back the entire signup transaction (including
-- the auth.users insert) — so a non-@menloschool.org signup is hard-rejected
-- at the database, not just filtered client-side.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_school_id uuid;
  new_email_domain text;
begin
  new_email_domain := lower(split_part(new.email, '@', 2));

  select id into matched_school_id
  from public.schools
  where lower(email_domain) = new_email_domain
  limit 1;

  if matched_school_id is null then
    raise exception 'Signups are restricted to verified school email addresses (e.g. @menloschool.org).'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, school_id, email, full_name)
  values (
    new.id,
    matched_school_id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
