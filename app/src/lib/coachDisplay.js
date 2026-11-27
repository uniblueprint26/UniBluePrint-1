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
