-- Changes: drops the MCP test leftovers, table public._mcp_ddl_probe (empty, no dependents) and policy _mcp_probe_policy on public.ads (USING false, so it grants nothing). Destructive: yes, but both are empty test objects checked on 20 Nov 2026. Undo: create table public._mcp_ddl_probe (id integer); create policy _mcp_probe_policy on public.ads for select using (false);
--
-- R27: left behind by a tooling probe. The table had 0 rows and no columns
-- other than id integer. The ads policy is a SELECT policy with USING (false),
-- so removing it changes no access.

drop policy if exists _mcp_probe_policy on public.ads;
drop table if exists public._mcp_ddl_probe;
