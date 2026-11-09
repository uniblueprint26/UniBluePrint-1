-- Foundation Blueprint: Personal Statement Builder.
--
-- Three genuinely different structures, not one generic template with a label
-- swapped — see generate-personal-statement for why each pathway is distinct.

insert into public.services (name, description, category, price_cents, active)
values
  ('Personal Statement — Standard', 'A tailored personal statement — UCAS, CAO (mature applicant), or postgraduate — reviewed by a Campus Handler. Delivered within 48 hours.', 'foundation', 2000, true),
  ('Personal Statement — Premium', 'Same as Standard, delivered same day, includes a follow-up revision round.', 'foundation', 4000, true)
on conflict do nothing;

create table public.personal_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  pathway text not null check (pathway in ('ucas', 'cao_mature', 'postgrad')),
  target_course text not null,
  target_institution text not null,
  input jsonb not null default '{}'::jsonb,
  generated jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.personal_statements enable row level security;
create policy "Users can read own personal statements" on public.personal_statements for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own personal statements" on public.personal_statements for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own personal statements" on public.personal_statements for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Handlers can read assigned personal statements" on public.personal_statements for select to authenticated using (
  submission_id in (select submission_id from public.handler_assignments where handler_id = auth.uid())
);
create index personal_statements_user_id_idx on public.personal_statements (user_id);
