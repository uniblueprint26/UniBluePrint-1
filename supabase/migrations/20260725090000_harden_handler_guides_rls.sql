-- Foundation Blueprint hardening: job_search_handler_guides access control.
--
-- Two separate problems, both fixed here.
--
-- 1. READ SCOPE. The original policy granted every account holding the
--    'handler' or 'operations' role read access to EVERY guide, for every
--    student, regardless of assignment. Every other table in the system scopes
--    handler access through handler_assignments. That inconsistency mattered
--    most on this table specifically, because the guide carries wellbeing_note
--    — a flag that a student appears distressed or has been searching a long
--    time with no results, which is the single most sensitive field the
--    platform stores. Now scoped through handler_assignments exactly like
--    cv_documents, cover_letters, and the rest.
--
--    Operations retains unscoped read: it is the queue-management role and
--    cannot triage what it cannot see. That is a deliberate, narrower grant
--    than before (one role instead of two).
--
-- 2. WRITE PATH. Students could UPDATE a guide row they can never SELECT.
--    That existed only because generate-job-search-support upserted the guide
--    under the caller's own JWT, so regeneration needed the grant. The function
--    now writes the guide through save_job_search_generation() — a SECURITY
--    DEFINER function (see 20260725091000) that verifies session ownership
--    against auth.uid() before writing. Elevated rights live inside that one
--    function instead of being granted to the student's own JWT, so the
--    student-facing INSERT and UPDATE policies are no longer needed by
--    anything — and while they existed, a student could blank or tamper with
--    the Handler's private guide (removing a wellbeing flag or a redirect
--    note) without ever reading it. Both are dropped.

-- ─── 1. Read scope ──────────────────────────────────────────────────────────

drop policy if exists "Handlers and operations can read handler guides" on public.job_search_handler_guides;

create policy "Handlers can read assigned handler guides" on public.job_search_handler_guides
  for select to authenticated using (
    session_id in (
      select s.id
      from public.job_search_sessions s
      join public.handler_assignments ha on ha.submission_id = s.submission_id
      where ha.handler_id = auth.uid()
    )
  );

create policy "Operations can read handler guides" on public.job_search_handler_guides
  for select to authenticated using (
    public.has_role(auth.uid(), 'operations')
  );

-- ─── 2. Write path ──────────────────────────────────────────────────────────
-- SECURITY DEFINER writes run as the function owner and bypass RLS, so no
-- replacement policy is needed. Dropping these closes the tamper path without
-- breaking regeneration: save_job_search_generation() upserts the guide, and
-- its ownership check is what constrains the caller.

drop policy if exists "Session owner can insert their own handler guide" on public.job_search_handler_guides;
drop policy if exists "Session owner can update their own handler guide" on public.job_search_handler_guides;
