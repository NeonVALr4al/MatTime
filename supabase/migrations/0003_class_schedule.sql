-- Weekly recurring class schedule
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

create table class_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  label text,
  created_at timestamptz default now()
);

alter table class_schedule enable row level security;

create policy "Users can view their own class schedule"
  on class_schedule for select using (auth.uid() = user_id);

create policy "Users can insert their own class schedule"
  on class_schedule for insert with check (auth.uid() = user_id);

create policy "Users can delete their own class schedule"
  on class_schedule for delete using (auth.uid() = user_id);
