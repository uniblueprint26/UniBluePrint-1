-- Foundation Blueprint: CV Builder + CV Review.
--
-- Two new tables, both first-class (not force-fit into the generic `submissions`
-- table, which only tracks stage/timestamps/handler — not structured CV content).
-- `cv_documents.submission_id` links a build to the existing Submitted → In Queue →
-- Assigned → In Review → Delivered pipeline once the user sends it for Handler review.

-- ─── Services ───────────────────────────────────────────────────────────────────
-- Pricing per the Official Overview v2, Part 5 Pricing Model: CV Optimisation
-- Standard €20 / Premium €40. CV Review is a new module (not in the Overview's
-- pricing table) — seeded with price_cents left null until a price is decided.

insert into public.services (name, description, category, price_cents, active)
values
  ('CV Optimisation — Standard', 'Tailored, ATS-optimised CV generated from a structured input form, reviewed by a Campus Handler. Delivered within 48 hours.', 'foundation', 2000, true),
  ('CV Optimisation — Premium', 'Same as Standard, delivered same day with priority queue.', 'foundation', 4000, true),
  ('CV Review', 'Analysis of an existing CV — ATS score, keyword gaps, formatting issues, and improvement recommendations.', 'foundation', null, false)
on conflict do nothing;

-- ─── cv_documents ───────────────────────────────────────────────────────────────

create table public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  title text not null default 'Untitled CV',
  style text not null default 'classic_ats' check (style in ('classic_ats', 'modern')),
  target_role text,
  target_industry text,
  target_company text,
  job_description text,
  input jsonb not null default '{}'::jsonb,
  generated jsonb,
  ats_report jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cv_documents enable row level security;

create policy "Users can read own CV documents" on public.cv_documents
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own CV documents" on public.cv_documents
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own CV documents" on public.cv_documents
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own CV documents" on public.cv_documents
  for delete to authenticated using (auth.uid() = user_id);

create policy "Handlers can read assigned CV documents" on public.cv_documents
  for select to authenticated using (
    submission_id in (
      select submission_id from public.handler_assignments where handler_id = auth.uid()
    )
  );

create index cv_documents_user_id_idx on public.cv_documents (user_id);

-- ─── cv_reviews ─────────────────────────────────────────────────────────────────

create table public.cv_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cv_document_id uuid references public.cv_documents(id),
  raw_text text not null,
  target_role text,
  job_description text,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.cv_reviews enable row level security;

create policy "Users can read own CV reviews" on public.cv_reviews
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own CV reviews" on public.cv_reviews
  for insert to authenticated with check (auth.uid() = user_id);

create index cv_reviews_user_id_idx on public.cv_reviews (user_id);
