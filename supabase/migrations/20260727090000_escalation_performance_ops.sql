-- Foundation Blueprint: escalation, handler performance, and the Operations
-- queue. Additive on top of 20260726110000_handler_pipeline.sql — nothing in
-- that migration's tables, policies, or RPCs is altered here.
--
-- ═══ Deviations from the literal spec, and why ═══════════════════════════════
--
-- 1. handler_queue.status does not exist and is NOT added here as a stored
--    column. The already-built pipeline's authoritative state lives in
--    submissions.stage / submissions.marked_incomplete / operations_flags —
--    adding a second, independently-writable status column on handler_queue
--    would recreate the exact "two-tracker split" bug fixed in the previous
--    migration, just with three trackers instead of two. Every place the spec
--    describes reading/writing handler_queue.status, this migration instead
--    reads/writes the existing authoritative columns, or a new column that
--    genuinely has no existing home (escalated_at, escalation_reason,
--    reassigned_by, reassigned_at — these are real additions, not a
--    parallel status field).
--
-- 2. handler_flags does not exist. operations_flags already serves exactly
--    this purpose (it's what flag_submission — already built — writes to).
--    Reused rather than duplicated; its status column now takes 'accepted'/
--    'rejected' as real values alongside the existing 'open' default.
--
-- 3. handle-deadline-escalation and generate-handler-snapshots are built as
--    plain Postgres functions scheduled directly via pg_cron, not as Supabase
--    Edge Functions. Every operation both need (querying tables, inserting
--    notification rows) is pure SQL with no call to the Claude API or any
--    external service — running them as Edge Functions would add an HTTP
--    round-trip and a pg_net dependency for no benefit. `supabase functions
--    deploy` does not apply to either; `supabase db push` is what ships them.
--
-- 4. handler_ticket_reviews is created (the quality-score formula needs
--    somewhere to read from) but nothing in this spec's 7 parts defines who
--    writes to it — there is no "Operations scores this ticket" action in
--    Part 3's action list. It is empty by construction until that separate
--    piece is built; handler_score's quality component reads as neutral
--    (see generate_handler_snapshots below) until real rows exist. Same story
--    for operations_flags' accepted/rejected resolution — the column exists,
--    nothing resolves a flag to it yet.
--
-- 5. profiles.handler_status ('active'/'inactive') does not exist anywhere
--    else in the app — no availability toggle exists for handlers at all.
--    Added here as a plain column defaulting to 'active' so the concept
--    exists and the fan-out notification (Part 4) has something real to
--    query, but nothing here builds a UI to ever set it to 'inactive'.

-- ═══ Part 7 (built first — everything else depends on these) ═══════════════

create table public.handler_notifications (
  id uuid primary key default gen_random_uuid(),
  handler_id uuid references public.profiles(id) not null,
  type text not null,
  message text not null,
  -- Not in the spec's literal column list — added so the 75%/90% dedup check
  -- in handle_deadline_escalation() can query "has this ticket already had
  -- this warning" directly instead of pattern-matching the ticket id out of
  -- the message text, which would be the alternative without this column.
  ticket_id uuid references public.handler_queue(id),
  read boolean not null default false,
  read_at timestamptz,
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  created_at timestamptz default now()
);
alter table public.handler_notifications enable row level security;
create policy "Handlers can read own notifications" on public.handler_notifications
  for select to authenticated using (auth.uid() = handler_id);
create policy "Handlers can mark own notifications read" on public.handler_notifications
  for update to authenticated using (auth.uid() = handler_id) with check (auth.uid() = handler_id);
-- Inserts happen only from SECURITY DEFINER functions below (the escalation
-- job, the premium fan-out trigger) — no direct-insert policy is needed for
-- 'authenticated', matching the pattern already used for handler_queue writes.

create table public.operations_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  submission_id uuid references public.submissions(id),
  handler_id uuid references public.profiles(id),
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz default now()
);
alter table public.operations_notifications enable row level security;
create policy "Operations can read notifications" on public.operations_notifications
  for select to authenticated using (public.has_role(auth.uid(), 'operations'));
create policy "Operations can update notifications" on public.operations_notifications
  for update to authenticated using (public.has_role(auth.uid(), 'operations')) with check (public.has_role(auth.uid(), 'operations'));

alter table public.handler_queue
  add column if not exists escalated_at timestamptz,
  add column if not exists escalation_reason text,
  add column if not exists reassigned_by uuid references public.profiles(id),
  add column if not exists reassigned_at timestamptz;

alter table public.profiles
  add column if not exists handler_status_score numeric(5,2),
  add column if not exists handler_score_band text,
  add column if not exists handler_status text not null default 'active' check (handler_status in ('active', 'inactive'));

-- ═══ Part 1 — escalations ═════════════════════════════════════════════════

create table public.handler_escalations (
  id uuid primary key default gen_random_uuid(),
  handler_id uuid references public.profiles(id),
  submission_id uuid references public.submissions(id) not null,
  ticket_id uuid references public.handler_queue(id) not null,
  escalated_at timestamptz not null default now(),
  escalation_reason text not null,
  deadline_was timestamptz not null,
  claimed_at timestamptz not null,
  tier text not null check (tier in ('standard', 'premium')),
  resolved boolean not null default false,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  operations_action text check (operations_action in ('reassigned', 'delivered_by_ops', 'student_contacted', 'cancelled'))
);
alter table public.handler_escalations enable row level security;
create policy "Handlers can read own escalations" on public.handler_escalations
  for select to authenticated using (auth.uid() = handler_id);
create policy "Operations can read all escalations" on public.handler_escalations
  for select to authenticated using (public.has_role(auth.uid(), 'operations'));
create policy "Operations can update escalations" on public.handler_escalations
  for update to authenticated using (public.has_role(auth.uid(), 'operations')) with check (public.has_role(auth.uid(), 'operations'));

-- Every unresolved escalation for a submission that hasn't slipped past
-- unclaimed-in-10-minutes gets exactly one notification per threshold — the
-- dedup checks below are what make the 15-minute cron idempotent instead of
-- re-firing the same warning every run.

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
begin
  -- pg_cron invokes this with no JWT context at all (auth.uid() is null) —
  -- only block a call that DOES carry an authenticated identity that isn't
  -- Operations, so the scheduled job itself is never affected, while still
  -- letting Operations trigger a manual run for testing.
  if auth.uid() is not null and not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can run this manually';
  end if;

  -- ── Steps 1–4: claimed tickets approaching, at, or past deadline ──────────
  -- "claimed" here is any submission a Handler holds that hasn't been
  -- delivered yet — submissions.stage in ('assigned','in_review') is the
  -- authoritative equivalent of the spec's handler_queue.status = 'claimed'.
  -- picked_at stands in for the spec's handler_queue.claimed_at; the two are
  -- the same moment (set together in claim_submission).
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
      -- ── Step 4: auto-escalate ────────────────────────────────────────────
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
      -- ── Step 3: 90% warning ──────────────────────────────────────────────
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
      -- ── Step 2: 75% warning ──────────────────────────────────────────────
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

  -- ── Step 5: stale unclaimed queue ────────────────────────────────────────
  -- One aggregate alert per run at most, deduped against the last hour so a
  -- persistently stale queue doesn't spam Operations every 15 minutes.
  select count(*) into v_stale_count
  from public.handler_queue
  where picked_at is null and queued_at < now() - interval '10 minutes';

  if v_stale_count > 0 and not exists (
    select 1 from public.operations_notifications
    where type = 'stale_queue' and created_at > now() - interval '1 hour'
  ) then
    insert into public.operations_notifications (type, message, priority)
    values (
      'stale_queue',
      format('%s ticket(s) have been waiting unclaimed for more than 10 minutes. Check handler availability.', v_stale_count),
      'normal'
    );
  end if;
end;
$$;

grant execute on function public.handle_deadline_escalation() to authenticated;

-- ═══ Part 2 — handler performance ═══════════════════════════════════════════

-- Not wired to anything yet (see the file header) — exists so the quality
-- component of handler_score has somewhere real to read from once an
-- Operations review action is built.
create table public.handler_ticket_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) not null,
  handler_id uuid references public.profiles(id) not null,
  reviewed_by uuid references public.profiles(id) not null,
  accuracy_score integer check (accuracy_score between 1 and 5),
  quality_score integer check (quality_score between 1 and 5),
  completeness_score integer check (completeness_score between 1 and 5),
  tone_score integer check (tone_score between 1 and 5),
  deliverability_score integer check (deliverability_score between 1 and 5),
  notes text,
  created_at timestamptz default now()
);
alter table public.handler_ticket_reviews enable row level security;
create policy "Handlers can read own ticket reviews" on public.handler_ticket_reviews
  for select to authenticated using (auth.uid() = handler_id);
create policy "Operations can manage ticket reviews" on public.handler_ticket_reviews
  for all to authenticated using (public.has_role(auth.uid(), 'operations')) with check (public.has_role(auth.uid(), 'operations'));

create table public.handler_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  handler_id uuid references public.profiles(id) not null,
  week_starting date not null,
  tickets_completed integer not null default 0,
  tickets_escalated integer not null default 0,
  tickets_flagged integer not null default 0,
  flags_accepted_by_ops integer not null default 0,
  flags_rejected_by_ops integer not null default 0,
  avg_completion_time_hours numeric(5,2),
  on_time_rate numeric(5,2),
  acknowledgement_rate numeric(5,2),
  handler_score numeric(5,2),
  created_at timestamptz default now(),
  unique (handler_id, week_starting)
);
alter table public.handler_performance_snapshots enable row level security;
create policy "Handlers can read own snapshots" on public.handler_performance_snapshots
  for select to authenticated using (auth.uid() = handler_id);
create policy "Operations can read all snapshots" on public.handler_performance_snapshots
  for select to authenticated using (public.has_role(auth.uid(), 'operations'));

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
  v_avg_quality numeric;
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

  -- Runs Monday 00:01 — "the previous week" is the Mon–Sun that just ended.
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

    -- "Claimed within 10 minutes of assignment" — this pipeline has no
    -- pre-claim assignment step (claiming IS the assignment), so this reads
    -- as: of what this handler claimed this week, how much was picked up
    -- within 10 minutes of entering the queue. A responsiveness proxy, not a
    -- literal assignment-to-acknowledgement gap that doesn't exist here.
    select
      (count(*) filter (where hq.picked_at - hq.queued_at <= interval '10 minutes'))::numeric / nullif(count(*), 0) * 100
    into v_ack_rate
    from public.handler_queue hq
    where hq.handler_id = h.handler_id and hq.picked_at >= v_week_start and hq.picked_at < v_week_end;

    select avg((coalesce(accuracy_score,0) + coalesce(quality_score,0) + coalesce(completeness_score,0) + coalesce(tone_score,0) + coalesce(deliverability_score,0)))
    into v_avg_quality
    from public.handler_ticket_reviews
    where handler_id = h.handler_id and created_at >= v_week_start and created_at < v_week_end;

    v_on_time_points := coalesce(v_on_time_rate, 100) / 100.0 * 40;
    -- No reviews yet anywhere in the platform (see file header) — scored
    -- neutrally at half marks rather than zero, so the absence of a
    -- not-yet-built review step doesn't read as a quality failure.
    v_quality_points := coalesce(v_avg_quality / 25.0 * 30, 15);
    -- No flags raised this week is not a negative signal — full marks by
    -- default, same convention as quality above.
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

grant execute on function public.generate_handler_snapshots() to authenticated;

-- ═══ Part 3 — Operations queue and reassignment ═════════════════════════════

-- Exists as a plain view per the spec ("the view must exist so the UI can
-- query it"). The frontend calls fetch_operations_queue() below instead of
-- selecting from this view directly — same broad "any handler can browse
-- submission metadata" RLS that governs the main queue would otherwise let
-- any handler read this too, not just Operations.
create or replace view public.operations_queue as
select
  hq.id as ticket_id, hq.submission_id, s.tier, s.document_table, s.document_id,
  s.notes, s.turnaround_deadline, s.marked_incomplete, s.incomplete_reason,
  hq.queued_at, hq.picked_at as claimed_at, hq.handler_id, p.full_name as handler_name,
  he.id as escalation_id, he.escalated_at, he.escalation_reason, he.deadline_was, he.resolved as escalation_resolved,
  of.id as flag_id, of.reason as flag_reason, of.status as flag_status,
  case
    when he.id is not null and he.resolved = false then 'escalated'
    when of.id is not null and of.status = 'open' then 'flagged'
    when s.marked_incomplete then 'incomplete'
  end as queue_status
from public.handler_queue hq
join public.submissions s on s.id = hq.submission_id
left join public.profiles p on p.id = hq.handler_id
left join public.handler_escalations he on he.ticket_id = hq.id and he.resolved = false
left join public.operations_flags of on of.target_type = 'submission' and of.target_id = hq.submission_id and of.status = 'open'
where (he.id is not null and he.resolved = false)
   or (of.id is not null and of.status = 'open')
   or s.marked_incomplete;

-- Views don't carry their own RLS — without an explicit revoke here, this
-- view would inherit whatever default privileges the project grants new
-- objects, and the underlying tables' own broad "any handler can browse
-- queue metadata" policies would then apply to it too, undermining the
-- "Operations only" boundary the comment above promises. Revoked from both
-- so fetch_operations_queue() (SECURITY DEFINER, has_role-gated) is the only
-- path to this data.
revoke all on public.operations_queue from public, authenticated, anon;

create or replace function public.fetch_operations_queue()
returns setof public.operations_queue
language sql
security definer
set search_path = public
stable
as $$
  select * from public.operations_queue
  where public.has_role(auth.uid(), 'operations')
  order by (tier = 'premium') desc, coalesce(escalated_at, queued_at) asc;
$$;

grant execute on function public.fetch_operations_queue() to authenticated;

-- profiles' RLS correctly limits reads to your own row (it holds
-- date_of_birth, personal_email, university_email) — not broadened here.
-- The reassignment picker needs the minimum possible: which users are active
-- Handlers, and their name. This returns exactly that, nothing else off the
-- profile.
create or replace function public.list_active_handlers()
returns table (id uuid, full_name text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.full_name
  from public.profiles p
  where public.has_role(auth.uid(), 'operations')
    and public.has_role(p.id, 'handler')
    and p.handler_status = 'active'
  order by p.full_name;
$$;

grant execute on function public.list_active_handlers() to authenticated;

create or replace function public.reassign_submission(p_ticket_id uuid, p_new_handler_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid;
begin
  if not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can reassign submissions';
  end if;

  if not public.has_role(p_new_handler_id, 'handler') then
    raise exception 'Target user does not hold the Handler role';
  end if;

  select submission_id into v_submission_id from public.handler_queue where id = p_ticket_id;
  if v_submission_id is null then
    raise exception 'Ticket not found';
  end if;

  update public.handler_assignments set status = 'superseded' where submission_id = v_submission_id and status = 'active';

  insert into public.handler_assignments (handler_id, submission_id, assigned_at, status)
  values (p_new_handler_id, v_submission_id, now(), 'active');

  update public.handler_queue
     set handler_id = p_new_handler_id, picked_at = now(), escalated_at = null, escalation_reason = null,
         reassigned_by = auth.uid(), reassigned_at = now()
   where id = p_ticket_id;

  update public.submissions
     set stage = 'assigned', assigned_at = now(), handler_id = p_new_handler_id
   where id = v_submission_id;

  update public.handler_escalations
     set resolved = true, resolved_by = auth.uid(), resolved_at = now(), operations_action = 'reassigned'
   where ticket_id = p_ticket_id and resolved = false;

  insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
  values (p_new_handler_id, 'reassigned_to_you', 'A ticket has been assigned to you by Operations. Open the Handler Queue to review.', 'high', p_ticket_id);
end;
$$;

grant execute on function public.reassign_submission(uuid, uuid) to authenticated;

-- "Deliver as Operations" needs no new RPC — deliver_submission (already
-- built) already permits public.has_role(auth.uid(),'operations') as an
-- alternative to being the assigned handler.

create or replace function public.cancel_submission(p_submission_id uuid, p_reason text, p_full_refund boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
begin
  if not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can cancel a submission';
  end if;
  if not public.has_two_sentences(p_reason) then
    raise exception 'A cancellation reason of at least two sentences is required.';
  end if;

  select * into v_sub from public.submissions where id = p_submission_id;
  if v_sub is null then raise exception 'Submission not found'; end if;

  update public.submissions set marked_incomplete = true, incomplete_reason = p_reason where id = p_submission_id;

  update public.handler_escalations set resolved = true, resolved_by = auth.uid(), resolved_at = now(),
    operations_action = 'cancelled', resolution_notes = p_reason
   where submission_id = p_submission_id and resolved = false;

  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), 'Cancelled by Operations' || (case when p_full_refund then ' (full refund)' else '' end) || ': ' || p_reason);

  insert into public.notifications (user_id, category, title, message)
  values (v_sub.user_id, 'foundation_blueprint', 'Your submission was cancelled',
    'Our team has cancelled this submission: ' || p_reason || case when p_full_refund then ' A full refund has been noted for processing.' else '' end);
end;
$$;

grant execute on function public.cancel_submission(uuid, text, boolean) to authenticated;

create or replace function public.contact_student(p_submission_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not (public.has_role(auth.uid(), 'operations') or exists (
    select 1 from public.handler_assignments where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active'
  )) then
    raise exception 'Not authorised for this submission';
  end if;

  select user_id into v_user_id from public.submissions where id = p_submission_id;
  if v_user_id is null then raise exception 'Submission not found'; end if;

  -- Deliberately neutral title: this channel carries answers and status
  -- updates as well as information requests, so a fixed "we need more
  -- information" would mislabel most of what actually goes through it.
  insert into public.notifications (user_id, category, title, message)
  values (v_user_id, 'foundation_blueprint', 'A message about your submission', p_message);
end;
$$;

grant execute on function public.contact_student(uuid, text) to authenticated;

-- ═══ Part 4 — premium fan-out notification ═════════════════════════════════
-- Fires after submit_document_for_review's existing INSERT into handler_queue
-- — a trigger, not a change to that function's body.

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
    for h in select id from public.profiles where public.has_role(id, 'handler') and handler_status = 'active'
    loop
      insert into public.handler_notifications (handler_id, type, message, priority, ticket_id)
      values (h.id, 'premium_ticket_available', 'A new Premium ticket is available. Premium tickets have a 24-hour deadline. Open the queue to claim it.', 'high', new.id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists on_handler_queue_insert_notify_premium on public.handler_queue;
create trigger on_handler_queue_insert_notify_premium
  after insert on public.handler_queue
  for each row execute function public.notify_handlers_of_premium_ticket();

-- ═══ pg_cron registration ════════════════════════════════════════════════════
-- If pg_cron is not enabled on this project, this block fails and the two
-- functions above still exist and are callable manually / from an external
-- scheduler — enable the extension via the Supabase dashboard's Database →
-- Extensions page (which installs it into the `cron` schema, Supabase's
-- documented default — not overridden here, since every reference below is
-- to cron.schedule / cron.job unqualified by a different schema), then
-- re-run just this block.
--
-- Registration is wrapped in an explicit IF NOT EXISTS inside a DO block
-- rather than `SELECT cron.schedule(...) WHERE NOT EXISTS (...)` — the
-- latter relies on the query planner filtering the row before evaluating the
-- target list, which is the common idiom but not a guarantee for a
-- side-effecting function call. PERFORM inside an explicit IF has no such
-- ambiguity: cron.schedule() is only ever invoked when the condition is
-- actually checked and true.

create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'handle-deadline-escalation') then
    perform cron.schedule('handle-deadline-escalation', '*/15 * * * *', 'select public.handle_deadline_escalation();');
  end if;

  if not exists (select 1 from cron.job where jobname = 'generate-handler-snapshots') then
    perform cron.schedule('generate-handler-snapshots', '1 0 * * 1', 'select public.generate_handler_snapshots();');
  end if;
end $$;
