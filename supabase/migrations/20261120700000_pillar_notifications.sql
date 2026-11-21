-- Notifications for every pillar, by interest, trending and budget goals, plus
-- updates from Lifestyle partners and Elevation coaches to their followers.
-- Wave 2, home / ad board / notifications slice. NOT applied by the build.
--
-- Design
--   * Every notification is created by a SECURITY DEFINER trigger function in
--     this file, through public.notify_member(), which checks the member's own
--     choices first (public.notification_preferences). The app never calls
--     create_notification.
--   * Consent: each group is switched on or off by the member. Budget nudges
--     are opt in (default off) and are scheduled on the phone, so the budget
--     itself never leaves the device. Server rows exist for interests, trending,
--     following and the pillars.
--   * Quiet hours: the in app row is always written (it is just a list), but the
--     push is held back while the member is inside their quiet hours.
--   * Nothing is invented: every row is caused by a real insert or update.
--
-- New categories (added to the notification list icon and route map in the app
-- in the same release): interest_deal, coach_match, trending_post,
-- followed_post, partner_update, coach_update, campus_event, weekly_blueprint,
-- foundation_open, budget_goal.

-- ── 1. Preferences ─────────────────────────────────────────────────────────

create table if not exists public.notification_preferences (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  pillar_alerts    boolean  not null default true,
  interest_alerts  boolean  not null default true,
  trending_alerts  boolean  not null default true,
  following_alerts boolean  not null default true,
  budget_nudges    boolean  not null default false,
  quiet_enabled    boolean  not null default true,
  quiet_start      smallint not null default 22 check (quiet_start between 0 and 23),
  quiet_end        smallint not null default 8  check (quiet_end between 0 and 23),
  -- Days of the week for a night out nudge, 0 = Sunday ... 6 = Saturday.
  night_out_days   smallint[] not null default '{4,5,6}',
  tz               text     not null default 'Europe/Dublin',
  updated_at       timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences: own read" on public.notification_preferences;
create policy "notification_preferences: own read" on public.notification_preferences
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "notification_preferences: own insert" on public.notification_preferences;
create policy "notification_preferences: own insert" on public.notification_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "notification_preferences: own update" on public.notification_preferences;
create policy "notification_preferences: own update" on public.notification_preferences
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── 2. Helpers (server only) ───────────────────────────────────────────────

create or replace function public.notif_group(p_category text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_category
    when 'interest_deal'    then 'interest'
    when 'coach_match'      then 'interest'
    when 'trending_post'    then 'trending'
    when 'followed_post'    then 'following'
    when 'partner_update'   then 'following'
    when 'coach_update'     then 'following'
    when 'campus_event'     then 'pillar'
    when 'weekly_blueprint' then 'pillar'
    when 'foundation_open'  then 'pillar'
    when 'budget_goal'      then 'pillar'
    else 'core'
  end
$$;

-- True when the member is inside their own quiet hours right now.
create or replace function public.in_quiet_hours(p_user uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p record;
  h int;
begin
  select * into p from public.notification_preferences where user_id = p_user;
  if not found or not p.quiet_enabled then return false; end if;
  begin
    h := extract(hour from (now() at time zone p.tz))::int;
  exception when others then
    h := extract(hour from (now() at time zone 'Europe/Dublin'))::int;
  end;
  if p.quiet_start = p.quiet_end then return false; end if;
  if p.quiet_start < p.quiet_end then
    return h >= p.quiet_start and h < p.quiet_end;
  end if;
  return h >= p.quiet_start or h < p.quiet_end;
end;
$$;

-- The one way the new triggers write a notification. Checks consent first.
create or replace function public.notify_member(
  p_user uuid, p_category text, p_title text, p_message text,
  p_entity_type text, p_entity_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g text := public.notif_group(p_category);
  p record;
begin
  if p_user is null then return null; end if;
  select * into p from public.notification_preferences where user_id = p_user;
  if found then
    if (g = 'pillar'    and not p.pillar_alerts)
    or (g = 'interest'  and not p.interest_alerts)
    or (g = 'trending'  and not p.trending_alerts)
    or (g = 'following' and not p.following_alerts) then
      return null;
    end if;
  end if;
  return public.create_notification(p_user, p_category, p_title, p_message, p_entity_type, p_entity_id);
end;
$$;

revoke all on function public.notify_member(uuid, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.notify_member(uuid, text, text, text, text, uuid) to service_role;
revoke all on function public.in_quiet_hours(uuid) from public, anon, authenticated;
grant execute on function public.in_quiet_hours(uuid) to service_role;

-- Interest ids (app/src/data/interests.js) that suit a Lifestyle partner type.
create or replace function public.interest_suits_partner_type(p_interests text[], p_type text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_interests && case lower(coalesce(p_type, ''))
    when 'fitness'       then array['fitness','sports_science','gaa','team_sports','outdoor_adventure','physiotherapy']
    when 'gym'           then array['fitness','sports_science','gaa','team_sports','physiotherapy']
    when 'food'          then array['culinary_arts','hospitality','nutrition']
    when 'fashion'       then array['fashion','graphic_design']
    when 'beauty'        then array['fashion']
    when 'barber'        then array['fashion']
    when 'mental-health' then array['mental_health','psychology','nutrition']
    when 'driving'       then array['outdoor_adventure']
    else array[]::text[]
  end, false)
$$;

-- ── 3. Push holds back during quiet hours ──────────────────────────────────
-- Same function as before, with one early exit. Only the push is held. The row
-- stays in the in app list.

create or replace function public.dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.in_quiet_hours(new.user_id) then
    return new;
  end if;
  begin
    perform net.http_post(
      url     := 'https://ozpeofkvnpikhopkgcxc.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cGVvZmt2bnBpa2hvcGtnY3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTE5OTUsImV4cCI6MjEwMTM2Nzk5NX0.Ge0LCzTX7aEigdtmZL-yJHrvJsqNNowmmZ2g5knZxCg'
      ),
      body    := jsonb_build_object('notification_id', new.id)
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;

-- ── 4. Lifestyle: a new deal that suits the member's interests ─────────────
-- Followers of the partner already get a row from notify_followers_of_new_deal.
-- This one reaches members whose interests suit the partner and who do not
-- follow it yet. Real deals only: active, not the auto created placeholder.

create or replace function public.notify_interest_deal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _partner record;
  _m record;
begin
  if new.auto_created or new.active is distinct from true then return new; end if;
  if new.valid_until is not null and new.valid_until < now() then return new; end if;
  select p.name, p.type, p.active into _partner from public.partners p where p.id = new.partner_id;
  if _partner.name is null or _partner.active is false then return new; end if;

  for _m in
    select pr.id from public.profiles pr
    where public.interest_suits_partner_type(pr.interests, _partner.type)
      and not exists (select 1 from public.partner_follows pf where pf.partner_id = new.partner_id and pf.user_id = pr.id)
    limit 500
  loop
    perform public.notify_member(
      _m.id, 'interest_deal', _partner.name || ' has a new deal', new.title, 'deal', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_interest_deal on public.deals;
create trigger trg_notify_interest_deal
  after insert on public.deals
  for each row execute function public.notify_interest_deal();

-- ── 5. Campus: a new campus event, for members at the same institution ─────

create or replace function public.notify_campus_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _inst text;
  _m record;
begin
  if new.user_id is null then return new; end if;
  select institution into _inst from public.profiles where id = new.user_id;
  if _inst is null or btrim(_inst) = '' then return new; end if;

  for _m in
    select pr.id from public.profiles pr
    where pr.institution = _inst and pr.id <> new.user_id
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker_id = pr.id and b.blocked_id = new.user_id)
           or (b.blocker_id = new.user_id and b.blocked_id = pr.id))
    limit 500
  loop
    perform public.notify_member(
      _m.id, 'campus_event', 'New on your campus: ' || left(new.event_name, 80),
      nullif(concat_ws(' · ', to_char(new.event_date, 'Dy DD Mon'), new.location), ''),
      'campus_event', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_campus_event on public.campus_events;
create trigger trg_notify_campus_event
  after insert on public.campus_events
  for each row execute function public.notify_campus_event();

-- ── 6. Course Connect: a post starts trending ──────────────────────────────
-- Fires once, when reaction_count first reaches 10. Tells the author, and tells
-- the people who follow the author.

create or replace function public.notify_trending_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _f record;
  _name text;
begin
  if new.user_id is null then return new; end if;
  if not (coalesce(old.reaction_count, 0) < 10 and coalesce(new.reaction_count, 0) >= 10) then return new; end if;

  perform public.notify_member(
    new.user_id, 'trending_post', 'Your post is trending',
    new.reaction_count || ' people have reacted.', 'feed_post', new.id
  );

  if new.audience = 'friends' then return new; end if;
  select full_name into _name from public.profiles where id = new.user_id;
  for _f in
    select sf.follower_id from public.student_follows sf
    where sf.followed_id = new.user_id
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker_id = sf.follower_id and b.blocked_id = new.user_id)
           or (b.blocker_id = new.user_id and b.blocked_id = sf.follower_id))
    limit 500
  loop
    perform public.notify_member(
      _f.follower_id, 'trending_post',
      coalesce(_name, 'Someone you follow') || ' is trending',
      left(coalesce(new.body, 'A post is getting attention.'), 110), 'feed_post', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_trending_post on public.feed_posts;
create trigger trg_notify_trending_post
  after update of reaction_count on public.feed_posts
  for each row execute function public.notify_trending_post();

-- ── 7. Someone you follow posts ────────────────────────────────────────────
-- Friends only posts reach mutual follows only. One row per author per
-- follower per 6 hours, so a busy author does not buzz a phone all day.

create or replace function public.notify_followed_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _f record;
  _name text;
begin
  if new.user_id is null then return new; end if;
  select full_name into _name from public.profiles where id = new.user_id;
  for _f in
    select sf.follower_id from public.student_follows sf
    where sf.followed_id = new.user_id
      and (new.audience <> 'friends' or public.is_mutual_follow(sf.follower_id, new.user_id))
      and (new.audience <> 'campus' or public.same_institution(sf.follower_id, new.user_id))
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker_id = sf.follower_id and b.blocked_id = new.user_id)
           or (b.blocker_id = new.user_id and b.blocked_id = sf.follower_id))
      and not exists (
        select 1 from public.notifications n
        where n.user_id = sf.follower_id and n.category = 'followed_post'
          and n.created_at > now() - interval '6 hours'
          and n.title = coalesce(_name, 'Someone you follow') || ' posted')
    limit 500
  loop
    perform public.notify_member(
      _f.follower_id, 'followed_post', coalesce(_name, 'Someone you follow') || ' posted',
      left(coalesce(new.body, 'New post'), 110), 'feed_post', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_followed_post on public.feed_posts;
create trigger trg_notify_followed_post
  after insert on public.feed_posts
  for each row execute function public.notify_followed_post();

-- ── 8. Weekly Blueprint: an issue is published ─────────────────────────────

create or replace function public.notify_weekly_issue_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _m record;
begin
  if new.published is distinct from true then return new; end if;
  if tg_op = 'UPDATE' and old.published is true then return new; end if;
  for _m in select id from public.profiles loop
    perform public.notify_member(
      _m.id, 'weekly_blueprint', 'The Weekly Blueprint is out',
      coalesce(nullif(new.theme, ''), 'Issue ' || new.issue_number || ' is ready to read.'),
      'weekly_issue', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_weekly_issue_published on public.weekly_issues;
create trigger trg_notify_weekly_issue_published
  after insert or update of published on public.weekly_issues
  for each row execute function public.notify_weekly_issue_published();

-- ── 9. Budgeting: a savings goal reaches its target ────────────────────────

create or replace function public.notify_budget_goal_reached()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.target_amount, 0) <= 0 then return new; end if;
  if coalesce(old.current_amount, 0) < old.target_amount
     and coalesce(new.current_amount, 0) >= new.target_amount then
    perform public.notify_member(
      new.user_id, 'budget_goal', 'You hit a savings goal',
      left(new.name, 80) || ' is fully funded.', 'budget_goal', new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_budget_goal_reached on public.budget_goals;
create trigger trg_notify_budget_goal_reached
  after update of current_amount on public.budget_goals
  for each row execute function public.notify_budget_goal_reached();

-- ── 10. Elevation: a coach who suits the member's interests goes live ──────
-- When a coach profile becomes verified and available, members whose interests
-- appear in the coach's specialisation hear about it.

create or replace function public.notify_coach_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _m record;
begin
  if not (new.verified is true and new.available is true) then return new; end if;
  if tg_op = 'UPDATE' and old.verified is true and old.available is true then return new; end if;
  if coalesce(btrim(new.specialisation), '') = '' then return new; end if;

  for _m in
    select pr.id from public.profiles pr
    where pr.id <> new.user_id
      and exists (
        select 1 from unnest(pr.interests) i
        where length(i) > 3
          and lower(new.specialisation) like '%' || replace(lower(i), '_', ' ') || '%')
    limit 500
  loop
    perform public.notify_member(
      _m.id, 'coach_match', 'A coach for your interests is on Elevation',
      left(new.specialisation, 110), 'coach_profile', new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_coach_match on public.coach_profiles;
create trigger trg_notify_coach_match
  after insert or update of verified, available on public.coach_profiles
  for each row execute function public.notify_coach_match();

-- ── 11. Followers: coaches and partners can send an update ─────────────────

create table if not exists public.coach_follows (
  user_id          uuid not null references auth.users(id) on delete cascade,
  coach_profile_id uuid not null references public.coach_profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (user_id, coach_profile_id)
);
create index if not exists idx_coach_follows_coach on public.coach_follows (coach_profile_id);
alter table public.coach_follows enable row level security;
drop policy if exists "coach_follows: own" on public.coach_follows;
create policy "coach_follows: own" on public.coach_follows
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table if not exists public.follower_updates (
  id               uuid primary key default gen_random_uuid(),
  author_kind      text not null check (author_kind in ('partner', 'coach')),
  partner_id       uuid references public.partners(id) on delete cascade,
  coach_profile_id uuid references public.coach_profiles(id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 80),
  body             text check (body is null or char_length(body) <= 240),
  created_by       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now(),
  check ((author_kind = 'partner' and partner_id is not null and coach_profile_id is null)
      or (author_kind = 'coach' and coach_profile_id is not null and partner_id is null))
);
alter table public.follower_updates enable row level security;

-- Authors can read their own sent updates. Insert only for a partner or coach
-- the signed in user is linked to.
drop policy if exists "follower_updates: author read" on public.follower_updates;
create policy "follower_updates: author read" on public.follower_updates
  for select to authenticated using (created_by = (select auth.uid()));
drop policy if exists "follower_updates: author insert" on public.follower_updates;
create policy "follower_updates: author insert" on public.follower_updates
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and (
      (author_kind = 'partner' and exists (
         select 1 from public.partner_users pu
         where pu.user_id = (select auth.uid()) and pu.partner_id = follower_updates.partner_id))
      or
      (author_kind = 'coach' and exists (
         select 1 from public.coach_profiles cp
         where cp.id = follower_updates.coach_profile_id and cp.user_id = (select auth.uid())))
    )
  );

-- Text guard (same word list as feed posts) and a gentle rate limit: one update
-- per author per 6 hours, so followers are never spammed.
create or replace function public.follower_updates_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.feed_text_is_clean(new.title) or not public.feed_text_is_clean(new.body) then
    raise exception 'feed_text_guard: community guidelines' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.follower_updates u
    where u.created_at > now() - interval '6 hours'
      and ((new.author_kind = 'partner' and u.partner_id = new.partner_id)
        or (new.author_kind = 'coach' and u.coach_profile_id = new.coach_profile_id))
  ) then
    raise exception 'follower_updates: one update every 6 hours' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_follower_updates_guard on public.follower_updates;
create trigger trg_follower_updates_guard
  before insert on public.follower_updates
  for each row execute function public.follower_updates_guard();

create or replace function public.notify_follower_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _name text;
  _f record;
begin
  if new.author_kind = 'partner' then
    select name into _name from public.partners where id = new.partner_id;
    for _f in select pf.user_id from public.partner_follows pf where pf.partner_id = new.partner_id loop
      perform public.notify_member(_f.user_id, 'partner_update', coalesce(_name, 'A partner') || ': ' || new.title,
        new.body, 'partner_update', new.id);
    end loop;
  else
    select coalesce(p.full_name, 'Your coach') into _name
    from public.coach_profiles cp left join public.profiles p on p.id = cp.user_id where cp.id = new.coach_profile_id;
    for _f in select cf.user_id from public.coach_follows cf where cf.coach_profile_id = new.coach_profile_id loop
      perform public.notify_member(_f.user_id, 'coach_update', coalesce(_name, 'Your coach') || ': ' || new.title,
        new.body, 'coach_update', new.id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_follower_update on public.follower_updates;
create trigger trg_notify_follower_update
  after insert on public.follower_updates
  for each row execute function public.notify_follower_update();

-- ── 12. Foundation: ordering opens ─────────────────────────────────────────
-- Foundation ordering is closed until January. When it opens, the team runs
-- select public.broadcast_foundation_open(); once (service role only).

create or replace function public.broadcast_foundation_open()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _m record;
  _n integer := 0;
begin
  for _m in select id from public.profiles loop
    if public.notify_member(_m.id, 'foundation_open', 'Foundation ordering is open',
         'Order your CV, cover letter or interview prep now.', null, null) is not null then
      _n := _n + 1;
    end if;
  end loop;
  return _n;
end;
$$;
revoke all on function public.broadcast_foundation_open() from public, anon, authenticated;
grant execute on function public.broadcast_foundation_open() to service_role;

-- ── 13. More than one picture on a post ────────────────────────────────────
-- photo_url stays as the first picture so older posts and clients keep working.
-- photo_urls holds all of them, up to 6, in order.

alter table public.feed_posts add column if not exists photo_urls text[] not null default '{}';
alter table public.feed_posts drop constraint if exists feed_posts_photo_urls_max;
alter table public.feed_posts add constraint feed_posts_photo_urls_max check (cardinality(photo_urls) <= 6);
