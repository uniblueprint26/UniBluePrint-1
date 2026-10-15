-- Lifestyle Blueprint: deal-following/favoriting on partners (founder
-- decision, Oct 2026 — part 1 of 3 for this change, see also
-- 20261015140500_partner_follow_notifications.sql and
-- 20261015141000_deal_redemption_codes.sql).
--
-- public.partner_follows is the plain join table backing a "Follow" toggle
-- on a partner's listing (LifestylePartnersScreen / PartnerCards.jsx's
-- PartnerDetailSheet). A user manages only their own follows — no partner
-- or Founder/Operations read path is needed here, unlike
-- lifestyle_partner_contact_details, since nothing sensitive is stored
-- (just "this user follows this partner").
--
-- partner_id references public.partners(id) — the same uuid
-- lib/partnerEvents.js already resolves from each static PARTNERS entry's
-- `id` (really a partner_slug) via `partners.partner_slug`, not a new
-- identity scheme.

create table if not exists public.partner_follows (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, partner_id)
);

-- Lets the "new deal from a followed partner" trigger
-- (20261015140500_partner_follow_notifications.sql) look up every follower
-- of a given partner without a sequential scan.
create index if not exists idx_partner_follows_partner_id
  on public.partner_follows (partner_id);

alter table public.partner_follows enable row level security;

create policy "users_manage_own_partner_follows"
  on public.partner_follows for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
