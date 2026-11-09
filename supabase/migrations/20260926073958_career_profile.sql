-- Foundation Blueprint §08: the Career Profile.
--
-- Until now the pillar was eight independent document generators. Every one of
-- them started cold: the same student typed their name, education, and target
-- role into the CV builder, then again into LinkedIn, then again into the cover
-- letter, then again into interview prep. Nothing read anything else. The
-- Research Pass 02 reference library calls this out directly — Foundation
-- Blueprint is "not intended to be a one-time document generator" but a
-- "long-term employability companion" built on a persistent profile, so that
-- "every output after the first gets faster and more personalised, not
-- generated from scratch."
--
-- Two objects make that real, and they are deliberately separate:
--
--   career_profiles — WHO THE PERSON IS. Slow-changing, one row per user.
--                     Education, experience, skills, achievements, goals.
--
--   career_targets  — WHAT THEY ARE APPLYING FOR RIGHT NOW. Fast-changing,
--                     many rows per user. Role, industry, company, course.
--                     The reference library's "target-context object": stated
--                     once per application rather than once per module.
--
-- The third piece — the competency evidence bank — already exists as
-- evidence_bank_stories (20260724120000) and is already user-scoped rather
-- than form-scoped, so it needs no schema change here. What it needed was for
-- modules other than Application Forms to actually read it; that is a code
-- change, not a migration.

-- ─── career_profiles ────────────────────────────────────────────────────────

create table public.career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,

  -- Mirrors the CV builder's personal_info block so a profile can prefill it
  -- wholesale rather than field by field.
  personal_info jsonb not null default '{}'::jsonb,

  education jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  skills jsonb not null default '{}'::jsonb,
  achievements jsonb not null default '{}'::jsonb,
  certifications jsonb not null default '[]'::jsonb,

  -- The reference library's audience list is explicitly wider than Irish
  -- Leaving Cert students: "Sixth Form · LC · University · Apprentice · Gap
  -- Year · Graduate · Young Professional", across both systems. These two
  -- fields are what let §05 route a user to UCAS vs CAO-mature vs postgrad
  -- without asking them to already know which applies to them.
  education_system text check (education_system in ('ireland', 'uk', 'other')),
  pathway text,

  -- Free-text, deliberately: "goals, interests" per the Vision doc's profile
  -- definition. Used as generation context, never as a structured filter.
  goals text,
  interests text,

  -- Set once by the user rather than re-asked by every builder. The CV builder
  -- already had this flag locally; hoisting it here is what stops four
  -- different tools each asking a first-time job seeker the same slightly
  -- deflating question.
  has_no_experience boolean not null default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.career_profiles enable row level security;

create policy "Users can manage own career profile" on public.career_profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Handlers see the profile only for students actually assigned to them, via a
-- submission. Same assignment-scoped pattern as every document table.
create policy "Handlers can read assigned students' profiles" on public.career_profiles
  for select to authenticated using (
    user_id in (
      select s.user_id
      from public.submissions s
      join public.handler_assignments ha on ha.submission_id = s.id
      where ha.handler_id = auth.uid()
    )
  );

-- ─── career_targets ─────────────────────────────────────────────────────────
-- "I'm applying for X at Y" — stated once, read by CV, LinkedIn, cover letter,
-- application forms, and interview prep.

create table public.career_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- What the user calls this application in their own words, so a list of
  -- targets is scannable ("Stripe grad scheme", "UCD Psychology").
  label text not null,

  target_role text,
  target_industry text,
  target_company text,

  -- Course/institution rather than role/company for the education-track
  -- modules (§05 personal statements), which are targeting a place on a
  -- course, not a job.
  target_course text,
  target_institution text,

  job_description text,

  -- Exactly one target per user is active at a time; the builders default to
  -- it. Enforced by the partial unique index below rather than by trusting
  -- the client to clear the previous one.
  is_active boolean not null default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.career_targets enable row level security;

create policy "Users can manage own career targets" on public.career_targets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Handlers can read assigned students' targets" on public.career_targets
  for select to authenticated using (
    user_id in (
      select s.user_id
      from public.submissions s
      join public.handler_assignments ha on ha.submission_id = s.id
      where ha.handler_id = auth.uid()
    )
  );

create index career_targets_user_id_idx on public.career_targets (user_id, created_at desc);

-- At most one active target per user. A partial unique index is the right tool:
-- it permits unlimited inactive history rows while making two simultaneously
-- active targets impossible at the database level.
create unique index career_targets_one_active_per_user
  on public.career_targets (user_id) where is_active;

-- ─── Activating a target ────────────────────────────────────────────────────
-- Deactivate-then-activate is two writes racing the unique index above: doing
-- it from the client can transiently violate it and fail. One function, one
-- transaction, ownership checked against auth.uid().

create or replace function public.set_active_career_target(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.career_targets
    where id = p_target_id and user_id = auth.uid()
  ) then
    raise exception 'Target not found or not owned by caller';
  end if;

  update public.career_targets
     set is_active = false, updated_at = now()
   where user_id = auth.uid() and is_active and id <> p_target_id;

  update public.career_targets
     set is_active = true, updated_at = now()
   where id = p_target_id;
end;
$$;

grant execute on function public.set_active_career_target(uuid) to authenticated;

-- ─── Evidence bank: competency index ────────────────────────────────────────
-- The bank was only ever queried by user_id, because only Application Forms
-- read it. Interview Preparation now reads it filtered by competency tag
-- (§06's STAR / STAR+R / strengths formats all draw on the same stories), so
-- the tag array needs to actually be indexed.

create index if not exists evidence_bank_stories_tags_idx
  on public.evidence_bank_stories using gin (competency_tags);
