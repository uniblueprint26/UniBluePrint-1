-- Priority tickets: optional Stripe Connect destination account per event.
-- Priority Events takes the money and handles its own VAT. UBP is only the
-- ticket shop. When stripe_account_id is set, the checkout function creates a
-- destination charge to that connected account with no application fee. When
-- it is empty, the money lands in the UBP Stripe account as before.
--
-- Run AFTER 20261119120000_priority_ticketing.sql. Not applied by the build.

alter table public.priority_events
  add column if not exists stripe_account_id text
  check (stripe_account_id is null or stripe_account_id ~ '^acct_[A-Za-z0-9]+$');

comment on column public.priority_events.stripe_account_id is
  'Stripe Connect connected account (acct_...) that receives the ticket money. Null means UBP receives it. Not readable by the public.';

-- Keep the account id private. The website and app read named columns, so
-- swap the table wide select for a column list that leaves it out.
revoke select on public.priority_events from anon, authenticated;
grant select (
  id, slug, title, genre, city, venue, address, starts_at, doors_at,
  age_min, blurb, lineup, image_url, status, created_at
) on public.priority_events to anon, authenticated;
