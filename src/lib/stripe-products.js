// Pro subscription tiers. No Stripe price IDs here on purpose — the
// checkout Edge Function (supabase/functions/create-checkout-session)
// builds the Stripe line item inline from this same data at checkout
// time, so there's nothing to separately create in the Stripe dashboard
// and nothing that can drift out of sync between "what the site shows"
// and "what Stripe actually charges". Update prices here only.
export const STRIPE_PRODUCTS = {
  pro_monthly: {
    tier: 'pro_monthly',
    amount: 699,       // €6.99 in cents
    trialAmount: 699,  // September trial — same price, already 50% off
    interval: 'month',
  },
  pro_annual: {
    tier: 'pro_annual',
    amount: 4999,      // €49.99 in cents
    trialAmount: 4999,
    interval: 'year',
  },
}
