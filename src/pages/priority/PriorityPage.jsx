import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Calendar, MapPin } from 'lucide-react'
import PriorityShell, { StatusPill, Notice } from '../../components/priority/PriorityShell'
import {
  PC, CHROME_TEXT, FONT_SERIF, FONT_SANS,
  fetchPublicEvents, formatEventDate, formatTime, formatPrice, genreLabel,
} from '../../lib/priority'
import { PRIORITY_ANNOUNCED } from '../../data/priorityTerms'

function EventCard({ event }) {
  const prices = (event.tiers || []).map(t => t.price_cents)
  const from = prices.length ? Math.min(...prices) : null
  const soldOut = event.status === 'sold_out'

  return (
    <Link
      to={`/priority/${event.slug}`}
      style={{
        display: 'flex', flexDirection: 'column', textDecoration: 'none', color: PC.fg,
        background: PC.card, border: `1px solid ${PC.border}`, borderRadius: '18px', overflow: 'hidden',
      }}
    >
      <div style={{
        height: '150px', position: 'relative',
        background: event.image_url
          ? `center / cover no-repeat url("${event.image_url}")`
          : 'linear-gradient(135deg, #2a2a2a 0%, #121212 55%, #3a3a38 100%)',
      }}>
        <div style={{ position: 'absolute', left: '16px', top: '16px' }}>
          <StatusPill>{genreLabel(event.genre)}</StatusPill>
        </div>
        {soldOut && (
          <div style={{ position: 'absolute', right: '16px', top: '16px' }}>
            <StatusPill tone="bad">Sold out</StatusPill>
          </div>
        )}
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: '24px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{event.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: PC.muted }}>
          <Calendar size={15} aria-hidden="true" />
          <span>{formatEventDate(event.starts_at)}{event.doors_at ? `, doors ${formatTime(event.doors_at)}` : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: PC.muted }}>
          <MapPin size={15} aria-hidden="true" />
          <span>{event.venue}, {event.city}</span>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            {from != null && !soldOut ? `From ${formatPrice(from)}` : ' '}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: PC.silver }}>
            {soldOut ? 'View event' : 'Get tickets'}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function PriorityPage() {
  const [events, setEvents] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    fetchPublicEvents()
      .then(rows => { if (active) setEvents(rows) })
      .catch(err => {
        console.error('[PriorityPage] could not load events', err)
        if (active) setFailed(true)
      })
    return () => { active = false }
  }, [])

  return (
    <>
      <Helmet>
        <title>Priority Events | UniBlueprint</title>
        <meta name="description" content="Priority nights out across Ireland. Buy tickets on UniBlueprint." />
        <meta property="og:title" content="Priority Events | UniBlueprint" />
        <meta property="og:description" content="Priority nights out across Ireland. Buy tickets on UniBlueprint." />
      </Helmet>

      <PriorityShell>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', color: PC.silver, margin: 0 }}>UNIBLUEPRINT PRESENTS</p>
        <h1 style={{ ...CHROME_TEXT, fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 'clamp(44px, 8vw, 72px)', lineHeight: 1.05, margin: '10px 0 0' }}>
          Priority
        </h1>
        <p style={{ fontFamily: FONT_SANS, fontSize: '17px', lineHeight: 1.6, color: PC.muted, maxWidth: '560px', margin: '16px 0 0' }}>
          Nights out across Ireland. All events are 18+. No booking fee.
        </p>

        <div style={{ marginTop: '48px' }}>
          {failed ? (
            <Notice tone="bad" role="alert">We could not load events. Please refresh and try again.</Notice>
          ) : events === null ? (
            <p style={{ color: PC.muted }}>Loading events…</p>
          ) : events.length === 0 ? (
            <div style={{ padding: '48px 24px', borderRadius: '18px', border: `1px solid ${PC.border}`, background: PC.surface, textAlign: 'center' }}>
              <p style={{ fontFamily: FONT_SERIF, fontSize: '22px', margin: 0 }}>No Priority events on sale right now.</p>
              <p style={{ color: PC.muted, fontSize: '15px', margin: '10px 0 0' }}>New nights appear here first.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {events.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>

        <div style={{ marginTop: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', color: PC.silver, margin: 0 }}>ANNOUNCED</p>
          <p style={{ color: PC.muted, fontSize: '15px', lineHeight: 1.6, margin: '8px 0 0', maxWidth: '520px' }}>
            Dates and venues are still to be confirmed. Tickets are not on sale yet.
          </p>
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginTop: '20px' }}>
            {PRIORITY_ANNOUNCED.map(a => (
              <div key={a.id} style={{ padding: '20px', borderRadius: '18px', border: `1px solid ${PC.border}`, background: PC.card }}>
                <h2 style={{ fontFamily: FONT_SERIF, fontSize: '22px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{a.title}</h2>
                <p style={{ color: PC.muted, fontSize: '14px', margin: '10px 0 0' }}>{a.where}</p>
                <p style={{ color: PC.muted, fontSize: '14px', margin: '4px 0 0' }}>Date ??  Venue ??</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '14px', color: PC.faint, margin: '40px 0 0' }}>
          <Link to="/priority/terms" style={{ color: PC.silver }}>Terms of sale for Priority tickets</Link>
        </p>
      </PriorityShell>
    </>
  )
}
