-- Marketing Hub (Studio Phase 5) -- new role. Postgres won't let a brand-new
-- enum value be used in the same transaction that adds it (SQLSTATE 55P04)
-- -- the same constraint hit by 20260828170000_finance_role_enum.sql
-- ('finance'), 20261022173925_legal_role_enum.sql ('legal'),
-- 20261022180654_tech_role_enum.sql ('tech') and
-- 20261022190000_outreach_role_enum.sql ('outreach') -- so this lands and
-- commits on its own first, before the Marketing Hub schema migration uses it.
alter type public.app_role add value if not exists 'marketing';
