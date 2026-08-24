-- Reconciles gdpr_requests so it actually works from both surfaces that write
-- to it. The table as originally migrated (20260811090000) only supports
-- logged-in app users (user_id not null, RLS scoped to auth.uid()). The
-- website's own GDPR request form (PrivacyPage.jsx — the form the Privacy
-- Policy itself tells visitors to use) has been writing name/email/message
-- for anonymous, non-account visitors this whole time, which fails outright:
-- those columns don't exist, request_type values don't match the check
-- constraint, and anon has no insert policy on this table at all. Every real
-- GDPR request submitted through the website has been silently dropped.
--
-- This migration widens the table to accept a request from EITHER an
-- authenticated app user OR an anonymous website visitor (name + email
-- instead of a user_id), adds a statutory 30-day due date so Operations can
-- actually track the deadline, and gives Operations a real way to action a
-- request instead of only viewing it.

alter table public.gdpr_requests
  alter column user_id drop not null;

alter table public.gdpr_requests
  add column if not exists name    text,
  add column if not exists email   text,
  add column if not exists message text;

-- Every request must be traceable to someone, whether that's a logged-in
-- user_id or a name+email pair from a non-account visitor.
alter table public.gdpr_requests
  drop constraint if exists gdpr_requests_has_requester;
alter table public.gdpr_requests
  add constraint gdpr_requests_has_requester
  check (user_id is not null or (name is not null and email is not null));

-- Widen request_type to cover all four GDPR rights the website form actually
-- offers (access/export, deletion, correction, restriction) — the original
-- constraint only allowed 'export'/'deletion', so 'correction' and
-- 'restriction' submissions were being rejected outright by Postgres.
alter table public.gdpr_requests
  drop constraint if exists gdpr_requests_request_type_check;
alter table public.gdpr_requests
  add constraint gdpr_requests_request_type_check
  check (request_type in ('export', 'deletion', 'correction', 'restriction'));

-- Statutory 30-day response window (GDPR Article 12) as a real, queryable
-- column instead of something a person has to calculate by hand from
-- requested_at every time.
alter table public.gdpr_requests
  add column if not exists due_at timestamptz generated always as (requested_at + interval '30 days') stored;

-- Replace the authenticated-only insert policy with one that also accepts
-- anonymous website visitors, while still preventing a logged-in user from
-- filing a request against someone else's user_id.
drop policy if exists "users_insert_own_gdpr_requests" on public.gdpr_requests;
create policy "submit_gdpr_request" on public.gdpr_requests
  for insert to anon, authenticated
  with check (
    (auth.role() = 'authenticated' and (user_id is null or auth.uid() = user_id))
    or auth.role() = 'anon'
  );

comment on column public.gdpr_requests.name is 'Set for anonymous (non-account) requesters submitted via the website form. Null for logged-in app requests, which are identified by user_id.';
comment on column public.gdpr_requests.email is 'Set for anonymous (non-account) requesters submitted via the website form.';
comment on column public.gdpr_requests.due_at is 'Statutory response deadline: requested_at + 30 days (GDPR Article 12).';
