import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { MUTED } from './theme'

// Studio Phase 14 -- clickable <th> for the sortable-table retrofit (pairs
// with useSortableTable.js). A plain <th> when not given sort props (so a
// hub can mix sortable and non-sortable columns in the same header row
// without a second component).
export default function SortTh({ children, sortable, active, dir, onSort, style, ...rest }) {
  if (!sortable) return <th style={style} {...rest}>{children}</th>

  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown

  return (
    <th
      style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      {...rest}
    >
      <button
        type="button"
        onClick={onSort}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent',
          font: 'inherit', color: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit', padding: 0, cursor: 'pointer',
        }}
      >
        {children}
        <Icon size={12} color={active ? 'var(--studio-accent)' : MUTED} aria-hidden="true" />
      </button>
    </th>
  )
}
