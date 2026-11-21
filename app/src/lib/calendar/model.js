import { GraduationCap, User, Briefcase, Ellipsis, FileText, Target, Ticket, DoorOpen, Smartphone, Link2, Bell, CalendarDays } from 'lucide-react-native'

// Shared calendar vocabulary and date helpers. Everything is local time.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Colour says which calendar. [light, dark] so every colour reads on the cream
// page and on the navy page.
export const BUILTIN_CALENDARS = [
  { key: 'college',  name: 'College',  light: '#3B6BC4', dark: '#86AAEA' },
  { key: 'work',     name: 'Work',     light: '#6A55A8', dark: '#B7A7E8' },
  { key: 'personal', name: 'Personal', light: '#2E8F68', dark: '#72D3A6' },
  { key: 'clubs',    name: 'Clubs',    light: '#C45A3C', dark: '#F2A284' },
]

// Colours a member can pick for their own calendar. None is gold: gold is only for money.
export const CUSTOM_COLOURS = ['#2F8F9D', '#D0536A', '#4F5BD5', '#64748B', '#A0508F', '#8A6A4F']

// Small icon says the type.
export const EVENT_TYPES = [
  { key: 'class',    label: 'Class',    Icon: GraduationCap },
  { key: 'personal', label: 'Personal', Icon: User },
  { key: 'work',     label: 'Work',     Icon: Briefcase },
  { key: 'other',    label: 'Other',    Icon: Ellipsis },
]

export function typeMeta(key) {
  return EVENT_TYPES.find(t => t.key === key) || EVENT_TYPES[3]
}

// Things the app adds for the member, each labelled with where it came from.
export const KIND_META = {
  member:   { Icon: null,         label: null },
  exam:     { Icon: FileText,     label: 'Exam slot' },
  goal:     { Icon: Target,       label: 'Goal' },
  reminder: { Icon: Bell,         label: 'Goal reminder' },
  ticket:   { Icon: Ticket,       label: 'Priority ticket' },
  room:     { Icon: DoorOpen,     label: 'Study room slot' },
  phone:    { Icon: Smartphone,   label: 'This phone' },
  ics:      { Icon: Link2,        label: 'Calendar link' },
  other:    { Icon: CalendarDays, label: 'From UBP' },
}

// Special kinds have a fixed neutral-ish colour so they read as "added for you".
// Exam uses the College blue, ticket and room use their own.
const KIND_CALENDAR = { exam: 'college', goal: 'personal', reminder: 'personal', ticket: 'clubs', room: 'college' }

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return [100, 116, 139]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function withAlpha(hex, a) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

// A colour at `a` strength laid over a solid background, as one opaque hex.
// Used for event blocks so grid lines never show through the text.
export function tintOver(hex, bg, a) {
  const [r, g, b] = hexToRgb(hex)
  const [br, bgG, bb] = hexToRgb(bg)
  const m = (x, y) => Math.round(y + (x - y) * a)
  return `#${[m(r, br), m(g, bgG), m(b, bb)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function lighten(hex, amt) {
  const [r, g, b] = hexToRgb(hex)
  const m = v => Math.round(v + (255 - v) * amt)
  return `#${[m(r), m(g), m(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

// The solid colour for a calendar key (built in, or a custom calendar's id).
export function calendarColor(key, customCalendars, isDark) {
  const built = BUILTIN_CALENDARS.find(c => c.key === key)
  if (built) return isDark ? built.dark : built.light
  const custom = (customCalendars || []).find(c => c.id === key)
  const base = custom?.color || '#64748B'
  return isDark ? lighten(base, 0.4) : base
}

export function calendarName(key, customCalendars) {
  const built = BUILTIN_CALENDARS.find(c => c.key === key)
  if (built) return built.name
  return (customCalendars || []).find(c => c.id === key)?.name || 'Personal'
}

export function itemColor(ev, customCalendars, isDark) {
  if (ev.kind === 'phone') return isDark ? '#B8C2CC' : '#64748B'
  if (ev.kind === 'member' || ev.kind === 'ics') return calendarColor(ev.calendar || 'personal', customCalendars, isDark)
  return calendarColor(ev.calendar || KIND_CALENDAR[ev.kind] || 'personal', customCalendars, isDark)
}

// ── dates ───────────────────────────────────────────────────────────────────

export const pad = n => String(n).padStart(2, '0')
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export function parseYmd(s) {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
export const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes())
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1)
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
// Monday is the first day of the week.
export function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7
  return startOfDay(addDays(d, -day))
}
export const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const fmtDayShort = d => `${DAYS_SHORT[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
export const fmtMonth = d => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
export function fmtWeekRange(start) {
  const end = addDays(start, 6)
  const a = MONTHS[start.getMonth()].slice(0, 3)
  const b = MONTHS[end.getMonth()].slice(0, 3)
  return a === b ? `${start.getDate()} to ${end.getDate()} ${b}` : `${start.getDate()} ${a} to ${end.getDate()} ${b}`
}

// Rows of weeks for a month, starting Monday. Only the weeks the month needs.
export function monthMatrix(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = startOfWeek(first)
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const weeks = Math.ceil(((startOfWeek(last).getTime() - start.getTime()) / 86400000 + 7) / 7)
  const rows = []
  for (let w = 0; w < weeks; w++) {
    const row = []
    for (let i = 0; i < 7; i++) row.push(addDays(start, w * 7 + i))
    rows.push(row)
  }
  return rows
}

// ── events ──────────────────────────────────────────────────────────────────
//
// Every event the screen draws has this shape:
//   { id, title, start: Date, end: Date, allDay, calendar, type, kind,
//     label, from, location, editable, quiet, raw }

export function fromRow(row) {
  const start = new Date(row.starts_at)
  let end = new Date(row.ends_at || row.starts_at)
  if (Number.isNaN(start.getTime())) return null
  if (Number.isNaN(end.getTime()) || end < start) end = start
  const isIcs = row.source === 'ics'
  return {
    id: String(row.id),
    title: row.title || 'Untitled',
    start, end,
    allDay: !!row.all_day,
    calendar: row.calendar_key || 'personal',
    type: row.event_type || 'other',
    kind: isIcs ? 'ics' : 'member',
    label: isIcs ? 'Calendar link' : null,
    from: isIcs ? 'Added from a link' : 'Added by you',
    location: row.location || null,
    editable: true,
    raw: row,
  }
}

// A date only string ("2026-11-24") is a whole day. Anything else is an instant.
function parseItemDate(v) {
  if (v instanceof Date) return v
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return parseYmd(v)
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// Shape other features hand to addCalendarItems (see items.js).
export function fromItem(item) {
  if (!item || !item.title) return null
  const dateOnly = typeof item.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.start)
  const start = parseItemDate(item.start)
  if (!start) return null
  const allDay = item.allDay != null ? !!item.allDay : dateOnly
  let end = item.end ? parseItemDate(item.end) : null
  if (!end || end < start) end = allDay ? addDays(startOfDay(start), 1) : new Date(start.getTime() + 60 * 60000)
  const kind = KIND_META[item.kind] ? item.kind : 'other'
  return {
    id: `item-${item.source || 'x'}-${item.id || `${item.title}-${start.getTime()}`}`,
    title: String(item.title),
    start, end, allDay,
    calendar: item.calendar || null,
    type: 'other',
    kind,
    label: item.label || KIND_META[kind].label,
    from: item.from || null,
    location: item.location || null,
    editable: false,
    quiet: !!item.quiet,
    raw: item,
  }
}

// Does the event touch this day?
export function onDay(ev, day) {
  const a = startOfDay(day).getTime()
  const b = a + 86400000
  const s = ev.start.getTime()
  const e = ev.allDay ? ev.end.getTime() : Math.max(ev.end.getTime(), s + 1)
  if (ev.allDay) return s < b && Math.max(e, s + 86400000) > a
  return s < b && e > a
}

export function sortEvents(list) {
  return [...list].sort((x, y) => (Number(y.allDay) - Number(x.allDay)) || x.start - y.start || x.title.localeCompare(y.title))
}

// Side by side columns for events that overlap in time (week and day grids).
// Returns [{ ev, col, cols }].
export function layoutOverlaps(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end)
  const out = []
  let cluster = []
  let clusterEnd = 0
  const flush = () => {
    const colsEnd = []
    const placed = cluster.map(ev => {
      let col = colsEnd.findIndex(end => end <= ev.start.getTime())
      if (col === -1) { col = colsEnd.length; colsEnd.push(0) }
      colsEnd[col] = ev.end.getTime()
      return { ev, col }
    })
    placed.forEach(p => out.push({ ...p, cols: colsEnd.length }))
    cluster = []
  }
  sorted.forEach(ev => {
    if (cluster.length && ev.start.getTime() >= clusterEnd) flush()
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, ev.end.getTime())
  })
  if (cluster.length) flush()
  return out
}

export function describeWhen(ev) {
  if (ev.allDay) {
    const last = addDays(ev.end, -1)
    return sameDay(ev.start, last) || last < ev.start ? `${fmtDayShort(ev.start)}, all day` : `${fmtDayShort(ev.start)} to ${fmtDayShort(last)}`
  }
  return `${fmtDayShort(ev.start)}, ${fmtTime(ev.start)} to ${fmtTime(ev.end)}`
}

// "in 35 min", "in 3 hours", "tomorrow", "in 4 days"
export function relativeLabel(ev, now = new Date()) {
  const mins = Math.round((ev.start.getTime() - now.getTime()) / 60000)
  if (mins <= 0) return 'now'
  if (mins < 60) return `in ${mins} min`
  if (mins < 60 * 6) return `in ${Math.round(mins / 60)} hr`
  const days = Math.round((startOfDay(ev.start).getTime() - startOfDay(now).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

// "Label · From" for automatic items, without saying the same thing twice.
export function sourceLine(ev) {
  const label = ev.label || ''
  const from = ev.from || ''
  if (label && from && from.toLowerCase().startsWith(label.toLowerCase())) return from
  return [label, from].filter(Boolean).join(' · ')
}
