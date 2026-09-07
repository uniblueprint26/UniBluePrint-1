-- profiles.user_type already exists (added in the original schema) but has
-- never been populated or constrained. This migration turns it into the
-- general "what kind of user is this" concept used app-wide: Student,
-- Apprentice, Gap Year, or Worker (non-student).
--
-- Backfill first so the NOT NULL + CHECK constraints below can't reject any
-- existing row — every current row gets 'student', matching the app's
-- previous implicit default (the Budgeting screen's own "Your situation"
-- picker already defaulted to a student framing).
update public.profiles set user_type = 'student' where user_type is null;

alter table public.profiles
  alter column user_type set default 'student';

alter table public.profiles
  add constraint profiles_user_type_check
  check (user_type in ('student', 'apprentice', 'gap_year', 'worker'));

alter table public.profiles
  alter column user_type set not null;

comment on column public.profiles.user_type is
  'General user-type concept shared across the app (Budgeting income categories, Course Connect framing, etc). One of: student, apprentice, gap_year, worker. Defaults to student for backward compatibility.';
