-- Foundation Blueprint: Cover Letter Builder + Review.

insert into public.services (name, description, category, price_cents, active)
values
  ('Cover Letter Assistance — Standard', 'A tailored cover letter written specifically for one role and company, reviewed by a Campus Handler. Delivered within 48 hours.', 'foundation', 2000, true),
  ('Cover Letter Assistance — Premium', 'Same as Standard, delivered same day with priority queue.', 'foundation', 4000, true)
on conflict do nothing;

create table public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  target_role text not null,
  target_company text not null,
  job_description text,
  input jsonb not null default '{}'::jsonb,
  generated jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cover_letters enable row level security;
create policy "Users can read own cover letters" on public.cover_letters for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own cover letters" on public.cover_letters for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own cover letters" on public.cover_letters for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Handlers can read assigned cover letters" on public.cover_letters for select to authenticated using (
  submission_id in (select submission_id from public.handler_assignments where handler_id = auth.uid())
);
create index cover_letters_user_id_idx on public.cover_letters (user_id);

create table public.cover_letter_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  raw_text text not null,
  target_role text,
  target_company text,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.cover_letter_reviews enable row level security;
create policy "Users can read own cover letter reviews" on public.cover_letter_reviews for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own cover letter reviews" on public.cover_letter_reviews for insert to authenticated with check (auth.uid() = user_id);
create index cover_letter_reviews_user_id_idx on public.cover_letter_reviews (user_id);
