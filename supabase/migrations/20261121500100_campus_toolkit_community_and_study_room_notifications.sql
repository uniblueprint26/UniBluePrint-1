-- Changes: (1) my_institution() now returns the member's campus community, so busy spots, study rooms and commute buddy work for apprentices (training provider) and workers (industry) as well as students. (2) notif_group() maps the study_room category to the pillar switch, and notify_on_study_room_change() sends through notify_member() so it respects notification_preferences. Destructive: no (function bodies only, no data changes). Undo: restore the two earlier bodies at the bottom of this file.
--
-- my_institution() is what the campus_set_institution() trigger writes into
-- busy_spots, study_room_shares and commute_buddy_posts, and what their read
-- policies compare against. It read profiles.institution only, so apprentices
-- and workers (who have training_provider or industry instead) were told to
-- choose a campus first. It now returns, in order: campus_community (the
-- trigger-filled group from 20261120000100), institution, training_provider,
-- industry. Same name and signature, so no policy or trigger changes.
-- Existing rows keep working for students, because campus_community equals
-- institution for them.
--
-- Study room notifications used to insert straight into public.notifications,
-- so the member's switches were ignored. notify_member() already checks
-- notification_preferences by group (pillar, interest, trending, following)
-- and is what the pillar triggers use. study_room is a Campus Connect
-- notification, so it joins the pillar group ("Across the app" in the app).
-- Quiet hours: dispatch_push_for_notification() already skips the push during
-- a member's quiet hours (the in app row is still kept), so that part holds
-- for study room rows too.
-- Both functions were read from production (pg_proc) before writing this.

create or replace function public.my_institution()
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    nullif(btrim(campus_community), ''),
    nullif(btrim(institution), ''),
    nullif(btrim(training_provider), ''),
    nullif(btrim(industry), '')
  )
  from public.profiles where id = (select auth.uid());
$$;

create or replace function public.notif_group(p_category text)
returns text
language sql
immutable
set search_path to ''
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
    when 'study_room'       then 'pillar'
    else 'core'
  end
$$;

create or replace function public.notify_on_study_room_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'claimed' and old.status = 'open' then
    perform public.notify_member(new.user_id, 'study_room', 'Someone wants your study room slot',
      'Someone in your campus group claimed ' || new.room || '. Confirm the hand over or decline.', 'study_room', new.id);
  elsif new.status = 'handed_over' and old.status = 'claimed' and new.claimed_by is not null then
    perform public.notify_member(new.claimed_by, 'study_room', 'Hand over confirmed',
      'The slot in ' || new.room || ' is yours. Finish the hand over in the campus booking system.', 'study_room', new.id);
  elsif new.status = 'open' and old.status = 'claimed' and old.claimed_by is not null then
    perform public.notify_member(old.claimed_by, 'study_room', 'Slot not handed over',
      'The slot in ' || new.room || ' was not handed over. It is open again.', 'study_room', new.id);
  elsif new.status = 'withdrawn' and old.status = 'claimed' and old.claimed_by is not null then
    perform public.notify_member(old.claimed_by, 'study_room', 'Slot taken down',
      'The slot in ' || new.room || ' is no longer available.', 'study_room', new.id);
  end if;
  return new;
end;
$$;

-- Keep these server only, like the other trigger functions.
revoke all on function public.notify_on_study_room_change() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- UNDO (original bodies, from production):
--   my_institution:  select nullif(btrim(institution), '') from public.profiles where id = (select auth.uid());
--   notif_group:     the same list without the study_room line.
--   notify_on_study_room_change: the same branches with plain
--     insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
--     values (..., 'study_room', ...) and the word campus in the claimed message ("on your campus").
