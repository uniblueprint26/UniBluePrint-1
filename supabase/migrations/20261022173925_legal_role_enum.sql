-- Legal Hub (Studio Phase 2) -- new role. Postgres won't let a brand-new
-- enum value be used in the same transaction that adds it (SQLSTATE 55P04),
-- same constraint hit by 20260828170000_finance_role_enum.sql for
-- 'finance' -- so this lands and commits on its own first, before
-- 20261022150100_legal_hub.sql uses it.
alter type public.app_role add value if not exists 'legal';
