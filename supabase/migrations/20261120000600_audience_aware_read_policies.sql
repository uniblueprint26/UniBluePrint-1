-- Changes: replaces the "anyone signed in" read policies on feed_comments, feed_post_reactions and chat_rooms with audience aware ones (comments and reactions follow the post's audience, direct chat rooms are readable only by their people), and makes comment and reaction inserts require a visible post. Destructive: no (policies only; data untouched). Undo: drop the new policies and re-create the old ones (listed at the bottom).
--
-- F13 / G6: production had USING (true) for feed_comments, feed_post_reactions
-- and chat_rooms. Anyone signed in could read comments and reactions of a
-- Friends only or Campus post if they knew its id, and could list who chats
-- with whom (a direct room's context_id is the two user ids joined).
--
-- How it works
--  * A subselect on feed_posts inside a policy runs under the caller's own RLS,
--    so it only finds posts the caller may see through "feed_posts: read by
--    audience" (course, own, campus via same_institution, friends via
--    is_mutual_follow, seeded posts with no user). A comment or reaction is
--    visible exactly when its post is. This also picks up the new
--    campus_community rule from migration 0100.
--  * Inserting a comment or reaction now needs the post to be visible too, so
--    nobody can comment on a post they are not allowed to see.
--  * chat_rooms: ad, carpool and board rooms stay readable by any signed in
--    person (people look a room up by its context id before they join; the
--    messages stay protected by chat_messages policies). Direct rooms are
--    readable only by the two participants (checked by is_chat_participant,
--    a definer helper that avoids a policy recursion), plus the creator so an
--    insert that returns the new row keeps working.
--  * Notifications that open a chat room look it up as a participant, so they
--    keep working. start_direct_chat and get_chat_room_peer_names are
--    SECURITY DEFINER and unaffected.
-- Not changed here: society_members is still readable by any signed in
-- person (members of public societies); review separately if societies can be private.

-- Comments
drop policy if exists "Authenticated can read feed comments" on public.feed_comments;
drop policy if exists "feed_comments: read if post visible" on public.feed_comments;
create policy "feed_comments: read if post visible" on public.feed_comments
  for select to authenticated
  using (exists (select 1 from public.feed_posts p where p.id = feed_comments.post_id));

drop policy if exists "Users can insert own feed comments" on public.feed_comments;
create policy "Users can insert own feed comments" on public.feed_comments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.feed_posts p where p.id = feed_comments.post_id)
  );

-- Reactions
drop policy if exists "Authenticated can read feed reactions" on public.feed_post_reactions;
drop policy if exists "feed_reactions: read if post visible" on public.feed_post_reactions;
create policy "feed_reactions: read if post visible" on public.feed_post_reactions
  for select to authenticated
  using (exists (select 1 from public.feed_posts p where p.id = feed_post_reactions.post_id));

drop policy if exists "Users can insert own feed reactions" on public.feed_post_reactions;
create policy "Users can insert own feed reactions" on public.feed_post_reactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.feed_posts p where p.id = feed_post_reactions.post_id)
  );

-- Chat rooms
-- The participant check goes through a SECURITY DEFINER helper, not a subselect
-- on chat_participants. A direct subselect makes Postgres report "infinite
-- recursion detected in policy for relation chat_participants", because the
-- chat_participants insert policy ("Users can join group rooms") itself reads
-- chat_rooms. (Found by running this file against a local copy of the schema.)
create or replace function public.is_chat_participant(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_participants cp
    where cp.room_id = p_room_id and cp.user_id = auth.uid()
  );
$$;

revoke all on function public.is_chat_participant(uuid) from public, anon;
grant execute on function public.is_chat_participant(uuid) to authenticated, service_role;

drop policy if exists "Authenticated can read chat rooms" on public.chat_rooms;
drop policy if exists "chat_rooms: read non direct or own" on public.chat_rooms;
create policy "chat_rooms: read non direct or own" on public.chat_rooms
  for select to authenticated
  using (
    context_type <> 'direct'
    or created_by = (select auth.uid())
    or public.is_chat_participant(id)
  );

-- Original policies, for undo (also drop function public.is_chat_participant(uuid) afterwards):
--   create policy "Authenticated can read feed comments" on public.feed_comments for select to authenticated using (true);
--   create policy "Users can insert own feed comments" on public.feed_comments for insert to authenticated with check ((select auth.uid()) = user_id);
--   create policy "Authenticated can read feed reactions" on public.feed_post_reactions for select to authenticated using (true);
--   create policy "Users can insert own feed reactions" on public.feed_post_reactions for insert to authenticated with check ((select auth.uid()) = user_id);
--   create policy "Authenticated can read chat rooms" on public.chat_rooms for select to authenticated using (true);
