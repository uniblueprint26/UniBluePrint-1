-- Foundation Blueprint: Job Search Support.
--
-- Structurally different from the document builders: this is a live Handler
-- advisory session, not a document Claude produces and a Handler reviews.
-- Two outputs, two tables — deliberately NOT one table with two jsonb columns,
-- because Postgres RLS filters rows, not columns, and Supabase puts every signed-in
-- user under the same `authenticated` role. The only reliable way to make the
-- Handler-only guide actually unreadable by students (not just hidden by the UI)
-- is to put it in its own table with its own policy.

insert into public.services (name, description, category, price_cents, active)
values
  ('Job Search Support — Standard', 'A live advisory session with a Campus Handler, plus a personalised job search strategy document. Shorter session, focused strategy.', 'foundation', 1500, true),
  ('Job Search Support — Premium', 'Longer session, deeper strategy, and written Handler follow-up notes within 24 hours.', 'foundation', 3000, true)
on conflict do nothing;

-- ─── job_search_sessions — student-facing ────────────────────────────────────────

create table public.job_search_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  tier text not null default 'standard' check (tier in ('standard', 'premium')),
  input jsonb not null default '{}'::jsonb,
  student_strategy jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_search_sessions enable row level security;

create policy "Users can read own job search sessions" on public.job_search_sessions
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own job search sessions" on public.job_search_sessions
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own job search sessions" on public.job_search_sessions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Handlers can read assigned job search sessions" on public.job_search_sessions
  for select to authenticated using (
    submission_id in (select submission_id from public.handler_assignments where handler_id = auth.uid())
  );

create index job_search_sessions_user_id_idx on public.job_search_sessions (user_id);

-- ─── job_search_handler_guides — Handler-only, by construction ──────────────────
-- No student policy exists on this table at all — not "hidden," genuinely
-- unreadable to a student even if they inspect network requests directly.

create table public.job_search_handler_guides (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.job_search_sessions(id) on delete cascade not null unique,
  handler_guide jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.job_search_handler_guides enable row level security;

create policy "Handlers and operations can read handler guides" on public.job_search_handler_guides
  for select to authenticated using (
    public.has_role(auth.uid(), 'handler') or public.has_role(auth.uid(), 'operations')
  );

-- Writes happen via the generate-job-search-support Edge Function, which uses the
-- caller's own JWT and is allowed to write here only because the session it's
-- writing against belongs to that same authenticated request — see grant below.
create policy "Session owner can insert their own handler guide" on public.job_search_handler_guides
  for insert to authenticated with check (
    session_id in (select id from public.job_search_sessions where user_id = auth.uid())
  );

-- Needed so regenerating a strategy (upsert on session_id) can update the existing
-- row rather than failing — same ownership boundary as the insert policy above.
create policy "Session owner can update their own handler guide" on public.job_search_handler_guides
  for update to authenticated using (
    session_id in (select id from public.job_search_sessions where user_id = auth.uid())
  ) with check (
    session_id in (select id from public.job_search_sessions where user_id = auth.uid())
  );
