-- Lets a user delete a technique they added themselves (seeded techniques
-- have no created_by, so they stay undeletable by everyone).
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

create policy "Users can delete techniques they created"
  on techniques for delete using (auth.uid() = created_by);
