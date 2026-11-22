import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PriorityShell, { Notice } from '../../components/priority/PriorityShell'
import TicketCard from '../../components/priority/TicketCard'
import { PC, FONT_SERIF, FONT_SANS, ghostButton, fetchMyTickets } from '../../lib/priority'

// The signed in person's own tickets. Row level security in the database means
// this can only ever return tickets they own. Route is wrapped in ProtectedRoute.

export default function PriorityTicketsPage() {
  const [tickets, setTickets] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    fetchMyTickets()
      .then(rows => { if (active) setTickets(rows) })
      .catch(err => {
        console.error('[PriorityTicketsPage] could not load tickets', err)
        if (active) setFailed(true)
      })
    return () => { active = false }
  }, [])

  const now = new Date()
  const isUpcoming = t => !t.event || new Date(t.event.starts_at).getTime() + 12 * 3600 * 1000 > now.getTime()
  const upcoming = (tickets || []).filter(isUpcoming).sort((a, b) => new Date(a.event?.starts_at || 0) - new Date(b.event?.starts_at || 0))
  const past = (tickets || []).filter(t => !isUpcoming(t))

  return (
    <>
      <Helmet>
        <title>My Tickets | Priority</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <PriorityShell showTicketsLink={false}>
        <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 'clamp(34px, 6vw, 48px)', margin: 0 }}>My tickets</h1>
        <p style={{ fontFamily: FONT_SANS, fontSize: '16px', lineHeight: 1.6, color: PC.muted, margin: '12px 0 40px', maxWidth: '560px' }}>
          Show the QR code at the door. Keep your code private. Anyone with it can use your ticket.
        </p>

        {failed ? (
          <Notice tone="bad" role="alert">We could not load your tickets. Please refresh and try again.</Notice>
        ) : tickets === null ? (
          <p style={{ color: PC.muted }}>Loading your tickets…</p>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '48px 24px', borderRadius: '18px', border: `1px solid ${PC.border}`, background: PC.surface, textAlign: 'center' }}>
            <p style={{ fontFamily: FONT_SERIF, fontSize: '22px', margin: 0 }}>You have no tickets yet.</p>
            <p style={{ color: PC.muted, fontSize: '15px', margin: '10px 0 24px' }}>When you buy tickets they show up here.</p>
            <Link to="/priority" style={ghostButton}>See Priority events</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {upcoming.length > 0 && (
              <section aria-label="Upcoming tickets" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {upcoming.map(t => <TicketCard key={t.id} ticket={t} />)}
              </section>
            )}
            {past.length > 0 && (
              <section aria-label="Past tickets" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontFamily: FONT_SERIF, fontSize: '22px', margin: 0, color: PC.muted }}>Past events</h2>
                {past.map(t => <TicketCard key={t.id} ticket={t} />)}
              </section>
            )}
          </div>
        )}
      </PriorityShell>
    </>
  )
}
