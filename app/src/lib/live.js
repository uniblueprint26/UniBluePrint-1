import { useCallback, useEffect, useState } from 'react'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { createFeedPost } from './feed'

// Live: a camera moment a member can post at any time.
//
// What is stored (see supabase/migrations/20261120300200_feed_live.sql)
//   feed_posts row with post_type 'live', audience, also_course (also show on
//   Course Connect for everyone), body (the caption), live_path and
//   live_front_path (paths in the PRIVATE live-moments bucket) and expires_at
//   (set by the database: 24 hours after posting).
//
// Who sees it
//   Others for 24 hours, then only the poster, as their private archive. The
//   read rules live in the database, so this file never decides who can see
//   what. It only asks, and shows what comes back.
//
// Pictures are never public links. They are read through signed links that
// last an hour (signLivePaths), and the storage policy only signs a path for
// someone who can read the post.

export const LIVE_BUCKET = 'live-moments'
export const LIVE_HOURS = 24
export const LIVE_MAX_BYTES = 5 * 1024 * 1024
export const LIVE_MAX_DIM = 1080
export const LIVE_CAPTION_MAX = 140
const SEEN_KEY = 'ubp_live_seen_'

const LIVE_COLUMNS =
  'id, user_id, author_name, audience, also_course, body, live_path, live_front_path, expires_at, created_at, reaction_count, post_type'

// ── Time ─────────────────────────────────────────────────────────────────────

export function msLeft(post, now = Date.now()) {
  if (!post?.expires_at) return 0
  return Math.max(0, new Date(post.expires_at).getTime() - now)
}

export function isLiveNow(post, now = Date.now()) {
  return msLeft(post, now) > 0
}

// "21h left", "45m left", "Ended".
export function timeLeftLabel(post, now = Date.now()) {
  const ms = msLeft(post, now)
  if (ms <= 0) return 'Ended'
  const mins = Math.ceil(ms / 60000)
  if (mins >= 60) return `${Math.floor(mins / 60)}h left`
  return `${Math.max(1, mins)}m left`
}

// ── Reading ──────────────────────────────────────────────────────────────────

// Live moments others can see right now for one rail.
//   'campus' : posted to Campus Connect (the database already limits this to
//              the member's own campus, trade or industry)
//   'course' : posted to Course Connect, or shared there with also_course
// Newest first. Blocked people are left out here as well as in the database.
export async function fetchLiveRail(audience, { blockedIds, limit = 24 } = {}) {
  let q = supabase
    .from('feed_posts')
    .select(LIVE_COLUMNS)
    .eq('post_type', 'live')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)
  q = audience === 'campus'
    ? q.eq('audience', 'campus')
    : q.or('audience.eq.course,also_course.eq.true')
  const { data, error } = await q
  if (error) throw error
  return (data || []).filter(p => !(blockedIds && p.user_id && blockedIds.has(p.user_id)))
}

// One Live by id, or null when it is gone or the member cannot see it.
export async function fetchLiveById(postId) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select(LIVE_COLUMNS)
    .eq('id', postId)
    .eq('post_type', 'live')
    .maybeSingle()
  if (error) throw error
  return data || null
}

// The member's own Live moments, newest first: the one still on (if any) and
// the archive.
export async function fetchMyLives(userId, limit = 60) {
  if (!userId) return { current: null, archive: [] }
  const { data, error } = await supabase
    .from('feed_posts')
    .select(LIVE_COLUMNS)
    .eq('post_type', 'live')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  const rows = data || []
  const now = Date.now()
  return {
    current: rows.find(p => isLiveNow(p, now)) || null,
    archive: rows.filter(p => !isLiveNow(p, now)),
  }
}

// Signed links for private pictures. Returns { [path]: url }. Quiet on failure.
export async function signLivePaths(paths, seconds = 3600) {
  const unique = [...new Set((paths || []).filter(Boolean))]
  if (unique.length === 0) return {}
  try {
    const { data, error } = await supabase.storage.from(LIVE_BUCKET).createSignedUrls(unique, seconds)
    if (error || !data) return {}
    const out = {}
    for (const row of data) if (row?.path && row?.signedUrl) out[row.path] = row.signedUrl
    return out
  } catch {
    return {}
  }
}

// Hook: signed links for a list of Live posts, as { [path]: url }.
export function useLiveUrls(posts) {
  const [urls, setUrls] = useState({})
  const key = (posts || []).map(p => `${p.live_path}|${p.live_front_path || ''}`).join(',')
  useEffect(() => {
    let cancelled = false
    const paths = (posts || []).flatMap(p => [p.live_path, p.live_front_path])
    if (paths.filter(Boolean).length === 0) { setUrls({}); return undefined }
    signLivePaths(paths).then(map => { if (!cancelled) setUrls(map) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return urls
}

// ── Writing ──────────────────────────────────────────────────────────────────

// Resizes one shot, saves it as JPEG and uploads it to the member's own folder
// of the private bucket. Returns the storage path.
export async function uploadLiveShot(userId, uri, label) {
  const processed = await manipulateAsync(
    uri,
    [{ resize: { width: LIVE_MAX_DIM } }],
    { compress: 0.8, format: SaveFormat.JPEG },
  )
  const blob = await (await fetch(processed.uri)).blob()
  if (blob.size > LIVE_MAX_BYTES) throw new Error('That picture is too big. Please retake it.')
  const path = `${userId}/${Date.now()}-${label}.jpg`
  const { error } = await supabase.storage
    .from(LIVE_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return path
}

export async function removeLivePaths(paths) {
  const list = (paths || []).filter(Boolean)
  if (list.length === 0) return
  try { await supabase.storage.from(LIVE_BUCKET).remove(list) } catch { /* nothing more to do */ }
}

// Saves the post. The database sets expires_at itself.
export async function createLive({ userId, backPath, frontPath, caption, audience, alsoCourse }) {
  await createFeedPost({
    userId,
    postType: 'live',
    audience,
    live_path: backPath,
    live_front_path: frontPath || null,
    also_course: !!alsoCourse && audience !== 'course',
    body: caption || null,
  })
}

// Deletes your own Live: the row and its pictures.
export async function deleteLive(post) {
  const { error } = await supabase.from('feed_posts').delete().eq('id', post.id).eq('user_id', post.user_id)
  if (error) throw error
  await removeLivePaths([post.live_path, post.live_front_path])
}

// ── "Seen" on the rail (this phone only) ─────────────────────────────────────

export async function loadSeen(userId) {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY + userId)
    const list = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(list) ? list : [])
  } catch {
    return new Set()
  }
}

export async function markSeen(userId, postId) {
  if (!userId || !postId) return
  try {
    const seen = await loadSeen(userId)
    seen.add(postId)
    // Keep the list short: Live lasts a day, so old ids are never needed.
    await AsyncStorage.setItem(SEEN_KEY + userId, JSON.stringify([...seen].slice(-200)))
  } catch { /* a missed "seen" is harmless */ }
}

// Hook: the rail for one audience, with blocked people removed, signed links
// and the seen set. { posts, urls, seen, loading, reload }
export function useLiveRail(audience, userId, blockedIds) {
  const [posts, setPosts] = useState([])
  const [seen, setSeen] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const blockKey = blockedIds ? [...blockedIds].join(',') : ''

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    try {
      const [rows, seenSet] = await Promise.all([
        fetchLiveRail(audience, { blockedIds }),
        loadSeen(userId),
      ])
      setPosts(rows)
      setSeen(seenSet)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, userId, blockKey])

  return { posts, seen, loading, reload }
}
