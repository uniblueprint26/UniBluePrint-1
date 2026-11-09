-- ═══════════════════════════════════════════════════════════════════════════
-- example_library: provenance, so authored exemplars can exist honestly
--
-- ── Why this column exists ─────────────────────────────────────────────────
-- source_name and source_url are NOT NULL on this table, and the rows are fed
-- to the model as "real, published, sourced" calibration material. Their
-- source_name/source_url pairs are ALSO surfaced to students in the UI, via
-- generated.benchmarked_against rendered by BenchmarkNote.
--
-- That makes it impossible to add platform-written exemplars under the existing
-- shape without inventing a citation for text nobody published — which would
-- put fabricated sources in front of students inside their own documents.
--
-- So provenance splits the two kinds:
--   'sourced'           — published externally; citable; safe to show a student
--   'platform_authored' — written by UniBlueprint as a calibration exemplar;
--                         useful to the model, never cited as a source
--
-- Existing rows are all externally sourced, so the column defaults to
-- 'sourced' and the current data is correct without a backfill.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.example_library
  add column if not exists provenance text not null default 'sourced'
    check (provenance in ('sourced', 'platform_authored'));

comment on column public.example_library.provenance is
  'sourced = externally published and citable to a student. platform_authored = written in-house as a model calibration exemplar; must never appear in benchmarked_against.';

create index if not exists example_library_industry_category_idx
  on public.example_library (industry, category);
