/**
 * Real partner deals.
 *
 * Every live Lifestyle partner in data/lifestylePartners.js that has a `deal`
 * line is a real deal. The text is shown exactly as written there. Nothing is
 * invented here. A code is only read out of the deal text when the text names
 * one ("10% off with code ELECTXUNIBLUEPRINT").
 *
 * The `deals` database table can still hold rows. A row for a partner that is
 * already in this list is skipped, so a deal never shows twice. Sample rows
 * are filtered out by isRealDeal in lib/adBoard.js.
 */
import { PARTNERS } from '../data/lifestylePartners'

const CODE_RE = /\bcode\s+([A-Z0-9][A-Z0-9_-]{3,})\b/

export function extractDealCode(text) {
  const m = CODE_RE.exec(String(text || ''))
  return m ? m[1] : null
}

function percentOf(text) {
  const m = /(\d{1,2})\s*%/.exec(text)
  return m ? Number(m[1]) : 0
}

// 1 = has a code, 2 = a discount or a free or student offer, 3 = a price line.
function tierOf(text, code) {
  if (code) return 1
  if (/%|\boff\b|\bfree\b|discount|student|exclusive|members|verified/i.test(text)) return 2
  return 3
}

function toDeal(p) {
  const text = String(p.deal).trim()
  const code = extractDealCode(text)
  return {
    key: `partner-deal:${p.id}`,
    partnerId: p.id,
    brand: p.brand,
    text,
    code,
    logo: p.logo || null,
    initials: p.initials || (p.brand || '').slice(0, 2).toUpperCase(),
    initBg: p.initBg || '#374151',
    category: p.category || null,
    county: p.county || null,
    percent: percentOf(text),
    tier: tierOf(text, code),
  }
}

/** All real partner deals, best first: codes, then discounts (biggest first), then prices. */
export function getPartnerDeals() {
  return PARTNERS
    .filter(p => p.status === 'live' && typeof p.deal === 'string' && p.deal.trim())
    .map(toDeal)
    .sort((a, b) => a.tier - b.tier || b.percent - a.percent || a.brand.localeCompare(b.brand))
}

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** True when a database partner row is one of the real partners listed here. */
export function isListedPartner(partnerRow) {
  if (!partnerRow) return false
  const slug = norm(partnerRow.partner_slug)
  const name = norm(partnerRow.name)
  return getPartnerDeals().length > 0 && PARTNERS.some(p => p.status === 'live' && p.deal && (norm(p.id) === slug || norm(p.brand) === name))
}
