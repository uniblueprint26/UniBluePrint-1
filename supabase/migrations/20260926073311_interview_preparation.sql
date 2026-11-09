-- Foundation Blueprint: Interview Preparation.

insert into public.services (name, description, category, price_cents, active)
values
  ('Interview Preparation — Standard Pack', 'A personalised interview preparation pack — likely questions, model answers drawn from your evidence bank, company research prompts, and confidence tips.', 'foundation', 2000, true),
  ('Interview Preparation — Standard Pack + Mock Session', 'Pack plus a live mock interview session with a Campus Handler, scored against a real interview rubric.', 'foundation', 3500, true),
  ('Interview Preparation — Premium Pack', 'Same-day pack, priority queue.', 'foundation', 4000, true),
  ('Interview Preparation — Premium Pack + Mock Session', 'Premium pack plus a live mock interview session with real-time feedback.', 'foundation', 5500, true)
on conflict do nothing;

create table public.interview_prep_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  target_company text,
  target_role text not null,
  interview_type text not null default 'blended' check (interview_type in ('behavioural', 'technical', 'strengths_based', 'blended')),
  input jsonb not null default '{}'::jsonb,
  generated jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.interview_prep_packs enable row level security;
create policy "Users can read own interview prep packs" on public.interview_prep_packs for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own interview prep packs" on public.interview_prep_packs for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own interview prep packs" on public.interview_prep_packs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Handlers can read assigned interview prep packs" on public.interview_prep_packs for select to authenticated using (
  submission_id in (select submission_id from public.handler_assignments where handler_id = auth.uid())
);
create index interview_prep_packs_user_id_idx on public.interview_prep_packs (user_id);
