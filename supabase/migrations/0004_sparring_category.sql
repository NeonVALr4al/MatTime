-- Tags each sparring round with a playstyle focus area, powering the
-- Position Matrix radar chart on the Combat Profile screen.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

alter table sparring_log add column if not exists category text check (
  category in ('takedown', 'guard_passing', 'guard_retention', 'leg_entanglement', 'submission', 'escape')
);
