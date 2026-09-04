-- ═══════════════════════════════════════════════════════════════════════════
-- 04 — RLS: what a student can reach
--
-- The student-facing pipeline timeline never shows the word "escalated". That
-- is not a UI omission that a future change could undo — the student has no
-- read path to escalation data at all. This proves it.
--
-- Checks that a signed-in student reads ZERO rows from:
--   handler_escalations, handler_notifications,
--   operations_notifications, handler_performance_snapshots, handler_ticket_reviews
--
-- and, as a control, that they DO read their own submissions. Without that
-- control a passing test would be indistinguishable from RLS simply blocking
-- everything, or from the tables being empty.
--
-- Note: these assertions run under `set local role authenticated`. A superuser
-- bypasses RLS entirely, so running the same selects as postgres would prove
-- nothing.
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'verify-student4@example.test'),
  ('00000000-0000-0000-0000-0000000000d2', 'verify-handler4@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name) values
  ('00000000-0000-0000-0000-0000000000d1', 'Verify Student 4'),
  ('00000000-0000-0000-0000-0000000000d2', 'Verify Handler 4')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'user'),
  ('00000000-0000-0000-0000-0000000000d2', 'handler')
on conflict do nothing;

-- One escalated ticket belonging to this student, plus handler-side records.
do $$
declare
  v_sub uuid;
  v_ticket uuid;
begin
  insert into public.submissions
    (user_id, stage, tier, handler_id, submitted_at, assigned_at,
     turnaround_deadline, notes, paid)
  values
    ('00000000-0000-0000-0000-0000000000d1', 'in_review', 'premium',
     '00000000-0000-0000-0000-0000000000d2', now() - interval '30 hours',
     now() - interval '30 hours', now() - interval '6 hours', 'rls-student', true)
  returning id into v_sub;

  insert into public.handler_queue (submission_id, handler_id, queued_at, picked_at)
  values (v_sub, '00000000-0000-0000-0000-0000000000d2', now() - interval '30 hours', now() - interval '30 hours')
  returning id into v_ticket;

  insert into public.handler_escalations
    (handler_id, submission_id, ticket_id, escalation_reason, deadline_was, claimed_at, tier)
  values ('00000000-0000-0000-0000-0000000000d2', v_sub, v_ticket, 'missed_deadline',
          now() - interval '6 hours', now() - interval '30 hours', 'premium');

  insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
  values ('00000000-0000-0000-0000-0000000000d2', 'ticket_escalated',
          'Your ticket has been escalated to Operations.', 'high', v_ticket);

  insert into public.operations_notifications (type, message, submission_id, handler_id, priority)
  values ('ticket_escalated', 'A Premium ticket has missed its deadline.', v_sub,
          '00000000-0000-0000-0000-0000000000d2', 'high');

  insert into public.handler_ticket_reviews
    (submission_id, handler_id, reviewed_by, accuracy_score, quality_score,
     completeness_score, tone_score, deliverability_score, notes, decision)
  values (v_sub, '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d2',
          5,4,5,4,5, 'Reviewed and delivered. Looks accurate.', 'approved');

  insert into public.handler_performance_snapshots
    (handler_id, week_starting, tickets_completed, handler_score)
  values ('00000000-0000-0000-0000-0000000000d2',
          (date_trunc('week', now() - interval '7 days'))::date, 4, 88)
  on conflict (handler_id, week_starting) do nothing;
end $$;

-- ── read as the student ────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000d1';

do $$
declare
  v_escalations integer;
  v_handler_notifs integer;
  v_ops_notifs integer;
  v_snapshots integer;
  v_reviews integer;
  v_own_submissions integer;
begin
  select count(*) into v_escalations     from public.handler_escalations;
  select count(*) into v_handler_notifs  from public.handler_notifications;
  select count(*) into v_ops_notifs      from public.operations_notifications;
  select count(*) into v_snapshots       from public.handler_performance_snapshots;
  select count(*) into v_reviews         from public.handler_ticket_reviews;
  select count(*) into v_own_submissions from public.submissions;

  -- The control first: if this is 0 the rest proves nothing.
  if v_own_submissions = 0 then
    raise exception 'FAIL control: student cannot read their own submissions, so the zeros below are meaningless';
  end if;
  raise notice 'PASS control — student reads % of their own submission(s)', v_own_submissions;

  if v_escalations <> 0 then
    raise exception 'FAIL: student read % handler_escalations rows', v_escalations;
  end if;
  raise notice 'PASS student reads 0 rows from handler_escalations';

  if v_handler_notifs <> 0 then
    raise exception 'FAIL: student read % handler_notifications rows', v_handler_notifs;
  end if;
  raise notice 'PASS student reads 0 rows from handler_notifications';

  if v_ops_notifs <> 0 then
    raise exception 'FAIL: student read % operations_notifications rows', v_ops_notifs;
  end if;
  raise notice 'PASS student reads 0 rows from operations_notifications';

  if v_snapshots <> 0 then
    raise exception 'FAIL: student read % handler_performance_snapshots rows', v_snapshots;
  end if;
  raise notice 'PASS student reads 0 rows from handler_performance_snapshots';

  if v_reviews <> 0 then
    raise exception 'FAIL: student read % handler_ticket_reviews rows', v_reviews;
  end if;
  raise notice 'PASS student reads 0 rows from handler_ticket_reviews';

  raise notice 'PASS "the student never sees escalated" is structural, not cosmetic';
end $$;

reset role;
rollback;
