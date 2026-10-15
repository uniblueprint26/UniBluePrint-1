-- Referral / invite tracking — attribution only, no reward.
--
-- Scoped deliberately narrow: neither docs/business/subscription-pricing-
-- model.md nor docs/business/partner-tiering-framework.md mentions a
-- referral incentive (free month, discount, etc.), and nobody has decided
-- a reward amount. Inventing one here would be the same mistake as
-- guessing a coach-commission number — so this migration grants nothing.
-- It only records, durably, that one user signed up using another user's
-- code, for Outreach/growth visibility (e.g. "who's actually driving
-- signups"). If a real incentive gets decided later, it reads off this
-- same table — it doesn't need to be rebuilt.

-- 1. Every profile gets a short, permanent, user-facing referral code,
-- generated automatically rather than derived from anything personal
-- (name/email), so it's safe to put in a shareable link.
alter table public.profiles
  add column if not exists referral_code text;

create or replace function public.generate_referral_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  candidate text;
  tries int := 0;
begin
  loop
    candidate := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
    tries := tries + 1;
    if tries > 20 then
      raise exception 'generate_referral_code: could not find a unique code after % tries', tries;
    end if;
  end loop;
  return candidate;
end;
$$;

create or replace function public.set_referral_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.generate_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
  before insert on public.profiles
  for each row execute function public.set_referral_code();

-- Backfill every existing profile with its own code.
update public.profiles set referral_code = public.generate_referral_code()
  where referral_code is null;

alter table public.profiles
  alter column referral_code set not null;

alter table public.profiles
  add constraint profiles_referral_code_unique unique (referral_code);

comment on column public.profiles.referral_code is
  'Short, permanent, user-facing code for "share with friends" invite links (?ref=<code> on the website sign-up page, or typed into the app''s sign-up form). Generated once on profile creation by profiles_set_referral_code, never changes. Attribution only — see this migration''s header: using a code grants no reward.';

-- 2. Who invited whom. One row per successful signup that used a valid
-- code, written once at signup time by handle_new_user() below — never
-- updated afterwards. referred_user_id is unique: each person was referred
-- by at most one other person.
create table public.referrals (
  id                uuid        primary key default gen_random_uuid(),
  referrer_id       uuid        not null references public.profiles(id) on delete cascade,
  referred_user_id  uuid        not null unique references public.profiles(id) on delete cascade,
  referral_code     text        not null,
  created_at        timestamptz not null default now()
);

create index referrals_referrer_idx on public.referrals (referrer_id, created_at desc);

alter table public.referrals enable row level security;

-- A user can see the referrals they made (so the app can show "N friends
-- joined using your invite"). Nobody can see who referred them — that side
-- isn't shown anywhere, so there's no policy exposing it.
create policy "users_select_own_referrals_made"
  on public.referrals for select
  to authenticated
  using ((select auth.uid()) = referrer_id);

comment on table public.referrals is
  'Attribution only: referred_user_id signed up using referrer_id''s referral_code. No reward, discount, or billing effect is attached to a row existing here — see this migration''s header comment. Written once by handle_new_user() at signup, never updated.';

-- 3. Extend handle_new_user() to record the referral, if the new user
-- signed up with a code — passed through signUp()'s options.data the same
-- way marketing_consent and date_of_birth already are (raw_user_meta_data
-- ->> 'referred_by_code'). An unknown/mistyped code or a self-referral is
-- silently ignored: a referral code is a growth-visibility nicety, never
-- something that should block or error out account creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_code text;
begin
  insert into public.profiles (id, full_name, marketing_consent, date_of_birth)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
    (new.raw_user_meta_data->>'date_of_birth')::date
  );

  v_code := new.raw_user_meta_data->>'referred_by_code';
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
