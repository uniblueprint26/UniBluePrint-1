-- Real carpool posting for Campus Connect, replacing the hardcoded
-- CARPOOL_POSTS demo array in CampusConnectScreen.jsx. The other 11 Campus
-- Connect boards stay mock content pending real campus rollout (see
-- MockContentBanner on that screen) — carpool was called out separately
-- because it carries real safety stakes a generic board post doesn't.
--
-- "Verification" here means what UniBlueprint can honestly guarantee: every
-- poster has explicitly accepted carpool safety terms (enforced at the
-- database level, not just a UI checkbox), and every route can be reported
-- straight to Operations. It does NOT mean identity or driver verification —
-- profiles.university_email exists as a column but nothing populates or
-- verifies it today, so a "verified student" badge would be fabricated. The
-- in-app safety banner ("verify carpool drivers through your campus student
-- services") stays, and is the honest boundary of what this system claims.

-- ── 1. Carpool routes ────────────────────────────────────────────────────────
-- poster_name is denormalized (client sends user_metadata.full_name at
-- insert time) rather than joined from profiles, matching the same pattern
-- posts.author_name already uses — profiles RLS only permits reading your
-- own row, so a live join to show another user's name is not an option
-- without loosening that (see 20260606120000_campus_boards_posts.sql).
create table if not exists public.carpool_routes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  poster_name       text,
  from_location     text not null,
  to_location       text not null,
  schedule          text not null,
  seats_available   smallint not null default 1 check (seats_available between 1 and 8),
  notes             text,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);
alter table public.carpool_routes enable row level security;

create policy "read_active_or_own_routes" on public.carpool_routes
  for select to authenticated using (active = true or user_id = auth.uid());
create policy "insert_own_route" on public.carpool_routes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "manage_own_route" on public.carpool_routes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_route" on public.carpool_routes
  for delete to authenticated using (auth.uid() = user_id);

-- Real enforcement, not just a client-side gate: a route cannot be inserted
-- until carpool_terms_acceptance (existing table, from the initial schema)
-- has a row for this user. The app still shows the terms sheet before
-- attempting the insert for a good UX, but this is what actually stops it.
create or replace function public.enforce_carpool_terms_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.carpool_terms_acceptance where user_id = new.user_id) then
    raise exception 'Accept the Carpool Safety Terms before posting a route.';
  end if;
  return new;
end; $$;

drop trigger if exists trg_enforce_carpool_terms on public.carpool_routes;
create trigger trg_enforce_carpool_terms
  before insert on public.carpool_routes
  for each row execute function public.enforce_carpool_terms_accepted();

-- ── 2. Reporting ─────────────────────────────────────────────────────────────
-- operations_flags already existed (initial schema) but had no policy letting
-- a regular user insert one — only Operations could read/write it, so there
-- was no way to actually report anything. Scoped to inserting your own flag
-- only; reading, resolving, and everything else stays Operations-only via
-- the existing "Operations can manage flags" policy.
create policy "authenticated_report_content" on public.operations_flags
  for insert to authenticated with check (auth.uid() = flagged_by);

create or replace function public.notify_ops_on_flag()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, category, title, message)
  select ur.user_id, 'content_flagged', 'Content reported',
         initcap(new.target_type) || ' reported: ' || coalesce(new.reason, 'no reason given')
  from public.user_roles ur where ur.role in ('operations', 'founder');
  return new;
end; $$;

drop trigger if exists trg_notify_ops_on_flag on public.operations_flags;
create trigger trg_notify_ops_on_flag
  after insert on public.operations_flags
  for each row execute function public.notify_ops_on_flag();

-- ── 3. Realtime ──────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'carpool_routes') then
    alter publication supabase_realtime add table public.carpool_routes;
  end if;
end $$;
