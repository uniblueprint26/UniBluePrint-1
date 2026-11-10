-- UBP Partner Tiering Framework — tier/payment-option/badge change log.
--
-- Gap against docs/business/partner-tiering-framework.md's "genuinely
-- net-new needed" list: 20261012104351_partner_tiering_framework already
-- gives admin tooling to assign a tier/payment_option/founding_badge
-- (set_partner_tier / set_payment_option / set_founding_badge), and an
-- append-only audit log for Option B negotiated-rate events
-- (partner_negotiation_log). It does NOT keep a history of the
-- tier/payment_option/founding_badge assignments themselves — each is a
-- plain upsert onto partner_tier_assignments, so only the latest value and
-- its tier_set_at/payment_option_set_at/founding_badge_set_at survive; an
-- admin who changes a partner from Access to Plus and back leaves no trace
-- of the intermediate state. This migration adds that missing "who changed
-- what, when" log, insert-only, same structural pattern as
-- partner_negotiation_log (RLS enabled, zero policies, no UPDATE/DELETE
-- path exists for any role — access only through the SECURITY DEFINER
-- functions below).
--
-- Unlike the negotiated-rate log, this one is visible to Operations too
-- (not just finance/founder) — tier/payment_option/founding_badge are
-- already visible to Operations via get_partner_tier_admin_list(); only the
-- negotiated % itself is the more sensitive figure kept finance/founder-only.

create table if not exists public.tier_change_log (
  id                       uuid primary key default gen_random_uuid(),
  entity_type              text not null check (entity_type in ('partner', 'coach')),
  entity_id                uuid not null,
  field                    text not null check (field in ('tier', 'payment_option', 'founding_badge')),
  old_value                text,
  new_value                text,
  changed_by               uuid not null references auth.users(id),
  changed_by_role_snapshot text, -- the role changed_by held at the time, same defensibility reasoning as partner_negotiation_log.recorded_by_role_snapshot
  created_at               timestamptz not null default now()
);

create index if not exists tier_change_log_entity_idx
  on public.tier_change_log (entity_type, entity_id, created_at desc);

comment on table public.tier_change_log is
  'Append-only. One row per tier/payment_option/founding_badge change made via set_partner_tier / set_payment_option / set_founding_badge — never updated or deleted, no UPDATE/DELETE policy exists for this table at all. Lets an admin screen show "who changed this, and when" instead of only the latest value on partner_tier_assignments. Visible to any partner-tier admin (founder/finance/operations) via get_tier_change_log() — unlike partner_negotiation_log, this is not restricted to finance/founder, since the fields it tracks are already visible to Operations on the roster itself.';

alter table public.tier_change_log enable row level security;
revoke all on public.tier_change_log from public, anon, authenticated;

-- ── Re-point the three admin-write functions to also log the change ───────
-- create or replace keeps the same signature/grants from the original
-- migration; only the body changes, to capture old_value before the upsert
-- and insert a tier_change_log row after it.

create or replace function public.set_partner_tier(_entity_type text, _entity_id uuid, _tier text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old_tier text;
  v_role text;
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

  if _entity_type = 'partner' then
    select tier into v_old_tier from public.partner_tier_assignments where partner_id = _entity_id;
    insert into public.partner_tier_assignments (entity_type, partner_id, tier, tier_set_by, tier_set_at)
    values (_entity_type, _entity_id, _tier, auth.uid(), now())
    on conflict (partner_id) where partner_id is not null
      do update set tier = excluded.tier, tier_set_by = excluded.tier_set_by, tier_set_at = excluded.tier_set_at;
  else
    select tier into v_old_tier from public.partner_tier_assignments where coach_profile_id = _entity_id;
    insert into public.partner_tier_assignments (entity_type, coach_profile_id, tier, tier_set_by, tier_set_at)
    values (_entity_type, _entity_id, _tier, auth.uid(), now())
    on conflict (coach_profile_id) where coach_profile_id is not null
      do update set tier = excluded.tier, tier_set_by = excluded.tier_set_by, tier_set_at = excluded.tier_set_at;
  end if;

  if v_old_tier is distinct from _tier then
    v_role := case
      when public.has_role(auth.uid(), 'founder') then 'founder'
      when public.has_role(auth.uid(), 'finance') then 'finance'
      when public.has_role(auth.uid(), 'operations') then 'operations'
      else null
    end;
    insert into public.tier_change_log (entity_type, entity_id, field, old_value, new_value, changed_by, changed_by_role_snapshot)
    values (_entity_type, _entity_id, 'tier', v_old_tier, _tier, auth.uid(), v_role);
  end if;
end; $$;

create or replace function public.set_payment_option(_entity_type text, _entity_id uuid, _payment_option text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old_option text;
  v_role text;
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
    select payment_option into v_old_option from public.partner_tier_assignments where partner_id = _entity_id;
    insert into public.partner_tier_assignments (entity_type, partner_id, payment_option, payment_option_set_by, payment_option_set_at)
    values (_entity_type, _entity_id, _payment_option, auth.uid(), now())
    on conflict (partner_id) where partner_id is not null
      do update set payment_option = excluded.payment_option, payment_option_set_by = excluded.payment_option_set_by, payment_option_set_at = excluded.payment_option_set_at;
  else
    select payment_option into v_old_option from public.partner_tier_assignments where coach_profile_id = _entity_id;
    insert into public.partner_tier_assignments (entity_type, coach_profile_id, payment_option, payment_option_set_by, payment_option_set_at)
    values (_entity_type, _entity_id, _payment_option, auth.uid(), now())
    on conflict (coach_profile_id) where coach_profile_id is not null
      do update set payment_option = excluded.payment_option, payment_option_set_by = excluded.payment_option_set_by, payment_option_set_at = excluded.payment_option_set_at;
  end if;

  if v_old_option is distinct from _payment_option then
    v_role := case
      when public.has_role(auth.uid(), 'founder') then 'founder'
      when public.has_role(auth.uid(), 'finance') then 'finance'
      when public.has_role(auth.uid(), 'operations') then 'operations'
      else null
    end;
    insert into public.tier_change_log (entity_type, entity_id, field, old_value, new_value, changed_by, changed_by_role_snapshot)
    values (_entity_type, _entity_id, 'payment_option', v_old_option, _payment_option, auth.uid(), v_role);
  end if;
end; $$;

create or replace function public.set_founding_badge(_entity_type text, _entity_id uuid, _granted boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old_badge boolean;
  v_role text;
begin
  if not public.is_partner_tier_admin(auth.uid()) then
    raise exception 'Not authorized to set founding badge.';
  end if;
  if _entity_type not in ('partner', 'coach') then
    raise exception 'Invalid entity_type: %', _entity_type;
  end if;

  if _entity_type = 'partner' then
    select founding_badge into v_old_badge from public.partner_tier_assignments where partner_id = _entity_id;
    insert into public.partner_tier_assignments (entity_type, partner_id, founding_badge, founding_badge_set_by, founding_badge_set_at)
    values (_entity_type, _entity_id, _granted, auth.uid(), now())
    on conflict (partner_id) where partner_id is not null
      do update set founding_badge = excluded.founding_badge, founding_badge_set_by = excluded.founding_badge_set_by, founding_badge_set_at = excluded.founding_badge_set_at;
  else
    select founding_badge into v_old_badge from public.partner_tier_assignments where coach_profile_id = _entity_id;
    insert into public.partner_tier_assignments (entity_type, coach_profile_id, founding_badge, founding_badge_set_by, founding_badge_set_at)
    values (_entity_type, _entity_id, _granted, auth.uid(), now())
    on conflict (coach_profile_id) where coach_profile_id is not null
      do update set founding_badge = excluded.founding_badge, founding_badge_set_by = excluded.founding_badge_set_by, founding_badge_set_at = excluded.founding_badge_set_at;
  end if;

  if coalesce(v_old_badge, false) is distinct from _granted then
    v_role := case
      when public.has_role(auth.uid(), 'founder') then 'founder'
      when public.has_role(auth.uid(), 'finance') then 'finance'
      when public.has_role(auth.uid(), 'operations') then 'operations'
      else null
    end;
    insert into public.tier_change_log (entity_type, entity_id, field, old_value, new_value, changed_by, changed_by_role_snapshot)
    values (_entity_type, _entity_id, 'founding_badge', coalesce(v_old_badge, false)::text, _granted::text, auth.uid(), v_role);
  end if;
end; $$;

-- ── Read: any partner-tier admin (founder/finance/operations) ─────────────

create or replace function public.get_tier_change_log(_entity_type text, _entity_id uuid)
returns setof public.tier_change_log
language sql stable security definer set search_path = public as $$
  select l.* from public.tier_change_log l
  where public.is_partner_tier_admin(auth.uid())
    and l.entity_type = _entity_type
    and l.entity_id = _entity_id
  order by l.created_at desc
$$;

comment on function public.get_tier_change_log(text, uuid) is
  'Full change history (tier, payment_option, founding_badge) for one partner or coach. Any partner-tier admin — founder/finance/operations — not restricted to finance/founder, matching get_partner_tier_admin_list() visibility for these same fields.';

grant execute on function public.get_tier_change_log(text, uuid) to authenticated;
