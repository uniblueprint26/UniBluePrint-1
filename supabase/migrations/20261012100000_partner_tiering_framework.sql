-- UBP Partner Tiering Framework — infrastructure only.
--
-- Source of truth: docs/business/partner-tiering-framework.md (Finance,
-- Sept 2026). This migration builds the fields/storage/admin plumbing the
-- doc calls "genuinely net-new". It does NOT decide any of the six items
-- the doc's closing section assigns to Finance (exact tier thresholds,
-- review cadence, Option B negotiation authority, Signature calibration,
-- the A/B revenue-balance assumption, existing-partner transition
-- ownership) -- those stay open and this schema is built loose enough to
-- take whatever Finance decides without a rebuild:
--   * tier/payment_option are free-text + CHECK, not a Postgres enum, so
--     Finance can adjust the allowed set with an ALTER CONSTRAINT instead
--     of an enum migration.
--   * no threshold logic lives in the database -- tier is always a human
--     (Founder/Finance/Operations) judgment call via set_partner_tier(),
--     never computed from Size/Service/Pricing numbers.
--   * nothing here assumes who is allowed to negotiate a rate -- anyone
--     holding finance or founder can call record_negotiated_rate() today;
--     narrowing that to a named authority is a role-system question for
--     Finance to settle, not a guess for this migration to bake in.
--   * no review-cadence job is scheduled -- tier_set_at / updated_at exist
--     so a cadence can be built against them whenever Finance picks one.
--
-- Two new tables, both partner- and coach-scoped via entity_type/entity id
-- (the doc is explicit this covers Elevation coaches as well as Lifestyle
-- Blueprint businesses, and coaches live in coach_profiles, not partners):
--
--   partner_tier_assignments -- current tier / payment_option / founding
--     badge per partner or coach. One row per entity, upserted by admin
--     actions.
--
--   partner_negotiation_log -- append-only audit of every Option B rate
--     set or changed: who, when, what rate, and why. The doc calls this
--     documentation discipline "the single most load-bearing point for
--     Finance" -- so this is insert+select only, no update/delete policy
--     exists for it at all, making it structurally append-only.
--
-- Both tables follow the same access pattern this codebase already uses
-- for partner_performance_stats (20260810120100): RLS enabled, zero
-- policies, all table privileges revoked from anon/authenticated, and every
-- real access path goes through a SECURITY DEFINER function that does its
-- own role check. That is what lets record_negotiated_rate() and the admin
-- list function mask the negotiated rate itself to finance/founder only
-- while still letting operations (and founder/finance) manage tier,
-- payment_option and the founding badge through the same screen -- a
-- column-level distinction RLS alone can't express on one table.

-- ── 1. Tables ────────────────────────────────────────────────────────────

create table if not exists public.partner_tier_assignments (
  id                      uuid primary key default gen_random_uuid(),
  entity_type             text not null check (entity_type in ('partner', 'coach')),
  partner_id              uuid references public.partners(id) on delete cascade,
  coach_profile_id        uuid references public.coach_profiles(id) on delete cascade,

  tier                    text check (tier in ('access', 'plus', 'signature')), -- null = unassigned/unclassified
  tier_set_by             uuid references auth.users(id),
  tier_set_at             timestamptz,

  payment_option          text check (payment_option in ('fixed', 'negotiated')), -- null = not yet chosen/assigned
  payment_option_set_by   uuid references auth.users(id),
  payment_option_set_at   timestamptz,

  founding_badge          boolean not null default false,
  founding_badge_set_by   uuid references auth.users(id),
  founding_badge_set_at   timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  check (
    (entity_type = 'partner' and partner_id is not null and coach_profile_id is null)
    or
    (entity_type = 'coach' and coach_profile_id is not null and partner_id is null)
  )
);

create unique index if not exists partner_tier_assignments_partner_uidx
  on public.partner_tier_assignments (partner_id) where partner_id is not null;
create unique index if not exists partner_tier_assignments_coach_uidx
  on public.partner_tier_assignments (coach_profile_id) where coach_profile_id is not null;

comment on table public.partner_tier_assignments is
  'Current Access/Plus/Signature tier, Option A/B payment_option, and Founding Partner Badge per marketplace partner or Elevation coach. Row is upserted by admin actions (set_partner_tier / set_payment_option / set_founding_badge); never written by a partner/coach themselves. The three things are deliberately independent columns because the framework treats tier, payment option, and the founding badge as three separate questions.';
comment on column public.partner_tier_assignments.tier is
  'access | plus | signature | null (unassigned). Thresholds for what qualifies are a Finance decision not encoded here -- this column only stores the human judgment call once made.';
comment on column public.partner_tier_assignments.payment_option is
  'fixed (Option A, rent+commission per tier) | negotiated (Option B, 0/mo + negotiated %) | null (not yet chosen/assigned). The actual negotiated % lives in partner_negotiation_log, not here, because it is more sensitive than the A/B choice itself.';
comment on column public.partner_tier_assignments.founding_badge is
  'Timing-only badge: true if live before public launch. Entirely decoupled from tier/payment_option. No launch-date check is hardcoded here -- an admin/finance role sets this explicitly via set_founding_badge() since the doc gives no exact cutoff date. Roomy.ie and Course Compass are tool integrations, not marketplace partners, and should never get a row here.';

alter table public.partner_tier_assignments enable row level security;
-- No policies. All access goes through the SECURITY DEFINER functions
-- below, which perform their own role checks -- see header comment.
revoke all on public.partner_tier_assignments from public, anon, authenticated;

-- Dedicated updated_at trigger function (named distinctly rather than
-- reusing a project-wide one, in case none exists under that name).
create or replace function public.touch_partner_tier_assignments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger trg_partner_tier_assignments_updated_at
  before update on public.partner_tier_assignments
  for each row execute function public.touch_partner_tier_assignments_updated_at();

-- Append-only negotiation audit log. The doc frames this as THE most
-- load-bearing piece of the whole framework for fairness, so every
-- negotiated-rate event is recorded, never overwritten.
create table if not exists public.partner_negotiation_log (
  id                       uuid primary key default gen_random_uuid(),
  entity_type              text not null check (entity_type in ('partner', 'coach')),
  partner_id               uuid references public.partners(id) on delete cascade,
  coach_profile_id         uuid references public.coach_profiles(id) on delete cascade,

  negotiated_commission_pct numeric(5,2) not null check (negotiated_commission_pct >= 0 and negotiated_commission_pct <= 100),
  rationale                text not null check (length(trim(rationale)) > 0), -- documentation discipline: never optional
  effective_from           timestamptz not null default now(),

  recorded_by              uuid not null references auth.users(id),
  recorded_by_role_snapshot text, -- the role recorded_by held at the time, for a defensible audit trail even if roles change later
  created_at               timestamptz not null default now(),

  check (
    (entity_type = 'partner' and partner_id is not null and coach_profile_id is null)
    or
    (entity_type = 'coach' and coach_profile_id is not null and partner_id is null)
  )
);

create index if not exists partner_negotiation_log_partner_idx
  on public.partner_negotiation_log (partner_id, effective_from desc) where partner_id is not null;
create index if not exists partner_negotiation_log_coach_idx
  on public.partner_negotiation_log (coach_profile_id, effective_from desc) where coach_profile_id is not null;

comment on table public.partner_negotiation_log is
  'Append-only. One row per negotiated-rate event (set or changed), never updated or deleted -- no UPDATE/DELETE policy exists for this table, by design, so Finance has a real system of record defending every Option B rate as consistent rather than tribal knowledge or favoritism. The current rate for an entity is its most recent row by effective_from. Access is finance/founder only (see record_negotiated_rate() and get_partner_tier_admin_list()) -- not even operations reads the rate directly, per the framework doc.';
comment on column public.partner_negotiation_log.rationale is
  'Required, non-empty. The documentation discipline the framework doc calls the single most important piece of the whole thing -- a rate with no rationale on file is not a valid Option B record.';

alter table public.partner_negotiation_log enable row level security;
-- No policies at all, including none for UPDATE/DELETE -- that absence is
-- what makes the table structurally append-only even to roles that could
-- otherwise manage it. All access is through record_negotiated_rate()
-- (insert) and the read-side functions below (select).
revoke all on public.partner_negotiation_log from public, anon, authenticated;

-- ── 2. Helpers ───────────────────────────────────────────────────────────

create or replace function public.is_finance_or_founder(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'finance') or public.has_role(_user_id, 'founder')
$$;

create or replace function public.is_partner_tier_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'finance')
      or public.has_role(_user_id, 'founder')
      or public.has_role(_user_id, 'operations')
$$;

grant execute on function public.is_finance_or_founder(uuid) to authenticated;
grant execute on function public.is_partner_tier_admin(uuid) to authenticated;

-- ── 3. Partner-facing read: a partner/coach sees only their OWN terms ──────

create or replace function public.get_my_tier_status()
returns table (
  entity_type               text,
  entity_id                 uuid,
  tier                      text,
  payment_option            text,
  founding_badge            boolean,
  negotiated_commission_pct numeric,
  negotiated_rationale      text,
  negotiated_effective_from timestamptz
)
language sql stable security definer set search_path = public as $$
  -- Business-role partners, via partner_users (a user can be linked to more
  -- than one partner, same shape as get_my_partner_stats()).
  select
    'partner'::text, pu.partner_id,
    pta.tier, pta.payment_option, coalesce(pta.founding_badge, false),
    nl.negotiated_commission_pct, nl.rationale, nl.effective_from
  from public.partner_users pu
  left join public.partner_tier_assignments pta on pta.partner_id = pu.partner_id
  left join lateral (
    select l.negotiated_commission_pct, l.rationale, l.effective_from
    from public.partner_negotiation_log l
    where l.partner_id = pu.partner_id
    order by l.effective_from desc, l.created_at desc
    limit 1
  ) nl on true
  where pu.user_id = auth.uid()

  union all

  -- Coaches, via coach_profiles.user_id.
  select
    'coach'::text, cp.id,
    pta.tier, pta.payment_option, coalesce(pta.founding_badge, false),
    nl.negotiated_commission_pct, nl.rationale, nl.effective_from
  from public.coach_profiles cp
  left join public.partner_tier_assignments pta on pta.coach_profile_id = cp.id
  left join lateral (
    select l.negotiated_commission_pct, l.rationale, l.effective_from
    from public.partner_negotiation_log l
    where l.coach_profile_id = cp.id
    order by l.effective_from desc, l.created_at desc
    limit 1
  ) nl on true
  where cp.user_id = auth.uid()
$$;

comment on function public.get_my_tier_status() is
  'Returns the calling users own tier/payment_option/founding_badge/negotiated rate -- one row per partner or coach record they are linked to. Structurally cannot return another entitys row: it only ever joins through partner_users.user_id = auth.uid() or coach_profiles.user_id = auth.uid().';

grant execute on function public.get_my_tier_status() to authenticated;

-- ── 4. Admin writes: tier / payment_option / founding badge ────────────────
-- All three: founder, finance, or operations. The doc explicitly lists
-- Founder/Finance/Operations as the admin audience for this tooling; the
-- more sensitive negotiated-RATE value is handled separately in section 5,
-- restricted further to finance/founder only.

create or replace function public.set_partner_tier(_entity_type text, _entity_id uuid, _tier text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_partner_tier_admin(auth.uid()) then
    raise exception 'Not authorized to set partner tier.';
  end if;
  if _tier is not null and _tier not in ('access', 'plus', 'signature') then
    raise exception 'Invalid tier: %', _tier;
  end if;
  if _entity_type not in ('partner', 'coach') then
    raise exception 'Invalid entity_type: %', _entity_type;
  end if;

  -- Partial unique indexes on partner_id and coach_profile_id each only
  -- cover their own column, so the upsert branches per entity_type rather
  -- than sharing one ON CONFLICT target (mirrors set_payment_option /
  -- set_founding_badge below).
  if _entity_type = 'partner' then
    insert into public.partner_tier_assignments (entity_type, partner_id, tier, tier_set_by, tier_set_at)
    values (_entity_type, _entity_id, _tier, auth.uid(), now())
    on conflict (partner_id) where partner_id is not null
      do update set tier = excluded.tier, tier_set_by = excluded.tier_set_by, tier_set_at = excluded.tier_set_at;
  else
    insert into public.partner_tier_assignments (entity_type, coach_profile_id, tier, tier_set_by, tier_set_at)
    values (_entity_type, _entity_id, _tier, auth.uid(), now())
    on conflict (coach_profile_id) where coach_profile_id is not null
      do update set tier = excluded.tier, tier_set_by = excluded.tier_set_by, tier_set_at = excluded.tier_set_at;
  end if;
end; $$;

create or replace function public.set_payment_option(_entity_type text, _entity_id uuid, _payment_option text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_partner_tier_admin(auth.uid()) then
    raise exception 'Not authorized to set payment option.';
  end if;
  if _payment_option is not null and _payment_option not in ('fixed', 'negotiated') then
    raise exception 'Invalid payment_option: %', _payment_option;
  end if;
  if _entity_type not in ('partner', 'coach') then
    raise exception 'Invalid entity_type: %', _entity_type;
  end if;

  if _entity_type = 'partner' then
    insert into public.partner_tier_assignments (entity_type, partner_id, payment_option, payment_option_set_by, payment_option_set_at)
    values (_entity_type, _entity_id, _payment_option, auth.uid(), now())
    on conflict (partner_id) where partner_id is not null
      do update set payment_option = excluded.payment_option, payment_option_set_by = excluded.payment_option_set_by, payment_option_set_at = excluded.payment_option_set_at;
  else
    insert into public.partner_tier_assignments (entity_type, coach_profile_id, payment_option, payment_option_set_by, payment_option_set_at)
    values (_entity_type, _entity_id, _payment_option, auth.uid(), now())
    on conflict (coach_profile_id) where coach_profile_id is not null
      do update set payment_option = excluded.payment_option, payment_option_set_by = excluded.payment_option_set_by, payment_option_set_at = excluded.payment_option_set_at;
  end if;
end; $$;

create or replace function public.set_founding_badge(_entity_type text, _entity_id uuid, _granted boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_partner_tier_admin(auth.uid()) then
    raise exception 'Not authorized to set founding badge.';
  end if;
  if _entity_type not in ('partner', 'coach') then
    raise exception 'Invalid entity_type: %', _entity_type;
  end if;

  if _entity_type = 'partner' then
    insert into public.partner_tier_assignments (entity_type, partner_id, founding_badge, founding_badge_set_by, founding_badge_set_at)
    values (_entity_type, _entity_id, _granted, auth.uid(), now())
    on conflict (partner_id) where partner_id is not null
      do update set founding_badge = excluded.founding_badge, founding_badge_set_by = excluded.founding_badge_set_by, founding_badge_set_at = excluded.founding_badge_set_at;
  else
    insert into public.partner_tier_assignments (entity_type, coach_profile_id, founding_badge, founding_badge_set_by, founding_badge_set_at)
    values (_entity_type, _entity_id, _granted, auth.uid(), now())
    on conflict (coach_profile_id) where coach_profile_id is not null
      do update set founding_badge = excluded.founding_badge, founding_badge_set_by = excluded.founding_badge_set_by, founding_badge_set_at = excluded.founding_badge_set_at;
  end if;
end; $$;

grant execute on function public.set_partner_tier(text, uuid, text) to authenticated;
grant execute on function public.set_payment_option(text, uuid, text) to authenticated;
grant execute on function public.set_founding_badge(text, uuid, boolean) to authenticated;

-- ── 5. Negotiated rate: write + read, finance/founder only ─────────────────

create or replace function public.record_negotiated_rate(
  _entity_type text,
  _entity_id uuid,
  _negotiated_commission_pct numeric,
  _rationale text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_log_id uuid;
begin
  if not public.is_finance_or_founder(auth.uid()) then
    raise exception 'Only finance or founder can record a negotiated rate.';
  end if;
  if _entity_type not in ('partner', 'coach') then
    raise exception 'Invalid entity_type: %', _entity_type;
  end if;
  if _negotiated_commission_pct is null or _negotiated_commission_pct < 0 or _negotiated_commission_pct > 100 then
    raise exception 'negotiated_commission_pct must be between 0 and 100.';
  end if;
  if _rationale is null or length(trim(_rationale)) = 0 then
    raise exception 'A rationale is required to record a negotiated rate.';
  end if;

  v_role := case
    when public.has_role(auth.uid(), 'founder') then 'founder'
    when public.has_role(auth.uid(), 'finance') then 'finance'
    else null
  end;

  insert into public.partner_negotiation_log (
    entity_type, partner_id, coach_profile_id,
    negotiated_commission_pct, rationale, recorded_by, recorded_by_role_snapshot
  ) values (
    _entity_type,
    case when _entity_type = 'partner' then _entity_id end,
    case when _entity_type = 'coach' then _entity_id end,
    _negotiated_commission_pct, trim(_rationale), auth.uid(), v_role
  )
  returning id into v_log_id;

  -- Keep payment_option consistent: recording a negotiated rate means this
  -- entity is on Option B.
  perform public.set_payment_option(_entity_type, _entity_id, 'negotiated');

  return v_log_id;
end; $$;

comment on function public.record_negotiated_rate(text, uuid, numeric, text) is
  'Finance/founder only. Appends a new negotiation event -- never updates a prior one. Also marks the entity as payment_option = negotiated for consistency. Who may actually exercise this (negotiation authority) is an open Finance decision per the framework doc; today anyone holding finance or founder can call it, and narrowing that further is a role-system change for Finance to make later, not something this migration guesses at.';

grant execute on function public.record_negotiated_rate(text, uuid, numeric, text) to authenticated;

create or replace function public.get_negotiation_history(_entity_type text, _entity_id uuid)
returns setof public.partner_negotiation_log
language sql stable security definer set search_path = public as $$
  select l.* from public.partner_negotiation_log l
  where public.is_finance_or_founder(auth.uid())
    and l.entity_type = _entity_type
    and (
      (_entity_type = 'partner' and l.partner_id = _entity_id)
      or (_entity_type = 'coach' and l.coach_profile_id = _entity_id)
    )
  order by l.effective_from desc, l.created_at desc
$$;

comment on function public.get_negotiation_history(text, uuid) is
  'Full append-only negotiation history for one entity. Finance/founder only -- the full history (not just the current rate) is what makes a rate defensible as consistent rather than favoritism.';

grant execute on function public.get_negotiation_history(text, uuid) to authenticated;

-- ── 6. Admin listing for the Founder/Finance/Operations screens ────────────
-- One row per partner + one row per coach. negotiated_commission_pct and
-- negotiated_rationale are NULL for any caller who is not finance/founder,
-- even though tier/payment_option/founding_badge are visible to operations
-- too -- this is the column-level split RLS alone can't express, done here
-- inside the function instead.

create or replace function public.get_partner_tier_admin_list()
returns table (
  entity_type               text,
  entity_id                 uuid,
  display_name              text,
  category                  text,
  is_active                 boolean,
  tier                      text,
  tier_set_at               timestamptz,
  payment_option            text,
  negotiated_commission_pct numeric,
  negotiated_rationale      text,
  negotiated_effective_from timestamptz,
  founding_badge            boolean,
  founding_badge_set_at     timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_can_see_rate boolean;
begin
  if not public.is_partner_tier_admin(auth.uid()) then
    return;
  end if;
  v_can_see_rate := public.is_finance_or_founder(auth.uid());

  return query
  select
    'partner'::text, p.id, p.name, p.type, p.active,
    pta.tier, pta.tier_set_at,
    pta.payment_option,
    case when v_can_see_rate then nl.negotiated_commission_pct else null end,
    case when v_can_see_rate then nl.rationale else null end,
    case when v_can_see_rate then nl.effective_from else null end,
    coalesce(pta.founding_badge, false), pta.founding_badge_set_at
  from public.partners p
  left join public.partner_tier_assignments pta on pta.partner_id = p.id
  left join lateral (
    select l.negotiated_commission_pct, l.rationale, l.effective_from
    from public.partner_negotiation_log l
    where l.partner_id = p.id
    order by l.effective_from desc, l.created_at desc
    limit 1
  ) nl on true

  union all

  select
    'coach'::text, cp.id, coalesce(prof.full_name, cp.coach_slug, 'Coach'), cp.specialisation, cp.available,
    pta.tier, pta.tier_set_at,
    pta.payment_option,
    case when v_can_see_rate then nl.negotiated_commission_pct else null end,
    case when v_can_see_rate then nl.rationale else null end,
    case when v_can_see_rate then nl.effective_from else null end,
    coalesce(pta.founding_badge, false), pta.founding_badge_set_at
  from public.coach_profiles cp
  left join public.profiles prof on prof.id = cp.user_id
  left join public.partner_tier_assignments pta on pta.coach_profile_id = cp.id
  left join lateral (
    select l.negotiated_commission_pct, l.rationale, l.effective_from
    from public.partner_negotiation_log l
    where l.coach_profile_id = cp.id
    order by l.effective_from desc, l.created_at desc
    limit 1
  ) nl on true

  order by 1, 3;
end; $$;

comment on function public.get_partner_tier_admin_list() is
  'Founder/Finance/Operations admin listing of every partner and coach with their current tier/payment_option/founding_badge. negotiated_commission_pct and negotiated_rationale come back NULL for an Operations caller even though the row underneath has a value -- finance/founder only see the actual rate, per the frameworks sensitivity requirement.';

grant execute on function public.get_partner_tier_admin_list() to authenticated;
