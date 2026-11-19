-- Minimum age is 18 (was 16). This matches the website Terms ("at least 18
-- years of age"), the store age rating (18+) and SignUpScreen's MIN_SIGNUP_AGE.
--
-- Replaces the date of birth check from
-- 20261012120000_profiles_date_of_birth_age_gate.sql. The trigger itself
-- (profiles_validate_date_of_birth) is unchanged and keeps calling this
-- function, only the number of years changes.
--
-- Existing profiles are left alone: the check only runs when date_of_birth is
-- inserted or changed, so an account that already holds a date of birth for a
-- 16 or 17 year old is not touched. A null date of birth is still allowed
-- (accounts created before the field existed).
--
-- Not applied by the build. The founder applies it.

create or replace function public.validate_date_of_birth()
returns trigger
language plpgsql
as $$
begin
  if new.date_of_birth is not null and new.date_of_birth > (current_date - interval '18 years') then
    raise exception 'date_of_birth indicates an age under 18, which is not permitted';
  end if;
  return new;
end;
$$;

comment on column public.profiles.date_of_birth is
  'Collected at sign-up (SignUpScreen). Nullable for existing users created before this field existed -- the Investment tab (BudgetingScreen) treats a null value as age unknown and hides 18+ gated content rather than assuming an age. Enforced to be 18+ at the database level by profiles_validate_date_of_birth.';
