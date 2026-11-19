-- Reports on user generated content (Apple guideline 1.2, Google Play UGC
-- policy). Every place one person's content is shown to others has a Report
-- action in the app, and each report lands here.
--
-- Who can do what:
--   - A signed in person can insert a report as themselves (reporter_id must be
--     their own id), and can read back only their own reports.
--   - Nobody else's reports are readable by ordinary users.
--   - Operations and founder staff can read every report and change its status.
--
-- Operations and founder users get a notification for each new report, the same
-- way the older operations_flags flow does.
--
-- Not applied by the build. The founder applies it.

create table if not exists public.content_reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references auth.users(id) on delete cascade,
  content_type     text not null check (char_length(content_type) between 1 and 60),
  content_id       text not null check (char_length(content_id) between 1 and 200),
  reported_user_id uuid references auth.users(id) on delete set null,
  reason           text not null check (reason in ('Inappropriate content', 'Spam', 'Safety concern', 'Other')),
  status           text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at       timestamptz not null default now()
);

-- One report per person per item and reason, so a double tap does not double count.
create unique index if not exists content_reports_once_per_reason
  on public.content_reports (reporter_id, content_type, content_id, reason);

create index if not exists content_reports_status_created
  on public.content_reports (status, created_at desc);

create index if not exists content_reports_reported_user
  on public.content_reports (reported_user_id);

alter table public.content_reports enable row level security;

drop policy if exists "Users can report as themselves" on public.content_reports;
create policy "Users can report as themselves" on public.content_reports
  for insert to authenticated
  with check (auth.uid() = reporter_id and status = 'open');

drop policy if exists "Users can read their own reports" on public.content_reports;
create policy "Users can read their own reports" on public.content_reports
  for select to authenticated
  using (auth.uid() = reporter_id);

drop policy if exists "Operations can read all reports" on public.content_reports;
create policy "Operations can read all reports" on public.content_reports
  for select to authenticated
  using (public.has_role(auth.uid(), 'operations'));

drop policy if exists "Operations can update reports" on public.content_reports;
create policy "Operations can update reports" on public.content_reports
  for update to authenticated
  using (public.has_role(auth.uid(), 'operations'))
  with check (public.has_role(auth.uid(), 'operations'));

revoke all on public.content_reports from anon;
revoke all on public.content_reports from authenticated;
grant select, insert on public.content_reports to authenticated;
grant update (status) on public.content_reports to authenticated;

-- ── Tell operations and founder staff ───────────────────────────────────────
create or replace function public.notify_ops_on_content_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, category, title, message)
  select ur.user_id, 'content_flagged', 'Content reported',
         initcap(replace(new.content_type, '_', ' ')) || ' reported: ' || new.reason
  from public.user_roles ur
  where ur.role::text in ('operations', 'founder');
  return new;
end; $$;

drop trigger if exists trg_notify_ops_on_content_report on public.content_reports;
create trigger trg_notify_ops_on_content_report
  after insert on public.content_reports
  for each row execute function public.notify_ops_on_content_report();
