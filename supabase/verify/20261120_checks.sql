-- Read only checks for the 20261120 database fixes. Run after the migrations are applied
-- (SQL editor or MCP execute_sql). Every row should show ok = true.
-- Rows marked (info) report a value to look at, they are not pass or fail.
-- It only runs SELECT statements. Nothing is written.

with
fn as (
  select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.oid, p.prosrc, p.prosecdef
  from pg_proc p where p.pronamespace = 'public'::regnamespace
),
pol as (
  select tablename, policyname, cmd, qual, with_check
  from pg_policies where schemaname = 'public'
),
guard_expected(tbl) as (
  values ('feed_comments'), ('chat_messages'), ('posts'), ('course_boards_posts'), ('industry_discussions'),
         ('module_questions'), ('module_answers'), ('problems_posts'), ('problem_solutions'),
         ('campus_conversations'), ('campus_suggestions'), ('campus_pulse_responses'), ('college_reviews'),
         ('accommodation_posts'), ('carpool_routes'), ('campus_events'), ('lost_found_posts'),
         ('marketplace_listings'), ('marketplace_skills'), ('student_ads'), ('ads'), ('clubs_societies'),
         ('cross_ireland_projects'), ('project_collaborations'), ('shared_notes'), ('peer_endorsements'), ('profiles')
)

-- 0100 campus community (item 6)
select '0100 profiles has the five new columns' as check_name,
       (select count(*) = 5 from information_schema.columns
         where table_schema = 'public' and table_name = 'profiles'
           and column_name in ('situation', 'trade', 'training_provider', 'industry', 'campus_community')) as ok,
       null::text as detail
union all
select '0100 campus_community trigger exists',
       exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_set_campus_community' and not tgisinternal),
       null
union all
select '0100 same_institution compares campus_community',
       exists (select 1 from fn where proname = 'same_institution' and prosrc like '%campus_community%'),
       null
union all
select '(info) 0100 profiles with a campus_community / total',
       true,
       (select count(*) filter (where campus_community is not null) || ' / ' || count(*) from public.profiles)

-- 0200 sign up data (item 1)
union all
select '0200 handle_new_user saves signup fields and consent',
       exists (select 1 from fn where proname = 'handle_new_user'
               and prosrc like '%training_provider%' and prosrc like '%legal_acknowledgements%' and prosrc like '%interests%'),
       null
union all
select '0200 handle_new_user still has no leaving_cert and profiles check unchanged',
       (select pg_get_constraintdef(oid) not like '%leaving_cert%' from pg_constraint where conname = 'profiles_user_type_check'),
       null
union all
select '(info) 0200 legal_acknowledgements rows / profiles',
       true,
       (select count(*) from public.legal_acknowledgements) || ' / ' || (select count(*) from public.profiles)

-- 0300 chat (item 2)
union all
select '0300 join_chat_counterparty exists, authenticated yes, anon no',
       coalesce(has_function_privilege('authenticated', to_regprocedure('public.join_chat_counterparty(uuid, uuid)'), 'execute')
            and not has_function_privilege('anon', to_regprocedure('public.join_chat_counterparty(uuid, uuid)'), 'execute'), false),
       null
union all
select '0300 start_direct_chat requires a connection',
       exists (select 1 from fn where proname = 'start_direct_chat' and prosrc like '%not connected%'),
       null

-- 0400 reports (item 3)
union all
select '0400 content_reports staff read and update policies',
       (select count(*) = 2 from pol where tablename = 'content_reports' and policyname in ('Staff can read all reports', 'Staff can update reports'))
       and not exists (select 1 from pol where tablename = 'content_reports' and policyname in ('Operations can read all reports', 'Operations can update reports')),
       null
union all
select '0400 staff RPCs exist and anon cannot run them',
       coalesce(to_regprocedure('public.staff_list_content_reports(text, integer, integer)') is not null
            and to_regprocedure('public.staff_set_report_status(uuid, text, text, boolean)') is not null
            and not has_function_privilege('anon', to_regprocedure('public.staff_list_content_reports(text, integer, integer)'), 'execute')
            and not has_function_privilege('anon', to_regprocedure('public.staff_set_report_status(uuid, text, text, boolean)'), 'execute'), false),
       null
union all
select '0400 report notifier includes legal',
       exists (select 1 from fn where proname = 'notify_ops_on_content_report' and prosrc like '%legal%'),
       null
union all
select '(info) 0400 staff who can read reports (founder, legal, operations, moderator)',
       true,
       (select string_agg(r.role || ':' || r.n, ', ' order by r.role)
          from (select ur.role::text as role, count(*) as n from public.user_roles ur
                 where ur.role::text in ('operations', 'founder', 'legal', 'moderator') group by ur.role) r)

-- 0500 text guard (item 4)
union all
select '0500 user_text_guard triggers present on every expected table',
       not exists (select 1 from guard_expected g
                   where to_regclass('public.' || g.tbl) is not null
                     and not exists (select 1 from pg_trigger t where t.tgrelid = to_regclass('public.' || g.tbl)
                                     and t.tgname = 'trg_user_text_guard' and not t.tgisinternal)),
       (select string_agg(g.tbl, ', ') from guard_expected g
         where to_regclass('public.' || g.tbl) is not null
           and not exists (select 1 from pg_trigger t where t.tgrelid = to_regclass('public.' || g.tbl)
                           and t.tgname = 'trg_user_text_guard' and not t.tgisinternal))
union all
select '0500 guard says a clean sentence is clean and a slur is not',
       public.feed_text_is_clean('See you at the library at five') and not public.feed_text_is_clean('you are a cunt'),
       null

-- 0600 audience aware reads (item 5)
union all
select '0600 comments, reactions and chat rooms no longer readable by anyone signed in',
       not exists (select 1 from pol where cmd = 'SELECT' and qual = 'true' and tablename in ('feed_comments', 'feed_post_reactions', 'chat_rooms')),
       (select string_agg(tablename || ': ' || policyname, '; ') from pol
         where cmd = 'SELECT' and qual = 'true' and tablename in ('feed_comments', 'feed_post_reactions', 'chat_rooms'))
union all
select '0600 the three new read policies exist',
       (select count(*) = 3 from pol where policyname in ('feed_comments: read if post visible', 'feed_reactions: read if post visible', 'chat_rooms: read non direct or own')),
       null
union all
select '0600 comment and reaction inserts need a visible post',
       (select count(*) = 2 from pol where cmd = 'INSERT' and tablename in ('feed_comments', 'feed_post_reactions') and with_check like '%feed_posts%'),
       null

-- 0700 date of birth (item 7)
union all
select '0700 under 18 check runs only when the date of birth changes',
       exists (select 1 from fn where proname = 'validate_date_of_birth' and prosrc like '%is distinct from%' and prosrc like '%18 years%'),
       null
union all
select '0700 profiles_require_dob insert trigger exists',
       exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_require_dob' and not tgisinternal),
       null
union all
select '(info) 0700 require_dob_on_signup flag (false until the website sign up sends a date of birth)',
       exists (select 1 from public.app_flags where key = 'require_dob_on_signup'),
       (select value::text from public.app_flags where key = 'require_dob_on_signup')

-- 0800 storage (item 8)
union all
select '0800 image buckets have size limits and mime types',
       (select count(*) = 7 from storage.buckets
         where id in ('feed-photos', 'profile-pictures', 'ad-images', 'campus-board-photos', 'coach-photos', 'partner-logos', 'course-connect-files')
           and file_size_limit is not null and allowed_mime_types is not null),
       (select string_agg(id || '=' || coalesce(file_size_limit::text, 'none'), ', ' order by id) from storage.buckets where public)

-- 0900 revokes (item 8)
union all
select '0900 anon cannot run any of the 55 revoked functions',
       not exists (
         select 1 from fn
         where prosecdef and has_function_privilege('anon', oid, 'execute')
           and proname not in ('get_current_weekly_issue', 'get_popular_interests', 'get_popular_notes')),
       (select string_agg(proname || '(' || args || ')', ', ') from fn
         where prosecdef and has_function_privilege('anon', oid, 'execute')
           and proname not in ('get_current_weekly_issue', 'get_popular_interests', 'get_popular_notes'))
union all
select '(info) 0900 SECURITY DEFINER functions in public still callable by anon (expected 3, left for review)',
       true,
       (select count(*) || ': ' || coalesce(string_agg(proname, ', ' order by proname), '') from fn where prosecdef and has_function_privilege('anon', oid, 'execute'))
union all
select '0900 members keep the RPCs they use',
       coalesce(has_function_privilege('authenticated', to_regprocedure('public.start_direct_chat(uuid, text)'), 'execute')
            and has_function_privilege('authenticated', to_regprocedure('public.register_push_token(text, text)'), 'execute')
            and has_function_privilege('authenticated', to_regprocedure('public.has_role(uuid, public.app_role)'), 'execute')
            and has_function_privilege('authenticated', to_regprocedure('public.get_direct_message_contacts()'), 'execute'), false),
       null
union all
select '0900 create_notification still server only',
       coalesce(not has_function_privilege('anon', to_regprocedure('public.create_notification(uuid, text, text, text, text, uuid)'), 'execute')
            and not has_function_privilege('authenticated', to_regprocedure('public.create_notification(uuid, text, text, text, text, uuid)'), 'execute'), false),
       null

-- 1000 probe leftovers (item 8)
union all
select '1000 MCP probe table and policy are gone',
       to_regclass('public._mcp_ddl_probe') is null
       and not exists (select 1 from pg_policies where policyname = '_mcp_probe_policy'),
       null

-- 1100 flags (item 9)
union all
select '1100 app flags seeded',
       (select count(*) = 4 from public.app_flags where key in ('pro_free_until', 'coming_soon_tiles', 'foundation_visible', 'foundation_ordering_enabled')),
       (select string_agg(key || '=' || value::text, ', ' order by key) from public.app_flags)
union all
select '1100 pro_free_until is 2027-01-31 (info if the founder changed it)',
       coalesce((select value = to_jsonb('2027-01-31'::text) from public.app_flags where key = 'pro_free_until'), false),
       null
order by 1;
