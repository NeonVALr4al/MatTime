-- Separates the academy's display name from its social/website link,
-- so the name shown on Combat Profile can click through to that link.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

alter table profiles add column if not exists gym_url text;
