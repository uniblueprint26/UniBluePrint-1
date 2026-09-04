-- Adds the two roles this build introduces: 'business' (Lifestyle partner
-- portal login) and 'founder' (Founder Dashboard).
--
-- Kept in its own migration file, applied before 20260810120100. Postgres
-- forbids using a newly added enum value inside the same transaction it was
-- added in (ALTER TYPE ... ADD VALUE cannot be used and read back before a
-- commit boundary). Since Supabase applies each migration file as its own
-- transaction, splitting the enum addition into its own file is what makes
-- the next migration's has_role(..., 'founder') / has_role(..., 'business')
-- calls safe to run.
alter type public.app_role add value if not exists 'business';
alter type public.app_role add value if not exists 'founder';
