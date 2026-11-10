-- Security hardening: three SECURITY DEFINER functions were anon-executable
-- with no explicit auth check, flagged by the anon-callable-function audit.
--
-- increment_past_paper_downloads / increment_shared_note_downloads: neither
-- checked auth.uid() at all -- callable by anon, no rate limit, and the
-- count they bump feeds get_popular_notes()'s ranking, so an anonymous
-- caller could script-spam either to inflate a paper/note's ranking.
-- Converted from LANGUAGE SQL to LANGUAGE plpgsql purely to add the guard;
-- the UPDATE itself is unchanged.
--
-- start_direct_chat: every sibling function in this file already has an
-- explicit `auth.uid() is null` guard; this one didn't -- it was safe only
-- by accident, via a downstream NOT NULL constraint on
-- chat_participants.user_id causing a rollback. Adding the same explicit
-- guard its siblings already use. Purely additive -- no change to any
-- already-authenticated-path behavior.

CREATE OR REPLACE FUNCTION public.increment_past_paper_downloads(paper_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.past_papers set download_count = download_count + 1 where id = paper_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.increment_shared_note_downloads(note_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.shared_notes set download_count = download_count + 1 where id = note_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.start_direct_chat(other_user_id uuid, room_name text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_context_id text;
  v_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if other_user_id = auth.uid() then
    raise exception 'cannot start a direct chat with yourself';
  end if;

  if exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = auth.uid() and b.blocked_id = other_user_id)
       or (b.blocker_id = other_user_id and b.blocked_id = auth.uid())
  ) then
    raise exception 'blocked';
  end if;

  v_context_id := (select string_agg(id::text, '_' order by id) from unnest(array[auth.uid(), other_user_id]) as id);

  insert into public.chat_rooms (context_type, context_id, name, created_by)
  values ('direct', v_context_id, room_name, auth.uid())
  on conflict (context_type, context_id) do nothing;

  select id into v_room_id from public.chat_rooms
    where context_type = 'direct' and context_id = v_context_id;

  insert into public.chat_participants (room_id, user_id, display_name)
  values
    (v_room_id, auth.uid(), coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), 'Member')),
    (v_room_id, other_user_id, coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = other_user_id), 'Member'))
  on conflict (room_id, user_id) do nothing;

  return v_room_id;
end; $function$;
