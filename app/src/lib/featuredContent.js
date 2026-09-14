import { supabase } from './supabase'
import { COACHES, coachSlug } from '../screens/ElevationScreen'
import { CAREER_SERVICES } from '../screens/FoundationScreen'
import { PARTNERS } from '../data/lifestylePartners'
import { CAMPUS_BOARDS } from '../constants/campusBoards'
import { COURSE_BOARDS } from '../constants/courseConnectBoards'

// ─── Home dashboard "Spotlight" carousel — resolving real, live content ───
//
// featured_content (Supabase) only stores WHAT to feature (content_type +
// ref_id) and how to present it (an optional caption/CTA override, a
// priority, an optional rotation window) — never a frozen copy of the
// referenced item's own fields. Every slide below is resolved against the
// same real source every other screen in the app reads from:
//   - foundation_service → CAREER_SERVICES (FoundationScreen.jsx)
//   - coach              → COACHES (ElevationScreen.jsx), with any
//                           founder-uploaded photo_url overlaid from
//                           coach_profiles (same join CoachProfileScreen uses)
//   - lifestyle_partner  → PARTNERS (data/lifestylePartners.js), with any
//                           founder-uploaded logo_url overlaid from `partners`
//   - campus_board /
//     course_board       → CAMPUS_BOARDS / COURSE_BOARDS (constants/), with
//                           a live count from that board's own real table
// So a price change, a new coach photo, or a fresh post always shows up on
// the next carousel load — nothing here is a snapshot taken at curation time.

function foundationService(row) {
  const svc = CAREER_SERVICES.find(s => s.title === row.ref_id)
  if (!svc) return null
  return {
    id: row.id,
    kicker: 'Foundation Blueprint',
    title: svc.title,
    subtitle: row.caption || svc.tagline,
    body: svc.description,
    priceLabel: `From ${svc.trialStd} · trial pricing`,
    tint: svc.color,
    ctaLabel: row.cta_label || 'View service',
    nav: { screen: 'Foundation' },
  }
}

async function coach(row) {
  const id = Number(row.ref_id)
  const c = COACHES.find(x => x.id === id)
  if (!c) return null
  // Bundled hero photo (e.g. Milan Piroska, Tadgh Darcy) is the default —
  // a founder-uploaded coach_profiles.photo_url, if one exists, overrides
  // it below. photoUrl can end up as either a remote URL string or a local
  // require()'d image module; SpotlightCarousel's SlideMedia handles both.
  let photoUrl = c.heroImage || null
  try {
    const { data } = await supabase
      .from('coach_profiles').select('photo_url')
      .eq('coach_slug', coachSlug(c.id)).maybeSingle()
    if (data?.photo_url) photoUrl = data.photo_url
  } catch { /* keep bundled hero (or fall back to initials) below */ }
  return {
    id: row.id,
    kicker: 'Find a Coach',
    title: c.name,
    subtitle: row.caption || c.tagline || c.title || c.category,
    body: c.category,
    priceLabel: c.from || null,
    photoUrl,
    initials: initialsOf(c.name),
    ctaLabel: row.cta_label || 'View coach',
    nav: { screen: 'CoachProfile', params: { coach: c } },
  }
}

async function lifestylePartner(row) {
  const p = PARTNERS.find(x => x.id === row.ref_id)
  if (!p) return null
  let photoUrl = p.logo || null
  try {
    const { data } = await supabase
      .from('partners').select('logo_url')
      .eq('partner_slug', p.id).maybeSingle()
    if (data?.logo_url) photoUrl = data.logo_url
  } catch { /* fall back to initials treatment below */ }
  return {
    id: row.id,
    kicker: 'Lifestyle Blueprint',
    title: p.brand,
    subtitle: row.caption || p.tagline,
    body: p.deal,
    priceLabel: p.deal || null,
    photoUrl,
    initials: p.initials,
    initBg: p.initBg,
    ctaLabel: row.cta_label || 'View deal',
    nav: { screen: 'LifestylePartners', params: { highlightId: p.id } },
  }
}

async function board(row, kind) {
  const list = kind === 'campus_board' ? CAMPUS_BOARDS : COURSE_BOARDS
  const b = list.find(x => x.key === row.ref_id)
  if (!b) return null
  let count = null
  if (b.table) {
    try {
      const { count: c } = await supabase
        .from(b.table).select('id', { count: 'exact', head: true })
      count = c ?? 0
    } catch { /* leave count null — copy below handles it */ }
  }
  const body = count === null
    ? 'Open the board'
    : count === 0
      ? 'Just launched — be the first to post'
      : `${count} live ${count === 1 ? 'post' : 'posts'} right now`
  return {
    id: row.id,
    kicker: kind === 'campus_board' ? 'Campus Connect' : 'Course Connect',
    title: b.title,
    subtitle: row.caption || b.tagline,
    body,
    tint: b.color,
    emoji: b.icon,
    ctaLabel: row.cta_label || 'Open board',
    nav: {
      screen: 'BoardDetail',
      params: kind === 'course_board' ? { boardKey: b.key, registry: 'course' } : { boardKey: b.key },
    },
  }
}

function initialsOf(name) {
  if (!name) return '??'
  const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean)
  return (words[0]?.[0] || '') + (words[1]?.[0] || '')
}

const RESOLVERS = {
  foundation_service: async row => foundationService(row),
  coach,
  lifestyle_partner: lifestylePartner,
  campus_board: row => board(row, 'campus_board'),
  course_board: row => board(row, 'course_board'),
}

// Fetches the active, in-window featured_content rows and resolves each one
// against its real live source. Rows that fail to resolve (a stale ref_id
// pointing at something removed) are silently dropped rather than shown
// broken — curation errors should never crash or blank the home screen.
export async function fetchSpotlightSlides() {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('featured_content')
    .select('*')
    .eq('active', true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return []

  const resolved = await Promise.all(data.map(async row => {
    const resolver = RESOLVERS[row.content_type]
    if (!resolver) return null
    try { return await resolver(row) } catch { return null }
  }))
  return resolved.filter(Boolean)
}
