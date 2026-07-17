-- Local development seed data: demo Menlo School students, ~20 listings,
-- and a few message threads. Run automatically by `supabase db reset`.
--
-- This creates fake auth.users rows directly via SQL — a standard local-dev
-- pattern, but NOT something to ever run against a production project (see
-- SETUP.md). All seeded accounts share the password below.

create extension if not exists pgcrypto with schema extensions;

-- Session-local helper: creates a demo auth user (email/password,
-- pre-confirmed) plus its identities row, and returns the new user id. The
-- on_auth_user_created trigger (see migrations) creates the matching
-- profiles row automatically. Idempotent, so re-running `db reset` is safe.
create or replace function pg_temp.seed_demo_user(p_email text, p_full_name text)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is not null then
    return v_id;
  end if;

  v_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', p_email,
    crypt('menlo-demo-2026', gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', p_email),
    'email', now(), now(), now()
  );

  return v_id;
end;
$$;

-- Demo accounts. "jlee" (student@menloschool.org) is the account meant for
-- interactive local testing — sign in as them to see MyListings/Saved/
-- Messages populated the way the original mock data was structured.
create temporary table seed_users as
select * from (values
  ('jlee',   'student@menloschool.org',   'Jordan Lee'),
  ('sarah',  'sjohnson@menloschool.org',  'Sarah Johnson'),
  ('alex',   'achen@menloschool.org',     'Alex Chen'),
  ('marcus', 'mwilliams@menloschool.org', 'Marcus Williams'),
  ('emma',   'erodriguez@menloschool.org','Emma Rodriguez'),
  ('james',  'jpark@menloschool.org',     'James Park'),
  ('olivia', 'otaylor@menloschool.org',   'Olivia Taylor'),
  ('noah',   'nkim@menloschool.org',      'Noah Kim')
) as t(handle, email, full_name);

alter table seed_users add column user_id uuid;
update seed_users set user_id = pg_temp.seed_demo_user(email, full_name);

-- protect_profile_fields normally locks rating/completed_transactions
-- against client updates; lift it briefly so the seed can give demo
-- profiles some texture instead of everyone defaulting to 5.0 / 0.
alter table public.profiles disable trigger protect_profile_fields;

update public.profiles p set rating = s.rating, completed_transactions = s.completed_transactions
from (values
  ('jlee',   5.0, 5),
  ('sarah',  4.8, 12),
  ('alex',   4.9, 8),
  ('marcus', 5.0, 15),
  ('emma',   4.7, 6),
  ('james',  4.9, 20),
  ('olivia', 4.6, 3),
  ('noah',   5.0, 1)
) as s(handle, rating, completed_transactions)
join seed_users su on su.handle = s.handle
where p.id = su.user_id;

alter table public.profiles enable trigger protect_profile_fields;

-- ~20 realistic Menlo-flavored listings across every category.
create temporary table seed_listings as
with school as (
  select id as school_id from public.schools where email_domain = 'menloschool.org'
),
raw (handle, title, description, price, category, condition, image_url, status, views_count, likes_count, days_ago) as (
  values
    ('sarah',  'AP Biology Textbook - Campbell Edition', 'Gently used AP Biology textbook. No highlighting, minimal wear. Perfect for the upcoming semester.', 45.00, 'Textbooks', 'Like New', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80', 'available', 45, 8, 6),
    ('alex',   'Scientific Calculator TI-84 Plus', 'Works perfectly, comes with a protective case. Great for math and science classes.', 60.00, 'Electronics', 'Good', 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&q=80', 'available', 67, 12, 7),
    ('marcus', 'Menlo Knights Polo Uniform (Medium)', 'Official Menlo School polo, size medium. Worn only a few times, excellent condition.', 15.00, 'Uniforms', 'Like New', 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80', 'available', 32, 5, 8),
    ('emma',   'Complete Notebook Set - 5 Subjects', 'Brand new, never used. Five 5-subject notebooks, perfect for organizing your classes.', 10.00, 'Stationery', 'New', 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80', 'available', 89, 15, 5),
    ('james',  'Tennis Racket - Wilson Pro Staff', 'Lightly used tennis racket, re-strung last month. Perfect for tennis PE or the team.', 35.00, 'Sports Equipment', 'Good', 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&q=80', 'available', 41, 6, 9),
    ('sarah',  'Calculus: Early Transcendentals (Stewart)', 'James Stewart textbook for AP Calculus. Some notes in the margins, all pages intact.', 50.00, 'Textbooks', 'Good', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80', 'available', 78, 10, 10),
    ('alex',   'Laptop Sleeve 13-inch', 'Protective laptop sleeve with padding. Fits MacBook Air/Pro 13-inch perfectly.', 12.00, 'Electronics', 'Like New', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80', 'available', 55, 9, 5),
    ('marcus', 'Premium Pen Set - Pilot G2 (12-pack)', 'Pack of 12 Pilot G2 pens, assorted colors. 8 pens remaining, never used.', 8.00, 'Stationery', 'Like New', 'https://images.unsplash.com/photo-1586158291800-2665f07bba62?w=800&q=80', 'available', 44, 7, 11),
    ('emma',   'School Backpack - North Face Recon', 'Durable North Face backpack with a padded laptop compartment. Used for one semester.', 40.00, 'Other', 'Good', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', 'available', 92, 14, 4),
    ('james',  'Basketball Shoes - Nike Size 10', 'Nike basketball shoes, size 10. Great condition, only worn for PE class.', 45.00, 'Sports Equipment', 'Good', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 'available', 63, 11, 12),
    ('olivia', 'AP US History - The American Pageant, 16th Ed.', 'Required reading for APUSH. A few highlighted passages, spine intact.', 38.00, 'Textbooks', 'Good', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80', 'available', 29, 4, 3),
    ('noah',   'TI-Nspire CX II Graphing Calculator', 'Color screen, rechargeable battery, comes with charging cable and case. Barely used.', 85.00, 'Electronics', 'Like New', 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&q=80', 'available', 37, 6, 2),
    ('sarah',  'Menlo Cross Country Warm-Up Jacket (Small)', 'Team-issued XC jacket, size small. One season of wear, no rips or stains.', 22.00, 'Uniforms', 'Good', 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80', 'available', 21, 3, 13),
    ('jlee',   'Chemistry Lab Goggles', 'Safety goggles for chemistry lab. Never used, still in original packaging.', 8.00, 'Other', 'New', 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800&q=80', 'available', 28, 4, 6),
    ('jlee',   'Spanish Dictionary - Larousse', 'Comprehensive Spanish-English dictionary. Great for language classes.', 12.00, 'Textbooks', 'Like New', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80', 'available', 35, 6, 8),
    ('emma',   'Graphing Calculator Case + Reference Card', 'Padded case plus a laminated TI-84 quick-reference card. Never used.', 6.00, 'Electronics', 'Good', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80', 'available', 18, 2, 1),
    ('james',  'Soccer Cleats - Adidas Size 9', 'Adidas cleats, size 9. Some wear on the studs but plenty of life left.', 30.00, 'Sports Equipment', 'Fair', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 'available', 24, 3, 14),
    ('olivia', 'AP Chemistry Textbook - Zumdahl, 7th Ed.', 'Zumdahl''s Chemistry, 7th edition. Used for one year, minor cover wear.', 42.00, 'Textbooks', 'Good', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80', 'available', 33, 5, 7),
    ('noah',   'Menlo PE Uniform Set (Shorts + Shirt, Large)', 'Full PE uniform set, size large. Washed and ready to go.', 18.00, 'Uniforms', 'Like New', 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80', 'sold', 19, 2, 15),
    ('marcus', 'Highlighter & Sticky Note Bundle', 'Assorted highlighters and sticky note pads, mix of colors. Great for finals season.', 7.00, 'Stationery', 'New', 'https://images.unsplash.com/photo-1586158291800-2665f07bba62?w=800&q=80', 'available', 26, 4, 2)
),
inserted as (
  insert into public.listings (
    school_id, seller_id, title, description, price, category, condition,
    image_url, status, views_count, likes_count, created_at
  )
  select
    school.school_id, su.user_id, r.title, r.description, r.price,
    r.category::public.item_category, r.condition::public.item_condition,
    r.image_url, r.status::public.listing_status, r.views_count, r.likes_count,
    now() - (r.days_ago || ' days')::interval
  from raw r
  join seed_users su on su.handle = r.handle
  cross join school
  returning id, seller_id, title
)
select * from inserted;

-- A few message threads, matching listings above.
insert into public.messages (listing_id, sender_id, recipient_id, body, read, created_at)
select l.id, sender.user_id, recipient.user_id, m.body, m.read, now() - (m.hours_ago || ' hours')::interval
from (values
    ('Scientific Calculator TI-84 Plus', 'jlee',  'alex',  'Hi! Is this item still available?', true, 48),
    ('Scientific Calculator TI-84 Plus', 'alex',  'jlee',  'Yes, it''s still available! Are you interested?', true, 47),
    ('Scientific Calculator TI-84 Plus', 'jlee',  'alex',  'Great! Can we meet at the Student Center?', true, 30),
    ('Scientific Calculator TI-84 Plus', 'alex',  'jlee',  'Yes! When would you like to meet?', false, 26),

    ('Calculus: Early Transcendentals (Stewart)', 'jlee',  'sarah', 'Hey, is the calculus textbook still up for grabs?', true, 40),
    ('Calculus: Early Transcendentals (Stewart)', 'sarah', 'jlee',  'Yep! Still have it, barely used.', true, 39),
    ('Calculus: Early Transcendentals (Stewart)', 'jlee',  'sarah', 'Awesome, could we meet tomorrow?', true, 30),
    ('Calculus: Early Transcendentals (Stewart)', 'sarah', 'jlee',  'The Student Center works for me. See you at 3pm!', true, 27),

    ('School Backpack - North Face Recon', 'jlee', 'emma', 'Does the laptop sleeve still have all its padding? No rips or anything?', true, 20),
    ('School Backpack - North Face Recon', 'emma', 'jlee', 'Yep, laptop compartment''s totally fine! Only used it for one semester.', false, 5)
) as m(listing_title, sender_handle, recipient_handle, body, read, hours_ago)
join seed_listings l on l.title = m.listing_title
join seed_users sender on sender.handle = m.sender_handle
join seed_users recipient on recipient.handle = m.recipient_handle;

drop table seed_listings;
drop table seed_users;
