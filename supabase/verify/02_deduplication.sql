-- ═══════════════════════════════════════════════════════════════════════════
-- 02 — Deduplication
--
-- handle_deadline_escalation() runs every 15 minutes. A ticket sitting at 80%
-- of its window is still at ~80% fifteen minutes later, so without dedup a
-- Handler would be warned about the same ticket every quarter of an hour.
--
-- Checks:
--   * a 75% and a 90% warning are each written once, across repeated runs
--   * a ticket escalates once, not once per run
--   * the premium "unclaimed for 5 minutes" notice is sent once
--   * the stale-queue alert to Operations rate-limits to one per hour
--   * the pg_cron registration block stays at one job per name however often
--     the migration's DO block is evaluated
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'verify-student2@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', 'verify-handler2@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name) values
  ('00000000-0000-0000-0000-0000000000b1', 'Verify Student 2'),
  ('00000000-0000-0000-0000-0000000000b2', 'Verify Handler 2')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'user'),
  ('00000000-0000-0000-0000-0000000000b2', 'handler')
on conflict do nothing;

do $$
declare
  c record;
  v_sub uuid;
  v_picked timestamptz;
begin
  for c in
    select * from (values
      ('d080',  8.0, 'standard', 'assigned'),
      ('d095',  9.5, 'standard', 'in_review'),
      ('d110', 11.0, 'premium',  'in_review')
    ) as t(label, hours_ago, tier, stage)
  loop
    v_picked := now() - (c.hours_ago || ' hours')::interval;
    insert into public.submissions
      (user_id, stage, tier, handler_id, submitted_at, assigned_at, in_review_at,
       turnaround_deadline, notes, paid)
    values
      ('00000000-0000-0000-0000-0000000000b1', c.stage::submission_stage, c.tier,
       '00000000-0000-0000-0000-0000000000b2', v_picked, v_picked,
       case when c.stage = 'in_review' then v_picked end,
       v_picked + interval '10 hours', c.label, true)
    returning id into v_sub;

    insert into public.handler_queue (submission_id, handler_id, queued_at, picked_at)
    values (v_sub, '00000000-0000-0000-0000-0000000000b2', v_picked, v_picked);

    insert into public.handler_assignments (handler_id, submission_id, assigned_at, status)
    values ('00000000-0000-0000-0000-0000000000b2', v_sub, v_picked, 'active');
  end loop;

  -- an unclaimed premium ticket, notified 6 minutes ago
  insert into public.submissions (user_id, stage, tier, submitted_at, turnaround_deadline, notes, paid)
  values ('00000000-0000-0000-0000-0000000000b1', 'in_queue', 'premium',
          now() - interval '6 minutes', now() + interval '24 hours', 'dprem', true)
  returning id into v_sub;
  insert into public.handler_queue (submission_id, queued_at, notification_sent_at)
  values (v_sub, now() - interval '6 minutes', now() - interval '6 minutes');

  -- an unclaimed standard ticket, stale for 20 minutes
  insert into public.submissions (user_id, stage, tier, submitted_at, turnaround_deadline, notes, paid)
  values ('00000000-0000-0000-0000-0000000000b1', 'in_queue', 'standard',
          now() - interval '20 minutes', now() + interval '48 hours', 'dstale', true)
  returning id into v_sub;
  insert into public.handler_queue (submission_id, queued_at, notification_sent_at)
  values (v_sub, now() - interval '20 minutes', now() - interval '20 minutes');
end $$;

-- ── run it four times; the counts must not move after the first ────────────
select public.handle_deadline_escalation();
select public.handle_deadline_escalation();
select public.handle_deadline_escalation();
select public.handle_deadline_escalation();

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    join public.submissions s on s.id = hq.submission_id
   where s.notes = 'd080' and hn.type = 'deadline_warning_75';
  if v_count <> 1 then raise exception 'FAIL: 75%% warning written % times across 4 runs', v_count; end if;
  raise notice 'PASS 75%% warning written exactly once across 4 runs';

  select count(*) into v_count
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    join public.submissions s on s.id = hq.submission_id
   where s.notes = 'd095' and hn.type = 'deadline_warning_90';
  if v_count <> 1 then raise exception 'FAIL: 90%% warning written % times across 4 runs', v_count; end if;
  raise notice 'PASS 90%% warning written exactly once across 4 runs';

  select count(*) into v_count
    from public.handler_escalations he join public.submissions s on s.id = he.submission_id
   where s.notes = 'd110';
  if v_count <> 1 then raise exception 'FAIL: ticket escalated % times across 4 runs', v_count; end if;
  raise notice 'PASS escalation recorded exactly once across 4 runs';

  -- one urgent notice per active handler, and no more on later runs
  select count(*) into v_count
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    join public.submissions s on s.id = hq.submission_id
   where s.notes = 'dprem' and hn.type = 'premium_unclaimed_urgent';
  if v_count <> (select count(*) from public.profiles p
                  where public.has_role(p.id,'handler') and p.handler_status = 'active') then
    raise exception 'FAIL: premium unclaimed notice sent % times, expected one per active handler', v_count;
  end if;
  raise notice 'PASS premium unclaimed notice sent once per active handler, not once per run';

  select count(*) into v_count from public.operations_notifications
   where type = 'stale_queue' and created_at > now() - interval '1 hour';
  if v_count <> 1 then raise exception 'FAIL: stale-queue alert written % times in the hour', v_count; end if;
  raise notice 'PASS stale-queue alert rate-limited to one per hour';
end $$;

-- ── the migration's cron registration block is idempotent ─────────────────
do $$
declare
  v_before integer;
  v_after integer;
begin
  select count(*) into v_before from cron.job
   where jobname in ('handle-deadline-escalation','generate-handler-snapshots');

  -- the same guard the migration uses
  if not exists (select 1 from cron.job where jobname = 'handle-deadline-escalation') then
    perform cron.schedule('handle-deadline-escalation', '*/15 * * * *', 'select public.handle_deadline_escalation();');
  end if;
  if not exists (select 1 from cron.job where jobname = 'generate-handler-snapshots') then
    perform cron.schedule('generate-handler-snapshots', '1 0 * * 1', 'select public.generate_handler_snapshots();');
  end if;

  select count(*) into v_after from cron.job
   where jobname in ('handle-deadline-escalation','generate-handler-snapshots');

  if v_before <> 2 then
    raise exception 'FAIL: expected 2 registered cron jobs, found %', v_before;
  end if;
  if v_after <> v_before then
    raise exception 'FAIL: re-running the registration block created duplicates (% -> %)', v_before, v_after;
  end if;
  raise notice 'PASS cron registration is idempotent — still one job per name';
end $$;

rollback;
