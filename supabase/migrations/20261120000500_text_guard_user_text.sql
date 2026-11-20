-- Changes: adds one generic trigger function user_text_guard and attaches it to the text columns of comments, chat messages, board posts, listings, Q and A, reviews, clubs, projects, notes titles, endorsements and bios, reusing public.feed_text_is_clean. Destructive: no (triggers only block new bad text; existing rows are never touched). Undo: run the DROP TRIGGER statements in the comment at the bottom, then drop function public.user_text_guard().
--
-- R07 / F08 / G8: the profanity check ran only on Composer posts (client) and
-- feed_posts (trigger). Comments, chat, boards, listings and Q and A accepted
-- anything. Apple 1.2 and Google UGC both want filtering of objectionable text.
--
-- Same rule as feed posts: public.feed_text_is_clean (slurs and the strongest
-- profanity, mild Irish usage allowed) and the same error text
-- 'feed_text_guard: community guidelines' with errcode check_violation, which
-- the app already turns into its calm "That doesn't meet our community
-- guidelines. Please reword it." line (app/src/lib/moderation.js).
--
-- On UPDATE a column is only checked when its value changed, so an old row
-- that already holds a banned word can still have other fields edited.
--
-- The trigger list is built by the DO block below. A table or column that does
-- not exist in a given database is skipped, so the file is safe to run anywhere.
-- Not covered on purpose: explore_content (staff reviewed), study_groups
-- subject and similar short labels, images and clips (they rely on Report and review).
--
-- Rows written by the service role (edge functions) are checked too. The Ad
-- Board edge function inserts ads, so a banned word in an ad title or
-- description will make that insert fail with the guard message.

create or replace function public.user_text_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  col text;
  v   text;
  j   jsonb := to_jsonb(new);
begin
  foreach col in array tg_argv loop
    v := j ->> col;
    if v is null or btrim(v) = '' then
      continue;
    end if;
    if tg_op = 'UPDATE' and (to_jsonb(old) ->> col) is not distinct from v then
      continue;
    end if;
    if not public.feed_text_is_clean(v) then
      raise exception 'feed_text_guard: community guidelines'
        using errcode = 'check_violation';
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.user_text_guard() from public, anon, authenticated;

do $$
declare
  spec  jsonb := jsonb_build_object(
    'feed_comments',          jsonb_build_array('body'),
    'chat_messages',          jsonb_build_array('content'),
    'posts',                  jsonb_build_array('content'),
    'course_boards_posts',    jsonb_build_array('title', 'body'),
    'industry_discussions',   jsonb_build_array('title', 'body'),
    'module_questions',       jsonb_build_array('question_text'),
    'module_answers',         jsonb_build_array('body'),
    'problems_posts',         jsonb_build_array('description'),
    'problem_solutions',      jsonb_build_array('body'),
    'campus_conversations',   jsonb_build_array('title', 'body'),
    'campus_suggestions',     jsonb_build_array('title', 'description'),
    'campus_pulse_responses', jsonb_build_array('content'),
    'college_reviews',        jsonb_build_array('review_text'),
    'accommodation_posts',    jsonb_build_array('title', 'description'),
    'carpool_routes',         jsonb_build_array('notes'),
    'campus_events',          jsonb_build_array('event_name', 'description', 'organiser'),
    'study_groups',           jsonb_build_array('subject'),
    'lost_found_posts',       jsonb_build_array('item_description'),
    'marketplace_listings',   jsonb_build_array('title', 'description'),
    'marketplace_skills',     jsonb_build_array('title', 'description'),
    'student_ads',            jsonb_build_array('title', 'description'),
    'ads',                    jsonb_build_array('title', 'description'),
    'clubs_societies',        jsonb_build_array('name', 'description'),
    'cross_ireland_projects', jsonb_build_array('title', 'description'),
    'project_collaborations', jsonb_build_array('title', 'description'),
    'shared_notes',           jsonb_build_array('title'),
    'peer_endorsements',      jsonb_build_array('custom_text'),
    'profiles',               jsonb_build_array('bio')
  );
  tbl   text;
  cols  text[];
  col   text;
  args  text;
  have  text[];
begin
  for tbl in select jsonb_object_keys(spec) loop
    if to_regclass(format('public.%I', tbl)) is null then
      raise notice 'user_text_guard: table public.% not found, skipped', tbl;
      continue;
    end if;

    select array_agg(c.column_name::text order by c.ordinal_position)
      into have
      from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = tbl
        and c.column_name in (select jsonb_array_elements_text(spec -> tbl));

    if have is null then
      raise notice 'user_text_guard: no matching columns on public.%, skipped', tbl;
      continue;
    end if;

    cols := have;
    select string_agg(format('%L', x), ', ') into args from unnest(cols) as x;

    execute format('drop trigger if exists trg_user_text_guard on public.%I', tbl);
    execute format(
      'create trigger trg_user_text_guard before insert or update of %s on public.%I '
      'for each row execute function public.user_text_guard(%s)',
      (select string_agg(format('%I', x), ', ') from unnest(cols) as x), tbl, args);
  end loop;
end $$;

-- Undo (run these, then drop the function):
--   drop trigger if exists trg_user_text_guard on public.feed_comments;
--   ... one per table in the list above ...
--   drop function public.user_text_guard();
