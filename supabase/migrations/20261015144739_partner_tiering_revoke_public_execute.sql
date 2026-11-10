-- Tighten execute privileges on the partner-tiering functions.
--
-- Postgres grants EXECUTE to PUBLIC by default on CREATE FUNCTION, and
-- neither 20261012104351_partner_tiering_framework nor this migration's own
-- earlier statement explicitly revoked it -- so anon ended up with
-- technically-callable access to every one of these RPCs (confirmed via
-- get_advisors: anon_security_definer_function_executable /
-- authenticated_security_definer_function_executable both flagged them).
-- In practice this was never exploitable -- every function does its own
-- auth.uid()/has_role() check and auth.uid() is null for anon, so an
-- unauthenticated caller got nothing back regardless -- but the task here
-- is explicitly about the rigor of this system's access control, so this
-- removes the unnecessary PUBLIC grant rather than relying solely on the
-- internal check. authenticated keeps exactly the access it already had.

revoke execute on function public.is_finance_or_founder(uuid) from public;
revoke execute on function public.is_partner_tier_admin(uuid) from public;
revoke execute on function public.get_my_tier_status() from public;
revoke execute on function public.set_partner_tier(text, uuid, text) from public;
revoke execute on function public.set_payment_option(text, uuid, text) from public;
revoke execute on function public.set_founding_badge(text, uuid, boolean) from public;
revoke execute on function public.record_negotiated_rate(text, uuid, numeric, text) from public;
revoke execute on function public.get_negotiation_history(text, uuid) from public;
revoke execute on function public.get_partner_tier_admin_list() from public;
revoke execute on function public.get_tier_change_log(text, uuid) from public;

-- Re-assert the authenticated grants explicitly (idempotent -- they were
-- already present) so this migration is self-contained and not dependent
-- on reading the two earlier ones to know the end state is correct.
grant execute on function public.is_finance_or_founder(uuid) to authenticated;
grant execute on function public.is_partner_tier_admin(uuid) to authenticated;
grant execute on function public.get_my_tier_status() to authenticated;
grant execute on function public.set_partner_tier(text, uuid, text) to authenticated;
grant execute on function public.set_payment_option(text, uuid, text) to authenticated;
grant execute on function public.set_founding_badge(text, uuid, boolean) to authenticated;
grant execute on function public.record_negotiated_rate(text, uuid, numeric, text) to authenticated;
grant execute on function public.get_negotiation_history(text, uuid) to authenticated;
grant execute on function public.get_partner_tier_admin_list() to authenticated;
grant execute on function public.get_tier_change_log(text, uuid) to authenticated;
