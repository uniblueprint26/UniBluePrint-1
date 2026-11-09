-- Rate limiting and cost tracking for the Foundation Blueprint generator functions
-- (generate-cv, generate-cover-letter, etc.) — confirmed via direct coordination with
-- Tayyab's session as a real, currently-absent gap: the generator functions call
-- Anthropic's API with no cap on how often a user can call them and no aggregate spend
-- limit at all. One row per successful generation call, used for two different checks:
--   1. Per-user: how many calls has this person made recently (abuse/bug protection).
--   2. Platform-wide: how much has today cost so far (runaway-spend protection).

create table if not exists public.generation_usage (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  function_name         text not null,
  input_tokens          integer not null,
  output_tokens         integer not null,
  estimated_cost_cents  integer not null,
  created_at            timestamptz not null default now()
);
alter table public.generation_usage enable row level security;

create index if not exists generation_usage_user_created_idx
  on public.generation_usage (user_id, created_at);
create index if not exists generation_usage_created_idx
  on public.generation_usage (created_at);

-- Written by the Edge Functions themselves, running as the calling user (see
-- _shared/supabase.ts's requireUser pattern — anon key + forwarded JWT, not
-- service-role), so this needs a normal "own row" insert policy like every other
-- user-scoped table in this schema.
create policy "users_insert_own_generation_usage" on public.generation_usage
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users_read_own_generation_usage" on public.generation_usage
  for select to authenticated using (auth.uid() = user_id);
create policy "operations_founder_read_all_generation_usage" on public.generation_usage
  for select to authenticated using (
    public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder')
  );

-- Per-user count in a rolling window — callable by the user themselves (their own RLS-
-- visible rows already cover this), exposed as a function so the Edge Function doesn't
-- need to hand-roll the same query in ten places.
create or replace function public.count_user_generations_since(_user_id uuid, _since timestamptz)
returns integer
language sql
security invoker
stable
set search_path = public
as $$
  select count(*)::integer
  from public.generation_usage
  where user_id = _user_id and created_at >= _since;
$$;

-- Platform-wide total spend since a given time — deliberately security definer, same
-- "revoke the view, gate with a function" pattern used elsewhere in this schema for
-- aggregate cross-user data: a regular user's own RLS grant only lets them see their
-- own rows, but the platform-wide cost cap needs a true sum across everyone, and no
-- individual user should be able to read UniBlueprint's aggregate spend by calling this
-- with someone else's id — this function takes no user-scoped input at all, only time.
create or replace function public.total_generation_cost_cents_since(_since timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _total integer;
begin
  select coalesce(sum(estimated_cost_cents), 0)::integer into _total
  from public.generation_usage
  where created_at >= _since;
  return _total;
end;
$$;
revoke all on function public.total_generation_cost_cents_since(timestamptz) from public, anon;
grant execute on function public.total_generation_cost_cents_since(timestamptz) to authenticated;

comment on table public.generation_usage is
  'One row per successful AI generation call. Backs both per-user rate limiting and the platform-wide daily cost cap enforced in supabase/functions/_shared/rateLimit.ts. Real spend tracking, not an estimate to ignore — check this table before raising either limit.';
