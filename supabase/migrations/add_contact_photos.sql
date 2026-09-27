-- Migration: profile photos for people in someone's network
--
-- A LinkedIn archive has no photos. Photos are looked up from each person's
-- LinkedIn profile by a photo service, once, for the people someone actually
-- sees, and stored in the contact-photos bucket.
--   photo_url         public URL of the stored photo; null if none was found
--   photo_checked_at  when we looked; set even when there was no photo, so
--                     nobody is looked up (and paid for) twice
--
-- Additive only. Safe to run on the live database, and safe to run twice.

alter table public.network_connections
  add column if not exists photo_url text,
  add column if not exists photo_checked_at timestamptz;

-- Public bucket: paths are <user id>/<contact id>-<random>.jpg, unguessable.
insert into storage.buckets (id, name, public)
values ('contact-photos', 'contact-photos', true)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
