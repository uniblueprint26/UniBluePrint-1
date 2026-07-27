-- Foundation Blueprint hardening: eliminate partial saves.
--
-- Two two-step write patterns existed, neither transactional:
--
--   A. generate-job-search-support wrote student_strategy to job_search_sessions,
--      then upserted the handler guide. If the second write failed, the session
--      was already marked 'generated' and the student had their strategy, but
--      the Handler had no guide — a session that looks complete and isn't.
--
--   B. All 7 submit-for-review flows inserted a submissions row, then updated
--      the document's submission_id. If the second write failed, an orphaned
--      submission pointed at nothing and sat in the queue forever.
--
-- A function body is a single transaction, so both halves now commit together
-- or not at all.

-- ─── A. Job search generation ───────────────────────────────────────────────
-- SECURITY DEFINER because the handler guide is no longer student-writable
-- (see 20260725090000). Ownership is verified explicitly against auth.uid()
-- so the elevated rights can only ever act on the caller's own session.

create or replace function public.save_job_search_generation(
  p_session_id uuid,
  p_student_strategy jsonb,
  p_handler_guide jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.job_search_sessions
    where id = p_session_id and user_id = auth.uid()
  ) then
    raise exception 'Session not found or not owned by caller';
  end if;

  update public.job_search_sessions
     set student_strategy = p_student_strategy,
         status = 'generated',
         updated_at = now()
   where id = p_session_id;

  insert into public.job_search_handler_guides (session_id, handler_guide)
  values (p_session_id, p_handler_guide)
  on conflict (session_id) do update
     set handler_guide = excluded.handler_guide;
end;
$$;

grant execute on function public.save_job_search_generation(uuid, jsonb, jsonb) to authenticated;

-- ─── B. Submit a generated document for Handler review ──────────────────────
-- One function rather than seven near-identical ones. The table name is
-- whitelisted explicitly and interpolated with %I (identifier quoting), so it
-- is not an injection surface. Ownership is checked inside the dynamic
-- statement's WHERE clause, so a caller cannot submit someone else's document
-- even though the function runs as definer.

create or replace function public.submit_document_for_review(
  p_table text,
  p_document_id uuid,
  p_service_name text,
  p_notes text
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
begin
  if p_table not in (
    'cv_documents', 'cover_letters', 'linkedin_documents', 'application_forms',
    'interview_prep_packs', 'personal_statements', 'portfolio_plans'
  ) then
    raise exception 'Unsupported document table: %', p_table;
  end if;

  select id into v_service_id from public.services where name = p_service_name limit 1;

  insert into public.submissions (user_id, service_id, notes)
  values (auth.uid(), v_service_id, p_notes)
  returning id into v_submission_id;

  execute format(
    'update public.%I set submission_id = $1, status = ''submitted'', updated_at = now()
      where id = $2 and user_id = $3 returning id', p_table
  ) into v_updated using v_submission_id, p_document_id, auth.uid();

  if v_updated is null then
    -- No row matched: either the document does not exist or it belongs to
    -- someone else. Raising rolls back the submissions insert above, which is
    -- the whole point of doing this in one function.
    raise exception 'Document not found or not owned by caller';
  end if;

  return v_submission_id;
end;
$$;

grant execute on function public.submit_document_for_review(text, uuid, text, text) to authenticated;
