// Data access for the Home feed: Post/Thread cards, the "This Week's Buzz"
// window ranking, Campus Pulse's mood distribution, mood-tagged reactions,
// and promoted placements ("Ad" cards). Kept separate from HomeScreen.jsx so
// the screen stays about layout, not query shape.

import { supabase } from './supabase'

export const BUZZ_WINDOWS = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year',  label: 'This Year' },
]

export const DEFAULT_BUZZ_WINDOW = 'week'

// Minimum Thread posts in the current Buzz window before Campus Pulse shows
// real segments instead of the "not enough data yet" placeholder.
export const CAMPUS_PULSE_MIN_THREADS = 5

// How often a Buzzing highlight / Ad card is interleaved into the main feed.
export const INTERLEAVE_EVERY = 5

export function windowStartDate(windowId) {
  const d = new Date()
  switch (windowId) {
    case 'today':
      d.setHours(0, 0, 0, 0)
      return d
    case 'month':
      d.setMonth(d.getMonth() - 1)
      return d
    case 'year':
      d.setFullYear(d.getFullYear() - 1)
      return d
    case 'week':
    default:
      d.setDate(d.getDate() - 7)
      return d
  }
}

export async function fetchFeedPage({ before = null, limit = 20 } = {}) {
  let q = supabase
    .from('feed_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (before) q = q.lt('created_at', before)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

// Today = newest first. Week/Month/Year = most-reacted first within the
// window (ties broken by recency).
export async function fetchBuzzingHighlight(windowId) {
  const since = windowStartDate(windowId).toISOString()
  let q = supabase.from('feed_posts').select('*').gte('created_at', since)
  q = windowId === 'today'
    ? q.order('created_at', { ascending: false })
    : q.order('reaction_count', { ascending: false }).order('created_at', { ascending: false })
  const { data, error } = await q.limit(1)
  if (error) throw error
  const top = data?.[0] || null
  // A highlight only means something if it actually has reactions, or it's
  // "Today" (newest-first — freshness, not popularity, is the point there).
  if (top && windowId !== 'today' && top.reaction_count === 0) return null
  return top
}

export async function fetchCampusPulse(windowId) {
  const since = windowStartDate(windowId).toISOString()
  const { data, error } = await supabase
    .from('feed_posts')
    .select('mood')
    .eq('post_type', 'thread')
    .gte('created_at', since)
  if (error) throw error
  const rows = data || []
  const counts = {}
  for (const r of rows) counts[r.mood] = (counts[r.mood] || 0) + 1
  return { total: rows.length, counts }
}

export async function fetchActivePlacement() {
  const { data, error } = await supabase
    .from('promoted_placements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function fetchMyReactions(postIds, userId) {
  if (!postIds?.length || !userId) return {}
  const { data, error } = await supabase
    .from('feed_post_reactions')
    .select('post_id, mood')
    .eq('user_id', userId)
    .in('post_id', postIds)
  if (error) throw error
  const byPost = {}
  for (const r of data || []) byPost[r.post_id] = r.mood
  return byPost
}

export async function setReaction(postId, userId, moodId) {
  const { error } = await supabase
    .from('feed_post_reactions')
    .upsert({ post_id: postId, user_id: userId, mood: moodId }, { onConflict: 'post_id,user_id' })
  if (error) throw error
}

export async function clearReaction(postId, userId) {
  const { error } = await supabase
    .from('feed_post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function createThread({ userId, mood, body }) {
  const { error } = await supabase.from('feed_posts').insert({
    user_id: userId, post_type: 'thread', mood, body,
  })
  if (error) throw error
}

export async function createPost({ userId, photoUrl, caption }) {
  const { error } = await supabase.from('feed_posts').insert({
    user_id: userId, post_type: 'post', photo_url: photoUrl, body: caption || null,
  })
  if (error) throw error
}

// Build the render list for the main feed: reverse-chronological posts with
// a Buzzing-highlight / Ad card spliced in every INTERLEAVE_EVERY posts.
// When both exist they alternate (Buzzing, Ad, Buzzing, Ad, …); when only
// one exists every slot uses it; when neither exists, the slot is simply
// skipped (no empty gap), per spec.
export function buildFeedRenderList(posts, { buzzingHighlight, placement }) {
  const items = []
  let slotIndex = 0
  posts.forEach((post, i) => {
    items.push({ kind: 'post', key: `post-${post.id}`, post })
    const isSlot = (i + 1) % INTERLEAVE_EVERY === 0
    if (!isSlot) return
    const useBuzzing = buzzingHighlight && (!placement || slotIndex % 2 === 0)
    const useAd = placement && (!buzzingHighlight || slotIndex % 2 === 1)
    if (useBuzzing) {
      items.push({ kind: 'buzzing', key: `buzzing-${i}-${buzzingHighlight.id}`, post: buzzingHighlight })
      slotIndex += 1
    } else if (useAd) {
      items.push({ kind: 'ad', key: `ad-${i}-${placement.id}`, placement })
      slotIndex += 1
    }
  })
  return items
}
