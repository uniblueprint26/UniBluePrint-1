-- The prior migration's "revoke ... from public" was a no-op: Supabase
-- projects carry a schema-level default privilege
-- (ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO
-- anon, authenticated) that grants EXECUTE to anon/authenticated directly
-- on every new function, not via the PUBLIC pseudo-role -- confirmed via
-- pg_proc.proacl showing an explicit anon=X entry even after that revoke.
-- This is a project-wide convention affecting ~100+ pre-existing functions
-- (per get_advisors), not something to unwind codebase-wide from here, but
-- every partner-tiering RPC is meant for authenticated users only (an
-- actual partner/coach/admin) -- none of them has any legitimate anon
-- caller -- so this explicitly revokes the unnecessary anon grant for just
-- these ten, on top of (not instead of) the internal auth.uid()/has_role()
-- checks each one already does.

revoke execute on function public.is_finance_or_founder(uuid) from anon;
revoke execute on function public.is_partner_tier_admin(uuid) from anon;
revoke execute on function public.get_my_tier_status() from anon;
revoke execute on function public.set_partner_tier(text, uuid, text) from anon;
revoke execute on function public.set_payment_option(text, uuid, text) from anon;
revoke execute on function public.set_founding_badge(text, uuid, boolean) from anon;
revoke execute on function public.record_negotiated_rate(text, uuid, numeric, text) from anon;
revoke execute on function public.get_negotiation_history(text, uuid) from anon;
revoke execute on function public.get_partner_tier_admin_list() from anon;
revoke execute on function public.get_tier_change_log(text, uuid) from anon;
