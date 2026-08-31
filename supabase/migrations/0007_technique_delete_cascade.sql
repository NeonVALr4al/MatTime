-- Deleting a technique should also clear its links in past sessions'
-- drilled-technique lists, instead of being blocked by the foreign key.
-- The sessions themselves are untouched; only the technique tag is removed.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

alter table session_techniques drop constraint session_techniques_technique_id_fkey;

alter table session_techniques
  add constraint session_techniques_technique_id_fkey
  foreign key (technique_id) references techniques(id) on delete cascade;
