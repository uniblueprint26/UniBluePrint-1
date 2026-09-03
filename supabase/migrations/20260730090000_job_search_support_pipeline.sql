-- ═══════════════════════════════════════════════════════════════════════════
-- Connect Job Search Support to the Handler pipeline
--
-- Job Search Support was the one Foundation Blueprint generator that never
-- reached a Handler. job_search_sessions already carries submission_id and
-- tier columns, and job_search_handler_guides' RLS (20260725090000) already
-- scopes read access through handler_assignments — the read side was built
-- for this pipeline months ago. What was missing was the one write-side gate:
-- is_valid_document_table() never listed the table, so calling
-- submit_document_for_review('job_search_sessions', ...) raised
-- "Unsupported document table" and nothing ever populated submission_id.
--
-- Every other RPC in the pipeline (deliver_submission, flag_submission,
-- mark_submission_incomplete) only touches submissions.status via a generic
-- `id`/`user_id`/`status`/`updated_at` update — columns job_search_sessions
-- already has — so extending this one whitelist is sufficient. Nothing else
-- in the six verified RPCs changes, for any document type.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.is_valid_document_table(p_table text)
returns boolean
language sql
immutable
as $$
  select p_table in (
    'cv_documents', 'cover_letters', 'linkedin_documents', 'application_forms',
    'interview_prep_packs', 'personal_statements', 'portfolio_plans',
    'job_search_sessions'
  )
$$;
