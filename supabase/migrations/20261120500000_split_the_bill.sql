-- Split the bill and split subscriptions. Wave 2. NOT applied by the build.
--
-- Tracking only. UBP never holds, moves or collects money. These tables only
-- record who paid, who is in and who has settled up between friends.
--
-- Design
--   * Two tables: bill_splits (the item) and bill_split_members (one row per
--     person in it, with their share in cents and whether they have settled).
--   * Row level security: only people in a split can read it. Nobody writes the
--     tables directly. Every change goes through the SECURITY DEFINER functions
--     below, which check auth.uid() and that everyone added is a friend
--     (mutual follow).
--   * Notifications come from SECURITY DEFINER trigger functions: added,
--     changed, reminder and settled. The member's own choice is checked first:
--     if public.notification_preferences exists (migration 20261120700000) and
--     the member has switched Following alerts off, no row is written. The
--     table is read with dynamic SQL so this file also runs before that
--     migration.
--   * Text guard: the name of an item is checked with public.feed_text_is_clean
--     on insert and update. Amounts are numbers and need no check.
--   * Depends only on objects that exist in production today: auth.users,
--     public.profiles, public.student_follows, public.is_mutual_follow,
--     public.feed_text_is_clean and public.create_notification.
--
-- New notification categories: split_added, split_changed, split_reminder,
-- split_settled. Related entity type: bill_split.
--
-- Undo: drop the four triggers, the functions named below, then the two tables.

-- 1. Tables

create table if not exists public.bill_splits (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 60),
  kind        text not null default 'bill' check (kind in ('bill', 'subscription')),
  cadence     text check (cadence in ('weekly', 'monthly', 'yearly')),
  total_cents integer not null check (total_cents > 0 and total_cents <= 1000000),
  paid_by     uuid not null references auth.users(id) on delete cascade,
  split_mode  text not null default 'equal' check (split_mode in ('equal', 'custom')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check ((kind = 'subscription') = (cadence is not null))
);
create index if not exists bill_splits_created_by_idx on public.bill_splits (created_by);

create table if not exists public.bill_split_members (
  split_id    uuid not null references public.bill_splits(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  share_cents integer not null check (share_cents >= 0),
  settled     boolean not null default false,
  settled_at  timestamptz,
  reminded_at timestamptz,
  created_at  timestamptz not null default now(),
  primary key (split_id, user_id)
);
create index if not exists bill_split_members_user_idx on public.bill_split_members (user_id);

alter table public.bill_splits enable row level security;
alter table public.bill_split_members enable row level security;

-- 2. Who is in a split (security definer so the policies do not recurse)

create or replace function public.is_bill_split_member(p_split uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bill_split_members
    where split_id = p_split and user_id = (select auth.uid())
  )
$$;
revoke all on function public.is_bill_split_member(uuid) from public, anon;
grant execute on function public.is_bill_split_member(uuid) to authenticated;

drop policy if exists "bill_splits: participants read" on public.bill_splits;
create policy "bill_splits: participants read" on public.bill_splits
  for select to authenticated using (public.is_bill_split_member(id));

drop policy if exists "bill_split_members: participants read" on public.bill_split_members;
create policy "bill_split_members: participants read" on public.bill_split_members
  for select to authenticated using (public.is_bill_split_member(split_id));

-- No insert, update or delete policy on purpose. Writes go through the functions.
revoke insert, update, delete on public.bill_splits from anon, authenticated;
revoke insert, update, delete on public.bill_split_members from anon, authenticated;
revoke all on public.bill_splits from anon;
revoke all on public.bill_split_members from anon;

-- 3. Text guard on the item name

create or replace function public.bill_split_text_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.title is not distinct from new.title then
    return new;
  end if;
  if not public.feed_text_is_clean(new.title) then
    raise exception 'feed_text_guard: community guidelines' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.bill_split_text_guard() from public, anon, authenticated;

drop trigger if exists bill_splits_text_guard on public.bill_splits;
create trigger bill_splits_text_guard
  before insert or update on public.bill_splits
  for each row execute function public.bill_split_text_guard();

-- 4. Small helpers (server only)

create or replace function public.split_money(p_cents integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select '€' || to_char(coalesce(p_cents, 0) / 100.0, 'FM999990.00')
$$;
revoke all on function public.split_money(integer) from public, anon, authenticated;

create or replace function public.split_person_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(btrim((select full_name from public.profiles where id = p_user)), ''), 'A friend')
$$;
revoke all on function public.split_person_name(uuid) from public, anon, authenticated;

-- Writes one notification, after checking the member's own choice.
create or replace function public.split_notify(
  p_user uuid, p_category text, p_title text, p_message text, p_split uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean := true;
begin
  if p_user is null then return; end if;
  if to_regclass('public.notification_preferences') is not null then
    begin
      execute 'select following_alerts from public.notification_preferences where user_id = $1'
        into allowed using p_user;
    exception when others then
      allowed := true;
    end;
    if allowed is false then return; end if;
  end if;
  perform public.create_notification(p_user, p_category, left(p_title, 120), left(p_message, 240), 'bill_split', p_split);
end;
$$;
revoke all on function public.split_notify(uuid, text, text, text, uuid) from public, anon, authenticated;

-- 5. Notification triggers

create or replace function public.bill_split_member_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  who text;
  msg text;
begin
  select * into s from public.bill_splits where id = new.split_id;
  if not found or new.user_id = s.created_by then return new; end if;
  who := public.split_person_name(s.created_by);
  if new.user_id = s.paid_by then
    msg := 'You paid ' || public.split_money(s.total_cents) || '. Your share is ' || public.split_money(new.share_cents) || '.';
  else
    msg := 'You owe ' || public.split_person_name(s.paid_by) || ' ' || public.split_money(new.share_cents) || '.';
  end if;
  perform public.split_notify(new.user_id, 'split_added', who || ' added you to ' || s.title, msg, s.id);
  return new;
end;
$$;
revoke all on function public.bill_split_member_added() from public, anon, authenticated;

create or replace function public.bill_split_member_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  actor uuid := (select auth.uid());
  actor_name text;
  member_name text;
begin
  select * into s from public.bill_splits where id = new.split_id;
  if not found then return new; end if;
  actor_name := public.split_person_name(coalesce(actor, s.created_by));

  -- Share changed
  if old.share_cents is distinct from new.share_cents and new.user_id is distinct from actor then
    perform public.split_notify(new.user_id, 'split_changed', s.title || ' changed',
      'Your share is now ' || public.split_money(new.share_cents) || '.', s.id);
  end if;

  -- Settled
  if old.settled = false and new.settled = true then
    if actor is not distinct from new.user_id then
      member_name := public.split_person_name(new.user_id);
      if s.paid_by <> new.user_id then
        perform public.split_notify(s.paid_by, 'split_settled', member_name || ' marked ' || s.title || ' paid',
          member_name || ' says they paid you ' || public.split_money(new.share_cents) || '.', s.id);
      end if;
      if s.created_by <> s.paid_by and s.created_by <> new.user_id then
        perform public.split_notify(s.created_by, 'split_settled', member_name || ' marked ' || s.title || ' paid',
          member_name || ' paid their share of ' || public.split_money(new.share_cents) || '.', s.id);
      end if;
    elsif new.user_id is distinct from actor then
      perform public.split_notify(new.user_id, 'split_settled', actor_name || ' marked your share settled',
        s.title || ', ' || public.split_money(new.share_cents), s.id);
    end if;
  end if;

  -- Opened again (a new round of a subscription, or a correction)
  if old.settled = true and new.settled = false and new.user_id is distinct from actor then
    perform public.split_notify(new.user_id, 'split_changed', s.title || ' is open again',
      'Your share of ' || public.split_money(new.share_cents) || ' is not marked as settled.', s.id);
  end if;

  -- Reminder
  if new.reminded_at is not null and new.reminded_at is distinct from old.reminded_at and new.settled = false then
    perform public.split_notify(new.user_id, 'split_reminder', 'Reminder: ' || s.title,
      'You owe ' || public.split_person_name(s.paid_by) || ' ' || public.split_money(new.share_cents) || '. Mark it settled once paid.', s.id);
  end if;
  return new;
end;
$$;
revoke all on function public.bill_split_member_changed() from public, anon, authenticated;

drop trigger if exists bill_split_members_notify_added on public.bill_split_members;
create trigger bill_split_members_notify_added
  after insert on public.bill_split_members
  for each row execute function public.bill_split_member_added();

drop trigger if exists bill_split_members_notify_changed on public.bill_split_members;
create trigger bill_split_members_notify_changed
  after update on public.bill_split_members
  for each row execute function public.bill_split_member_changed();

-- 6. Functions the app calls

-- Friends (mutual follows) the caller can add, with names.
create or replace function public.get_split_friends()
returns table (user_id uuid, full_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), 'UniBlueprint member'), p.avatar_url
  from public.student_follows a
  join public.student_follows b on b.follower_id = a.followed_id and b.followed_id = a.follower_id
  join public.profiles p on p.id = a.followed_id
  where a.follower_id = (select auth.uid())
  order by 2
$$;

-- Names of everyone in the splits the caller is in.
create or replace function public.get_bill_split_people(p_split_ids uuid[])
returns table (split_id uuid, user_id uuid, full_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select m.split_id, m.user_id, coalesce(nullif(btrim(p.full_name), ''), 'UniBlueprint member'), p.avatar_url
  from public.bill_split_members m
  join public.profiles p on p.id = m.user_id
  where m.split_id = any (p_split_ids)
    and public.is_bill_split_member(m.split_id)
$$;

-- Checks a members list: [{ "user_id": uuid, "share_cents": int }, ...].
create or replace function public.split_check_members(
  p_me uuid, p_total integer, p_paid_by uuid, p_members jsonb
) returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  n integer;
  total integer;
  r record;
begin
  if p_members is null or jsonb_typeof(p_members) <> 'array' then
    raise exception 'split: members required' using errcode = 'invalid_parameter_value';
  end if;
  select count(*) into n from jsonb_array_elements(p_members);
  if n < 2 or n > 12 then
    raise exception 'split: between 2 and 12 people' using errcode = 'invalid_parameter_value';
  end if;
  if (select count(distinct e ->> 'user_id') from jsonb_array_elements(p_members) e) <> n then
    raise exception 'split: duplicate person' using errcode = 'invalid_parameter_value';
  end if;
  select coalesce(sum((e ->> 'share_cents')::integer), 0) into total from jsonb_array_elements(p_members) e;
  if total <> p_total then
    raise exception 'split: shares must add up to the total' using errcode = 'invalid_parameter_value';
  end if;
  if exists (select 1 from jsonb_array_elements(p_members) e where (e ->> 'share_cents')::integer < 0) then
    raise exception 'split: negative share' using errcode = 'invalid_parameter_value';
  end if;
  if not exists (select 1 from jsonb_array_elements(p_members) e where (e ->> 'user_id')::uuid = p_me) then
    raise exception 'split: you must be in it' using errcode = 'invalid_parameter_value';
  end if;
  if not exists (select 1 from jsonb_array_elements(p_members) e where (e ->> 'user_id')::uuid = p_paid_by) then
    raise exception 'split: the person who paid must be in it' using errcode = 'invalid_parameter_value';
  end if;
  for r in select (e ->> 'user_id')::uuid as uid from jsonb_array_elements(p_members) e loop
    if r.uid <> p_me and not public.is_mutual_follow(p_me, r.uid) then
      raise exception 'split: friends only' using errcode = 'insufficient_privilege';
    end if;
  end loop;
end;
$$;
revoke all on function public.split_check_members(uuid, integer, uuid, jsonb) from public, anon, authenticated;

create or replace function public.create_bill_split(
  p_title text, p_kind text, p_cadence text, p_total_cents integer,
  p_paid_by uuid, p_split_mode text, p_members jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  new_id uuid;
begin
  if me is null then raise exception 'not signed in' using errcode = 'insufficient_privilege'; end if;
  if (select count(*) from public.bill_splits where created_by = me) >= 200 then
    raise exception 'split: too many' using errcode = 'invalid_parameter_value';
  end if;
  perform public.split_check_members(me, p_total_cents, p_paid_by, p_members);
  insert into public.bill_splits (created_by, title, kind, cadence, total_cents, paid_by, split_mode)
  values (me, btrim(p_title), coalesce(p_kind, 'bill'),
          case when coalesce(p_kind, 'bill') = 'subscription' then coalesce(p_cadence, 'monthly') else null end,
          p_total_cents, p_paid_by, coalesce(p_split_mode, 'equal'))
  returning id into new_id;
  insert into public.bill_split_members (split_id, user_id, share_cents, settled, settled_at)
  select new_id, (e ->> 'user_id')::uuid, (e ->> 'share_cents')::integer,
         (e ->> 'user_id')::uuid = p_paid_by,
         case when (e ->> 'user_id')::uuid = p_paid_by then now() end
  from jsonb_array_elements(p_members) e;
  return new_id;
end;
$$;

create or replace function public.update_bill_split(
  p_split uuid, p_title text, p_total_cents integer,
  p_paid_by uuid, p_split_mode text, p_members jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  s record;
begin
  select * into s from public.bill_splits where id = p_split;
  if not found or s.created_by is distinct from me then
    raise exception 'split: not yours' using errcode = 'insufficient_privilege';
  end if;
  perform public.split_check_members(me, p_total_cents, p_paid_by, p_members);
  update public.bill_splits
     set title = btrim(p_title), total_cents = p_total_cents, paid_by = p_paid_by,
         split_mode = coalesce(p_split_mode, split_mode), updated_at = now()
   where id = p_split;
  delete from public.bill_split_members
   where split_id = p_split
     and user_id not in (select (e ->> 'user_id')::uuid from jsonb_array_elements(p_members) e);
  insert into public.bill_split_members (split_id, user_id, share_cents, settled, settled_at)
  select p_split, (e ->> 'user_id')::uuid, (e ->> 'share_cents')::integer,
         (e ->> 'user_id')::uuid = p_paid_by,
         case when (e ->> 'user_id')::uuid = p_paid_by then now() end
  from jsonb_array_elements(p_members) e
  on conflict (split_id, user_id) do update
    set share_cents = excluded.share_cents,
        settled = case
          when excluded.user_id = p_paid_by then true
          when s.paid_by = excluded.user_id then false
          else public.bill_split_members.settled
        end,
        settled_at = case
          when excluded.user_id = p_paid_by then coalesce(public.bill_split_members.settled_at, now())
          when s.paid_by = excluded.user_id then null
          else public.bill_split_members.settled_at
        end;
end;
$$;

-- Mark a share settled or not. The person who made the split, the person who
-- paid, or the member themselves (for their own share, to say they have paid).
create or replace function public.set_bill_split_settled(p_split uuid, p_user uuid, p_settled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  s record;
begin
  select * into s from public.bill_splits where id = p_split;
  if not found or not public.is_bill_split_member(p_split) then
    raise exception 'split: not found' using errcode = 'insufficient_privilege';
  end if;
  if p_user = s.paid_by then return; end if;
  if not (me = s.created_by or me = s.paid_by or (me = p_user and p_settled)) then
    raise exception 'split: not allowed' using errcode = 'insufficient_privilege';
  end if;
  update public.bill_split_members
     set settled = p_settled, settled_at = case when p_settled then now() else null end
   where split_id = p_split and user_id = p_user;
end;
$$;

-- Remind everyone who has not settled. Once a day per person at most.
create or replace function public.remind_bill_split(p_split uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  s record;
  n integer;
begin
  select * into s from public.bill_splits where id = p_split;
  if not found or not (me = s.created_by or me = s.paid_by) then
    raise exception 'split: not allowed' using errcode = 'insufficient_privilege';
  end if;
  with u as (
    update public.bill_split_members
       set reminded_at = now()
     where split_id = p_split and settled = false and user_id <> s.paid_by
       and (reminded_at is null or reminded_at < now() - interval '1 day')
    returning 1
  )
  select count(*) into n from u;
  return n;
end;
$$;

-- Subscriptions: start a new round, so everyone owes their share again.
create or replace function public.reset_bill_split_round(p_split uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  s record;
begin
  select * into s from public.bill_splits where id = p_split;
  if not found or s.created_by is distinct from me or s.kind <> 'subscription' then
    raise exception 'split: not allowed' using errcode = 'insufficient_privilege';
  end if;
  update public.bill_split_members
     set settled = false, settled_at = null, reminded_at = null
   where split_id = p_split and user_id <> s.paid_by;
  update public.bill_splits set updated_at = now() where id = p_split;
end;
$$;

create or replace function public.delete_bill_split(p_split uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.bill_splits where id = p_split and created_by = (select auth.uid());
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'get_split_friends()',
    'get_bill_split_people(uuid[])',
    'create_bill_split(text,text,text,integer,uuid,text,jsonb)',
    'update_bill_split(uuid,text,integer,uuid,text,jsonb)',
    'set_bill_split_settled(uuid,uuid,boolean)',
    'remind_bill_split(uuid)',
    'reset_bill_split_round(uuid)',
    'delete_bill_split(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
