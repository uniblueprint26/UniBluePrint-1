-- Release batch, app code fixes (core builder).
-- Safe to run more than once. Not applied by the build: the founder applies it.
--
-- 1. Seeds the remote switches the app reads from public.app_flags:
--      foundation_visible           true        Foundation shows everywhere.
--      foundation_ordering_enabled  false       Ordering opens in January.
--      coming_soon_tiles            false       Coming soon tiles stay hidden.
--      pro_free_until               "2027-01-31" Pro is free for every account.
--    Existing rows are never overwritten, so a value the founder already set
--    is kept. The old foundation_enabled row is no longer read by the app and
--    is left alone.
--
--    To open Foundation orders in January:
--      update public.app_flags set value = 'true'::jsonb, updated_at = now()
--       where key = 'foundation_ordering_enabled';
--    To show coming soon tiles later:
--      update public.app_flags set value = 'true'::jsonb, updated_at = now()
--       where key = 'coming_soon_tiles';
--
-- 2. Makes the server agree with the app about Pro. Every signed in account
--    counts as Pro until the date in app_flags.pro_free_until (end of that day,
--    Irish time). After that date the real subscription decides again. This is
--    the one function the Lifestyle deal policies and the partner contact and
--    redemption code functions already call, so nothing else needs to change.
--
-- 3. Removes the trading coach rows (DG Trading coach-4, Dinero Trading Group
--    coach-15) and their contact details. Old migrations are history and are
--    left as they are.

-- ── 1. Flags ────────────────────────────────────────────────────────────────
create table if not exists public.app_flags (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_flags enable row level security;

drop policy if exists "app_flags are public to read" on public.app_flags;
create policy "app_flags are public to read"
  on public.app_flags
  for select
  to anon, authenticated
  using (true);

revoke all on public.app_flags from anon, authenticated;
grant select on public.app_flags to anon, authenticated;

insert into public.app_flags (key, value) values
  ('foundation_visible',          'true'::jsonb),
  ('foundation_ordering_enabled', 'false'::jsonb),
  ('coming_soon_tiles',           'false'::jsonb),
  ('pro_free_until',              '"2027-01-31"'::jsonb)
on conflict (key) do nothing;

-- ── 2. Pro is free until pro_free_until ────────────────────────────────────
create or replace function public.user_has_active_pro(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Free period: any signed in account.
    (
      _user_id is not null
      and coalesce(
        (
          select case
                   when jsonb_typeof(f.value) = 'string'
                    and (f.value #>> '{}') ~ '^\d{4}-\d{2}-\d{2}$'
                   then (f.value #>> '{}')::date
                 end
          from public.app_flags f
          where f.key = 'pro_free_until'
        ),
        date '2027-01-31'
      ) >= (now() at time zone 'Europe/Dublin')::date
    )
    -- After that date, or for anyone with a paid plan, the real subscription.
    or exists (
      select 1 from public.subscriptions
      where user_id = _user_id
        and status = 'active'
        and (current_period_end is null or current_period_end > now())
    )
$$;

-- ── 3. Trading coaches out ──────────────────────────────────────────────────
delete from public.coach_contact_details
 where coach_slug in ('coach-4', 'coach-15');

do $$
begin
  delete from public.coach_profiles
   where coach_slug in ('coach-4', 'coach-15')
     and user_id is null;
exception when foreign_key_violation then
  -- A row something still points at stays. The app no longer lists the coach.
  null;
end $$;
