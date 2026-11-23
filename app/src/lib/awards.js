// Helpers for UBP Awards voting (Ireland 2026, issue 1).
//
// Nominees are not in their own table. They sit in the issue's weekly content
// row with page_key 'wrapped', on pages of kind 'awards':
//   { kind: 'awards', categories: [ { key, title, nominees: [ { key | name, why, source } ] } ] }
// The wrapped content may be { pages: [...] } or a bare array of pages. Both
// are read here, and anything malformed is skipped rather than crashing.

export const AWARDS_ISSUE_LABEL = 'Ireland 2026'

export function nomineeKey(n) {
  const k = n && (n.key || n.name)
  return typeof k === 'string' ? k : ''
}

export function nomineeName(n) {
  const v = n && (n.name || n.key)
  return typeof v === 'string' ? v : ''
}

// Every category from every awards page, in the order the editor wrote them.
export function collectAwardCategories(wrapped) {
  const pages = Array.isArray(wrapped) ? wrapped : Array.isArray(wrapped?.pages) ? wrapped.pages : []
  const out = []
  const seen = new Set()
  pages.forEach(p => {
    if (!p || p.kind !== 'awards' || !Array.isArray(p.categories)) return
    p.categories.forEach(c => {
      if (!c || typeof c.key !== 'string' || !c.key || seen.has(c.key) || !Array.isArray(c.nominees)) return
      const nominees = c.nominees.filter(n => nomineeKey(n))
      if (!nominees.length) return
      seen.add(c.key)
      out.push({ key: c.key, title: typeof c.title === 'string' ? c.title : c.key, nominees })
    })
  })
  return out
}

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A shuffle that is random between members but the same every time for one
// member, so nominees never jump around and nobody is ranked.
export function stableShuffle(list, seedText) {
  const rand = mulberry32(hashString(seedText || 'ubp'))
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
  }
  return arr
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// "26 December" from an ISO timestamp, read in UTC (the flags are set in UTC).
export function dayMonth(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

// 'before' | 'open' | 'after'. Both dates must be set and valid for voting to
// open, the same rule the server uses. A missing or bad date means closed.
export function votingPhase(opens, closes, now = Date.now()) {
  if (!opens || !closes) return 'before'
  if (now < opens.getTime()) return 'before'
  if (now <= closes.getTime()) return 'open'
  return 'after'
}
