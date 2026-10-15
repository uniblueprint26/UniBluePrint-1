-- Extends profiles.user_type's check constraint (see the
-- 20260912090000_profiles_user_type_default migration) with a fifth value,
-- 'leaving_cert', for the new 5th/6th-year Leaving Cert user type (see
-- constants/userTypes.js). No backfill needed — this only widens the
-- allowed set, it never narrows it, so every existing row stays valid.
alter table public.profiles
  drop constraint profiles_user_type_check;

alter table public.profiles
  add constraint profiles_user_type_check
  check (user_type in ('student', 'apprentice', 'gap_year', 'worker', 'leaving_cert'));

comment on column public.profiles.user_type is
  'General user-type concept shared across the app (Budgeting income categories, Course Connect framing, etc). One of: student, apprentice, gap_year, worker, leaving_cert. Defaults to student for backward compatibility.';
