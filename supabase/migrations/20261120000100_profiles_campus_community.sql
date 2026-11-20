-- Changes: adds profiles columns (situation, trade, training_provider, industry, campus_community), a campus_community auto-fill trigger, a one-off backfill of empty fields from sign up metadata, and a same_institution that compares campus_community. Destructive: no (additive; the backfill only fills NULLs). Undo: drop the trigger and function, drop the five columns, and restore same_institution to compare profiles.institution only (original body at the bottom of this file).
--
-- Why (F05, G7): Campus Connect posts are only visible to people whose
-- profiles.institution text is identical, and almost nobody has it filled
-- (1 of 77 profiles in production). Apprentices and workers have no
-- institution at all, so they could never see a campus post. Their trade,
-- training provider and industry only ever lived in auth user metadata.
--
-- Design choices
--  * profiles.campus_community is ONE text column. It is the group a person
--    sees Campus Connect posts for. It is filled automatically (trigger) from:
--      student, gap_year : institution
--      apprentice        : training_provider, then trade, then institution
--      worker            : industry, then institution
--    Training provider is first for apprentices because that is the place
--    they physically attend, which is the closest thing to a "campus".
--    Trade is the fallback so an apprentice who only picked a trade still
--    lands in a trade based group (CLAUDE.md: apprentices get a trade based
--    group, workers get one by industry). Change the order in
--    compute_campus_community() if the founder wants it the other way.
--  * The trigger only recomputes when one of its inputs changed and the
--    person did not set campus_community in the same update, so a manual or
--    app supplied value is never overwritten by an unrelated edit.
--  * same_institution() keeps its name and signature (feed_posts RLS calls
--    it). It now compares lower(trim(coalesce(campus_community, institution))),
--    so old rows that only have institution still work, and spacing or case
--    differences do not split a group. NULL or empty never matches.
--  * Course Connect is unaffected: it is nationwide and has no campus gate.
--
-- The app should also write institution, trade, training_provider and
-- industry to profiles (CampusGateModal and Edit Profile currently write only
-- to auth user metadata). The backfill below copies what is already in
-- metadata for existing members.

alter table public.profiles add column if not exists situation          text;
alter table public.profiles add column if not exists trade              text;
alter table public.profiles add column if not exists training_provider  text;
alter table public.profiles add column if not exists industry           text;
alter table public.profiles add column if not exists campus_community   text;

comment on column public.profiles.campus_community is
  'The Campus Connect group: institution (students, gap year), training provider or trade (apprentices) or industry (workers). Filled by trigger profiles_set_campus_community. Compared by same_institution().';

create or replace function public.compute_campus_community(
  p_user_type text,
  p_institution text,
  p_training_provider text,
  p_trade text,
  p_industry text
) returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(btrim(
    case p_user_type
      when 'apprentice' then coalesce(nullif(btrim(p_training_provider), ''), nullif(btrim(p_trade), ''), p_institution)
      when 'worker'     then coalesce(nullif(btrim(p_industry), ''), p_institution)
      else p_institution
    end
  ), '');
$$;

revoke all on function public.compute_campus_community(text, text, text, text, text) from public, anon;
grant execute on function public.compute_campus_community(text, text, text, text, text) to authenticated, service_role;

create or replace function public.profiles_set_campus_community()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.campus_community is null then
      new.campus_community := public.compute_campus_community(
        new.user_type, new.institution, new.training_provider, new.trade, new.industry);
    end if;
  elsif new.campus_community is not distinct from old.campus_community
    and (new.user_type, new.institution, new.training_provider, new.trade, new.industry)
        is distinct from
        (old.user_type, old.institution, old.training_provider, old.trade, old.industry)
  then
    new.campus_community := public.compute_campus_community(
      new.user_type, new.institution, new.training_provider, new.trade, new.industry);
  end if;
  return new;
end;
$$;

revoke all on function public.profiles_set_campus_community() from public, anon, authenticated;

drop trigger if exists profiles_set_campus_community on public.profiles;
create trigger profiles_set_campus_community
  before insert or update of user_type, institution, training_provider, trade, industry, campus_community
  on public.profiles
  for each row execute function public.profiles_set_campus_community();

-- Backfill 1: copy education and work details that exist only in auth user
-- metadata. Only fills columns that are NULL. Never overwrites.
update public.profiles p
set situation         = coalesce(p.situation,         left(nullif(btrim(u.raw_user_meta_data ->> 'situation'), ''), 60)),
    institution       = coalesce(p.institution,       left(nullif(btrim(coalesce(u.raw_user_meta_data ->> 'institution', u.raw_user_meta_data ->> 'university')), ''), 200)),
    course            = coalesce(p.course,            left(nullif(btrim(u.raw_user_meta_data ->> 'course'), ''), 200)),
    year_of_study     = coalesce(p.year_of_study,     left(nullif(btrim(u.raw_user_meta_data ->> 'year_of_study'), ''), 60)),
    trade             = coalesce(p.trade,             left(nullif(btrim(u.raw_user_meta_data ->> 'trade'), ''), 200)),
    training_provider = coalesce(p.training_provider, left(nullif(btrim(u.raw_user_meta_data ->> 'training_provider'), ''), 200)),
    industry          = coalesce(p.industry,          left(nullif(btrim(u.raw_user_meta_data ->> 'industry'), ''), 200))
from auth.users u
where u.id = p.id
  and u.raw_user_meta_data is not null
  and (
       (p.situation is null         and nullif(btrim(u.raw_user_meta_data ->> 'situation'), '') is not null)
    or (p.institution is null       and nullif(btrim(coalesce(u.raw_user_meta_data ->> 'institution', u.raw_user_meta_data ->> 'university')), '') is not null)
    or (p.course is null            and nullif(btrim(u.raw_user_meta_data ->> 'course'), '') is not null)
    or (p.year_of_study is null     and nullif(btrim(u.raw_user_meta_data ->> 'year_of_study'), '') is not null)
    or (p.trade is null             and nullif(btrim(u.raw_user_meta_data ->> 'trade'), '') is not null)
    or (p.training_provider is null and nullif(btrim(u.raw_user_meta_data ->> 'training_provider'), '') is not null)
    or (p.industry is null          and nullif(btrim(u.raw_user_meta_data ->> 'industry'), '') is not null)
  );

-- Backfill 2: set campus_community for everyone who has no value yet.
update public.profiles p
set campus_community = public.compute_campus_community(p.user_type, p.institution, p.training_provider, p.trade, p.industry)
where p.campus_community is null
  and public.compute_campus_community(p.user_type, p.institution, p.training_provider, p.trade, p.industry) is not null;

-- Campus Connect audience check. Same name, same signature, same grants.
create or replace function public.same_institution(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(lower(btrim(coalesce((select campus_community from profiles where id = a), (select institution from profiles where id = a)))), '')
    =
    nullif(lower(btrim(coalesce((select campus_community from profiles where id = b), (select institution from profiles where id = b)))), ''),
    false);
$$;

-- Original body, for undo:
--   select coalesce((select institution from profiles where id = a) = (select institution from profiles where id = b), false);
