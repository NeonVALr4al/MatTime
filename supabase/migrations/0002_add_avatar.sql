-- Adds profile picture support
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

-- ============================================================
-- 1. PROFILES: avatar_url column
-- ============================================================
alter table profiles add column if not exists avatar_url text;


-- ============================================================
-- 2. STORAGE: public "avatars" bucket
-- Files are stored at "<user_id>/<filename>" so ownership can be
-- checked from the path without an extra lookup table.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
