/**
 * adBoard.js — the data side of the Ad Board.
 *
 * The Marketplace baskets (Deals, Jobs, Tutors, Buy and sell) are read from
 * tables that already exist, and each row is normalised into one "listing"
 * shape so a card never needs to know which table it came from.
 *
 *   deals        deals (+ partners for name and logo). Lifestyle partners only.
 *   jobs         opportunities
 *   tutors       marketplace_skills (Tutoring & Academic)
 *   marketplace  marketplace_listings (buy and sell), marketplace_skills
 *                (everything except tutoring)
 *
 * Ride shares, Lost and found and Notes are Campus Connect features and are
 * not read here. Where a table only has some of the fields a card wants, the
 * listing simply leaves the rest out. Nothing here invents data.
 *
 * `origin` is 'ubp' for rows UBP wrote itself (seeded or curated), else null.
 * Cards show "From UBP" for those and "Posted by a student" on Jobs otherwise.
 */
import { supabase } from './supabase'
import { UBP_CARDS, UBP_PLACEMENTS, EXAMPLE_TUTORS, PLACEMENT_URL } from '../constants/adBoardContent'
import { isFoundationEnabledNow } from '../hooks/useAppFlags'

export const AD_BOARD_KINDS = ['deals', 'jobs', 'tutors', 'marketplace']

const LIMIT = 40
const TUTORING_CATEGORY = 'Tutoring & Academic'

// ── Small helpers ────────────────────────────────────────────────────────────

function isFromUbp(row) {
  if (!row) return false
  if (row.is_example === true || row.is_seed === true || row.seeded === true || row.from_ubp === true) return true
  const src = String(row.source || row.origin || '').toLowerCase()
  if (src === 'ubp' || src === 'seed' || src === 'seeded') return true
  if (/^\s*(uniblueprint|ubp)\b/i.test(row.poster_name || '')) return true
  return false
}

// "Reviewed" is only ever shown for rows that carry an approved state.
function isReviewed(row) {
  if (!row) return false
  if (row.approved === true || row.reviewed === true || row.is_reviewed === true) return true
  const s = String(row.review_status || row.status || '').toLowerCase()
  return s === 'approved' || s === 'reviewed'
}

export function formatEuro(n) {
  const v = Number(n)
  if (!isFinite(v)) return null
  return `€${Number.isInteger(v) ? v : v.toFixed(2)}`
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

function shortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function untilText(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  const ms = d - Date.now()
  if (ms <= 0) return ''
  const days = Math.ceil(ms / 86400000)
  if (days <= 1) return 'Ends today'
  if (days <= 6) return `Ends ${d.toLocaleDateString('en-IE', { weekday: 'long' })}`
  return `Until ${d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}`
}

function clip(text, n = 110) {
  const t = String(text || '').trim().replace(/\s+/g, ' ')
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}

function compact(list) {
  return list.filter(Boolean)
}

function priceFrom(amount, sub) {
  if (amount == null || amount === '') return null
  const main = formatEuro(amount)
  return main ? { main, sub: sub || null } : null
}

function rateSub(rateType) {
  if (rateType === 'Hourly rate') return 'per hour'
  if (rateType === 'Fixed price') return 'fixed price'
  if (rateType === 'Budget (negotiable)') return 'budget'
  return null
}

function base(source, row, extra) {
  return {
    key: `${source}:${row.id}`,
    id: row.id,
    source,
    createdAt: row.created_at,
    origin: isFromUbp(row) ? 'ubp' : null,
    reviewed: isReviewed(row),
    ownerId: row.user_id || null,
    posterName: row.poster_name || null,
    raw: row,
    meta: [],
    details: [],
    price: null,
    ...extra,
  }
}

// ── Per-source normalisers ───────────────────────────────────────────────────

// Deals on the Ad Board are Lifestyle deals. The partners table has no pillar
// column today and every partner in it is a Lifestyle partner, so a deal counts
// as Lifestyle unless the partner row says it belongs to another pillar.
function isLifestylePartner(partner) {
  const p = String(partner?.pillar || '').toLowerCase()
  return !p || p === 'lifestyle'
}

function fromDeal(row) {
  const partner = row.partners || null
  if (partner && partner.active === false) return null
  if (!isLifestylePartner(partner)) return null
  if (row.valid_until && new Date(row.valid_until) < new Date()) return null
  const name = partner?.name || null
  return base('deals', row, {
    kind: 'deals',
    visual: 'deal',
    typeLabel: 'Lifestyle',
    title: row.title,
    from: name,
    meta: compact([untilText(row.valid_until)]),
    // Deals are curated by the UBP team, so they always carry the tag.
    origin: 'ubp',
    percent: row.discount_percent || null,
    price: row.discount_percent ? { main: `${row.discount_percent}%`, sub: 'off' } : null,
    description: row.description || null,
    partner: partner ? { name, logoUrl: partner.logo_url || null, slug: partner.partner_slug || null } : null,
    action: 'partner',
    details: compact([
      name ? { label: 'Partner', value: name } : null,
      { label: 'Part of', value: 'Lifestyle' },
      row.valid_until ? { label: 'Valid until', value: shortDate(row.valid_until) } : null,
    ]),
  })
}

function fromMarketplaceListing(row) {
  return base('marketplace_listings', row, {
    kind: 'marketplace',
    visual: 'sale',
    typeLabel: row.listing_type === 'Wanted' ? 'Wanted' : 'For sale',
    title: row.title,
    meta: compact([row.category, row.condition, timeAgo(row.created_at)]),
    price: priceFrom(row.price, null),
    description: row.description,
    contact: row.contact_method,
    board: { key: 'buysell', registry: 'marketplace', title: 'Buy & Sell' },
    action: 'detail',
    details: compact([
      row.category ? { label: 'Category', value: row.category } : null,
      row.condition ? { label: 'Condition', value: row.condition } : null,
    ]),
  })
}

function fromSkill(row, kind) {
  const tutoring = row.category === TUTORING_CATEGORY
  const offering = row.listing_type !== 'Looking for a skill'
  const typeLabel = tutoring
    ? (offering ? 'Tutor' : 'Looking for a tutor')
    : (offering ? 'Skill' : 'Looking for a skill')
  return base('marketplace_skills', row, {
    kind,
    visual: tutoring ? 'tutor' : 'skill',
    typeLabel,
    title: row.title,
    from: row.poster_name || null,
    meta: compact([tutoring ? null : row.category, timeAgo(row.created_at)]),
    price: priceFrom(row.rate_amount, rateSub(row.rate_type)),
    description: row.description,
    contact: row.contact_method,
    board: { key: 'skills', registry: 'marketplace', title: 'Skills Marketplace' },
    action: 'detail',
    details: compact([
      row.category ? { label: 'Category', value: row.category } : null,
      row.rate_type ? { label: 'Rate', value: row.rate_amount != null ? `${formatEuro(row.rate_amount)} · ${row.rate_type}` : row.rate_type } : null,
    ]),
  })
}

// Jobs: who it is from, the job type, and whether UBP or a student posted it.
function fromOpportunity(row) {
  const when = row.deadline ? `Deadline ${shortDate(row.deadline)}` : null
  const byUbp = isFromUbp(row)
  return base('opportunities', row, {
    kind: 'jobs',
    visual: 'job',
    typeLabel: row.opportunity_type || 'Job',
    title: row.title,
    from: row.organisation || row.poster_name || null,
    meta: compact([when || timeAgo(row.created_at)]),
    byStudent: !byUbp,
    description: row.description,
    link: row.link || null,
    // noLink: used to label a message, never as a link into Campus Connect.
    board: { key: 'opportunities', registry: 'campus', title: 'Opportunities', noLink: true },
    action: 'detail',
    details: compact([
      row.organisation ? { label: 'From', value: row.organisation } : null,
      row.opportunity_type ? { label: 'Type', value: row.opportunity_type } : null,
      row.deadline ? { label: 'Deadline', value: shortDate(row.deadline) } : null,
    ]),
  })
}

// ── Sources ──────────────────────────────────────────────────────────────────

async function read(table, select, filter) {
  let q = supabase.from(table).select(select)
  if (filter) q = filter(q)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(LIMIT)
  if (error) throw error
  return data || []
}

const SOURCES = {
  // partners(*) so a pillar column on partners is picked up if it exists.
  deals: async () => (await read('deals', '*, partners(*)', q => q.eq('active', true))).map(fromDeal).filter(Boolean),
  listings: async () => (await read('marketplace_listings', '*', q => q.eq('status', 'active'))).map(fromMarketplaceListing),
  skillsOther: async () => (await read('marketplace_skills', '*', q => q.eq('status', 'active')))
    .filter(r => r.category !== TUTORING_CATEGORY).map(r => fromSkill(r, 'marketplace')),
  skillsTutoring: async () => (await read('marketplace_skills', '*', q => q.eq('status', 'active')))
    .filter(r => r.category === TUTORING_CATEGORY).map(r => fromSkill(r, 'tutors')),
  jobs: async () => {
    const today = new Date().toISOString().slice(0, 10)
    return (await read('opportunities', '*')).filter(r => !r.deadline || r.deadline >= today).map(fromOpportunity)
  },
}

const SOURCES_BY_KIND = {
  deals: ['deals'],
  jobs: ['jobs'],
  tutors: ['skillsTutoring'],
  marketplace: ['listings', 'skillsOther'],
}

/**
 * fetchListings(kind) → { items, failed }
 * `items` is newest first. `failed` is true only when every source for the basket errored, so
 * the screen can say so instead of showing "empty".
 */
export async function fetchListings(kind) {
  const names = SOURCES_BY_KIND[kind] || []
  const results = await Promise.allSettled(names.map(n => SOURCES[n]()))
  const ok = results.filter(r => r.status === 'fulfilled')
  const items = ok.flatMap(r => r.value)
  items.sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })
  return { items, failed: names.length > 0 && ok.length === 0 }
}

/**
 * fetchCurrentIssue() → { number, theme } | null
 * The current Weekly Blueprint issue, for the magazine card. Any failure
 * returns null and the card uses its fixed headline.
 */
export async function fetchCurrentIssue() {
  try {
    const { data, error } = await supabase.rpc('get_current_weekly_issue')
    if (error) return null
    const row = data?.[0]
    if (!row) return null
    return { number: row.issue_number ?? null, theme: row.theme || null }
  } catch {
    return null
  }
}

// ── Hand-written cards (not stored in the database) ──────────────────────────

/** A "Posted by UBP" card, shaped like a listing so ListingCard can draw it. */
export function ubpCardToItem(card) {
  return {
    key: card.id,
    id: card.id,
    source: 'ubp',
    visual: card.visual,
    typeLabel: card.typeLabel,
    title: card.title,
    meta: [card.blurb],
    hint: card.opens,
    origin: 'ubp',
    tagLabel: 'POSTED BY UBP',
    card,
  }
}

/** The UBP cards for the From UBP basket, or a basket's own starter cards. */
export function ubpItems(starterFor) {
  const all = starterFor ? UBP_CARDS.filter(c => c.starterFor === starterFor) : UBP_CARDS
  // A card that opens Foundation is left out while Foundation is closed on iOS and Android.
  const cards = isFoundationEnabledNow() ? all : all.filter(c => c.action?.route !== 'Foundation')
  return cards.map(ubpCardToItem)
}

/** The UBP internships, pinned at the top of Jobs. Fixed, never stored. */
export function pinnedJobItems() {
  return UBP_PLACEMENTS.map(p => ({
    key: p.id,
    id: p.id,
    source: 'ubp-placement',
    visual: 'job',
    typeLabel: 'Placement',
    team: p.team,
    title: p.title,
    summary: p.summary,
    origin: 'ubp',
    tagLabel: 'POSTED BY UBP',
    applyUrl: PLACEMENT_URL,
    pinned: true,
  }))
}

/** Example tutors, clearly labelled. Always shown after the real ones. Never stored. */
export function exampleTutorItems() {
  return EXAMPLE_TUTORS.map(e => ({
    key: e.id,
    id: e.id,
    source: 'example',
    visual: 'tutor',
    chip: e.industry,
    typeLabel: e.industry,
    title: e.subject,
    meta: [e.blurb],
    price: { main: '€?', tag: 'EXAMPLE' },
    example: true,
    exampleLine: 'Example, not a real tutor',
  }))
}
