-- Performance advisor fix: auth_rls_initplan.
-- auth.uid()/auth.jwt()/auth.role() are STABLE functions, so wrapping them
-- as (select auth.uid()) does not change policy semantics -- it just lets
-- Postgres evaluate them once per query (initPlan) instead of once per row.
-- This mechanically rewrites every public-schema policy whose qual/with_check
-- calls one of these functions unwrapped, preserving policy name, table,
-- command and role list untouched -- only the expression text changes.

do $$
declare
  r record;
  stmt text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and qual ~ 'auth\.(uid|jwt|role)\(\)' and qual !~ '\(select auth\.(uid|jwt|role)\(\)\)')
        or
        (with_check is not null and with_check ~ 'auth\.(uid|jwt|role)\(\)' and with_check !~ '\(select auth\.(uid|jwt|role)\(\)\)')
      )
  loop
    stmt := format('ALTER POLICY %I ON public.%I ', r.policyname, r.tablename);
    if r.qual is not null then
      stmt := stmt || format('USING (%s) ', regexp_replace(r.qual, 'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g'));
    end if;
    if r.with_check is not null then
      stmt := stmt || format('WITH CHECK (%s)', regexp_replace(r.with_check, 'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g'));
    end if;
    execute stmt;
  end loop;
end $$;
