-- A fresh Supabase project normally bootstraps "ALTER DEFAULT PRIVILEGES ...
-- GRANT ALL ON TABLES TO anon, authenticated, service_role" for the role
-- that creates objects via the dashboard/SQL editor. Tables created through
-- `supabase db push`'s migration runner didn't pick that up, so PostgREST
-- requests hit a hard "permission denied for table X" — a Postgres GRANT
-- check that happens before RLS ever gets evaluated. RLS remains the real,
-- per-row access boundary (see each table's migration); these are just the
-- coarse table-level yes/no that has to be true first, granting exactly the
-- operations each table already has a matching RLS policy for.

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.schools to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, delete on public.saved_items to authenticated;
grant select, insert, update on public.messages to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert, update on public.orders to authenticated;
