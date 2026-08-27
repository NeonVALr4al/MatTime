-- MatTime initial database schema
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

-- ============================================================
-- 1. PROFILES
-- Extends Supabase's built-in auth.users with grappler-specific info.
-- One row per user, id matches auth.users.id.
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  gym_name text,
  current_belt text check (current_belt in ('white','blue','purple','brown','black')) default 'white',
  current_stripes int check (current_stripes between 0 and 4) default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);


-- ============================================================
-- 2. SESSIONS
-- One row per training session.
-- ============================================================
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  class_type text check (class_type in ('gi','no-gi','open mat','competition','private')) default 'gi',
  duration_minutes int,
  intensity int check (intensity between 1 and 5),
  notes text,
  created_at timestamptz default now()
);

alter table sessions enable row level security;

create policy "Users can view their own sessions"
  on sessions for select using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on sessions for insert with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on sessions for update using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on sessions for delete using (auth.uid() = user_id);


-- ============================================================
-- 3. TECHNIQUES
-- Shared reference library (e.g. "Triangle choke", "Single-leg takedown").
-- Anyone can read the list; any logged-in user can add a new technique
-- (created_by tracks who added it, but doesn't restrict who can see it).
-- ============================================================
create table techniques (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text check (category in ('submission','sweep','takedown','escape','guard pass','guard retention','other')) default 'other',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table techniques enable row level security;

create policy "Anyone logged in can view techniques"
  on techniques for select using (auth.role() = 'authenticated');

create policy "Anyone logged in can add a technique"
  on techniques for insert with check (auth.uid() = created_by);


-- ============================================================
-- 4. SESSION_TECHNIQUES
-- Junction table: which techniques were drilled in which session.
-- user_id is duplicated here (denormalised) so RLS doesn't need a join.
-- ============================================================
create table session_techniques (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  technique_id uuid not null references techniques(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  notes text,
  created_at timestamptz default now()
);

alter table session_techniques enable row level security;

create policy "Users can view their own session techniques"
  on session_techniques for select using (auth.uid() = user_id);

create policy "Users can insert their own session techniques"
  on session_techniques for insert with check (auth.uid() = user_id);

create policy "Users can delete their own session techniques"
  on session_techniques for delete using (auth.uid() = user_id);


-- ============================================================
-- 5. SPARRING_LOG
-- Rolling/sparring notes. Optionally tied to a session, but can stand alone.
-- ============================================================
create table sparring_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  roll_date date not null default current_date,
  opponent_note text,           -- e.g. "training partner, blue belt" (no real names needed)
  position_result text,         -- e.g. "won from mount", "lost from closed guard"
  submission_landed text,
  submission_received text,
  notes text,
  created_at timestamptz default now()
);

alter table sparring_log enable row level security;

create policy "Users can view their own sparring log"
  on sparring_log for select using (auth.uid() = user_id);

create policy "Users can insert their own sparring log"
  on sparring_log for insert with check (auth.uid() = user_id);

create policy "Users can update their own sparring log"
  on sparring_log for update using (auth.uid() = user_id);

create policy "Users can delete their own sparring log"
  on sparring_log for delete using (auth.uid() = user_id);


-- ============================================================
-- 6. BELT_PROMOTIONS
-- Timeline of belt/stripe history, powers the progress dashboard.
-- ============================================================
create table belt_promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  belt text check (belt in ('white','blue','purple','brown','black')) not null,
  stripes int check (stripes between 0 and 4) default 0,
  promotion_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

alter table belt_promotions enable row level security;

create policy "Users can view their own promotions"
  on belt_promotions for select using (auth.uid() = user_id);

create policy "Users can insert their own promotions"
  on belt_promotions for insert with check (auth.uid() = user_id);

create policy "Users can delete their own promotions"
  on belt_promotions for delete using (auth.uid() = user_id);