-- Changes: revokes EXECUTE from public and anon on 55 of the 58 SECURITY DEFINER functions in public that anon can call (28 trigger functions also lose it for authenticated; 27 member only RPCs keep authenticated and service_role). Destructive: no data, but any caller that relied on anon access to these will now be refused. Undo: grant execute on function <name>(<args>) to public, anon, authenticated; (the signature list is in the DO block below).
--
-- R10 follow up / R20. Production checked on 20 Nov 2026: 58 SECURITY DEFINER
-- functions in schema public were executable by anon (create_notification is
-- already locked down). Each was classified from its definition:
--
-- A. TRIGGER FUNCTIONS (28). Clearly internal. A trigger function is never
--    called by clients, and Postgres does not check EXECUTE when a trigger
--    fires (only when the trigger is created), so revoking from public, anon
--    and authenticated is safe. Revoked.
--    backfill_claim_attempt, clear_wallet_expiry_on_pro_upgrade,
--    dispatch_push_for_notification, enforce_carpool_terms_accepted,
--    enforce_form_rate_limit, enforce_handler_coach_exclusivity,
--    escalate_on_second_handoff, flag_submission_name_mismatch,
--    handle_new_profile_notification, handle_new_user,
--    notify_followers_of_new_deal, notify_handlers_of_premium_ticket,
--    notify_on_chat_message, notify_on_coach_booking, notify_on_coach_enquiry,
--    notify_on_connection_request, notify_on_module_answer,
--    notify_on_problem_solution, notify_ops_on_coach_intro_call_offer_change,
--    notify_ops_on_coach_profile_change, notify_ops_on_content_report,
--    notify_ops_on_flag, notify_ops_on_gdpr_request,
--    reassess_specialism_confidence, set_feed_comment_author_name,
--    set_feed_post_author_name, update_feed_post_comment_count,
--    update_feed_post_reaction_count
--
-- B. MEMBER ONLY RPCs (27). They use auth.uid() or are only used by signed in
--    members, edge functions (service role) or policies that are all
--    "to authenticated" (checked in pg_policy: no anon or public policy calls
--    them). Revoked from public and anon, explicitly granted to authenticated
--    and service_role so nothing changes for members.
--    add_to_budget_goal, cancel_subscription, get_campus_conversations_feed,
--    get_campus_suggestions_feed, get_college_reviews_feed,
--    get_problems_posts_feed (R20: member posts and names readable by the whole
--    internet), get_chat_room_peer_names, get_direct_message_contacts,
--    get_my_coach_booking_breakdown, get_my_coach_booking_trend,
--    get_my_coach_earnings, get_my_partner_engagement_trend,
--    get_my_partner_redemption_breakdown, get_my_partner_stats,
--    has_role (lets anon probe which user ids are staff),
--    increment_past_paper_downloads, increment_shared_note_downloads,
--    owns_coach_photo_path, register_push_token, save_job_search_generation,
--    save_weekly_reading_progress, set_active_career_target,
--    start_direct_chat, start_review, submit_document_for_review,
--    sunday_queue_cap, user_has_active_pro
--
-- C. LEFT AS IS, FOR FOUNDER REVIEW (3). Read only, no auth check, may have a
--    logged out use (sign up screen, website, preview):
--    get_current_weekly_issue  published Weekly Blueprint pages (public content)
--    get_popular_interests     counts of interest labels, aggregate only
--    get_popular_notes         top shared notes: title, subject, course,
--                              institution, poster_name. Names a member, so
--                              consider revoking anon if the logged out site
--                              does not show notes.
--    None of the three is called by app/src or src today, so revoking anon on
--    all three is probably safe. Left alone because "clearly internal only".
--
-- Also not done: ALTER DEFAULT PRIVILEGES to stop new functions being granted
-- to anon. It would change how every other migration in this batch behaves.
-- Function signatures are guarded with to_regprocedure, so a function that does
-- not exist in a given database is skipped.

do $$
declare
  sig text;
  trigger_fns text[] := array[
    'public.backfill_claim_attempt()',
    'public.clear_wallet_expiry_on_pro_upgrade()',
    'public.dispatch_push_for_notification()',
    'public.enforce_carpool_terms_accepted()',
    'public.enforce_form_rate_limit()',
    'public.enforce_handler_coach_exclusivity()',
    'public.escalate_on_second_handoff()',
    'public.flag_submission_name_mismatch()',
    'public.handle_new_profile_notification()',
    'public.handle_new_user()',
    'public.notify_followers_of_new_deal()',
    'public.notify_handlers_of_premium_ticket()',
    'public.notify_on_chat_message()',
    'public.notify_on_coach_booking()',
    'public.notify_on_coach_enquiry()',
    'public.notify_on_connection_request()',
    'public.notify_on_module_answer()',
    'public.notify_on_problem_solution()',
    'public.notify_ops_on_coach_intro_call_offer_change()',
    'public.notify_ops_on_coach_profile_change()',
    'public.notify_ops_on_content_report()',
    'public.notify_ops_on_flag()',
    'public.notify_ops_on_gdpr_request()',
    'public.reassess_specialism_confidence()',
    'public.set_feed_comment_author_name()',
    'public.set_feed_post_author_name()',
    'public.update_feed_post_comment_count()',
    'public.update_feed_post_reaction_count()'
  ];
  member_fns text[] := array[
    'public.add_to_budget_goal(uuid, numeric)',
    'public.cancel_subscription()',
    'public.get_campus_conversations_feed()',
    'public.get_campus_suggestions_feed()',
    'public.get_college_reviews_feed()',
    'public.get_problems_posts_feed()',
    'public.get_chat_room_peer_names(uuid[])',
    'public.get_direct_message_contacts()',
    'public.get_my_coach_booking_breakdown()',
    'public.get_my_coach_booking_trend(integer)',
    'public.get_my_coach_earnings()',
    'public.get_my_partner_engagement_trend(integer)',
    'public.get_my_partner_redemption_breakdown()',
    'public.get_my_partner_stats()',
    'public.has_role(uuid, public.app_role)',
    'public.increment_past_paper_downloads(uuid)',
    'public.increment_shared_note_downloads(uuid)',
    'public.owns_coach_photo_path(text)',
    'public.register_push_token(text, text)',
    'public.save_job_search_generation(uuid, jsonb, jsonb)',
    'public.save_weekly_reading_progress(uuid, integer)',
    'public.set_active_career_target(uuid)',
    'public.start_direct_chat(uuid, text)',
    'public.start_review(uuid)',
    'public.submit_document_for_review(text, uuid, text, text, text)',
    'public.sunday_queue_cap()',
    'public.user_has_active_pro(uuid)'
  ];
begin
  foreach sig in array trigger_fns loop
    if to_regprocedure(sig) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', sig);
    else
      raise notice 'skipped (not found): %', sig;
    end if;
  end loop;

  foreach sig in array member_fns loop
    if to_regprocedure(sig) is not null then
      execute format('revoke all on function %s from public, anon', sig);
      execute format('grant execute on function %s to authenticated, service_role', sig);
    else
      raise notice 'skipped (not found): %', sig;
    end if;
  end loop;
end $$;
