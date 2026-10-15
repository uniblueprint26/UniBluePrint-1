-- ═══════════════════════════════════════════════════════════════════════════
-- Real Stripe payment processing for Elevation coach bookings (task #95's
-- sibling, Elevation).
--
-- Confirmed gap: CoachBookingScreen.jsx just inserts a 'requested' row into
-- coach_bookings with zero payment collected, for every coach, regardless
-- of whether that coach even has a real price. Mirrors foundation_payments'
-- shape and RLS almost exactly (see 20261012180000_foundation_payments.sql)
-- — same "service-role-only write, authenticated read-only" gate, same
-- pending -> paid/failed lifecycle driven by stripe-webhook.
--
-- Coach pricing is NOT a clean fixed table like Foundation's 8 services —
-- see ElevationScreen.jsx's COACHES array (`from` / `pricelist`). Three
-- shapes exist in the data today:
--   1. A `pricelist` array of named line items at different prices (e.g.
--      JMC Fitness, Camila Aruk, Milan Piroska, Kevin, Nathan Yanzo) — the
--      student picks ONE item; that item's price is what gets charged.
--      One pricelist item (Kevin's "Initial consultation") is priced
--      "Free" — nothing to charge there, so it books directly with no
--      payment step (see amount_cents=0/paid=false below).
--   2. A single parseable `from` price with no pricelist (e.g. "€50/hr") —
--      charged directly. No coach in today's roster is actually in this
--      bucket (every coach with a real number also has a pricelist), but
--      the schema and create-coach-checkout-session both support it so a
--      future coach added with just a flat `from` price works without a
--      migration.
--   3. `from: 'Available on request'` (or equivalent, e.g. "Let's chat
--      pricing") — no real number exists to charge, so these coaches keep
--      the original enquiry-only flow untouched. Most of the roster is in
--      this bucket today (Eman, DG Trading, Dinero Trading Group, Zainab
--      Adeyemi, Emanuel Tolic, Tadgh Darcy, Alex Leva, Jayden Reynolds,
--      Aoife Keogh, Luana Ciweck).
--
-- Deliberately NOT built here: coach commission/payout/revenue-split. This
-- is purely "does the student pay before the booking confirms" — the
-- platform collects the full listed price via Stripe exactly like
-- Foundation does for its own services, and what (if anything) the coach
-- is later paid from that is explicitly out of scope — the founder hasn't
-- decided a split, and docs/business/subscription-pricing-model.md's own
-- "Note — coach/partner commission split" section says so. No commission
-- percentage, payout table, or Stripe Connect transfer exists anywhere in
-- this migration or its Edge Functions.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. coach_payments ────────────────────────────────────────────────────
create table public.coach_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null references public.coach_bookings(id) on delete cascade,
  coach_slug text not null,
  coach_name text not null,
  item_label text, -- the pricelist item label charged, or null for a flat-price coach
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

comment on table public.coach_payments is
  'One row per Stripe Checkout attempt for a single Elevation coach booking. Written only by create-coach-checkout-session (insert, pending) and stripe-webhook (update to paid/failed) — both service-role, both outside RLS. Only ever created for a coach_bookings row with a real chargeable price (pricelist item or parseable flat `from` price) — "Available on request" coaches never get a row here, same enquiry-only flow as before.';

create index coach_payments_booking_idx on public.coach_payments (booking_id);
create index coach_payments_user_idx on public.coach_payments (user_id);
-- Fast "has this exact booking already been paid for" lookup — the
-- predicate CoachCheckoutModal polls on and stripe-webhook matches against.
create index coach_payments_paid_lookup_idx
  on public.coach_payments (booking_id)
  where status = 'paid';

alter table public.coach_payments enable row level security;

-- Read-only for the owning user — the client polls this (same pattern as
-- foundation_payments) to detect "has Stripe's webhook landed yet" after
-- returning from the external checkout browser tab.
create policy "users_read_own_coach_payments" on public.coach_payments
  for select to authenticated
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for `authenticated`. Every
-- write goes through a service-role client (create-coach-checkout-session
-- on insert, stripe-webhook on the paid/failed transition) — a user's own
-- session can never mark its own payment paid, and can never forge a
-- coach_payments row to make a booking look paid without Stripe actually
-- having confirmed a charge.
grant select on public.coach_payments to authenticated;

-- ── 2. coach_bookings: a real "awaiting payment" state ──────────────────
-- Same shape as submissions.amount_cents/paid (foundation_payments'
-- migration) — the booking row itself now carries what was actually
-- charged (or that nothing was, for a free item/enquiry), instead of that
-- living only in a separate payments table with no link back.
alter table public.coach_bookings add column if not exists pricelist_item text;
alter table public.coach_bookings add column if not exists amount_cents integer;
alter table public.coach_bookings add column if not exists paid boolean not null default false;

comment on column public.coach_bookings.pricelist_item is
  'Which pricelist line item (if any) this booking is for — e.g. "In-Person Session (1hr)". Null for a flat-price coach or an enquiry-only ("Available on request") coach.';
comment on column public.coach_bookings.amount_cents is
  'What was actually charged for this booking (0 for a free pricelist item or an enquiry-only coach — never a coach rate "owed" or a commission figure; see this migration''s header).';
comment on column public.coach_bookings.paid is
  'True only once stripe-webhook has confirmed a real Stripe charge for this booking (coach_payments.status = ''paid''). Always false for a free item or an enquiry-only coach — there was never a charge to confirm.';

-- New status: a booking "request" a student has started paying for but
-- Stripe hasn't confirmed yet. Inserted by the client (via the existing
-- users_insert_own_coach_bookings policy — that policy only constrains
-- user_id, not status, so no RLS change is needed here), then flipped to
-- 'requested' only by stripe-webhook once the charge actually lands —
-- never by the client itself (users_cancel_own_coach_bookings is the only
-- update policy a student has, and it only ever allows a transition to
-- 'cancelled'). This is the same "pay before confirmation" shape as
-- Foundation's "pay before Handler review" (submit_document_for_review's
-- payment gate) — here the gate is just earlier, before the request row
-- is even real, rather than before a later submit step.
alter table public.coach_bookings drop constraint coach_bookings_status_check;
alter table public.coach_bookings add constraint coach_bookings_status_check
  check (status in ('pending_payment', 'requested', 'confirmed', 'declined', 'cancelled'));

-- ── 3. notify_on_coach_booking: don't notify the coach/Ops on an unpaid,
-- not-yet-real request ───────────────────────────────────────────────────
-- Previously fired "New booking request" on every INSERT. Now a chargeable
-- booking is first inserted as 'pending_payment' (nothing to notify about
-- yet — Stripe hasn't confirmed anything), so the INSERT branch only fires
-- for a booking that's 'requested' from the moment it's created (a free
-- pricelist item or an "Available on request" enquiry — both still insert
-- directly at 'requested', exactly as before). The "New booking request"
-- notification instead fires on the pending_payment -> requested UPDATE
-- (stripe-webhook, once payment is confirmed) — that transition is the
-- real first moment a coach/Ops should hear about this request, same
-- content as the original INSERT notification.
create or replace function public.notify_on_coach_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.status = 'requested' then
    insert into public.notifications (user_id, category, title, message)
    select ur.user_id, 'coach_booking', 'New booking request',
           new.coach_name || ' has a new booking request for ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.'
    from public.user_roles ur where ur.role in ('operations', 'founder');

    insert into public.notifications (user_id, category, title, message)
    select cp.user_id, 'coach_booking', 'New booking request',
           'A student requested ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.'
    from public.coach_profiles cp where cp.coach_slug = new.coach_slug;

  elsif tg_op = 'UPDATE' and old.status = 'pending_payment' and new.status = 'requested' then
    -- Payment just confirmed (stripe-webhook) — this is the real "new
    -- booking request" moment for a paid booking, same notification the
    -- original INSERT branch sent for a free/enquiry one.
    insert into public.notifications (user_id, category, title, message)
    select ur.user_id, 'coach_booking', 'New booking request',
           new.coach_name || ' has a new booking request for ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.'
    from public.user_roles ur where ur.role in ('operations', 'founder');

    insert into public.notifications (user_id, category, title, message)
    select cp.user_id, 'coach_booking', 'New booking request',
           'A student requested ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.'
    from public.coach_profiles cp where cp.coach_slug = new.coach_slug;

  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('confirmed', 'declined') then
    insert into public.notifications (user_id, category, title, message)
    values (new.user_id, 'coach_booking',
            case when new.status = 'confirmed' then 'Booking confirmed' else 'Booking declined' end,
            new.coach_name || (case when new.status = 'confirmed' then ' confirmed' else ' declined' end)
              || ' your request for ' || to_char(new.slot_date, 'Dy DD Mon') || ' at ' || new.slot_label || '.');
  end if;
  return new;
end; $$;
-- Trigger itself (trg_notify_coach_booking) is unchanged — it already
-- fires "after insert or update", which covers the new pending_payment ->
-- requested transition without needing to be recreated.
