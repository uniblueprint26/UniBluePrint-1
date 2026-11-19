-- Remote switches the app reads at start up, so a feature can be turned on
-- without a new store release. First flag: foundation_enabled (Foundation
-- orders stay closed in the iOS and Android apps until January).
--
-- The app reads this table with the public anon key, so read access is public.
-- Nobody can write to it from the app: there are no insert, update or delete
-- policies and no write grants, so only the founder, through the Supabase
-- dashboard or the service role, can change a value.
--
-- To open Foundation in the apps:
--   update public.app_flags set value = 'true'::jsonb, updated_at = now() where key = 'foundation_enabled';
-- The app fails closed: if this table is missing or the request fails,
-- Foundation stays hidden.
--
-- Not applied by the build. The founder applies it.

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

insert into public.app_flags (key, value)
values ('foundation_enabled', 'false'::jsonb)
on conflict (key) do nothing;
