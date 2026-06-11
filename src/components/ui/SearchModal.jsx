import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, FileText, BookOpen, HelpCircle } from 'lucide-react'
import { SEARCH_DATA } from '../../data/searchData'

const TYPE_LABELS = { page: 'Pages', service: 'Services', faq: 'FAQs' }
const TYPE_ICONS  = { page: FileText, service: BookOpen, faq: HelpCircle }
const TYPE_ORDER  = ['service', 'page', 'faq']

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []
    return SEARCH_DATA.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    )
  }, [query])

  const grouped = useMemo(() => {
    const g = {}
    for (const item of results) {
      if (!g[item.type]) g[item.type] = []
      g[item.type].push(item)
    }
    return g
  }, [results])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(245,240,232,0.95)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '72px 24px 40px',
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close search"
        style={{
          position: 'fixed',
          top: '16px',
          right: '20px',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1E3A5F',
        }}
      >
        <X size={28} aria-hidden="true" />
      </button>

      {/* Search input */}
      <div style={{ width: '100%', maxWidth: '640px', position: 'relative' }}>
        <Search
          size={20}
          color="#9CA3AF"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search pages, services, FAQs…"
          aria-label="Search Uniblueprint"
          style={{
            width: '100%',
            height: '56px',
            border: '2px solid #1E3A5F',
            borderRadius: '12px',
            paddingLeft: '48px',
            paddingRight: '16px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px',
            color: '#1E3A5F',
            background: '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Results */}
      <div style={{ width: '100%', maxWidth: '640px', marginTop: '24px' }}>
        {query && results.length === 0 && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#6B7280',
            textAlign: 'center',
            marginTop: '8px',
          }}>
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        {query && results.length > 0 && TYPE_ORDER.map(type => {
          const items = grouped[type]
          if (!items) return null
          const Icon = TYPE_ICONS[type]
          return (
            <div key={type} style={{ marginBottom: '28px' }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: '600',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Icon size={12} aria-hidden="true" />
                {TYPE_LABELS[type]}
              </p>
              {items.map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    marginBottom: '6px',
                    textDecoration: 'none',
                    transition: 'box-shadow 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0px 2px 12px rgba(30,58,95,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <p style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '15px',
                    color: '#1E3A5F',
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    color: '#6B7280',
                    marginTop: '2px',
                  }}>
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          )
        })}

        {!query && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#9CA3AF',
            textAlign: 'center',
          }}>
            Start typing to search pages, services, and FAQs.
          </p>
        )}
      </div>
    </div>
  )
}
