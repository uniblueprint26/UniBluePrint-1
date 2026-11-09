-- ═══════════════════════════════════════════════════════════════════════════
-- Handler quality scoring + acknowledgement step
--
-- Additive on top of 20260727090000_escalation_performance_ops.sql. The six
-- original pipeline RPCs (claim_submission, start_review, deliver_submission,
-- flag_submission, mark_submission_incomplete, submit_document_for_review) are
-- NOT redefined here — submit_handler_decision() calls them.
--
-- Two functions built in the previous migration ARE changed here, because this
-- spec explicitly directs it:
--   * generate_handler_snapshots() — replace the neutral 15/30 quality
--     placeholder with real review data, and the acknowledgement-rate proxy
--     with a real notification-to-claim measurement.
--   * handle_deadline_escalation() — extend the stale-queue alert with
--     notification_sent_at, and add the premium 5-minute second notice.
--   * notify_handlers_of_premium_ticket() — extended to cover standard tickets
--     too, and renamed in purpose (kept the same function/trigger name so the
--     existing trigger binding is untouched).
--
-- Disclosed deviations from the literal spec:
--
--  1. handler_ticket_reviews already had `notes`; the spec asks for
--     `handler_note`. Reused `notes` rather than adding a second text column
--     holding the same thing.
--  2. composite_score is a STORED GENERATED column, not an inserted value, so
--     it can never disagree with the five parts it is the sum of.
--  3. handler_id on a review is the handler being reviewed (from the active
--     assignment), NOT auth.uid(). When Operations delivers a ticket the score
--     must still land on the handler's record, not Operations'. reviewed_by
--     carries auth.uid().
--  4. first_claim_attempt_at cannot be set from inside claim_submission for a
--     FAILED claim — a lost race raises, which rolls the whole transaction
--     back, so nothing written inside it survives. It is therefore recorded by
--     record_claim_attempt(), which the client calls immediately before
--     claiming, in its own transaction. A trigger also backfills it on any
--     successful claim, so a caller that skips the client path still records.
--  5. The acknowledgement window is measurement-only. The spec says a handler
--     "can claim at any time during this window", so nothing here blocks or
--     delays a claim, and claim_submission keeps its exact current behaviour.
--  6. The premium 5-minute second notice is evaluated by the 15-minute cron,
--     so it fires at the first tick at or after 5 minutes — not exactly on the
--     5-minute mark. Making it exact would need a dedicated 1-minute job.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Part 1: quality scoring columns ────────────────────────────────────────

alter table public.handler_ticket_reviews
  add column if not exists composite_score integer
    generated always as (
      coalesce(accuracy_score, 0) + coalesce(quality_score, 0) + coalesce(completeness_score, 0)
      + coalesce(tone_score, 0) + coalesce(deliverability_score, 0)
    ) stored,
  add column if not exists decision text
    check (decision in ('approved', 'flagged', 'incomplete')),
  add column if not exists low_score_override boolean not null default false,
  add column if not exists low_score_override_confirmed_at timestamptz;

create index if not exists handler_ticket_reviews_handler_week_idx
  on public.handler_ticket_reviews (handler_id, created_at);

-- ── Part 2: acknowledgement tracking columns ───────────────────────────────

-- notification_sent_at defaults at insert rather than being stamped by the
-- fan-out trigger. The fan-out runs AFTER INSERT, so stamping it there meant a
-- second UPDATE on every ticket, which re-fired the claim-backfill trigger and
-- silently overwrote any value supplied by the caller.
alter table public.handler_queue
  add column if not exists notification_sent_at timestamptz default now(),
  add column if not exists first_claim_attempt_at timestamptz;

-- ═══════════════════════════════════════════════════════════════════════════
-- submit_handler_decision — the scorecard and the decision, one transaction
--
-- This exists because the two writes have to be atomic and a browser cannot
-- open a transaction across two supabase.rpc() calls. Everything below runs in
-- a single function invocation, so a failure in the decision RPC rolls the
-- review insert back with it, and vice versa. No orphaned reviews, no
-- decisions without a review.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.submit_handler_decision(
  p_submission_id uuid,
  p_decision text,
  p_handler_note text,
  p_accuracy integer,
  p_quality integer,
  p_completeness integer,
  p_tone integer,
  p_deliverability integer,
  p_low_score_override boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handler_id uuid;
  v_composite integer;
  v_lowest integer;
begin
  select handler_id into v_handler_id
    from public.handler_assignments
   where submission_id = p_submission_id and status = 'active';

  if v_handler_id is null then
    raise exception 'This submission has no active Handler assignment';
  end if;

  if not (v_handler_id = auth.uid() or public.has_role(auth.uid(), 'operations')) then
    raise exception 'Not authorised for this submission';
  end if;

  if p_decision not in ('approved', 'flagged', 'incomplete') then
    raise exception 'Unknown decision: %', p_decision;
  end if;

  if p_accuracy is null or p_quality is null or p_completeness is null
     or p_tone is null or p_deliverability is null then
    raise exception 'All five quality dimensions must be scored before submitting a decision.';
  end if;

  v_composite := p_accuracy + p_quality + p_completeness + p_tone + p_deliverability;
  v_lowest := least(p_accuracy, p_quality, p_completeness, p_tone, p_deliverability);

  -- Server-side mirror of the two UI enforcement rules, so they hold even if
  -- the call arrives from something other than our own form.
  if v_lowest = 1 and p_decision = 'approved' then
    raise exception 'A score of 1 on any dimension indicates a serious quality issue. This ticket must be flagged to Operations.';
  end if;

  if v_composite < 11 and p_decision = 'approved' and not p_low_score_override then
    raise exception 'Approving a composite score below 11 requires explicit confirmation.';
  end if;

  insert into public.handler_ticket_reviews (
    submission_id, handler_id, reviewed_by,
    accuracy_score, quality_score, completeness_score, tone_score, deliverability_score,
    notes, decision, low_score_override, low_score_override_confirmed_at
  ) values (
    p_submission_id, v_handler_id, auth.uid(),
    p_accuracy, p_quality, p_completeness, p_tone, p_deliverability,
    p_handler_note, p_decision, p_low_score_override,
    case when p_low_score_override then now() else null end
  );

  -- The existing RPCs, unchanged, doing the actual state transition. Their own
  -- role checks and two-sentence note validation still apply.
  if p_decision = 'approved' then
    perform public.deliver_submission(p_submission_id, p_handler_note);
  elsif p_decision = 'flagged' then
    perform public.flag_submission(p_submission_id, p_handler_note);
  else
    perform public.mark_submission_incomplete(p_submission_id, p_handler_note);
  end if;
end;
$$;

grant execute on function public.submit_handler_decision(uuid, text, text, integer, integer, integer, integer, integer, boolean) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- record_claim_attempt — see deviation 4 above
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.record_claim_attempt(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role(auth.uid(), 'handler') or public.has_role(auth.uid(), 'operations')) then
    raise exception 'Only Campus Handlers can claim submissions';
  end if;

  -- First attempt wins; later attempts on the same ticket leave it alone.
  update public.handler_queue
     set first_claim_attempt_at = now()
   where submission_id = p_submission_id
     and first_claim_attempt_at is null;
end;
$$;

grant execute on function public.record_claim_attempt(uuid) to authenticated;

-- Safety net: a successful claim that never went through record_claim_attempt
-- still gets a first_claim_attempt_at, so the metric never silently undercounts.
create or replace function public.backfill_claim_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.picked_at is not null and old.picked_at is null and new.first_claim_attempt_at is null then
    new.first_claim_attempt_at := new.picked_at;
  end if;
  return new;
end;
$$;

drop trigger if exists on_handler_queue_claim_backfill on public.handler_queue;
create trigger on_handler_queue_claim_backfill
  before update on public.handler_queue
  for each row execute function public.backfill_claim_attempt();

-- ═══════════════════════════════════════════════════════════════════════════
-- Ticket-available fan-out — now both tiers
--
-- Same function and trigger name as the premium-only version it replaces, so
-- the existing binding on handler_queue is untouched.
--   premium  → every active handler, regardless of current workload
--   standard → active handlers who are not already holding a live ticket
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.notify_handlers_of_premium_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  h record;
begin
  select tier into v_tier from public.submissions where id = new.submission_id;

  if v_tier = 'premium' then
    for h in
      select id from public.profiles
       where public.has_role(id, 'handler') and handler_status = 'active'
    loop
      insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
      values (h.id, 'ticket_available_premium',
              'A Premium ticket is available. 24-hour deadline. Open the queue now.',
              'high', new.id);
    end loop;
  else
    for h in
      select p.id from public.profiles p
       where public.has_role(p.id, 'handler') and p.handler_status = 'active'
         and not exists (
           select 1 from public.handler_assignments ha
            where ha.handler_id = p.id and ha.status = 'active'
         )
    loop
      insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
      values (h.id, 'ticket_available_standard',
              'A new Standard ticket is available in the queue. Open Blueprint Studio to claim it.',
              'normal', new.id);
    end loop;
  end if;

  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- handle_deadline_escalation — unchanged escalation logic, two additions:
-- the premium 5-minute second notice, and notification_sent_at in the stale
-- queue message.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.handle_deadline_escalation()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_elapsed_fraction numeric;
  v_hours_remaining numeric;
  v_tier_label text;
  v_stale_count integer;
  v_oldest_notified timestamptz;
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can run this manually';
  end if;

  for r in
    select hq.id as ticket_id, hq.submission_id, hq.handler_id, hq.picked_at,
           s.tier, s.turnaround_deadline
    from public.handler_queue hq
    join public.submissions s on s.id = hq.submission_id
    where s.stage in ('assigned', 'in_review')
      and hq.handler_id is not null
      and hq.picked_at is not null
      and s.turnaround_deadline is not null
      and hq.escalated_at is null
  loop
    v_elapsed_fraction := extract(epoch from (now() - r.picked_at)) / extract(epoch from (r.turnaround_deadline - r.picked_at));
    v_hours_remaining := round(extract(epoch from (r.turnaround_deadline - now())) / 3600.0, 1);
    v_tier_label := initcap(r.tier);

    if v_elapsed_fraction >= 1.0 then
      update public.handler_queue
         set escalated_at = now(), escalation_reason = 'missed_deadline'
       where id = r.ticket_id;

      insert into public.handler_escalations
        (handler_id, submission_id, ticket_id, escalation_reason, deadline_was, claimed_at, tier)
      values (r.handler_id, r.submission_id, r.ticket_id, 'missed_deadline', r.turnaround_deadline, r.picked_at, r.tier);

      insert into public.operations_notifications (type, message, submission_id, handler_id, priority)
      values (
        'ticket_escalated',
        format('A %s ticket has missed its deadline and been escalated.', v_tier_label),
        r.submission_id, r.handler_id,
        case when r.tier = 'premium' then 'high' else 'normal' end
      );

      insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
      values (
        r.handler_id, 'ticket_escalated',
        'Your ticket has been escalated to Operations due to missed deadline. This has been recorded on your profile.',
        'high', r.ticket_id
      );

    elsif v_elapsed_fraction >= 0.9 then
      if not exists (
        select 1 from public.handler_notifications
        where ticket_id = r.ticket_id and type = 'deadline_warning_90'
      ) then
        insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
        values (
          r.handler_id, 'deadline_warning_90',
          format('Urgent: under %s hours remaining on your %s ticket. Complete your review immediately to avoid escalation.', v_hours_remaining, v_tier_label),
          'urgent', r.ticket_id
        );
      end if;

    elsif v_elapsed_fraction >= 0.75 then
      if not exists (
        select 1 from public.handler_notifications
        where ticket_id = r.ticket_id and type = 'deadline_warning_75'
      ) then
        insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
        values (
          r.handler_id, 'deadline_warning_75',
          format('Reminder: your %s ticket is approaching its deadline. %s hours remaining. Complete your review now.', v_tier_label, v_hours_remaining),
          'normal', r.ticket_id
        );
      end if;
    end if;
  end loop;

  -- ── Premium second-chance notice: unclaimed 5 minutes after notification ──
  for r in
    select hq.id as ticket_id
    from public.handler_queue hq
    join public.submissions s on s.id = hq.submission_id
    where hq.picked_at is null
      and s.tier = 'premium'
      and hq.notification_sent_at is not null
      and hq.notification_sent_at < now() - interval '5 minutes'
      and not exists (
        select 1 from public.handler_notifications
        where ticket_id = hq.id and type = 'premium_unclaimed_urgent'
      )
  loop
    insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
    select p.id, 'premium_unclaimed_urgent',
           'Premium ticket unclaimed for 5 minutes. Claim it now.', 'urgent', r.ticket_id
      from public.profiles p
     where public.has_role(p.id, 'handler') and p.handler_status = 'active';
  end loop;

  -- ── Stale unclaimed queue ────────────────────────────────────────────────
  select count(*), min(notification_sent_at) into v_stale_count, v_oldest_notified
  from public.handler_queue
  where picked_at is null and queued_at < now() - interval '10 minutes';

  if v_stale_count > 0 and not exists (
    select 1 from public.operations_notifications
    where type = 'stale_queue' and created_at > now() - interval '1 hour'
  ) then
    insert into public.operations_notifications (type, message, priority)
    values (
      'stale_queue',
      format('%s ticket(s) have been waiting unclaimed for more than 10 minutes. Handlers first notified at %s. Check handler availability.',
             v_stale_count,
             coalesce(to_char(v_oldest_notified at time zone 'UTC', 'YYYY-MM-DD HH24:MI UTC'), 'an unknown time')),
      'normal'
    );
  end if;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- generate_handler_snapshots — real quality scores, real acknowledgement rate
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.generate_handler_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  h record;
  v_week_start date;
  v_week_end date;
  v_completed integer;
  v_escalated integer;
  v_flagged integer;
  v_flags_accepted integer;
  v_flags_rejected integer;
  v_avg_hours numeric;
  v_on_time_rate numeric;
  v_ack_rate numeric;
  v_notified integer;
  v_acked integer;
  v_avg_composite numeric;
  v_on_time_points numeric;
  v_quality_points numeric;
  v_flag_points numeric;
  v_ack_points numeric;
  v_score numeric;
  v_band text;
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can run this manually';
  end if;

  v_week_start := (date_trunc('week', now() - interval '7 days'))::date;
  v_week_end := v_week_start + 7;

  for h in
    select p.id as handler_id
    from public.profiles p
    where public.has_role(p.id, 'handler') and p.handler_status = 'active'
  loop
    select count(*) into v_completed
    from public.handler_assignments ha
    join public.submissions s on s.id = ha.submission_id
    where ha.handler_id = h.handler_id and s.stage = 'delivered'
      and s.delivered_at >= v_week_start and s.delivered_at < v_week_end;

    select count(*) into v_escalated
    from public.handler_escalations
    where handler_id = h.handler_id and escalated_at >= v_week_start and escalated_at < v_week_end;

    select count(*) into v_flagged
    from public.operations_flags
    where flagged_by = h.handler_id and target_type = 'submission'
      and created_at >= v_week_start and created_at < v_week_end;

    select
      count(*) filter (where status = 'accepted'),
      count(*) filter (where status = 'rejected')
    into v_flags_accepted, v_flags_rejected
    from public.operations_flags
    where flagged_by = h.handler_id and target_type = 'submission'
      and resolved_at >= v_week_start and resolved_at < v_week_end;

    select
      avg(extract(epoch from (s.delivered_at - s.assigned_at)) / 3600.0),
      (count(*) filter (where s.delivered_at <= s.turnaround_deadline))::numeric / nullif(count(*), 0) * 100
    into v_avg_hours, v_on_time_rate
    from public.handler_assignments ha
    join public.submissions s on s.id = ha.submission_id
    where ha.handler_id = h.handler_id and s.stage = 'delivered'
      and s.delivered_at >= v_week_start and s.delivered_at < v_week_end;

    -- ── Acknowledgement: notified → claimed inside the 10-minute window ────
    -- Ticket-level responsiveness as specified: a notified handler is credited
    -- when the ticket they were told about was picked up inside the window.
    -- Null (not zero) when the handler was never notified that week, so an
    -- unnotified handler is not scored as unresponsive.
    select
      count(*),
      count(*) filter (
        where hq.first_claim_attempt_at is not null
          and hq.notification_sent_at is not null
          and hq.first_claim_attempt_at <= hq.notification_sent_at + interval '10 minutes'
      )
    into v_notified, v_acked
    from public.handler_notifications hn
    join public.handler_queue hq on hq.id = hn.ticket_id
    where hn.handler_id = h.handler_id
      and hn.type in ('ticket_available_standard', 'ticket_available_premium')
      and hn.created_at >= v_week_start and hn.created_at < v_week_end;

    v_ack_rate := case when coalesce(v_notified, 0) = 0
                       then null
                       else v_acked::numeric / v_notified * 100 end;

    -- ── Quality: real review data, zero when there is none ────────────────
    select avg(composite_score)
    into v_avg_composite
    from public.handler_ticket_reviews
    where handler_id = h.handler_id
      and created_at >= v_week_start and created_at < v_week_end;

    v_on_time_points := coalesce(v_on_time_rate, 100) / 100.0 * 40;
    -- No reviews this week is now a real zero, not a neutral placeholder.
    v_quality_points := coalesce(v_avg_composite, 0) / 25.0 * 30;
    v_flag_points := case when v_flagged = 0 then 20
                          else v_flags_accepted::numeric / nullif(v_flags_accepted + v_flags_rejected, 0) * 20 end;
    v_flag_points := coalesce(v_flag_points, 20);
    v_ack_points := coalesce(v_ack_rate, 0) / 100.0 * 10;

    v_score := least(100, greatest(0, v_on_time_points + v_quality_points + v_flag_points + v_ack_points));

    v_band := case
      when v_score >= 85 then 'Strong Handler'
      when v_score >= 70 then 'Good Handler'
      when v_score >= 60 then 'Developing'
      when v_score >= 50 then 'Performance Warning'
      else 'Performance Review'
    end;

    insert into public.handler_performance_snapshots (
      handler_id, week_starting, tickets_completed, tickets_escalated, tickets_flagged,
      flags_accepted_by_ops, flags_rejected_by_ops, avg_completion_time_hours, on_time_rate,
      acknowledgement_rate, handler_score
    ) values (
      h.handler_id, v_week_start, v_completed, v_escalated, v_flagged,
      coalesce(v_flags_accepted, 0), coalesce(v_flags_rejected, 0), v_avg_hours, v_on_time_rate,
      v_ack_rate, v_score
    )
    on conflict (handler_id, week_starting) do update set
      tickets_completed = excluded.tickets_completed,
      tickets_escalated = excluded.tickets_escalated,
      tickets_flagged = excluded.tickets_flagged,
      flags_accepted_by_ops = excluded.flags_accepted_by_ops,
      flags_rejected_by_ops = excluded.flags_rejected_by_ops,
      avg_completion_time_hours = excluded.avg_completion_time_hours,
      on_time_rate = excluded.on_time_rate,
      acknowledgement_rate = excluded.acknowledgement_rate,
      handler_score = excluded.handler_score;

    update public.profiles
       set handler_status_score = v_score, handler_score_band = v_band
     where id = h.handler_id;

    if v_score < 60 then
      insert into public.operations_notifications (type, message, handler_id, priority)
      values (
        'handler_performance_alert',
        format('Handler scored %s this week (%s). Review recommended.', round(v_score, 1), v_band),
        h.handler_id,
        case when v_score < 50 then 'urgent' else 'high' end
      );
    end if;
  end loop;
end;
$$;
