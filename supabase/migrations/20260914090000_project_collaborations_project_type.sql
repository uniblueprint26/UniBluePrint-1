-- Project Collaboration now gets a dedicated Campus Connect board page (was
-- previously only reachable via a bespoke inline section on
-- CampusConnectScreen). Bringing it fully onto the generic board-engine
-- pattern adds a `project_type` field alongside the existing skills_needed
-- tags, matching how other boards categorise their posts (e.g. Student Ads'
-- ad_type, Opportunities' opportunity_type).
--
-- Nullable, not backfilled with a NOT NULL constraint — existing/seed rows
-- predate this field and a hard requirement would break them. New posts from
-- the app always set it (PostFormModal marks it required in the form).
alter table public.project_collaborations add column if not exists project_type text;

-- Best-effort backfill for the three seeded example projects so they don't
-- show up with a blank type pill.
update public.project_collaborations set project_type = 'Academic / Coursework'
  where is_example = true and title = 'Campus Sustainability App' and project_type is null;
update public.project_collaborations set project_type = 'Academic / Coursework'
  where is_example = true and title = 'AI Study Planner' and project_type is null;
update public.project_collaborations set project_type = 'Personal / Side Project'
  where is_example = true and title = 'Student Budget Tracker' and project_type is null;
