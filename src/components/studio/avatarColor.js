// Studio Phase 14 -- split out of Avatar.jsx so that file stays a pure
// component export (avoids a react-refresh/only-export-components lint
// warning for mixing a default component export with named utility
// exports -- same reasoning theme.js/hubRegistry.js already follow by
// being plain-constant files with no component in them at all).
//
// The hash + palette below are copied EXACTLY from the mobile app's own
// avatarColorFor()/initialsFor() (app/src/screens/DirectoryScreen.jsx,
// the Directory/StudentProfile real-profile avatar treatment) rather than
// invented fresh -- so a real person gets the identical avatar colour on
// the Studio hubs and on the consumer app's own Directory, not two
// independent systems that could ever drift for the same user id.
const AVATAR_COLORS = [
  '#1E3A5F', '#0369A1', '#B45309', '#7C3AED', '#0F766E',
  '#15803D', '#9D174D', '#C2410C',
]

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
