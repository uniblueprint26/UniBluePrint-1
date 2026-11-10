-- Partner Portal (P0-4 fix): let a business user read their own partner's
-- deals rows directly.
--
-- deals' existing SELECT policies (20260810120100, section 9) are written
-- for a MEMBER browsing the Lifestyle Blueprint tab: deals_mental_health_
-- always_free needs the deal active, deals_pro_only_non_mental_health needs
-- both active AND the reader to hold an active Pro subscription. A business
-- role user viewing their OWN listing in the Partner Portal satisfies
-- neither in the common case (a Fitness-category partner's owner has no Pro
-- subscription of their own), so before this policy such a partner could
-- not see even their own deal row -- the Partner Portal had no honest way
-- to show it and was falling back to fabricated demo content instead.
--
-- Scoped to partner_users, not to deals.active, so a partner can see their
-- listing whether or not it is currently live (e.g. a draft not yet
-- switched on, or one Operations paused) -- matches get_my_partner_stats()'s
-- existing partner_users-scoped access pattern one section up.
create policy "partner_users_read_own_deals" on public.deals
  for select to authenticated
  using (
    exists (
      select 1 from public.partner_users pu
      where pu.partner_id = deals.partner_id and pu.user_id = auth.uid()
    )
  );
