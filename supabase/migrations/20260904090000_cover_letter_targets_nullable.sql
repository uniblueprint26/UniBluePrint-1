-- Cover Letter Assistance's intake is being rebuilt as a one-question-at-a-time
-- questionnaire (matching CV/LinkedIn Optimisation). Draft autosave needs to
-- insert a row before target_role and target_company have necessarily been
-- answered — both were NOT NULL, which would reject that first autosave
-- outright. generate-cover-letter's own checkRequired(['Target role', ...],
-- ['Target company', ...]) already enforces both at generation time, so
-- dropping the DB-level constraints loses no real guarantee — it only stops
-- blocking an in-progress draft.
alter table public.cover_letters alter column target_role drop not null;
alter table public.cover_letters alter column target_company drop not null;
