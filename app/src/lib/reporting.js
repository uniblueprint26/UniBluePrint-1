import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Reporting and blocking for everything one person shows to another (Apple
// guideline 1.2, Google Play user generated content policy). One place for the
// reasons, the database calls and the list of people you have blocked.
//
// Reports go to public.content_reports (see the migration
// 20261119100000_content_reports.sql). Blocks go to public.blocked_users, the
// same table chat blocking already uses.

export const REPORT_REASONS = ['Inappropriate content', 'Spam', 'Safety concern', 'Other']

// Sends one report. Resolves { ok: true } or { ok: false }. A report already
// sent for the same thing by the same person counts as sent (code 23505).
export async function submitReport({ reporterId, contentType, contentId, reportedUserId, reason }) {
  if (!reporterId || !contentType || contentId == null || !reason) return { ok: false }
  try {
    const { error } = await supabase.from('content_reports').insert({
      reporter_id: reporterId,
      content_type: String(contentType),
      content_id: String(contentId),
      reported_user_id: reportedUserId || null,
      reason,
    })
    if (error && error.code !== '23505') return { ok: false }
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

// ── People you have blocked ─────────────────────────────────────────────────
// A small cache, so lists can hide a blocked person's content straight away.
let blocked = new Set()
let loadedFor = null
const listeners = new Set()

function emit() {
  listeners.forEach(fn => { try { fn() } catch {} })
}

export function getBlockedIds() {
  return blocked
}

// Loads the people this user has blocked. Quiet on failure.
export async function refreshBlockedIds(userId) {
  if (!userId) { blocked = new Set(); loadedFor = null; emit(); return blocked }
  try {
    const { data, error } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId)
    if (!error && Array.isArray(data)) {
      blocked = new Set(data.map(r => r.blocked_id))
      loadedFor = userId
      emit()
    }
  } catch { /* keep what we have */ }
  return blocked
}

// Blocks one person. Resolves { ok: true } or { ok: false }. Already blocked
// counts as done.
export async function blockUser(blockerId, blockedId) {
  if (!blockerId || !blockedId || blockerId === blockedId) return { ok: false }
  try {
    const { error } = await supabase.from('blocked_users').insert({ blocker_id: blockerId, blocked_id: blockedId })
    if (error && error.code !== '23505') return { ok: false }
    blocked = new Set([...blocked, blockedId])
    emit()
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

// The set of blocked user ids, kept fresh. Loads once per signed in user.
export function useBlockedIds(userId) {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force(n => n + 1)
    listeners.add(fn)
    if (userId && loadedFor !== userId) refreshBlockedIds(userId)
    return () => { listeners.delete(fn) }
  }, [userId])
  return blocked
}

// Runs `fn` whenever the blocked list changes. Returns the unsubscribe function.
export function onBlockedChange(fn) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
