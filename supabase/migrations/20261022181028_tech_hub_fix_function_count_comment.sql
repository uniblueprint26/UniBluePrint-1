-- Correction: the migration header comment on tech_hub_schema said "22
-- real deployed functions" -- list_edge_functions actually returned 23
-- (and 23 rows were seeded into tech_edge_function_snapshots, correctly).
-- Fixing the table comment's count to match reality exactly.
comment on table public.tech_edge_function_snapshots is
  'Point-in-time snapshot of every deployed Supabase Edge Function (list_edge_functions via Management API, 23 real functions as of 2026-10-22), one row per function per captured_at batch. Real data, not live-polled -- same Management-API-only reasoning as tech_advisor_snapshots. Per-function invocation/error rates are deliberately NOT included here -- query_logs (function_edge_logs) held only 2 real log lines total at capture time, nowhere near enough real volume for a meaningful rate; TechDashboardPage shows that as an honest tbd rather than fabricating one. get_tech_edge_function_snapshot() always reads the latest batch.';
