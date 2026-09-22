-- Self-service GDPR export and deletion.
--
-- Until now, gdpr_requests (20260811090000, widened 20260824130000) was
-- request INTAKE only: a user files a request, Operations/Founder action it
-- by hand later. That satisfies GDPR's 30-day response window but is not
-- "self-service", and Apple Guideline 5.1.1(v) specifically requires an
-- iOS app with account creation to let a user actually delete their own
-- account from within the app, not just submit a request a human fulfills
-- later. This migration adds the two pieces the app/website need to do
-- both immediately:
--
-- 1. export_my_gdpr_data() — a SECURITY DEFINER RPC any authenticated user
--    can call to get back every row across every public-schema table that
--    has a user_id column, scoped to their own auth.uid(). Generic by
--    design (discovers tables via information_schema at call time) so it
--    stays correct as the schema grows, instead of a hand-maintained table
--    list that inevitably drifts out of date.
--
-- 2. gdpr_deletion_log — account deletion itself must still go through the
--    Auth Admin API (auth.admin.deleteUser), which only a service-role
--    caller can invoke, hence the paired delete-account Edge Function
--    (supabase/functions/delete-account). Every personal-data table already
--    has `user_id ... references auth.users(id) on delete cascade` (see
--    20260410140346 and friends), so deleting the auth.users row cascades
--    everywhere automatically, INCLUDING gdpr_requests itself (its own
--    user_id FK is also on delete cascade) — meaning a request row logged
--    right before deletion would vanish along with everything else, leaving
--    no record deletion ever happened. gdpr_deletion_log exists purely to
--    survive that cascade: deleted_user_id is a plain uuid, not a foreign
--    key, specifically so the row outlives the auth.users row it describes.

create or replace function public.export_my_gdpr_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result   jsonb := '{}'::jsonb;
  tbl      record;
  tbl_data jsonb;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated';
  end if;

  for tbl in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'user_id'
      and t.table_type = 'BASE TABLE'
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(src)), ''[]''::jsonb) from public.%I src where user_id = $1',
      tbl.table_name
    ) into tbl_data using auth.uid();

    if tbl_data is distinct from '[]'::jsonb then
      result := result || jsonb_build_object(tbl.table_name, tbl_data);
    end if;
  end loop;

  return result;
end;
$$;

comment on function public.export_my_gdpr_data() is
  'GDPR Art. 20 self-service export. SECURITY DEFINER so it can read across every table with a user_id column, but only ever filters by auth.uid() from the caller''s own verified session — never a client-supplied id, so it cannot be used to read another user''s data.';

revoke all on function public.export_my_gdpr_data() from public;
grant execute on function public.export_my_gdpr_data() to authenticated;

create table if not exists public.gdpr_deletion_log (
  id              uuid primary key default gen_random_uuid(),
  deleted_user_id uuid not null,
  email           text,
  deleted_at      timestamptz not null default now(),
  method          text not null default 'self_service' check (method in ('self_service', 'manual'))
);

comment on column public.gdpr_deletion_log.deleted_user_id is
  'Deliberately not a foreign key to auth.users(id): that row is gone by the time this is read back, and a cascading FK would delete this log entry along with it.';

alter table public.gdpr_deletion_log enable row level security;

create policy "operations_founder_read_gdpr_deletion_log" on public.gdpr_deletion_log
  for select to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

-- No insert/update/delete policy for any role: the delete-account Edge
-- Function writes here using the service-role key, which bypasses RLS.
