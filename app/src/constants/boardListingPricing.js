/**
 * Ad Board / Marketplace listing pricing — docs/business/subscription-pricing-model.md
 * §1.6 (Advertisement Board) and §1.7 (Marketplace "Providing Services" listings),
 * both added/changed 12 Oct 2026.
 *
 * Kept in sync with the canonical pricing doc by hand, same tradeoff
 * create-foundation-checkout-session's own PRICING map already accepts —
 * and mirrored exactly in that edge function's own copy of these numbers
 * (supabase/functions/create-board-listing-checkout-session/index.ts),
 * since the edge function is the actual source of truth for what Stripe
 * charges; this file is only for client-side "here's what you're about to
 * pay" disclosure before checkout even starts.
 *
 * §1.6 Ad Board: 1 free ad per calendar month for everyone (free and Pro).
 * From the 2nd ad that month: €4.99 free tier / €1.99 Pro.
 *
 * §1.7 Marketplace "Providing Services" (the Skills Marketplace board's
 * `listing_type === 'Offering a skill'` rows — NOT Buy & Sell, and NOT
 * 'Looking for a skill', which is a request rather than a service being
 * provided): every listing is paid, no free one. €2.99 free tier / €0.99 Pro.
 */

export const AD_BOARD_PRICE_CENTS = { free: 499, pro: 199 }
export const MARKETPLACE_SKILL_PRICE_CENTS = { free: 299, pro: 99 }

export function formatEuro(cents) {
  return `€${(cents / 100).toFixed(2)}`
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}
