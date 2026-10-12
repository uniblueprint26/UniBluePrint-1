/**
 * useProAccess — whether the current user currently has Pro-tier access.
 *
 * The single shared gate for every Pro-only surface in the app — Elevation
 * Blueprint (full access to all six services), full Lifestyle Blueprint,
 * Foundation's Premium-tier discount/priority queue, the Weekly Blueprint
 * Report, etc — per docs/business/subscription-pricing-model.md (task
 * #56/D2, resolved by the founder: "Gate it behind isPro"). Every screen
 * that needs to know "is this user Pro?" should read it from here rather
 * than re-deriving it from `subscription` directly, so the whole app
 * agrees on exactly what "Pro" means and there is one place to change it.
 *
 * Wraps AuthContext's `isPro` (itself computed from the same
 * `subscriptions` row Stripe's webhook keeps in sync — see
 * supabase/functions/stripe-webhook/index.ts and AuthContext.jsx's own
 * `isPro` derivation) rather than re-reading `subscription` fields here,
 * so there is exactly one place that decides what counts as an active
 * subscription.
 *
 * Fails closed, same contract as useInvestmentAccess
 * (hooks/useInvestmentAccess.js):
 *   - signed out                -> canAccess: false
 *   - subscription still loading -> canAccess: false (but loading: true,
 *     so a caller can hold off rendering a paywall until it's sure, and
 *     avoid flashing one at a real Pro user mid-fetch)
 *   - the subscriptions fetch errored -> canAccess: false (AuthContext
 *     itself keeps subscriptionLoading resolving to false on error rather
 *     than spinning forever — see its own comment)
 *   - never true for an unknown/unresolved status.
 *
 * import { useProAccess } from '../hooks/useProAccess'
 * const { canAccess, isPro, isComplimentaryPro, loading, isSignedIn } = useProAccess()
 */

import { useAuth } from '../context/AuthContext'

export function useProAccess() {
  const { user, isPro, isComplimentaryPro, subscription, subscriptionLoading } = useAuth()
  return {
    canAccess: !!isPro,
    isPro: !!isPro,
    isComplimentaryPro: !!isComplimentaryPro,
    subscription,
    loading: !!subscriptionLoading,
    isSignedIn: !!user,
  }
}
