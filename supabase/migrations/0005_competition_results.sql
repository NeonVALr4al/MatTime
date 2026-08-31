-- Competition results, powering the Trophy Case on the Combat Profile screen.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

create table competition_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  organization text check (organization in ('IBJJF', 'AJP', 'Other')) default 'Other',
  division text,
  placement text check (placement in ('gold', 'silver', 'bronze')) not null,
  event_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

alter table competition_results enable row level security;

create policy "Users can view their own competition results"
  on competition_results for select using (auth.uid() = user_id);

create policy "Users can insert their own competition results"
  on competition_results for insert with check (auth.uid() = user_id);

create policy "Users can delete their own competition results"
  on competition_results for delete using (auth.uid() = user_id);
