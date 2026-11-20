import { useState, useEffect, useCallback, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../supabase'
import { fromRow, fromItem, addDays, startOfDay, sortEvents, fmtTime, relativeLabel, startOfWeek } from './model'
import { loadCalendar, readDeviceSelection } from './store'
import { useCalendarItems } from './items'
import { readDeviceEvents } from './device'

// Everything the Calendar screens draw, from one place:
//   member events (database, or the phone until the migration is applied),
//   events read from a pasted link (saved as member events),
//   goals with dates and goal reminders (public.user_goals),
//   items other features added with addCalendarItems (exam slots, Priority
//   tickets, study room slots, goal countdown),
//   and this phone's calendar if the member allowed it.
// Nothing is invented: with no data the list is empty.

const goalsKey = uid => `ubp_user_goals_${uid}`
const REMIND_HOUR = 9

async function readGoals(uid) {
  try {
    const { data, error } = await Promise.race([
      supabase.from('user_goals').select('*').eq('user_id', uid).in('source', ['custom', 'foundation']),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
    ])
    if (error) throw error
    return data || []
  } catch {
    try {
      const raw = await AsyncStorage.getItem(goalsKey(uid))
      const p = raw ? JSON.parse(raw) : []
      return Array.isArray(p) ? p : []
    } catch { return [] }
  }
}

// A goal can carry a date (target_date or due_date, once the goal countdown
// exists). A goal with a reminder repeats at 9:00 like the phone notification.
function goalEvents(goals, from, to) {
  const out = []
  goals.forEach(g => {
    if (!g || g.done) return
    const dateStr = g.target_date || g.due_date || g.due_on
    if (dateStr) {
      const ev = fromItem({ source: 'goals', id: `goal-${g.id}`, title: g.title, start: String(dateStr).slice(0, 10), kind: 'goal', from: 'From your goals' })
      if (ev) out.push(ev)
    }
    if (g.remind_ok && g.remind_every) {
      const make = d => {
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), REMIND_HOUR, 0)
        const ev = fromItem({ source: 'goals', id: `rem-${g.id}-${start.getTime()}`, title: g.title, start: start.toISOString(), end: new Date(start.getTime() + 15 * 60000).toISOString(), kind: 'reminder', from: `Repeats ${g.remind_every}`, quiet: true })
        if (ev) out.push(ev)
      }
      for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) {
        if (g.remind_every === 'daily') make(d)
        else if (g.remind_every === 'weekly' && d.getDay() === 1) make(d)
        else if (g.remind_every === 'monthly' && d.getDate() === 1) make(d)
      }
    }
  })
  return out
}

export function useCalendarData(userId, rangeStart, rangeEnd) {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [customCalendars, setCustomCalendars] = useState([])
  const [remote, setRemote] = useState(true)
  const [goals, setGoals] = useState([])
  const [deviceIds, setDeviceIds] = useState([])
  const [deviceRaw, setDeviceRaw] = useState([])
  const items = useCalendarItems(userId)

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const [cal, g, ids] = await Promise.all([loadCalendar(userId), readGoals(userId), readDeviceSelection(userId)])
    setRows(cal.events)
    setCustomCalendars(cal.calendars)
    setRemote(cal.remote)
    setGoals(g)
    setDeviceIds(ids)
    setLoading(false)
  }, [userId])

  useFocusEffect(useCallback(() => { reload() }, [reload]))

  // This phone's calendar for the visible window and the next 30 days.
  const winStart = rangeStart.getTime()
  const winEnd = rangeEnd.getTime()
  useEffect(() => {
    let cancelled = false
    if (!deviceIds.length) { setDeviceRaw([]); return }
    const now = new Date()
    const a = new Date(Math.min(winStart, startOfDay(now).getTime()))
    const b = new Date(Math.max(winEnd, addDays(now, 31).getTime()))
    readDeviceEvents(deviceIds, a, b).then(list => { if (!cancelled) setDeviceRaw(list) })
    return () => { cancelled = true }
  }, [deviceIds, winStart, winEnd])

  const events = useMemo(() => {
    const own = rows.map(fromRow).filter(Boolean)
    const phone = deviceRaw.map(e => ({
      id: `phone-${e.id}`, title: e.title, start: e.start, end: e.allDay && e.end <= e.start ? addDays(e.start, 1) : e.end,
      allDay: e.allDay, calendar: null, type: 'other', kind: 'phone', label: 'This phone', from: 'Read from this phone',
      location: e.location, editable: false,
    }))
    const from = new Date(Math.min(winStart, Date.now()))
    const to = new Date(Math.max(winEnd, addDays(new Date(), 31).getTime()))
    return sortEvents([...own, ...items, ...goalEvents(goals, from, to), ...phone])
  }, [rows, items, goals, deviceRaw, winStart, winEnd])

  return { loading, events, rows, customCalendars, remote, deviceIds, reload, hasAny: events.length > 0 }
}

// For Home and My Blueprint: the next thing coming up and simple counts.
export function useCalendarSummary(userId) {
  const [summary, setSummary] = useState({ loaded: false, nextUp: null, todayCount: 0, weekCount: 0 })
  const items = useCalendarItems(userId)
  const [rows, setRows] = useState(null)
  const [deviceRaw, setDeviceRaw] = useState([])

  useFocusEffect(useCallback(() => {
    if (!userId) { setRows([]); return }
    let cancelled = false
    ;(async () => {
      const [cal, ids] = await Promise.all([loadCalendar(userId), readDeviceSelection(userId)])
      let phone = []
      if (ids.length) phone = await readDeviceEvents(ids, startOfDay(new Date()), addDays(new Date(), 31))
      if (!cancelled) { setRows(cal.events); setDeviceRaw(phone) }
    })().catch(() => { if (!cancelled) setRows([]) })
    return () => { cancelled = true }
  }, [userId]))

  useEffect(() => {
    if (rows === null) return
    const now = new Date()
    const all = [
      ...rows.map(fromRow).filter(Boolean),
      ...items,
      ...deviceRaw.map(e => ({ id: `phone-${e.id}`, title: e.title, start: e.start, end: e.end, allDay: e.allDay })),
    ].filter(e => !e.quiet)
    const today0 = startOfDay(now)
    const today1 = addDays(today0, 1)
    const weekEnd = addDays(startOfWeek(now), 7)
    const overlaps = (e, a, b) => e.start < b && (e.allDay ? e.end > a : Math.max(e.end, e.start) >= a)
    const todayCount = all.filter(e => overlaps(e, today0, today1)).length
    const weekCount = all.filter(e => overlaps(e, today0, weekEnd)).length
    const upcoming = all.filter(e => !e.allDay && e.start > now).sort((a, b) => a.start - b.start)[0]
      || all.filter(e => e.allDay && e.end > now).sort((a, b) => a.start - b.start)[0]
    const nextUp = upcoming ? {
      title: upcoming.title,
      timeLabel: upcoming.allDay ? 'All day' : fmtTime(upcoming.start),
      inLabel: relativeLabel(upcoming, now),
      time: upcoming.allDay ? 'All day' : fmtTime(upcoming.start),
      relative: relativeLabel(upcoming, now),
    } : null
    setSummary({ loaded: true, nextUp, todayCount, weekCount })
  }, [rows, items, deviceRaw])

  return summary
}
