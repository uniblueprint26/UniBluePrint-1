-- Split out from the migration below: Postgres won't let a brand-new enum
-- value be used in the same transaction that adds it (SQLSTATE 55P04), so
-- the enum addition has to land and commit on its own first.
alter type public.app_role add value if not exists 'finance';
