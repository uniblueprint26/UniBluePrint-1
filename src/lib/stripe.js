// TODO: Activate Stripe integration when payments go live
// Step 1: npm install @stripe/stripe-js
// Step 2: Add VITE_STRIPE_PUBLISHABLE_KEY to .env
// Step 3: Add STRIPE_SECRET_KEY to Supabase Edge Function environment
// Step 4: Uncomment the code below and remove the STRIPE_STATUS export

// import { loadStripe } from '@stripe/stripe-js'
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
// export default stripePromise

export const STRIPE_STATUS = 'not_configured'
