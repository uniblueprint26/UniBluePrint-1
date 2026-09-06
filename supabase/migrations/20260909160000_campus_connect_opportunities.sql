-- Phase 4, Campus Connect: Opportunities board

create table if not exists public.opportunities (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  poster_name         text,
  opportunity_type    text not null check (opportunity_type in ('Internship', 'Part-time job', 'Volunteer', 'Competition', 'Grant', 'Other')),
  title               text not null,
  organisation        text not null,
  description         text not null,
  link                text,
  deadline            date,
  created_at          timestamptz not null default now()
);
alter table public.opportunities enable row level security;

create policy "read_opportunities" on public.opportunities
  for select to authenticated using (true);
create policy "insert_own_opportunity" on public.opportunities
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_opportunity" on public.opportunities
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_opportunity" on public.opportunities
  for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'opportunities') then
    alter publication supabase_realtime add table public.opportunities;
  end if;
end $$;
