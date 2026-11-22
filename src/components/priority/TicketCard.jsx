import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { StatusPill } from './PriorityShell'
import { PC, FONT_SERIF, formatEventDate, formatTime } from '../../lib/priority'

// One ticket: event, when and where, the code, and a QR of the code for the
// door. The QR is black on white so it scans on any phone screen. A used or
// cancelled ticket shows no QR.

const STATUS = {
  valid: { text: 'Valid', tone: 'good' },
  used: { text: 'Used', tone: 'neutral' },
  void: { text: 'Cancelled', tone: 'bad' },
}

export default function TicketCard({ ticket }) {
  const event = ticket.event
  const status = STATUS[ticket.status] || STATUS.valid
  const showQr = ticket.status === 'valid'

  return (
    <article
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '28px', padding: '24px', borderRadius: '20px',
        background: PC.card, border: `1px solid ${PC.borderStrong}`,
      }}
    >
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <div style={{ marginBottom: '12px' }}><StatusPill tone={status.tone}>{status.text}</StatusPill></div>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: '26px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          {event ? <Link to={`/priority/${event.slug}`} style={{ color: PC.fg, textDecoration: 'none' }}>{event.title}</Link> : 'Priority event'}
        </h2>
        {event && (
          <p style={{ color: PC.muted, fontSize: '15px', lineHeight: 1.7, margin: '10px 0 0' }}>
            {formatEventDate(event.starts_at)}
            <br />
            {event.doors_at ? `Doors ${formatTime(event.doors_at)}` : `Starts ${formatTime(event.starts_at)}`}
            <br />
            {event.venue}, {event.city}
          </p>
        )}
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', color: PC.silver, margin: '20px 0 6px' }}>TICKET CODE</p>
        <p
          style={{ fontFamily: "'DM Mono', ui-monospace, Menlo, Consolas, monospace", fontSize: '20px', letterSpacing: '0.08em', margin: 0, wordBreak: 'break-all' }}
          aria-label={`Ticket code ${ticket.code}`}
        >
          {ticket.code}
        </p>
        {ticket.status === 'used' && ticket.used_at && (
          <p style={{ color: PC.muted, fontSize: '13px', margin: '10px 0 0' }}>Used {formatEventDate(ticket.used_at)} at {formatTime(ticket.used_at)}</p>
        )}
        {ticket.status === 'void' && (
          <p style={{ color: PC.muted, fontSize: '13px', margin: '10px 0 0' }}>This ticket can no longer be used, for example after a refund.</p>
        )}
      </div>

      {showQr && (
        <div style={{ flex: '0 0 auto', alignSelf: 'center' }}>
          <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', lineHeight: 0 }}>
            <QRCodeSVG value={ticket.code} size={168} level="M" bgColor="#FFFFFF" fgColor="#000000" marginSize={0} title={`QR code for ticket ${ticket.code}`} />
          </div>
        </div>
      )}
    </article>
  )
}
