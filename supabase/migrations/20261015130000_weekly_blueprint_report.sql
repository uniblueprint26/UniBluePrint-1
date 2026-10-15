-- Weekly Blueprint Report — the Pro-only "personalised Monday summary" listed
-- in docs/business/subscription-pricing-model.md §1.2. Confirmed to have had
-- zero implementation anywhere in the app or website before this migration.
--
-- Scope deliberately kept to the smallest real version: a weekly in-app
-- notification, not a new screen or an email system.
--
--   - No email/transactional-send infrastructure exists anywhere in this
--     repo (supabase/functions/ has Stripe emails via the provider's own
--     receipts and a Mailchimp *subscriber sync*, nothing that sends a
--     per-user transactional email). Building that from scratch for one
--     weekly notice would be the "large, don't build" case the task
--     explicitly calls out — so this ships as an in-app notification
--     instead, reusing infrastructure that already exists end to end:
--     public.notifications + public.create_notification() (the single
--     creation choke point, 20260915090000_notification_center.sql),
--     rendered by NotificationsScreen's existing TYPE_CONFIG map, with
--     realtime delivery already wired (notifications is on
--     supabase_realtime and NotificationsScreen already subscribes).
--     No new screen: tapping the notification just marks it read, same as
--     the existing 'announcement'/'update' categories, since a digest
--     summarises several things rather than pointing at one entity —
--     notificationRouting.js's goToRelatedEntity() already no-ops when
--     related_entity_type/id are left null.
--
--   - Scheduling follows the one pattern already in this codebase for a
--     weekly job: generate_handler_snapshots() in
--     20260727090000_escalation_performance_ops.sql, registered with
--     pg_cron at '1 0 * * 1' (Monday just after midnight). This function
--     is pure SQL (reads subscriptions/submissions/coach_bookings, writes
--     notifications) with no external call, so — per that migration's own
--     rationale — it's a plain Postgres function scheduled via pg_cron,
--     not an Edge Function.
--
--   - "Pro-subscriber perk" is read directly off public.subscriptions
--     using the exact same rule AuthContext.jsx/useProAccess.js use for
--     isPro: status = 'active' and (current_period_end is null or in the
--     future). No new Pro-status concept is invented.
--
--   - Data summarised is what's actually available per user over the past
--     7 days: Foundation Blueprint outputs delivered (submissions.stage =
--     'delivered', submissions.delivered_at), new Elevation coach bookings
--     requested/confirmed in the window, and the next upcoming confirmed
--     coaching session. Lifestyle Blueprint deal "claims" and Campus/Course
--     Connect activity are NOT summarised: there is no claim/redemption or
--     per-user-activity tracking table for either anywhere in the schema
--     (deals and Campus Connect content are either static or have no
--     "user did X" row to read), so inventing that tracking just to feed
--     this digest would itself be the new subsystem the task says to avoid.
--     A user with no activity still gets a short, honest "quiet week"
--     message rather than being silently skipped — the perk is "a Monday
--     summary exists", not "a Monday summary exists only when busy".

-- ── The category itself ──────────────────────────────────────────────────────
-- NotificationsScreen.jsx's TYPE_CONFIG is updated in the same change to
-- recognise 'weekly_summary' (falls back to the generic 'update' styling
-- otherwise, which the app already tolerates for unknown categories).

create or replace function public.generate_weekly_blueprint_reports()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_window_start timestamptz := now() - interval '7 days';
  v_delivered_count int;
  v_delivered_names text;
  v_new_bookings_count int;
  v_next_session_date date;
  v_lines text[];
  v_message text;
begin
  -- Same three-way guard as handle_deadline_escalation() /
  -- generate_handler_snapshots() (20260727090000_escalation_performance_ops.sql):
  -- pg_cron carries no JWT at all (auth.uid() is null) and must always run;
  -- an authenticated non-Operations caller is rejected; Operations can
  -- still trigger a manual run for testing.
  if auth.uid() is not null and not public.has_role(auth.uid(), 'operations') then
    raise exception 'Only Operations can run this manually';
  end if;

  for r in
    select s.user_id
    from public.subscriptions s
    where s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  loop
    -- Foundation Blueprint: outputs delivered in the last 7 days.
    select count(*), string_agg(distinct sv.name, ', ')
      into v_delivered_count, v_delivered_names
    from public.submissions sub
    left join public.services sv on sv.id = sub.service_id
    where sub.user_id = r.user_id
      and sub.stage = 'delivered'
      and sub.delivered_at >= v_window_start;

    -- Elevation: coaching sessions requested or confirmed in the last 7 days.
    select count(*)
      into v_new_bookings_count
    from public.coach_bookings cb
    where cb.user_id = r.user_id
      and cb.created_at >= v_window_start
      and cb.status in ('requested', 'confirmed');

    -- Elevation: the next confirmed session still ahead of the user.
    select min(cb.slot_date)
      into v_next_session_date
    from public.coach_bookings cb
    where cb.user_id = r.user_id
      and cb.status = 'confirmed'
      and cb.slot_date >= current_date;

    v_lines := array[]::text[];

    if v_delivered_count > 0 then
      v_lines := array_append(v_lines,
        case when v_delivered_count = 1
          then format('Your %s output was delivered this week.', coalesce(v_delivered_names, 'Foundation Blueprint'))
          else format('%s Foundation Blueprint outputs were delivered this week (%s).', v_delivered_count, v_delivered_names)
        end);
    end if;

    if v_new_bookings_count > 0 then
      v_lines := array_append(v_lines,
        case when v_new_bookings_count = 1
          then 'You booked a new coaching session this week.'
          else format('You booked %s new coaching sessions this week.', v_new_bookings_count)
        end);
    end if;

    if v_next_session_date is not null then
      v_lines := array_append(v_lines,
        format('Your next coaching session is on %s.', to_char(v_next_session_date, 'Mon DD')));
    end if;

    if array_length(v_lines, 1) is null then
      v_message := 'A quiet week on your account. Browse Elevation coaches or start a new Foundation Blueprint service to keep moving forward.';
    else
      v_message := array_to_string(v_lines, ' ');
    end if;

    perform public.create_notification(
      r.user_id,
      'weekly_summary',
      'Your Weekly Blueprint Report',
      v_message
    );
  end loop;
end;
$$;

grant execute on function public.generate_weekly_blueprint_reports() to authenticated;

-- ── pg_cron registration ──────────────────────────────────────────────────────
-- Same guard pattern as 20260727090000_escalation_performance_ops.sql: if
-- pg_cron isn't enabled on this project this block fails and the function
-- above still exists and is callable manually / from an external scheduler.

create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'generate-weekly-blueprint-reports') then
    perform cron.schedule('generate-weekly-blueprint-reports', '0 8 * * 1', 'select public.generate_weekly_blueprint_reports();');
  end if;
end $$;
