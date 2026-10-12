-- Age-gate enforcement for profiles.date_of_birth (Ireland's digital consent
-- age is 16). The column has existed since the original schema
-- (20260410140346) but was never populated or validated -- SignUpScreen now
-- collects it and client-side blocks sign-up under 16; this migration adds
-- the database-level backstop so an under-16 date of birth can never be
-- written to a profile at all, however it got there, matching the pattern
-- handle_new_user() already uses for consent-style fields (see
-- marketing_consent).

-- Defense in depth: reject any insert/update that sets date_of_birth to
-- under 16 years before today. A null date_of_birth (existing users, or
-- anyone who hasn't supplied one yet) is always allowed through -- this is
-- a one-way "once valid, stays valid" check since nobody gets younger, so
-- comparing against current_date at write time is safe.
create or replace function public.validate_date_of_birth()
returns trigger
language plpgsql
as $$
begin
  if new.date_of_birth is not null and new.date_of_birth > (current_date - interval '16 years') then
    raise exception 'date_of_birth indicates an age under 16, which is not permitted';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_date_of_birth on public.profiles;
create trigger profiles_validate_date_of_birth
  before insert or update of date_of_birth on public.profiles
  for each row execute function public.validate_date_of_birth();

comment on column public.profiles.date_of_birth is
  'Collected at sign-up (SignUpScreen). Nullable for existing users created before this field existed -- the Investment tab (BudgetingScreen) treats a null value as age unknown and hides 18+ gated content rather than assuming an age. Enforced to be 16+ at the database level by profiles_validate_date_of_birth; the Investment tab additionally requires 18+ client-side.';

-- Extend handle_new_user() to also set date_of_birth from signUp()'s
-- options.data, same mechanism marketing_consent uses. A missing value
-- falls back to null -- SignUpScreen already blocks continuing past step 1
-- for an under-16 DOB, so this is just the write path, not the primary
-- enforcement (the trigger above is, and runs on this very insert too).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, marketing_consent, date_of_birth)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
    (new.raw_user_meta_data->>'date_of_birth')::date
  );
  return new;
end;
$$;
