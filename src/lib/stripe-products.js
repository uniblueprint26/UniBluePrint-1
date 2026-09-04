// Pro subscription tiers. No Stripe price IDs here on purpose, the
// checkout Edge Function (supabase/functions/create-checkout-session)
// builds the Stripe line item inline from this same data at checkout
// time, so there's nothing to separately create in the Stripe dashboard
// and nothing that can drift out of sync between "what the site shows"
// and "what Stripe actually charges". Update prices here only.
export const STRIPE_PRODUCTS = {
  pro_monthly: {
    tier: 'pro_monthly',
    amount: 699,       // €6.99 in cents, standard price
    trialAmount: 350,  // €3.50 in cents, 50% off during the free trial
    interval: 'month',
  },
  pro_annual: {
    tier: 'pro_annual',
    amount: 4999,      // €49.99 in cents, standard price
    trialAmount: 2499, // €24.99 in cents, 50% off during the free trial
    interval: 'year',
  },
}
