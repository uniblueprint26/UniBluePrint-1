// Parses ElevationScreen.jsx's COACHES array (`from` / `pricelist`) into a
// normalized shape CoachBookingScreen uses to decide which booking UI to
// show. Coach pricing is NOT a clean fixed table like Foundation's 8
// services — three shapes exist in the data:
//
//   1. 'pricelist' — a coach with a `pricelist` array of named line items at
//      different prices (e.g. JMC Fitness, Camila Aruk). The student must
//      pick ONE item; its price is what gets charged (unless it parses to
//      0/"Free", in which case there's nothing to charge for that item —
//      see `chargeable` below).
//   2. 'flat' — a coach with a single parseable `from` price and no
//      pricelist (e.g. "€50/hr"). Charged directly. No coach in today's
//      roster is actually in this bucket (every priced coach happens to
//      have a pricelist too), but it's supported so a future coach with
//      just a flat price doesn't need a code change here.
//   3. 'enquiry' — `from: 'Available on request'` (or equivalent, e.g.
//      "Let's chat pricing") — no real number exists to charge, so these
//      coaches keep the original enquiry-only flow untouched.
//
// This is a DISPLAY/UI-shape helper only. The actual amount Stripe charges
// is computed independently, server-side, in create-coach-checkout-
// session/index.ts's own hand-kept COACH_PRICING map — never trusted from
// anything this module or the client computes. The two are expected to
// agree (same tradeoff create-foundation-checkout-session's PRICING map
// already accepts against the pricing doc), so if a coach's pricelist
// here ever changes, that server-side map needs the matching update.

function parseEuroCents(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  if (/^free$/i.test(s)) return 0
  const match = s.match(/€\s*([0-9]+(?:[.,][0-9]{1,2})?)/)
  if (!match) return null
  const n = parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

export function getCoachPricingShape(coach) {
  if (Array.isArray(coach?.pricelist) && coach.pricelist.length > 0) {
    const items = coach.pricelist.map(item => {
      const cents = parseEuroCents(item.price)
      return {
        label: item.label,
        priceLabel: item.price,
        cents,
        // Only a positive, parseable price is actually payable — "Free" (0)
        // or an unparseable price (null) books directly, no payment step.
        chargeable: typeof cents === 'number' && cents > 0,
      }
    })
    return { kind: 'pricelist', items }
  }

  const cents = parseEuroCents(coach?.from)
  if (typeof cents === 'number' && cents > 0) {
    return { kind: 'flat', cents, priceLabel: coach.from }
  }

  return { kind: 'enquiry' }
}

export function formatEuro(cents) {
  return `€${(cents / 100).toFixed(2)}`
}
