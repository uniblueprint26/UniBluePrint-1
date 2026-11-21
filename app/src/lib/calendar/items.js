import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../supabase'
import { fromItem } from './model'

// The one way other features put things on the member's Calendar.
//
//   import { addCalendarItems } from '../lib/calendar/items'
//
//   addCalendarItems('exams', [
//     { id: 'exam-1', title: 'Exam, Example module', start: '2026-11-24T09:30:00.000Z',
//       end: '2026-11-24T11:30:00.000Z', kind: 'exam', from: 'Added by you' },
//   ])
//
// `source` is a short key you own, for example 'exams', 'priority', 'rooms' or
// 'countdown'. Calling it again with the same source REPLACES that source's
// items, and an empty list removes them, so each feature keeps its own items
// in step with its own data. Nothing is stored on a server: items live on the
// phone and are only ever shown to this member.
//
// The calendar_items shape (one item):
//   id        string, stable and unique inside the source
//   title     string, what the member sees
//   start     ISO date time ("2026-11-24T09:30:00.000Z") or a whole day ("2026-11-24")
//   end       optional ISO date time or whole day (exclusive for whole days)
//   allDay    optional boolean, true for a date only start
//   kind      'exam' | 'goal' | 'ticket' | 'room' | 'other'  (sets the icon and label)
//   label     optional short tag shown under the title, defaults from kind
//             ("Exam slot", "Priority ticket", "Study room slot", "Goal")
//   from      optional where it came from ("From My tickets", "Added by you")
//   location  optional string
//   calendar  optional calendar key ('college', 'work', 'personal', 'clubs')
//
// Priority tickets use kind 'ticket' with the event date, study room slots use
// kind 'room'. Do not add anything you have not read from real data.

const keyFor = uid => `ubp_calendar_items_v1_${uid}`
const listeners = new Set()
const memory = {}

async function currentUid() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.id || 'local'
  } catch { return 'local' }
}

export async function readCalendarItems(uid) {
  const id = uid || (await currentUid())
  try {
    const raw = await AsyncStorage.getItem(keyFor(id))
    const parsed = raw ? JSON.parse(raw) : {}
    memory[id] = parsed && typeof parsed === 'object' ? parsed : {}
  } catch { memory[id] = memory[id] || {} }
  return memory[id]
}

export async function addCalendarItems(source, items, userId) {
  if (!source) return
  const uid = userId || (await currentUid())
  const all = { ...(await readCalendarItems(uid)) }
  const clean = (Array.isArray(items) ? items : [])
    .filter(i => i && i.title && i.start)
    .map(i => ({ ...i, source }))
  if (clean.length) all[source] = clean
  else delete all[source]
  memory[uid] = all
  try { await AsyncStorage.setItem(keyFor(uid), JSON.stringify(all)) } catch {}
  listeners.forEach(fn => fn(uid))
}

export function clearCalendarItems(source, userId) {
  return addCalendarItems(source, [], userId)
}

// Normalised events from every source, for the calendar screens.
export function flattenItems(bySource) {
  const out = []
  Object.values(bySource || {}).forEach(list => (list || []).forEach(i => { const ev = fromItem(i); if (ev) out.push(ev) }))
  return out
}

export function useCalendarItems(userId) {
  const [items, setItems] = useState([])
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const all = await readCalendarItems(userId)
      if (!cancelled) setItems(flattenItems(all))
    }
    load()
    const fn = uid => { if (!userId || uid === userId || uid === 'local') load() }
    listeners.add(fn)
    return () => { cancelled = true; listeners.delete(fn) }
  }, [userId])
  return items
}
