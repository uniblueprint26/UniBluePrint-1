-- ─── Clips: a third feed post type ───────────────────────────────────────────
-- A "Clip" is a short video (up to 60s / 50 MB, enforced in the Composer and
-- by the bucket limit below) with an optional caption. Like a Post it carries
-- no mood; unlike a Post its media lives in video_url, never photo_url.

alter type public.feed_post_type add value if not exists 'clip';

alter table public.feed_posts add column if not exists video_url text;

-- Compared as text because a new enum value can't be referenced as an enum
-- literal in the same transaction that adds it.
alter table public.feed_posts drop constraint if exists feed_posts_check;
alter table public.feed_posts add constraint feed_posts_check check (
  (post_type::text = 'thread' and mood is not null and body is not null and char_length(body) > 0
     and photo_url is null and video_url is null)
  or
  (post_type::text = 'post' and photo_url is not null and mood is null and video_url is null)
  or
  (post_type::text = 'clip' and video_url is not null and mood is null and photo_url is null)
);

-- ── feed-clips bucket ─────────────────────────────────────────────────────────
-- Same access model as feed-photos: public read, each user writes and deletes
-- only under their own <user_id>/ folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feed-clips', 'feed-clips', true, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "feed-clips: public read" on storage.objects;
create policy "feed-clips: public read" on storage.objects
  for select using (bucket_id = 'feed-clips');

drop policy if exists "feed-clips: owner insert" on storage.objects;
create policy "feed-clips: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'feed-clips' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "feed-clips: owner delete" on storage.objects;
create policy "feed-clips: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'feed-clips' and (storage.foldername(name))[1] = (select auth.uid())::text);
