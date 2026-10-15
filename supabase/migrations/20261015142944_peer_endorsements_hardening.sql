-- Addresses three advisor findings against peer_endorsements/
-- peer_endorsement_counts (20261015140000_directory_credentials_endorsements),
-- all via ALTER/CREATE OR REPLACE — never DROP, which hangs against this
-- project via the MCP execute_sql/apply_migration tools (see
-- public._mcp_ddl_probe's comment).
--
-- 1. peer_endorsement_counts was missing `security_invoker = true`, so
--    (per Postgres' legacy view-permission default) it would run with the
--    view OWNER's privileges for RLS purposes rather than the querying
--    user's -- the exact thing the original migration's own comment said
--    it deliberately was NOT ("Runs with the caller's own privileges (no
--    security definer)"). In practice this table's own RLS already lets
--    any authenticated user read every row (anyone_read_peer_endorsements
--    USING (true)), so nothing was actually over-exposed -- this just makes
--    the view's real behaviour match what it always claimed to be.
create or replace view public.peer_endorsement_counts
  with (security_invoker = true)
  as
  select endorsed_id, tag, count(*)::integer as endorsement_count
  from public.peer_endorsements
  group by endorsed_id, tag;

comment on view public.peer_endorsement_counts is
  'Per-(endorsed user, tag) endorsement counts for the full profile view. Cosmetic counts only — no aggregate score, ranking, or weighting across tags. security_invoker=true: runs with the querying user''s own RLS, matching peer_endorsements'' anyone_read_peer_endorsements policy exactly rather than the view owner''s.';

-- 2. peer_endorsements_endorsed_id_fkey had no covering index -- exactly
--    the lookup StudentProfileScreen.jsx's Endorsements section does on
--    every profile view (peer_endorsement_counts / peer_endorsements
--    filtered by endorsed_id).
create index if not exists peer_endorsements_endorsed_id_idx
  on public.peer_endorsements (endorsed_id);

-- 3. Both policies called auth.uid() directly, which Postgres re-evaluates
--    per row rather than once per statement -- wrapping it in a scalar
--    subselect lets the planner evaluate it once. ALTER POLICY in place,
--    not drop + recreate.
alter policy "users_insert_own_peer_endorsements" on public.peer_endorsements
  with check ((select auth.uid()) = endorser_id);

alter policy "users_delete_own_peer_endorsements" on public.peer_endorsements
  using ((select auth.uid()) = endorser_id);
