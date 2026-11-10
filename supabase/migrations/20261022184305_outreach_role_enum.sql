-- Outreach Hub (Studio Phase 4) -- new role. Postgres won't let a brand-new
-- enum value be used in the same transaction that adds it (SQLSTATE 55P04)
-- -- the same constraint hit by 20260828170000_finance_role_enum.sql
-- ('finance'), 20261022173925_legal_role_enum.sql ('legal') and
-- 20261022180654_tech_role_enum.sql ('tech') -- so this lands and commits on
-- its own first, before the Outreach Hub schema migration uses it.
alter type public.app_role add value if not exists 'outreach';
