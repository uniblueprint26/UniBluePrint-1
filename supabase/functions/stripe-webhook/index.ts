// TODO: Deploy this Edge Function to Supabase when Stripe is activated
//
// Deploy command:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Required environment variables (set via Supabase dashboard or CLI):
//   STRIPE_SECRET_KEY       — Stripe secret key (sk_live_xxxxx)
//   STRIPE_WEBHOOK_SECRET   — Stripe webhook signing secret (whsec_xxxxx)
//   SUPABASE_URL            — auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
//
// This function handles Stripe webhook events and updates user Pro status
// in the database.
//
// Events to handle:
//   checkout.session.completed      — grant Pro access after successful payment
//   customer.subscription.deleted   — revoke Pro access on cancellation
//   invoice.payment_failed          — flag account for failed payment follow-up

// TODO: Uncomment and implement when Stripe is activated

// import Stripe from 'https://esm.sh/stripe@14?target=deno'
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
// const supabase = createClient(
//   Deno.env.get('SUPABASE_URL')!,
//   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// )

// Deno.serve(async (req) => {
//   const signature = req.headers.get('stripe-signature')
//   const body = await req.text()
//
//   let event: Stripe.Event
//   try {
//     event = stripe.webhooks.constructEvent(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
//   } catch (err) {
//     return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
//   }
//
//   switch (event.type) {
//     case 'checkout.session.completed': {
//       // TODO: Extract customer email or user ID from session metadata
//       // TODO: Update profiles table — set is_pro = true, stripe_customer_id, subscription_id
//       // const session = event.data.object as Stripe.Checkout.Session
//       // await supabase.from('profiles').update({ is_pro: true, ... }).eq('email', session.customer_email)
//       break
//     }
//
//     case 'customer.subscription.deleted': {
//       // TODO: Revoke Pro access when subscription is cancelled or expires
//       // const subscription = event.data.object as Stripe.Subscription
//       // await supabase.from('profiles').update({ is_pro: false }).eq('stripe_customer_id', subscription.customer)
//       break
//     }
//
//     case 'invoice.payment_failed': {
//       // TODO: Flag account for payment retry follow-up
//       // Consider sending a reminder email via Resend Edge Function
//       break
//     }
//
//     default:
//       console.log(`Unhandled event type: ${event.type}`)
//   }
//
//   return new Response(JSON.stringify({ received: true }), {
//     headers: { 'Content-Type': 'application/json' },
//   })
// })

export default {}
