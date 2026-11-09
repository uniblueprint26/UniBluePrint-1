-- Portfolio Building's intake is being rebuilt as a one-question-at-a-time
-- questionnaire (matching every other Foundation Blueprint service). Draft
-- autosave needs to insert a row before field has necessarily been
-- answered — it was NOT NULL, which would reject the very first autosave.
-- generate-portfolio-plan's own checkRequired(['Field', ...]) still
-- enforces it at generation time, so no real guarantee is lost.
alter table public.portfolio_plans alter column field drop not null;
