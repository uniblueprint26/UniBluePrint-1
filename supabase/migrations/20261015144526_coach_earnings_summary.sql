-- Coach earnings view: what a coach is owed from student payments the
-- PLATFORM now collects directly (create-coach-checkout-session /
-- coach_payments, 20261015014215) — the gap explicitly flagged when that
-- work landed: "nothing computes, stores, or displays what a coach is owed
-- from it."
--
-- Reuse check done first, live, via Supabase MCP (not assumed from the
-- docs): commission_declarations and partner_payouts DO already exist, but
-- neither fits —
--   * commission_declarations is Foundation Handler commission
--     (handler_id/submission_id columns) — nothing to do with coaches.
--   * partner_payouts.partner_id is a hard FK to partners(id) only — the
--     Lifestyle Blueprint partners table, not coach_profiles. A coach has
--     no row there and the FK means it can't be repurposed without a
--     migration of its own, which would duplicate the Partner Tiering
--     System agent's live work on partner_tier_assignments /
--     partner_negotiation_log (20261012104351_partner_tiering_framework).
-- So this is new, narrow, read-your-own infrastructure, in the same shape
-- as that migration's own get_my_tier_status() — SECURITY DEFINER, no
-- table RLS policy needed, entity resolved only via coach_profiles.user_id
-- = auth.uid(), so it is structurally impossible for a coach to read
-- another coach's figures.
--
-- Commission math is the Coach Agreement's locked numbers
-- (docs/business/partner-tiering-framework.md):
--   Access + Option A (fixed)  -> coach keeps 90% (10% commission)
--   Plus   + Option A (fixed)  -> coach keeps 92% (8% commission)
--   Option B (negotiated)      -> rate comes from partner_negotiation_log's
--                                  latest row for this coach (already
--                                  visible to the coach themselves via
--                                  get_my_tier_status, so nothing new is
--                                  exposed by reusing it here)
--   Signature tier, or tier/payment_option not yet assigned, or Option B
--   chosen but no negotiated rate logged yet -> no rate exists to apply.
--   Never guessed — commission_pct and coach_share_cents both come back
--   null and pending_tier_assignment is true, so the UI shows the gross
--   amount with an honest "pending tier assignment" label instead of a
--   fabricated split.
--
-- Payout tracking: nothing in this schema tracks an actual transfer to a
-- coach (no Stripe Connect, no coach-scoped payout table — partner_payouts
-- is partners-only, see above). This function does not invent one; it
-- returns only the computed-owed figure, and the UI says plainly that
-- payout itself is handled outside the app for now.

create or replace function public.get_my_coach_earnings()
returns table (
  coach_slug              text,
  total_collected_cents   bigint,
  paid_bookings_count     integer,
  tier                    text,
  payment_option          text,
  commission_pct          numeric,
  commission_source       text, -- 'tier_option_a' | 'negotiated' | null
  coach_share_cents       bigint,
  pending_tier_assignment boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_coach_slug       text;
  v_coach_profile_id uuid;
  v_tier             text;
  v_payment_option   text;
  v_negotiated_pct   numeric;
  v_total            bigint;
  v_count            integer;
  v_commission_pct   numeric;
  v_commission_source text;
begin
  select cp.coach_slug, cp.id into v_coach_slug, v_coach_profile_id
  from public.coach_profiles cp
  where cp.user_id = auth.uid();

  -- No linked coach_profiles row for this user (same "unlinked" state
  -- EditProfileSection/IntroCallOfferSection already guard) -- nothing to
  -- report yet, zero rows rather than an error.
  if v_coach_slug is null then
    return;
  end if;

  select pta.tier, pta.payment_option into v_tier, v_payment_option
  from public.partner_tier_assignments pta
  where pta.coach_profile_id = v_coach_profile_id;

  select l.negotiated_commission_pct into v_negotiated_pct
  from public.partner_negotiation_log l
  where l.coach_profile_id = v_coach_profile_id
  order by l.effective_from desc, l.created_at desc
  limit 1;

  -- Table-qualified: coach_slug is also this function's OUT column name, so
  -- an unqualified reference here is ambiguous against the table column of
  -- the same name (caught by running this live, not by reading it).
  select coalesce(sum(cpay.amount_cents), 0)::bigint, count(*)::integer
  into v_total, v_count
  from public.coach_payments cpay
  where cpay.coach_slug = v_coach_slug and cpay.status = 'paid';

  if v_payment_option = 'negotiated' and v_negotiated_pct is not null then
    v_commission_pct := v_negotiated_pct;
    v_commission_source := 'negotiated';
  elsif v_payment_option = 'fixed' and v_tier = 'access' then
    v_commission_pct := 10;
    v_commission_source := 'tier_option_a';
  elsif v_payment_option = 'fixed' and v_tier = 'plus' then
    v_commission_pct := 8;
    v_commission_source := 'tier_option_a';
  else
    -- Signature (TBD numbers), unassigned tier, unset payment_option, or
    -- Option B with no negotiated rate logged yet -- never guessed.
    v_commission_pct := null;
    v_commission_source := null;
  end if;

  return query select
    v_coach_slug,
    v_total,
    v_count,
    v_tier,
    v_payment_option,
    v_commission_pct,
    v_commission_source,
    case when v_commission_pct is not null
      then round(v_total * (100 - v_commission_pct) / 100.0)::bigint
      else null
    end,
    (v_commission_pct is null);
end; $$;

comment on function public.get_my_coach_earnings() is
  'Coach-facing earnings summary: gross amount students have actually paid via Stripe for this coach (coach_payments.status = paid, summed), the coach''s computed share if their tier/payment_option (and, for Option B, a logged negotiated rate) is set, and pending_tier_assignment=true otherwise so the UI never guesses a split. Resolves the caller''s own coach_profiles row only (user_id = auth.uid()) -- structurally cannot return another coach''s figures. No payout-transfer tracking exists anywhere in this schema yet (partner_payouts is Lifestyle Blueprint partners only, not coaches) -- this never reports an "already paid out" figure, by design, so the UI cannot imply money has moved when it has not.';

grant execute on function public.get_my_coach_earnings() to authenticated;
