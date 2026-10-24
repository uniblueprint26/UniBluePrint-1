import { useState, useEffect, useRef } from 'react'
import { NAVY, BORDER, FONT_SERIF } from './theme'
import { getQuotePool } from './quotes'

/**
 * Rotates through a hub's quote pool automatically, every 4-6 seconds (a
 * small random jitter inside that window so a page with several
 * QuoteBanners -- unlikely, but possible during development -- doesn't
 * visibly tick in lockstep). One quote in the pool still "rotates" (shows
 * once, no-op interval) so the mechanism is visibly correct either way.
 *
 * `hubKey` selects the pool from quotes.js (e.g. 'finance'). Pass `quotes`
 * directly instead to override the pool for one banner without touching
 * quotes.js (used by Storybook-less manual testing).
 */
export default function QuoteBanner({ hubKey, quotes, accentColor = NAVY }) {
  const pool = quotes && quotes.length ? quotes : getQuotePool(hubKey)
  const [index, setIndex] = useState(0)
  const timeoutRef = useRef(null)

  useEffect(() => {
    setIndex(0)
  }, [hubKey])

  useEffect(() => {
    if (pool.length <= 1) return undefined
    function scheduleNext() {
      const delay = 4000 + Math.random() * 2000 // 4-6s
      timeoutRef.current = setTimeout(() => {
        setIndex(i => (i + 1) % pool.length)
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => clearTimeout(timeoutRef.current)
  }, [pool.length])

  const active = index % pool.length

  // Studio Phase 10: a quiet aside rather than a dominant dark banner --
  // light surface, hairline border, the hub accent carried only by the
  // opening quote mark. Every quote in the pool is laid out in the same
  // grid cell (only the active one visible), so the banner is always as tall
  // as its longest line and the page below never jumps when it rotates.
  return (
    <figure
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', margin: '0 0 var(--studio-gap, 24px)',
        background: 'rgba(255,255,255,0.6)', border: `1px solid ${BORDER}`, borderRadius: '12px',
        padding: '14px 20px',
      }}
    >
      <span aria-hidden="true" style={{ fontFamily: FONT_SERIF, fontSize: '34px', color: accentColor, lineHeight: 0.8, flexShrink: 0, marginTop: '4px' }}>
        &ldquo;
      </span>
      <div style={{ display: 'grid', flex: 1, minWidth: 0 }}>
        {pool.map((q, i) => (
          <blockquote
            key={i === active ? `active-${index}` : i}
            className={i === active ? 'studio-fade-in' : undefined}
            role={i === active ? 'status' : undefined}
            aria-live={i === active ? 'polite' : undefined}
            aria-hidden={i === active ? undefined : 'true'}
            style={{
              gridArea: '1 / 1', margin: 0, alignSelf: 'center',
              fontFamily: FONT_SERIF, fontSize: '15px', color: NAVY, lineHeight: 1.55, fontStyle: 'italic',
              visibility: i === active ? 'visible' : 'hidden',
            }}
          >
            {q}
          </blockquote>
        ))}
      </div>
    </figure>
  )
}
