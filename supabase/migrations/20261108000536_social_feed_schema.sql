-- Comments and Saved Posts for the Home feed (feed_posts). Mirrors every
-- convention established in 20261107090000_social_feed.sql: denormalized
-- author_name filled by a before-insert trigger, a count kept in sync on
-- feed_posts via an after-insert/delete trigger, and the same "authenticated
-- can read, owner can write" RLS shape feed_post_reactions already uses —
-- except feed_saved_posts, which is private (own rows only, no public read):
-- what a person has bookmarked is personal, unlike a comment or a reaction,
-- which are already visible content on the post itself.
--
-- See supabase/migrations/20261107090000_social_feed.sql for feed_posts,
-- feed_post_reactions, and the mood enum this comments/saves work sits
-- alongside.

-- ── feed_posts.comment_count ────────────────────────────────────────────────
-- Same reasoning as feed_posts.reaction_count: avoids a count(*) join on
-- every feed load just to show "n comments" on the Comment button.

alter table public.feed_posts
  add column if not exists comment_count integer not null default 0;


-- ── feed_comments ────────────────────────────────────────────────────────────

create table public.feed_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.feed_posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  author_name text,  -- denormalized, same pattern as feed_posts.author_name
  created_at  timestamptz not null default now(),
  check (char_length(body) > 0 and char_length(body) <= 1000)
);

create index feed_comments_post_idx on public.feed_comments (post_id, created_at);
create index feed_comments_user_idx on public.feed_comments (user_id);

alter table public.feed_comments enable row level security;

create policy "Authenticated can read feed comments" on public.feed_comments
  for select to authenticated using (true);
create policy "Users can insert own feed comments" on public.feed_comments
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own feed comments" on public.feed_comments
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own feed comments" on public.feed_comments
  for delete to authenticated using (auth.uid() = user_id);

-- Same shape as public.set_feed_post_author_name() in the social_feed
-- migration — fills author_name from profiles at insert time if the caller
-- didn't already supply one.
create or replace function public.set_feed_comment_author_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.author_name is null then
    select full_name into new.author_name from public.profiles where id = new.user_id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_feed_comment_author_name on public.feed_comments;
create trigger trg_feed_comment_author_name
  before insert on public.feed_comments
  for each row execute function public.set_feed_comment_author_name();

-- Keep feed_posts.comment_count in sync — same pattern as
-- public.update_feed_post_reaction_count() in the social_feed migration.
create or replace function public.update_feed_post_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.feed_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_feed_comment_count on public.feed_comments;
create trigger trg_feed_comment_count
  after insert or delete on public.feed_comments
  for each row execute function public.update_feed_post_comment_count();


-- ── feed_saved_posts ─────────────────────────────────────────────────────────
-- Private bookmarks — unlike feed_posts/feed_post_reactions/feed_comments,
-- which are all "authenticated can read all", a saved-posts row is never
-- readable by anyone but the person who saved it. One save per user per post.

create table public.feed_saved_posts (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.feed_posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

create index feed_saved_posts_user_idx on public.feed_saved_posts (user_id, created_at desc);

alter table public.feed_saved_posts enable row level security;

create policy "Users can read own saved posts" on public.feed_saved_posts
  for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own saved posts" on public.feed_saved_posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own saved posts" on public.feed_saved_posts
  for delete to authenticated using (auth.uid() = user_id);


-- ── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.feed_comments;
alter publication supabase_realtime add table public.feed_saved_posts;
