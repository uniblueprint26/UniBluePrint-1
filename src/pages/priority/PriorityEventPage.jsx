import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Calendar, Clock, MapPin, Users, Minus, Plus, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import PriorityShell, { StatusPill, Notice } from '../../components/priority/PriorityShell'
import {
  PC, FONT_SERIF, FONT_SANS, MAX_QUANTITY, primaryButton, ghostButton,
  fetchEventBySlug, fetchRemaining, startPriorityCheckout,
  formatEventDate, formatTime, formatPrice, genreLabel, tierState,
} from '../../lib/priority'
import { PRIORITY_TERMS_SHORT, PRIORITY_CANCELLED_TITLE, PRIORITY_CANCELLED_TEXT } from '../../data/priorityTerms'

const label = { fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', color: PC.silver, margin: '0 0 12px' }

function tierNote(state, tier, remaining) {
  if (state === 'sold_out') return 'Sold out'
  if (state === 'upcoming') return `On sale ${formatEventDate(tier.sale_starts_at)}`
  if (state === 'closed') return 'This release has closed'
  if (remaining != null && remaining > 0 && remaining <= 10) return `${remaining} left`
  return ''
}

function MetaRow({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '16px', lineHeight: 1.5 }}>
      <Icon size={18} color={PC.silver} style={{ marginTop: '3px', flexShrink: 0 }} aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

export default function PriorityEventPage() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [event, setEvent] = useState(undefined) // undefined loading, null not found
  const [remaining, setRemaining] = useState({})
  const [loadFailed, setLoadFailed] = useState(false)
  const [tierId, setTierId] = useState(searchParams.get('tier') || null)
  const [quantity, setQuantity] = useState(() => {
    const q = parseInt(searchParams.get('qty') || '1', 10)
    return Number.isInteger(q) ? Math.min(Math.max(q, 1), MAX_QUANTITY) : 1
  })
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setEvent(undefined)
    setLoadFailed(false)
    fetchEventBySlug(slug)
      .then(async row => {
        if (!active) return
        setEvent(row)
        if (row) {
          const left = await fetchRemaining(row.tiers)
          if (active) setRemaining(left)
        }
      })
      .catch(err => {
        console.error('[PriorityEventPage] could not load event', err)
        if (active) { setLoadFailed(true); setEvent(null) }
      })
    return () => { active = false }
  }, [slug])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [event])
  const tiers = useMemo(() => event?.tiers || [], [event])
  const states = useMemo(() => {
    const out = {}
    if (event) for (const t of tiers) out[t.id] = tierState(t, event, remaining[t.id], now)
    return out
  }, [event, tiers, remaining, now])

  // Preselect: the tier from the link if it can be bought, else the first one that can.
  useEffect(() => {
    if (!event) return
    const buyable = tiers.filter(t => states[t.id] === 'on_sale')
    if (!buyable.length) { setTierId(null); return }
    if (!buyable.some(t => t.id === tierId)) setTierId(buyable[0].id)
  }, [event, tiers, states]) // eslint-disable-line react-hooks/exhaustive-deps

  const tier = tiers.find(t => t.id === tierId) || null
  const maxForTier = tier ? Math.min(MAX_QUANTITY, remaining[tier.id] ?? MAX_QUANTITY) : MAX_QUANTITY
  const qty = Math.min(Math.max(quantity, 1), Math.max(maxForTier, 1))
  const total = tier ? tier.price_cents * qty : 0
  const ageMin = Math.max(event?.age_min || 18, 18)
  const cancelled = event?.status === 'cancelled'
  const ended = event?.status === 'ended' || (event && new Date(event.starts_at) <= now)
  const canBuy = !!event && event.status === 'on_sale' && !cancelled && !ended && !!tier

  async function handleBuy() {
    setError('')
    if (!user) {
      // Come back to this page with the choice kept, then press Buy again.
      const search = `?tier=${encodeURIComponent(tierId)}&qty=${qty}`
      navigate('/sign-in', { state: { from: { pathname: location.pathname, search } } })
      return
    }
    setBuying(true)
    try {
      const url = await startPriorityCheckout(tier.id, qty)
      window.location.assign(url)
    } catch (err) {
      const msg = err?.message || ''
      setError(msg.includes('generator') || !msg ? 'We could not reach the ticket service. Please check your connection and try again.' : msg)
      setBuying(false)
    }
  }

  if (event === undefined) {
    return (
      <PriorityShell>
        <p style={{ color: PC.muted }}>Loading event…</p>
      </PriorityShell>
    )
  }

  if (event === null) {
    return (
      <PriorityShell>
        <Helmet><title>Event not found | Priority</title><meta name="robots" content="noindex" /></Helmet>
        <Notice tone={loadFailed ? 'bad' : 'neutral'} role={loadFailed ? 'alert' : undefined}>
          {loadFailed ? 'We could not load this event. Please refresh and try again.' : 'We could not find that event.'}
        </Notice>
        <p style={{ marginTop: '24px' }}><Link to="/priority" style={{ color: PC.silver }}>See all Priority events</Link></p>
      </PriorityShell>
    )
  }

  return (
    <>
      <Helmet>
        <title>{event.title} | Priority</title>
        <meta name="description" content={`${event.title} at ${event.venue}, ${event.city}. ${formatEventDate(event.starts_at)}. ${ageMin}+. Tickets on UniBlueprint.`} />
        <meta property="og:title" content={`${event.title} | Priority`} />
        {event.image_url && <meta property="og:image" content={event.image_url} />}
      </Helmet>

      <PriorityShell>
        <Link to="/priority" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: PC.muted, textDecoration: 'none', fontSize: '14px', marginBottom: '28px' }}>
          <ArrowLeft size={16} aria-hidden="true" /> All events
        </Link>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'flex-start' }}>
          {/* Details */}
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <StatusPill>{genreLabel(event.genre)}</StatusPill>
              <StatusPill>{ageMin}+ only</StatusPill>
              {event.status === 'sold_out' && <StatusPill tone="bad">Sold out</StatusPill>}
              {cancelled && <StatusPill tone="bad">Cancelled</StatusPill>}
              {ended && !cancelled && <StatusPill tone="bad">Ended</StatusPill>}
            </div>
            <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 'clamp(34px, 6vw, 52px)', lineHeight: 1.1, margin: 0 }}>
              {event.title}
            </h1>

            {event.image_url && (
              <img
                src={event.image_url}
                alt=""
                style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '16px', marginTop: '28px', border: `1px solid ${PC.border}` }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px', padding: '24px', borderRadius: '16px', background: PC.card, border: `1px solid ${PC.border}` }}>
              <MetaRow icon={Calendar}>{formatEventDate(event.starts_at)}</MetaRow>
              <MetaRow icon={Clock}>
                {event.doors_at ? `Doors ${formatTime(event.doors_at)}` : `Starts ${formatTime(event.starts_at)}`}
              </MetaRow>
              <MetaRow icon={MapPin}>
                {event.venue}{event.address ? `, ${event.address}` : ''}, {event.city}
              </MetaRow>
              {!!event.lineup?.length && <MetaRow icon={Users}>{event.lineup.join(', ')}</MetaRow>}
            </div>

            {event.blurb && (
              <p style={{ fontSize: '17px', lineHeight: 1.75, color: PC.muted, margin: '32px 0 0', whiteSpace: 'pre-line' }}>{event.blurb}</p>
            )}
          </div>

          {/* Buy panel */}
          <aside style={{ flex: '1 1 340px', minWidth: 0, maxWidth: '460px', padding: '28px', borderRadius: '20px', background: PC.surface, border: `1px solid ${PC.borderStrong}` }}>
            {cancelled ? (
              <Notice tone="bad">
                <strong style={{ display: 'block', marginBottom: '6px' }}>{PRIORITY_CANCELLED_TITLE}</strong>
                {PRIORITY_CANCELLED_TEXT}
              </Notice>
            ) : ended ? (
              <Notice>This event has ended.</Notice>
            ) : event.status === 'sold_out' ? (
              <Notice>This event is sold out.</Notice>
            ) : tiers.length === 0 ? (
              <Notice>Tickets for this event are not available yet.</Notice>
            ) : (
              <>
                <p style={label}>TICKETS</p>
                <div role="radiogroup" aria-label="Ticket type" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tiers.map(t => {
                    const state = states[t.id]
                    const disabled = state !== 'on_sale'
                    const active = t.id === tierId
                    const note = tierNote(state, t, remaining[t.id])
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={disabled}
                        onClick={() => setTierId(t.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                          textAlign: 'left', width: '100%', padding: '16px 18px', borderRadius: '14px',
                          background: active ? PC.cardAlt : PC.card, color: PC.fg, fontFamily: FONT_SANS,
                          border: `1.5px solid ${active ? PC.silver : PC.border}`,
                          opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span>
                          <span style={{ display: 'block', fontSize: '16px', fontWeight: 600 }}>{t.label}</span>
                          {note && <span style={{ display: 'block', fontSize: '13px', color: state === 'sold_out' ? PC.danger : PC.muted, marginTop: '3px' }}>{note}</span>}
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 700 }}>{formatPrice(t.price_cents)}</span>
                      </button>
                    )
                  })}
                </div>

                {tier && (
                  <>
                    <p style={{ ...label, marginTop: '28px' }}>QUANTITY</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button
                        type="button" aria-label="Fewer tickets"
                        onClick={() => setQuantity(Math.max(1, qty - 1))}
                        disabled={qty <= 1}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', background: PC.card, color: PC.fg, border: `1px solid ${PC.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty <= 1 ? 0.5 : 1 }}
                      >
                        <Minus size={18} aria-hidden="true" />
                      </button>
                      <span style={{ fontSize: '22px', fontWeight: 700, minWidth: '28px', textAlign: 'center' }} aria-live="polite">{qty}</span>
                      <button
                        type="button" aria-label="More tickets"
                        onClick={() => setQuantity(Math.min(maxForTier, qty + 1))}
                        disabled={qty >= maxForTier}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', background: PC.card, color: PC.fg, border: `1px solid ${PC.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty >= maxForTier ? 0.5 : 1 }}
                      >
                        <Plus size={18} aria-hidden="true" />
                      </button>
                      <span style={{ fontSize: '13px', color: PC.faint }}>Up to {MAX_QUANTITY} per order</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '28px', paddingTop: '20px', borderTop: `1px solid ${PC.border}` }}>
                      <span style={{ color: PC.muted, fontSize: '15px' }}>Total</span>
                      <span style={{ fontFamily: FONT_SERIF, fontSize: '30px', fontWeight: 700 }}>{formatPrice(total)}</span>
                    </div>
                  </>
                )}

                <div style={{ marginTop: '24px' }}>
                  <Notice>
                    <strong>{ageMin}+ only.</strong> You must be {ageMin} or over to buy. We check the date of birth on your UniBlueprint account.
                  </Notice>
                </div>

                <div style={{ marginTop: '16px', padding: '16px 18px', borderRadius: '14px', border: `1px solid ${PC.border}`, background: PC.card }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', color: PC.silver, margin: 0 }}>BEFORE YOU PAY</p>
                  <ul style={{ margin: '10px 0 0', paddingLeft: '18px', color: PC.muted, fontSize: '14px', lineHeight: 1.7 }}>
                    {PRIORITY_TERMS_SHORT.map(line => <li key={line}>{line}</li>)}
                  </ul>
                </div>

                {error && <div style={{ marginTop: '16px' }}><Notice tone="bad" role="alert">{error}</Notice></div>}

                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={!canBuy || buying || authLoading}
                  style={{ ...primaryButton, marginTop: '20px', opacity: !canBuy || buying || authLoading ? 0.6 : 1, cursor: !canBuy || buying ? 'not-allowed' : 'pointer' }}
                >
                  {buying ? 'Taking you to payment…' : !user && !authLoading ? 'Sign in to buy tickets' : 'Buy tickets'}
                </button>

                <p style={{ fontSize: '13px', lineHeight: 1.6, color: PC.faint, margin: '16px 0 0', textAlign: 'center' }}>
                  You pay securely with Stripe. By buying you agree to the{' '}
                  <Link to="/priority/terms" style={{ color: PC.silver }}>Terms of sale for Priority tickets</Link>{' '}
                  and our <Link to="/terms" style={{ color: PC.silver }}>Terms of Service</Link>.
                </p>
              </>
            )}
          </aside>
        </div>

        {user && (
          <p style={{ marginTop: '48px', fontSize: '14px', color: PC.muted }}>
            Already bought? <Link to="/priority/tickets" style={{ ...ghostButton, padding: '8px 14px', fontSize: '14px', marginLeft: '8px' }}>See my tickets</Link>
          </p>
        )}
      </PriorityShell>
    </>
  )
}
