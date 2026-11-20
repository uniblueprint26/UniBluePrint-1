-- Changes: handle_new_user now saves the whole sign up (name, situation, date of birth, institution, course, year, trade, training provider, industry, interests, statuses, user type, discoverable, marketing consent) and records terms and privacy consent in legal_acknowledgements, all from signUp metadata. Destructive: no (replaces one function; existing rows untouched). Undo: re-create handle_new_user from the original body at the bottom of this file.
--
-- Why (F04, G3): the app wrote these fields from the client right after
-- signUp(). With email confirmation on there is no session yet, so every
-- write was denied silently: 0 legal_acknowledgements rows for 77 profiles and
-- 1 of 77 profiles with an institution. The trigger runs as the table owner
-- during the auth insert, so it does not depend on a session.
--
-- Needs 20261120000100_profiles_campus_community.sql applied first (new columns).
--
-- Metadata keys read (all optional except where noted):
--   full_name, marketing_consent, date_of_birth, referred_by_code (existing)
--   situation, user_type, discoverable, institution (or university), course,
--   year_of_study, trade, training_provider, industry, interests (array),
--   statuses (array), terms_version, privacy_version
--
-- Behaviour notes
--  * The 18 or over check is NOT in this function. It stays in
--    profiles_validate_date_of_birth, which fires on this insert and aborts
--    the sign up for a date of birth under 18. Unchanged.
--  * user_type must be one of student, apprentice, gap_year, worker. Anything
--    else (including the retired leaving_cert) is derived from situation, the
--    same mapping as app/src/constants/userTypes.js mapSituationToUserType.
--    So profiles_user_type_check cannot fail the sign up. G1 (adding
--    leaving_cert to that check) is deliberately NOT done: the product is 18+.
--  * Every optional value is parsed defensively and length capped, so bad or
--    hostile metadata can never make the sign up fail. Only the date of birth
--    check (above) and the required full table insert can abort it.
--  * A consent row is written only when the metadata carries the version
--    (terms_version, privacy_version). The app must send them (see the app
--    change note in the report). Nothing is recorded for a version we were not told.
--  * campus_community is filled by the profiles trigger from migration 0100.

create or replace function public._meta_text(p_meta jsonb, p_key text, p_max integer default 200)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(p_meta -> p_key) = 'string'
              then nullif(btrim(left(p_meta ->> p_key, p_max)), '')
         end;
$$;

create or replace function public._meta_text_array(p_meta jsonb, p_key text, p_max_items integer default 30, p_max_len integer default 80)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(p_meta -> p_key) = 'array'
    then coalesce(
      array(
        select left(btrim(t.e), p_max_len)
        from jsonb_array_elements_text(p_meta -> p_key) with ordinality as t(e, o)
        where btrim(t.e) <> ''
        order by t.o
        limit p_max_items
      ),
      '{}'::text[])
    else '{}'::text[]
  end;
$$;

revoke all on function public._meta_text(jsonb, text, integer) from public, anon, authenticated;
revoke all on function public._meta_text_array(jsonb, text, integer, integer) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_referrer_id uuid;
  v_code        text;
  v_dob         date;
  v_situation   text;
  v_user_type   text;
  v_terms       text;
  v_privacy     text;
begin
  begin
    v_dob := nullif(v_meta ->> 'date_of_birth', '')::date;
  exception when others then
    v_dob := null;
  end;

  v_situation := public._meta_text(v_meta, 'situation', 60);

  v_user_type := lower(coalesce(public._meta_text(v_meta, 'user_type', 30), ''));
  if v_user_type not in ('student', 'apprentice', 'gap_year', 'worker') then
    v_user_type := case v_situation
      when 'apprenticeship' then 'apprentice'
      when 'gap_year'       then 'gap_year'
      when 'working'        then 'worker'
      when 'recent_grad'    then 'worker'
      when 'other'          then 'worker'
      else 'student'
    end;
  end if;

  insert into public.profiles (
    id, full_name, marketing_consent, date_of_birth,
    user_type, situation, discoverable,
    institution, course, year_of_study,
    trade, training_provider, industry,
    interests, statuses
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    lower(coalesce(v_meta ->> 'marketing_consent', 'false')) = 'true',
    v_dob,
    v_user_type,
    v_situation,
    lower(coalesce(v_meta ->> 'discoverable', 'true')) <> 'false',
    coalesce(public._meta_text(v_meta, 'institution'), public._meta_text(v_meta, 'university')),
    public._meta_text(v_meta, 'course'),
    public._meta_text(v_meta, 'year_of_study', 60),
    public._meta_text(v_meta, 'trade'),
    public._meta_text(v_meta, 'training_provider'),
    public._meta_text(v_meta, 'industry'),
    public._meta_text_array(v_meta, 'interests'),
    public._meta_text_array(v_meta, 'statuses')
  );

  -- Versioned consent record (terms and privacy), written here so it does not
  -- depend on a client write before a session exists.
  v_terms   := public._meta_text(v_meta, 'terms_version', 40);
  v_privacy := public._meta_text(v_meta, 'privacy_version', 40);
  if v_terms is not null then
    insert into public.legal_acknowledgements (user_id, document_type, version)
    values (new.id, 'terms_of_service', v_terms);
  end if;
  if v_privacy is not null then
    insert into public.legal_acknowledgements (user_id, document_type, version)
    values (new.id, 'privacy_policy', v_privacy);
  end if;

  -- Referral attribution (unchanged).
  v_code := new.raw_user_meta_data ->> 'referred_by_code';
  if v_code is not null and length(trim(v_code)) > 0 then
    select id into v_referrer_id
      from public.profiles
      where referral_code = lower(trim(v_code));

    if v_referrer_id is not null and v_referrer_id <> new.id then
      insert into public.referrals (referrer_id, referred_user_id, referral_code)
      values (v_referrer_id, new.id, lower(trim(v_code)))
      on conflict (referred_user_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- Original body (production on 20 Nov 2026), for undo:
--   declare v_referrer_id uuid; v_code text;
--   begin
--     insert into public.profiles (id, full_name, marketing_consent, date_of_birth)
--     values (new.id, new.raw_user_meta_data->>'full_name',
--             coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
--             (new.raw_user_meta_data->>'date_of_birth')::date);
--     v_code := new.raw_user_meta_data->>'referred_by_code';
--     if v_code is not null and length(trim(v_code)) > 0 then
--       select id into v_referrer_id from public.profiles where referral_code = lower(trim(v_code));
--       if v_referrer_id is not null and v_referrer_id <> new.id then
--         insert into public.referrals (referrer_id, referred_user_id, referral_code)
--         values (v_referrer_id, new.id, lower(trim(v_code))) on conflict (referred_user_id) do nothing;
--       end if;
--     end if;
--     return new;
--   end;
