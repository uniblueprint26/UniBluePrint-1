import { useState, useEffect, useRef } from 'react'
import { NAVY, CREAM, FONT_SERIF } from './theme'
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

  const quote = pool[index % pool.length] || ''

  return (
    <div
      style={{
        background: NAVY, borderRadius: '14px', padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px',
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <span aria-hidden="true" style={{ fontFamily: FONT_SERIF, fontSize: '34px', color: accentColor, lineHeight: 1, flexShrink: 0 }}>
        &ldquo;
      </span>
      <p
        key={index}
        role="status"
        aria-live="polite"
        style={{
          fontFamily: FONT_SERIF, fontSize: '15.5px', color: CREAM, lineHeight: 1.5, margin: 0,
          fontStyle: 'italic',
        }}
      >
        {quote}
      </p>
    </div>
  )
}
