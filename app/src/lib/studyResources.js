import { Platform, Linking } from 'react-native'
import { supabase } from './supabase'
import { checkText, GUIDELINES_MESSAGE, moderationMessage } from './moderation'

// Shared resources (notes, past papers and links) for Campus Connect and
// Course Connect. One place for the rules, so the browse screen, the add sheet
// and the Resource finder all behave the same.
//
// Tables: shared_notes (notes) and past_papers (papers). Each row is a file
// (file_url) or a link (link_url), and has a scope: 'course' (national) or
// 'campus' (the poster's own community). Rows with is_ubp are posted by UBP.

export const MAX_FILE_BYTES = 15 * 1024 * 1024
export const FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/webp',
]
export const FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'webp']
export const FILE_HELP = 'PDF, Word, PowerPoint, text or image. Up to 15 MB.'

export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Postgrad']
export const SESSIONS = ['Semester 1', 'Semester 2', 'Summer', 'Autumn/Repeat']

export const TYPES = {
  note: { table: 'shared_notes', rpc: 'increment_shared_note_downloads', arg: 'note_id', reportType: 'shared_notes', label: 'Note' },
  paper: { table: 'past_papers', rpc: 'increment_past_paper_downloads', arg: 'paper_id', reportType: 'past_papers', label: 'Past paper' },
}

// ── Links ───────────────────────────────────────────────────────────────────
// Returns { ok, url, error }. https only, one clean web address.
export function validateLink(raw) {
  const text = String(raw || '').trim()
  if (!text) return { ok: false, error: 'Add the web address.' }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`
  if (/\s/.test(withScheme)) return { ok: false, error: 'A web address cannot have spaces.' }
  if (!/^https:\/\//i.test(withScheme)) return { ok: false, error: 'The link must start with https.' }
  if (withScheme.length > 500) return { ok: false, error: 'That link is too long.' }
  try {
    const u = new URL(withScheme)
    if (!u.hostname.includes('.') || u.hostname.endsWith('.')) return { ok: false, error: 'That does not look like a web address.' }
    if (u.username || u.password) return { ok: false, error: 'Remove the name and password from the link.' }
    return { ok: true, url: u.toString() }
  } catch {
    return { ok: false, error: 'That does not look like a web address.' }
  }
}

export function sourceDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

export function isLink(item) {
  return !item.file_url && !!item.link_url
}

export function openUrlOf(item) {
  return item.file_url || item.link_url
}

export function fileKindLabel(item) {
  if (isLink(item)) return 'Link'
  const mime = (item.file_mime || '').toLowerCase()
  const name = (item.file_name || item.file_url || '').toLowerCase()
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'PDF'
  if (mime.includes('word') || /\.docx?$/.test(name)) return 'Word'
  if (mime.includes('presentation') || mime.includes('powerpoint') || /\.pptx?$/.test(name)) return 'Slides'
  if (mime.includes('text/plain') || name.endsWith('.txt')) return 'Text'
  return 'Image'
}

// ── Reading ─────────────────────────────────────────────────────────────────
// Row level security does the scoping: Course Connect rows come back for
// everyone, Campus Connect rows only for the poster's own community. The
// `scope` argument then narrows the list to what the screen is showing.
export async function fetchResources(scope) {
  const [n, p] = await Promise.all([
    supabase.from('shared_notes').select('*').eq('scope', scope).order('created_at', { ascending: false }).limit(300),
    supabase.from('past_papers').select('*').eq('scope', scope).order('created_at', { ascending: false }).limit(300),
  ])
  if (n.error && p.error) return { ok: false, items: [] }
  const items = [
    ...(n.data || []).map(x => ({ ...x, _type: 'note', _title: x.title || 'Untitled' })),
    ...(p.data || []).map(x => ({ ...x, _type: 'paper', _title: paperTitle(x) })),
  ]
  return { ok: true, items }
}

export function paperTitle(x) {
  if (x.title) return x.title
  const tail = [x.exam_session, x.year].filter(Boolean).join(' ')
  return [x.subject, tail].filter(Boolean).join(', ') || 'Past paper'
}

export const keyOf = item => `${item._type}:${item.id}`

export async function fetchMyState(userId, items) {
  const saved = new Set()
  const mine = {}
  const summary = {}
  if (!userId || !items.length) return { saved, mine, summary }
  try {
    const { data } = await supabase.from('resource_saves').select('resource_type, resource_id').eq('user_id', userId)
    ;(data || []).forEach(r => saved.add(`${r.resource_type}:${r.resource_id}`))
  } catch { /* saves are optional */ }
  try {
    const { data } = await supabase.from('resource_ratings').select('resource_type, resource_id, rating').eq('user_id', userId)
    ;(data || []).forEach(r => { mine[`${r.resource_type}:${r.resource_id}`] = r.rating })
  } catch { /* ratings are optional */ }
  for (const type of ['note', 'paper']) {
    const ids = items.filter(i => i._type === type).map(i => i.id)
    if (!ids.length) continue
    try {
      const { data } = await supabase.rpc('resource_rating_summary', { p_type: type, p_ids: ids })
      ;(data || []).forEach(r => { summary[`${type}:${r.resource_id}`] = { avg: Number(r.avg_rating), count: Number(r.rating_count) } })
    } catch { /* ratings are optional */ }
  }
  return { saved, mine, summary }
}

// ── Acting ──────────────────────────────────────────────────────────────────
// Counts the open or download, then opens the file or link. The count is best
// effort: a failed count never stops the file opening.
export async function openResource(item) {
  const t = TYPES[item._type]
  try { await supabase.rpc(t.rpc, { [t.arg]: item.id }) } catch { /* count is best effort */ }
  const url = openUrlOf(item)
  if (!url) return false
  if (Platform.OS === 'web') { window.open(url, '_blank', 'noopener'); return true }
  try { await Linking.openURL(url); return true } catch { return false }
}

export async function setSaved(userId, item, on) {
  const row = { user_id: userId, resource_type: item._type, resource_id: item.id }
  if (on) {
    const { error } = await supabase.from('resource_saves').upsert(row)
    return !error
  }
  const { error } = await supabase.from('resource_saves').delete().match(row)
  return !error
}

export async function setRating(userId, item, rating) {
  const { error } = await supabase.from('resource_ratings')
    .upsert({ user_id: userId, resource_type: item._type, resource_id: item.id, rating })
  return !error
}

// Deletes your own row, then its stored file. A failed file clean up is quiet.
export async function removeResource(item) {
  const t = TYPES[item._type]
  const { error } = await supabase.from(t.table).delete().eq('id', item.id)
  if (error) return false
  const marker = '/course-connect-files/'
  const at = (item.file_url || '').indexOf(marker)
  if (at >= 0) {
    const path = decodeURIComponent(item.file_url.slice(at + marker.length).split('?')[0])
    try { await supabase.storage.from('course-connect-files').remove([path]) } catch { /* ignore */ }
  }
  return true
}

// ── Adding ──────────────────────────────────────────────────────────────────
export function extOf(name, mime) {
  const fromName = (name || '').split('.').pop()?.toLowerCase()
  if (fromName && FILE_EXTENSIONS.includes(fromName)) return fromName
  const m = (mime || '').toLowerCase()
  if (m.includes('pdf')) return 'pdf'
  if (m.includes('wordprocessingml')) return 'docx'
  if (m.includes('msword')) return 'doc'
  if (m.includes('presentationml')) return 'pptx'
  if (m.includes('powerpoint')) return 'ppt'
  if (m.includes('text/plain')) return 'txt'
  if (m.includes('png')) return 'png'
  if (m.includes('webp')) return 'webp'
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
  return null
}

// Checks a chosen file before it is uploaded. Returns an error string or null.
export function fileProblem(asset) {
  if (!asset) return 'Choose a file first.'
  if (asset.size && asset.size > MAX_FILE_BYTES) return 'That file is over 15 MB. Choose a smaller one.'
  if (!extOf(asset.name, asset.mimeType)) return 'That file type is not allowed. Use PDF, Word, PowerPoint, text or an image.'
  return null
}

export async function uploadFile(userId, asset) {
  const problem = fileProblem(asset)
  if (problem) throw new Error(problem)
  const res = await fetch(asset.uri)
  const blob = await res.blob()
  if (blob.size > MAX_FILE_BYTES) throw new Error('That file is over 15 MB. Choose a smaller one.')
  const ext = extOf(asset.name, asset.mimeType)
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('course-connect-files')
    .upload(path, blob, { contentType: asset.mimeType || 'application/octet-stream', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('course-connect-files').getPublicUrl(path)
  return { url: data.publicUrl, path, mime: asset.mimeType || null, name: asset.name || null }
}

// Checks every typed text. Returns an error string or null.
export function textProblem(...texts) {
  for (const t of texts) {
    if (t && !checkText(String(t)).ok) return GUIDELINES_MESSAGE
  }
  return null
}

export { moderationMessage }

// Saves one resource. `draft`: { type, scope, title, subject, course, module, year,
// examSession, description, link, file, suggest, userId, posterName, institution }.
// Returns the inserted row. Throws a plain Error with a friendly message.
export async function createResource(draft) {
  const t = TYPES[draft.type]
  const base = {
    user_id: draft.userId,
    poster_name: draft.posterName || null,
    institution: draft.institution || null,
    scope: draft.scope,
    subject: draft.subject.trim(),
    course: draft.course.trim(),
    module: draft.module?.trim() || null,
    year: draft.year,
    description: draft.description?.trim() || null,
    suggested_to_ubp: !!draft.suggest,
    link_url: draft.link || null,
    file_url: draft.file?.url || null,
    file_mime: draft.file?.mime || null,
    file_name: draft.file?.name || null,
  }
  const row = draft.type === 'note'
    ? { ...base, title: draft.title.trim() }
    : { ...base, exam_session: draft.examSession }
  const { data, error } = await supabase.from(t.table).insert(row).select('*').single()
  if (error) {
    // Clean up an uploaded file that never got a row.
    if (draft.file?.path) { try { await supabase.storage.from('course-connect-files').remove([draft.file.path]) } catch { /* ignore */ } }
    if (/campus in settings/i.test(error.message || '')) throw new Error('Add your campus in Settings first.')
    throw new Error(moderationMessage(error, 'Could not save. Please try again.'))
  }
  return { ...data, _type: draft.type, _title: draft.type === 'note' ? data.title : paperTitle(data) }
}
