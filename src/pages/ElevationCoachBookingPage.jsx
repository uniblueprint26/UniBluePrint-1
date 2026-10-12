import { useMemo, useState } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FormCard, FormTextarea, ErrorBanner, parseDbError } from '../components/ui/Form'

// ─── Elevation Blueprint — coach booking (website) ───────────────────────────
//
// This is the landing page the app's "Book a Coach" button sends iOS users
// to instead of its in-app CoachBookingScreen (app/src/screens/
// CoachBookingScreen.jsx) — Apple's 3.1.3(e) "goods and services outside
// the app" covers real-world coaching sessions, so a plain external link
// is fine here, unlike Foundation Blueprint's digital documents (3.1.1),
// which stay fully in-app-hidden on iOS instead. See the app's
// constants/site.js (coachBookingUrl) for the other side of this pairing,
// and CoachProfileScreen.jsx for where it's called.
//
// Deliberately mirrors CoachBookingScreen field-for-field — same
// candidate weekday slots generated client-side (no coach publishes a real
// calendar anywhere yet), same coach_bookings table and
// notify_on_coach_booking() trigger, same "this is a request, not a
// confirmed booking" framing — so a student sees the identical flow
// whichever platform sent them here.
//
// NOT a checkout/payment page: there is no platform-processed payment for
// an Elevation coaching session anywhere today, in the app or on the
// website. Every coach here sets and collects their own price directly
// (see ElevationBlueprintPage's coach cards and the app's coach contact
// links) — this page only sends the booking REQUEST, exactly like the app
// does. Routing actual money through Stripe for this would need the
// coach-payment model decided first (fixed pricing per coach? a platform
// fee? which coaches even take card payment?) — see the audit's D6 — so
// it isn't guessed at here.

const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM']
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildUpcomingDays(count = 10) {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 1; days.length < count && i < count + 10; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    days.push(d)
  }
  return days
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function SignInPrompt({ coachName }) {
  const location = useLocation()
  const fromState = { from: { pathname: location.pathname, search: location.search } }
  return (
    <FormCard
      title="Sign in to book a coach"
      subtitle={`Sign in or create a free account to send a booking request to ${coachName}.`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link
          to="/sign-in"
          state={fromState}
          style={{
            display: 'block', textAlign: 'center',
            background: '#1E3A5F', color: '#F5F0E8',
            borderRadius: '8px', padding: '14px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Sign in
        </Link>
        <Link
          to="/sign-up"
          style={{
            display: 'block', textAlign: 'center',
            background: '#FFFFFF', color: '#1E3A5F',
            border: '1.5px solid rgba(30,58,95,0.2)',
            borderRadius: '8px', padding: '14px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Create an account
        </Link>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
          New account? Come back to this page (or the coach's profile in the app) once you've verified your email.
        </p>
      </div>
    </FormCard>
  )
}

export default function ElevationCoachBookingPage() {
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const coachSlugParam = searchParams.get('coach') || ''
  const coachName = searchParams.get('name') || 'this coach'
  const coachCategory = searchParams.get('category') || ''

  const days = useMemo(() => buildUpcomingDays(10), [])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const ready = !!(selectedDay && selectedTime)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!ready || !user || sending) return
    setSending(true)
    setError(null)
    const { error: dbError } = await supabase.from('coach_bookings').insert({
      user_id: user.id,
      // Falls back to a synthetic slug rather than failing outright if this
      // page is ever opened without a coach param — still lands somewhere
      // Operations can see and follow up on, just without a resolved coach.
      coach_slug: coachSlugParam || `coach-unspecified-${Date.now()}`,
      coach_name: coachName,
      slot_date: isoDate(selectedDay),
      slot_label: selectedTime,
      message: message.trim() || null,
    })
    setSending(false)
    if (dbError) {
      console.error('[ElevationCoachBookingPage] coach_bookings insert failed', dbError)
      setError(parseDbError(dbError))
      return
    }
    setSent(true)
  }

  return (
    <>
      <Helmet>
        <title>Book {coachName} | UniBlueprint</title>
        <meta name="description" content={`Request a coaching session with ${coachName} through UniBlueprint's Elevation Blueprint.`} />
      </Helmet>

      <section style={{ background: '#FFFFFF', padding: '64px 24px 40px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
          color: '#C9A24B', letterSpacing: '1px', textTransform: 'uppercase', margin: 0,
        }}>
          Elevation Blueprint
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#1E3A5F', marginTop: '10px' }}>
          Book {coachName}
        </h1>
        {coachCategory && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '6px' }}>
            {coachCategory}
          </p>
        )}
      </section>

      <section style={{ background: '#F5F0E8', padding: '40px 24px 80px' }}>
        {authLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: "'DM Sans', sans-serif", color: '#6B7280' }}>
            Loading…
          </div>
        ) : !user ? (
          <SignInPrompt coachName={coachName} />
        ) : sent ? (
          <FormCard>
            <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle2 size={48} color="#C9A24B" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#1E3A5F' }}>
                Booking request sent
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280', marginTop: '10px', lineHeight: 1.6 }}>
                You've requested {selectedTime} on {selectedDay?.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })} with {coachName}.
                They'll confirm directly, and you'll see their reply in the app's Notifications either way.
              </p>
              <Link
                to="/elevation-blueprint"
                style={{
                  display: 'inline-block', marginTop: '24px',
                  background: '#1E3A5F', color: '#F5F0E8', borderRadius: '8px',
                  padding: '14px 28px', fontFamily: "'DM Sans', sans-serif", fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                Back to Elevation Blueprint
              </Link>
            </div>
          </FormCard>
        ) : (
          <FormCard
            title="Request a session"
            subtitle="Pick a date and preferred time. This sends a request, it isn't confirmed until the coach accepts — pricing and payment are arranged directly with them."
          >
            {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Step 1 — date */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  <CalendarDays size={15} color="#1E3A5F" />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    1. Pick a date
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {days.map(d => {
                    const active = selectedDay && isoDate(selectedDay) === isoDate(d)
                    return (
                      <button
                        type="button"
                        key={isoDate(d)}
                        onClick={() => { setSelectedDay(d); setSelectedTime(null) }}
                        style={{
                          flexShrink: 0, width: '58px', padding: '10px 0', textAlign: 'center',
                          background: active ? '#1E3A5F' : '#FFFFFF',
                          border: active ? '1.5px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.12)',
                          borderRadius: '10px', cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 500, color: active ? '#F5F0E8' : '#6B7280', textTransform: 'uppercase' }}>
                          {WEEKDAY_LABELS[d.getDay()]}
                        </div>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '19px', color: active ? '#F5F0E8' : '#1E3A5F', margin: '2px 0' }}>
                          {d.getDate()}
                        </div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: active ? '#F5F0E8' : '#6B7280' }}>
                          {MONTH_LABELS[d.getMonth()]}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2 — time */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  <Clock size={15} color="#1E3A5F" />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F' }}>
                    2. Pick a preferred time
                  </span>
                </div>
                {!selectedDay ? (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
                    Choose a date above to pick a preferred time.
                  </p>
                ) : (
                  <>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic', marginTop: 0 }}>
                      Preferred times — {coachName} will confirm what actually works.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TIME_SLOTS.map(t => {
                        const active = selectedTime === t
                        return (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            style={{
                              padding: '10px 16px', borderRadius: '999px',
                              background: active ? '#1E3A5F' : '#FFFFFF',
                              border: active ? '1.5px solid #1E3A5F' : '1.5px solid rgba(30,58,95,0.12)',
                              color: active ? '#F5F0E8' : '#1E3A5F',
                              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Step 3 — note */}
              <div>
                <label htmlFor="booking-note" style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: '#1E3A5F', marginBottom: '8px' }}>
                  3. Add a note (optional)
                </label>
                <FormTextarea
                  id="booking-note"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="e.g. What you'd like to focus on this session..."
                  rows={4}
                />
              </div>

              {ready && (
                <div style={{ background: 'rgba(201,162,75,0.10)', border: '1px solid rgba(201,162,75,0.35)', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#1E3A5F', margin: 0, lineHeight: 1.5 }}>
                    Requesting <strong>{selectedTime}</strong> on{' '}
                    <strong>{selectedDay.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>{' '}with {coachName}.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!ready || sending}
                style={{
                  width: '100%', height: '52px',
                  background: (!ready || sending) ? 'rgba(30,58,95,0.4)' : '#1E3A5F',
                  color: '#F5F0E8', borderRadius: '8px', border: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                  cursor: (!ready || sending) ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? 'Sending…' : 'Send Booking Request'}
              </button>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
                This sends a request, it isn't confirmed until {coachName} accepts.
              </p>
            </form>
          </FormCard>
        )}
      </section>
    </>
  )
}
