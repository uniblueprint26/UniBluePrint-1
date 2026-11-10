-- Notification Center, part 2: route the four Foundation Blueprint
-- notification writers through public.create_notification() and stamp a
-- 'submission' deep link, same as 20260915090000 did for welcome and
-- coach_booking. Split into its own migration because these four functions
-- (and the columns/helpers they use — document_table, marked_incomplete,
-- has_two_sentences, is_valid_document_table, handler_escalations) are
-- defined in 20260726110000_handler_pipeline.sql and
-- 20260727090000_escalation_performance_ops.sql, which have to run before
-- this file for `create or replace function` to be replacing something
-- that already exists with matching dependencies.
--
-- Behaviour is otherwise unchanged from those two migrations — same
-- checks, same tables touched, same copy — this only adds the
-- create_notification() call in place of the raw insert, carrying
-- related_entity_type = 'submission' / related_entity_id = the submission.

create or replace function public.deliver_submission(p_submission_id uuid, p_handler_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
  v_updated uuid;
begin
  if not public.has_two_sentences(p_handler_note) then
    raise exception 'A Handler note of at least two sentences is required before delivering.';
  end if;

  select * into v_sub from public.submissions where id = p_submission_id;
  if v_sub is null then
    raise exception 'Submission not found';
  end if;

  if not (
    exists (select 1 from public.handler_assignments where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active')
    or public.has_role(auth.uid(), 'operations')
  ) then
    raise exception 'You are not the Handler assigned to this submission';
  end if;

  if v_sub.document_table is not null then
    if not public.is_valid_document_table(v_sub.document_table) then
      raise exception 'Submission has an invalid document_table value — refusing to deliver';
    end if;

    execute format(
      'update public.%I set status = ''delivered'', updated_at = now() where id = $1 and user_id = $2 returning id',
      v_sub.document_table
    ) into v_updated using v_sub.document_id, v_sub.user_id;

    if v_updated is null then
      raise exception 'Could not find the underlying document for this submission — refusing to deliver an orphaned record';
    end if;
  end if;

  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), p_handler_note);

  update public.submissions
     set stage = 'delivered', delivered_at = now()
   where id = p_submission_id;

  perform public.create_notification(
    v_sub.user_id, 'foundation_blueprint', 'Your document has been reviewed',
    'A Campus Handler has reviewed and delivered your document. It is ready to view and download.',
    'submission', p_submission_id
  );
end;
$$;

create or replace function public.mark_submission_incomplete(p_submission_id uuid, p_handler_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.has_two_sentences(p_handler_note) then
    raise exception 'A Handler note of at least two sentences is required before marking incomplete.';
  end if;

  if not (
    exists (select 1 from public.handler_assignments where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active')
    or public.has_role(auth.uid(), 'operations')
  ) then
    raise exception 'You are not the Handler assigned to this submission';
  end if;

  update public.submissions
     set marked_incomplete = true, incomplete_reason = p_handler_note
   where id = p_submission_id
   returning user_id into v_user_id;

  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), 'Marked incomplete: ' || p_handler_note);

  perform public.create_notification(
    v_user_id, 'foundation_blueprint', 'Your submission needs more information',
    'A Campus Handler flagged your submission as incomplete: ' || p_handler_note,
    'submission', p_submission_id
  );
end;
$$;

create or replace function public.cancel_submission(p_submission_id uuid, p_reason text, p_full_refund boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
begin
  if not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can cancel a submission';
  end if;
  if not public.has_two_sentences(p_reason) then
    raise exception 'A cancellation reason of at least two sentences is required.';
  end if;

  select * into v_sub from public.submissions where id = p_submission_id;
  if v_sub is null then raise exception 'Submission not found'; end if;

  update public.submissions set marked_incomplete = true, incomplete_reason = p_reason where id = p_submission_id;

  update public.handler_escalations set resolved = true, resolved_by = auth.uid(), resolved_at = now(),
    operations_action = 'cancelled', resolution_notes = p_reason
   where submission_id = p_submission_id and resolved = false;

  insert into public.ticket_revisions (submission_id, revised_by, revision_notes)
  values (p_submission_id, auth.uid(), 'Cancelled by Operations' || (case when p_full_refund then ' (full refund)' else '' end) || ': ' || p_reason);

  perform public.create_notification(
    v_sub.user_id, 'foundation_blueprint', 'Your submission was cancelled',
    'Our team has cancelled this submission: ' || p_reason || case when p_full_refund then ' A full refund has been noted for processing.' else '' end,
    'submission', p_submission_id
  );
end;
$$;

create or replace function public.contact_student(p_submission_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not (public.has_role(auth.uid(), 'operations') or exists (
    select 1 from public.handler_assignments where submission_id = p_submission_id and handler_id = auth.uid() and status = 'active'
  )) then
    raise exception 'Not authorised for this submission';
  end if;

  select user_id into v_user_id from public.submissions where id = p_submission_id;
  if v_user_id is null then raise exception 'Submission not found'; end if;

  perform public.create_notification(
    v_user_id, 'foundation_blueprint', 'A message about your submission', p_message,
    'submission', p_submission_id
  );
end;
$$;
