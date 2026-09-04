-- ═══════════════════════════════════════════════════════════════════════════
-- 03 — Handler scoring
--
-- generate_handler_snapshots() scores the week that just ended, out of 100:
--     on-time        40  (on_time_rate, defaulting to 100 when nothing shipped)
--     quality        30  (avg composite_score / 25)
--     flag accuracy  20  (accepted / (accepted + rejected), 20 when none raised)
--     acknowledgement 10 (claimed inside the 10-minute window / notified)
--
-- Two handlers with deliberately contrasting weeks, so the arithmetic can be
-- checked rather than eyeballed:
--
--   Handler A — 4 delivered, all on time, reviews averaging composite 23,
--               notified about 4 tickets of which 3 were claimed in time
--     on-time 40 + quality 23/25*30 = 27.6 + flags 20 + ack 75%*10 = 7.5
--     = 95.1  -> Strong Handler
--
--   Handler B — 4 delivered, 1 on time, NO reviews, never notified
--     on-time 10 + quality 0 + flags 20 + ack 0
--     = 30.0  -> Performance Review
--
-- Handler B is the important one: before real review data existed, quality
-- defaulted to a neutral 15/30 and B would have scored 45. A handler with no
-- reviews now scores 0 on quality, not half marks.
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'verify-student3@example.test'),
  ('00000000-0000-0000-0000-0000000000c2', 'verify-handler-a@example.test'),
  ('00000000-0000-0000-0000-0000000000c3', 'verify-handler-b@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name, handler_status) values
  ('00000000-0000-0000-0000-0000000000c1', 'Verify Student 3', 'active'),
  ('00000000-0000-0000-0000-0000000000c2', 'Verify Handler A', 'active'),
  ('00000000-0000-0000-0000-0000000000c3', 'Verify Handler B', 'active')
on conflict (id) do update set full_name = excluded.full_name, handler_status = 'active';

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'user'),
  ('00000000-0000-0000-0000-0000000000c2', 'handler'),
  ('00000000-0000-0000-0000-0000000000c3', 'handler')
on conflict do nothing;

-- Isolate: only the two fixture handlers should be scored by this run.
update public.profiles set handler_status = 'inactive'
 where public.has_role(id, 'handler')
   and id not in ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000c3');

do $$
declare
  v_week_start date := (date_trunc('week', now() - interval '7 days'))::date;
  v_handler uuid;
  v_sub uuid;
  v_ticket uuid;
  i int;
  v_on_time boolean;
  v_claimed timestamptz;
  v_delivered timestamptz;
  v_sent timestamptz;
begin
  foreach v_handler in array array[
    '00000000-0000-0000-0000-0000000000c2'::uuid,
    '00000000-0000-0000-0000-0000000000c3'::uuid
  ] loop
    for i in 1..4 loop
      v_on_time := (v_handler = '00000000-0000-0000-0000-0000000000c2') or (i = 1);
      v_claimed := v_week_start + (i || ' days')::interval + interval '9 hours';
      v_delivered := v_claimed + case when v_on_time then interval '6 hours' else interval '14 hours' end;

      insert into public.submissions
        (user_id, stage, tier, handler_id, submitted_at, assigned_at, in_review_at,
         delivered_at, turnaround_deadline, notes, paid)
      values
        ('00000000-0000-0000-0000-0000000000c1', 'delivered', 'standard', v_handler,
         v_claimed, v_claimed, v_claimed, v_delivered, v_claimed + interval '10 hours',
         'score-' || right(v_handler::text, 2) || '-' || i, true)
      returning id into v_sub;

      insert into public.handler_queue (submission_id, handler_id, queued_at, picked_at)
      values (v_sub, v_handler, v_claimed - interval '2 minutes', v_claimed);

      insert into public.handler_assignments (handler_id, submission_id, assigned_at, status)
      values (v_handler, v_sub, v_claimed, 'completed');

      -- Handler A alone gets quality reviews, all composite 23 (5+4+5+4+5)
      if v_handler = '00000000-0000-0000-0000-0000000000c2' then
        insert into public.handler_ticket_reviews
          (submission_id, handler_id, reviewed_by, accuracy_score, quality_score,
           completeness_score, tone_score, deliverability_score, notes, decision, created_at)
        values
          (v_sub, v_handler, v_handler, 5, 4, 5, 4, 5,
           'Reviewed against the submission and delivered. Reads cleanly.', 'approved',
           v_week_start + interval '2 days');
      end if;
    end loop;
  end loop;

  -- Handler A: notified about 4 tickets, 3 answered inside the 10-minute window
  for i in 1..4 loop
    v_sent := v_week_start + (i || ' days')::interval + interval '14 hours';
    insert into public.submissions (user_id, stage, tier, submitted_at, turnaround_deadline, notes, paid)
    values ('00000000-0000-0000-0000-0000000000c1', 'in_queue', 'standard',
            v_sent, v_sent + interval '48 hours', 'ack-' || i, true)
    returning id into v_sub;

    insert into public.handler_queue
      (submission_id, queued_at, notification_sent_at, first_claim_attempt_at, picked_at, handler_id)
    values (v_sub, v_sent, v_sent,
            v_sent + case when i < 4 then interval '4 minutes' else interval '20 minutes' end,
            v_sent + case when i < 4 then interval '4 minutes' else interval '20 minutes' end,
            '00000000-0000-0000-0000-0000000000c2')
    returning id into v_ticket;

    insert into public.handler_notifications (handler_id, type, message, priority, ticket_id, created_at)
    values ('00000000-0000-0000-0000-0000000000c2', 'ticket_available_standard',
            'A new Standard ticket is available in the queue.', 'normal', v_ticket, v_sent);
  end loop;
end $$;

select public.generate_handler_snapshots();

do $$
declare
  v_score numeric;
  v_band text;
  v_ack numeric;
  v_quality numeric;
begin
  -- ── Handler A ────────────────────────────────────────────────────────────
  select handler_score, acknowledgement_rate into v_score, v_ack
    from public.handler_performance_snapshots
   where handler_id = '00000000-0000-0000-0000-0000000000c2';
  select handler_score_band into v_band from public.profiles
   where id = '00000000-0000-0000-0000-0000000000c2';

  if round(v_ack, 1) <> 75.0 then
    raise exception 'FAIL: Handler A acknowledgement rate %, expected 75.0', v_ack;
  end if;
  raise notice 'PASS acknowledgement rate is 75.0 — 3 of 4 notified tickets claimed inside the window';

  if round(v_score, 1) <> 95.1 then
    raise exception 'FAIL: Handler A scored %, expected 95.1', round(v_score, 1);
  end if;
  if v_band <> 'Strong Handler' then
    raise exception 'FAIL: Handler A band %, expected Strong Handler', v_band;
  end if;
  raise notice 'PASS Handler A scores 95.1 / Strong Handler, matching the hand-computed total';

  -- ── quality reads real review data ──────────────────────────────────────
  select avg(composite_score) into v_quality from public.handler_ticket_reviews
   where handler_id = '00000000-0000-0000-0000-0000000000c2';
  if v_quality <> 23 then
    raise exception 'FAIL: expected avg composite 23, got %', v_quality;
  end if;
  raise notice 'PASS quality component reads real composite scores (avg 23 -> 27.6 of 30)';

  -- ── Handler B: no reviews means zero, not a neutral placeholder ─────────
  select handler_score, acknowledgement_rate into v_score, v_ack
    from public.handler_performance_snapshots
   where handler_id = '00000000-0000-0000-0000-0000000000c3';
  select handler_score_band into v_band from public.profiles
   where id = '00000000-0000-0000-0000-0000000000c3';

  if v_ack is not null then
    raise exception 'FAIL: Handler B acknowledgement rate should be NULL when never notified, got %', v_ack;
  end if;
  raise notice 'PASS acknowledgement rate is NULL for a handler who was never notified, not 0';

  if round(v_score, 1) <> 30.0 then
    raise exception 'FAIL: Handler B scored %, expected 30.0 (quality 0, not a neutral 15)', round(v_score, 1);
  end if;
  if v_band <> 'Performance Review' then
    raise exception 'FAIL: Handler B band %, expected Performance Review', v_band;
  end if;
  raise notice 'PASS Handler B scores 30.0 / Performance Review — no reviews scores 0 on quality';

  -- ── a sub-60 score alerts Operations ────────────────────────────────────
  if not exists (
    select 1 from public.operations_notifications
     where type = 'handler_performance_alert'
       and handler_id = '00000000-0000-0000-0000-0000000000c3'
       and priority = 'urgent'
  ) then
    raise exception 'FAIL: no urgent performance alert for a sub-50 handler';
  end if;
  raise notice 'PASS sub-50 score raises an urgent performance alert to Operations';
end $$;

rollback;
