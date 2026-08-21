-- ═══════════════════════════════════════════════════════════════════════════
-- 01 — Escalation thresholds
--
-- handle_deadline_escalation() measures how far a claimed ticket is through
-- its window:
--     elapsed_fraction = (now - picked_at) / (turnaround_deadline - picked_at)
-- and acts at 75%, 90% and 100%.
--
-- Every fixture below uses a 10-hour window, so "picked N hours ago" is
-- exactly N*10% elapsed and each threshold can be hit precisely.
--
-- Expected:
--   50%  -> nothing
--   80%  -> deadline_warning_75
--   95%  -> deadline_warning_90
--   110% -> escalation: handler_queue.escalated_at set, handler_escalations
--           row written, Operations and the Handler both notified
--   already-escalated ticket -> untouched
--   delivered ticket         -> untouched even though it is past its deadline
--
-- Safe to run anywhere: everything rolls back.
--
-- Note: inserting into handler_queue also fires the ticket-available fan-out,
-- so these tickets carry 'ticket_available_*' notifications too. Assertions
-- below filter on the notification type they care about rather than assuming a
-- ticket has exactly one notification.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── fixtures ───────────────────────────────────────────────────────────────
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'verify-student@example.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'verify-handler@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name) values
  ('00000000-0000-0000-0000-0000000000a1', 'Verify Student'),
  ('00000000-0000-0000-0000-0000000000a2', 'Verify Handler')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'user'),
  ('00000000-0000-0000-0000-0000000000a2', 'handler')
on conflict do nothing;

do $$
declare
  c record;
  v_sub uuid;
  v_picked timestamptz;
begin
  for c in
    select * from (values
      ('v050',  5.0, 'standard', 'assigned',  false),
      ('v080',  8.0, 'standard', 'assigned',  false),
      ('v095',  9.5, 'premium',  'in_review', false),
      ('v110', 11.0, 'premium',  'in_review', false),
      ('v120', 12.0, 'standard', 'assigned',  true),
      ('vdel', 11.0, 'standard', 'delivered', false)
    ) as t(label, hours_ago, tier, stage, pre_escalated)
  loop
    v_picked := now() - (c.hours_ago || ' hours')::interval;

    insert into public.submissions
      (user_id, stage, tier, handler_id, submitted_at, assigned_at, in_review_at,
       delivered_at, turnaround_deadline, notes, paid)
    values
      ('00000000-0000-0000-0000-0000000000a1', c.stage::submission_stage, c.tier,
       '00000000-0000-0000-0000-0000000000a2', v_picked, v_picked,
       case when c.stage in ('in_review','delivered') then v_picked end,
       case when c.stage = 'delivered' then now() end,
       v_picked + interval '10 hours', c.label, true)
    returning id into v_sub;

    insert into public.handler_queue
      (submission_id, handler_id, queued_at, picked_at, priority, escalated_at)
    values
      (v_sub, '00000000-0000-0000-0000-0000000000a2', v_picked, v_picked,
       case when c.tier = 'premium' then 10 else 0 end,
       case when c.pre_escalated then now() - interval '1 hour' end);

    insert into public.handler_assignments (handler_id, submission_id, assigned_at, status)
    values ('00000000-0000-0000-0000-0000000000a2', v_sub, v_picked,
            case when c.stage = 'delivered' then 'completed' else 'active' end);
  end loop;
end $$;

-- ── run the scheduled function exactly as pg_cron does (no JWT set) ────────
select public.handle_deadline_escalation();

-- ── assertions ─────────────────────────────────────────────────────────────
do $$
declare
  v_count integer;
  v_type text;
begin
  -- 50%: silent
  select count(*) into v_count
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    join public.submissions s on s.id = hq.submission_id
   where s.notes = 'v050' and hn.type like 'deadline_warning%';
  if v_count <> 0 then raise exception 'FAIL 50%%: expected no warning, got %', v_count; end if;
  raise notice 'PASS  50%% elapsed produces no warning';

  -- 80%: the 75 warning, and only that
  select hn.type into v_type
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    join public.submissions s on s.id = hq.submission_id
   where s.notes = 'v080' and hn.type like 'deadline_warning%';
  if v_type is distinct from 'deadline_warning_75' then
    raise exception 'FAIL 80%%: expected deadline_warning_75, got %', coalesce(v_type,'nothing');
  end if;
  raise notice 'PASS  80%% elapsed produces deadline_warning_75';

  -- 95%: the 90 warning, at urgent priority
  select hn.type into v_type
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    join public.submissions s on s.id = hq.submission_id
   where s.notes = 'v095' and hn.type like 'deadline_warning%';
  if v_type is distinct from 'deadline_warning_90' then
    raise exception 'FAIL 95%%: expected deadline_warning_90, got %', coalesce(v_type,'nothing');
  end if;
  raise notice 'PASS  95%% elapsed produces deadline_warning_90';

  -- 110%: escalated on the queue row
  select count(*) into v_count
    from public.handler_queue hq join public.submissions s on s.id = hq.submission_id
   where s.notes = 'v110' and hq.escalated_at is not null and hq.escalation_reason = 'missed_deadline';
  if v_count <> 1 then raise exception 'FAIL 110%%: handler_queue not marked escalated'; end if;

  -- 110%: escalation row recorded
  select count(*) into v_count
    from public.handler_escalations he join public.submissions s on s.id = he.submission_id
   where s.notes = 'v110' and he.escalation_reason = 'missed_deadline' and he.resolved = false;
  if v_count <> 1 then raise exception 'FAIL 110%%: expected 1 handler_escalations row, got %', v_count; end if;

  -- 110%: Operations told, at high priority because the ticket is premium
  select count(*) into v_count
    from public.operations_notifications o join public.submissions s on s.id = o.submission_id
   where s.notes = 'v110' and o.type = 'ticket_escalated' and o.priority = 'high';
  if v_count <> 1 then raise exception 'FAIL 110%%: Operations not notified at high priority'; end if;

  -- 110%: the Handler told too
  select count(*) into v_count
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    join public.submissions s on s.id = hq.submission_id
   where s.notes = 'v110' and hn.type = 'ticket_escalated';
  if v_count <> 1 then raise exception 'FAIL 110%%: Handler not notified of escalation'; end if;
  raise notice 'PASS 110%% elapsed escalates: queue flagged, escalation row, both parties notified';

  -- already escalated: no second escalation row
  select count(*) into v_count
    from public.handler_escalations he join public.submissions s on s.id = he.submission_id
   where s.notes = 'v120';
  if v_count <> 0 then raise exception 'FAIL: re-escalated an already-escalated ticket'; end if;
  raise notice 'PASS  already-escalated ticket is left alone';

  -- delivered: ignored despite being past deadline
  select count(*) into v_count
    from public.handler_escalations he join public.submissions s on s.id = he.submission_id
   where s.notes = 'vdel';
  if v_count <> 0 then raise exception 'FAIL: escalated a delivered ticket'; end if;
  raise notice 'PASS  delivered ticket is not escalated even when past deadline';
end $$;

rollback;
