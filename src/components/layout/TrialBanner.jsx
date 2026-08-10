import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'ubp_trial_banner_dismissed'
const EXPIRY = new Date('2026-10-01T00:00:00') // after 30 Sept 2026

export default function TrialBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (new Date() >= EXPIRY) return
    if (localStorage.getItem(STORAGE_KEY)) return
    setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      style={{
        background: '#1E3A5F',
        paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        paddingBottom: '12px',
        paddingLeft: '56px',
        paddingRight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        color: '#F5F0E8',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        50% OFF all services, September Trial. Your Blueprint. Half the price.
      </p>

      <button
        onClick={dismiss}
        aria-label="Dismiss trial banner"
        style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#F5F0E8',
          padding: 0,
        }}
      >
        <X size={18} />
      </button>
    </div>
  )
}
