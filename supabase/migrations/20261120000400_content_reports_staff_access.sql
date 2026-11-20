-- Changes: lets operations, founder, legal and moderator roles read and update content_reports, adds review columns, adds RPCs staff_list_content_reports and staff_set_report_status (optionally removes the reported post, comment or message), and notifies legal as well. Destructive: no on its own; staff_set_report_status can delete reported content when a staff member asks it to. Undo: drop the two RPCs and is_moderation_staff, drop the new columns, restore the two old operations-only policies (bodies in the comment at the bottom).
--
-- F10 / G5 / R06: production policies on content_reports only allowed
-- has_role(auth.uid(), 'operations'). Nobody holds that role (roles held:
-- user, tech, founder, marketing, finance, legal, outreach, co_director,
-- business, handler), so founders were notified of a report they could not
-- open.
--
-- Who counts as moderation staff: operations, founder, legal, moderator.
-- (admin is left out on purpose; nobody holds it and it is not a product role.)
--
-- How staff use it from the app or the Operations portal
--   list:    supabase.rpc('staff_list_content_reports', { p_status: 'open', p_limit: 50, p_offset: 0 })
--            p_status null returns every status. Open and reviewing come first.
--   action:  supabase.rpc('staff_set_report_status', { p_report_id, p_status: 'actioned', p_note: '...', p_remove_content: true })
--            statuses: open, reviewing, actioned, dismissed.
--            p_remove_content only works with 'actioned' and only for content types
--            feed_post, comment and chat_message. Other types are marked actioned
--            and staff remove them in their own tool.
--   The direct table path also works for staff (select and update of status),
--   through the policies below, but the RPCs also record who reviewed it and when.

alter table public.content_reports add column if not exists reviewed_by     uuid references auth.users(id) on delete set null;
alter table public.content_reports add column if not exists reviewed_at     timestamptz;
alter table public.content_reports add column if not exists resolution_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.content_reports'::regclass and conname = 'content_reports_resolution_note_len'
  ) then
    alter table public.content_reports
      add constraint content_reports_resolution_note_len check (resolution_note is null or char_length(resolution_note) <= 1000);
  end if;
end $$;

create or replace function public.is_moderation_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text in ('operations', 'founder', 'legal', 'moderator')
  );
$$;

revoke all on function public.is_moderation_staff() from public, anon;
grant execute on function public.is_moderation_staff() to authenticated, service_role;

drop policy if exists "Operations can read all reports" on public.content_reports;
drop policy if exists "Staff can read all reports" on public.content_reports;
create policy "Staff can read all reports" on public.content_reports
  for select to authenticated
  using (public.is_moderation_staff());

drop policy if exists "Operations can update reports" on public.content_reports;
drop policy if exists "Staff can update reports" on public.content_reports;
create policy "Staff can update reports" on public.content_reports
  for update to authenticated
  using (public.is_moderation_staff())
  with check (public.is_moderation_staff());

-- Column grants unchanged in spirit: people can insert and read their own,
-- and the only column anyone can update directly is status (staff only, by policy).
revoke all on public.content_reports from anon;
revoke all on public.content_reports from authenticated;
grant select, insert on public.content_reports to authenticated;
grant update (status) on public.content_reports to authenticated;

-- Tell operations, founder and legal when a report arrives.
create or replace function public.notify_ops_on_content_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, category, title, message)
  select distinct ur.user_id, 'content_flagged', 'Content reported',
         initcap(replace(new.content_type, '_', ' ')) || ' reported: ' || new.reason
  from public.user_roles ur
  where ur.role::text in ('operations', 'founder', 'legal');
  return new;
end;
$$;

-- List reports for staff, with names and a short preview where the content can be found.
create or replace function public.staff_list_content_reports(
  p_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id               uuid,
  created_at       timestamptz,
  status           text,
  content_type     text,
  content_id       text,
  reason           text,
  reporter_id      uuid,
  reporter_name    text,
  reported_user_id uuid,
  reported_name    text,
  reports_on_item  bigint,
  content_preview  text,
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  resolution_note  text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_moderation_staff() then
    raise exception 'not allowed';
  end if;

  if p_status is not null and p_status not in ('open', 'reviewing', 'actioned', 'dismissed') then
    raise exception 'invalid status';
  end if;

  return query
  select r.id, r.created_at, r.status, r.content_type, r.content_id, r.reason,
         r.reporter_id,
         (select pr.full_name from public.profiles pr where pr.id = r.reporter_id),
         r.reported_user_id,
         (select pr.full_name from public.profiles pr where pr.id = r.reported_user_id),
         (select count(*) from public.content_reports x
            where x.content_type = r.content_type and x.content_id = r.content_id),
         case r.content_type
           when 'feed_post'    then (select left(fp.body, 200)    from public.feed_posts fp    where fp.id = cid.u)
           when 'comment'      then (select left(fc.body, 200)    from public.feed_comments fc where fc.id = cid.u)
           when 'chat_message' then (select left(cm.content, 200) from public.chat_messages cm where cm.id = cid.u)
         end,
         r.reviewed_by, r.reviewed_at, r.resolution_note
  from public.content_reports r
  left join lateral (
    select case when r.content_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                then r.content_id::uuid end as u
  ) cid on true
  where p_status is null or r.status = p_status
  order by (r.status in ('open', 'reviewing')) desc, r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200))
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.staff_list_content_reports(text, integer, integer) from public, anon;
grant execute on function public.staff_list_content_reports(text, integer, integer) to authenticated, service_role;

-- Change a report's status. Records who and when. Optionally removes the reported content.
create or replace function public.staff_set_report_status(
  p_report_id uuid,
  p_status text,
  p_note text default null,
  p_remove_content boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report  public.content_reports;
  v_uuid    uuid;
  v_removed boolean := false;
  v_count   integer;
begin
  if not public.is_moderation_staff() then
    raise exception 'not allowed';
  end if;

  if p_status is null or p_status not in ('open', 'reviewing', 'actioned', 'dismissed') then
    raise exception 'invalid status';
  end if;

  select * into v_report from public.content_reports where id = p_report_id for update;
  if not found then
    raise exception 'report not found';
  end if;

  if coalesce(p_remove_content, false) then
    if p_status <> 'actioned' then
      raise exception 'content can only be removed when the report is actioned';
    end if;
    if v_report.content_type not in ('feed_post', 'comment', 'chat_message') then
      raise exception 'this content type cannot be removed here';
    end if;
    if v_report.content_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_uuid := v_report.content_id::uuid;
      if v_report.content_type = 'feed_post' then
        delete from public.feed_posts where id = v_uuid;
      elsif v_report.content_type = 'comment' then
        delete from public.feed_comments where id = v_uuid;
      else
        delete from public.chat_messages where id = v_uuid;
      end if;
      get diagnostics v_count = row_count;
      v_removed := v_count > 0;
    end if;
  end if;

  update public.content_reports
  set status          = p_status,
      reviewed_by     = auth.uid(),
      reviewed_at     = now(),
      resolution_note = coalesce(left(nullif(btrim(p_note), ''), 1000), resolution_note)
  where id = p_report_id;

  return jsonb_build_object('id', p_report_id, 'status', p_status, 'content_removed', v_removed);
end;
$$;

revoke all on function public.staff_set_report_status(uuid, text, text, boolean) from public, anon;
grant execute on function public.staff_set_report_status(uuid, text, text, boolean) to authenticated, service_role;

-- Original policies, for undo:
--   create policy "Operations can read all reports" on public.content_reports for select to authenticated
--     using (public.has_role(auth.uid(), 'operations'));
--   create policy "Operations can update reports" on public.content_reports for update to authenticated
--     using (public.has_role(auth.uid(), 'operations')) with check (public.has_role(auth.uid(), 'operations'));
