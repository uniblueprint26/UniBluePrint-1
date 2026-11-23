-- Changes: adds public.time_capsule_notes (one private note per member, locked until the capsule opens) and three RPCs: time_capsule_open_at(), save_time_capsule(text), my_time_capsule(). Destructive: no. Undo: drop function public.my_time_capsule(); drop function public.save_time_capsule(text); drop function public.time_capsule_open_at(); drop table public.time_capsule_notes;
--
-- "Note to your 2027 self" (Ireland 2026 Wrapped issue).
--
-- A member writes one short private note (1 to 1000 characters). It is locked
-- until the capsule opens, 1 January 2027 at 09:00 Irish time, which is
-- 09:00 UTC because Ireland is on GMT in winter. After that the member can read
-- it and the app can offer to share it as a Take.
--
-- Nobody can read or write the table directly (no grants, RLS on, no policies).
-- Everything goes through SECURITY DEFINER RPCs that check auth.uid():
--   save_time_capsule(p_body)  writes or replaces the caller's note, only before
--                              the open moment. open_at is fixed here from the
--                              app_flags key capsule_open_at, never by the client.
--   my_time_capsule()          returns the caller's note. body is null until
--                              now() >= open_at, so a modified client cannot
--                              peek early.
--   time_capsule_open_at()     the open moment (the flag, or the default).
--
-- The open moment lives in app_flags key capsule_open_at, a JSON string such as
-- "2027-01-01T09:00:00Z". If the key is missing or is not a valid time, the
-- default 2027-01-01T09:00:00Z applies. A note keeps the open_at it was saved
-- with; changing the flag later does not move notes already saved.
--
-- Text guard: the same server side check as feed posts
-- (public.feed_text_is_clean from 20261118121000_feed_text_guard.sql). Not
-- applied by the build. The founder applies it.

create table if not exists public.time_capsule_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  open_at    timestamptz not null,
  created_at timestamptz not null default now(),
  constraint time_capsule_notes_one_per_member unique (user_id)
);

alter table public.time_capsule_notes enable row level security;

-- No policies on purpose: with no grant and no policy nobody can touch the
-- table except through the functions below.
revoke all on public.time_capsule_notes from public, anon, authenticated;

-- The open moment. Reads the public app_flags table.
create or replace function public.time_capsule_open_at()
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v text;
  t timestamptz;
begin
  select f.value #>> '{}' into v from public.app_flags f where f.key = 'capsule_open_at';
  if v is not null then
    begin
      t := v::timestamptz;
    exception when others then
      t := null;
    end;
  end if;
  return coalesce(t, '2027-01-01T09:00:00Z'::timestamptz);
end;
$$;

-- Write or replace the caller's note. Allowed only before the open moment.
create or replace function public.save_time_capsule(p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean text := btrim(coalesce(p_body, ''));
  opens timestamptz := public.time_capsule_open_at();
begin
  if uid is null then
    raise exception 'time_capsule: sign in first' using errcode = '28000';
  end if;
  if char_length(clean) < 1 or char_length(clean) > 1000 then
    raise exception 'time_capsule: note must be 1 to 1000 characters' using errcode = '22023';
  end if;
  if now() >= opens then
    raise exception 'time_capsule: the capsule has closed' using errcode = '42501';
  end if;
  if not public.feed_text_is_clean(clean) then
    raise exception 'feed_text_guard: community guidelines' using errcode = 'check_violation';
  end if;

  insert into public.time_capsule_notes as n (user_id, body, open_at, created_at)
  values (uid, clean, opens, now())
  on conflict (user_id) do update
    set body = excluded.body,
        open_at = excluded.open_at,
        created_at = now();
end;
$$;

-- The caller's capsule. Always returns one row.
--   has_note    true once a note is saved
--   created_at  when it was written (null if none)
--   open_at     the note's open moment, or the current open moment if none yet
--   body        the note, only when now() >= open_at, otherwise null
--   is_open     now() >= open_at
--   can_save    the capsule still accepts notes (now() < current open moment)
--   server_now  the server clock, so the countdown does not trust the phone
create or replace function public.my_time_capsule()
returns table (
  has_note boolean,
  created_at timestamptz,
  open_at timestamptz,
  body text,
  is_open boolean,
  can_save boolean,
  server_now timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  cur timestamptz := public.time_capsule_open_at();
  r public.time_capsule_notes%rowtype;
begin
  if uid is null then
    raise exception 'time_capsule: sign in first' using errcode = '28000';
  end if;
  select * into r from public.time_capsule_notes n where n.user_id = uid;
  if found then
    return query select true, r.created_at, r.open_at,
      case when now() >= r.open_at then r.body else null end,
      now() >= r.open_at, now() < cur, now();
  else
    return query select false, null::timestamptz, cur, null::text,
      now() >= cur, now() < cur, now();
  end if;
end;
$$;

revoke all on function public.time_capsule_open_at() from public, anon, authenticated;
revoke all on function public.save_time_capsule(text) from public, anon;
revoke all on function public.my_time_capsule() from public, anon;
grant execute on function public.save_time_capsule(text) to authenticated;
grant execute on function public.my_time_capsule() to authenticated;

-- Seed the open moment so the founder can see and change it. Safe to re-run.
insert into public.app_flags (key, value)
values ('capsule_open_at', to_jsonb('2027-01-01T09:00:00Z'::text))
on conflict (key) do nothing;
