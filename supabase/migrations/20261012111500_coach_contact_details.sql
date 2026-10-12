-- GDPR fix: coaches' personal contact details (email, phone, Instagram/
-- TikTok handles, Linktree links) were hardcoded directly in
-- ElevationScreen.jsx's static COACHES array, shipped into the JS bundle.
-- That meant a coach's GDPR deletion/correction request against their own
-- contact info could only be actioned by cutting a new app-store release.
--
-- This table gives that data a real backend home, keyed by the same
-- coach_slug already used to link a static listing to a live
-- coach_profiles row (see 20260811090000_gdpr_coach_enquiries_connections).
--
-- Access is deliberately NOT exposed to ordinary authenticated app users —
-- unlike coach_profiles (which has a blanket "Authenticated can read coach
-- profiles" policy for bio/photo/verified), every real "contact a coach"
-- path in the app already goes through coach_enquiries (the "Send a Quick
-- Message" flow on CoachProfileScreen, and the "Find me a coach" flow on
-- ElevationScreen as of this same change — see its own header comment).
-- There is no legitimate product need for a public user to read a coach's
-- raw email/phone, so this table grants read/write only to:
--   - the coach themself, via the same coach_profiles.user_id link used by
--     coach_bookings/coach_enquiries row-matching policies, and
--   - Operations/Founder (public.has_role()), who action GDPR requests and
--     may need to actually reach a coach to fulfil an enquiry.
-- Removing this from the JS bundle also means the app's existing
-- Operations GDPR workflow (gdpr_requests, gdpr_self_service) can now
-- action a coach's own deletion/correction request against this table
-- directly, with no app release required.
--
-- Applied directly to the project in smaller statements under this same
-- logical change (coach_contact_details_table, coach_contact_details_rls,
-- coach_contact_details_touch_fn/_trigger, coach_contact_details_seed_*) —
-- this file is the consolidated record of that change for the repo.

create table if not exists public.coach_contact_details (
  coach_slug        text primary key references public.coach_profiles(coach_slug) on delete cascade,
  email             text,
  phone             text,
  instagram_handle  text,
  tiktok_handle     text,
  linktree_url      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.coach_contact_details enable row level security;

-- No blanket authenticated-read policy here on purpose — see header comment.
create policy "coach_manage_own_contact_details"
  on public.coach_contact_details for all to authenticated
  using (
    exists (
      select 1 from public.coach_profiles cp
      where cp.coach_slug = coach_contact_details.coach_slug
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.coach_profiles cp
      where cp.coach_slug = coach_contact_details.coach_slug
        and cp.user_id = auth.uid()
    )
  );

create policy "founder_operations_manage_coach_contact_details"
  on public.coach_contact_details for all to authenticated
  using (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'))
  with check (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'));

create or replace function public.touch_coach_contact_details_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists coach_contact_details_touch_updated_at on public.coach_contact_details;
create trigger coach_contact_details_touch_updated_at
  before update on public.coach_contact_details
  for each row execute function public.touch_coach_contact_details_updated_at();

-- ── Seed: the real contact data that was hardcoded in ElevationScreen.jsx's
-- COACHES array before this change, pulled from the app source so none of
-- it is lost when the JS literal is removed. coach_profiles rows are
-- upserted first (most of these coaches are not yet registered platform
-- users and have no existing coach_profiles row at all — matches the
-- "unclaimed" row pattern already established in
-- 20260811090000_gdpr_coach_enquiries_connections, user_id left null until
-- Operations/Founder link a real account).

insert into public.coach_profiles (coach_slug)
values
  ('coach-3'),  -- Nathan Yanzo (Nyz3ditz)
  ('coach-4'),  -- DG Trading
  ('coach-15'), -- Dinero Trading Group
  ('coach-16'), -- Zainab Adeyemi (Soft Life Investing)
  ('coach-17'), -- Camila Aruk
  ('coach-6'),  -- Emanuel Tolic
  ('coach-7'),  -- Tadgh Darcy
  ('coach-8'),  -- Milan Piroska (MPFitness)
  ('coach-12'), -- Jayden Reynolds
  ('coach-13'), -- Aoife Keogh
  ('coach-18')  -- Luana Ciweck
on conflict (coach_slug) do nothing;

insert into public.coach_contact_details (coach_slug, email, phone, instagram_handle, tiktok_handle, linktree_url)
values
  ('coach-3',  null,                              '+353857272875', 'Nyz3ditz',          null,            null),
  ('coach-4',  null,                              '+353838393794', null,                null,            null),
  ('coach-15', null,                              null,            'rellzdinero8',      'rellzdinero',   null),
  ('coach-16', null,                              null,            'iamzayade',         'iamzayade',     null),
  ('coach-17', 'camila.coachfitness@gmail.com',   '0838602227',    'camilaaruk.coach',  null,            null),
  ('coach-6',  'etcoaching06@gmail.com',          null,            'emtolic',           null,            'https://linktr.ee/EmanuelPT'),
  ('coach-7',  null,                              null,            'tdarcycoaching',    'darcy.lifts',   'https://linktr.ee/tadghdarcy123'),
  ('coach-8',  'milanpirfitness@gmail.com',       '0857633757',    'milanpir_fitness',  null,            null),
  ('coach-12', null,                              null,            'JayRfitness6',      'JayRfitness6',  null),
  ('coach-13', null,                              null,            'aoife_thebraveflow',null,            'https://linktr.ee/thebraveflowaoife'),
  ('coach-18', null,                              null,            'luana.ciweck',      null,            null)
on conflict (coach_slug) do update set
  email            = excluded.email,
  phone            = excluded.phone,
  instagram_handle = excluded.instagram_handle,
  tiktok_handle    = excluded.tiktok_handle,
  linktree_url     = excluded.linktree_url;
