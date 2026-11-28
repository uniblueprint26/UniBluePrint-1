import { cleanCopy } from './plainCopy'

// How a coach's name and tagline read on cards and profiles.
//   "Milan Piroska (MPFitness)"   -> "Milan Piroska"
//   "Kevin (TrainWitKev)"         -> "Kevin TrainWitKev"  (a one word name keeps its handle)
export function coachDisplayName(coach) {
  const raw = String(coach?.name || '').trim()
  const m = raw.match(/^(.*?)\s*\((.*)\)\s*$/)
  if (!m) return raw
  const base = m[1].trim()
  if (base.split(/\s+/).length >= 2) return base
  return `${base} ${m[2].trim()}`
}

export function coachFirstName(coach) {
  return coachDisplayName(coach).split(/\s+/)[0] || ''
}

// The tagline, or the speciality when a coach has none.
export function coachTagline(coach) {
  return cleanCopy(coach?.tagline || coach?.cardTag || coach?.category || '')
}

// Milan first, everyone else shuffled. Used every time the Elevation screen opens.
export const FIRST_COACH_ID = 8
export function orderCoaches(list, rand = Math.random) {
  const first = list.find(c => c.id === FIRST_COACH_ID)
  const rest = list.filter(c => c.id !== FIRST_COACH_ID)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return first ? [first, ...rest] : rest
}

// ─── Speciality chips and availability (swipe card, profile header) ─────────
// coachChips: up to three short chips (about 18 characters). From the coach `services`
// array, else the words in `category` split on separators. Short entries come first so a
// chip is never a chopped phrase when a tidier one is available.
const CHIP_MAX = 18

function clipChip(text, max = CHIP_MAX) {
  const t = String(text).trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max + 1)
  const at = cut.lastIndexOf(' ')
  return (at > 5 ? cut.slice(0, at) : t.slice(0, max)).replace(/[\s,&:]+$/, '')
}

function tidyChip(raw) {
  return cleanCopy(String(raw))
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function coachChips(coach, limit = 3) {
  const services = Array.isArray(coach?.chips) && coach.chips.length ? coach.chips : Array.isArray(coach?.services) ? coach.services : []
  let source = services
  if (source.length === 0) {
    source = String(coach?.category || '').split(/\s*(?:[·|,/&]|\band\b)\s*/i)
  }
  const tidy = source.map(tidyChip).filter(t => t.length > 1 && !/[€$]/.test(t))
  const seen = {}
  const ordered = [...tidy.filter(t => t.length <= CHIP_MAX), ...tidy.filter(t => t.length > CHIP_MAX)]
  const out = []
  for (const t of ordered) {
    const c = clipChip(t)
    const k = c.toLowerCase()
    if (!c || seen[k]) continue
    seen[k] = true
    out.push(c)
    if (out.length >= limit) break
  }
  return out
}

// 'taking' gives Taking clients, 'nearly_full' gives Nearly full, anything else gives null.
export function coachAvailability(coach) {
  if (coach?.availability === 'taking') return { key: 'taking', label: 'Taking clients' }
  if (coach?.availability === 'nearly_full') return { key: 'nearly_full', label: 'Nearly full' }
  return null
}
