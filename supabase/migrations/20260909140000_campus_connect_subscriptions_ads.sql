-- Phase 4, Campus Connect: Shared Subscriptions + Student Ads

create table if not exists public.shared_subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  poster_name         text,
  service_name        text not null,
  spots_available     smallint not null default 1 check (spots_available between 1 and 20),
  cost_per_person     numeric(8,2) not null,
  contact_method      text not null,
  created_at          timestamptz not null default now()
);
alter table public.shared_subscriptions enable row level security;

create policy "read_shared_subscriptions" on public.shared_subscriptions
  for select to authenticated using (true);
create policy "insert_own_shared_subscription" on public.shared_subscriptions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_shared_subscription" on public.shared_subscriptions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_shared_subscription" on public.shared_subscriptions
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shared_subscriptions') then
    alter publication supabase_realtime add table public.shared_subscriptions;
  end if;
end $$;

-- Marketplace-style: no auto-expiry, status flips to 'sold' by the poster
-- manually (spec: "no auto-expiry, poster manually marks sold/removes").
create table if not exists public.student_ads (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  poster_name      text,
  ad_type          text not null check (ad_type in ('Service offered', 'Item for sale', 'Item wanted', 'Tutoring', 'Other')),
  title            text not null,
  description      text not null,
  price            numeric(8,2),
  contact_method   text not null,
  photo_url        text,
  status           text not null default 'active' check (status in ('active', 'sold')),
  created_at       timestamptz not null default now()
);
alter table public.student_ads enable row level security;

create policy "read_student_ads" on public.student_ads
  for select to authenticated using (true);
create policy "insert_own_student_ad" on public.student_ads
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_student_ad" on public.student_ads
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_student_ad" on public.student_ads
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'student_ads') then
    alter publication supabase_realtime add table public.student_ads;
  end if;
end $$;
