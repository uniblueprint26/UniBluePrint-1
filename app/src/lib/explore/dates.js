// Date and time helpers for the Explore tools. Members type dates as
// DD/MM/YYYY (also accepts DD-MM-YYYY or DD.MM.YYYY) and times as HH:MM.

const pad = n => String(n).padStart(2, '0')

// '24/11/2026' -> { y, m, d } or null
export function parseDate(text) {
  const m = /^\s*(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\s*$/.exec(text || '')
  if (!m) return null
  const d = +m[1], mo = +m[2], y = +m[3]
  const t = new Date(y, mo - 1, d)
  if (t.getFullYear() !== y || t.getMonth() !== mo - 1 || t.getDate() !== d) return null
  return { y, m: mo, d }
}

// '09:30' -> minutes from midnight, or null
export function parseTime(text) {
  const m = /^\s*(\d{1,2})[:.](\d{2})\s*$/.exec(text || '')
  if (!m) return null
  const h = +m[1], mi = +m[2]
  if (h > 23 || mi > 59) return null
  return h * 60 + mi
}

export function formatDate(p) {
  return p ? `${pad(p.d)}/${pad(p.m)}/${p.y}` : ''
}

export function formatMinutes(min) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export function toKey(p) { return `${p.y}-${pad(p.m)}-${pad(p.d)}` }

export function fromKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '')
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null
}

export function keyToLocalDate(key, minutes = 0) {
  const p = fromKey(key)
  if (!p) return null
  return new Date(p.y, p.m - 1, p.d, Math.floor(minutes / 60), minutes % 60, 0, 0)
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function prettyDate(key) {
  const dt = keyToLocalDate(key)
  if (!dt) return ''
  return `${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

export function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Whole days from today to a date key (negative when past).
export function daysUntil(key, now = new Date()) {
  const a = keyToLocalDate(key)
  if (!a) return null
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

export function daysBetween(fromKeyStr, toKeyStr) {
  const a = keyToLocalDate(fromKeyStr), b = keyToLocalDate(toKeyStr)
  if (!a || !b) return null
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
