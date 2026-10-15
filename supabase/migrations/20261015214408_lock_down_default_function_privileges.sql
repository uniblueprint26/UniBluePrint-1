-- Root-cause fix for the recurring "new SECURITY DEFINER function is anon-callable
-- by default" problem seen across many of today's migrations.
--
-- pg_default_acl showed that the `postgres` role (the role every migration in this
-- project runs as) has a schema-level default ACL on `public` that grants EXECUTE
-- on every NEWLY CREATED function to both `anon` and `authenticated`:
--
--   defaclrole=postgres, schema=public, objtype=f (functions)
--   {postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres}
--
-- That is why nearly every new function this project adds needs an explicit
-- `revoke execute ... from anon` (or has to be followed by a narrow, explicit
-- `grant execute ... to authenticated`) to avoid being silently callable by
-- unauthenticated/anon clients.
--
-- This migration flips the default going forward: new functions created by the
-- `postgres` role in the `public` schema will no longer automatically grant
-- EXECUTE to `anon` or `authenticated`. Callable functions must explicitly
-- `grant execute on function ... to authenticated` (and/or `anon`), which is
-- already the convention most migrations in this repo follow.
--
-- IMPORTANT: ALTER DEFAULT PRIVILEGES only affects objects created AFTER this
-- statement runs. It does NOT retroactively change the grants on any function
-- that already exists today. A separate audit (done alongside this migration)
-- confirmed no function currently deployed without an explicit grant is called
-- directly by the frontend (via supabase.rpc) or otherwise needs anon/authenticated
-- EXECUTE access that it isn't already explicitly granted elsewhere.
--
-- Note: there is a second default ACL entry scoped to `defaclrole = supabase_admin`
-- in the `public` schema with the same anon/authenticated EXECUTE default. That role
-- is Supabase's own internal/platform role (not the role our migrations run as, which
-- is `postgres`), so it is intentionally left untouched here -- changing it is out of
-- scope for this project's own migration-created functions and carries platform risk.

alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke execute on functions from authenticated;

-- Harmless, permanently-locked-down proof function: created with NO explicit grant
-- statement, to demonstrate the new default actually takes effect (i.e. it is NOT
-- anon/authenticated-callable). It does nothing (returns true) and nothing can call
-- it except postgres/service_role. Left in place intentionally -- do not try to DROP
-- it (DROP FUNCTION has repeatedly hung via MCP tooling in this project); it is inert
-- and safe to ignore.
create function public._default_privilege_test()
returns boolean
language sql
stable
as $$
  select true;
$$;
