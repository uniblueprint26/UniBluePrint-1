-- ═══════════════════════════════════════════════════════════════════════════
-- Real Stripe Connect automated payouts for Elevation coaches — the founder
-- decision create-coach-checkout-session's own header comment (and
-- 20261012211500_coach_payments's) flagged as deliberately unbuilt pending a
-- call that has now been made: coaches get paid automatically via Stripe
-- Connect, not a manual ledger.
--
-- Three pieces:
--   1. coach_connect_accounts — one row per coach who has started Stripe
--      Express onboarding. Written only by the create-coach-connect-account
--      Edge Function (insert) and stripe-webhook's new account.updated
--      handler (keeping charges_enabled/payouts_enabled/details_submitted in
--      sync with Stripe's own view) — both service-role, same "no
--      insert/update policy for authenticated" shape coach_payments already
--      uses. A coach is "verified" (ready to actually receive a transfer)
--      only once BOTH charges_enabled and payouts_enabled are true — these
--      are read directly off Stripe's Account object, never guessed.
--
--   2. coach_payment_transfers — append-style audit of every payout attempt
--      for a coach_payments row (one attempt row per coach_payments.id,
--      enforced unique). status is 'transferred' (a real Stripe Transfer
--      was created — stripe_transfer_id set), 'pending' (commission and/or
--      Connect account not ready — pending_reason says which, for
--      Finance/Founder to action manually), or 'failed' (Stripe rejected the
--      transfer attempt itself — error_message set). This is the auditable
--      record the task asks for; nothing here is ever inferred after the
--      fact from coach_payments alone.
--
--   3. public._coach_commission_for(uuid) — the exact commission CASE logic
--      get_my_coach_earnings() (20261015144526) already computes inline,
--      factored out into its own helper so the automated transfer below and
--      the coach-facing earnings summary can never diverge. Takes an
--      explicit coach_profile_id (not auth.uid()), so unlike every other
--      function in this schema it is NOT for authenticated/anon at all —
--      only service_role (stripe-webhook) and other SECURITY DEFINER
--      functions in this schema (which run as the owner, bypassing grants
--      entirely) may call it. get_my_coach_earnings() is updated in place to
--      call this helper instead of repeating the CASE itself.
--
-- Never guesses: a payment whose coach has no tier/payment_option assigned
-- (or Option B with no negotiated rate logged) is recorded 'pending' with
-- pending_reason = 'pending_tier_assignment' and no transfer is attempted —
-- same "commission_pct/commission_source come back null, never fabricated"
-- rule 20261015144526 already established, now also enforced on the money-
-- moving side, not just the read-only display side.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. coach_connect_accounts ────────────────────────────────────────────
create table public.coach_connect_accounts (
  coach_profile_id   uuid primary key references public.coach_profiles(id) on delete cascade,
  stripe_account_id  text not null unique,
  details_submitted  boolean not null default false,
  charges_enabled     boolean not null default false,
  payouts_enabled     boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.coach_connect_accounts is
  'One row per coach who has started Stripe Express Connect onboarding (create-coach-connect-account Edge Function). charges_enabled/payouts_enabled/details_submitted are kept in sync with Stripe''s own Account object by stripe-webhook''s account.updated handler — a coach is only ever treated as ready to receive a real transfer when BOTH charges_enabled and payouts_enabled are true, read from Stripe directly, never assumed from details_submitted alone (Stripe can require further verification after details are submitted).';

alter table public.coach_connect_accounts enable row level security;

-- Coach reads only their own account status — same join shape
-- coach_contact_details/coach_intro_call_offers already use (through
-- coach_profiles.user_id = auth.uid()), here via coach_profile_id directly
-- rather than coach_slug since that's this table's own key.
-- `(select auth.uid())` rather than a bare `auth.uid()` in every policy
-- below — a bare call re-evaluates per row (get_advisors' own
-- auth_rls_initplan finding after this migration first applied, confirmed
-- live); wrapping it lets Postgres evaluate it once per query instead.
create policy "coach_read_own_connect_account" on public.coach_connect_accounts
  for select to authenticated
  using (
    exists (
      select 1 from public.coach_profiles cp
      where cp.id = coach_connect_accounts.coach_profile_id
        and cp.user_id = (select auth.uid())
    )
  );

-- Founder/Finance/Operations see every coach's Connect status — same
-- three-role audience the Finance dashboard and Partner Tiering admin
-- screens already use for this kind of money-adjacent oversight.
create policy "finance_founder_operations_read_connect_accounts" on public.coach_connect_accounts
  for select to authenticated
  using (
    public.has_role((select auth.uid()), 'founder')
    or public.has_role((select auth.uid()), 'finance')
    or public.has_role((select auth.uid()), 'operations')
  );

-- Deliberately no insert/update/delete policy for `authenticated` — every
-- write goes through create-coach-connect-account (insert, service-role) or
-- stripe-webhook's account.updated handler (update, service-role). A coach
-- can never forge or alter their own Connect status.
grant select on public.coach_connect_accounts to authenticated;

create or replace function public.touch_coach_connect_accounts_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger trg_coach_connect_accounts_updated_at
  before update on public.coach_connect_accounts
  for each row execute function public.touch_coach_connect_accounts_updated_at();

-- ── 2. coach_payment_transfers ───────────────────────────────────────────
create table public.coach_payment_transfers (
  id                         uuid primary key default gen_random_uuid(),
  coach_payment_id          uuid not null unique references public.coach_payments(id) on delete cascade,
  coach_profile_id          uuid references public.coach_profiles(id) on delete set null,
  coach_slug                text not null, -- denormalized, same reasoning coach_payments.coach_slug already accepts: survives a coach_profiles row being unlinked/deleted
  gross_amount_cents        integer not null check (gross_amount_cents > 0), -- coach_payments.amount_cents at the time of this attempt
  commission_pct            numeric,
  commission_source         text, -- 'tier_option_a' | 'negotiated' | null (mirrors get_my_coach_earnings' own column)
  coach_share_cents         integer, -- null until commission_pct is resolved
  stripe_connect_account_id text,
  stripe_transfer_id        text,
  status                    text not null check (status in ('pending', 'transferred', 'failed')),
  pending_reason            text check (pending_reason in ('pending_tier_assignment', 'no_connect_account', 'connect_account_not_verified')),
  error_message             text,
  attempted_at               timestamptz not null default now(),
  transferred_at             timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  check (status <> 'pending' or pending_reason is not null),
  check (status <> 'transferred' or (stripe_transfer_id is not null and coach_share_cents is not null))
);

comment on table public.coach_payment_transfers is
  'One row per coach_payments.id (unique) — the auditable record of whether and why a coach''s share of that payment was actually transferred via Stripe Connect. Written only by stripe-webhook, exactly once per coach_payments row, right after that row flips pending -> paid (its own update predicate already makes this idempotent against a retried webhook delivery — see markCoachPaymentPaid). "pending" means Finance/Founder has something to resolve manually (pending_reason says what): the coach''s tier/payment_option isn''t assigned, they have no Connect account yet, or their Connect account isn''t fully verified. "failed" means Stripe itself rejected a transfer that was actually attempted. Never retried automatically — a fixed pending/failed row stays as the historical record; resolving the underlying cause does not rewrite it.';
comment on column public.coach_payment_transfers.pending_reason is
  'Why no transfer was attempted (or attempted but not possible) for this payment: pending_tier_assignment (coach has no resolvable commission split yet — same null/pending case get_my_coach_earnings() already shows the coach), no_connect_account (coach has not started Stripe Express onboarding), connect_account_not_verified (onboarding started but Stripe has not yet enabled charges+payouts on that account).';

create index coach_payment_transfers_coach_profile_idx on public.coach_payment_transfers (coach_profile_id);
create index coach_payment_transfers_pending_idx on public.coach_payment_transfers (attempted_at desc) where status = 'pending';

alter table public.coach_payment_transfers enable row level security;

create policy "coach_read_own_payment_transfers" on public.coach_payment_transfers
  for select to authenticated
  using (
    exists (
      select 1 from public.coach_profiles cp
      where cp.id = coach_payment_transfers.coach_profile_id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "finance_founder_operations_read_payment_transfers" on public.coach_payment_transfers
  for select to authenticated
  using (
    public.has_role((select auth.uid()), 'founder')
    or public.has_role((select auth.uid()), 'finance')
    or public.has_role((select auth.uid()), 'operations')
  );

-- Deliberately no insert/update/delete policy for `authenticated` — only
-- stripe-webhook (service-role) ever writes a row here.
grant select on public.coach_payment_transfers to authenticated;

create or replace function public.touch_coach_payment_transfers_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger trg_coach_payment_transfers_updated_at
  before update on public.coach_payment_transfers
  for each row execute function public.touch_coach_payment_transfers_updated_at();

-- ── 3. Shared commission helper — factored out of get_my_coach_earnings ───
-- Identical CASE logic to the one 20261015144526 inlined; no behaviour
-- change for get_my_coach_earnings() itself, just a shared implementation so
-- this and the webhook's transfer logic can never drift apart.
create or replace function public._coach_commission_for(_coach_profile_id uuid)
returns table (
  tier                    text,
  payment_option          text,
  commission_pct          numeric,
  commission_source       text, -- 'tier_option_a' | 'negotiated' | null
  pending_tier_assignment boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_tier              text;
  v_payment_option    text;
  v_negotiated_pct    numeric;
  v_commission_pct    numeric;
  v_commission_source text;
begin
  select pta.tier, pta.payment_option into v_tier, v_payment_option
  from public.partner_tier_assignments pta
  where pta.coach_profile_id = _coach_profile_id;

  select l.negotiated_commission_pct into v_negotiated_pct
  from public.partner_negotiation_log l
  where l.coach_profile_id = _coach_profile_id
  order by l.effective_from desc, l.created_at desc
  limit 1;

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
    -- Option B with no negotiated rate logged yet -- never guessed, same as
    -- get_my_coach_earnings()'s original inline version of this CASE.
    v_commission_pct := null;
    v_commission_source := null;
  end if;

  return query select v_tier, v_payment_option, v_commission_pct, v_commission_source, (v_commission_pct is null);
end; $$;

comment on function public._coach_commission_for(uuid) is
  'Internal shared commission-math helper (leading underscore marks it as not a public API, same convention this project has no prior name-collision risk for). Takes an explicit coach_profile_id with no auth.uid() self-check -- deliberately NOT granted to anon or authenticated, only service_role (stripe-webhook''s automated Connect transfer) and other SECURITY DEFINER functions in this schema, which run as the function owner and so can call it regardless of table/function grants. get_my_coach_earnings() and the webhook''s payout logic both call this so the two can never compute a different split for the same coach.';

-- `from anon, authenticated` alone is NOT enough on this project: new
-- functions also get an implicit `GRANT EXECUTE ... TO PUBLIC` (the
-- pseudo-role every real role is automatically a member of), separate from
-- the named anon/authenticated grants ALTER DEFAULT PRIVILEGES adds (see
-- 20261015160200's own header comment on that distinction). Confirmed live
-- via information_schema.routine_privileges after applying this migration
-- with only the anon/authenticated revoke below: PUBLIC still showed up as
-- a grantee, which would have let any authenticated/anon caller invoke this
-- with an arbitrary coach_profile_id and read another coach's tier/
-- commission data. Revoking from `public` explicitly closes that.
revoke execute on function public._coach_commission_for(uuid) from public, anon, authenticated;
grant execute on function public._coach_commission_for(uuid) to service_role;

-- ── 4. get_my_coach_earnings(): now calls the shared helper ──────────────
-- Same signature, same returned shape, same behaviour -- only the
-- commission computation itself moved into _coach_commission_for() above.
create or replace function public.get_my_coach_earnings()
returns table (
  coach_slug              text,
  total_collected_cents   bigint,
  paid_bookings_count     integer,
  tier                    text,
  payment_option          text,
  commission_pct          numeric,
  commission_source       text,
  coach_share_cents       bigint,
  pending_tier_assignment boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_coach_slug       text;
  v_coach_profile_id uuid;
  v_total            bigint;
  v_count            integer;
begin
  select cp.coach_slug, cp.id into v_coach_slug, v_coach_profile_id
  from public.coach_profiles cp
  where cp.user_id = auth.uid();

  if v_coach_slug is null then
    return;
  end if;

  select coalesce(sum(cpay.amount_cents), 0)::bigint, count(*)::integer
  into v_total, v_count
  from public.coach_payments cpay
  where cpay.coach_slug = v_coach_slug and cpay.status = 'paid';

  return query
  select
    v_coach_slug,
    v_total,
    v_count,
    c.tier,
    c.payment_option,
    c.commission_pct,
    c.commission_source,
    case when c.commission_pct is not null
      then round(v_total * (100 - c.commission_pct) / 100.0)::bigint
      else null
    end,
    c.pending_tier_assignment
  from public._coach_commission_for(v_coach_profile_id) c;
end; $$;

comment on function public.get_my_coach_earnings() is
  'Coach-facing earnings summary: gross amount students have actually paid via Stripe for this coach (coach_payments.status = paid, summed), the coach''s computed share via the shared _coach_commission_for() helper, and pending_tier_assignment=true when no split can be resolved (never guessed). Resolves the caller''s own coach_profiles row only (user_id = auth.uid()) -- structurally cannot return another coach''s figures. As of 20261015150039, a resolvable split also drives a real Stripe Connect transfer (see coach_payment_transfers) once the coach''s Connect account is verified -- this function still only reports the computed-owed figure, not transfer status; a coach''s actual payout history/status is a separate, later UI surface this migration does not add to CoachStudioScreen.';

grant execute on function public.get_my_coach_earnings() to authenticated;

-- ── 5. Finance-facing summary + pending-resolution list ──────────────────
-- Same gate (finance/founder) and shape as get_finance_partner_payout_summary
-- (20260829140000) — Finance's equivalent view for coach Connect payouts.
create or replace function public.get_finance_coach_payout_summary()
returns table (
  pending_count            integer,
  pending_amount_cents     bigint,
  transferred_count        integer,
  transferred_amount_cents bigint,
  failed_count             integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    count(*) filter (where status = 'pending')::integer,
    coalesce(sum(gross_amount_cents) filter (where status = 'pending'), 0)::bigint,
    count(*) filter (where status = 'transferred')::integer,
    coalesce(sum(coach_share_cents) filter (where status = 'transferred'), 0)::bigint,
    count(*) filter (where status = 'failed')::integer
  from public.coach_payment_transfers;
end; $$;

grant execute on function public.get_finance_coach_payout_summary() to authenticated;
-- `from anon` alone left an implicit PUBLIC grant live (confirmed by
-- get_advisors' anon_security_definer_function_executable finding after
-- this migration first applied) — same gap _coach_commission_for's own
-- comment above explains; revoking `from public` too actually closes it.
revoke execute on function public.get_finance_coach_payout_summary() from public, anon;

-- Detail list behind the summary tile — what Finance/Founder actually act
-- on. Capped at 100 most-recent so this never becomes an unbounded scan as
-- the table grows; an older backlog is still fully visible via direct SQL
-- for whoever is clearing it.
create or replace function public.get_finance_pending_coach_payouts()
returns table (
  id                 uuid,
  coach_slug         text,
  gross_amount_cents integer,
  pending_reason     text,
  commission_pct     numeric,
  coach_share_cents  integer,
  attempted_at       timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(), 'finance') or public.has_role(auth.uid(), 'founder')) then
    raise exception 'not authorized';
  end if;

  return query
  select t.id, t.coach_slug, t.gross_amount_cents, t.pending_reason, t.commission_pct, t.coach_share_cents, t.attempted_at
  from public.coach_payment_transfers t
  where t.status = 'pending'
  order by t.attempted_at desc
  limit 100;
end; $$;

grant execute on function public.get_finance_pending_coach_payouts() to authenticated;
revoke execute on function public.get_finance_pending_coach_payouts() from public, anon;
