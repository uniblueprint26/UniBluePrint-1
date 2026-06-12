// Stripe product IDs — fill in when products are created in Stripe dashboard
export const STRIPE_PRODUCTS = {
  pro_monthly: {
    priceId: 'TODO: price_xxxxx',
    amount: 699,       // €6.99 in cents
    trialAmount: 699,  // September trial — same price, already 50% off
    interval: 'month',
  },
  pro_annual: {
    priceId: 'TODO: price_xxxxx',
    amount: 4999,      // €49.99 in cents
    trialAmount: 4999,
    interval: 'year',
  },
}
