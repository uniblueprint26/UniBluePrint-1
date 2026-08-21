import { useState, useRef, useEffect, useMemo, useId } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { INDUSTRIES, isKnownIndustry } from '../../lib/industries'

/**
 * Searchable industry picker over the controlled vocabulary.
 *
 * Industry used to be free text, which meant anything the server's normaliser
 * did not recognise fell silently to `general` and the student lost their whole
 * industry layer without being told. Picking from a known list removes that
 * failure for the common case.
 *
 * "Other — not listed" still stores free text, because a controlled list that
 * cannot express a real student's field is worse than no list. That free text
 * is normalised server-side, and legitimately may resolve to `general` — the
 * difference is that it is now a deliberate choice rather than a silent miss.
 *
 * Value handling: an existing free-text value from before this component
 * existed opens in "Other" mode with the text preserved, so no stored profile
 * is quietly blanked by the upgrade.
 */

const OTHER = '__other__'

export default function IndustrySelect({ value, onChange, id, required }) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const listId = `${fieldId}-listbox`

  const startsOther = !!value && !isKnownIndustry(value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [otherMode, setOtherMode] = useState(startsOther)
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // A stored free-text value arriving after mount (async profile load) should
  // still flip the control into Other mode rather than showing an empty picker.
  useEffect(() => {
    if (value && !isKnownIndustry(value)) setOtherMode(true)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return INDUSTRIES
    return INDUSTRIES.filter((i) => i.toLowerCase().includes(q))
  }, [query])

  const options = useMemo(() => [...filtered, OTHER], [filtered])

  const select = (option) => {
    if (option === OTHER) {
      setOtherMode(true)
      onChange('')
      setOpen(false)
      setQuery('')
      return
    }
    setOtherMode(false)
    onChange(option)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true); setActiveIndex(0); e.preventDefault(); return
    }
    if (!open) return
    if (e.key === 'ArrowDown') { setActiveIndex((i) => Math.min(i + 1, options.length - 1)); e.preventDefault() }
    else if (e.key === 'ArrowUp') { setActiveIndex((i) => Math.max(i - 1, 0)); e.preventDefault() }
    else if (e.key === 'Enter') { select(options[activeIndex]); e.preventDefault() }
    else if (e.key === 'Escape') { setOpen(false); e.preventDefault() }
  }

  const display = otherMode ? 'Other — not listed' : (value || '')

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        id={fieldId}
        onClick={() => { setOpen((v) => !v); setActiveIndex(0); setTimeout(() => inputRef.current?.focus(), 0) }}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        style={{
          width: '100%', height: '52px', padding: '0 16px', boxSizing: 'border-box',
          background: '#FFFFFF', border: '1px solid rgba(30,58,95,0.2)', borderRadius: '8px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
          color: display ? '#1E3A5F' : '#9CA3AF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {display || 'Search your industry…'}
        </span>
        <ChevronDown size={16} color="#6B7280" aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: '#FFFFFF', border: '1px solid rgba(30,58,95,0.2)', borderRadius: '8px',
            boxShadow: '0px 6px 20px rgba(30,58,95,0.14)', overflow: 'hidden',
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search your industry…"
            aria-label="Search industries"
            aria-autocomplete="list"
            aria-controls={listId}
            style={{
              width: '100%', height: '44px', padding: '0 16px', boxSizing: 'border-box',
              border: 'none', borderBottom: '1px solid rgba(30,58,95,0.12)', outline: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F',
            }}
          />
          {/* Eight rows at 42px each, then scroll — enough to browse without
              the menu swallowing the page on a phone. */}
          <ul
            id={listId}
            role="listbox"
            aria-label="Industries"
            style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: `${8 * 42}px`, overflowY: 'auto' }}
          >
            {filtered.length === 0 && (
              <li style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF' }}>
                No match — choose “Other — not listed” below.
              </li>
            )}
            {options.map((option, i) => {
              const isOther = option === OTHER
              const selected = isOther ? otherMode : value === option
              const active = i === activeIndex
              return (
                <li key={option} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => select(option)}
                    style={{
                      width: '100%', padding: '12px 16px', border: 'none', textAlign: 'left',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '8px',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
                      borderTop: isOther ? '1px solid rgba(30,58,95,0.12)' : 'none',
                      background: selected ? '#1E3A5F' : active ? '#F5F0E8' : '#FFFFFF',
                      color: selected ? '#F5F0E8' : isOther ? '#6B7280' : '#1E3A5F',
                    }}
                  >
                    {isOther ? 'Other — not listed' : option}
                    {selected && <Check size={14} aria-hidden="true" style={{ flexShrink: 0 }} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {otherMode && (
        <div style={{ marginTop: '8px' }}>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tell us your field"
            required={required}
            maxLength={120}
            aria-label="Your industry"
            style={{
              width: '100%', height: '52px', padding: '0 16px', boxSizing: 'border-box',
              background: '#FFFFFF', border: '1px solid rgba(30,58,95,0.2)', borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#1E3A5F',
            }}
          />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', marginTop: '5px' }}>
            We’ll match this to the closest field we have research for. If there’s no close match, your documents still get the full general treatment.
          </p>
        </div>
      )}
    </div>
  )
}
