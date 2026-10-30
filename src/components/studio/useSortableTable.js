import { useMemo, useState } from 'react'

// Studio Phase 14 -- shared sortable-table hook, retrofitted onto a few
// real register tables across different hubs (Finance's Client Register,
// Legal's Contracts Register, Tech's Idea Inbox, Outreach's Outreach Log
// -- see each hub page's own call site). Deliberately a hook, not a new
// <Table> component: every existing register is still hand-built JSX
// (different column shapes per hub), so this only adds sort STATE + a
// comparator, leaving each hub's own <table className="studio-table">
// markup in place. Pair with SortTh.jsx for the clickable header cell, and
// with a scrolling wrapper (style={{ maxHeight: '...', overflowY: 'auto' }}
// on the existing `.studio-table-wrap` div) to activate the sticky
// `.studio-table th { position: sticky; top: 0 }` rule StudioShell.jsx's
// SHELL_STYLES already declares (Studio Phase 10) -- that rule has always
// existed, it simply had nothing to stick WITHIN until a table opts into
// its own scrolling container.
//
// `columns`: [{ key, sortValue: row => comparable primitive (string |
// number | Date | null) }] -- only columns worth sorting need an entry;
// a column with no entry here just isn't clickable.
// Returns `{ sortedRows, sortKey, sortDir, getSortProps(key) }` --
// getSortProps spreads straight onto a SortTh.
export function useSortableTable(rows = [], columns = []) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc') // 'asc' | 'desc'

  const colMap = useMemo(() => {
    const m = new Map()
    for (const c of columns) m.set(c.key, c.sortValue)
    return m
  }, [columns])

  function toggleSort(key) {
    if (!colMap.has(key)) return
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
        return key
      }
      setSortDir('asc')
      return key
    })
  }

  const sortedRows = useMemo(() => {
    if (!sortKey || !colMap.has(sortKey)) return rows
    const getVal = colMap.get(sortKey)
    const withIdx = rows.map((row, i) => ({ row, i, v: getVal(row) }))
    withIdx.sort((a, b) => {
      const cmp = compareValues(a.v, b.v)
      if (cmp !== 0) return sortDir === 'asc' ? cmp : -cmp
      return a.i - b.i // stable tie-break -- never reorder equal rows arbitrarily
    })
    return withIdx.map(w => w.row)
  }, [rows, colMap, sortKey, sortDir])

  function getSortProps(key) {
    if (!colMap.has(key)) return {}
    return {
      sortable: true,
      active: sortKey === key,
      dir: sortKey === key ? sortDir : null,
      onSort: () => toggleSort(key),
    }
  }

  return { sortedRows, sortKey, sortDir, getSortProps }
}

function compareValues(a, b) {
  const aNull = a === null || a === undefined
  const bNull = b === null || b === undefined
  if (aNull && bNull) return 0
  if (aNull) return 1 // nulls sort last regardless of direction's own flip
  if (bNull) return -1
  if (a instanceof Date || b instanceof Date) return new Date(a).getTime() - new Date(b).getTime()
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}
