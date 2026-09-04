-- Application Form Assistance's "Answer a Form" intake is being rebuilt as a
-- one-question-at-a-time questionnaire (matching CV/LinkedIn/Cover Letter).
-- Unlike its siblings, application_forms had no `input` jsonb column at all —
-- just top-level target_company/target_role and the questions array — so
-- there was nowhere to put an industry override, unsure_about, or the
-- _current_step draft-resume marker. Adding the same shape every other
-- Foundation Blueprint table already has.
alter table public.application_forms add column input jsonb not null default '{}'::jsonb;
