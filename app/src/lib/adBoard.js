/**
 * adBoard.js — the data side of the Ad Board.
 *
 * Every chip on the board (Deals, Jobs, Rides, Lost and found, Tutors, Notes)
 * is read from tables that already exist, and each row is normalised into one
 * "listing" shape so the card never needs to know which table it came from.
 *
 *   Deals          deals (+ partners for name/logo), ads (paid ads),
 *                  marketplace_listings (buy and sell), student_ads (not
 *                  tutoring), marketplace_skills (not tutoring)
 *   Jobs           opportunities
 *   Rides          carpool_routes
 *   Lost and found lost_found_posts
 *   Tutors         marketplace_skills (Tutoring & Academic), student_ads
 *                  (Tutoring)
 *   Notes          shared_notes
 *
 * Where a table only has some of the fields a card wants, the listing simply
 * leaves the rest out. Nothing here invents data.
 *
 * Origin tags: `origin` is 'ubp' for rows UBP wrote itself (seeded or curated),
 * 'campus' or 'course' for rows that really live on a Campus Connect or
 * Course Connect board and are shown here with that pillar's label, and null
 * for ordinary Ad Board content.
 */
import { supabase } from './supabase'

export const AD_BOARD_KINDS = [
  { key: 'deals',  label: 'Deals' },
  { key: 'jobs',   label: 'Jobs' },
  { key: 'rides',  label: 'Rides' },
  { key: 'lost',   label: 'Lost and found' },
  { key: 'tutors', label: 'Tutors' },
  { key: 'notes',  label: 'Notes' },
]

// Tables whose rows are a Campus Connect or Course Connect board post that
// happens to surface on a different chip. These get the pillar label.
// (Rides, Jobs and Lost and found are the board's own chips, so they are not
// labelled. Add the table here to label them too.)
const ORIGIN_BY_SOURCE = {
  student_ads: 'campus',
  shared_notes: 'course',
}

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

function dayWord(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr)
  if (isNaN(d)) return ''
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const that = new Date(d); that.setHours(0, 0, 0, 0)
  const days = Math.round((today - that) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return shortDate(dateStr)
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
    origin: ORIGIN_BY_SOURCE[source] || (isFromUbp(row) ? 'ubp' : null),
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

function fromDeal(row) {
  const partner = row.partners || null
  if (partner && partner.active === false) return null
  if (row.valid_until && new Date(row.valid_until) < new Date()) return null
  const name = partner?.name || null
  return base('deals', row, {
    kind: 'deals',
    visual: 'deal',
    typeLabel: 'Partner deal',
    title: row.title,
    meta: compact([name, untilText(row.valid_until)]),
    // Deals are curated by the UBP team, so they always carry the tag.
    origin: 'ubp',
    percent: row.discount_percent || null,
    description: row.description || null,
    partner: partner ? { name, logoUrl: partner.logo_url || null, slug: partner.partner_slug || null } : null,
    action: 'partner',
    details: compact([
      name ? { label: 'Partner', value: name } : null,
      row.valid_until ? { label: 'Valid until', value: shortDate(row.valid_until) } : null,
    ]),
  })
}

function fromAd(row) {
  return base('ads', row, {
    kind: 'deals',
    visual: 'ad',
    typeLabel: 'Ad',
    title: row.title,
    meta: compact([clip(row.description, 90)]),
    // A paid ad with no poster is one UBP placed itself.
    origin: row.user_id ? null : 'ubp',
    description: row.description || null,
    link: row.target_url || row.link || null,
    // Ads UBP placed itself open the link or the partner card. Ads a student
    // paid for open the detail card (with a Report option).
    action: row.user_id ? 'detail' : (row.target_url || row.link ? 'link' : 'partner'),
    partner: { name: row.brand || row.title, slug: null },
  })
}

function fromMarketplaceListing(row) {
  return base('marketplace_listings', row, {
    kind: 'deals',
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
    meta: compact([tutoring ? null : row.category, row.poster_name, timeAgo(row.created_at)]),
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

function fromStudentAd(row, kind) {
  const tutoring = row.ad_type === 'Tutoring'
  return base('student_ads', row, {
    kind,
    visual: tutoring ? 'tutor' : 'sale',
    typeLabel: row.ad_type || 'Student ad',
    title: row.title,
    meta: compact([row.poster_name, timeAgo(row.created_at)]),
    price: priceFrom(row.price, null),
    description: row.description,
    contact: row.contact_method,
    board: { key: 'ads', registry: 'campus', title: 'Student Ads' },
    action: 'detail',
  })
}

function fromOpportunity(row) {
  const when = row.deadline ? `Deadline ${shortDate(row.deadline)}` : null
  return base('opportunities', row, {
    kind: 'jobs',
    visual: 'job',
    typeLabel: row.opportunity_type === 'Part-time job' ? 'Job' : (row.opportunity_type || 'Job'),
    title: row.title,
    meta: compact([row.organisation, when || timeAgo(row.created_at)]),
    description: row.description,
    link: row.link || null,
    board: { key: 'opportunities', registry: 'campus', title: 'Opportunities' },
    action: 'detail',
    details: compact([
      row.organisation ? { label: 'Organisation', value: row.organisation } : null,
      row.opportunity_type ? { label: 'Type', value: row.opportunity_type } : null,
      row.deadline ? { label: 'Deadline', value: shortDate(row.deadline) } : null,
    ]),
  })
}

function daysText(days) {
  if (!Array.isArray(days) || days.length === 0) return ''
  if (days.length === 5 && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every(d => days.includes(d))) return 'Mon to Fri'
  if (days.length === 7) return 'Every day'
  return days.join(', ')
}

function fromRoute(row) {
  const seats = row.seats_available
  const when = compact([daysText(row.days), row.departure_time]).join(' ')
  const free = row.contribution === 'No'
  return base('carpool_routes', row, {
    kind: 'rides',
    visual: 'ride',
    typeLabel: 'Ride share',
    title: `${row.from_location} to ${row.to_location}`,
    meta: compact([when, seats != null ? `${seats} seat${seats === 1 ? '' : 's'} left` : null, row.contribution === 'Yes' ? 'Fuel share' : null]),
    price: free ? { main: 'Free', sub: 'per seat' } : null,
    description: row.notes || null,
    contact: row.contact_preference,
    board: { key: 'carpool', registry: 'campus', title: 'Carpooling' },
    action: 'detail',
    details: compact([
      { label: 'From', value: row.from_location },
      { label: 'To', value: row.to_location },
      when ? { label: 'When', value: when } : null,
      seats != null ? { label: 'Seats', value: String(seats) } : null,
      row.contribution ? { label: 'Fuel contribution', value: row.contribution } : null,
    ]),
  })
}

function fromLostFound(row) {
  const found = row.status === 'Found'
  return base('lost_found_posts', row, {
    kind: 'lost',
    visual: 'lost',
    typeLabel: found ? 'Found' : 'Lost',
    title: clip(row.item_description, 60),
    meta: compact([row.location, dayWord(row.date_occurred) || timeAgo(row.created_at)]),
    description: row.item_description,
    contact: row.contact_method,
    board: { key: 'lost-found', registry: 'campus', title: 'Lost and Found' },
    action: 'detail',
    details: compact([
      row.location ? { label: found ? 'Found at' : 'Last seen', value: row.location } : null,
      row.date_occurred ? { label: 'Date', value: shortDate(row.date_occurred) } : null,
    ]),
  })
}

function fromNote(row) {
  return base('shared_notes', row, {
    kind: 'notes',
    visual: 'notes',
    typeLabel: 'Notes',
    title: row.title,
    meta: compact([row.course, row.year]),
    description: null,
    fileUrl: row.file_url,
    board: { key: 'notes', registry: 'course', title: 'Shared Notes' },
    action: 'detail',
    details: compact([
      row.subject ? { label: 'Subject', value: row.subject } : null,
      row.course ? { label: 'Course', value: row.course } : null,
      row.year ? { label: 'Year', value: row.year } : null,
      row.institution ? { label: 'Institution', value: row.institution } : null,
      { label: 'Downloads', value: String(row.download_count || 0) },
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
  deals: async () => (await read('deals', '*, partners(name, logo_url, partner_slug, active)', q => q.eq('active', true))).map(fromDeal).filter(Boolean),
  ads: async () => (await read('ads', '*', q => q.eq('active', true).overlaps('boards', ['cross-ireland', 'campus', 'course']))).map(fromAd),
  listings: async () => (await read('marketplace_listings', '*', q => q.eq('status', 'active'))).map(fromMarketplaceListing),
  skillsOther: async () => (await read('marketplace_skills', '*', q => q.eq('status', 'active')))
    .filter(r => r.category !== TUTORING_CATEGORY).map(r => fromSkill(r, 'deals')),
  skillsTutoring: async () => (await read('marketplace_skills', '*', q => q.eq('status', 'active')))
    .filter(r => r.category === TUTORING_CATEGORY).map(r => fromSkill(r, 'tutors')),
  studentAdsOther: async () => (await read('student_ads', '*', q => q.eq('status', 'active')))
    .filter(r => r.ad_type !== 'Tutoring').map(r => fromStudentAd(r, 'deals')),
  studentAdsTutoring: async () => (await read('student_ads', '*', q => q.eq('status', 'active')))
    .filter(r => r.ad_type === 'Tutoring').map(r => fromStudentAd(r, 'tutors')),
  jobs: async () => {
    const today = new Date().toISOString().slice(0, 10)
    return (await read('opportunities', '*')).filter(r => !r.deadline || r.deadline >= today).map(fromOpportunity)
  },
  rides: async () => (await read('carpool_routes', '*', q => q.eq('active', true))).map(fromRoute),
  lost: async () => (await read('lost_found_posts', '*')).map(fromLostFound),
  notes: async () => (await read('shared_notes', '*')).map(fromNote),
}

const SOURCES_BY_KIND = {
  deals: ['deals', 'ads', 'listings', 'studentAdsOther', 'skillsOther'],
  jobs: ['jobs'],
  rides: ['rides'],
  lost: ['lost'],
  tutors: ['skillsTutoring', 'studentAdsTutoring'],
  notes: ['notes'],
}

/**
 * fetchListings(kind) → { items, failed }
 * `items` is newest first, except that on Deals the partner deals and paid
 * ads come before student listings. `failed` is true only when every source
 * for the chip errored, so the screen can say so instead of showing "empty".
 */
export async function fetchListings(kind) {
  const names = SOURCES_BY_KIND[kind] || []
  const results = await Promise.allSettled(names.map(n => SOURCES[n]()))
  const ok = results.filter(r => r.status === 'fulfilled')
  const items = ok.flatMap(r => r.value)
  items.sort((a, b) => {
    if (kind === 'deals') {
      const rank = x => (x.source === 'deals' ? 0 : x.source === 'ads' ? 1 : 2)
      if (rank(a) !== rank(b)) return rank(a) - rank(b)
    }
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })
  return { items, failed: names.length > 0 && ok.length === 0 }
}
