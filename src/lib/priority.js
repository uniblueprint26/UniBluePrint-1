// Priority ticketing helpers for the website. Events, tiers and tickets all
// come from the database (migration 20261119120000_priority_ticketing.sql).
// Nothing here is invented data. Prices shown are display only: the real price
// is always read again on the server when someone buys.

import { supabase } from './supabase'
import { invokeFunction } from './invokeFunction'

// Priority's own look: black with a chrome and silver finish. Same values as
// app/src/constants/priorityTheme.js (priorityChrome).
export const PC = {
  black: '#070707',
  surface: '#121212',
  card: '#1A1A1A',
  cardAlt: '#232323',
  fg: '#F2F1EE',
  muted: '#9A9A95',
  faint: '#8C8C87',
  border: 'rgba(242,241,238,0.14)',
  borderStrong: 'rgba(185,185,180,0.32)',
  silver: '#B9B9B4',
  silverBright: '#FFFFFF',
  silverDeep: '#8C8C87',
  danger: '#E39A8D',
  success: '#4ADE80',
}

export const CHROME_TEXT = {
  background: 'linear-gradient(100deg, #8C8C87 0%, #FFFFFF 38%, #B9B9B4 62%, #FFFFFF 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
}

export const FONT_SERIF = "'Playfair Display', 'DM Serif Display', serif"
export const FONT_SANS = "'DM Sans', sans-serif"

export const MAX_QUANTITY = 6

export const primaryButton = {
  display: 'block', width: '100%', textAlign: 'center', boxSizing: 'border-box',
  padding: '16px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
  background: PC.silver, color: PC.black,
  fontFamily: FONT_SANS, fontSize: '16px', fontWeight: 700, textDecoration: 'none',
}

export const ghostButton = {
  display: 'inline-block', textAlign: 'center', boxSizing: 'border-box',
  padding: '12px 20px', borderRadius: '12px', cursor: 'pointer',
  background: 'transparent', color: PC.fg, border: `1px solid ${PC.borderStrong}`,
  fontFamily: FONT_SANS, fontSize: '15px', fontWeight: 600, textDecoration: 'none',
}

// Genres Priority runs today. A genre not listed here still shows, as plain text.
const GENRE_LABELS = { house: 'House', afrobeats: 'Afrobeats', folk: 'Folk' }
export function genreLabel(genre) {
  if (!genre) return ''
  const key = String(genre).toLowerCase()
  return GENRE_LABELS[key] || genre
}

const TZ = 'Europe/Dublin'

export function formatEventDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-IE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
  }).format(new Date(iso))
}

export function formatTime(iso) {
  if (!iso) return ''
  // en-GB gives "6:23 pm" (en-IE gives "p.m."). Drop the space: "6:23pm".
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  }).format(new Date(iso)).replace(/\s/g, '').toLowerCase()
}

export function formatPrice(cents) {
  const euros = (Number(cents) || 0) / 100
  return `€${euros.toFixed(2)}`
}

// 'on_sale' | 'upcoming' | 'closed' | 'sold_out' for one tier.
export function tierState(tier, event, remaining, now = new Date()) {
  if (event.status === 'cancelled') return 'closed'
  if (event.status === 'sold_out' || (remaining != null && remaining <= 0)) return 'sold_out'
  if (tier.sale_starts_at && new Date(tier.sale_starts_at) > now) return 'upcoming'
  if (tier.sale_ends_at && new Date(tier.sale_ends_at) <= now) return 'closed'
  return 'on_sale'
}

// ── Reads (open to everyone, signed in or not) ─────────────────────────────
export async function fetchPublicEvents() {
  const { data, error } = await supabase
    .from('priority_events')
    .select('id, slug, title, genre, city, venue, address, starts_at, doors_at, age_min, blurb, lineup, image_url, status, tiers:priority_ticket_tiers(id, label, price_cents, sale_starts_at, sale_ends_at, sort)')
    .in('status', ['on_sale', 'sold_out', 'cancelled'])
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchEventBySlug(slug) {
  const { data, error } = await supabase
    .from('priority_events')
    .select('id, slug, title, genre, city, venue, address, starts_at, doors_at, age_min, blurb, lineup, image_url, status, tiers:priority_ticket_tiers(id, label, price_cents, capacity, sale_starts_at, sale_ends_at, sort)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  data.tiers = (data.tiers || []).slice().sort((a, b) => a.sort - b.sort || a.price_cents - b.price_cents)
  return data
}

// Tickets left per tier. Returns { [tierId]: number }. A failed lookup returns
// an empty object, and the page simply does not show stock.
export async function fetchRemaining(tiers) {
  const out = {}
  await Promise.all((tiers || []).map(async t => {
    const { data, error } = await supabase.rpc('priority_tier_remaining', { p_tier_id: t.id })
    if (!error && typeof data === 'number') out[t.id] = data
  }))
  return out
}

// ── Buy ────────────────────────────────────────────────────────────────────
// The edge function checks the buyer, the sale window, stock and age, works out
// the price itself, and returns a Stripe Checkout URL.
export async function startPriorityCheckout(tierId, quantity) {
  const data = await invokeFunction('create-priority-checkout-session', { tier_id: tierId, quantity })
  if (!data?.url) throw new Error('Could not start payment. Please try again.')
  return data.url
}

// ── My tickets ─────────────────────────────────────────────────────────────
export async function fetchMyTickets() {
  const { data, error } = await supabase
    .from('priority_tickets')
    .select('id, code, status, used_at, created_at, event:priority_events(slug, title, city, venue, address, starts_at, doors_at, age_min)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
