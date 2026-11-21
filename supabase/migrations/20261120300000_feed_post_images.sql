-- Several pictures per Post (up to 6).
--
-- feed_posts.image_urls holds every picture, in the order the member chose.
-- feed_posts.photo_url stays and always holds the first picture (the cover), so
-- every older reader of photo_url keeps working and every old single picture
-- post (image_urls empty) keeps rendering from photo_url alone.
--
-- The existing feed_posts_check already requires a Post to have photo_url, so
-- no change to it is needed: the app writes photo_url = image_urls[1], and the
-- trigger below enforces it.
--
-- Safe to run more than once.

alter table public.feed_posts
  add column if not exists image_urls text[] not null default '{}';

alter table public.feed_posts drop constraint if exists feed_posts_image_urls_max;
alter table public.feed_posts add constraint feed_posts_image_urls_max
  check (cardinality(image_urls) <= 6);

-- Pictures only belong to a Post. Compared as text so this file never needs
-- the newer enum values.
alter table public.feed_posts drop constraint if exists feed_posts_image_urls_post_only;
alter table public.feed_posts add constraint feed_posts_image_urls_post_only
  check (cardinality(image_urls) = 0 or post_type::text = 'post');

-- When the list is given, the cover must be its first picture.
create or replace function public.feed_posts_sync_cover()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if cardinality(new.image_urls) > 0 then
    new.photo_url := new.image_urls[1];
  end if;
  return new;
end;
$$;

drop trigger if exists trg_feed_posts_sync_cover on public.feed_posts;
create trigger trg_feed_posts_sync_cover
  before insert or update of image_urls on public.feed_posts
  for each row execute function public.feed_posts_sync_cover();

-- ── feed-photos bucket limits ────────────────────────────────────────────────
-- 10 MB a picture and pictures only. The app resizes to 1600 px and saves JPEG,
-- so real uploads are far smaller. Existing policies (public read, each member
-- writes and deletes only under their own <user_id>/ folder) are unchanged.
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'feed-photos';
