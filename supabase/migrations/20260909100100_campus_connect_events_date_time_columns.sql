-- Simplify campus_events' date/time capture: two plain fields (a date, and a
-- free-text time like "6:30pm") instead of a single timestamptz, matching
-- the free-text "schedule" pattern already used by carpool_routes rather
-- than requiring a native date/time picker component the app doesn't have.
-- Table has 0 rows (just created, no UI wired to it yet), so this is a clean
-- rename+add rather than a data migration.
alter table public.campus_events add column if not exists event_date date;
alter table public.campus_events add column if not exists event_time text;
update public.campus_events set event_date = event_at::date, event_time = to_char(event_at, 'HH12:MI am') where event_date is null;
alter table public.campus_events alter column event_date set not null;
alter table public.campus_events alter column event_time set not null;
alter table public.campus_events drop column if exists event_at;
