-- Add board scope (campus vs course) so both can share a slug, and seed Course Connect boards.

-- 1) scope column (existing 8 boards default to 'campus').
alter table public.boards add column if not exists scope text not null default 'campus';

-- 2) Replace unique(type) with unique(scope, type).
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'boards_type_key') then
    alter table public.boards drop constraint boards_type_key;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'boards_scope_type_key') then
    alter table public.boards add constraint boards_scope_type_key unique (scope, type);
  end if;
end $$;

-- 3) Seed the 5 Course Connect discussion boards (Student Directory is not a feed).
insert into public.boards (name, description, type, scope) values
  ('Project Collaboration', 'Cross-campus project board',    'projects',  'course'),
  ('Resource Finder',       'Shared academic resources',     'resources', 'course'),
  ('Industry Discussions',  'Talk about your field',         'industry',  'course'),
  ('Events',                'Upcoming student events',       'events',    'course'),
  ('Cross-Ireland Reviews', 'Compare colleges nationwide',   'reviews',   'course')
on conflict (scope, type) do nothing;
