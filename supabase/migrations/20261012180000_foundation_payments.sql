-- ═══════════════════════════════════════════════════════════════════════════
-- Real Stripe payment processing for Foundation Blueprint (task #95)
--
-- Founder-commissioned audit: "Foundation Blueprint has no real payment
-- processing anywhere." Confirmed true — all 8 builder screens
-- (cv_documents, cover_letters, linkedin_documents, application_forms,
-- interview_prep_packs, personal_statements, portfolio_plans,
-- job_search_sessions) call submit_document_for_review() straight after
-- generation with zero payment collected. submissions.paid
-- (20260606170000_submission_tier_amount.sql) has existed for months and
-- is always false — nothing has ever set it. submissions.turnaround_deadline's
-- own comment already says the quiet part out loud: "nothing currently
-- charges for premium" (20260726110000_handler_pipeline.sql).
--
-- Per docs/business/subscription-pricing-model.md §1.1/§1.4: Standard
-- pricing is real money for every tier (free AND Pro) — Foundation is not
-- a Pro-gated feature, it's a pay-per-service one that Pro merely
-- discounts (Premium only) and queue-jumps. That means this is NOT the
-- same shape as Elevation's Pro subscription gate (pro_access_gating.sql)
-- — it's a one-time Stripe Checkout charge per document, independent of
-- subscription status, with Pro only changing the Premium price.
--
-- foundation_payments is the pre-submission record of that charge —
-- created (status='pending') by create-foundation-checkout-session before
-- the student ever leaves the app, flipped to 'paid' only by
-- stripe-webhook once Stripe actually confirms the charge. submit_document_
-- for_review then becomes the real, server-side submit-gate: it now
-- requires a 'paid' row for that exact (document_table, document_id,
-- tier, user) before a submission can be created at all — not a
-- client-side check a modified app build could skip.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. foundation_payments ──────────────────────────────────────────────────
create table public.foundation_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_table text not null,
  document_id uuid not null,
  service_name text not null,
  tier text not null check (tier in ('standard', 'premium')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

comment on table public.foundation_payments is
  'One row per Stripe Checkout attempt for a single Foundation Blueprint document. Written only by create-foundation-checkout-session (insert, pending) and stripe-webhook (update to paid/failed) — both service-role, both outside RLS. submit_document_for_review() reads this table as the real payment gate; see its own comment.';

create index foundation_payments_document_idx
  on public.foundation_payments (document_table, document_id);
create index foundation_payments_user_idx
  on public.foundation_payments (user_id);
-- Fast "has this exact (document, tier) already been paid for" lookup —
-- exactly the predicate submit_document_for_review() runs on every call.
create index foundation_payments_paid_lookup_idx
  on public.foundation_payments (document_table, document_id, tier, user_id)
  where status = 'paid';

alter table public.foundation_payments enable row level security;

-- Read-only for the owning user — the client polls this (via a direct
-- select, same RLS-scoped anon+JWT pattern every other "my own row" table
-- in this schema uses) to detect "has Stripe's webhook landed yet" after
-- returning from the external checkout browser tab, without needing a
-- deep-link round trip back into a specific screen.
create policy "users_read_own_foundation_payments" on public.foundation_payments
  for select to authenticated
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for `authenticated`. Every
-- write goes through a service-role client (create-foundation-checkout-
-- session on insert, stripe-webhook on the paid/failed transition), which
-- bypasses RLS entirely. A user's own session can never mark its own
-- payment paid, and can never forge a foundation_payments row to pass the
-- gate below without Stripe actually having confirmed a charge.
grant select on public.foundation_payments to authenticated;

-- ── 2. Foundation service pricing — superseding the stale services rows ────
-- services.price_cents already existed for the 8 "— Standard"/"— Premium"
-- Foundation rows (20260723233000 onward) and already matches this doc's
-- Standard prices. Its single "Premium" price (a flat +100% markup, e.g.
-- CV Optimisation — Premium = €40) predates the founder's 12 Oct 2026
-- canonical pricing doc, which splits Premium into a Free-tier price and a
-- cheaper Pro-tier price (docs/business/subscription-pricing-model.md
-- §1.4). create-foundation-checkout-session is the actual source of truth
-- for what Stripe charges (its own hardcoded PRICING map, same pattern as
-- create-checkout-session's PRICING for Pro) — these updates just bring
-- the services table back in line with it rather than leaving a second,
-- contradicting number sitting in the database.
alter table public.services add column if not exists price_cents_pro integer;
comment on column public.services.price_cents_pro is
  'Pro-tier price for a "— Premium" Foundation row (NULL for every "— Standard" row — Standard pricing is identical for Free and Pro per the pricing doc §1.4; only Premium is discounted for Pro). Reference/reporting value — create-foundation-checkout-session''s own PRICING map is what Stripe actually charges.';

update public.services set price_cents = 3600, price_cents_pro = 3000 where name = 'CV Optimisation — Premium';
update public.services set price_cents = 3600, price_cents_pro = 3000 where name = 'Cover Letter Assistance — Premium';
update public.services set price_cents = 3600, price_cents_pro = 3000 where name = 'LinkedIn Optimisation — Premium';
update public.services set price_cents = 3600, price_cents_pro = 3000 where name = 'Application Form Assistance — Premium';
update public.services set price_cents = 3600, price_cents_pro = 3000 where name = 'Interview Preparation — Premium Pack';
update public.services set price_cents = 2600, price_cents_pro = 2200 where name = 'Job Search Support — Premium';
update public.services set price_cents = 3600, price_cents_pro = 3000 where name = 'Personal Statement — Premium';
update public.services set price_cents = 4600, price_cents_pro = 3800 where name = 'Portfolio Building — Premium';
-- "— Premium Pack + Mock Session" rows (Interview Preparation) are left
-- untouched: InterviewPrepBuilderScreen's TIERS only ever offers
-- standard/premium, with no mock-session upsell built in the app yet —
-- flagged in task #95's report rather than invented here.

-- ── 3. submit_document_for_review: real payment gate ───────────────────────
-- Same signature as the version this replaces (20260726110000's 5-arg
-- version) — plain `create or replace`, not drop-then-create. The earlier
-- migration had to drop first because it was changing the signature
-- itself (4 args -> 5); this one doesn't change the signature at all, so
-- `create or replace` is both sufficient and correct here (a `drop
-- function` first was tried and reliably timed out applying this
-- migration against the live project — likely lock contention with other
-- concurrent work — so it's deliberately left out).
create or replace function public.submit_document_for_review(
  p_table text,
  p_document_id uuid,
  p_service_name text,
  p_notes text,
  p_tier text default 'standard'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_id uuid;
  v_submission_id uuid;
  v_updated uuid;
  v_deadline timestamptz;
  v_payment record;
begin
  if not public.is_valid_document_table(p_table) then
    raise exception 'Unsupported document table: %', p_table;
  end if;

  if p_tier not in ('standard', 'premium') then
    raise exception 'Unsupported tier: %', p_tier;
  end if;

  -- The real payment gate (task #95). A matching, actually-paid
  -- foundation_payments row is the only thing that can satisfy this —
  -- that table has no insert/update policy for `authenticated`, so this
  -- can only be true once stripe-webhook has heard from Stripe itself.
  select * into v_payment
    from public.foundation_payments
   where document_table = p_table
     and document_id = p_document_id
     and user_id = auth.uid()
     and tier = p_tier
     and status = 'paid'
   order by paid_at desc
   limit 1;

  if v_payment is null then
    raise exception 'Payment required before this request can be submitted for review.';
  end if;

  v_deadline := now() + case when p_tier = 'premium' then interval '24 hours' else interval '48 hours' end;

  select id into v_service_id from public.services where name = p_service_name limit 1;

  -- amount_cents/paid now carry the real, Stripe-confirmed charge for this
  -- submission instead of staying null/false forever (submission_tier_amount.sql
  -- added both columns months before anything actually set them).
  insert into public.submissions (user_id, service_id, notes, tier, turnaround_deadline, document_table, document_id, stage, amount_cents, paid)
  values (auth.uid(), v_service_id, p_notes, p_tier, v_deadline, p_table, p_document_id, 'in_queue', v_payment.amount_cents, true)
  returning id into v_submission_id;

  execute format(
    'update public.%I set submission_id = $1, status = ''submitted'', updated_at = now()
      where id = $2 and user_id = $3 returning id', p_table
  ) into v_updated using v_submission_id, p_document_id, auth.uid();

  if v_updated is null then
    raise exception 'Document not found or not owned by caller';
  end if;

  insert into public.handler_queue (submission_id, priority, queued_at)
  values (v_submission_id, case when p_tier = 'premium' then 10 else 0 end, now());

  return v_submission_id;
end;
$$;

grant execute on function public.submit_document_for_review(text, uuid, text, text, text) to authenticated;

comment on function public.submit_document_for_review(text, uuid, text, text, text) is
  'The one write path every Foundation Blueprint builder screen uses to hand a generated document to a Campus Handler. Now requires a paid foundation_payments row for the exact (document_table, document_id, tier) first (task #95) — a client cannot reach the handler queue, free or Pro, without a Stripe-confirmed charge for that document.';

comment on column public.submissions.turnaround_deadline is
  'Computed at submission time from tier: standard = 48 hours, premium = 24 hours. As of task #95, submit_document_for_review() will not even create this row without a paid foundation_payments match, so this is now a real paid SLA, not just a queue-sort target (superseding this column''s original 20260726110000 comment).';
