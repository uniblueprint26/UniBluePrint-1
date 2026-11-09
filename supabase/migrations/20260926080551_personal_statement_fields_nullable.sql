-- Personal Statement's intake is being rebuilt as a one-question-at-a-time
-- questionnaire (matching every other Foundation Blueprint service). Draft
-- autosave needs to insert a row before pathway, target_course, and
-- target_institution have necessarily been answered — all three were NOT
-- NULL (pathway with no default at all, unlike interview_type's 'blended'),
-- which would reject the very first autosave. generate-personal-statement's
-- own checkRequired() and its `if (!pathwayPrompt) return ... 'Unknown
-- pathway'` guard still enforce all three at generation time, so no real
-- guarantee is lost.
alter table public.personal_statements alter column pathway drop not null;
alter table public.personal_statements alter column target_course drop not null;
alter table public.personal_statements alter column target_institution drop not null;
