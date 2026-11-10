-- Founder platform stats — a real, unscoped read for the Founder Portal.
--
-- FounderPortalScreen currently queries profiles/user_roles/subscriptions
-- directly from the client. Every one of those tables is RLS-scoped to "your
-- own row" (profiles: "Users can read own profile", user_roles: "Users can
-- read own roles", subscriptions: "Users can read own subscription"), so the
-- founder's own client-side query only ever sees the founder's own rows:
-- Total Users always reads 1, Active Pro Members reads 0 or 1, and the role
-- pills show only the founder's own roles — never the real platform totals.
--
-- get_ops_queue_snapshot() (20260810120100_portals_operations_schema.sql)
-- already solves exactly this shape of problem for the Ops queue: a
-- SECURITY DEFINER function that checks the caller's role itself, then reads
-- past RLS on their behalf. This does the same for the Founder dashboard's
-- platform-wide metrics.
--
-- Returns a single row (empty result set if the caller isn't Founder/Ops,
-- same convention as get_ops_queue_snapshot's WHERE clause) with:
--   total_users         — real count of public.profiles
--   active_pro_members  — real count of public.subscriptions where status = 'active'
--   role_counts         — jsonb map of role -> count across every user_roles row,
--                          e.g. {"founder": 1, "operations": 2, "handler": 5}

create or replace function public.get_founder_platform_stats()
returns table(
  total_users        bigint,
  active_pro_members bigint,
  role_counts        jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.profiles)::bigint as total_users,
    (select count(*) from public.subscriptions where status = 'active')::bigint as active_pro_members,
    coalesce(
      (select jsonb_object_agg(role_counts.role, role_counts.cnt)
       from (
         select role::text as role, count(*) as cnt
         from public.user_roles
         group by role
       ) role_counts),
      '{}'::jsonb
    ) as role_counts
  where public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations')
$$;

grant execute on function public.get_founder_platform_stats() to authenticated;
