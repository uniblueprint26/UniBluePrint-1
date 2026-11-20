import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../supabase'

// Where the member's own events and calendars live.
//
// Primary: public.calendar_events and public.calendars (owner only, see
// supabase/migrations/20261120200000_calendar.sql). Until that migration is
// applied, or whenever the database cannot be reached, everything is kept on
// the phone in AsyncStorage so the screen still works. Rows saved on the phone
// get an id that starts with "local-" and are moved to the database the next
// time it can be reached.

// A slow or dead connection must never leave the screen waiting, so every
// database call gives up after a few seconds and the phone copy is used.
function withTimeout(promise, ms) {
  let timer
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms) })
  return Promise.race([Promise.resolve(promise), limit]).finally(() => clearTimeout(timer))
}
const LOAD_MS = 6000
const WRITE_MS = 8000

const localKey = uid => `ubp_calendar_v1_${uid}`
const isLocalId = id => String(id).startsWith('local-')
const newLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function readLocal(uid) {
  try {
    const raw = await AsyncStorage.getItem(localKey(uid))
    const p = raw ? JSON.parse(raw) : {}
    return { events: Array.isArray(p.events) ? p.events : [], calendars: Array.isArray(p.calendars) ? p.calendars : [] }
  } catch { return { events: [], calendars: [] } }
}

async function writeLocal(uid, data) {
  try { await AsyncStorage.setItem(localKey(uid), JSON.stringify(data)) } catch {}
}

const EVENT_FIELDS = ['calendar_key', 'title', 'location', 'event_type', 'starts_at', 'ends_at', 'all_day', 'source', 'external_uid']

function toDbEvent(uid, ev) {
  const row = { user_id: uid }
  EVENT_FIELDS.forEach(f => { if (ev[f] !== undefined) row[f] = ev[f] })
  return row
}

// Load everything for the member. `remote` says whether the tables answered.
export async function loadCalendar(uid) {
  const local = await readLocal(uid)
  let remote = false
  let events = []
  let calendars = []
  try {
    const [ev, cal] = await withTimeout(Promise.all([
      supabase.from('calendar_events').select('*').eq('user_id', uid).order('starts_at', { ascending: true }).limit(3000),
      supabase.from('calendars').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
    ]), LOAD_MS)
    if (ev.error || cal.error) throw ev.error || cal.error
    remote = true
    events = ev.data || []
    calendars = cal.data || []
  } catch { remote = false }

  if (remote && (local.events.length || local.calendars.length)) {
    // Move anything saved on the phone into the database, best effort.
    const keptEvents = []
    const keptCalendars = []
    const idMap = {}
    for (const c of local.calendars) {
      try {
        const { data, error } = await withTimeout(supabase.from('calendars').insert({ user_id: uid, name: c.name, color: c.color }).select('*').single(), WRITE_MS)
        if (error) throw error
        idMap[c.id] = data.id
        calendars.push(data)
      } catch { keptCalendars.push(c) }
    }
    for (const e of local.events) {
      try {
        const row = toDbEvent(uid, { ...e, calendar_key: idMap[e.calendar_key] || e.calendar_key })
        if (isLocalId(row.calendar_key)) throw new Error('calendar not moved yet')
        const { data, error } = await withTimeout(supabase.from('calendar_events').insert(row).select('*').single(), WRITE_MS)
        if (error) throw error
        events.push(data)
      } catch { keptEvents.push(e) }
    }
    await writeLocal(uid, { events: keptEvents, calendars: keptCalendars })
    return { events: events.concat(keptEvents), calendars: calendars.concat(keptCalendars), remote }
  }
  return { events: events.concat(local.events), calendars: calendars.concat(local.calendars), remote }
}

// ── events ──

export async function saveEvent(uid, ev) {
  const id = ev.id
  if (id && !isLocalId(id)) {
    try {
      const { data, error } = await withTimeout(supabase.from('calendar_events').update(toDbEvent(uid, ev)).eq('id', id).eq('user_id', uid).select('*').single(), WRITE_MS)
      if (error) throw error
      return data
    } catch { /* fall through to the phone copy */ }
  } else if (!id) {
    try {
      const { data, error } = await withTimeout(supabase.from('calendar_events').insert(toDbEvent(uid, ev)).select('*').single(), WRITE_MS)
      if (error) throw error
      return data
    } catch { /* fall through to the phone copy */ }
  }
  const local = await readLocal(uid)
  const row = { ...ev, id: id || newLocalId(), user_id: uid }
  const i = local.events.findIndex(e => e.id === row.id)
  if (i >= 0) local.events[i] = { ...local.events[i], ...row }
  else local.events.push(row)
  await writeLocal(uid, local)
  return row
}

export async function deleteEvent(uid, id) {
  if (!isLocalId(id)) {
    try {
      const { error } = await withTimeout(supabase.from('calendar_events').delete().eq('id', id).eq('user_id', uid), WRITE_MS)
      if (error) throw error
      return
    } catch { /* nothing to remove locally either */ }
  }
  const local = await readLocal(uid)
  local.events = local.events.filter(e => e.id !== id)
  await writeLocal(uid, local)
}

// Save many imported events. Events from a link are upserted on external_uid so
// bringing the same link in twice updates rather than duplicates.
export async function saveManyEvents(uid, events) {
  let remoteSaved = false
  try {
    for (let i = 0; i < events.length; i += 200) {
      const rows = events.slice(i, i + 200).map(e => toDbEvent(uid, e))
      const { error } = await withTimeout(supabase.from('calendar_events').upsert(rows, { onConflict: 'user_id,external_uid' }), WRITE_MS)
      if (error) throw error
    }
    remoteSaved = true
  } catch { remoteSaved = false }
  if (remoteSaved) return { saved: events.length, remote: true }
  const local = await readLocal(uid)
  const byUid = new Map(local.events.filter(e => e.external_uid).map(e => [e.external_uid, e]))
  events.forEach(e => {
    const existing = byUid.get(e.external_uid)
    if (existing) Object.assign(existing, e)
    else local.events.push({ ...e, id: newLocalId(), user_id: uid })
  })
  await writeLocal(uid, local)
  return { saved: events.length, remote: false }
}

// ── custom calendars ──

export async function saveCalendar(uid, cal) {
  try {
    const { data, error } = await withTimeout(supabase.from('calendars').insert({ user_id: uid, name: cal.name, color: cal.color }).select('*').single(), WRITE_MS)
    if (error) throw error
    return data
  } catch { /* phone copy */ }
  const local = await readLocal(uid)
  const row = { id: newLocalId(), user_id: uid, name: cal.name, color: cal.color }
  local.calendars.push(row)
  await writeLocal(uid, local)
  return row
}

// ── what the phone's own calendar import remembers ──

const deviceKey = uid => `ubp_calendar_device_v1_${uid}`
export async function readDeviceSelection(uid) {
  try {
    const raw = await AsyncStorage.getItem(deviceKey(uid))
    const p = raw ? JSON.parse(raw) : null
    return Array.isArray(p?.ids) ? p.ids : []
  } catch { return [] }
}
export async function writeDeviceSelection(uid, ids) {
  try { await AsyncStorage.setItem(deviceKey(uid), JSON.stringify({ ids })) } catch {}
}

// ── dismissed suggestions ──

const recKey = uid => `ubp_calendar_rec_dismissed_v1_${uid}`
export async function readDismissed(uid) {
  try {
    const raw = await AsyncStorage.getItem(recKey(uid))
    const p = raw ? JSON.parse(raw) : []
    return Array.isArray(p) ? p : []
  } catch { return [] }
}
export async function writeDismissed(uid, list) {
  try { await AsyncStorage.setItem(recKey(uid), JSON.stringify(list.slice(-60))) } catch {}
}
