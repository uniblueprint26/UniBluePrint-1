-- Public-facing website forms (ComingSoonPage, ContactPage x3, ForUniversitiesPage,
-- ForBusinessesPage, JoinPage x3) have been writing to these 9 tables since they were
-- built, but the tables themselves were never migrated — every submission has been
-- silently failing with a generic "Something went wrong" error. Schemas below match
-- each form's actual `useState`/`.insert()` shape exactly (verified against
-- ComingSoonPage.jsx, ContactPage.jsx, ForUniversitiesPage.jsx, ForBusinessesPage.jsx,
-- JoinPage.jsx as of this migration).
--
-- These are anonymous, pre-account submissions (a prospective student or business has
-- no UniBlueprint login yet), so insert is open to `anon` with no ownership check —
-- read access is restricted to Operations/Founder only, same as every other
-- submission-style table in this schema.

-- ── Early access signups (ComingSoonPage, DownloadPage) ─────────────────────────
create table if not exists public.early_access_signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text,
  created_at timestamptz not null default now()
);
alter table public.early_access_signups enable row level security;

create policy "anyone_can_signup_early_access" on public.early_access_signups
  for insert to anon, authenticated with check (true);
create policy "operations_founder_read_early_access" on public.early_access_signups
  for select to authenticated using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

-- ── Shared status/UTM columns used by every enquiry/application table below ─────
-- status: 'pending' | 'contacted' | 'closed' — Operations/Founder update after review.

-- ── General contact (ContactPage — general enquiry tab) ─────────────────────────
create table if not exists public.general_enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  status      text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at  timestamptz not null default now()
);
alter table public.general_enquiries enable row level security;

-- ── Partnership enquiries (ContactPage — partnership tab) ───────────────────────
create table if not exists public.partnership_enquiries (
  id           uuid primary key default gen_random_uuid(),
  organisation text not null,
  contact_name text not null,
  email        text not null,
  type         text,
  message      text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  status       text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at   timestamptz not null default now()
);
alter table public.partnership_enquiries enable row level security;

-- ── Team applications (ContactPage — join the team tab) ─────────────────────────
create table if not exists public.team_applications (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  role         text,
  university   text,
  message      text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  status       text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at   timestamptz not null default now()
);
alter table public.team_applications enable row level security;

-- ── University partnership enquiries (ForUniversitiesPage) ──────────────────────
create table if not exists public.university_enquiries (
  id               uuid primary key default gen_random_uuid(),
  institution_name text not null,
  contact_name     text not null,
  role             text,
  email            text not null,
  phone            text,
  message          text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at       timestamptz not null default now()
);
alter table public.university_enquiries enable row level security;

-- ── Business partnership enquiries (ForBusinessesPage) ───────────────────────────
create table if not exists public.business_enquiries (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name  text not null,
  role          text,
  email         text not null,
  phone         text,
  business_type text,
  message       text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  status        text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at    timestamptz not null default now()
);
alter table public.business_enquiries enable row level security;

-- ── Handler applications (JoinPage) ──────────────────────────────────────────────
create table if not exists public.handler_applications (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  university     text,
  course         text,
  year           text,
  email          text not null,
  why_apply      text,
  hours_per_week text,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  status         text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at     timestamptz not null default now()
);
alter table public.handler_applications enable row level security;

-- ── Coach applications (JoinPage) ────────────────────────────────────────────────
create table if not exists public.coach_applications (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null,
  linkedin_url  text,
  experience    text,
  specialisms   text[],
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  status        text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at    timestamptz not null default now()
);
alter table public.coach_applications enable row level security;

-- ── Ambassador applications (JoinPage) ───────────────────────────────────────────
create table if not exists public.ambassador_applications (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  university       text,
  course           text,
  year             text,
  email            text not null,
  instagram_handle text,
  why_apply        text,
  how_promote      text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  status           text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  created_at       timestamptz not null default now()
);
alter table public.ambassador_applications enable row level security;

-- ── Shared RLS: public insert, Operations/Founder read + status update ──────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'general_enquiries', 'partnership_enquiries', 'team_applications',
    'university_enquiries', 'business_enquiries',
    'handler_applications', 'coach_applications', 'ambassador_applications'
  ]
  loop
    execute format(
      'create policy "anyone_can_submit_%1$s" on public.%1$s for insert to anon, authenticated with check (true);',
      t
    );
    execute format(
      'create policy "operations_founder_read_%1$s" on public.%1$s for select to authenticated using (public.has_role(auth.uid(), ''operations'') or public.has_role(auth.uid(), ''founder''));',
      t
    );
    execute format(
      'create policy "operations_founder_update_%1$s" on public.%1$s for update to authenticated using (public.has_role(auth.uid(), ''operations'') or public.has_role(auth.uid(), ''founder'')) with check (public.has_role(auth.uid(), ''operations'') or public.has_role(auth.uid(), ''founder''));',
      t
    );
  end loop;
end $$;
