-- In-app Notification Center: deep-link columns, a single creation choke
-- point, and real triggers for the events that were still silent.
--
-- ═══ What already existed before this migration ═══════════════════════════
-- public.notifications (id, user_id, category, title, message, read,
-- created_at) has existed since the very first schema migration, is on
-- supabase_realtime, and already has five real writers: welcome (on
-- profile creation), coach_booking (request/confirm/decline — see
-- 20260907120000_coach_bookings.sql), and three Foundation Blueprint
-- moments (delivered, marked incomplete, cancelled, contacted — see
-- 20260726110000_handler_pipeline.sql and
-- 20260727090000_escalation_performance_ops.sql). The app side
-- (NotificationsScreen, the HomeScreen bell badge, TopBar) already reads
-- and renders all of that live. What's missing is (a) anywhere to send a
-- tap, and (b) two more real event sources: chat messages, and a reply on
-- a board post.
--
-- ═══ Push-readiness ═════════════════════════════════════════════════════════
-- No push infrastructure is added here. Two things are put in place so a
-- push layer is additive rather than a rebuild:
--   1. related_entity_type/related_entity_id below are intentionally
--      generic — an entity kind + id, not an in-app route name or a web
--      URL. Whatever renders the notification (this app today, a push
--      payload tomorrow) maps that pair to its own deep link. Nothing
--      in-app-specific is baked into the schema.
--   2. public.create_notification() is the one place a notification row
--      gets created from here on. A push layer has two equally clean
--      hook points and can pick either without touching this migration
--      again: add a dispatch call inside create_notification itself, or
--      — since every insert, from this function or otherwise, already
--      lands in public.notifications, which is already on
--      supabase_realtime — attach a plain `after insert on
--      public.notifications` trigger that calls a push-send Edge
--      Function (e.g. via pg_net). Either way, no schema change.

-- ── 1. Deep-link columns ─────────────────────────────────────────────────────

alter table public.notifications
  add column if not exists related_entity_type text,
  add column if not exists related_entity_id   uuid;

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read, created_at desc);

-- ── 2. The single creation choke point ───────────────────────────────────────

create or replace function public.create_notification(
  p_user_id              uuid,
  p_category             text,
  p_title                text,
  p_message              text default null,
  p_related_entity_type  text default null,
  p_related_entity_id    uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
  values (p_user_id, p_category, p_title, p_message, p_related_entity_type, p_related_entity_id)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.create_notification(uuid, text, text, text, text, uuid) to authenticated;

-- ── 3. Re-point the existing writers through it, and stamp a deep-link ──────
-- Behaviour is unchanged — same checks, same tables touched, same copy —
-- these just also record what the notification is about. (The four
-- Foundation Blueprint writers — deliver_submission, mark_submission_
-- incomplete, cancel_submission, contact_student — get the same treatment
-- in 20260915090001_notification_center_foundation_blueprint.sql, kept
-- separate because they depend on columns/functions that ship in
-- 20260726110000_handler_pipeline.sql and
-- 20260727090000_escalation_performance_ops.sql, which must run first.)

create or replace function public.handle_new_profile_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.create_notification(new.id, 'welcome', 'Welcome to UniBluePrint',
    'Your Blueprint is ready. Explore your dashboard to get started.');
  return new;
end; $$;

create or replace function public.notify_on_coach_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
    select ur.user_id, 'coach_booking', 'New booking request',
           new.coach_name || ' has a new booking request for ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.',
           'coach_booking', new.id
    from public.user_roles ur where ur.role in ('operations', 'founder');

    insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
    select cp.user_id, 'coach_booking', 'New booking request',
           'A student requested ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.',
           'coach_booking', new.id
    from public.coach_profiles cp where cp.coach_slug = new.coach_slug;

  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('confirmed', 'declined') then
    perform public.create_notification(
      new.user_id, 'coach_booking',
      case when new.status = 'confirmed' then 'Booking confirmed' else 'Booking declined' end,
      new.coach_name || (case when new.status = 'confirmed' then ' confirmed' else ' declined' end)
        || ' your request for ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.',
      'coach_booking', new.id
    );
  end if;
  return new;
end; $$;

-- ── 4. New trigger: chat message received ────────────────────────────────────
-- Notifies every OTHER participant in the room (never the sender). Works for
-- all four chat contexts (ad/carpool/board/direct) since they all share
-- chat_messages/chat_participants — no per-context special-casing needed.

create or replace function public.notify_on_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, category, title, message, related_entity_type, related_entity_id)
  select cp.user_id, 'chat_message',
         'New message from ' || new.author_name,
         left(new.content, 140),
         'chat_room', new.room_id
  from public.chat_participants cp
  where cp.room_id = new.room_id and cp.user_id <> new.user_id;
  return new;
end; $$;

drop trigger if exists trg_notify_chat_message on public.chat_messages;
create trigger trg_notify_chat_message
  after insert on public.chat_messages
  for each row execute function public.notify_on_chat_message();

-- ── 5. New trigger: board post reply ─────────────────────────────────────────
-- Two real thread shapes exist today, both "post → reply" boards: Campus
-- Connect's Problems & Solutions, and Course Connect's Module Q&A. Same
-- pattern in each: notify the original poster when someone else replies,
-- never on a self-reply.

create or replace function public.notify_on_problem_solution()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_problem record;
begin
  select user_id, description into v_problem from public.problems_posts where id = new.problem_id;
  if v_problem.user_id is not null and v_problem.user_id <> new.user_id then
    perform public.create_notification(
      v_problem.user_id, 'board_reply', 'New reply to your post',
      coalesce(new.poster_name, 'Someone') || ' replied: ' || left(new.body, 140),
      'problem_solution', new.id
    );
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_problem_solution on public.problem_solutions;
create trigger trg_notify_problem_solution
  after insert on public.problem_solutions
  for each row execute function public.notify_on_problem_solution();

create or replace function public.notify_on_module_answer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_question record;
begin
  select user_id, question_text into v_question from public.module_questions where id = new.question_id;
  if v_question.user_id is not null and v_question.user_id <> new.user_id then
    perform public.create_notification(
      v_question.user_id, 'board_reply', 'New answer to your question',
      coalesce(new.poster_name, 'Someone') || ' answered: ' || left(new.body, 140),
      'module_answer', new.id
    );
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_module_answer on public.module_answers;
create trigger trg_notify_module_answer
  after insert on public.module_answers
  for each row execute function public.notify_on_module_answer();
