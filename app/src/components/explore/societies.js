import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// Societies come from two places and are shown as one list:
//   1. clubs_societies: societies that students or colleges have signed up
//      (columns: id, name, category, description, contact, status, created_at).
//   2. explore_content with kind 'societies': societies UBP seeded.
// They are merged and de-duped by name. A signed-up society wins over a
// seeded one with the same name, and picks up any institution, link or tags
// the seeded row knows. A tag of 'example' marks a concept society.

function clean(v) {
  return typeof v === 'string' ? v.trim() : ''
}

function nameKey(name) {
  return clean(name).toLowerCase().replace(/\s+/g, ' ')
}

// A contact can be an email address or a web address. Turn it into a link.
export function contactToLink(contact) {
  const c = clean(contact)
  if (!c) return null
  if (/^(https?:|mailto:)/i.test(c)) return c
  if (c.includes('@') && !c.includes(' ')) return `mailto:${c}`
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(c)) return `https://${c}`
  return null
}

function fromClub(r) {
  const category = clean(r.category)
  return {
    id: `club-${r.id}`,
    name: clean(r.name),
    institution: '',
    tags: category ? [category] : [],
    description: clean(r.description),
    url: contactToLink(r.contact),
    example: false,
    ubp: false,
    signedUp: true,
  }
}

function fromExplore(r) {
  const rawTags = Array.isArray(r.tags) ? r.tags.map(clean).filter(Boolean) : []
  const example = rawTags.some(t => t.toLowerCase() === 'example')
  return {
    id: `explore-${r.id}`,
    name: clean(r.title),
    institution: clean(r.institution),
    tags: rawTags.filter(t => t.toLowerCase() !== 'example'),
    description: clean(r.body) || clean(r.subtitle),
    url: clean(r.url) || null,
    example,
    ubp: r.source === 'ubp',
    signedUp: false,
  }
}

export function mergeSocieties(clubs, content) {
  const byName = new Map()
  const order = []
  const add = item => {
    if (!item.name) return
    const key = nameKey(item.name)
    const prev = byName.get(key)
    if (!prev) {
      byName.set(key, item)
      order.push(key)
      return
    }
    // Same society in both sources: keep the signed-up row, fill the gaps.
    const keep = prev.signedUp ? prev : item
    const other = prev.signedUp ? item : prev
    byName.set(key, {
      ...keep,
      institution: keep.institution || other.institution,
      description: keep.description || other.description,
      url: keep.url || other.url,
      tags: Array.from(new Set([...keep.tags, ...other.tags])),
      example: keep.signedUp ? false : (keep.example && other.example),
      ubp: keep.signedUp ? false : keep.ubp,
    })
  }
  clubs.forEach(add)
  content.forEach(add)
  return order.map(k => byName.get(k))
}

// Reads both sources. If one fails the other still shows; only when both
// fail is the status 'error'.
export async function fetchSocieties() {
  const [clubsRes, contentRes] = await Promise.allSettled([
    supabase
      .from('clubs_societies')
      .select('id, name, category, description, contact, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('explore_content')
      .select('id, kind, title, subtitle, body, url, tags, institution, sort, source, status')
      .eq('kind', 'societies')
      .eq('status', 'published')
      .order('sort', { ascending: true }),
  ])
  const ok = r => r.status === 'fulfilled' && !r.value.error && Array.isArray(r.value.data)
  if (!ok(clubsRes) && !ok(contentRes)) throw new Error('societies unavailable')
  const clubs = ok(clubsRes) ? clubsRes.value.data.map(fromClub) : []
  const content = ok(contentRes) ? contentRes.value.data.map(fromExplore) : []
  return mergeSocieties(clubs, content)
}

export function useSocieties() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setItems(await fetchSocieties())
      setStatus('ready')
    } catch {
      setItems([])
      setStatus('error')
    }
  }, [])
  useEffect(() => { load() }, [load])
  return { items, status, reload: load }
}
