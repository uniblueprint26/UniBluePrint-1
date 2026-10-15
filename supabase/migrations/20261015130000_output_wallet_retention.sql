-- Foundation Blueprint: real output-wallet retention.
--
-- docs/business/subscription-pricing-model.md §1.1/§1.2 have promised this
-- since the doc existed: free tier gets "Output wallet storage — 6 months",
-- Pro gets "Permanent wallet storage — all outputs stored forever (free
-- tier: 6 months)". Nothing in the schema ever enforced it — every
-- delivered document just sat in its table forever for everyone. This
-- migration is what actually backs that line, the same way
-- 20261012170000_pro_access_gating.sql backed Elevation's "Pro only" line.
--
-- ═══ What "the wallet" actually is ══════════════════════════════════════════
-- MyOutputsScreen.jsx ("My Outputs", the screen the pricing doc's "wallet"
-- means) reads public.submissions and, for a delivered row, opens
-- OutputDetailScreen.jsx, which reads the real content straight out of
-- whichever of the 8 document tables the submission points to
-- (submissions.document_table / document_id — see
-- 20260726110000_handler_pipeline.sql and 20260730090000's extension to
-- include job_search_sessions). submissions itself is metadata (stage,
-- timestamps, which document); the actual stored "output" is each table's
-- `generated` jsonb column (`student_strategy` on job_search_sessions),
-- plus its `input` jsonb (the student's own submitted answers — just as
-- much "their data sitting in storage" as the generated side, so it's
-- cleared together). All 8 tables share this shape, so one mechanism
-- applies uniformly across all of them via submissions.document_table.
--
-- ═══ Design decisions (documented per task instructions) ═══════════════════
--
-- 1. WHICH TIMESTAMP STARTS THE 6-MONTH CLOCK: delivered_at, not
--    submitted_at. Before delivery there is no finished "output" sitting in
--    the wallet yet — just a submission in the queue — so a clock starting
--    at submission time would be charging storage rent on content that
--    doesn't exist yet. delivered_at is the moment the document actually
--    becomes a stored deliverable a student can open from My Outputs, which
--    is what "wallet storage" describes. It also keeps the Pro-discount
--    priority-queue variance (turnaround_deadline, tier) from ever
--    shortening or lengthening anyone's storage window — queue time isn't
--    storage time.
--
-- 2. UPGRADE BEFORE EXPIRY (free -> Pro): submissions.expires_at is cleared
--    to NULL (= permanent) the moment a user's subscription becomes active
--    Pro, via a trigger on public.subscriptions — not just computed fresh
--    for submissions created after the upgrade. This covers every write
--    path that flips someone to Pro (the Stripe webhook's upsert/update,
--    and dev_activate_subscription()) without each of them needing to know
--    about wallet expiry. NULL is deliberately used for "permanent" rather
--    than a far-future date, so this is a real, honest "never" rather than
--    a number someone could screenshot and be surprised by later.
--
-- 3. DOWNGRADE/CANCEL AFTER ALREADY PERMANENT (Pro -> free): outputs already
--    cleared to NULL stay NULL — cancel_subscription() and a Stripe
--    cancellation only ever flip status away from active Pro, which this
--    migration's trigger does not react to (it only clears on the upgrade
--    transition, never (re)sets an expiry on a downgrade). This is the more
--    generous, less-surprising-to-the-user reading the task calls for, and
--    matches this codebase's own precedent: `user_has_active_pro()` /
--    `isPro` already key everything else off "is Pro active right now," but
--    nothing anywhere retroactively claws an already-granted permanent
--    benefit back on downgrade (e.g. Lifestyle Blueprint deals already
--    claimed, Elevation bookings already made). A submission delivered
--    *after* the downgrade is a normal free-tier delivery and gets a real
--    6-month expires_at like any other free-tier output, same as if the
--    person had never been Pro for that one.
--
-- 4. WHAT "EXPIRE" MEANS: not a silent row deletion. submissions and the
--    document row both stay (so My Outputs keeps showing the entry, its
--    service name, and its dates — never a vanishing row), but the
--    document's actual content (`generated`/`student_strategy` and `input`,
--    plus cv_documents' extra `ats_report`) is nulled out by the scheduled
--    job below once expires_at has passed, and submissions.wallet_scrubbed_at
--    records when. That's the real "6 months of storage" being enforced —
--    after that, the content itself is gone, not just hidden — while the
--    UI (next commit) can still tell the difference between "delivered,
--    not yet expired" and "expired" instead of the row just disappearing.
--    If a user upgrades to Pro *after* this scrub has already run, the
--    content that was already cleared cannot come back — "permanent"
--    protects content that still exists at upgrade time, it isn't an undo.

-- ─── 1. submissions: the expiry + scrub-tracking columns ────────────────────

alter table public.submissions
  add column if not exists expires_at timestamptz,
  add column if not exists wallet_scrubbed_at timestamptz;

comment on column public.submissions.expires_at is
  'When this delivered output''s free-tier wallet storage runs out. Set by deliver_submission() from the user''s Pro status AT DELIVERY TIME: NULL (= permanent) if they were Pro, now() + 6 months if not. Cleared back to NULL automatically by clear_wallet_expiry_on_pro_upgrade() the moment the user becomes Pro, however long after delivery that happens — so an upgrade before expiry always makes existing outputs permanent, never just future ones. Never re-set on downgrade: a NULL value, once set, stays NULL. NULL before delivery just means "no clock running yet," not "permanent" — deliver_submission is what starts it.';
comment on column public.submissions.wallet_scrubbed_at is
  'Set by expire_wallet_outputs() the one time it actually clears this submission''s document content, so the cron job never re-scrubs (and never re-notifies for) the same row twice. NULL means the content is still intact, whether because it hasn''t expired or because nothing has been delivered yet.';

-- ─── 2. deliver_submission(): now starts the wallet clock ────────────────────
-- Same signature and the same body as the current version
-- (20260915090001_notification_center_foundation_blueprint.sql) — every
-- existing check, grant, and the create_notification() call are unchanged.
-- The only addition is computing and storing expires_at in the same update
-- that sets delivered_at, so both land in the one existing transaction
-- rather than a second write.

create or replace function public.deliver_submission(p_submission_id uuid, p_handler_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
  v_updated uuid;
  v_is_pro boolean;
  v_expires_at timestamptz;
begin
  if not public.has_two_sentences(p_handler_note) then
    raise exception 'A Handler note of at least two sentences is required before delivering.';
  end if;

  select * into v_sub from public.submissions where id = p_submission_id;
  if v_sub is null then
    raise exception 'Submission not found';
  end if;

  if not (
    exists (select 1 from public.handler_assignments where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active')
    or public.has_role(auth.uid(), 'operations')
  ) then
    raise exception 'You are not the Handler assigned to this submission';
  end if;

  if v_sub.document_table is not null then
    if not public.is_valid_document_table(v_sub.document_table) then
      raise exception 'Submission has an invalid document_table value — refusing to deliver';
    end if;

    execute format(
      'update public.%I set status = ''delivered'', updated_at = now() where id = $1 and user_id = $2 returning id',
      v_sub.document_table
    ) into v_updated using v_sub.document_id, v_sub.user_id;

    if v_updated is null then
      raise exception 'Could not find the underlying document for this submission — refusing to deliver an orphaned record';
    end if;
  end if;

  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), p_handler_note);

  -- docs/business/subscription-pricing-model.md §1.1/§1.2: free tier gets
  -- 6 months of wallet storage from here; Pro (including complimentary Pro
  -- — user_has_active_pro() already treats a NULL current_period_end as
  -- active regardless of how that status went active) never expires.
  v_is_pro := public.user_has_active_pro(v_sub.user_id);
  v_expires_at := case when v_is_pro then null else now() + interval '6 months' end;

  update public.submissions
     set stage = 'delivered', delivered_at = now(), expires_at = v_expires_at
   where id = p_submission_id;

  perform public.create_notification(
    v_sub.user_id, 'foundation_blueprint', 'Your document has been reviewed',
    'A Campus Handler has reviewed and delivered your document. It is ready to view and download.',
    'submission', p_submission_id
  );
end;
$$;

-- ─── 3. Backfill already-delivered submissions ───────────────────────────────
-- Historical rows were delivered before this migration and never got an
-- expires_at. Their actual tier-at-delivery-time is lost, so this uses each
-- user's CURRENT Pro status as the best available stand-in, anchored on
-- their real delivered_at — the same rule a fresh delivery would apply if it
-- happened today. A currently-free user whose historical output is already
-- past 6 months old gets an expires_at in the past, which simply makes it
-- immediately eligible for the next expire_wallet_outputs() run rather than
-- silently grandfathering pre-migration content in forever.

update public.submissions s
   set expires_at = case
         when public.user_has_active_pro(s.user_id) then null
         else s.delivered_at + interval '6 months'
       end
 where s.stage = 'delivered'
   and s.delivered_at is not null
   and s.expires_at is null
   and s.wallet_scrubbed_at is null;

-- ─── 4. Upgrade clears expiry — the retroactive half of decision #2 ─────────
-- Fires on every write to subscriptions (the Stripe webhook's upsert/update,
-- and dev_activate_subscription()'s upsert both land here identically) so
-- no payment code path has to know about wallet expiry itself.

create or replace function public.clear_wallet_expiry_on_pro_upgrade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'active' and (NEW.current_period_end is null or NEW.current_period_end > now()) then
    update public.submissions
       set expires_at = null
     where user_id = NEW.user_id
       and expires_at is not null;
  end if;
  return NEW;
end;
$$;

drop trigger if exists clear_wallet_expiry_on_pro_upgrade on public.subscriptions;
create trigger clear_wallet_expiry_on_pro_upgrade
  after insert or update on public.subscriptions
  for each row
  execute function public.clear_wallet_expiry_on_pro_upgrade();

-- ─── 5. expire_wallet_outputs(): the scheduled scrub ─────────────────────────
-- Same shape as handle_deadline_escalation() / generate_handler_snapshots()
-- in 20260727090000_escalation_performance_ops.sql: a plain SQL/plpgsql
-- function registered on pg_cron, not an Edge Function, because this is
-- pure in-database reads/writes with no external call. Clears the content
-- columns rather than deleting the submissions/document rows, so My Outputs
-- can still render an "Expired" entry instead of the row disappearing.

create or replace function public.expire_wallet_outputs()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_content_col text;
begin
  -- Same pg_cron convention as handle_deadline_escalation(): auth.uid() is
  -- null for the scheduled run itself; only block a caller who IS
  -- authenticated but isn't Operations, so a manual test run is still
  -- possible without opening this up to every user.
  if auth.uid() is not null and not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can run this manually';
  end if;

  for r in
    select s.id as submission_id, s.user_id, s.document_table, s.document_id
    from public.submissions s
    where s.expires_at is not null
      and s.expires_at <= now()
      and s.wallet_scrubbed_at is null
      and s.document_table is not null
      and s.document_id is not null
      and public.is_valid_document_table(s.document_table)
  loop
    -- Every document table uses `generated` for its content column except
    -- job_search_sessions, which uses `student_strategy` — see
    -- OutputDetailScreen.jsx's own CONTENT_COLUMN map, mirrored here.
    v_content_col := case when r.document_table = 'job_search_sessions' then 'student_strategy' else 'generated' end;

    execute format(
      'update public.%I set %I = null, input = ''{}''::jsonb, updated_at = now() where id = $1',
      r.document_table, v_content_col
    ) using r.document_id;

    -- cv_documents is the one table with an extra content column (its CV
    -- Review-style ATS report) alongside `generated` — clear it too.
    if r.document_table = 'cv_documents' then
      update public.cv_documents set ats_report = null where id = r.document_id;
    end if;

    update public.submissions
       set wallet_scrubbed_at = now()
     where id = r.submission_id;

    perform public.create_notification(
      r.user_id, 'foundation_blueprint', 'A stored output has expired',
      'One of your free-tier Foundation Blueprint documents has reached the end of its 6-month wallet storage window, and its content has been cleared. Upgrade to Pro for permanent wallet storage.',
      'submission', r.submission_id
    );
  end loop;
end;
$$;

grant execute on function public.expire_wallet_outputs() to authenticated;

-- ─── 6. pg_cron registration ──────────────────────────────────────────────────
-- Same guarded-block pattern as 20260727090000_escalation_performance_ops.sql
-- (the extension may already be enabled from that migration; `create
-- extension if not exists` is a no-op in that case). Runs once a day —
-- there's no same-day SLA on this the way there is on handler deadlines.

create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'expire-wallet-outputs') then
    perform cron.schedule('expire-wallet-outputs', '30 3 * * *', 'select public.expire_wallet_outputs();');
  end if;
end $$;
