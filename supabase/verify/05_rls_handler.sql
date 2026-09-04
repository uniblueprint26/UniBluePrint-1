-- ═══════════════════════════════════════════════════════════════════════════
-- 05 — RLS: a handler sees their own rows and nobody else's
--
-- Two handlers, each with an escalation, a notification and a weekly snapshot.
-- Handler One must read exactly their own of each, and none of Handler Two's.
--
-- This is the check that stops one handler reading another's performance
-- record — the tables carry scores, escalations and bands, and a handler
-- browsing a colleague's would be a real disclosure.
--
-- Runs under `set local role authenticated`; a superuser bypasses RLS.
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'verify-student5@example.test'),
  ('00000000-0000-0000-0000-0000000000e2', 'verify-handler-one@example.test'),
  ('00000000-0000-0000-0000-0000000000e3', 'verify-handler-two@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name) values
  ('00000000-0000-0000-0000-0000000000e1', 'Verify Student 5'),
  ('00000000-0000-0000-0000-0000000000e2', 'Verify Handler One'),
  ('00000000-0000-0000-0000-0000000000e3', 'Verify Handler Two')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000e1', 'user'),
  ('00000000-0000-0000-0000-0000000000e2', 'handler'),
  ('00000000-0000-0000-0000-0000000000e3', 'handler')
on conflict do nothing;

do $$
declare
  v_handler uuid;
  v_sub uuid;
  v_ticket uuid;
begin
  foreach v_handler in array array[
    '00000000-0000-0000-0000-0000000000e2'::uuid,
    '00000000-0000-0000-0000-0000000000e3'::uuid
  ] loop
    insert into public.submissions
      (user_id, stage, tier, handler_id, submitted_at, assigned_at, turnaround_deadline, notes, paid)
    values
      ('00000000-0000-0000-0000-0000000000e1', 'in_review', 'standard', v_handler,
       now() - interval '50 hours', now() - interval '50 hours', now() - interval '2 hours',
       'rls-handler-' || right(v_handler::text, 2), true)
    returning id into v_sub;

    insert into public.handler_queue (submission_id, handler_id, queued_at, picked_at)
    values (v_sub, v_handler, now() - interval '50 hours', now() - interval '50 hours')
    returning id into v_ticket;

    insert into public.handler_escalations
      (handler_id, submission_id, ticket_id, escalation_reason, deadline_was, claimed_at, tier)
    values (v_handler, v_sub, v_ticket, 'missed_deadline',
            now() - interval '2 hours', now() - interval '50 hours', 'standard');

    insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
    values (v_handler, 'ticket_escalated', 'Your ticket has been escalated.', 'high', v_ticket);

    insert into public.handler_performance_snapshots
      (handler_id, week_starting, tickets_completed, handler_score)
    values (v_handler, (date_trunc('week', now() - interval '7 days'))::date, 3, 77)
    on conflict (handler_id, week_starting) do nothing;

    insert into public.handler_ticket_reviews
      (submission_id, handler_id, reviewed_by, accuracy_score, quality_score,
       completeness_score, tone_score, deliverability_score, notes, decision)
    values (v_sub, v_handler, v_handler, 4,4,4,4,4,
            'Checked against the submission. Delivered as reviewed.', 'approved');
  end loop;
end $$;

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000e2';

do $$
declare
  v_mine integer;
  v_theirs integer;
begin
  -- escalations
  select count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e2'),
         count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e3')
    into v_mine, v_theirs
    from public.handler_escalations;
  if v_mine < 1 then raise exception 'FAIL: handler cannot read their own escalation'; end if;
  if v_theirs <> 0 then raise exception 'FAIL: handler read % of another handler''s escalations', v_theirs; end if;
  raise notice 'PASS handler_escalations — own visible, other handler''s invisible';

  -- notifications
  select count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e2'),
         count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e3')
    into v_mine, v_theirs
    from public.handler_notifications;
  if v_mine < 1 then raise exception 'FAIL: handler cannot read their own notifications'; end if;
  if v_theirs <> 0 then raise exception 'FAIL: handler read % of another handler''s notifications', v_theirs; end if;
  raise notice 'PASS handler_notifications — own visible, other handler''s invisible';

  -- performance snapshots
  select count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e2'),
         count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e3')
    into v_mine, v_theirs
    from public.handler_performance_snapshots;
  if v_mine < 1 then raise exception 'FAIL: handler cannot read their own snapshot'; end if;
  if v_theirs <> 0 then raise exception 'FAIL: handler read % of another handler''s snapshots', v_theirs; end if;
  raise notice 'PASS handler_performance_snapshots — own visible, other handler''s invisible';

  -- ticket reviews
  select count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e2'),
         count(*) filter (where handler_id = '00000000-0000-0000-0000-0000000000e3')
    into v_mine, v_theirs
    from public.handler_ticket_reviews;
  if v_mine < 1 then raise exception 'FAIL: handler cannot read their own ticket reviews'; end if;
  if v_theirs <> 0 then raise exception 'FAIL: handler read % of another handler''s reviews', v_theirs; end if;
  raise notice 'PASS handler_ticket_reviews — own visible, other handler''s invisible';

  -- Operations-only table stays closed to handlers
  select count(*) into v_theirs from public.operations_notifications;
  if v_theirs <> 0 then raise exception 'FAIL: handler read % operations_notifications rows', v_theirs; end if;
  raise notice 'PASS operations_notifications closed to handlers';
end $$;

reset role;
rollback;
