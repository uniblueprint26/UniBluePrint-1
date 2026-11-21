-- Changes: shared notes and past papers can now be a file or a link, can be shared with Course Connect (national) or Campus Connect (own campus only), and can be posted by UBP. Adds scope, link_url, description, module, is_ubp, checked_on, suggested_to_ubp columns, a visibility helper and audience aware read policies, saves and ratings tables, safer download counters and popular notes, text guard on every text column, wider file types on the bucket, and a starter set of real link resources posted by UBP. Destructive: no (additive; user_id, file_url, subject, course and year become nullable). Undo: drop the new columns and tables, restore the old read policies "read_shared_notes" and "read_past_papers" (using true), drop the triggers trg_resource_write_guard, and delete rows where is_ubp.
--
-- Scope rules
--  * scope 'course' is national: every signed in member can read it.
--  * scope 'campus' is the poster's own community (profiles.campus_community,
--    falling back to institution). Read access goes through resource_visible().
--  * UBP posted rows have user_id null and is_ubp true. Nobody can edit or
--    delete them from the app (the own row policies need user_id = auth.uid()).
--    They can be reported like any other item.
--  * A member cannot set is_ubp, a different owner, or download_count.
-- Notifications: none are created here.

-- Columns
alter table public.shared_notes
  add column if not exists scope text not null default 'course' check (scope in ('course', 'campus')),
  add column if not exists link_url text,
  add column if not exists description text,
  add column if not exists module text,
  add column if not exists is_ubp boolean not null default false,
  add column if not exists checked_on date,
  add column if not exists suggested_to_ubp boolean not null default false;

alter table public.past_papers
  add column if not exists scope text not null default 'course' check (scope in ('course', 'campus')),
  add column if not exists link_url text,
  add column if not exists description text,
  add column if not exists module text,
  add column if not exists is_ubp boolean not null default false,
  add column if not exists checked_on date,
  add column if not exists suggested_to_ubp boolean not null default false;

alter table public.shared_notes alter column user_id drop not null;
alter table public.shared_notes alter column file_url drop not null;
alter table public.shared_notes alter column subject drop not null;
alter table public.shared_notes alter column course drop not null;
alter table public.shared_notes alter column year drop not null;
alter table public.past_papers alter column user_id drop not null;
alter table public.past_papers alter column file_url drop not null;
alter table public.past_papers alter column exam_session drop not null;
alter table public.past_papers alter column year drop not null;
alter table public.past_papers alter column course drop not null;
alter table public.past_papers alter column subject drop not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'shared_notes_file_or_link') then
    alter table public.shared_notes add constraint shared_notes_file_or_link check (
      (file_url is not null or link_url is not null)
      and (link_url is null or (link_url ~* '^https://[^[:space:]]+$' and char_length(link_url) <= 500))
      and (description is null or char_length(description) <= 600)
      and (is_ubp or (subject is not null and course is not null and year is not null))
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'past_papers_file_or_link') then
    alter table public.past_papers add constraint past_papers_file_or_link check (
      (file_url is not null or link_url is not null)
      and (link_url is null or (link_url ~* '^https://[^[:space:]]+$' and char_length(link_url) <= 500))
      and (description is null or char_length(description) <= 600)
      and (is_ubp or (subject is not null and course is not null and year is not null and exam_session is not null))
    );
  end if;
end $$;

create index if not exists shared_notes_scope_created_idx on public.shared_notes (scope, created_at desc);
create index if not exists past_papers_scope_created_idx on public.past_papers (scope, created_at desc);

-- Who can see a resource
create or replace function public.resource_visible(p_scope text, p_user uuid, p_ubp boolean, p_inst text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_scope = 'course' then true
    when p_user is not null and p_user = auth.uid() then true
    when p_ubp then coalesce((
      select btrim(coalesce(p_inst, '')) <> ''
        and lower(btrim(coalesce(me.campus_community, me.institution, ''))) = lower(btrim(p_inst))
      from public.profiles me where me.id = auth.uid()), false)
    when p_user is not null then public.same_institution(auth.uid(), p_user)
    else false
  end;
$$;
revoke all on function public.resource_visible(text, uuid, boolean, text) from public, anon;
grant execute on function public.resource_visible(text, uuid, boolean, text) to authenticated, service_role;

-- Policies
drop policy if exists "read_shared_notes" on public.shared_notes;
drop policy if exists "shared_notes: read by scope" on public.shared_notes;
create policy "shared_notes: read by scope" on public.shared_notes
  for select to authenticated using (public.resource_visible(scope, user_id, is_ubp, institution));

drop policy if exists "read_past_papers" on public.past_papers;
drop policy if exists "past_papers: read by scope" on public.past_papers;
create policy "past_papers: read by scope" on public.past_papers
  for select to authenticated using (public.resource_visible(scope, user_id, is_ubp, institution));

drop policy if exists "insert_own_shared_note" on public.shared_notes;
create policy "insert_own_shared_note" on public.shared_notes
  for insert to authenticated with check ((select auth.uid()) = user_id and not is_ubp);
drop policy if exists "insert_own_past_paper" on public.past_papers;
create policy "insert_own_past_paper" on public.past_papers
  for insert to authenticated with check ((select auth.uid()) = user_id and not is_ubp);

-- Guard trigger: fills the poster's college, stops members setting is_ubp, a
-- counter or a different owner, and refuses a campus resource when the member
-- has no campus.
create or replace function public.resource_write_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  has_campus boolean;
begin
  if me is null then
    return new; -- migrations and the service role (UBP seeds) are trusted
  end if;
  if tg_op = 'INSERT' then
    new.user_id := me;
    new.is_ubp := false;
    new.checked_on := null;
    new.download_count := 0;
    if new.institution is null or btrim(new.institution) = '' then
      select p.institution into new.institution from public.profiles p where p.id = me;
    end if;
    if new.scope = 'campus' then
      select coalesce(btrim(coalesce(p.campus_community, p.institution, '')) <> '', false) into has_campus
        from public.profiles p where p.id = me;
      if not coalesce(has_campus, false) then
        raise exception 'Add your campus in Settings first' using errcode = 'check_violation';
      end if;
    end if;
  else
    new.user_id := old.user_id;
    new.is_ubp := old.is_ubp;
    new.checked_on := old.checked_on;
    new.scope := old.scope;
    if coalesce(current_setting('ubp.resource_counter', true), '') <> '1' then
      new.download_count := old.download_count;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.resource_write_guard() from public, anon, authenticated;

drop trigger if exists trg_resource_write_guard on public.shared_notes;
create trigger trg_resource_write_guard before insert or update on public.shared_notes
  for each row execute function public.resource_write_guard();
drop trigger if exists trg_resource_write_guard on public.past_papers;
create trigger trg_resource_write_guard before insert or update on public.past_papers
  for each row execute function public.resource_write_guard();

-- Text guard on every text a member types
drop trigger if exists trg_user_text_guard on public.shared_notes;
create trigger trg_user_text_guard before insert or update of title, subject, course, module, description on public.shared_notes
  for each row execute function public.user_text_guard('title', 'subject', 'course', 'module', 'description');
drop trigger if exists trg_user_text_guard on public.past_papers;
create trigger trg_user_text_guard before insert or update of subject, course, module, description on public.past_papers
  for each row execute function public.user_text_guard('subject', 'course', 'module', 'description');

-- Download and open counters: only for a resource you can see
create or replace function public.increment_shared_note_downloads(note_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  perform set_config('ubp.resource_counter', '1', true);
  update public.shared_notes n set download_count = n.download_count + 1
    where n.id = note_id and public.resource_visible(n.scope, n.user_id, n.is_ubp, n.institution);
end;
$$;

create or replace function public.increment_past_paper_downloads(paper_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  perform set_config('ubp.resource_counter', '1', true);
  update public.past_papers n set download_count = n.download_count + 1
    where n.id = paper_id and public.resource_visible(n.scope, n.user_id, n.is_ubp, n.institution);
end;
$$;
revoke all on function public.increment_shared_note_downloads(uuid) from public, anon;
revoke all on function public.increment_past_paper_downloads(uuid) from public, anon;
grant execute on function public.increment_shared_note_downloads(uuid) to authenticated;
grant execute on function public.increment_past_paper_downloads(uuid) to authenticated;

-- Popular notes on the Course Connect hub are national only.
create or replace function public.get_popular_notes(limit_count integer default 4)
returns table(id uuid, title text, subject text, course text, year text, institution text, poster_name text, download_count integer, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select n.id, n.title, n.subject, n.course, n.year, n.institution, n.poster_name, n.download_count, n.created_at
  from public.shared_notes n
  where n.scope = 'course' and n.download_count > 0
  order by n.download_count desc, n.created_at desc
  limit greatest(coalesce(limit_count, 4), 0)
$$;
revoke all on function public.get_popular_notes(integer) from public, anon;
grant execute on function public.get_popular_notes(integer) to authenticated;

-- Saves and ratings
create table if not exists public.resource_saves (
  user_id       uuid not null references auth.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('note', 'paper')),
  resource_id   uuid not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, resource_type, resource_id)
);
alter table public.resource_saves enable row level security;
drop policy if exists "resource_saves: own" on public.resource_saves;
create policy "resource_saves: own" on public.resource_saves
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.resource_ratings (
  user_id       uuid not null references auth.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('note', 'paper')),
  resource_id   uuid not null,
  rating        smallint not null check (rating between 1 and 5),
  created_at    timestamptz not null default now(),
  primary key (user_id, resource_type, resource_id)
);
alter table public.resource_ratings enable row level security;
drop policy if exists "resource_ratings: read" on public.resource_ratings;
create policy "resource_ratings: read" on public.resource_ratings
  for select to authenticated using (true);
drop policy if exists "resource_ratings: write own" on public.resource_ratings;
create policy "resource_ratings: write own" on public.resource_ratings
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "resource_ratings: update own" on public.resource_ratings;
create policy "resource_ratings: update own" on public.resource_ratings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "resource_ratings: delete own" on public.resource_ratings;
create policy "resource_ratings: delete own" on public.resource_ratings
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.resource_rating_summary(p_type text, p_ids uuid[])
returns table(resource_id uuid, avg_rating numeric, rating_count bigint)
language sql
stable
set search_path = public
as $$
  select r.resource_id, round(avg(r.rating)::numeric, 1), count(*)
  from public.resource_ratings r
  where r.resource_type = p_type and r.resource_id = any(p_ids)
  group by r.resource_id
$$;
revoke all on function public.resource_rating_summary(text, uuid[]) from public, anon;
grant execute on function public.resource_rating_summary(text, uuid[]) to authenticated;

-- Storage: wider file types for notes and past papers
update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg', 'image/png', 'image/webp'
    ]
where id = 'course-connect-files';

-- Starter resources posted by UBP. Real links, each one loaded on 21 November
-- 2026. National ones are Course Connect. Library pages are Campus Connect for
-- that college only. Re-check them before each release.
insert into public.shared_notes (user_id, poster_name, institution, title, subject, course, year, link_url, description, scope, is_ubp, checked_on)
select null, 'UBP', v.inst, v.title, v.topic, 'All courses', null, v.url, v.descr,
       case when v.inst is null then 'course' else 'campus' end, true, date '2026-11-21'
from (values
  ('SUSI student grant', 'Funding and money', 'https://susi.ie/', 'The national body for student grants. Check what you may qualify for and how to apply.', null),
  ('MABS money advice', 'Funding and money', 'https://www.mabs.ie/en/', 'Free and confidential help with budgeting and debt.', null),
  ('Revenue guide for students', 'Money and tax', 'https://www.revenue.ie/en/jobs-and-pensions/students/index.aspx', 'Tax rules for students with part time or summer work, from Revenue.', null),
  ('Revenue PAYE for employees', 'Money and tax', 'https://www.revenue.ie/en/jobs-and-pensions/paye-employees/index.aspx', 'How PAYE works, so you can check your payslip and tax credits.', null),
  ('Tax credits and reliefs', 'Money and tax', 'https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/index.aspx', 'The credits and reliefs you can claim, explained by Revenue.', null),
  ('Citizens Information on tax', 'Money and tax', 'https://www.citizensinformation.ie/en/money-and-tax/tax/', 'Plain guides to income tax and how it works in Ireland.', null),
  ('CCPC consumer guides', 'Money and tax', 'https://www.ccpc.ie/consumers/', 'Your rights as a consumer, plus guides on credit and spending.', null),
  ('Renting a home', 'Renting', 'https://www.citizensinformation.ie/en/housing/renting-a-home/', 'Your rights and what to know before you sign a lease, from Citizens Information.', null),
  ('Threshold tenant advice', 'Renting', 'https://www.threshold.ie/', 'Free and confidential advice for renters with tenancy problems.', null),
  ('Residential Tenancies Board', 'Renting', 'https://www.rtb.ie/', 'Register a tenancy, check the rent rules and sort out a dispute.', null),
  ('Your rights at work', 'Work and rights', 'https://www.citizensinformation.ie/en/employment/', 'Guides to pay, contracts and your rights at work, from Citizens Information.', null),
  ('Workplace Relations Commission', 'Work and rights', 'https://www.workplacerelations.ie/', 'Information on employment rights and how to make a complaint.', null),
  ('Apprenticeship.ie', 'Apprenticeships', 'https://www.apprenticeship.ie/', 'The official home for apprenticeships in Ireland, for learners and employers.', null),
  ('CareersPortal', 'Careers', 'https://careersportal.ie/', 'Careers guidance and information for people of all ages.', null),
  ('Skillnet Ireland', 'Careers', 'https://skillnetireland.ie/', 'Training networks and upskilling opportunities for people at work.', null),
  ('FET Course Hub', 'Study and courses', 'https://www.fetchcourses.ie/', 'Search further education and training courses across Ireland.', null),
  ('SOLAS', 'Study and courses', 'https://www.solas.ie/', 'The state agency for further education, training and apprenticeships.', null),
  ('CAO', 'Study and courses', 'https://www.cao.ie/', 'Apply for undergraduate courses and check the key dates.', null),
  ('CAO handbook', 'Study and courses', 'https://www.cao.ie/handbook', 'Course information and entry rules from the CAO.', null),
  ('QQI', 'Study and courses', 'https://www.qqi.ie/', 'The body behind Irish qualifications, with guides to what each level means.', null),
  ('Higher Education Authority', 'Study and courses', 'https://hea.ie/', 'The agency that funds and oversees higher education in Ireland.', null),
  ('Education guides', 'Study and courses', 'https://www.citizensinformation.ie/en/education/', 'Guides to fees, supports and your options after school.', null),
  ('Pieta', 'Wellbeing', 'https://www.pieta.ie/', 'Free support for anyone in suicidal distress or who is self harming.', null),
  ('Samaritans Ireland', 'Wellbeing', 'https://www.samaritans.org/ireland/', 'Talk to someone about anything, at any time.', null),
  ('Jigsaw', 'Wellbeing', 'https://jigsaw.ie/', 'The National Centre for Youth Mental Health, with support and advice.', null),
  ('YourMentalHealth.ie', 'Wellbeing', 'https://www.yourmentalhealth.ie/', 'HSE information and advice on mental health and wellbeing.', null),
  ('Drugs.ie', 'Wellbeing', 'https://www.drugs.ie/', 'HSE information on the effects of drugs and how to reduce the risks.', null),
  ('UCD Library', 'Library and study skills', 'https://www.ucd.ie/library/', 'Your library home page, for finding books, research help and study guides.', 'University College Dublin'),
  ('Trinity Library support and training', 'Library and study skills', 'https://www.tcd.ie/library/support/', 'Library help and training for Trinity students.', 'Trinity College Dublin'),
  ('Trinity LibGuides', 'Library and study skills', 'https://libguides.tcd.ie/', 'Your library home page, for finding books, research help and study guides.', 'Trinity College Dublin'),
  ('University of Galway Library', 'Library and study skills', 'https://library.universityofgalway.ie/', 'Your library home page, for finding books, research help and study guides.', 'University of Galway'),
  ('DCU Library', 'Library and study skills', 'https://www.dcu.ie/library', 'Your library home page, for finding books, research help and study guides.', 'Dublin City University'),
  ('DCU student support', 'Student support', 'https://www.dcu.ie/students', 'Student support and development services at DCU.', 'Dublin City University'),
  ('UL Library', 'Library and study skills', 'https://www.ul.ie/library', 'Your library home page, for finding books, research help and study guides.', 'University of Limerick')
) as v(title, topic, url, descr, inst)
where not exists (
  select 1 from public.shared_notes n
  where n.is_ubp and n.link_url = v.url and coalesce(n.institution, '') = coalesce(v.inst, '')
)
on conflict do nothing;
