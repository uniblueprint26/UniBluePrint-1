import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { INTERESTS } from '../../data/interests'
import { useAuth } from '../../context/AuthContext'
import { useInterests } from '../../hooks/useInterests'
import { rankDirectoryCandidates } from '../../lib/directoryRanking'

// The Directory data source, shared by the old Directory screen and
// Messages > Discover. Candidates come from the get_directory_profiles() RPC,
// the only path to another user's Directory data. It already enforces
// discoverable-only, never the caller, and no blocked pairs, so nothing here
// loosens that: this only ranks, searches and filters what it returns.

const POPULAR_TAG_LIMIT = 8
const RPC_FETCH_LIMIT = 24

const PREDEFINED_LABEL_BY_LOWER = new Map(INTERESTS.map(i => [i.label.toLowerCase(), i.label]))

function mergePopularityRows(rows) {
  const counts = new Map()
  for (const row of rows) {
    const raw = String(row?.label || '').trim()
    if (!raw) continue
    const canonical = PREDEFINED_LABEL_BY_LOWER.get(raw.toLowerCase()) || raw
    counts.set(canonical, (counts.get(canonical) || 0) + Number(row?.usage_count || 0))
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, POPULAR_TAG_LIMIT)
    .map(([label]) => label)
}

// Cold-start fallback only: tags seen on the candidates themselves.
function topTagsFromCandidates(candidates, limit) {
  const counts = new Map()
  for (const c of candidates) {
    for (const tag of (c.interests || [])) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag)
}

export function useDirectoryData() {
  const { profile } = useAuth()
  const { interests: viewerInterests } = useInterests()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [popularTags, setPopularTags] = useState([])
  const [tagsLoading, setTagsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(false)
      try {
        const { data, error: err } = await supabase.rpc('get_directory_profiles')
        if (cancelled) return
        if (err) setError(true)
        setCandidates(data || [])
      } catch {
        if (!cancelled) { setError(true); setCandidates([]) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error: err } = await supabase.rpc('get_popular_interests', { limit_count: RPC_FETCH_LIMIT })
        if (err) throw err
        if (!cancelled) setPopularTags(mergePopularityRows(data || []))
      } catch {
        if (!cancelled) setPopularTags([])
      } finally {
        if (!cancelled) setTagsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const fallbackTags = useMemo(() => topTagsFromCandidates(candidates, POPULAR_TAG_LIMIT), [candidates])
  const tagFilters = tagsLoading ? [] : (popularTags.length > 0 ? popularTags : fallbackTags)
  const filters = useMemo(() => ['All', ...tagFilters], [tagFilters])

  // Used only to score relevance client-side; the privacy boundary is the RPC.
  const viewer = useMemo(() => ({
    interests:     viewerInterests,
    course:        profile?.course || '',
    year_of_study: profile?.year_of_study || '',
    institution:   profile?.institution || '',
  }), [viewerInterests, profile?.course, profile?.year_of_study, profile?.institution])

  const ranked = useMemo(() => rankDirectoryCandidates(viewer, candidates), [viewer, candidates])

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => ranked.filter(s => {
    const tags = s.interests || []
    const matchFilter = filter === 'All' || tags.some(tag => tag.toLowerCase() === filter.toLowerCase())
    const matchSearch =
      !q ||
      String(s.full_name || '').toLowerCase().includes(q) ||
      String(s.course || '').toLowerCase().includes(q) ||
      String(s.institution || '').toLowerCase().includes(q) ||
      tags.some(tag => tag.toLowerCase().includes(q))
    return matchFilter && matchSearch
  }), [ranked, filter, q])

  return {
    viewer, viewerInterests,
    candidates, ranked, filtered,
    loading, error,
    filters, filter, setFilter, search, setSearch, query: q,
  }
}
