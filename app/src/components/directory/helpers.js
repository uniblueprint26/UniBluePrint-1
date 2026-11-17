// Shared by DirectoryScreen, StudentProfileScreen and the Messages tabs
// (Discover, Requests) so one person always gets the same avatar colour and
// initials everywhere.

const AVATAR_COLORS = [
  '#1E3A5F', '#0369A1', '#B45309', '#7C3AED', '#0F766E',
  '#15803D', '#9D174D', '#C2410C',
]

// Real profiles have no per-user colour, so derive a stable one from the id.
export function avatarColorFor(id) {
  const str = String(id || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function initialsFor(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// "Nursing, 2nd year" — course first, then year when we have it.
export function courseLine(person) {
  return [person?.course, person?.year_of_study].filter(Boolean).join(', ')
}

function norm(v) { return String(v || '').trim().toLowerCase() }

// Interests the viewer and this person both picked, in the person's order.
export function sharedInterests(viewerInterests, person) {
  const mine = new Set((viewerInterests || []).map(norm))
  return (person?.interests || []).filter(t => mine.has(norm(t)))
}

export function sameCourse(viewerCourse, person) {
  return !!norm(viewerCourse) && norm(viewerCourse) === norm(person?.course)
}
