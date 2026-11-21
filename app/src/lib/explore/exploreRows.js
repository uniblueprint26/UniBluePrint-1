import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useSocieties } from '../../components/explore/societies'

// Shared by the Explore screen and the bundle pages.

// How many published rows each explore_content kind has, for the quiet
// "24 listings" text. Counts stay empty if the query fails: nothing breaks.
export function useKindCounts() {
  const [counts, setCounts] = useState({})
  const societies = useSocieties()
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('explore_content')
          .select('kind')
          .eq('status', 'published')
        if (cancelled || error || !data) return
        const next = {}
        data.forEach(r => { next[r.kind] = (next[r.kind] || 0) + 1 })
        setCounts(next)
      } catch { /* counts are optional */ }
    })()
    return () => { cancelled = true }
  }, [])
  // Example societies are not counted: only real ones are.
  const realSocieties = societies.items.filter(i => !i.example).length
  return { ...counts, societies: realSocieties }
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
