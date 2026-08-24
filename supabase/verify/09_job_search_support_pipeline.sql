-- ═══════════════════════════════════════════════════════════════════════════
-- 09 — Job Search Support reaches a Handler
--
-- Before this, job_search_sessions.submission_id and .tier existed but nothing
-- ever wrote to them — is_valid_document_table() never listed the table, so
-- submit_document_for_review('job_search_sessions', ...) raised "Unsupported
-- document table" and the session never entered handler_queue. Every other
-- generator's output reached a Handler; this one never did.
--
-- Checks:
--   * is_valid_document_table() now accepts job_search_sessions (and still
--     rejects everything it should)
--   * submit_document_for_review works end-to-end for this table: submission
--     row created, session_id linked back, handler_queue entry inserted
--   * the pre-existing job_search_handler_guides RLS (built for this pipeline
--     months before the write side existed) actually lights up: 0 rows visible
--     to a handler before they claim, 1 after, 0 for a different handler who
--     never claimed
--   * the unmodified claim_submission / submit_handler_decision RPCs work for
--     this table exactly as they do for the other 7 document types
--
-- Safe to run anywhere: everything rolls back.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ad01', 'verify-student9@example.test'),
  ('00000000-0000-0000-0000-00000000ad02', 'verify-handler9@example.test'),
  ('00000000-0000-0000-0000-00000000ad03', 'verify-handler9b@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name) values
  ('00000000-0000-0000-0000-00000000ad01', 'Verify Student 9'),
  ('00000000-0000-0000-0000-00000000ad02', 'Verify Handler 9'),
  ('00000000-0000-0000-0000-00000000ad03', 'Verify Handler 9B')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'user'),
  ('00000000-0000-0000-0000-00000000ad02', 'handler'),
  ('00000000-0000-0000-0000-00000000ad03', 'handler')
on conflict do nothing;

-- ── 1. whitelist ────────────────────────────────────────────────────────────
do $$
begin
  if not public.is_valid_document_table('job_search_sessions') then
    raise exception 'FAIL: job_search_sessions is still not a valid document table';
  end if;
  if not public.is_valid_document_table('cv_documents') then
    raise exception 'FAIL: extending the whitelist broke an existing entry (cv_documents)';
  end if;
  if public.is_valid_document_table('not_a_real_table') then
    raise exception 'FAIL: the whitelist now accepts an arbitrary table name';
  end if;
  raise notice 'PASS is_valid_document_table() accepts job_search_sessions and rejects garbage; existing entries untouched';
end $$;

-- ── 2. the write path, as the student (mirrors JobSearchSupportPage.jsx) ───
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000ad01';

insert into public.job_search_sessions (user_id, input, tier)
values ('00000000-0000-0000-0000-00000000ad01', '{"field_or_industry":"Nursing"}'::jsonb, 'standard')
returning id as session_id \gset

-- Mirrors what the generate-job-search-support edge function does.
select public.save_job_search_generation(
  :'session_id'::uuid,
  '{"your_situation_summary":"test strategy"}'::jsonb,
  '{"diagnostic_opening_questions":["How is the search going?"],"talking_points":["Discuss registration timeline"],"wellbeing_note":"Sounds discouraged after a run of rejections."}'::jsonb
);

select public.submit_document_for_review(
  'job_search_sessions', :'session_id'::uuid,
  'Job Search Support — Standard', 'Job Search — Nursing', 'standard'
) as submission_id \gset

-- Server-side GUCs, so the PL/pgSQL blocks below can read these ids without
-- relying on psql's client-side `:'var'` substitution, which does not reach
-- inside a dollar-quoted `do $$` body.
select set_config('verify.session_id', :'session_id', false);
select set_config('verify.submission_id', :'submission_id', false);

-- psql's `:'var'` substitution does not reach inside a dollar-quoted `do $$`
-- body, so these checks pull their own values server-side via SELECT INTO
-- rather than relying on client-side variables set by \gset.
do $$
declare
  v_stage text;
  v_document_table text;
  v_linked boolean;
  v_status text;
  v_queued integer;
begin
  select s.stage::text, s.document_table, (jss.submission_id = s.id), jss.status
    into v_stage, v_document_table, v_linked, v_status
    from public.submissions s
    join public.job_search_sessions jss on jss.id = current_setting('verify.session_id')::uuid
   where s.id = current_setting('verify.submission_id')::uuid;

  if v_stage <> 'in_queue' then
    raise exception 'FAIL: expected stage in_queue, got %', v_stage;
  end if;
  if v_document_table <> 'job_search_sessions' then
    raise exception 'FAIL: document_table mismatch: %', v_document_table;
  end if;
  if not v_linked then
    raise exception 'FAIL: job_search_sessions.submission_id was not linked back to the new submission';
  end if;
  if v_status <> 'submitted' then
    raise exception 'FAIL: expected job_search_sessions.status = submitted, got %', v_status;
  end if;

  select count(*) into v_queued from public.handler_queue
   where submission_id = current_setting('verify.submission_id')::uuid;
  if v_queued <> 1 then
    raise exception 'FAIL: expected exactly one handler_queue row, got %', v_queued;
  end if;

  raise notice 'PASS submit_document_for_review works end-to-end for job_search_sessions: submission created, FK linked back, queued';
end $$;

reset "request.jwt.claim.sub";

-- ── 3. the guide is invisible until a Handler actually claims it ───────────
-- Runs as the real `authenticated` role — a superuser session (which this
-- connects as) bypasses RLS entirely, so the check is meaningless without it.
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000ad02';

do $$
declare v_count integer;
begin
  select count(*) into v_count from public.job_search_handler_guides
   where session_id = current_setting('verify.session_id')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL: guide visible to an unassigned handler before claiming (% rows)', v_count;
  end if;
  raise notice 'PASS job_search_handler_guides invisible before any Handler has claimed the session';
end $$;

reset role;

-- ── 4. claim via the unmodified RPC, then re-check visibility ─────────────
select public.claim_submission(current_setting('verify.submission_id')::uuid);

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000ad02';

do $$
declare v_count integer;
begin
  select count(*) into v_count from public.job_search_handler_guides
   where session_id = current_setting('verify.session_id')::uuid;
  if v_count <> 1 then
    raise exception 'FAIL: assigned handler cannot read the guide after claiming (% rows)', v_count;
  end if;
  raise notice 'PASS guide visible to the claiming handler';
end $$;

set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000ad03';

do $$
declare v_count integer;
begin
  select count(*) into v_count from public.job_search_handler_guides
   where session_id = current_setting('verify.session_id')::uuid;
  if v_count <> 0 then
    raise exception 'FAIL: a handler who never claimed can read the guide (% rows)', v_count;
  end if;
  raise notice 'PASS guide invisible to a handler who never claimed — exactly as handler_assignments-scoped RLS intends';
end $$;

reset role;

-- ── 5. the unmodified decision RPC completes the ticket ─────────────────────
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000ad02';

select public.submit_handler_decision(
  current_setting('verify.submission_id')::uuid, 'approved',
  'Discussed the registration timeline and reframed the search around three named hospitals. Left with a concrete plan.',
  5, 5, 5, 5, 5, false
);

do $$
declare
  v_final_stage text;
  v_session_status text;
  v_reviews integer;
begin
  select s.stage::text, jss.status into v_final_stage, v_session_status
    from public.submissions s
    join public.job_search_sessions jss on jss.id = current_setting('verify.session_id')::uuid
   where s.id = current_setting('verify.submission_id')::uuid;

  if v_final_stage <> 'delivered' then
    raise exception 'FAIL: expected submission stage delivered, got %', v_final_stage;
  end if;
  if v_session_status <> 'delivered' then
    raise exception 'FAIL: expected job_search_sessions.status delivered, got %', v_session_status;
  end if;

  select count(*) into v_reviews from public.handler_ticket_reviews
   where submission_id = current_setting('verify.submission_id')::uuid;
  if v_reviews <> 1 then
    raise exception 'FAIL: expected one quality review row, got %', v_reviews;
  end if;

  raise notice 'PASS submit_handler_decision completes a job_search_sessions ticket exactly as it does for any other document type';
end $$;

rollback;
