-- Extensions and shared helper functions used by later migrations.

create extension if not exists pgcrypto with schema extensions;

-- Generic "touch updated_at" trigger, reused by any table with an updated_at column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
