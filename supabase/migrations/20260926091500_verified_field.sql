-- Misleading-content fix: "every coach and partner profile shows a
-- Verified badge by default, regardless of any actual verification."
--
-- Verified against the live schema: neither coach_profiles nor partners has
-- a `verified` column today, and the app's shared VerifiedBadge component
-- defaulted its `verified` prop to `true`, so any coach/partner object that
-- didn't explicitly carry a `verified` field (i.e. every single one — the
-- static COACHES/PARTNERS listings never set it) rendered the badge anyway.
--
-- This adds the real column both tables were missing, defaulting to
-- `false` — nobody is verified until the team says so — and locks down who
-- can flip it:
--   - coach_profiles already has a blanket "Coaches can update own
--     profile" policy (auth.uid() = user_id, no column restriction, no
--     `with check`), which would otherwise let a coach self-verify with a
--     plain PATCH. A BEFORE UPDATE trigger pins `verified` back to its
--     previous value unless the caller has the operations or founder role
--     (public.has_role(), same helper used throughout this schema), so only
--     the team can grant it.
--   - partners has no self-service update path at all — its only write
--     policy is already "founder_operations_manage_partners" (has_role
--     'founder' or 'operations'), so no equivalent guard is needed there.
--
-- Companion app-code fix (same change set): VerifiedBadge's own default
-- flipped from `true` to `false`, and CoachProfileScreen/ElevationScreen/
-- PartnerCards now fetch this real column and pass it in explicitly
-- instead of ever trusting a hardcoded true.
--
-- NOT applied by this session — author-only migration, left for a human
-- to review and run.

alter table public.coach_profiles
  add column if not exists verified boolean not null default false;

alter table public.partners
  add column if not exists verified boolean not null default false;

create or replace function public.guard_coach_profile_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verified is distinct from old.verified
     and not (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')) then
    new.verified := old.verified;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_coach_profile_verified on public.coach_profiles;
create trigger trg_guard_coach_profile_verified
  before update on public.coach_profiles
  for each row execute function public.guard_coach_profile_verified();
