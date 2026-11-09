-- Interview Preparation's intake is being rebuilt as a one-question-at-a-time
-- questionnaire (matching CV/LinkedIn/Cover Letter/Application Form). Draft
-- autosave needs to insert a row before target_role has necessarily been
-- answered — it was NOT NULL, which would reject that first autosave
-- outright. generate-interview-prep's own checkRequired(['Target role', ...])
-- still enforces it at generation time, so no real guarantee is lost.
alter table public.interview_prep_packs alter column target_role drop not null;
