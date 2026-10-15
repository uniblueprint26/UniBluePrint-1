-- ═══════════════════════════════════════════════════════════════════════════
-- Refund flow for Foundation Blueprint one-time payments (follow-up to
-- task #95, which shipped real Stripe payment processing with no refund
-- path at all).
--
-- Reuses the existing public.refunds table rather than inventing a new
-- one — that table already existed (20260410140346_... §"refunds"),
-- already has an Operations-only manage/process policy
-- (20260824150000_fk_and_rls_fixes.sql §5), and already has a nullable
-- submission_id FK, so it needed no shape changes at all. Every write to
-- it for this flow goes through supabase/functions/refund-foundation-
-- payment (service-role client), same as foundation_payments' own writes —
-- so no new INSERT/UPDATE policy is added here for `authenticated`.
--
-- Three changes:
--   1. foundation_payments.status gets a 'refunded' value alongside the
--      existing pending/paid/failed/canceled ones.
--   2. submissions gets refunded_at/refund_id so the one Handler/Operations-
--      facing "ticket" view (TicketDetailScreen) can tell a refunded
--      ticket apart from a live one without a second round trip — see that
--      screen's own comment for why this, rather than a new
--      submission_stage enum value, is the conservative choice here: a
--      refunded ticket is withdrawn from further handler action (hidden
--      from "YOUR DECISION"), not reassigned a new pipeline stage. Not
--      removed from handler_queue, matching that table's existing
--      insert-only/never-deleted pattern (ops_queue_snapshot already reads
--      counts from submissions.stage, not handler_queue, so nothing there
--      needed to change either).
--   3. Operations could already read any submission row directly
--      ("Handlers and operations can read submissions"); Founder could
--      not, despite get_ops_queue_snapshot() already treating operations
--      and founder as equivalent staff. Added here, read-only, so a
--      Founder opening a flagged ticket to review a refund isn't blocked
--      by this pre-existing gap. Document-table content access is left
--      exactly as-is (handler/operations only) — Founder refunding a
--      payment needs the submission row and its tier/amount, not the
--      generated document body.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.foundation_payments
  drop constraint if exists foundation_payments_status_check,
  add constraint foundation_payments_status_check
    check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded'));

comment on column public.foundation_payments.status is
  'pending -> paid (stripe-webhook, checkout.session.completed) or failed/canceled. A paid row can later move to refunded (refund-foundation-payment Edge Function, service-role only) once Stripe confirms the refund — never back to paid.';

alter table public.submissions
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_id uuid references public.refunds(id) on delete set null;

comment on column public.submissions.refunded_at is
  'Set only by refund-foundation-payment (service-role) once Stripe has actually confirmed the refund for this submission''s matching foundation_payments row. TicketDetailScreen hides further Handler decisions once this is set; the ticket itself is left in whatever stage it was already in rather than squeezed into a new submission_stage enum value.';
comment on column public.submissions.refund_id is
  'The public.refunds row this submission''s refund was recorded under, if any.';

create policy "Founder can read submissions" on public.submissions
  for select to authenticated
  using (public.has_role(auth.uid(), 'founder'));
