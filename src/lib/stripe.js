// The "/pure" entry point matters here: the default `@stripe/stripe-js`
// import has a side effect at module load time — it injects the
// https://js.stripe.com/v3 script tag immediately on import, before
// loadStripe() is ever called. That meant every visit to the Pricing page
// silently loaded a third-party script for every visitor, even ones who
// never touch checkout, and even before a real Stripe key is configured.
// The pure entry defers all of that until loadStripe() actually runs.
import { loadStripe } from '@stripe/stripe-js/pure'

// STRIPE_STATUS is read by CheckoutButton to decide whether to attempt a
// real checkout or fall back to a friendly "not set up yet" state — stays
// exported (rather than removed) so nothing needs touching again once a
// real key is added, this file just starts reporting 'configured'.
export const STRIPE_STATUS = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not_configured'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

export default stripePromise
