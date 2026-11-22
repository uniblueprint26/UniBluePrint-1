-- Campus Connect toolkit (wave 2): busy spots, study room sharer, commute buddy,
-- live board counts, richer Campus Pulse questions, and a server side text guard
-- on campus and Course Connect text columns members can post.
--
-- Not applied by the build. Safe to run once; written to be re-runnable.
--
-- Rules followed:
--  * A member's campus is read from public.profiles.institution on the server,
--    never trusted from the app.
--  * Notifications come only from SECURITY DEFINER trigger functions that insert
--    into public.notifications. The app never calls create_notification.
--  * Busy spot reports hide who reported (readers have no user_id column).
--  * No data is invented. Pulse questions are UBP written and flagged is_ubp.

-- Helpers ------------------------------------------------------------------
create or replace function public.my_institution()
returns text
language sql stable security definer set search_path = public as $$
  select nullif(btrim(institution), '') from public.profiles where id = (select auth.uid());
$$;
revoke all on function public.my_institution() from public, anon;
grant execute on function public.my_institution() to authenticated;

-- Server side swear check for any text column. Usage:
--   create trigger x before insert or update on t
--   for each row execute function public.campus_text_guard('col1','col2');
-- Uses public.feed_text_is_clean (see 20261118121000_feed_text_guard.sql).
create or replace function public.campus_text_guard()
returns trigger
language plpgsql
set search_path = public as $$
declare
  col text;
  val text;
begin
  foreach col in array tg_argv loop
    val := to_jsonb(new) ->> col;
    if val is not null and not public.feed_text_is_clean(val) then
      raise exception 'feed_text_guard: community guidelines' using errcode = 'check_violation';
    end if;
  end loop;
  return new;
end;
$$;

-- Sets institution from the signed in member's profile. A member without a campus
-- cannot add campus rows. Server side jobs (no auth.uid) may pass institution.
create or replace function public.campus_set_institution()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is not null then
    new.institution := public.my_institution();
  end if;
  if new.institution is null or btrim(new.institution) = '' then
    raise exception 'campus_required: choose your campus first' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Busy spots ----------------------------------------------------------------
create table if not exists public.busy_spots (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  kind text not null default 'other' check (kind in ('study','food','gym','other')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  is_ubp boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists busy_spots_inst_name_uidx on public.busy_spots (institution, lower(name));
create index if not exists busy_spots_created_by_idx on public.busy_spots (created_by);

create table if not exists public.busy_spot_reports (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.busy_spots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  level text not null check (level in ('quiet','busy','packed')),
  created_at timestamptz not null default now()
);
create index if not exists busy_spot_reports_spot_idx on public.busy_spot_reports (spot_id, created_at desc);
create index if not exists busy_spot_reports_user_idx on public.busy_spot_reports (user_id);

create or replace function public.busy_spots_before_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is not null then
    new.is_ubp := false;
    new.created_by := (select auth.uid());
  end if;
  return new;
end;
$$;
drop trigger if exists busy_spots_set_institution on public.busy_spots;
create trigger busy_spots_set_institution before insert on public.busy_spots
  for each row execute function public.campus_set_institution();
drop trigger if exists busy_spots_flags on public.busy_spots;
create trigger busy_spots_flags before insert on public.busy_spots
  for each row execute function public.busy_spots_before_insert();
drop trigger if exists busy_spots_text_guard on public.busy_spots;
create trigger busy_spots_text_guard before insert or update on public.busy_spots
  for each row execute function public.campus_text_guard('name');

-- One report per member per spot every 10 minutes, and only on your own campus.
create or replace function public.busy_spot_reports_check()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  spot_inst text;
begin
  select institution into spot_inst from public.busy_spots where id = new.spot_id;
  if spot_inst is null or spot_inst is distinct from public.my_institution() then
    raise exception 'campus_mismatch: you can only report spots on your campus' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.busy_spot_reports r
    where r.spot_id = new.spot_id and r.user_id = new.user_id and r.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'rate_limited: you just reported this spot' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
drop trigger if exists busy_spot_reports_check_trg on public.busy_spot_reports;
create trigger busy_spot_reports_check_trg before insert on public.busy_spot_reports
  for each row execute function public.busy_spot_reports_check();

alter table public.busy_spots enable row level security;
alter table public.busy_spot_reports enable row level security;

drop policy if exists "busy_spots: read own campus" on public.busy_spots;
create policy "busy_spots: read own campus" on public.busy_spots for select to authenticated
  using (institution = public.my_institution());
drop policy if exists "busy_spots: add own campus" on public.busy_spots;
create policy "busy_spots: add own campus" on public.busy_spots for insert to authenticated
  with check (created_by = (select auth.uid()));
drop policy if exists "busy_spots: delete own" on public.busy_spots;
create policy "busy_spots: delete own" on public.busy_spots for delete to authenticated
  using (created_by = (select auth.uid()));

drop policy if exists "busy_spot_reports: read own campus" on public.busy_spot_reports;
create policy "busy_spot_reports: read own campus" on public.busy_spot_reports for select to authenticated
  using (exists (select 1 from public.busy_spots s where s.id = spot_id and s.institution = public.my_institution()));
drop policy if exists "busy_spot_reports: add own" on public.busy_spot_reports;
create policy "busy_spot_reports: add own" on public.busy_spot_reports for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Readers never see who reported.
revoke all on public.busy_spots from anon;
revoke all on public.busy_spot_reports from anon;
revoke select on public.busy_spot_reports from authenticated;
grant select (id, spot_id, level, created_at) on public.busy_spot_reports to authenticated;
grant insert (spot_id, level) on public.busy_spot_reports to authenticated;

-- Live status: latest report in the last 2 hours and how many fed it.
create or replace view public.busy_spot_status with (security_invoker = true) as
select
  s.id, s.institution, s.name, s.kind, s.is_ubp, s.created_by, s.created_at,
  (select count(*) from public.busy_spot_reports r
     where r.spot_id = s.id and r.created_at > now() - interval '2 hours') as report_count,
  (select r.level from public.busy_spot_reports r
     where r.spot_id = s.id and r.created_at > now() - interval '2 hours'
     order by r.created_at desc limit 1) as latest_level,
  (select r.created_at from public.busy_spot_reports r
     where r.spot_id = s.id and r.created_at > now() - interval '2 hours'
     order by r.created_at desc limit 1) as latest_at
from public.busy_spots s;
grant select on public.busy_spot_status to authenticated;

-- Study room sharer ----------------------------------------------------------
create table if not exists public.study_room_shares (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  room text not null check (char_length(btrim(room)) between 2 and 60),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text check (note is null or char_length(note) <= 140),
  status text not null default 'open' check (status in ('open','claimed','handed_over','withdrawn')),
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists study_room_shares_inst_idx on public.study_room_shares (institution, starts_at);
create index if not exists study_room_shares_user_idx on public.study_room_shares (user_id);
create index if not exists study_room_shares_claimed_idx on public.study_room_shares (claimed_by);

create or replace function public.study_room_shares_before_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select auth.uid()) is not null then
    new.user_id := (select auth.uid());
    new.status := 'open';
    new.claimed_by := null;
  end if;
  if new.ends_at <= now() then
    raise exception 'slot_in_past: that time has already passed' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
drop trigger if exists study_room_shares_set_institution on public.study_room_shares;
create trigger study_room_shares_set_institution before insert on public.study_room_shares
  for each row execute function public.campus_set_institution();
drop trigger if exists study_room_shares_prep on public.study_room_shares;
create trigger study_room_shares_prep before insert on public.study_room_shares
  for each row execute function public.study_room_shares_before_insert();
drop trigger if exists study_room_shares_text_guard on public.study_room_shares;
create trigger study_room_shares_text_guard before insert or update on public.study_room_shares
  for each row execute function public.campus_text_guard('room','note');

alter table public.study_room_shares enable row level security;
drop policy if exists "study_room_shares: read own campus" on public.study_room_shares;
create policy "study_room_shares: read own campus" on public.study_room_shares for select to authenticated
  using (
    institution = public.my_institution()
    and (ends_at > now() or user_id = (select auth.uid()) or claimed_by = (select auth.uid()))
  );
drop policy if exists "study_room_shares: add own" on public.study_room_shares;
create policy "study_room_shares: add own" on public.study_room_shares for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "study_room_shares: delete own" on public.study_room_shares;
create policy "study_room_shares: delete own" on public.study_room_shares for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.study_room_shares from anon;
-- No update policy: every change goes through the three functions below.

create or replace function public.claim_study_room_share(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := (select auth.uid());
  r public.study_room_shares;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from public.study_room_shares where id = p_id for update;
  if r.id is null or r.institution is distinct from public.my_institution() then
    raise exception 'not_found: slot not found';
  end if;
  if r.user_id = uid then raise exception 'own_slot: this is your own slot'; end if;
  if r.status <> 'open' or r.ends_at <= now() then raise exception 'not_open: this slot is no longer open'; end if;
  update public.study_room_shares set status = 'claimed', claimed_by = uid where id = p_id;
end;
$$;

create or replace function public.respond_study_room_share(p_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := (select auth.uid());
  r public.study_room_shares;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from public.study_room_shares where id = p_id for update;
  if r.id is null or r.user_id <> uid then raise exception 'not_found: slot not found'; end if;
  if r.status <> 'claimed' then raise exception 'not_claimed: nobody has claimed this slot'; end if;
  if p_accept then
    update public.study_room_shares set status = 'handed_over' where id = p_id;
  else
    update public.study_room_shares set status = 'open', claimed_by = null where id = p_id;
  end if;
end;
$$;

create or replace function public.withdraw_study_room_share(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := (select auth.uid());
  r public.study_room_shares;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from public.study_room_shares where id = p_id for update;
  if r.id is null or r.user_id <> uid then raise exception 'not_found: slot not found'; end if;
  if r.status not in ('open','claimed') then raise exception 'not_open: this slot is already closed'; end if;
  update public.study_room_shares set status = 'withdrawn' where id = p_id;
end;
$$;
revoke all on function public.claim_study_room_share(uuid) from public, anon;
revoke all on function public.respond_study_room_share(uuid, boolean) from public, anon;
revoke all on function public.withdraw_study_room_share(uuid) from public, anon;
grant execute on function public.claim_study_room_share(uuid) to authenticated;
grant execute on function public.respond_study_room_share(uuid, boolean) to authenticated;
grant execute on function public.withdraw_study_room_share(uuid) to authenticated;

-- Both sides are told at each step. Trigger only, never from the app.
create or replace function public.notify_on_study_room_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'claimed' and old.status = 'open' then
    insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
    values (new.user_id, 'study_room', 'Someone wants your study room slot',
            'Someone on your campus claimed ' || new.room || '. Confirm the hand over or decline.', 'study_room', new.id);
  elsif new.status = 'handed_over' and old.status = 'claimed' and new.claimed_by is not null then
    insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
    values (new.claimed_by, 'study_room', 'Hand over confirmed',
            'The slot in ' || new.room || ' is yours. Finish the hand over in the campus booking system.', 'study_room', new.id);
  elsif new.status = 'open' and old.status = 'claimed' and old.claimed_by is not null then
    insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
    values (old.claimed_by, 'study_room', 'Slot not handed over',
            'The slot in ' || new.room || ' was not handed over. It is open again.', 'study_room', new.id);
  elsif new.status = 'withdrawn' and old.status = 'claimed' and old.claimed_by is not null then
    insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
    values (old.claimed_by, 'study_room', 'Slot taken down',
            'The slot in ' || new.room || ' is no longer available.', 'study_room', new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists study_room_shares_notify on public.study_room_shares;
create trigger study_room_shares_notify after update of status on public.study_room_shares
  for each row execute function public.notify_on_study_room_change();

-- Commute buddy (general areas and transit lines only) -----------------------
create table if not exists public.commute_buddy_posts (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  mode text not null check (mode in ('bus','train','luas_dart','walk','cycle')),
  from_area text not null check (char_length(btrim(from_area)) between 2 and 60),
  line text check (line is null or char_length(line) <= 60),
  days text[] not null default '{}',
  depart_time text check (depart_time is null or char_length(depart_time) <= 20),
  note text check (note is null or char_length(note) <= 140),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists commute_buddy_inst_idx on public.commute_buddy_posts (institution, created_at desc);
create index if not exists commute_buddy_user_idx on public.commute_buddy_posts (user_id);
drop trigger if exists commute_buddy_set_institution on public.commute_buddy_posts;
create trigger commute_buddy_set_institution before insert on public.commute_buddy_posts
  for each row execute function public.campus_set_institution();
drop trigger if exists commute_buddy_text_guard on public.commute_buddy_posts;
create trigger commute_buddy_text_guard before insert or update on public.commute_buddy_posts
  for each row execute function public.campus_text_guard('from_area','line','note','depart_time');
alter table public.commute_buddy_posts enable row level security;
drop policy if exists "commute_buddy: read own campus" on public.commute_buddy_posts;
create policy "commute_buddy: read own campus" on public.commute_buddy_posts for select to authenticated
  using (institution = public.my_institution() and (active or user_id = (select auth.uid())));
drop policy if exists "commute_buddy: add own" on public.commute_buddy_posts;
create policy "commute_buddy: add own" on public.commute_buddy_posts for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "commute_buddy: update own" on public.commute_buddy_posts;
create policy "commute_buddy: update own" on public.commute_buddy_posts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "commute_buddy: delete own" on public.commute_buddy_posts;
create policy "commute_buddy: delete own" on public.commute_buddy_posts for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.commute_buddy_posts from anon;

-- Text guard on existing member text columns ---------------------------------
do $$
declare
  spec record;
begin
  for spec in
    select * from (values
      ('accommodation_posts',    'title,description,location,contact_preference'),
      ('campus_events',          'event_name,description,location,organiser'),
      ('lost_found_posts',       'item_description,location,contact_method'),
      ('carpool_routes',         'from_location,to_location,notes,departure_time'),
      ('campus_pulse_responses', 'content'),
      ('campus_conversations',   'title,body'),
      ('study_groups',           'subject,frequency'),
      ('module_questions',       'course,module,question_text'),
      ('module_answers',         'body'),
      ('course_boards_posts',    'title,body,course')
    ) as t(tbl, cols)
  loop
    if to_regclass('public.' || spec.tbl) is not null then
      execute format('drop trigger if exists %I on public.%I', spec.tbl || '_campus_text_guard', spec.tbl);
      execute format(
        'create trigger %I before insert or update on public.%I for each row execute function public.campus_text_guard(%s)',
        spec.tbl || '_campus_text_guard', spec.tbl,
        (select string_agg(quote_literal(c), ',') from unnest(string_to_array(spec.cols, ',')) c)
      );
    end if;
  end loop;
end $$;

-- Live counts per board (real rows only) -------------------------------------
create or replace function public.campus_board_counts()
returns table (board_key text, total bigint, this_week bigint)
language sql stable security invoker set search_path = public as $$
  select 'accommodation', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.accommodation_posts
  union all select 'carpool', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.carpool_routes where active
  union all select 'events', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.campus_events
  union all select 'study-groups', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.study_groups
  union all select 'lost-found', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.lost_found_posts
  union all select 'conversations', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.campus_conversations
  union all select 'clubs', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.clubs_societies where status = 'active'
  union all select 'projects', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.project_collaborations
  union all select 'problems', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.problems_posts
  union all select 'subscriptions', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.shared_subscriptions
  union all select 'reviews', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.college_reviews
  union all select 'suggestions', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.campus_suggestions
  union all select 'ads', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.student_ads
  union all select 'opportunities', count(*), count(*) filter (where created_at > now() - interval '7 days') from public.opportunities;
$$;
revoke all on function public.campus_board_counts() from public, anon;
grant execute on function public.campus_board_counts() to authenticated;

-- Campus Pulse: a pool of questions that rotate -------------------------------
alter table public.campus_pulse_prompts add column if not exists tone text not null default 'light' check (tone in ('serious','light'));
alter table public.campus_pulse_prompts add column if not exists rotating boolean not null default false;
alter table public.campus_pulse_prompts add column if not exists is_ubp boolean not null default true;

update public.campus_pulse_prompts set rotating = true where rotating = false;
update public.campus_pulse_prompts set tone = 'serious'
  where prompt_text in ('How''s the deadline/exam stress sitting with you right now, honestly?',
                        'What''s one thing about this week you wish someone had warned you about?');

insert into public.campus_pulse_prompts (prompt_text, sort_order, active, tone, rotating, is_ubp)
select v.t, v.o, false, v.tone, true, true
from (values
  ('What is one thing you wish your first week had explained better?', 9, 'serious'),
  ('What is the best money saving tip you picked up this year?', 10, 'serious'),
  ('What would make getting to campus cheaper or easier for you?', 11, 'serious'),
  ('Is there anything on campus that makes you feel less safe? Say where, not who.', 12, 'serious'),
  ('What is one thing a friend did that really helped you lately?', 13, 'serious'),
  ('What study habit actually works for you, and which one is a lie you tell yourself?', 14, 'serious'),
  ('Rate your canteen coffee out of ten and defend your score.', 15, 'light'),
  ('Which hill, staircase or corridor on campus has defeated you?', 16, 'light'),
  ('What is the most chaotic thing you have seen in the library?', 17, 'light'),
  ('Name one song that gets you through a Monday 9am.', 18, 'light'),
  ('If your campus had a mascot, what would it be?', 19, 'light'),
  ('What is the best use of a free hour between lectures?', 20, 'light')
) as v(t, o, tone)
where not exists (select 1 from public.campus_pulse_prompts p where p.prompt_text = v.t);
