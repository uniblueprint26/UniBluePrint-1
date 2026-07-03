-- Blueprint Studio — Campus Handler Training Portal
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
--
-- Note on RLS: this portal uses a simple access-code login (no Supabase Auth),
-- so there is no auth.uid() to key policies off. All four tables therefore use
-- permissive policies scoped to the "anon" role (the key the client app uses).
-- Row-level isolation between handlers is enforced in the application layer
-- (every query is filtered by the logged-in user's id, which is only known
-- after a correct email + access code match). Treat the anon key as
-- semi-trusted, same as any client-side Supabase app without Auth.

create extension if not exists pgcrypto;

-- 1. training_users -----------------------------------------------------

create table if not exists training_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  full_name text not null,
  university text,
  access_code text not null,
  role text default 'handler' check (role in ('handler', 'operations')),
  notes text,
  created_at timestamptz default now()
);

alter table training_users enable row level security;

create policy "training_users_select_anon" on training_users
  for select to anon using (true);

create policy "training_users_insert_anon" on training_users
  for insert to anon with check (true);

create policy "training_users_update_anon" on training_users
  for update to anon using (true) with check (true);

-- 2. training_progress ---------------------------------------------------

create table if not exists training_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references training_users(id) not null,
  module_id integer not null check (module_id between 1 and 6),
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'passed', 'failed')),
  attempts integer default 0,
  score integer,
  completed_at timestamptz,
  signed_off boolean default false,
  created_at timestamptz default now(),
  unique (user_id, module_id)
);

alter table training_progress enable row level security;

create policy "training_progress_select_anon" on training_progress
  for select to anon using (true);

create policy "training_progress_insert_anon" on training_progress
  for insert to anon with check (true);

create policy "training_progress_update_anon" on training_progress
  for update to anon using (true) with check (true);

-- 3. quiz_attempts --------------------------------------------------------

create table if not exists quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references training_users(id) not null,
  module_id integer not null,
  answers jsonb not null,
  score integer not null,
  passed boolean not null,
  created_at timestamptz default now()
);

alter table quiz_attempts enable row level security;

create policy "quiz_attempts_select_anon" on quiz_attempts
  for select to anon using (true);

create policy "quiz_attempts_insert_anon" on quiz_attempts
  for insert to anon with check (true);

-- 4. handler_commitments ---------------------------------------------------

create table if not exists handler_commitments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references training_users(id) not null,
  module_id integer not null,
  confirmed_at timestamptz default now(),
  ip_address text
);

alter table handler_commitments enable row level security;

create policy "handler_commitments_select_anon" on handler_commitments
  for select to anon using (true);

create policy "handler_commitments_insert_anon" on handler_commitments
  for insert to anon with check (true);

-- Helpful indexes ---------------------------------------------------------

create index if not exists training_progress_user_id_idx on training_progress(user_id);
create index if not exists quiz_attempts_user_id_idx on quiz_attempts(user_id);
create index if not exists handler_commitments_user_id_idx on handler_commitments(user_id);
