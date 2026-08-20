-- Foundation Blueprint: the Handler review pipeline.
--
-- The schema for this already existed — handler_queue, ticket_revisions,
-- handler_assignments, operations_flags were all created in the very first
-- migration, with read policies and nothing else. No write policy, no RPC,
-- no application code ever touched them. This migration is what actually
-- turns that scaffold into a working pipeline.
--
-- It also closes the "two-tracker split" identified in review: cv_documents
-- (and the other 6 document tables) each carry their own status column that
-- the student-facing pages read, while submissions.stage was meant to track
-- the same document's position in the review pipeline. Nothing kept them in
-- sync. The fix here is not to unify them into one table — that would touch
-- 7 already-working document flows to solve a problem that isn't actually
-- theirs — it's to make submissions remember exactly which row it is
-- tracking (document_table + document_id), so every pipeline transition can
-- update both trackers in the same transaction.

-- ─── 1. submissions: give it what it needs to drive the pipeline ────────────

alter table public.submissions
  add column if not exists document_table text,
  add column if not exists document_id uuid,
  add column if not exists turnaround_deadline timestamptz,
  add column if not exists marked_incomplete boolean not null default false,
  add column if not exists incomplete_reason text;

-- tier already existed (20260606170000) but was never constrained or actually
-- set by anything — every submission today has tier = null.
alter table public.submissions
  drop constraint if exists submissions_tier_check;
alter table public.submissions
  add constraint submissions_tier_check check (tier is null or tier in ('standard', 'premium'));

comment on column public.submissions.document_table is
  'Which of the 7 whitelisted document tables this submission tracks. Lets deliver_submission() update the student-facing status column in the same transaction as the pipeline stage, instead of the two trackers drifting independently.';
comment on column public.submissions.document_id is
  'The row in document_table this submission is for.';
comment on column public.submissions.turnaround_deadline is
  'Computed at submission time from tier: standard = 48 hours, premium = 24 hours. Recorded immediately, not on payment — nothing currently charges for premium, so this is a target the queue can sort/highlight against, not yet a paid SLA.';

-- ─── 2. Handler-visible read access on submissions ───────────────────────────
-- Handlers previously could not read ANY submission row directly — only their
-- own handler_assignments rows, which don't carry the student's input or the
-- document content.
--
-- submissions itself holds only metadata (tier, stage, timestamps, which
-- document table/id, the student's own short label) — no personal content —
-- so ANY handler can read ANY submission row, matching handler_queue's
-- existing "every handler sees the whole queue" policy. This is what makes a
-- browsable, claim-from queue possible: a handler has to be able to see an
-- unclaimed item to decide whether to claim it, not just their own after the
-- fact. The actual sensitive content lives in the 7 document tables, which
-- get their own, narrower, assignment-scoped policy below (§3.5) — that's
-- where the real access boundary is.

create policy "Handlers and operations can read submissions" on public.submissions
  for select to authenticated using (
    public.has_role(auth.uid(), 'handler') or public.has_role(auth.uid(), 'operations')
  );

-- ─── 2.5. Handler read access on the actual document content ─────────────────
-- This is the real access boundary the job_search_handler_guides table already
-- established: scoped by assignment, not open to every handler the way
-- submissions' metadata is. Without this, the queue UI could see that a CV
-- submission exists but could not fetch the CV itself to review — the core
-- thing the whole pipeline exists to let a Handler do.

do $$
declare
  t text;
begin
  foreach t in array array[
    'cv_documents', 'cover_letters', 'linkedin_documents', 'application_forms',
    'interview_prep_packs', 'personal_statements', 'portfolio_plans'
  ]
  loop
    execute format(
      'create policy "Handlers can read assigned %1$s" on public.%1$I
         for select to authenticated using (
           submission_id in (
             select submission_id from public.handler_assignments where handler_id = auth.uid()
           )
           or public.has_role(auth.uid(), ''operations'')
         )',
      t
    );
  end loop;
end $$;

-- ─── 3. Claim: handler_assignments gets a real write path ────────────────────
-- One active assignment per submission, enforced at the database level so two
-- handlers racing to claim the same item can't both succeed.

create unique index if not exists handler_assignments_one_active_per_submission
  on public.handler_assignments (submission_id) where status = 'active';

create policy "Handlers can self-assign" on public.handler_assignments
  for insert to authenticated with check (
    auth.uid() = handler_id
    and (public.has_role(auth.uid(), 'handler') or public.has_role(auth.uid(), 'operations'))
  );

-- ─── 4. The pipeline RPCs ─────────────────────────────────────────────────────
-- Every transition is one SECURITY DEFINER function so the multi-table write
-- it requires (queue + assignment + submissions.stage, or submissions.stage +
-- the actual document's own status column) commits as one transaction. This
-- is the same pattern as submit_document_for_review and
-- save_job_search_generation — nothing new architecturally, just applied to
-- the pipeline's remaining transitions.

-- A rough, honest approximation of "minimum 2 sentences": at least two
-- sentence-ending marks and a minimum length, so a one-word note or a single
-- long run-on can't pass. Not linguistically precise — a real second sentence
-- detector isn't worth building for this — but it rejects the obvious way
-- someone tries to skip writing a real note.
create or replace function public.has_two_sentences(p_text text)
returns boolean
language sql
immutable
as $$
  select p_text is not null
     and length(trim(p_text)) >= 20
     and array_length(regexp_split_to_array(trim(p_text), '[.!?]+\s*'), 1) >= 3
     -- split on sentence-enders produces N+1 pieces for N sentences; the +1
     -- is the trailing empty string after the last mark, hence >= 3 for 2 sentences.
$$;

-- Validates document_table against the same whitelist submit_document_for_review
-- uses. Re-checked here rather than trusted from the stored column, since this
-- value gets interpolated into dynamic SQL with format(%I).
create or replace function public.is_valid_document_table(p_table text)
returns boolean
language sql
immutable
as $$
  select p_table in (
    'cv_documents', 'cover_letters', 'linkedin_documents', 'application_forms',
    'interview_prep_packs', 'personal_statements', 'portfolio_plans'
  )
$$;

-- ─── claim_submission ─────────────────────────────────────────────────────────
-- Self-assign from the unclaimed queue. Fails cleanly (via the unique index)
-- if another handler claimed it first between the caller loading the queue
-- and clicking claim.

create or replace function public.claim_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role(auth.uid(), 'handler') or public.has_role(auth.uid(), 'operations')) then
    raise exception 'Only Campus Handlers can claim submissions';
  end if;

  if not exists (select 1 from public.submissions where id = p_submission_id) then
    raise exception 'Submission not found';
  end if;

  -- Unique index does the real race protection; this exists() check just
  -- gives a clearer error than a raw constraint violation would.
  if exists (select 1 from public.handler_assignments where submission_id = p_submission_id and status = 'active') then
    raise exception 'This submission has already been claimed by another Handler';
  end if;

  insert into public.handler_assignments (handler_id, submission_id, assigned_at, status)
  values (auth.uid(), p_submission_id, now(), 'active');

  update public.handler_queue
     set handler_id = auth.uid(), picked_at = now()
   where submission_id = p_submission_id;

  update public.submissions
     set stage = 'assigned', assigned_at = now(), handler_id = auth.uid()
   where id = p_submission_id;
end;
$$;

grant execute on function public.claim_submission(uuid) to authenticated;

-- ─── start_review ─────────────────────────────────────────────────────────────
-- Separate from claim() because "I've claimed it" and "I'm actively looking
-- at it now" are genuinely different moments for deadline/queue-position
-- purposes, and the schema already had in_review_at as its own column.

create or replace function public.start_review(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.handler_assignments
    where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active'
  ) then
    raise exception 'You do not have this submission claimed';
  end if;

  update public.submissions
     set stage = 'in_review', in_review_at = coalesce(in_review_at, now())
   where id = p_submission_id and stage = 'assigned';
end;
$$;

grant execute on function public.start_review(uuid) to authenticated;

-- ─── deliver_submission ────────────────────────────────────────────────────────
-- The transaction that closes the two-tracker split: submissions.stage and
-- the document's own status column move together, in the same function body,
-- or neither moves at all.

create or replace function public.deliver_submission(p_submission_id uuid, p_handler_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
  v_updated uuid;
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

  -- The handler's note is a Handler/Operations-only record (ticket_revisions'
  -- read policy excludes the student) — submissions.notes stays exactly what
  -- the student themselves typed as their own label, not silently mixed with
  -- the reviewer's internal note.
  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), p_handler_note);

  update public.submissions
     set stage = 'delivered', delivered_at = now()
   where id = p_submission_id;

  insert into public.notifications (user_id, category, title, message)
  values (
    v_sub.user_id, 'foundation_blueprint', 'Your document has been reviewed',
    'A Campus Handler has reviewed and delivered your document. It is ready to view and download.'
  );
end;
$$;

grant execute on function public.deliver_submission(uuid, text) to authenticated;

-- ─── flag_submission ───────────────────────────────────────────────────────────
-- Hands off to Operations rather than delivering. Uses the operations_flags
-- table that already existed with a management policy for Operations but no
-- insert path for a Handler to actually raise one.

create or replace function public.flag_submission(p_submission_id uuid, p_handler_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_two_sentences(p_handler_note) then
    raise exception 'A Handler note of at least two sentences is required before flagging.';
  end if;

  if not (
    exists (select 1 from public.handler_assignments where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active')
    or public.has_role(auth.uid(), 'operations')
  ) then
    raise exception 'You are not the Handler assigned to this submission';
  end if;

  insert into public.operations_flags (flagged_by, target_type, target_id, reason)
  values (auth.uid(), 'submission', p_submission_id, p_handler_note);

  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), 'Flagged to Operations: ' || p_handler_note);
end;
$$;

grant execute on function public.flag_submission(uuid, text) to authenticated;

-- ─── mark_submission_incomplete ────────────────────────────────────────────────
-- Not a pipeline stage — an exception state alongside whatever stage the
-- submission is actually in, which is why it's a boolean + reason rather than
-- a new value squeezed into the submission_stage enum.

create or replace function public.mark_submission_incomplete(p_submission_id uuid, p_handler_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.has_two_sentences(p_handler_note) then
    raise exception 'A Handler note of at least two sentences is required before marking incomplete.';
  end if;

  if not (
    exists (select 1 from public.handler_assignments where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active')
    or public.has_role(auth.uid(), 'operations')
  ) then
    raise exception 'You are not the Handler assigned to this submission';
  end if;

  update public.submissions
     set marked_incomplete = true, incomplete_reason = p_handler_note
   where id = p_submission_id
   returning user_id into v_user_id;

  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), 'Marked incomplete: ' || p_handler_note);

  insert into public.notifications (user_id, category, title, message)
  values (
    v_user_id, 'foundation_blueprint', 'Your submission needs more information',
    'A Campus Handler flagged your submission as incomplete: ' || p_handler_note
  );
end;
$$;

grant execute on function public.mark_submission_incomplete(uuid, text) to authenticated;

-- ─── 5. submit_document_for_review: now records tier, deadline, and which ────
--        document this submission actually tracks ─────────────────────────────
--
-- Adding a parameter means `create or replace` would create a second,
-- overloaded function rather than truly replacing the old one — the old
-- 4-argument signature has to be dropped explicitly first, or both versions
-- end up coexisting and every existing call site's 4-arg call keeps hitting
-- the old one that doesn't record tier at all.

drop function if exists public.submit_document_for_review(text, uuid, text, text);

create or replace function public.submit_document_for_review(
  p_table text,
  p_document_id uuid,
  p_service_name text,
  p_notes text,
  p_tier text default 'standard'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_id uuid;
  v_submission_id uuid;
  v_updated uuid;
  v_deadline timestamptz;
begin
  if not public.is_valid_document_table(p_table) then
    raise exception 'Unsupported document table: %', p_table;
  end if;

  if p_tier not in ('standard', 'premium') then
    raise exception 'Unsupported tier: %', p_tier;
  end if;

  v_deadline := now() + case when p_tier = 'premium' then interval '24 hours' else interval '48 hours' end;

  select id into v_service_id from public.services where name = p_service_name limit 1;

  insert into public.submissions (user_id, service_id, notes, tier, turnaround_deadline, document_table, document_id, stage)
  values (auth.uid(), v_service_id, p_notes, p_tier, v_deadline, p_table, p_document_id, 'in_queue')
  returning id into v_submission_id;

  execute format(
    'update public.%I set submission_id = $1, status = ''submitted'', updated_at = now()
      where id = $2 and user_id = $3 returning id', p_table
  ) into v_updated using v_submission_id, p_document_id, auth.uid();

  if v_updated is null then
    raise exception 'Document not found or not owned by caller';
  end if;

  insert into public.handler_queue (submission_id, priority, queued_at)
  values (v_submission_id, case when p_tier = 'premium' then 10 else 0 end, now());

  return v_submission_id;
end;
$$;

grant execute on function public.submit_document_for_review(text, uuid, text, text, text) to authenticated;
