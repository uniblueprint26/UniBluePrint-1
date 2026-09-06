-- Budgeting: savings goals (Emergency Fund, Holiday Savings, and any goal a
-- student adds themselves). Each goal tracks a target and a running current
-- amount; contributions are made through the app's "Add to [Goal]" flow,
-- which increments current_amount server-side rather than letting the
-- client overwrite it directly. RLS scoped to the owning user, same pattern
-- as student_ads / campus_suggestions etc.

create table if not exists public.budget_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  target_amount  numeric(10,2) not null check (target_amount > 0),
  current_amount numeric(10,2) not null default 0 check (current_amount >= 0),
  deadline       date,
  icon           text not null default 'Target',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.budget_goals enable row level security;

create policy "read_own_budget_goals" on public.budget_goals
  for select to authenticated using (auth.uid() = user_id);
create policy "insert_own_budget_goals" on public.budget_goals
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_budget_goals" on public.budget_goals
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_budget_goals" on public.budget_goals
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.touch_budget_goal_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists budget_goals_touch_updated_at on public.budget_goals;
create trigger budget_goals_touch_updated_at
  before update on public.budget_goals
  for each row execute function public.touch_budget_goal_updated_at();

-- Atomic "add to goal" — increments current_amount server-side so two rapid
-- contributions (or a flaky retry) can never clobber each other the way a
-- client-side read-modify-write would. Returns the updated row.
create or replace function public.add_to_budget_goal(p_goal_id uuid, p_amount numeric)
returns public.budget_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.budget_goals;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  update public.budget_goals
  set current_amount = current_amount + p_amount
  where id = p_goal_id and user_id = auth.uid()
  returning * into updated;

  if updated.id is null then
    raise exception 'Goal not found';
  end if;

  return updated;
end;
$$;

revoke all on function public.add_to_budget_goal(uuid, numeric) from public;
grant execute on function public.add_to_budget_goal(uuid, numeric) to authenticated;
