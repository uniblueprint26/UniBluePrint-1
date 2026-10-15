-- "Verified Student" visual badge (founder decision, Oct 2026).
--
-- Same shape and lockdown as partners.verified / coach_profiles.verified
-- (20260926091500_verified_field.sql): a plain boolean, defaulting to
-- false — nobody is verified until the team says so — with a BEFORE
-- UPDATE trigger that pins it back to its previous value unless the
-- caller has the operations or founder role. That guard is needed here
-- too: "Users can update own profile" (from the original schema) is a
-- blanket auth.uid() = id policy with no `with_check` and no column
-- restriction, so without it a student could self-verify with a plain
-- PATCH the same way a coach could before that migration.
--
-- This is deliberately its own column on public.profiles, not a reuse of
-- coach_profiles.verified / partners.verified — those guard a different
-- claim (this coach/partner is vetted) on different tables a student row
-- has no relationship to. VerifiedBadge (components/ui/VerifiedBadge.jsx)
-- is the shared rendering component reused as-is; only the data source is
-- new.

alter table public.profiles
  add column if not exists verified_student boolean not null default false;

create or replace function public.guard_profiles_verified_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verified_student is distinct from old.verified_student
     and not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    new.verified_student := old.verified_student;
  end if;
  return new;
end;
$$;

-- create or replace trigger (PG14+), not drop + create — see
-- 20261015140500_partner_follow_notifications.sql's own note on DROP
-- timing out against this project.
create or replace trigger trg_guard_profiles_verified_student
  before update on public.profiles
  for each row execute function public.guard_profiles_verified_student();
