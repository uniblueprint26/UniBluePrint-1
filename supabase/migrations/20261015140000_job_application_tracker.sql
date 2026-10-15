-- Foundation Blueprint: personal application/deadline tracker.
--
-- Placed beside My Outputs (not a new top-level nav section — see
-- app/src/screens/foundation/ApplicationTrackerScreen.jsx). The gap this
-- closes versus a generic to-do-list tracker (the competitive research
-- behind this feature): a tracked application can point at the exact
-- submission — and therefore the exact CV/cover-letter/document version —
-- the student actually used for it, via submission_id. This is purely the
-- student's own manual record of applications made elsewhere; there is no
-- external job-board/API integration here.
--
-- stage is a plain text + check constraint, not an enum, matching this
-- codebase's own documented preference (see submissions.stage's own history
-- and e.g. 20260726110000_handler_pipeline.sql's submissions_tier_check) —
-- enums need `ALTER TYPE ... ADD VALUE`, which cannot run inside the same
-- transaction as other DDL and is awkward to alter later; a check
-- constraint is a plain `ALTER TABLE` either way.

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text not null,
  role_title text not null,
  stage text not null default 'applied' check (stage in ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  deadline date,
  applied_at date not null default current_date,
  -- Which Foundation Blueprint submission (if any) the student used for this
  -- application — the actual CV/cover-letter/etc. version, not a duplicate
  -- copy of its content. on delete set null: if a submission row is ever
  -- removed, the application itself is still a real record worth keeping.
  submission_id uuid references public.submissions(id) on delete set null,
  notes text,
  -- Set once handle_application_deadline_reminders() has notified the
  -- student about this application's deadline, so the daily job fires
  -- exactly once per application rather than re-notifying every run.
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.job_applications.submission_id is
  'The Foundation Blueprint submission (CV, cover letter, etc.) this application actually used, if any. References public.submissions, never a duplicate of its content.';
comment on column public.job_applications.reminder_sent_at is
  'When the deadline-reminder cron job last notified the student about this application. Null means no reminder has fired yet; once set, the job skips this row until the deadline (or reminder_sent_at) changes.';

alter table public.job_applications enable row level security;

-- Single "manage your own rows" policy, same shape as evidence_bank_stories
-- (20260724120000_application_form_assistance.sql) — this table has no
-- Handler/Operations-visible content, it's purely personal tracking.
-- The WITH CHECK's submission_id clause stops a student from pointing a
-- tracked application at a submission that isn't their own (they couldn't
-- read its document content either way, thanks to that table's own RLS,
-- but there's no reason to let the row exist at all).
-- auth.uid() wrapped in (select ...) in both clauses — the rewrite the
-- planner needs to evaluate it once per query instead of once per row (the
-- Supabase linter's rls_auth_uid_call check); same pattern
-- 20261015120000_referral_tracking.sql already uses.
create policy "Users can manage own job applications" on public.job_applications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      submission_id is null
      or exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = (select auth.uid()))
    )
  );

create index job_applications_user_id_idx on public.job_applications (user_id);
-- Backs the tracker's own "soonest deadline first" list query and the
-- reminder cron's scan below.
create index job_applications_deadline_idx on public.job_applications (deadline) where deadline is not null;
-- Covers the submission_id foreign key itself (the linter's "foreign key
-- without a covering index" check) — separate from the two indexes above,
-- which serve the tracker's own list/reminder queries, not this FK.
create index job_applications_submission_id_idx on public.job_applications (submission_id) where submission_id is not null;

create or replace function public.touch_job_applications_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_touch_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.touch_job_applications_updated_at();

-- ─── Deadline reminder (daily, pg_cron) ──────────────────────────────────────
-- N = 3 days: close enough to the deadline to be genuinely actionable (not a
-- week-out notice the student will forget about) while leaving a realistic
-- window to actually still submit, mirroring the "last few days" urgency
-- framing handle_deadline_escalation() already uses for internal Handler
-- deadlines elsewhere in this app. Fires once per application — reminder_sent_at
-- is stamped the moment the notification is created, so a daily run never
-- re-notifies the same application, even though its deadline stays inside the
-- 3-day window on every later run until it passes.
create or replace function public.handle_application_deadline_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  -- Same convention as generate_weekly_blueprint_reports() /
  -- handle_deadline_escalation(): pg_cron carries no JWT at all
  -- (auth.uid() is null) and must always be able to run; only block a call
  -- that DOES carry an authenticated identity that isn't Operations, so a
  -- manual test run stays possible without opening this up to every user.
  if auth.uid() is not null and not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can run this manually';
  end if;

  for r in
    select id, user_id, company_name, role_title, deadline
    from public.job_applications
    where deadline is not null
      and deadline >= current_date
      and deadline <= current_date + 3
      and reminder_sent_at is null
      and stage not in ('rejected', 'withdrawn')
  loop
    perform public.create_notification(
      r.user_id, 'job_application_reminder', 'Application deadline coming up',
      format('%s at %s is due %s.', r.role_title, r.company_name, to_char(r.deadline, 'Dy DD Mon')),
      'job_application', r.id
    );

    update public.job_applications set reminder_sent_at = now() where id = r.id;
  end loop;
end;
$$;

grant execute on function public.handle_application_deadline_reminders() to authenticated;

create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'job-application-deadline-reminders') then
    perform cron.schedule('job-application-deadline-reminders', '0 8 * * *', 'select public.handle_application_deadline_reminders();');
  end if;
end $$;
