import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import PriorityShell from '../../components/priority/PriorityShell'
import { PC, FONT_SERIF, FONT_SANS, primaryButton, ghostButton } from '../../lib/priority'

// Stripe sends people here after paying. Tickets are created by our payment
// webhook a moment after Stripe confirms, so this page waits for them to
// appear (up to about a minute) and then points to My tickets. It never
// creates anything itself.

const POLL_MS = 3000
const MAX_POLLS = 20

export default function PrioritySuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { user, loading: authLoading } = useAuth()
  const [ready, setReady] = useState(false)
  const [count, setCount] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const polls = useRef(0)

  useEffect(() => {
    if (authLoading || !user || !sessionId) return
    let active = true
    let timer

    async function check() {
      polls.current += 1
      try {
        const { data: order } = await supabase
          .from('priority_orders')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle()
        if (order) {
          const { count: n } = await supabase
            .from('priority_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('order_id', order.id)
          if (!active) return
          if (n && n > 0) { setCount(n); setReady(true); return }
        }
      } catch (err) {
        console.warn('[PrioritySuccessPage] ticket check failed', err)
      }
      if (!active) return
      if (polls.current >= MAX_POLLS) { setTimedOut(true); return }
      timer = setTimeout(check, POLL_MS)
    }
    check()
    return () => { active = false; clearTimeout(timer) }
  }, [authLoading, user, sessionId])

  let message
  if (!user && !authLoading) {
    message = 'Sign in to see your tickets. They are saved to the account you bought with.'
  } else if (ready) {
    message = `Your ${count === 1 ? 'ticket is' : 'tickets are'} ready. Find ${count === 1 ? 'it' : 'them'} in My tickets.`
  } else if (timedOut) {
    message = 'Your payment went through. Your tickets can take a few minutes to appear. Check My tickets shortly.'
  } else {
    message = 'Thanks. We are getting your tickets ready.'
  }

  return (
    <>
      <Helmet>
        <title>Payment received | Priority</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <PriorityShell showTicketsLink={false} maxWidth={640}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircle size={56} color={PC.success} aria-hidden="true" style={{ margin: '0 auto 24px', display: 'block' }} />
          <h1 style={{ fontFamily: FONT_SERIF, fontWeight: 900, fontSize: 'clamp(32px, 6vw, 44px)', margin: 0 }}>Payment received</h1>
          <p role="status" aria-live="polite" style={{ fontFamily: FONT_SANS, fontSize: '17px', lineHeight: 1.7, color: PC.muted, margin: '16px auto 36px', maxWidth: '460px' }}>
            {message}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
            {user || authLoading ? (
              <Link to="/priority/tickets" style={primaryButton}>Go to My tickets</Link>
            ) : (
              <Link to="/sign-in" state={{ from: { pathname: '/priority/tickets', search: '' } }} style={primaryButton}>Sign in</Link>
            )}
            <Link to="/priority" style={ghostButton}>See more events</Link>
          </div>
          <p style={{ fontSize: '13px', color: PC.faint, margin: '32px 0 0' }}>
            Something wrong with your order? <Link to="/contact" style={{ color: PC.silver }}>Contact us</Link>.
          </p>
        </div>
      </PriorityShell>
    </>
  )
}
