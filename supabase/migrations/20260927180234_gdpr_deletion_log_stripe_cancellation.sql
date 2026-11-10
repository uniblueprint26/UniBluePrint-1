-- P0-6 fix: delete-account never canceled the departing user's Stripe
-- subscription, so a Pro subscriber using self-service deletion lost their
-- account but Stripe kept billing a card with no account left to cancel
-- from. supabase/functions/delete-account now cancels the subscription
-- before deleting the user; this column records the outcome in the same
-- gdpr_deletion_log row it already writes (20260922090000_gdpr_self_
-- service.sql), rather than inventing a separate log.
alter table public.gdpr_deletion_log
  add column if not exists stripe_cancellation text;

comment on column public.gdpr_deletion_log.stripe_cancellation is
  'Outcome of canceling the deleted user''s Stripe subscription during self-service deletion: "none" if they had no stripe_subscription_id on file, "canceled:<id>" on success, or "error:<message>" if the Stripe call itself failed (deletion proceeds regardless -- Article 17 does not wait on Stripe). Written by supabase/functions/delete-account.';
