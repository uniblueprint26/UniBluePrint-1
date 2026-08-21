# Foundation Blueprint pipeline — verification harness

Executable checks for the Handler pipeline: escalation, handler scoring, the
acknowledgement step, and the row-level security around all of it.

These are assertions, not a smoke test. Every file raises an exception the
moment something is wrong, so a run that finishes without error is a run where
everything passed.

## Safety

**Every file is wrapped in `begin … rollback`.** Fixture users, submissions and
tickets are created, asserted against, and thrown away. Nothing survives the
run, so these are safe to execute against a live project — though a staging
project is still the sensible place to start.

The fixtures use fixed UUIDs in the `00000000-0000-0000-0000-0000000000xx`
range so they can never collide with real accounts.

## Running them

From the Supabase SQL editor, paste one file at a time. From a terminal:

```bash
for f in supabase/verify/0*.sql; do
  echo "── $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || echo "FAILED: $f"
done
```

Each file is independent and creates its own fixtures — run them in any order,
or on their own.

Expect a stream of `PASS …` notices. Any `FAIL` aborts that file with a
non-zero exit.

## What each file covers

| File | Covers |
|---|---|
| `01_escalation_thresholds.sql` | 75% / 90% warnings and 100% auto-escalation fire at the right elapsed fraction; tickets already escalated or already delivered are left alone |
| `02_deduplication.sql` | Repeated cron runs never duplicate a warning, an escalation, or the premium unclaimed notice; the stale-queue alert rate-limits; the pg_cron registration block stays at one job per name |
| `03_handler_scoring.sql` | The weekly score formula against hand-computed values; quality reads real review data and is 0 (not a placeholder) when there are none; acknowledgement rate measures notification→claim and is NULL when a handler was never notified |
| `04_rls_student.sql` | A student reads **zero** rows from every escalation and performance table, while still reading their own submissions — proving the zeros are scoping, not blanket denial |
| `05_rls_handler.sql` | A handler reads their own escalations, notifications and snapshots, and none belonging to another handler |
| `06_rls_operations.sql` | Operations reads everything, and the Operations-only RPCs return rows for Operations and none for a handler |
| `07_auth_guard.sql` | The three-way guard on the scheduled functions: pg_cron (no JWT) runs, an authenticated non-Operations caller is blocked, Operations is allowed |
| `08_operations_queue_security.sql` | `operations_queue` is not readable by `anon` or `authenticated` directly; it is reachable only through `fetch_operations_queue()`, and `list_active_handlers()` exposes no personal data |

## A note on pg_cron

`handle_deadline_escalation()` and `generate_handler_snapshots()` are plain SQL
functions registered with pg_cron — not Edge Functions, so there is nothing for
`supabase functions deploy` to publish. These tests call them directly, which is
exactly what the scheduled job does.

What they do **not** cover is whether pg_cron is actually ticking. Check that
separately:

```sql
select jobname, schedule, active from cron.job;
select jobname, status, start_time, return_message
  from cron.job_run_details order by start_time desc limit 10;
```
