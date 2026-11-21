-- Live, step 2 of 2: a camera moment that can be posted any time.
--
-- Run AFTER 20261120300100_feed_live_enum.sql has committed (a new enum value
-- cannot be used in the transaction that adds it). Everything here compares
-- post_type as text so this file also parses on its own.
--
-- What a Live is
--   One moment taken with the back and the front camera. Two pictures, kept in
--   a PRIVATE storage bucket (live-moments), never a public URL. The audience is
--   Course Connect, Campus Connect or Friends only, and the member can also
--   choose to show it publicly on Course Connect (also_course).
--   Others can see it for 24 hours (expires_at, set by the database, never by the
--   app). After that only the poster can see it, as their private archive.
--   Nothing needs to run to expire it: the read policy checks the time.
--
-- Safe to run more than once.

-- ── columns ──────────────────────────────────────────────────────────────────
alter table public.feed_posts
  add column if not exists live_path text,
  add column if not exists live_front_path text,
  add column if not exists expires_at timestamptz,
  add column if not exists also_course boolean not null default false;

create index if not exists feed_posts_live_rail_idx
  on public.feed_posts (expires_at desc)
  where post_type::text = 'live';
create index if not exists feed_posts_live_path_idx on public.feed_posts (live_path) where live_path is not null;
create index if not exists feed_posts_live_front_path_idx on public.feed_posts (live_front_path) where live_front_path is not null;

-- ── what each kind of post must look like ────────────────────────────────────
alter table public.feed_posts drop constraint if exists feed_posts_check;
alter table public.feed_posts add constraint feed_posts_check check (
  (post_type::text = 'thread' and mood is not null and body is not null and char_length(body) > 0
     and photo_url is null and video_url is null)
  or
  (post_type::text = 'post' and photo_url is not null and mood is null and video_url is null)
  or
  (post_type::text = 'clip' and video_url is not null and mood is null and photo_url is null)
  or
  (post_type::text = 'live' and live_path is not null and expires_at is not null
     and mood is null and photo_url is null and video_url is null)
);

alter table public.feed_posts drop constraint if exists feed_posts_live_columns;
alter table public.feed_posts add constraint feed_posts_live_columns check (
  post_type::text = 'live'
  or (live_path is null and live_front_path is null and expires_at is null and also_course = false)
);

-- ── block check that reads the real block list ───────────────────────────────
-- Security definer so it can see blocks made in either direction (the blocks
-- table only lets a member read their own).
create or replace function public.either_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocked_users
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;
revoke all on function public.either_blocked(uuid, uuid) from public, anon;
grant execute on function public.either_blocked(uuid, uuid) to authenticated;

-- ── who can read a post ──────────────────────────────────────────────────────
-- Same rules as before for every other kind of post. A Live is also hidden once
-- it has expired (except from its poster) and from anyone in a block with the
-- poster, and it shows to everyone when also_course is on.
drop policy if exists "feed_posts: read by audience" on public.feed_posts;
create policy "feed_posts: read by audience" on public.feed_posts for select to authenticated using (
  user_id is null
  or user_id = (select auth.uid())
  or (
    (post_type::text <> 'live'
       or (expires_at > now() and not public.either_blocked((select auth.uid()), user_id)))
    and (
      audience = 'course'
      or (post_type::text = 'live' and also_course)
      or (audience = 'campus' and public.same_institution((select auth.uid()), user_id))
      or (audience = 'friends' and public.is_mutual_follow((select auth.uid()), user_id))
    )
  )
);

-- ── set and protect the Live fields ──────────────────────────────────────────
create or replace function public.feed_posts_live_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  recent integer;
begin
  if tg_op = 'INSERT' then
    if new.post_type::text = 'live' then
      -- The database decides when it expires. The app cannot stretch it.
      new.expires_at := now() + interval '24 hours';
      -- The pictures must be in the poster's own folder of the private bucket.
      if new.live_path is null
         or split_part(new.live_path, '/', 1) <> new.user_id::text
         or (new.live_front_path is not null and split_part(new.live_front_path, '/', 1) <> new.user_id::text) then
        raise exception 'live_invalid: pictures must be in your own folder' using errcode = 'check_violation';
      end if;
      -- A gentle limit so storage cannot be flooded.
      select count(*) into recent from public.feed_posts
       where user_id = new.user_id and post_type::text = 'live' and created_at > now() - interval '24 hours';
      if recent >= 10 then
        raise exception 'live_limit: too many Live moments today' using errcode = 'check_violation';
      end if;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.post_type::text = 'live' then
      new.expires_at := old.expires_at;
      new.live_path := old.live_path;
      new.live_front_path := old.live_front_path;
      new.post_type := old.post_type;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feed_posts_live_guard on public.feed_posts;
create trigger trg_feed_posts_live_guard
  before insert or update on public.feed_posts
  for each row execute function public.feed_posts_live_guard();

-- The caption goes through the same text guard as every other post: the
-- existing trigger trg_feed_posts_text_guard (20261118121000) checks body on
-- insert and update, so a Live caption is covered with no change.

-- ── reactions: only on something you can see ─────────────────────────────────
-- Not new for Live alone, but it matters most here: nobody can react to a Live
-- that has expired or that they are blocked from. The select inside runs with
-- the reacting member's own read rights, so an unreadable post is not found.
create or replace function public.feed_reaction_target_visible()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.feed_posts p where p.id = new.post_id) then
    raise exception 'feed_reaction: post not available' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feed_reaction_target_visible on public.feed_post_reactions;
create trigger trg_feed_reaction_target_visible
  before insert on public.feed_post_reactions
  for each row execute function public.feed_reaction_target_visible();

-- ── live-moments bucket (private) ────────────────────────────────────────────
-- 5 MB a picture, JPEG only. Not public: viewers get short lived signed links,
-- and the read policy below follows who can read the post.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('live-moments', 'live-moments', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "live-moments: owner insert" on storage.objects;
create policy "live-moments: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'live-moments' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "live-moments: owner delete" on storage.objects;
create policy "live-moments: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'live-moments' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- The poster always. Anyone else only while a post that uses this file is
-- readable to them (so it stops working at expiry and after a block).
drop policy if exists "live-moments: read if post readable" on storage.objects;
create policy "live-moments: read if post readable" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'live-moments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.feed_posts p
        where p.live_path = objects.name or p.live_front_path = objects.name
      )
    )
  );
