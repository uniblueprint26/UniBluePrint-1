-- Social Feed: Post (photo + caption) and Thread (text + mood) cards for the
-- Home tab, mood-tagged reactions, and admin-insertable promoted placements
-- ("Ad" cards) interleaved in the feed. Replaces the old "Live Activity"
-- list on HomeScreen.jsx with a real feed; activity_events is untouched and
-- keeps serving the Profile stats screen.
--
-- Visibility: this app has no blocking/privacy-tier system yet anywhere in
-- the social graph — coach_profiles, boards and posts (Campus Connect) are
-- all `for select to authenticated using (true)`, and DirectoryScreen.jsx
-- still renders a static roster rather than reading real profiles (see
-- 20260811090000's note). feed_posts follows that same established
-- convention: readable by any authenticated user. connection_requests exists
-- but nothing in the app currently restricts visibility by connection state,
-- so narrowing the feed to "connections only" would be new, unestablished
-- behaviour, not a pattern carried over from elsewhere. Flagged in the build
-- report for the founder — worth a deliberate call if/when a real
-- block/connections-gated visibility model is built.
--
-- Mood vocabulary (shared by a Thread's own mood and a reaction's mood):
--   flying_it | locked_in | banjaxed | delira | sound | buzzing

create type public.feed_mood as enum (
  'flying_it', 'locked_in', 'banjaxed', 'delira', 'sound', 'buzzing'
);

create type public.feed_post_type as enum ('post', 'thread');

-- ── feed_posts ───────────────────────────────────────────────────────────────
-- A "Post" is photo + optional caption (photo_url required, mood null).
-- A "Thread" is mood + text (mood + body required, no photo). The "Mood
-- Board" name belongs to the mood-picker UI in the Composer, not this type.

create table public.feed_posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  post_type       public.feed_post_type not null,
  mood            public.feed_mood,
  body            text,
  photo_url       text,
  author_name     text,   -- denormalized, same pattern as public.posts.author_name
  reaction_count  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (char_length(coalesce(body, '')) <= 2000),
  check (
    (post_type = 'thread' and mood is not null and body is not null and char_length(body) > 0 and photo_url is null)
    or
    (post_type = 'post' and photo_url is not null)
  )
);

create index feed_posts_created_at_idx on public.feed_posts (created_at desc);
create index feed_posts_window_rank_idx on public.feed_posts (created_at desc, reaction_count desc);
create index feed_posts_user_idx on public.feed_posts (user_id);
create index feed_posts_thread_mood_idx on public.feed_posts (post_type, mood, created_at desc) where post_type = 'thread';

alter table public.feed_posts enable row level security;

create policy "Authenticated can read feed posts" on public.feed_posts
  for select to authenticated using (true);
create policy "Users can insert own feed posts" on public.feed_posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own feed posts" on public.feed_posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own feed posts" on public.feed_posts
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_feed_post_author_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.author_name is null then
    select full_name into new.author_name from public.profiles where id = new.user_id;
  end if;
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_feed_post_author_name on public.feed_posts;
create trigger trg_feed_post_author_name
  before insert on public.feed_posts
  for each row execute function public.set_feed_post_author_name();

drop trigger if exists trg_feed_post_touch on public.feed_posts;
create trigger trg_feed_post_touch
  before update on public.feed_posts
  for each row execute function public.set_feed_post_author_name();


-- ── feed_post_reactions ─────────────────────────────────────────────────────
-- A reaction carries a mood (one of the same 6), stored distinctly from the
-- post's own mood. One reaction per user per post — reacting again with a
-- different mood changes it rather than stacking a second reaction.

create table public.feed_post_reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.feed_posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  mood        public.feed_mood not null,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

create index feed_post_reactions_post_idx on public.feed_post_reactions (post_id);

alter table public.feed_post_reactions enable row level security;

create policy "Authenticated can read feed reactions" on public.feed_post_reactions
  for select to authenticated using (true);
create policy "Users can insert own feed reactions" on public.feed_post_reactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own feed reactions" on public.feed_post_reactions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own feed reactions" on public.feed_post_reactions
  for delete to authenticated using (auth.uid() = user_id);

-- Keep feed_posts.reaction_count in sync so "most-reacted in window" ranking
-- (the Buzz strip's Week/Month/Year sort, and the Buzzing highlight card)
-- doesn't need a count(*) join on every feed load.
create or replace function public.update_feed_post_reaction_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.feed_posts set reaction_count = reaction_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.feed_posts set reaction_count = greatest(reaction_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_feed_reaction_count on public.feed_post_reactions;
create trigger trg_feed_reaction_count
  after insert or delete on public.feed_post_reactions
  for each row execute function public.update_feed_post_reaction_count();


-- ── promoted_placements ("Ad" cards in the feed) ────────────────────────────
-- Data model only, per the locked spec — the Ad Board purchase/admin UI for
-- creating these is explicitly out of scope for this build. Admin-insertable
-- (Supabase Studio or a future admin panel), feed just renders one when
-- active and in-window, labelled plainly "Ad" — never disguised as organic.

create table public.promoted_placements (
  id            uuid primary key default gen_random_uuid(),
  sponsor_name  text not null,
  title         text not null,
  body          text,
  image_url     text,
  cta_label     text,
  cta_url       text,
  active        boolean not null default true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

alter table public.promoted_placements enable row level security;

create policy "Authenticated can read active placements" on public.promoted_placements
  for select to authenticated using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );
create policy "Founder_operations manage placements" on public.promoted_placements
  for all to authenticated
  using (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'admin'));


-- ── feed-photos storage bucket ──────────────────────────────────────────────
-- Same pattern as ad-images: owner-scoped path {user_id}/{timestamp}.jpg,
-- public read (feed photos are shown to everyone the feed is shown to).

insert into storage.buckets (id, name, public)
values ('feed-photos', 'feed-photos', true)
on conflict (id) do nothing;

create policy "feed-photos: owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'feed-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "feed-photos: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'feed-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "feed-photos: public read"
  on storage.objects for select to public
  using (bucket_id = 'feed-photos');


-- ── Contextual share prompts (coach/partner-editable text) ──────────────────
-- Lower-priority per the build order, but cheap to land alongside the rest
-- of the schema: an editable prompt shown after a student finishes a session
-- with a coach, or redeems a partner's code. Null/blank falls back to a
-- generic platform line, applied in app code, not here.

alter table public.coach_profiles
  add column if not exists share_prompt_text text;

alter table public.partners
  add column if not exists share_prompt_text text;


-- ── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.feed_posts;
alter publication supabase_realtime add table public.feed_post_reactions;
