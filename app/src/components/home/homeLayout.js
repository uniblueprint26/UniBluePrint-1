import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Which sections Home shows, in what order. Saved per user on this device.
// A section that comes after Posts is shown
// inside the feed, after the first few posts; a section before Posts sits
// above the feed.

export const HOME_SECTIONS = [
  { key: 'digest', label: "Today's Digest", hint: 'Slim until you tap it. Holds your goals' },
  { key: 'nextUp', label: 'Next up', hint: 'Your next event. Only shows when you have one' },
  { key: 'posts',  label: 'Posts', hint: 'Your feed' },
]

// Default: digest, next up, then posts with your goals tucked in after the
// first few posts.
export const DEFAULT_HOME_LAYOUT = [
  { key: 'digest', on: true },
  { key: 'nextUp', on: false },
  { key: 'posts',  on: true },
]

// How many posts show before an inline section (your goals) in the feed.
export const POSTS_BEFORE_INLINE = 3

const storageKey = userId => `ubp_home_layout_${userId}`

// Accepts whatever was saved and returns a complete, valid layout: unknown
// keys dropped, missing sections added back on the end (switched on).
export function normaliseLayout(raw) {
  const known = new Set(HOME_SECTIONS.map(s => s.key))
  const seen = new Set()
  const out = []
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && known.has(item.key) && !seen.has(item.key)) {
        seen.add(item.key)
        out.push({ key: item.key, on: item.on !== false })
      }
    }
  }
  for (const d of DEFAULT_HOME_LAYOUT) {
    if (!seen.has(d.key)) out.push({ ...d })
  }
  return out
}

export function useHomeLayout(userId) {
  const [layout, setLayoutState] = useState(DEFAULT_HOME_LAYOUT)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    AsyncStorage.getItem(storageKey(userId))
      .then(raw => { if (!cancelled && raw) setLayoutState(normaliseLayout(JSON.parse(raw))) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [userId])

  const setLayout = useCallback(next => {
    const clean = normaliseLayout(next)
    setLayoutState(clean)
    if (userId) AsyncStorage.setItem(storageKey(userId), JSON.stringify(clean)).catch(() => {})
  }, [userId])

  return { layout, setLayout }
}

// Splits a layout into what sits above the feed and what goes inside it.
export function splitLayout(layout) {
  const postsIdx = layout.findIndex(l => l.key === 'posts')
  const postsOn = postsIdx >= 0 && layout[postsIdx].on
  const on = layout.filter(l => l.on && l.key !== 'posts')
  if (!postsOn) return { postsOn: false, above: on.map(l => l.key), inline: [] }
  const above = []
  const inline = []
  layout.forEach((l, i) => {
    if (!l.on || l.key === 'posts') return
    if (i < postsIdx) above.push(l.key); else inline.push(l.key)
  })
  return { postsOn: true, above, inline }
}
