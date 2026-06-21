-- Application and contact form tables.
-- These are required for JoinPage.jsx (handler/coach/ambassador forms)
-- and ContactPage.jsx (general/partnership/team forms).

-- ── Handler applications ──────────────────────────────────────────────────────
create table if not exists public.handler_applications (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  full_name        text        not null,
  university       text        not null,
  course           text        not null,
  year             text        not null,
  email            text        not null,
  why_apply        text        not null,
  hours_per_week   text        not null,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text        not null    default 'pending'
);

alter table public.handler_applications enable row level security;

create policy "handler_applications_anon_insert"
  on public.handler_applications for insert to anon with check (true);

-- ── Coach applications ────────────────────────────────────────────────────────
create table if not exists public.coach_applications (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  full_name        text        not null,
  email            text        not null,
  linkedin_url     text        not null,
  specialisms      text[]      not null    default '{}',
  experience       text        not null,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text        not null    default 'pending'
);

alter table public.coach_applications enable row level security;

create policy "coach_applications_anon_insert"
  on public.coach_applications for insert to anon with check (true);

-- ── Ambassador applications ───────────────────────────────────────────────────
create table if not exists public.ambassador_applications (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  full_name        text        not null,
  university       text        not null,
  course           text        not null,
  year             text        not null,
  email            text        not null,
  instagram_handle text,
  why_apply        text        not null,
  how_promote      text        not null,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text        not null    default 'pending'
);

alter table public.ambassador_applications enable row level security;

create policy "ambassador_applications_anon_insert"
  on public.ambassador_applications for insert to anon with check (true);

-- ── General enquiries ─────────────────────────────────────────────────────────
create table if not exists public.general_enquiries (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  name             text        not null,
  email            text        not null,
  subject          text        not null,
  message          text        not null,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text        not null    default 'pending'
);

alter table public.general_enquiries enable row level security;

create policy "general_enquiries_anon_insert"
  on public.general_enquiries for insert to anon with check (true);

-- ── Partnership enquiries ─────────────────────────────────────────────────────
create table if not exists public.partnership_enquiries (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  organisation     text        not null,
  contact_name     text        not null,
  email            text        not null,
  type             text        not null,
  message          text        not null,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text        not null    default 'pending'
);

alter table public.partnership_enquiries enable row level security;

create policy "partnership_enquiries_anon_insert"
  on public.partnership_enquiries for insert to anon with check (true);

-- ── Team applications ─────────────────────────────────────────────────────────
create table if not exists public.team_applications (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  name             text        not null,
  email            text        not null,
  role             text        not null,
  university       text,
  message          text        not null,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text        not null    default 'pending'
);

alter table public.team_applications enable row level security;

create policy "team_applications_anon_insert"
  on public.team_applications for insert to anon with check (true);
