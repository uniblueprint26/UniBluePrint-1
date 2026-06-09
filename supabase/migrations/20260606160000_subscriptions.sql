-- Pro subscriptions. Webhook-ready: users can only READ their own row; writes happen via
-- SECURITY DEFINER RPCs (dev placeholder) and, later, a Stripe webhook using the service role.
--
-- !!! dev_activate_subscription() is a TEMPORARY self-grant for testing without real payment.
--     REMOVE it and let the Stripe webhook own subscription state before launch. !!!

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tier text not null check (tier in ('pro_monthly','pro_annual')),
  status text not null default 'active' check (status in ('active','canceled')),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);
-- No user insert/update/delete policy by design (writes via RPC / webhook only).

-- DEV ONLY — simulate a successful subscription for the caller. REMOVE before launch.
create or replace function public.dev_activate_subscription(p_tier text)
returns void language plpgsql security definer set search_path = public as $$
declare v_end timestamptz;
begin
  if p_tier not in ('pro_monthly','pro_annual') then
    raise exception 'invalid tier %', p_tier;
  end if;
  v_end := now() + (case when p_tier = 'pro_annual' then interval '365 days' else interval '30 days' end);
  insert into public.subscriptions (user_id, tier, status, current_period_end, updated_at)
  values (auth.uid(), p_tier, 'active', v_end, now())
  on conflict (user_id) do update
    set tier = excluded.tier, status = 'active',
        current_period_end = excluded.current_period_end, updated_at = now();
end; $$;

create or replace function public.cancel_subscription()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.subscriptions set status = 'canceled', updated_at = now() where user_id = auth.uid();
end; $$;

grant execute on function public.dev_activate_subscription(text) to authenticated;
grant execute on function public.cancel_subscription() to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'subscriptions'
  ) then
    alter publication supabase_realtime add table public.subscriptions;
  end if;
end $$;
