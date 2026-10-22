-- Fix: get_tech_advisor_snapshot()/get_tech_edge_function_snapshot() both
-- declared a RETURNS TABLE OUT parameter named `captured_at`, which shadowed
-- the plain `captured_at` column reference inside `select max(captured_at)
-- into v_latest from ...` -- PL/pgSQL error 42702 "column reference
-- captured_at is ambiguous", caught live during QA sign-in testing (same bug
-- class Finance Hub hit with an ambiguous `id` in
-- 20261022171436_fix_ambiguous_id_in_coach_payout_queue_functions.sql).
-- Fixed by qualifying the aggregate with the table alias, same signatures,
-- no caller changes.

create or replace function public.get_tech_advisor_snapshot()
returns table (
  captured_at timestamptz, category text, lint_name text, title text,
  level text, finding_count integer, remediation_url text
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_latest timestamptz;
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  select max(s.captured_at) into v_latest from public.tech_advisor_snapshots s;

  return query
  select s.captured_at, s.category, s.lint_name, s.title, s.level, s.finding_count, s.remediation_url
  from public.tech_advisor_snapshots s
  where s.captured_at = v_latest
  order by s.category, case s.level when 'ERROR' then 0 when 'WARN' then 1 else 2 end, s.finding_count desc;
end; $$;

create or replace function public.get_tech_edge_function_snapshot()
returns table (
  captured_at timestamptz, slug text, display_name text, status text,
  version integer, verify_jwt boolean, deployed_at timestamptz, function_updated_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_latest timestamptz;
begin
  if not public._is_tech_admin() then
    raise exception 'not authorized';
  end if;

  select max(s.captured_at) into v_latest from public.tech_edge_function_snapshots s;

  return query
  select s.captured_at, s.slug, s.display_name, s.status, s.version, s.verify_jwt, s.deployed_at, s.function_updated_at
  from public.tech_edge_function_snapshots s
  where s.captured_at = v_latest
  order by s.slug;
end; $$;
