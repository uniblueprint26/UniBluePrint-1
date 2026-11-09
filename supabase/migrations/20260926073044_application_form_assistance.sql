-- Foundation Blueprint: Application Form Assistance.
--
-- Built around a reusable evidence bank rather than one-off generation: the user
-- logs real STAR stories once, tags each with the competencies it demonstrates,
-- and every future application form question draws from the same bank —
-- reassembled under whichever competency lens that question is actually testing.

insert into public.services (name, description, category, price_cents, active)
values
  ('Application Form Assistance — Standard', 'STAR-structured answers to competency and situational questions, drawn from your evidence bank, reviewed by a Campus Handler. Pricing reflects form length and complexity.', 'foundation', 2000, true),
  ('Application Form Assistance — Premium', 'Same as Standard, delivered same day with priority queue.', 'foundation', 4000, true)
on conflict do nothing;

create table public.evidence_bank_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  situation text not null,
  task text not null,
  action text not null,
  result text not null,
  competency_tags text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.evidence_bank_stories enable row level security;
create policy "Users can manage own evidence bank" on public.evidence_bank_stories
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index evidence_bank_stories_user_id_idx on public.evidence_bank_stories (user_id);

create table public.application_forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  target_company text,
  target_role text,
  questions jsonb not null default '[]'::jsonb,
  generated jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.application_forms enable row level security;
create policy "Users can read own application forms" on public.application_forms for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own application forms" on public.application_forms for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own application forms" on public.application_forms for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Handlers can read assigned application forms" on public.application_forms for select to authenticated using (
  submission_id in (select submission_id from public.handler_assignments where handler_id = auth.uid())
);
create index application_forms_user_id_idx on public.application_forms (user_id);
