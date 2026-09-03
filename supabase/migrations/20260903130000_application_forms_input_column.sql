-- Bugfix: generate-application-answers/index.ts reads `form.input` for
-- `industry` and `unsure_about` (see its `const input = form.input || {}`),
-- but application_forms was never given an `input` column — every request
-- has silently sent `{}` regardless of what a client submits. Adds the
-- column the existing function code already expects, matching the same
-- `input jsonb not null default '{}'::jsonb` shape every sibling Foundation
-- Blueprint table (cv_documents, linkedin_documents, cover_letters, ...)
-- already has.

alter table public.application_forms
  add column input jsonb not null default '{}'::jsonb;
