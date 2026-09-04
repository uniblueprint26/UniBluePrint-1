import { useState, useEffect } from 'react'

// Gates the whole site behind an access code + countdown until launch.
// Anyone with the code gets in early (the team); everyone else sees a
// countdown and the site opens itself automatically once UNLOCK_AT passes,
// no code needed after that.
//
// This is a soft gate, not real security: it's all client-side, so it
// stops casual visitors and search engines finding the site before launch,
// not a determined person reading the bundle. Good enough for "don't let
// the public see it before 6pm", not a substitute for actual auth on
// anything sensitive.
//
// To change the unlock time or access code, edit the two constants below.
const UNLOCK_AT = new Date('2026-09-01T18:00:00+01:00') // 6:00 PM Irish time
const ACCESS_CODE = 'MTW7-7*!'
const STORAGE_KEY = 'ubp_launch_gate_passed'

function getRemaining() {
  return Math.max(0, UNLOCK_AT.getTime() - Date.now())
}

function formatRemaining(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return { h, m, s }
}

export default function LaunchGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => {
    if (getRemaining() === 0) return true
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [remaining, setRemaining] = useState(getRemaining)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (unlocked) return
    const id = setInterval(() => {
      const r = getRemaining()
      setRemaining(r)
      if (r === 0) {
        setUnlocked(true)
        clearInterval(id)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [unlocked])

  function handleSubmit(e) {
    e.preventDefault()
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  if (unlocked) return children

  const { h, m, s } = formatRemaining(remaining)
  const pad = n => String(n).padStart(2, '0')

  return (
    <div style={{
      minHeight: '100vh', background: '#1E3A5F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <p style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '32px', color: '#F5F0E8', margin: '0 0 8px',
        }}>
          UniBlueprint
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
          color: 'rgba(245,240,232,0.5)', textTransform: 'uppercase',
          letterSpacing: '0.1em', margin: '0 0 32px',
        }}>
          Launching soon
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '32px' }}>
          {[{ v: h, l: 'Hours' }, { v: m, l: 'Minutes' }, { v: s, l: 'Seconds' }].map(u => (
            <div key={u.l} style={{
              background: 'rgba(245,240,232,0.08)', border: '1px solid rgba(245,240,232,0.15)',
              borderRadius: '10px', padding: '14px 18px', minWidth: '70px',
            }}>
              <p style={{
                fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '30px',
                color: '#F5F0E8', margin: 0, fontVariantNumeric: 'tabular-nums',
              }}>
                {pad(u.v)}
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '10px',
                color: 'rgba(245,240,232,0.45)', margin: '4px 0 0',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {u.l}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
            color: 'rgba(245,240,232,0.55)', margin: '0 0 4px',
          }}>
            Have an early access code?
          </p>
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError(false) }}
            placeholder="Access code"
            style={{
              height: '46px', borderRadius: '8px',
              border: `1.5px solid ${error ? '#DC2626' : 'rgba(245,240,232,0.2)'}`,
              background: 'rgba(245,240,232,0.06)', color: '#F5F0E8',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
              textAlign: 'center', padding: '0 16px', outline: 'none',
            }}
          />
          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#F87171', margin: 0 }}>
              That code isn't right, try again.
            </p>
          )}
          <button
            type="submit"
            style={{
              height: '46px', borderRadius: '8px', border: 'none',
              background: '#F5F0E8', color: '#1E3A5F',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
