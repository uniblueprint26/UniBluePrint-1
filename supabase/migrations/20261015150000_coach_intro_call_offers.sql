-- Self-service Elevation "intro call" / taster-session tier (Desmond-approved).
--
-- Desmond deliberately does NOT want to assign an intro-call price centrally
-- for every Elevation coach — coaches decide for themselves whether to offer
-- one and at what price. Coach pricing today is 100% hardcoded centrally in
-- ElevationScreen.jsx's COACHES array / create-coach-checkout-session's
-- COACH_PRICING map, so this table is the first coach-editable pricing
-- surface — deliberately scoped to ONLY the new intro-call layer, not a
-- rebuild of existing pricelist items (those stay exactly as they are).
--
-- Identity: keyed by coach_slug, the same stable identity already used by
-- coach_contact_details (see its own migration header) rather than a new
-- parallel key — a coach_intro_call_offers row only ever exists for a
-- coach_slug that already has a coach_profiles row, and only the coach
-- linked to that row (coach_profiles.user_id = auth.uid()) can manage it —
-- same join pattern coach_contact_details' own RLS already uses.
--
-- A toggle (active, default OFF) plus a price in cents (0 allowed — a free
-- intro call) and a duration in minutes. price_cents = 0 is handled entirely
-- client-side (CoachBookingScreen books it directly, no Stripe step) — the
-- exact same free-booking path Kevin's (TrainWitKev) existing "Initial
-- consultation" pricelist item already uses; see coachPricing.js and
-- CoachBookingScreen.jsx's `chargeable` check. Only a price_cents > 0 offer
-- is ever sent to create-coach-checkout-session (intro_call: true), which
-- resolves the real amount to charge from this table server-side — never
-- from anything the client sends.

create table public.coach_intro_call_offers (
  coach_slug      text primary key references public.coach_profiles(coach_slug) on delete cascade,
  active          boolean not null default false,
  price_cents     integer not null default 0 check (price_cents >= 0),
  duration_minutes integer not null default 15 check (duration_minutes > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.coach_intro_call_offers is
  'One row per coach, self-managed by the coach themself (see RLS below). A single active intro-call/taster-session offer a coach has opted into showing to students, at a price and duration the coach sets — default OFF (active=false), never assigned centrally. price_cents=0 is a free intro call (books directly, no Stripe charge); price_cents>0 is charged via create-coach-checkout-session the same way an existing chargeable pricelist item is.';

alter table public.coach_intro_call_offers enable row level security;

-- Coach manages their own row (the direct precedent: coach_contact_details'
-- "coach_manage_own_contact_details" policy) — a coach can insert, update,
-- toggle or read ONLY the row whose coach_slug links to their own
-- coach_profiles.user_id. This is what makes turning the offer on/off and
-- setting price/duration genuinely self-service rather than something
-- Operations/Founder has to do for them.
create policy "coach_manage_own_intro_call_offer"
  on public.coach_intro_call_offers for all to authenticated
  using (
    exists (
      select 1 from public.coach_profiles cp
      where cp.coach_slug = coach_intro_call_offers.coach_slug
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.coach_profiles cp
      where cp.coach_slug = coach_intro_call_offers.coach_slug
        and cp.user_id = auth.uid()
    )
  );

-- Founder/Operations can manage any coach's offer (e.g. to help a coach who
-- isn't a registered platform user yet, or to intervene on a problem
-- listing) — same blanket allowance coach_contact_details and coach_profiles
-- both already grant them.
create policy "founder_operations_manage_coach_intro_call_offers"
  on public.coach_intro_call_offers for all to authenticated
  using (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'))
  with check (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'));

-- Any other authenticated user (a student browsing Elevation) can read ONLY
-- an active offer — an inactive/disabled offer is only ever visible to the
-- coach who owns it (via the policy above) and Operations/Founder. This is
-- what lets CoachProfileScreen/CoachBookingScreen show "has this coach got
-- an active intro call?" without exposing a coach's draft/disabled pricing.
create policy "authenticated_read_active_intro_call_offers"
  on public.coach_intro_call_offers for select to authenticated
  using (active = true);

create or replace function public.touch_coach_intro_call_offers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists coach_intro_call_offers_touch_updated_at on public.coach_intro_call_offers;
create trigger coach_intro_call_offers_touch_updated_at
  before update on public.coach_intro_call_offers
  for each row execute function public.touch_coach_intro_call_offers_updated_at();

-- Notify Operations/Founder whenever a coach turns their intro call on/off
-- or changes its price/duration — same "self-edit is never silent" pattern
-- notify_ops_on_coach_profile_change already established for bio/photo
-- self-edits (20260811090000_gdpr_coach_enquiries_connections.sql).
create or replace function public.notify_ops_on_coach_intro_call_offer_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or (new.active is distinct from old.active)
     or (new.price_cents is distinct from old.price_cents)
     or (new.duration_minutes is distinct from old.duration_minutes) then
    insert into public.notifications (user_id, category, title, message)
    select ur.user_id, 'coach_intro_call_offer_updated', 'Coach intro call offer updated',
           new.coach_slug || ' set their intro call offer to ' ||
           (case when new.active then 'ON' else 'OFF' end) ||
           ' (' || (new.price_cents::numeric / 100)::text || ' EUR, ' || new.duration_minutes || ' min).'
    from public.user_roles ur where ur.role in ('founder', 'operations');
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_coach_intro_call_offer_change on public.coach_intro_call_offers;
create trigger trg_notify_coach_intro_call_offer_change
  after insert or update on public.coach_intro_call_offers
  for each row execute function public.notify_ops_on_coach_intro_call_offer_change();
