-- Follow-up to 20261015220000_lock_down_default_function_privileges.sql.
--
-- IMPORTANT FINDING from live verification (via pg_default_acl, pg_proc.proacl,
-- aclexplode, and has_function_privilege, tested repeatedly and sequentially on
-- project ozpeofkvnpikhopkgcxc): revoking EXECUTE from `anon`/`authenticated` in
-- the default privileges (the previous migration) DOES correctly stop those two
-- roles from getting their own direct default grant on newly created functions
-- -- confirmed via fresh test functions showing no anon/authenticated ACL entries.
--
-- However, every function newly created in `public` in this project -- before
-- and after that fix -- also receives an EXECUTE grant to the PUBLIC pseudo-role
-- (aclexplode shows grantee = 0) baked in at creation time, and PUBLIC privilege
-- applies to every role including anon/authenticated. This was verified on three
-- separate freshly created throwaway functions (_default_privilege_test(),
-- _default_privilege_test2(), _default_privilege_test3()), including after
-- explicitly running `alter default privileges in schema public revoke execute
-- on functions from public;` beforehand -- which Supabase's own docs recommend
-- as the fix, but which did NOT stop PUBLIC from being granted on a function
-- created immediately afterward in this project. pg_default_acl itself never
-- carries a PUBLIC row to begin with (there's nothing for that REVOKE to remove),
-- yet pg_proc.proacl on the new function still contains it.
--
-- Net effect: the previous migration's anon/authenticated default-privilege
-- revoke is real and in effect, but does NOT by itself close the full gap --
-- new SECURITY DEFINER functions remain anon/authenticated-callable via the
-- PUBLIC grant unless each migration also explicitly revokes execute from
-- `public` (and/or anon/authenticated directly) on the function after creating
-- it, which is the existing, already-necessary convention in this repo (see
-- e.g. 20261015142957_deal_redemption_code_anon_lockdown.sql). This is flagged
-- in the hand-off report; a durable database-level fix (e.g. an event trigger
-- that revokes on every CREATE FUNCTION in public) was intentionally NOT added
-- here, since it is a bigger, separately-risked change beyond what was asked.
--
-- This statement is still included -- it is harmless, matches Supabase's own
-- documented guidance, and is the correct declarative intent -- even though it
-- was empirically shown not to suppress the PUBLIC grant on new functions here.
alter default privileges in schema public revoke execute on functions from public;

-- The two additional throwaway proof functions created live while isolating the
-- PUBLIC-grant behavior above (beyond the first one in the previous migration).
-- All three are inert (return true, no side effects, SECURITY INVOKER) and are
-- intentionally left in place rather than dropped (DROP FUNCTION has repeatedly
-- hung via MCP tooling in this project per prior agents' notes). `create or
-- replace` keeps this migration safe to replay against a fresh database.
create or replace function public._default_privilege_test2()
returns boolean
language sql
stable
as $$
  select true;
$$;

create or replace function public._default_privilege_test3()
returns boolean
language sql
stable
as $$
  select true;
$$;

-- Neutralize all three test functions directly (a DIRECT revoke on an existing
-- function reliably works, unlike the default-privilege statement above) and
-- harden their search_path (flagged by get_advisors as
-- function_search_path_mutable).
revoke execute on function public._default_privilege_test() from public, anon, authenticated;
revoke execute on function public._default_privilege_test2() from public, anon, authenticated;
revoke execute on function public._default_privilege_test3() from public, anon, authenticated;

alter function public._default_privilege_test() set search_path = '';
alter function public._default_privilege_test2() set search_path = '';
alter function public._default_privilege_test3() set search_path = '';
