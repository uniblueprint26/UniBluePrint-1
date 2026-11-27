-- Follow a partner or a coach (Lifestyle and Elevation redesign).
--
-- WRITTEN, NOT APPLIED. Apply it, then switch on the remote flag
-- `partner_follow_enabled` (app_flags) to show the Follow button in the app.
--
-- public.partner_coach_follows is a plain join table. target_id is the partner
-- slug ('energie') or the coach slug ('coach-8', the same value coachSlug() gives
-- in the app), as text, so it works for the static rosters in the app files.
-- A member reads and writes only their own rows. Nobody can list who follows whom.
-- The only thing anyone else can see is a total, through get_follow_count().

create table if not exists public.partner_coach_follows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('partner', 'coach')),
  target_id   text not null check (char_length(target_id) between 1 and 80),
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists idx_partner_coach_follows_target
  on public.partner_coach_follows (target_type, target_id);

alter table public.partner_coach_follows enable row level security;

create policy "users_read_own_partner_coach_follows"
  on public.partner_coach_follows for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_insert_own_partner_coach_follows"
  on public.partner_coach_follows for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users_delete_own_partner_coach_follows"
  on public.partner_coach_follows for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Totals only. SECURITY DEFINER so it can count rows the caller cannot read,
-- and it returns a single number, never a row or a user id.
create or replace function public.get_follow_count(_target_type text, _target_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.partner_coach_follows
  where target_type = _target_type
    and target_id = _target_id;
$$;

revoke all on function public.get_follow_count(text, text) from public;
grant execute on function public.get_follow_count(text, text) to authenticated;
