import { keyToLocalDate } from './dates'

// Exam slots: { id, module, date: '2026-11-24', start: 570, end: 690, room, remind }
// start and end are minutes from midnight. Clash and gap maths is done in
// minutes on the same date.

export const TIGHT_GAP_MIN = 90

export function sortExams(list) {
  return [...list].sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1))
}

// Compares one slot with the others on the same day.
// Returns { clashes: [{ other, overlap }], tight: [{ other, gap }] }
export function checkSlot(slot, others) {
  const clashes = []
  const tight = []
  for (const o of others) {
    if (o.id === slot.id || o.date !== slot.date) continue
    const overlap = Math.min(slot.end, o.end) - Math.max(slot.start, o.start)
    if (overlap > 0) {
      clashes.push({ other: o, overlap })
    } else {
      const gap = slot.start >= o.end ? slot.start - o.end : o.start - slot.end
      if (gap < TIGHT_GAP_MIN) tight.push({ other: o, gap })
    }
  }
  return { clashes, tight }
}

// Flags for every saved slot, keyed by id.
export function flagAll(list) {
  const out = {}
  let clashCount = 0
  let tightCount = 0
  const seen = new Set()
  for (const s of list) {
    const r = checkSlot(s, list)
    out[s.id] = r
    for (const c of r.clashes) {
      const k = [s.id, c.other.id].sort().join('|')
      if (!seen.has(k)) { seen.add(k); clashCount++ }
    }
    for (const t of r.tight) {
      const k = 't' + [s.id, t.other.id].sort().join('|')
      if (!seen.has(k)) { seen.add(k); tightCount++ }
    }
  }
  return { flags: out, clashCount, tightCount }
}

// Items for the Calendar (lib/calendar/items.js, source 'exams').
export function toCalendarItems(list) {
  return list
    .map(s => {
      const start = keyToLocalDate(s.date, s.start)
      const end = keyToLocalDate(s.date, s.end)
      if (!start || !end) return null
      return {
        id: `exam-${s.id}`,
        title: `Exam: ${s.module}`,
        start: start.toISOString(),
        end: end.toISOString(),
        kind: 'exam',
        from: 'Added by you',
        location: s.room || undefined,
      }
    })
    .filter(Boolean)
}
