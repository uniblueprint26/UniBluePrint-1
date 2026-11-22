import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useSocieties } from '../../components/explore/societies'

// Shared by the Explore screen and the bundle pages.

// How many published rows each explore_content kind has, for the quiet
// "24 listings" text. Counts stay empty if the query fails: nothing breaks.
export function useKindCounts() {
  const [counts, setCounts] = useState({})
  const [status, setStatus] = useState({ loading: true, failed: false })
  const [tries, setTries] = useState(0)
  const societies = useSocieties()
  useEffect(() => {
    let cancelled = false
    setStatus({ loading: true, failed: false })
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('explore_content')
          .select('kind')
          .eq('status', 'published')
        if (cancelled) return
        if (error || !data) { setStatus({ loading: false, failed: true }); return }
        const next = {}
        data.forEach(r => { next[r.kind] = (next[r.kind] || 0) + 1 })
        setCounts(next)
        setStatus({ loading: false, failed: false })
      } catch { if (!cancelled) setStatus({ loading: false, failed: true }) }
    })()
    return () => { cancelled = true }
  }, [tries])
  // Example societies are not counted: only real ones are.
  const realSocieties = societies.items.filter(i => !i.example).length
  // __loading, __failed and __reload are status fields for the screen, not counts.
  return { ...counts, societies: realSocieties, __loading: status.loading, __failed: status.failed, __reload: () => setTries(n => n + 1) }
}

// Open a catalog row. Coming soon rows are handled by the screen (a sheet).
export function openExploreRow(navigation, row) {
  if (row.kind) {
    navigation.navigate('ExploreList', { kind: row.kind })
  } else if (row.adBoardBasket) {
    // The Ad Board is another tab. initial: false keeps its main page under
    // the basket, so Back lands there and not on nothing.
    navigation.getParent()?.navigate('AdBoard', {
      screen: 'AdBoardBasket',
      params: { basket: row.adBoardBasket },
      initial: false,
    })
  } else if (row.route) {
    navigation.navigate(row.route, row.params)
  }
}
