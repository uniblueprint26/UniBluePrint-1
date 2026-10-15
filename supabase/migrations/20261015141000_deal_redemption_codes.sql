-- Lifestyle Blueprint: per-deal, regenerating, time-limited redemption code
-- shown at the moment of claiming/paying for a deal in person (founder
-- decision, Oct 2026 — part 3 of 3, see also 20261015140000_partner_follows.sql
-- and 20261015140500_partner_follow_notifications.sql).
--
-- ═══ Why this is a genuinely new mechanic, not an extension of claiming ═══
-- There is no deal-redemption system in this codebase today. "Claiming" a
-- deal currently just means unlocking the partner's contact info (email/
-- phone/social) via get_lifestyle_partner_contact() — see
-- 20261012181500_lifestyle_partner_contact_details.sql's own header for the
-- browse/claim split this reuses below. There is also no partner-side
-- scanning app or portal: a partner only ever looks at this code with their
-- own eyes (a cashier reading a phone screen), never verifies it against a
-- backend. That is a real, deliberate limitation, not an oversight — see
-- the app-side RedemptionCodeSheet component's own header comment for how
-- the UI compensates (showing the account holder's name + photo alongside
-- the code so a shared screenshot visibly doesn't match whoever is holding
-- the phone).
--
-- ═══ Why deal_id references public.deals, and the lazy-provision step ═══
-- public.deals (title, description, discount_percent, valid_until, active)
-- is the schema's real "deal" entity, and is the right thing for a
-- redemption code to reference — but today it only holds rows for 6 old
-- demo partners seeded in 20260606140000_seed_lifestyle.sql (Iron Campus
-- Gym, DriveReady, The Daily Grind Cafe, FreshFade Barbers, MindSpace
-- Wellbeing, Student Essentials). None of the 20 real Lifestyle Blueprint
-- partners added since (MPFitness, Nyz3ditz, etc. — seeded by
-- 20261012181500_lifestyle_partner_contact_details.sql) have a deals row:
-- their one advertised deal per partner lives only as a static `deal`
-- string in app/src/data/lifestylePartners.js, never written to this
-- table. Requiring a real deals row to already exist before a code could
-- be generated would make this feature work for zero of the partners
-- actually shown in the live Explore UI today.
--
-- generate_deal_redemption_code() below therefore finds-or-creates a deals
-- row for the partner's current advertised deal (title passed in by the
-- client from the same static string PartnerCards.jsx already renders),
-- tagged auto_created = true so the new-deal-notification trigger
-- (20261015140500_partner_follow_notifications.sql) correctly ignores this
-- bootstrap step rather than telling followers about a "new deal" that's
-- actually the same one they've already seen on the listing. Reuses
-- deals_partner_title_key (partner_id, title unique — added by the
-- original seed migration) as the find-or-create key, so repeat taps for
-- the same partner/deal text reuse the same deal_id rather than
-- multiplying rows.
--
-- ═══ Validity window ═══════════════════════════════════════════════════════
-- 90 seconds: long enough for a student to tap "Show code", hand the phone
-- to a cashier, and have them read/key in a 6-digit number, but short
-- enough that a screenshot taken and sent to a friend is visibly expired
-- by the time that friend could act on it. A fresh call regenerates a new
-- code and invalidates whatever was still valid before it, so there is
-- never more than one valid code per (user, deal) at a time.
--
-- ═══ Code format ═══════════════════════════════════════════════════════════
-- Plain 6-digit numeric (zero-padded), not a QR image: app/package.json has
-- no QR-rendering library (checked — only react-native-svg, which draws
-- shapes but doesn't encode QR data on its own) and this task doesn't add
-- a new dependency for it. A large, clearly-legible number with a visible
-- countdown is the deliberate fallback — see RedemptionCodeSheet.jsx.
--
-- ═══ Why no update/insert RLS policy ═══════════════════════════════════════
-- Every write happens inside this SECURITY DEFINER function, as auth.uid()
-- — a student can read their own codes (not that the app needs to; the RPC
-- already returns the code it just created) but can never INSERT/UPDATE a
-- row directly, which would otherwise let them forge an unexpired code for
-- themselves. used_at stays null forever under current scope (no
-- partner-side verification exists to ever set it) — it's there so a
-- future partner-verification feature has a real column to write to,
-- per the founder's explicit scoping of that as out of scope for now.

create table if not exists public.deal_redemption_codes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  deal_id      uuid not null references public.deals(id) on delete cascade,
  code         text not null,
  generated_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  used_at      timestamptz
);

create index if not exists idx_deal_redemption_codes_user_deal
  on public.deal_redemption_codes (user_id, deal_id, expires_at);

alter table public.deal_redemption_codes enable row level security;

create policy "users_read_own_redemption_codes"
  on public.deal_redemption_codes for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.generate_deal_redemption_code(
  _partner_slug text,
  _deal_label   text default null
)
returns table (
  code          text,
  deal_id       uuid,
  generated_at  timestamptz,
  expires_at    timestamptz,
  requires_pro  boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _partner_id   uuid;
  _requires_pro boolean;
  _deal_id      uuid;
  _label        text;
  _code         text;
  _now          timestamptz := now();
  _expires      timestamptz;
begin
  select p.id into _partner_id from public.partners p where p.partner_slug = _partner_slug;
  if _partner_id is null then
    return; -- unknown partner slug — nothing to generate
  end if;

  -- Reuse the exact same browse/claim access decision
  -- get_lifestyle_partner_contact() already makes (Pro, Mental Health,
  -- Founder/Operations, or the partner's own linked business account)
  -- instead of re-deriving that boolean here. A caller with no access
  -- never gets a deal_id or code — refusal, not just a withheld display.
  select g.requires_pro into _requires_pro
  from public.get_lifestyle_partner_contact(_partner_slug) g;

  if coalesce(_requires_pro, true) then
    return query select null::text, null::uuid, null::timestamptz, null::timestamptz, true;
    return;
  end if;

  _label := coalesce(_deal_label, 'Member Deal');

  insert into public.deals (partner_id, title, description, active, auto_created)
  values (_partner_id, _label, _label, true, true)
  on conflict (partner_id, title) do update set active = true
  returning id into _deal_id;

  -- Invalidate any still-valid prior code for this (user, deal) pair before
  -- issuing a new one — never more than one valid code at a time. Columns
  -- qualified with the drc alias throughout: this function's RETURNS TABLE
  -- declares OUT params named deal_id/expires_at (same names as this
  -- table's columns), which Postgres otherwise reports as ambiguous
  -- (confirmed live — error 42702 — while verifying this migration).
  update public.deal_redemption_codes drc
  set expires_at = _now
  where drc.user_id = auth.uid()
    and drc.deal_id = _deal_id
    and drc.used_at is null
    and drc.expires_at > _now;

  _code := lpad(floor(random() * 1000000)::int::text, 6, '0');
  _expires := _now + interval '90 seconds';

  insert into public.deal_redemption_codes (user_id, deal_id, code, generated_at, expires_at)
  values (auth.uid(), _deal_id, _code, _now, _expires);

  return query select _code, _deal_id, _now, _expires, false;
end;
$$;

revoke all on function public.generate_deal_redemption_code(text, text) from public;
grant execute on function public.generate_deal_redemption_code(text, text) to authenticated;
