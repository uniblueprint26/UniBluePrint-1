-- ═══════════════════════════════════════════════════════════════════════════
-- Real Stripe payment processing for the Ad Board and Marketplace "Providing
-- Services" listings.
--
-- Per docs/business/subscription-pricing-model.md §1.6/§1.7 (updated 12 Oct
-- 2026 — current, authoritative pricing):
--   §1.6 Ad Board: 1 free ad per calendar month for everyone. 2nd+ ad that
--        month: €4.99 (Free tier) / €1.99 (Pro).
--   §1.7 Marketplace "Providing Services" listings — i.e. the Skills
--        Marketplace board's `listing_type = 'Offering a skill'` rows
--        (marketplace_skills, constants/marketplaceBoards.js's 'skills'
--        board) — NOT the Buy & Sell board (marketplace_listings), which is
--        a different listing type the pricing doc never mentions, and NOT
--        'Looking for a skill' rows on the same board, which are a request
--        rather than a service being provided. Every "Offering a skill"
--        listing is paid, no free one: €2.99 (Free tier) / €0.99 (Pro).
--
-- Before this, PostAdModal.jsx and PostFormModal.jsx (via BoardDetailScreen)
-- just inserted straight into `ads` / `marketplace_skills` with zero payment
-- or per-month counting — every user could post unlimited free ads/listings.
-- RLS on both tables let `authenticated` insert directly, so a monthly-count
-- check alone (enforced only in the app) would not have been a real gate —
-- a client could skip the app and insert directly via the API regardless of
-- how many times they'd already posted that month.
--
-- Same shape as Foundation Blueprint's real payment gate (task #95,
-- 20261012180000_foundation_payments.sql): a pending-payment row is created
-- (service-role only) before Stripe Checkout opens, and only stripe-webhook
-- (also service-role, on checkout.session.completed) can ever flip it to
-- 'paid'. The difference from Foundation is that there is no pre-existing
-- document row to gate a later submit on — the ad/listing itself doesn't
-- exist yet when checkout starts — so here stripe-webhook does the actual
-- `insert` into `ads` / `marketplace_skills` once payment is confirmed,
-- using the exact payload captured on the pending row at checkout-creation
-- time. See create-board-listing-checkout-session/index.ts and
-- stripe-webhook/index.ts's markBoardListingPaymentPaid().
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. board_listing_payments ────────────────────────────────────────────
create table public.board_listing_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_kind text not null check (listing_kind in ('ad_board', 'marketplace_skill')),
  payload jsonb not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_listing_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

comment on table public.board_listing_payments is
  'One row per Stripe Checkout attempt for a single Ad Board ad or Marketplace "Providing Services" listing (docs/business/subscription-pricing-model.md §1.6/§1.7). Written only by create-board-listing-checkout-session (insert, pending) and stripe-webhook (update to paid/failed, and the one place that actually inserts the resulting ads/marketplace_skills row) — both service-role, both outside RLS. `payload` is the exact insert-ready row (minus id/created_at) for the target table, captured at checkout-creation time so stripe-webhook does not need to re-derive it.';

comment on column public.board_listing_payments.created_listing_id is
  'Set by stripe-webhook once it has inserted the real ads/marketplace_skills row for a paid payment — also the idempotency marker (an update that does not see status=''pending'' no longer re-inserts on a retried webhook delivery).';

create index board_listing_payments_user_idx on public.board_listing_payments (user_id, listing_kind, created_at);

alter table public.board_listing_payments enable row level security;

-- Read-only for the owning user — the client polls this (via a direct
-- select, same RLS-scoped anon+JWT pattern foundation_payments already
-- uses) to detect "has Stripe's webhook landed and created my listing yet"
-- after returning from the external checkout browser tab.
create policy "users_read_own_board_listing_payments" on public.board_listing_payments
  for select to authenticated
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for `authenticated` — same
-- reasoning as foundation_payments: a user's own session can never create
-- or forge a "paid" row, so the monthly-count/payment gate below is real,
-- not cosmetic.
grant select on public.board_listing_payments to authenticated;

-- ── 2. ads: lock down direct inserts ─────────────────────────────────────
-- Every ad now must go through create-board-listing-checkout-session
-- (free 1st-of-the-month -> inserted immediately by that function,
-- service-role) or stripe-webhook (2nd+ -> inserted once paid). Dropping
-- this policy outright (not narrowing it) is correct here, unlike
-- marketplace_skills below: every single ad is subject to the monthly
-- count, so there is no "always free" sub-case for `authenticated` to keep
-- inserting directly.
drop policy if exists "ads: authenticated submit" on public.ads;

-- ── 3. marketplace_skills: lock down "Offering a skill" inserts only ────
-- 'Looking for a skill' listings are a request, not a service being
-- provided, and are not in §1.7's scope — they stay free and directly
-- insertable, same as every other Campus/Course Connect board. Only
-- 'Offering a skill' (the "Providing Services" case) has to go through the
-- paid path (create-board-listing-checkout-session / stripe-webhook,
-- service-role), so the old blanket insert policy is replaced with one
-- that still allows a user to insert their own row, but only when it isn't
-- the paid listing_type.
drop policy if exists "insert_own_marketplace_skill" on public.marketplace_skills;

create policy "insert_own_marketplace_skill_free_only" on public.marketplace_skills
  for insert to authenticated
  with check (auth.uid() = user_id and listing_type <> 'Offering a skill');

comment on policy "insert_own_marketplace_skill_free_only" on public.marketplace_skills is
  '"Offering a skill" (§1.7 "Providing Services") rows are paid and can only be created by stripe-webhook (service-role, bypasses RLS) once payment is confirmed — see board_listing_payments. "Looking for a skill" stays free and directly insertable by its own poster, same as before.';

-- marketplace_listings (Buy & Sell) is untouched — a different listing type
-- the pricing doc never mentions (see this migration's header comment).
