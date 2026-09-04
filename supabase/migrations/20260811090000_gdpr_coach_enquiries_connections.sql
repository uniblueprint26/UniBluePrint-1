-- App completion pass: GDPR requests, coach self-serve profile editing,
-- coach booking enquiries, Directory connection requests, and the RLS/notify
-- plumbing that ties them to the existing founder/operations roles.
--
-- Consent versioning needs no schema change here — legal_acknowledgements
-- (document_type, version, acknowledged_at) already exists from the initial
-- migration and is generic enough to record Terms/Privacy acceptance as-is.

-- ── 1. GDPR data requests ────────────────────────────────────────────────────
-- A user can request an export or deletion of their data. This table is the
-- request queue Operations/Founder work from; it does not perform the export
-- or deletion itself, that remains a manual or Edge Function process per
-- request, logged back here via status/processed_at/processed_by.

create table if not exists public.gdpr_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  request_type  text not null check (request_type in ('export', 'deletion')),
  status        text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'rejected')),
  notes         text,
  requested_at  timestamptz not null default now(),
  processed_at  timestamptz,
  processed_by  uuid references auth.users(id)
);
alter table public.gdpr_requests enable row level security;

create policy "users_read_own_gdpr_requests" on public.gdpr_requests
  for select to authenticated using (auth.uid() = user_id);
create policy "users_insert_own_gdpr_requests" on public.gdpr_requests
  for insert to authenticated with check (auth.uid() = user_id);
create policy "operations_founder_manage_gdpr_requests" on public.gdpr_requests
  for all to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));

create or replace function public.notify_ops_on_gdpr_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, category, title, message)
  select ur.user_id, 'gdpr_request', 'New GDPR data request',
         initcap(new.request_type) || ' request submitted, needs review within the statutory window.'
  from public.user_roles ur where ur.role in ('operations', 'founder');
  return new;
end; $$;

drop trigger if exists trg_notify_gdpr_request on public.gdpr_requests;
create trigger trg_notify_gdpr_request
  after insert on public.gdpr_requests
  for each row execute function public.notify_ops_on_gdpr_request();


-- ── 2. Coach self-serve profile editing ─────────────────────────────────────
-- coach_slug links a coach_profiles row to the stable `slug` field carried on
-- each coach's entry in the app's coach list (ElevationScreen.jsx), so a
-- coach can own and edit their bio/photo without every coach needing a full
-- structured record yet. Bio and photo_url on this row, when present,
-- override the static listing's bio/photo at read time.

alter table public.coach_profiles
  add column if not exists coach_slug text unique;

-- Most coaches in the current listing are not registered platform users, so
-- the Founder Portal needs to be able to create an "unclaimed" coach_profiles
-- row (slug + photo, no linked account yet) purely to hold a live-edited
-- photo/bio. user_id stays unique when present, but is no longer required —
-- a coach claims their row later by having Operations/Founder set user_id
-- once they sign up, at which point self-edit RLS (auth.uid() = user_id)
-- starts applying to it.
alter table public.coach_profiles
  alter column user_id drop not null;

-- Founder/Operations can manage ANY coach's profile row, not just their own —
-- this is what makes "edit any coach's photo from the Founder Portal" possible
-- without impersonating the coach's account.
create policy "founder_operations_manage_any_coach_profile"
  on public.coach_profiles for all to authenticated
  using (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'))
  with check (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'));

-- Alert Founder/Operations whenever a coach's bio or photo actually changes,
-- so self-edit is never silent.
create or replace function public.notify_ops_on_coach_profile_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or (new.bio is distinct from old.bio) or (new.photo_url is distinct from old.photo_url) then
    insert into public.notifications (user_id, category, title, message)
    select ur.user_id, 'coach_profile_updated', 'Coach profile updated',
           coalesce(new.coach_slug, 'A coach') || ' updated their bio or profile photo.'
    from public.user_roles ur where ur.role in ('founder', 'operations');
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_coach_profile_change on public.coach_profiles;
create trigger trg_notify_coach_profile_change
  after insert or update on public.coach_profiles
  for each row execute function public.notify_ops_on_coach_profile_change();

-- Path-ownership check used by the coach-photos storage policy below: true
-- when the first path segment (the coach_slug folder) belongs to the calling
-- user's own coach_profiles row.
create or replace function public.owns_coach_photo_path(_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.coach_profiles
    where user_id = auth.uid()
      and coach_slug = (storage.foldername(_path))[1]
  )
$$;

-- Re-scope coach-photos storage policies: admins/operations/founder/handler
-- keep full access (onboarding assistance), and a coach can now also manage
-- files under their own coach_slug folder — this is the self-serve path that
-- did not exist before.
drop policy if exists "coach-photos: admin insert" on storage.objects;
create policy "coach-photos: admin or own insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'coach-photos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
      or public.has_role(auth.uid(), 'founder')
      or public.has_role(auth.uid(), 'handler')
      or public.owns_coach_photo_path(name)
    )
  );

drop policy if exists "coach-photos: admin update" on storage.objects;
create policy "coach-photos: admin or own update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'coach-photos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
      or public.has_role(auth.uid(), 'founder')
      or public.owns_coach_photo_path(name)
    )
  );

drop policy if exists "coach-photos: admin delete" on storage.objects;
create policy "coach-photos: admin or own delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'coach-photos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
      or public.has_role(auth.uid(), 'founder')
      or public.owns_coach_photo_path(name)
    )
  );

-- partner-logos: founder did not exist as a role when this bucket's policies
-- were written — add it alongside admin/operations. Partners remain
-- non-self-serve by design (see image_storage.sql), this only widens who on
-- the internal team can manage them.
drop policy if exists "partner-logos: admin insert" on storage.objects;
create policy "partner-logos: admin insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'partner-logos'
    and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  );

drop policy if exists "partner-logos: admin update" on storage.objects;
create policy "partner-logos: admin update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'partner-logos'
    and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  );

drop policy if exists "partner-logos: admin delete" on storage.objects;
create policy "partner-logos: admin delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'partner-logos'
    and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  );

-- partners table itself never had an UPDATE policy — logo_url could not be
-- written even by an admin. Add the Founder/Operations management policy the
-- table was always missing.
create policy "founder_operations_manage_partners"
  on public.partners for all to authenticated
  using (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'))
  with check (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'));

-- partner_slug mirrors coach_slug above: links a row here to the `id` string
-- already used by each partner's static entry in the app/website Lifestyle
-- listings (e.g. 'mpfitness', 'leva', 'henrysisters'), so the Founder Portal
-- can upsert a real logo against a real live partner without first seeding
-- a full structured record for all of them. The existing seeded rows in this
-- table (Iron Campus Gym, DriveReady, etc., from 20260606140000_seed_lifestyle.sql)
-- are unrelated placeholder data, not the real partners shown in the app —
-- rows created via partner_slug are a separate, deliberately real set.
alter table public.partners
  add column if not exists partner_slug text unique;


-- ── 3. Coach booking enquiries ───────────────────────────────────────────────
-- Logged against coach_slug/coach_name rather than requiring every coach to
-- be a platform account — most coaches in the current listing are not
-- registered users. If a coach IS registered (coach_profiles.coach_slug
-- matches), they are notified directly in addition to Operations/Founder.

create table if not exists public.coach_enquiries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  coach_slug     text not null,
  coach_name     text not null,
  package_label  text,
  message        text,
  status         text not null default 'new' check (status in ('new', 'contacted', 'booked', 'closed')),
  created_at     timestamptz not null default now()
);
alter table public.coach_enquiries enable row level security;

create policy "users_read_own_enquiries" on public.coach_enquiries
  for select to authenticated using (auth.uid() = user_id);
create policy "users_insert_own_enquiries" on public.coach_enquiries
  for insert to authenticated with check (auth.uid() = user_id);
create policy "operations_founder_read_all_enquiries" on public.coach_enquiries
  for select to authenticated using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));
create policy "operations_founder_update_enquiries" on public.coach_enquiries
  for update to authenticated
  using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'))
  with check (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));
create policy "matching_coach_reads_own_enquiries" on public.coach_enquiries
  for select to authenticated using (
    exists (select 1 from public.coach_profiles cp where cp.coach_slug = coach_enquiries.coach_slug and cp.user_id = auth.uid())
  );

create or replace function public.notify_on_coach_enquiry()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, category, title, message)
  select ur.user_id, 'coach_enquiry', 'New coach enquiry',
         new.coach_name || ' has a new booking enquiry.'
  from public.user_roles ur where ur.role in ('operations', 'founder');

  insert into public.notifications (user_id, category, title, message)
  select cp.user_id, 'coach_enquiry', 'New booking enquiry',
         'You have a new enquiry via your UniBlueprint profile.'
  from public.coach_profiles cp where cp.coach_slug = new.coach_slug;

  return new;
end; $$;

drop trigger if exists trg_notify_coach_enquiry on public.coach_enquiries;
create trigger trg_notify_coach_enquiry
  after insert on public.coach_enquiries
  for each row execute function public.notify_on_coach_enquiry();


-- ── 4. Directory connection requests ─────────────────────────────────────────
-- Backend for the Directory "Connect" action. NOTE: DirectoryScreen.jsx still
-- renders a static STUDENTS array (see its own header comment), so this
-- cannot go live end-to-end until Directory reads real profiles. Built now so
-- that follow-up work is a UI change against a finished, RLS-safe backend,
-- not a backend build from scratch.

create table if not exists public.connection_requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users(id) on delete cascade,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  unique (requester_id, recipient_id),
  check (requester_id <> recipient_id)
);
alter table public.connection_requests enable row level security;

create policy "users_read_own_connection_requests" on public.connection_requests
  for select to authenticated using (auth.uid() = requester_id or auth.uid() = recipient_id);
create policy "users_insert_own_connection_requests" on public.connection_requests
  for insert to authenticated with check (auth.uid() = requester_id);
create policy "recipient_updates_connection_requests" on public.connection_requests
  for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

create or replace function public.notify_on_connection_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, category, title, message)
    values (new.recipient_id, 'connection_request', 'New connection request',
            'Someone on UniBlueprint wants to connect with you.');
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.notifications (user_id, category, title, message)
    values (new.requester_id, 'connection_accepted', 'Connection accepted',
            'Your connection request was accepted.');
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_connection_request on public.connection_requests;
create trigger trg_notify_connection_request
  after insert or update on public.connection_requests
  for each row execute function public.notify_on_connection_request();


-- ── 5. Founder/Operations visibility into activity_events ──────────────────
-- The original policy only let a user read their own events. Founder and
-- Operations dashboards need to see them platform-wide.
create policy "operations_founder_read_all_activity" on public.activity_events
  for select to authenticated using (public.has_role(auth.uid(), 'operations') or public.has_role(auth.uid(), 'founder'));


-- ── 6. Prompt library seed ───────────────────────────────────────────────────
-- PromptLibraryScreen.jsx previously ran on a hardcoded PROMPT_LIBRARY array
-- even though the real prompt_library table (see 20260810120100) already
-- existed. Seeding the same content here means switching the screen over to
-- a live query is not a content regression — Operations/Founder can add more
-- afterwards via the existing "operations_manage_prompt_library" policy.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'services_name_key') then
    alter table public.services add constraint services_name_key unique (name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'prompt_library_service_title_key') then
    alter table public.prompt_library add constraint prompt_library_service_title_key unique (service_id, title);
  end if;
end $$;

insert into public.services (name, category) values
  ('CV Optimisation', 'Foundation Blueprint'),
  ('Interview Prep', 'Foundation Blueprint'),
  ('Cover Letter Assistance', 'Foundation Blueprint'),
  ('LinkedIn Optimisation', 'Foundation Blueprint')
on conflict (name) do nothing;

insert into public.prompt_library (service_id, title, prompt_text)
select s.id, p.title, p.prompt_text
from (values
  ('CV Optimisation', 'Structured CV Review', 'Review this CV against the target role. Assess formatting consistency, quantify achievements where missing, flag weak action verbs, and check for a clear, single-page narrative. Return specific line-by-line edits, not general advice.'),
  ('CV Optimisation', 'ATS Keyword Pass', 'Compare this CV against the job description provided. List missing keywords and skills the ATS is likely to screen for, and suggest where in the CV each one can be naturally worked in without keyword stuffing.'),
  ('CV Optimisation', 'Graduate CV, No Experience', 'This student has limited work experience. Rework the CV to lead with academic projects, part-time work, and transferable skills. Reframe each bullet point around impact and outcome rather than duty.'),
  ('Interview Prep', 'Behavioural Question Bank', 'Generate 8 behavioural interview questions tailored to this role and industry. For each, note what the interviewer is really assessing and one STAR-format example the student could adapt.'),
  ('Interview Prep', 'Mock Interview Feedback', 'Based on the student''s practice answers below, give structured feedback: clarity, structure (STAR), specificity of examples, and confidence of delivery. End with the single highest-impact thing to fix before the real interview.'),
  ('Interview Prep', 'Tough Question Prep', 'Identify the 3 hardest questions this student is likely to face given gaps or weaknesses in their background, and draft honest, confident sample answers for each.'),
  ('Cover Letter Assistance', 'Cover Letter Structure Check', 'Review this cover letter for structure: strong opening hook, specific reason for applying to this company, 2 to 3 concrete examples tied to the role, and a confident close. Rewrite any section that reads generic.'),
  ('Cover Letter Assistance', 'Tone and Voice Pass', 'Check this cover letter for tone. It should sound like a confident, articulate student, not a template. Flag any clichés, filler phrases, or overly formal language, and suggest more natural alternatives.'),
  ('LinkedIn Optimisation', 'Headline and About Rewrite', 'Rewrite this LinkedIn headline and About section to be specific, keyword-rich for the target industry, and written in first person with a clear sense of what the student is looking for next.'),
  ('LinkedIn Optimisation', 'Experience Section Polish', 'Review each experience entry on this LinkedIn profile. Convert task-based descriptions into achievement-based bullet points, matching the tone and keywords of the CV Optimisation review for consistency.')
) as p(service_name, title, prompt_text)
join public.services s on s.name = p.service_name
on conflict (service_id, title) do nothing;


-- ── 7. Realtime for notifications ────────────────────────────────────────────
-- notifications already existed and was added to the realtime publication in
-- the initial migration; nothing to add there. gdpr_requests, coach_enquiries,
-- and connection_requests are read via polling/on-demand fetches, not
-- realtime feeds, so no publication changes needed for those.
