-- Single bucket for listing photos. Objects are stored under
-- "<uploader_uid>/<random>.<ext>" — RLS below restricts writes to the
-- uploader's own folder.
--
-- The bucket is marked public so the frontend can render listing photos
-- with a plain <img src> (matching the existing UI, which does synchronous
-- <img> tags everywhere — no per-image signed-URL fetching/loading states).
-- Listing photos aren't sensitive data, so public *read* access is an
-- acceptable tradeoff; a SELECT policy is still defined below for the
-- authenticated storage API path, so flipping `public` to false later (in
-- favor of signed URLs) is a one-line change, not a redesign.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB, matches the CreatePost UI's stated limit
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "listing_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_images_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'listing-images');
