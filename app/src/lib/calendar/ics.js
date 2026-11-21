import { pad, startOfDay } from './model'

// Read a public .ics (iCalendar) link on the phone. Nothing goes through a
// UBP server: the app fetches the file, reads it here and shows a preview, and
// only saves what the member confirms.
//
// Supported: SUMMARY, LOCATION, DTSTART, DTEND, DURATION, UTC times, TZID
// times, whole day dates, cancelled events, repeating events (DAILY, WEEKLY,
// MONTHLY and YEARLY with INTERVAL, COUNT, UNTIL, BYDAY, BYMONTHDAY and
// EXDATE) and edited single occurrences. A repeat rule we cannot read shows
// the first date only and is counted in `partial`.

const MAX_BYTES = 3 * 1024 * 1024
const MAX_EVENTS = 1000
const MAX_PER_RULE = 400

export function normaliseIcsUrl(input) {
  let raw = String(input || '').trim()
  if (!raw) throw new Error('Paste a calendar link first.')
  raw = raw.replace(/^webcal:\/\//i, 'https://').replace(/^webcals:\/\//i, 'https://')
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
  let url
  try { url = new URL(raw) } catch { throw new Error('That does not look like a web address.') }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('The link must start with https.')
  return url.toString()
}

export async function fetchIcs(input) {
  const url = normaliseIcsUrl(input)
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ctl ? setTimeout(() => ctl.abort(), 15000) : null
  let text
  try {
    const res = await fetch(url, { signal: ctl ? ctl.signal : undefined, headers: { Accept: 'text/calendar, text/plain, */*' } })
    if (!res.ok) throw new Error(res.status === 404 ? 'That link was not found. Check it and try again.' : 'That link could not be opened. Make sure it is public.')
    text = await res.text()
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('That took too long. Try again in a moment.')
    if (e instanceof Error && /link|public|long/.test(e.message)) throw e
    throw new Error('We could not reach that link. Check your connection and that the link is public.')
  } finally {
    if (timer) clearTimeout(timer)
  }
  if (text.length > MAX_BYTES) throw new Error('That calendar is too large to bring in.')
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error('That link is not a calendar. It should end in .ics.')
  return text
}

// ── parsing ─────────────────────────────────────────────────────────────────

function unfold(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '').split('\n')
}

function unescapeText(v) {
  return String(v || '').replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim()
}

// "DTSTART;TZID=Europe/Dublin:20261119T090000" -> { name, params, value }
function parseLine(line) {
  const idx = line.indexOf(':')
  if (idx < 0) return null
  const head = line.slice(0, idx)
  const value = line.slice(idx + 1)
  const [name, ...rest] = head.split(';')
  const params = {}
  rest.forEach(p => { const [k, v] = p.split('='); if (k) params[k.toUpperCase()] = (v || '').replace(/^"|"$/g, '') })
  return { name: name.toUpperCase(), params, value }
}

function tzOffsetMs(utcMs, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const g = t => Number(parts.find(p => p.type === t)?.value)
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'))
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

function zonedToDate(y, mo, d, h, mi, s, tz) {
  const guess = Date.UTC(y, mo, d, h, mi, s)
  let t = guess - tzOffsetMs(guess, tz)
  t = guess - tzOffsetMs(t, tz)
  return new Date(t)
}

// Returns { date: Date, allDay: boolean } or null.
function parseDateValue(value, params) {
  const m = String(value).trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  if (h == null || params?.VALUE === 'DATE') return { date: new Date(+y, +mo - 1, +d), allDay: true }
  const args = [+y, +mo - 1, +d, +h, +mi, +(s || 0)]
  if (z) return { date: new Date(Date.UTC(...args)), allDay: false }
  if (params?.TZID) {
    try { return { date: zonedToDate(...args, params.TZID), allDay: false } } catch { /* unknown zone: use phone time */ }
  }
  return { date: new Date(...args), allDay: false }
}

function parseDuration(v) {
  const m = String(v).match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
  if (!m) return null
  const ms = ((+m[2] || 0) * 7 * 86400 + (+m[3] || 0) * 86400 + (+m[4] || 0) * 3600 + (+m[5] || 0) * 60 + (+m[6] || 0)) * 1000
  return m[1] === '-' ? -ms : ms
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function parseRule(value) {
  const rule = {}
  String(value).split(';').forEach(part => { const [k, v] = part.split('='); if (k) rule[k.toUpperCase()] = v })
  return rule
}

function nthWeekdayOfMonth(year, month, weekday, nth) {
  if (nth > 0) {
    const first = new Date(year, month, 1)
    const day = 1 + ((weekday - first.getDay() + 7) % 7) + (nth - 1) * 7
    const d = new Date(year, month, day)
    return d.getMonth() === month ? d : null
  }
  const last = new Date(year, month + 1, 0)
  const day = last.getDate() - ((last.getDay() - weekday + 7) % 7) + (nth + 1) * 7
  const d = new Date(year, month, day)
  return d.getMonth() === month ? d : null
}

// Start times of a repeating event inside the window. Whole days are added in
// phone time so the wall clock time stays the same through daylight saving.
function expand(start, ruleText, windowStart, windowEnd, exdates) {
  const rule = parseRule(ruleText)
  const freq = rule.FREQ
  const interval = Math.max(1, parseInt(rule.INTERVAL || '1', 10) || 1)
  const count = rule.COUNT ? parseInt(rule.COUNT, 10) : null
  const until = rule.UNTIL ? parseDateValue(rule.UNTIL, {})?.date : null
  const out = []
  let partial = false
  const h = start.getHours(), mi = start.getMinutes(), s = start.getSeconds()
  const at = (y, mo, d) => new Date(y, mo, d, h, mi, s)
  const push = d => {
    if (!d || d < start) return false
    if (until && d > until) return false
    if (count && out.length + skipped >= count) return false
    return true
  }
  let skipped = 0
  const accept = d => {
    if (!push(d)) return false
    if (d >= windowStart && d <= windowEnd && !exdates.has(d.getTime())) out.push(d)
    else skipped += 1
    return out.length + skipped < 100000
  }

  const byDay = rule.BYDAY ? rule.BYDAY.split(',').map(x => { const mm = x.match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/); return mm ? { nth: mm[1] ? parseInt(mm[1], 10) : 0, wd: WEEKDAYS.indexOf(mm[2]) } : null }).filter(Boolean) : []
  const byMonthDay = rule.BYMONTHDAY ? rule.BYMONTHDAY.split(',').map(Number).filter(Boolean) : []
  const limit = new Date(windowEnd.getTime() + 86400000)

  if (rule.BYSETPOS || !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) {
    return { starts: [start], partial: true }
  }

  if (freq === 'DAILY') {
    for (let i = 0; i < 4000; i++) {
      const d = at(start.getFullYear(), start.getMonth(), start.getDate() + i * interval)
      if (d > limit || (until && d > until)) break
      if (!accept(d)) break
    }
  } else if (freq === 'WEEKLY') {
    const days = byDay.length ? byDay.map(b => b.wd) : [start.getDay()]
    const weekStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay())
    for (let w = 0; w < 1500; w++) {
      const base = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + w * 7 * interval)
      if (base > limit || (until && base > until)) break
      let go = true
      for (const wd of [...days].sort((a, b) => a - b)) {
        if (!accept(at(base.getFullYear(), base.getMonth(), base.getDate() + wd))) { go = false; break }
      }
      if (!go) break
    }
  } else if (freq === 'MONTHLY') {
    for (let k = 0; k < 600; k++) {
      const first = new Date(start.getFullYear(), start.getMonth() + k * interval, 1)
      if (first > limit || (until && first > until)) break
      let dates = []
      if (byDay.length && byDay.every(b => b.nth)) dates = byDay.map(b => nthWeekdayOfMonth(first.getFullYear(), first.getMonth(), b.wd, b.nth)).filter(Boolean).map(d => at(d.getFullYear(), d.getMonth(), d.getDate()))
      else if (byDay.length) { partial = true; dates = [at(first.getFullYear(), first.getMonth(), start.getDate())] }
      else if (byMonthDay.length) dates = byMonthDay.map(n => { const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); const day = n < 0 ? dim + n + 1 : n; return day >= 1 && day <= dim ? at(first.getFullYear(), first.getMonth(), day) : null }).filter(Boolean)
      else { const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); if (start.getDate() <= dim) dates = [at(first.getFullYear(), first.getMonth(), start.getDate())] }
      dates.sort((a, b) => a - b)
      let go = true
      for (const d of dates) { if (!accept(d)) { go = false; break } }
      if (!go) break
    }
  } else if (freq === 'YEARLY') {
    for (let k = 0; k < 60; k++) {
      const d = at(start.getFullYear() + k * interval, start.getMonth(), start.getDate())
      if (d > limit || (until && d > until)) break
      if (!accept(d)) break
    }
  }
  if (out.length > MAX_PER_RULE) out.length = MAX_PER_RULE
  return { starts: out, partial }
}

// parseIcs(text, { windowStart, windowEnd })
// -> { events: [{ uid, key, title, location, start, end, allDay }], partial, skipped }
export function parseIcs(text, opts = {}) {
  const now = new Date()
  const windowStart = opts.windowStart || startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const windowEnd = opts.windowEnd || new Date(now.getFullYear() + 1, now.getMonth() + 1, 0, 23, 59)
  const lines = unfold(text)
  const blocks = []
  let cur = null
  for (const line of lines) {
    if (/^BEGIN:VEVENT/i.test(line)) cur = []
    else if (/^END:VEVENT/i.test(line)) { if (cur) blocks.push(cur); cur = null }
    else if (cur) cur.push(line)
  }

  const events = []
  const overrides = new Set()
  let partial = 0
  let skipped = 0
  const parsed = blocks.map(b => {
    const props = { EXDATE: [] }
    b.forEach(l => {
      const p = parseLine(l)
      if (!p) return
      if (p.name === 'EXDATE') p.value.split(',').forEach(v => { const dv = parseDateValue(v, p.params); if (dv) props.EXDATE.push(dv.date.getTime()) })
      else if (!props[p.name]) props[p.name] = p
    })
    return props
  })

  parsed.forEach(p => {
    if (p['RECURRENCE-ID'] && p.UID) {
      const r = parseDateValue(p['RECURRENCE-ID'].value, p['RECURRENCE-ID'].params)
      if (r) overrides.add(`${p.UID.value}|${r.date.getTime()}`)
    }
  })

  for (const p of parsed) {
    if (!p.DTSTART || !p.SUMMARY) { skipped += 1; continue }
    if (/CANCELLED/i.test(p.STATUS?.value || '')) { skipped += 1; continue }
    const st = parseDateValue(p.DTSTART.value, p.DTSTART.params)
    if (!st) { skipped += 1; continue }
    let end
    if (p.DTEND) end = parseDateValue(p.DTEND.value, p.DTEND.params)?.date
    if (!end && p.DURATION) { const ms = parseDuration(p.DURATION.value); if (ms != null) end = new Date(st.date.getTime() + ms) }
    if (!end) end = st.allDay ? new Date(st.date.getFullYear(), st.date.getMonth(), st.date.getDate() + 1) : st.date
    if (end < st.date) end = st.date
    const length = end.getTime() - st.date.getTime()
    const uid = p.UID?.value || `${p.SUMMARY.value}-${st.date.getTime()}`
    const base = { uid, title: unescapeText(p.SUMMARY.value).slice(0, 120), location: p.LOCATION ? unescapeText(p.LOCATION.value).slice(0, 120) : null, allDay: st.allDay }
    let starts
    if (p.RRULE && !p['RECURRENCE-ID']) {
      const ex = new Set(p.EXDATE)
      const r = expand(st.date, p.RRULE.value, windowStart, windowEnd, ex)
      starts = r.starts
      if (r.partial) partial += 1
    } else {
      starts = st.date >= windowStart && st.date <= windowEnd || (end >= windowStart && st.date <= windowEnd) ? [st.date] : []
    }
    for (const s of starts) {
      if (p.RRULE && !p['RECURRENCE-ID'] && overrides.has(`${uid}|${s.getTime()}`)) continue
      const e = st.allDay
        ? new Date(s.getFullYear(), s.getMonth(), s.getDate() + Math.max(1, Math.round(length / 86400000)))
        : new Date(s.getTime() + length)
      events.push({ ...base, key: `${uid}|${s.getTime()}`, start: s, end: e })
      if (events.length >= MAX_EVENTS) break
    }
    if (events.length >= MAX_EVENTS) break
  }
  events.sort((a, b) => a.start - b.start)
  return { events, partial, skipped, truncated: events.length >= MAX_EVENTS }
}

export function icsTimeLabel(ev) {
  if (ev.allDay) return 'All day'
  return `${pad(ev.start.getHours())}:${pad(ev.start.getMinutes())}`
}
