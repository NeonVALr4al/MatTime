-- Lets a user manually set/override "Training Since" on Combat Profile,
-- instead of it only being derived from the earliest belt promotion.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

alter table profiles add column if not exists training_since date;
