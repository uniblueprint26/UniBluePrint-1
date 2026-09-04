-- LinkedIn Optimisation's intake is being rebuilt as a one-question-at-a-time
-- questionnaire (matching the CV Optimisation rebuild). Draft autosave needs
-- to insert a row before the industry question has necessarily been
-- answered — cv_documents.target_industry is already nullable for exactly
-- this reason; linkedin_documents.target_industry was NOT NULL, which would
-- reject that first autosave outright. generate-linkedin's own
-- checkRequired(['Target industry', ...]) already enforces this at
-- generation time, so dropping the DB-level constraint loses no real
-- guarantee — it only stops blocking an in-progress draft.
alter table public.linkedin_documents alter column target_industry drop not null;
