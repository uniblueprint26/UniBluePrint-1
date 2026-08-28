import { loadStripe } from '@stripe/stripe-js'

// STRIPE_STATUS is read by CheckoutButton to decide whether to attempt a
// real checkout or fall back to a friendly "not set up yet" state — stays
// exported (rather than removed) so nothing needs touching again once a
// real key is added, this file just starts reporting 'configured'.
export const STRIPE_STATUS = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not_configured'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

export default stripePromise
