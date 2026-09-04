-- ═══════════════════════════════════════════════════════════════════════════
-- 06 — RLS: Operations sees everything
--
-- The mirror of 04 and 05. Operations is the role that resolves escalations and
-- reviews handler performance, so it must read across every handler — while a
-- handler calling the same Operations RPCs gets nothing back.
--
-- Checks:
--   * Operations reads escalations, operations_notifications and snapshots
--     belonging to handlers other than themselves
--   * fetch_operations_queue() returns rows for Operations
--   * fetch_operations_queue() returns NO rows for a handler — scoped, not an
--     error, so the UI degrades quietly rather than throwing
--   * list_active_handlers() returns id and name only
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'verify-student6@example.test'),
  ('00000000-0000-0000-0000-0000000000f2', 'verify-handler6@example.test'),
  ('00000000-0000-0000-0000-0000000000f3', 'verify-ops6@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name, date_of_birth, personal_email) values
  ('00000000-0000-0000-0000-0000000000f1', 'Verify Student 6', '2001-04-04', 'private-student@example.test'),
  ('00000000-0000-0000-0000-0000000000f2', 'Verify Handler 6', '1999-02-02', 'private-handler@example.test'),
  ('00000000-0000-0000-0000-0000000000f3', 'Verify Ops 6',     '1990-01-01', 'private-ops@example.test')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000f1', 'user'),
  ('00000000-0000-0000-0000-0000000000f2', 'handler'),
  ('00000000-0000-0000-0000-0000000000f3', 'operations')
on conflict do nothing;

do $$
declare
  v_sub uuid;
  v_ticket uuid;
begin
  insert into public.submissions
    (user_id, stage, tier, handler_id, submitted_at, assigned_at, turnaround_deadline, notes, paid)
  values
    ('00000000-0000-0000-0000-0000000000f1', 'in_review', 'premium',
     '00000000-0000-0000-0000-0000000000f2', now() - interval '30 hours',
     now() - interval '30 hours', now() - interval '4 hours', 'rls-ops', true)
  returning id into v_sub;

  insert into public.handler_queue (submission_id, handler_id, queued_at, picked_at)
  values (v_sub, '00000000-0000-0000-0000-0000000000f2', now() - interval '30 hours', now() - interval '30 hours')
  returning id into v_ticket;

  insert into public.handler_escalations
    (handler_id, submission_id, ticket_id, escalation_reason, deadline_was, claimed_at, tier)
  values ('00000000-0000-0000-0000-0000000000f2', v_sub, v_ticket, 'missed_deadline',
          now() - interval '4 hours', now() - interval '30 hours', 'premium');

  insert into public.operations_notifications (type, message, submission_id, handler_id, priority)
  values ('ticket_escalated', 'A Premium ticket has missed its deadline.', v_sub,
          '00000000-0000-0000-0000-0000000000f2', 'high');

  insert into public.handler_performance_snapshots
    (handler_id, week_starting, tickets_completed, handler_score)
  values ('00000000-0000-0000-0000-0000000000f2',
          (date_trunc('week', now() - interval '7 days'))::date, 5, 91)
  on conflict (handler_id, week_starting) do nothing;
end $$;

-- ── as Operations ──────────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000f3';

do $$
declare
  v_count integer;
  v_cols integer;
begin
  select count(*) into v_count from public.handler_escalations
   where handler_id = '00000000-0000-0000-0000-0000000000f2';
  if v_count < 1 then raise exception 'FAIL: Operations cannot read another handler''s escalation'; end if;
  raise notice 'PASS Operations reads escalations belonging to other handlers';

  select count(*) into v_count from public.operations_notifications;
  if v_count < 1 then raise exception 'FAIL: Operations cannot read operations_notifications'; end if;
  raise notice 'PASS Operations reads operations_notifications';

  select count(*) into v_count from public.handler_performance_snapshots
   where handler_id = '00000000-0000-0000-0000-0000000000f2';
  if v_count < 1 then raise exception 'FAIL: Operations cannot read another handler''s snapshot'; end if;
  raise notice 'PASS Operations reads other handlers'' performance snapshots';

  select count(*) into v_count from public.fetch_operations_queue();
  if v_count < 1 then raise exception 'FAIL: fetch_operations_queue() returned nothing for Operations'; end if;
  raise notice 'PASS fetch_operations_queue() returns % row(s) for Operations', v_count;

  -- the handler picker must expose nothing beyond id and name
  select count(*) into v_cols
    from information_schema.routines r
    join information_schema.parameters p on p.specific_name = r.specific_name
   where r.routine_name = 'list_active_handlers' and p.parameter_mode = 'OUT';
  if v_cols <> 2 then
    raise exception 'FAIL: list_active_handlers() exposes % columns, expected exactly 2 (id, full_name)', v_cols;
  end if;
  select count(*) into v_count from public.list_active_handlers();
  raise notice 'PASS list_active_handlers() returns % handler(s), id and name only — no DOB or email', v_count;
end $$;

-- ── the same RPC as a handler: scoped to nothing, not an error ─────────────
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000f2';

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.fetch_operations_queue();
  if v_count <> 0 then
    raise exception 'FAIL: fetch_operations_queue() returned % row(s) to a handler', v_count;
  end if;
  raise notice 'PASS fetch_operations_queue() returns 0 rows to a handler';
end $$;

reset role;
rollback;
