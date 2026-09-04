-- Foundation Blueprint: LinkedIn Optimisation.

insert into public.services (name, description, category, price_cents, active)
values
  ('LinkedIn Optimisation — Standard', 'Optimised headline, About section, experience descriptions, skills, and featured section ideas, reviewed by a Campus Handler. Delivered within 48 hours.', 'foundation', 2000, true),
  ('LinkedIn Optimisation — Premium', 'Same as Standard, delivered same day with priority queue.', 'foundation', 4000, true)
on conflict do nothing;

create table public.linkedin_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  target_industry text not null,
  target_role text,
  input jsonb not null default '{}'::jsonb,
  generated jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.linkedin_documents enable row level security;

create policy "Users can read own LinkedIn documents" on public.linkedin_documents
  for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own LinkedIn documents" on public.linkedin_documents
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own LinkedIn documents" on public.linkedin_documents
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Handlers can read assigned LinkedIn documents" on public.linkedin_documents
  for select to authenticated using (
    submission_id in (select submission_id from public.handler_assignments where handler_id = auth.uid())
  );

create index linkedin_documents_user_id_idx on public.linkedin_documents (user_id);
