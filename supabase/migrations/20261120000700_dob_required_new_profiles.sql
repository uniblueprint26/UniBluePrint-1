-- Changes: the under 18 check now runs only on insert or when the date of birth actually changes, and a new profile must carry a date of birth once the app_flags switch require_dob_on_signup is true (seeded false). Destructive: no. Undo: drop trigger profiles_require_dob and function profiles_require_date_of_birth(), delete the require_dob_on_signup flag row, and re-create validate_date_of_birth from 20261119110000_min_age_18.sql.
--
-- R18: production allows a NULL date of birth, and the sign up trigger accepts
-- a missing one, so a direct API sign up skips the 18 gate (75 of 77 profiles
-- have no date of birth). Old profiles must stay valid.
--
-- What changes
--  1. validate_date_of_birth(): the under 18 test now applies on INSERT, and on
--     UPDATE only when the date of birth value really changes. Before, any
--     update that listed the column (even with the same value) re-tested it,
--     so an old profile holding a 16 or 17 year old date of birth could not
--     have that column re-saved. Old profiles stay valid, new under 18 values
--     are still refused. Message unchanged.
--  2. profiles_require_dob (BEFORE INSERT): rejects a new profile with no date
--     of birth, but ONLY when the app_flags row require_dob_on_signup is true.
--     Existing profiles with a NULL date of birth are never touched (this is an
--     insert trigger only).
--
-- WHY A SWITCH: the website sign up form (src/pages/auth/SignUpPage.jsx) does
-- not send date_of_birth. With the requirement on, every website sign up would
-- fail with "Database error saving new user". The mobile app always sends it.
-- So the flag is seeded FALSE. Flip it once the website form collects a date of
-- birth (a website change, not in this migration):
--   update public.app_flags set value = 'true'::jsonb, updated_at = now() where key = 'require_dob_on_signup';
-- Turn it off again the same way with 'false'.
-- Admin created users (Supabase dashboard invites, the App Store review
-- account) also need a date_of_birth in their user metadata once it is on.

create or replace function public.validate_date_of_birth()
returns trigger
language plpgsql
as $$
begin
  if new.date_of_birth is not null
     and (tg_op = 'INSERT' or new.date_of_birth is distinct from old.date_of_birth)
     and new.date_of_birth > (current_date - interval '18 years')
  then
    raise exception 'date_of_birth indicates an age under 18, which is not permitted';
  end if;
  return new;
end;
$$;

create or replace function public.profiles_require_date_of_birth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.date_of_birth is null
     and coalesce((select f.value = 'true'::jsonb from public.app_flags f where f.key = 'require_dob_on_signup'), false)
  then
    raise exception 'date_of_birth is required. Members must be 18 or over.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.profiles_require_date_of_birth() from public, anon, authenticated;

drop trigger if exists profiles_require_dob on public.profiles;
create trigger profiles_require_dob
  before insert on public.profiles
  for each row execute function public.profiles_require_date_of_birth();

insert into public.app_flags (key, value)
values ('require_dob_on_signup', 'false'::jsonb)
on conflict (key) do nothing;
