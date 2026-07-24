-- Foundation Blueprint: Portfolio Building.
--
-- Structurally different from the document builders: research confirms portfolio
-- building is a decision-tree/checklist problem (which platform fits this field,
-- how to structure it) rather than a single document to generate.

insert into public.services (name, description, category, price_cents, active)
values
  ('Portfolio Building — Standard', 'A platform recommendation and structure checklist for your field, reviewed and refined with a Uni Coach.', 'foundation', 3000, true),
  ('Portfolio Building — Premium', 'Includes a review and refinement session after the portfolio is live.', 'foundation', 5000, true)
on conflict do nothing;

create table public.portfolio_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  field text not null,
  input jsonb not null default '{}'::jsonb,
  generated jsonb,
  status text not null default 'draft' check (status in ('draft', 'generated', 'submitted', 'delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.portfolio_plans enable row level security;
create policy "Users can read own portfolio plans" on public.portfolio_plans for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own portfolio plans" on public.portfolio_plans for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own portfolio plans" on public.portfolio_plans for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Handlers can read assigned portfolio plans" on public.portfolio_plans for select to authenticated using (
  submission_id in (select submission_id from public.handler_assignments where handler_id = auth.uid())
);
create index portfolio_plans_user_id_idx on public.portfolio_plans (user_id);
