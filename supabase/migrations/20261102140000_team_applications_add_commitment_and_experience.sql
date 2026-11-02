-- Add the two questions agreed for the internal-team hiring push (commitment
-- level + optional prior experience) to the existing team_applications table,
-- which previously only captured role/university/message.

alter table public.team_applications
  add column if not exists commitment_hours text,
  add column if not exists experience_notes text;
