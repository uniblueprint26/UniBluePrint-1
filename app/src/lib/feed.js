// Data access for the Home feed: Post/Thread cards, the "This Week's Buzz"
// window ranking, Campus Pulse's mood distribution, mood-tagged reactions,
// and promoted placements ("Ad" cards). Kept separate from HomeScreen.jsx so
// the screen stays about layout, not query shape.

import { assertTextClean } from './moderation'
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

// Live moments have their own rails and screens, so the main feed leaves them
// out. Listed as the three older kinds (not "not live") so this query works
// whether or not the live value exists in the database yet.
export const MAIN_FEED_KINDS = ['thread', 'post', 'clip']

export async function fetchFeedPage({ before = null, limit = 20 } = {}) {
  let q = supabase
    .from('feed_posts')
    .select('*')
    .in('post_type', MAIN_FEED_KINDS)
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
  let q = supabase.from('feed_posts').select('*').in('post_type', MAIN_FEED_KINDS).gte('created_at', since)
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

export async function fetchMoodPulse(windowId) {
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

// "Suggested for you" feed card — reuses get_directory_profiles(), the one
// sanctioned path to another user's Directory data (see DirectoryScreen.jsx):
// it already excludes the caller and anyone in a mutual block relationship,
// and only returns discoverable=true profiles, so this card can't leak
// anything the Directory itself wouldn't show. A few random candidates are
// picked client-side each call so the suggestions vary as the feed loops.
export async function fetchSuggestedProfiles(limit = 4) {
  const { data, error } = await supabase.rpc('get_directory_profiles')
  if (error) throw error
  const rows = data || []
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }
  return rows.slice(0, limit)
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

// ── Single post lookup (CommentThreadScreen's header preview) ──────────────

export async function fetchPostById(postId) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle()
  if (error) throw error
  return data || null
}

// ── Comments ─────────────────────────────────────────────────────────────────
// feed_comments.comment_count on the parent post is kept in sync server-side
// (trg_feed_comment_count, mirroring trg_feed_reaction_count) — nothing here
// needs to touch feed_posts directly.

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('feed_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createComment({ postId, userId, body }) {
  assertTextClean(body)
  const { data, error } = await supabase
    .from('feed_comments')
    .insert({ post_id: postId, user_id: userId, body })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(commentId, userId) {
  const { error } = await supabase
    .from('feed_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)
  if (error) throw error
}

// ── Saved posts ──────────────────────────────────────────────────────────────
// Private bookmarks (feed_saved_posts is own-rows-only, see the migration) —
// the bookmark icon on a feed card, toggled, no public visibility.

export async function fetchSavedPostIds(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('feed_saved_posts')
    .select('post_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map(r => r.post_id)
}

export async function savePost(postId, userId) {
  const { error } = await supabase
    .from('feed_saved_posts')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' })
  if (error) throw error
}

export async function unsavePost(postId, userId) {
  const { error } = await supabase
    .from('feed_saved_posts')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
  if (error) throw error
}

// Saved Posts screen's own feed — the saved rows joined back to their full
// feed_posts row, newest-saved first. feed_saved_posts' own RLS (own rows
// only) already scopes this to the caller; feed_posts' "authenticated can
// read all" policy lets the join resolve regardless of who authored each
// post.
export async function fetchSavedPostsWithData(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('feed_saved_posts')
    .select('post_id, created_at, feed_posts(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || [])
    .filter(row => row.feed_posts)
    .map(row => ({ ...row.feed_posts, _savedAt: row.created_at }))
}

// Who can see a post. Matches feed_posts.audience (text, default 'course'):
// course = everyone in Ireland (the default), campus = your own community
// (campus, trade or industry), friends = mutual follows only. The database enforces the rules; the app
// just always says which one was chosen.
export const AUDIENCE_KEYS = ['course', 'campus', 'friends']

function cleanAudience(audience) {
  return AUDIENCE_KEYS.includes(audience) ? audience : 'course'
}

// The one place a feed_posts row is inserted. `fields` carries the
// type-specific columns (mood/body, photo_url/body, video_url/body).
export async function createFeedPost({ userId, postType, audience, ...fields }) {
  const { error } = await supabase.from('feed_posts').insert({
    user_id: userId,
    post_type: postType,
    audience: cleanAudience(audience),
    ...fields,
  })
  if (error) throw error
}

// A Take is post_type 'thread' in the database.
export async function createThread({ userId, mood, body, audience }) {
  await createFeedPost({ userId, postType: 'thread', audience, mood, body })
}

// Most pictures one Post can carry. Matches the check in
// 20261120300000_feed_post_images.sql.
export const MAX_POST_IMAGES = 6

// Every picture of a post, in order. Older single picture posts have only
// photo_url, so they come back as a list of one.
export function getPostImages(post) {
  if (!post) return []
  if (Array.isArray(post.image_urls) && post.image_urls.length > 0) return post.image_urls.filter(Boolean)
  return post.photo_url ? [post.photo_url] : []
}

// photoUrls is the list in the member's order. photo_url is written as the
// first one (the cover) so older readers still work.
export async function createPost({ userId, photoUrls, photoUrl, caption, audience }) {
  const urls = (photoUrls && photoUrls.length ? photoUrls : [photoUrl]).filter(Boolean).slice(0, MAX_POST_IMAGES)
  await createFeedPost({
    userId, postType: 'post', audience,
    photo_url: urls[0], image_urls: urls, body: caption || null,
  })
}

export async function createClip({ userId, videoUrl, caption, audience }) {
  await createFeedPost({ userId, postType: 'clip', audience, video_url: videoUrl, body: caption || null })
}

// Real member posts and UBP posts (no author) take turns, one then one, within
// each loaded page, so Home never shows a wall of either. Each side keeps its
// own newest first order. When one side runs out the other carries on. Pages
// are mixed on their own so earlier posts do not jump when more load.
export function mixRealAndUbp(posts, pageSize = 20) {
  const out = []
  for (let i = 0; i < posts.length; i += pageSize) {
    const page = posts.slice(i, i + pageSize)
    const real = page.filter(p => p.user_id)
    const ubp = page.filter(p => !p.user_id)
    let a = 0, b = 0
    const realFirst = !ubp.length || !real.length || new Date(real[0].created_at) >= new Date(ubp[0].created_at)
    let turn = realFirst ? 'real' : 'ubp'
    while (a < real.length || b < ubp.length) {
      if ((turn === 'real' && a < real.length) || b >= ubp.length) out.push(real[a++])
      else out.push(ubp[b++])
      turn = turn === 'real' ? 'ubp' : 'real'
    }
  }
  return out
}

// Build the render list for the main feed: reverse-chronological posts with
// a Buzzing-highlight / Ad / Suggested-profiles card spliced in every
// INTERLEAVE_EVERY posts. Whichever of the three exist take turns filling
// that slot in order (Buzzing, Ad, Suggested, Buzzing, …); when only one or
// two exist they share the rotation; when none exist, the slot is simply
// skipped (no empty gap), per spec.
export function buildFeedRenderList(posts, { buzzingHighlight, placement, suggestedProfiles } = {}) {
  const slotKinds = []
  if (buzzingHighlight) slotKinds.push('buzzing')
  if (placement) slotKinds.push('ad')
  if (suggestedProfiles?.length) slotKinds.push('suggested')

  const items = []
  let slotIndex = 0
  posts.forEach((post, i) => {
    items.push({ kind: 'post', key: `post-${post.id}`, post })
    const isSlot = (i + 1) % INTERLEAVE_EVERY === 0
    if (!isSlot || slotKinds.length === 0) return
    const kind = slotKinds[slotIndex % slotKinds.length]
    slotIndex += 1
    if (kind === 'buzzing') {
      items.push({ kind: 'buzzing', key: `buzzing-${i}-${buzzingHighlight.id}`, post: buzzingHighlight })
    } else if (kind === 'ad') {
      items.push({ kind: 'ad', key: `ad-${i}-${placement.id}`, placement })
    } else {
      items.push({ kind: 'suggested', key: `suggested-${i}`, profiles: suggestedProfiles })
    }
  })
  return items
}
