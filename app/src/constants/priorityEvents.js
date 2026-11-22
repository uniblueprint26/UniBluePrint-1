// ─── Priority events: where they come from ─────────────────────────────────
// Priority events are real rows in `priority_events` and `priority_ticket_tiers`
// (migration 20261119120000_priority_ticketing.sql), added by staff. The app
// holds no event data of its own. Everything invented that used to live in this
// file (fake venues, dates, prices) has been removed.
//
// Tickets are for real world events, so the app does not sell them. "Get
// tickets" opens the event page on the website (uniblueprint.ie/priority/<slug>),
// where checkout happens. This is the exception to NATIVE_NEUTRAL_BILLING in
// constants/platformPolicy.js: tickets are not a digital good, so they are not
// hidden on iOS or Android. They are still never bought in the app.

import { SITE_URL, SUPPORT_EMAIL } from './site'
import { supabase } from '../lib/supabase'

export const PRIORITY_URLS = {
  events: `${SITE_URL}/priority`,
  tickets: `${SITE_URL}/priority/tickets`,
  terms: `${SITE_URL}/priority/terms`,
  event: slug => `${SITE_URL}/priority/${encodeURIComponent(slug)}`,
}

// Terms of sale for Priority tickets. Same wording as the website
// (src/data/priorityTerms.js). Keep both in step. Plain words, no dashes.
export const PRIORITY_TERMS_SHORT = [
  '18 plus only. You pay the ticket price, with no booking fee.',
  'No refunds if you change your mind. If the event is cancelled, you are refunded.',
  'Your ticket is issued after payment is confirmed.',
  'Priority Events organises the event. UniBlueprint is only the ticket shop.',
]
export const PRIORITY_CANCELLED_TITLE = 'Cancelled, refunds issued'
export const PRIORITY_CANCELLED_TEXT =
  'This event has been cancelled. Ticket buying is closed. If you had a ticket, you get a refund of the ticket price to the card you paid with. Refunds can take a few days to show.'
export const PRIORITY_TERMS_CONTACT = `Questions about a ticket? Email ${SUPPORT_EMAIL}.`

// Announced by Priority. No dates or venues are set yet, so they show ??.
// These are not events on sale. Real events come from the database only.
export const PRIORITY_ANNOUNCED = [
  { id: 'refresher', title: "New Year's Refresher", where: 'Galway, Sligo, Dublin and Limerick' },
  { id: 'black-tie', title: 'Black Tie', where: 'Sligo' },
]

// Genre filter chips. These match the genres Priority runs. An event with a
// genre not listed here still shows under All.
export const PRIORITY_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'house',     label: 'House' },
  { key: 'afrobeats', label: 'Afrobeats' },
  { key: 'folk',      label: 'Folk' },
]

const EVENT_COLUMNS =
  'id, slug, title, genre, city, venue, address, starts_at, doors_at, age_min, blurb, lineup, image_url, status'

// Events on sale or sold out that have not started yet. Open to everyone
// (row level security allows an anonymous read of public events).
export async function fetchPriorityEvents() {
  const { data, error } = await supabase
    .from('priority_events')
    .select(`${EVENT_COLUMNS}, tiers:priority_ticket_tiers(id, label, price_cents, sale_starts_at, sale_ends_at, sort)`)
    .in('status', ['on_sale', 'sold_out', 'cancelled'])
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchPriorityEvent(slug) {
  const { data, error } = await supabase
    .from('priority_events')
    .select(`${EVENT_COLUMNS}, tiers:priority_ticket_tiers(id, label, price_cents, sale_starts_at, sale_ends_at, sort)`)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  data.tiers = (data.tiers || []).slice().sort((a, b) => a.sort - b.sort || a.price_cents - b.price_cents)
  return data
}

// The signed in person's own tickets (row level security returns only theirs).
export async function fetchMyPriorityTickets() {
  const { data, error } = await supabase
    .from('priority_tickets')
    .select('id, code, status, used_at, created_at, event:priority_events(slug, title, city, venue, starts_at, doors_at)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Formatting ─────────────────────────────────────────────────────────────
function fmt(iso, options) {
  if (!iso) return ''
  const d = new Date(iso)
  try {
    return d.toLocaleString('en-IE', { ...options, timeZone: 'Europe/Dublin' })
  } catch {
    return d.toLocaleString('en-IE', options)
  }
}

export function formatEventDate(iso) {
  return fmt(iso, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatEventTime(iso) {
  // en-GB gives "6:23 pm" (en-IE gives "p.m."). Drop the space: "6:23pm".
  if (!iso) return ''
  const opts = { hour: 'numeric', minute: '2-digit', hour12: true }
  let out
  try {
    out = new Date(iso).toLocaleString('en-GB', { ...opts, timeZone: 'Europe/Dublin' })
  } catch {
    out = new Date(iso).toLocaleString('en-GB', opts)
  }
  return out.replace(/\s/g, '').toLowerCase()
}

export function formatPriceCents(cents) {
  return `€${((Number(cents) || 0) / 100).toFixed(2)}`
}

export function cheapestTierCents(event) {
  const prices = (event?.tiers || []).map(t => t.price_cents)
  return prices.length ? Math.min(...prices) : null
}
