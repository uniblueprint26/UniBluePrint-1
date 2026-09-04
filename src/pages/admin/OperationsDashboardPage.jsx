import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  ListChecks, Clock, CheckCircle2, Timer, Truck, AlertTriangle,
  AlertCircle, ShieldAlert, Star, Ghost,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Real data, sourced from the Supabase functions added in
// supabase/migrations/20260828170000_dashboard_ratings_and_finance_role.sql
// and 20260829120000_ops_dashboard_range_views.sql. Every number on this page
// is either live-now (queue, urgency, roster, Sunday Queue) or scoped to the
// range toggle (demand and tier mix) -- nothing here is placeholder data, so
// a quiet platform correctly shows small or zero numbers rather than a demo
// that always looks busy.

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
]

const NAVY = '#1E3A5F'
const CREAM = '#F5F0E8'
const SAND = '#EDE8DF'
const GREY = '#6B7280'
const MUTED = '#9CA3AF'
const GREEN = '#16A34A'
const AMBER = '#F59E0B'
const RED = '#DC2626'

const PAGE_STYLES = `
  .od-queue-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
  .od-urgency-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .od-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: stretch; }
  .od-table-wrap { overflow-x: auto; }
  .od-table { width: 100%; border-collapse: collapse; }
  .od-table th { text-align: left; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; padding: 0 10px 8px; border-bottom: 1px solid rgba(30,58,95,0.1); white-space: nowrap; }
  .od-table td { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #1E3A5F; padding: 8px 10px; border-bottom: 1px solid rgba(30,58,95,0.06); vertical-align: middle; }
  .od-table tr:last-child td { border-bottom: none; }
  @media (max-width: 1200px) { .od-queue-grid { grid-template-columns: repeat(3, 1fr); } .od-two-col { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .od-queue-grid { grid-template-columns: repeat(2, 1fr); } .od-urgency-grid { grid-template-columns: 1fr; } }
`

function fmt(n) {
  if (n === null || n === undefined) return '—'
  if (typeof n === 'number' && n >= 1000) return n.toLocaleString('en-IE')
  return String(n)
}

function SectionTitle({ eyebrow, title, caption }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '700',
        color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
      }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '19px', color: NAVY, margin: '3px 0 0' }}>
        {title}
      </h2>
      {caption && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY, margin: '4px 0 0', lineHeight: 1.5 }}>
          {caption}
        </p>
      )}
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      border: '1px solid rgba(30,58,95,0.08)',
      padding: '18px 20px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function QueueTile({ label, value, icon: Icon, tone }) {
  const accent = tone === 'bad' ? RED : tone === 'good' ? GREEN : NAVY
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      border: tone === 'bad' && Number(value) > 0 ? `1px solid ${RED}` : '1px solid rgba(30,58,95,0.08)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px',
          background: tone === 'bad' && Number(value) > 0 ? 'rgba(220,38,38,0.1)' : CREAM,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={12} color={accent} />
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: GREY, lineHeight: 1.25 }}>
          {label}
        </p>
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: accent, marginTop: '8px', lineHeight: 1 }}>
        {fmt(value)}
      </p>
    </div>
  )
}

function HBarList({ data, valueFormatter = fmt, labelWidth = '190px' }) {
  if (!data.length) {
    return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: MUTED }}>No submissions in this period yet.</p>
  }
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {data.map(d => (
        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: NAVY,
            width: labelWidth, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {d.name}
          </span>
          <div style={{ flex: 1, background: SAND, borderRadius: '4px', height: '10px' }}>
            <div style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, height: '100%', background: NAVY, borderRadius: '0 4px 4px 0' }} />
          </div>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600', color: GREY,
            width: '32px', textAlign: 'right', flexShrink: 0,
          }}>
            {valueFormatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    Online:  { bg: 'rgba(22,163,74,0.1)', fg: GREEN, dot: GREEN },
    Offline: { bg: 'rgba(107,114,128,0.1)', fg: GREY, dot: MUTED },
    'On rota': { bg: 'rgba(30,58,95,0.08)', fg: NAVY, dot: NAVY },
  }
  const c = map[status] || map.Offline
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, color: c.fg, borderRadius: '20px', padding: '3px 9px',
      fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot }} />
      {status}
    </span>
  )
}

const EMPTY_URGENCY = { green: 0, amber: 0, red: 0 }
const EMPTY_QUEUE_TIMES = { avg_assignment_minutes: null, avg_delivery_hours: null, overdue_count: 0 }
const EMPTY_SUNDAY = { depth: 0, monday_rota_handlers: 0, declared_capacity_avg: 0, checked_in: 0, cap: 0 }
const EMPTY_TIER_MIX = { premium_count: 0, standard_count: 0, protected_standard_count: 0 }

export default function OperationsDashboardPage() {
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [snapshot, setSnapshot] = useState(null)
  const [queueTimes, setQueueTimes] = useState(EMPTY_QUEUE_TIMES)
  const [handlers, setHandlers] = useState([])
  const [sunday, setSunday] = useState(EMPTY_SUNDAY)
  const [campusDemand, setCampusDemand] = useState([])
  const [serviceDemand, setServiceDemand] = useState([])
  const [hottest, setHottest] = useState({ Today: [], 'This Week': [], 'This Year': [] })
  const [tierMix, setTierMix] = useState(EMPTY_TIER_MIX)
  const [asOf, setAsOf] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        snapRes, timesRes, handlersRes, sundayRes,
        campusRes, serviceRes, tierRes,
        hotTodayRes, hotWeekRes, hotYearRes,
      ] = await Promise.all([
        supabase.rpc('get_ops_queue_snapshot'),
        supabase.rpc('get_ops_queue_times', { _range: range }),
        supabase.rpc('get_handler_roster'),
        supabase.rpc('get_sunday_queue_status'),
        supabase.rpc('get_campus_demand', { _range: range }),
        supabase.rpc('get_service_demand', { _range: range }),
        supabase.rpc('get_tier_mix', { _range: range }),
        supabase.rpc('get_service_demand', { _range: 'today' }),
        supabase.rpc('get_service_demand', { _range: 'week' }),
        supabase.rpc('get_service_demand', { _range: 'year' }),
      ])

      const firstError = [snapRes, timesRes, handlersRes, sundayRes, campusRes, serviceRes, tierRes, hotTodayRes, hotWeekRes, hotYearRes]
        .find(r => r.error)
      if (firstError) throw firstError.error

      setSnapshot(snapRes.data?.[0] || null)
      setQueueTimes(timesRes.data?.[0] || EMPTY_QUEUE_TIMES)
      setHandlers(handlersRes.data || [])
      setSunday(sundayRes.data?.[0] || EMPTY_SUNDAY)
      setCampusDemand((campusRes.data || []).map(r => ({ name: r.institution, value: r.submission_count })))
      setServiceDemand((serviceRes.data || []).map(r => ({ name: r.service_name, value: r.submission_count })))
      setTierMix(tierRes.data?.[0] || EMPTY_TIER_MIX)
      setHottest({
        Today: (hotTodayRes.data || []).slice(0, 5).map(r => r.service_name),
        'This Week': (hotWeekRes.data || []).slice(0, 5).map(r => r.service_name),
        'This Year': (hotYearRes.data || []).slice(0, 5).map(r => r.service_name),
      })
      setAsOf(new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  const urgency = snapshot
    ? { green: snapshot.green_count, amber: snapshot.amber_count, red: snapshot.red_count }
    : EMPTY_URGENCY

  const queueTiles = [
    { key: 'inQueue',    label: 'Tickets in queue right now',  value: snapshot?.queued ?? 0,          icon: ListChecks,   tone: 'neutral' },
    { key: 'inProgress', label: 'Tickets in progress',         value: snapshot?.in_progress ?? 0,     icon: Timer,        tone: 'neutral' },
    { key: 'completed',  label: 'Completed today',             value: snapshot?.completed_today ?? 0, icon: CheckCircle2, tone: 'good' },
    { key: 'toAssign',   label: 'Average time-to-assignment',  value: queueTimes.avg_assignment_minutes != null ? `${queueTimes.avg_assignment_minutes} min` : '—', icon: Clock, tone: 'neutral' },
    { key: 'toDeliver',  label: 'Average time-to-delivery',    value: queueTimes.avg_delivery_hours != null ? `${queueTimes.avg_delivery_hours} hrs` : '—', icon: Truck, tone: 'neutral' },
    { key: 'overdue',    label: 'Tickets overdue',             value: queueTimes.overdue_count ?? 0,  icon: AlertTriangle, tone: 'bad' },
  ]

  const proPct = (tierMix.premium_count + tierMix.standard_count) > 0
    ? Math.round((tierMix.premium_count / (tierMix.premium_count + tierMix.standard_count)) * 100)
    : 0
  const standardPct = 100 - proPct

  return (
    <>
      <Helmet>
        <title>Operations Dashboard | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <div style={{ background: CREAM, minHeight: '100vh', padding: '24px 28px 64px' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
        }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: NAVY, margin: 0 }}>
              Operations Dashboard
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: GREY, margin: '4px 0 0' }}>
              Order fills, queues, handler status, and demand by campus and service type.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: '#FFFFFF', borderRadius: '8px', padding: '3px', border: '1px solid rgba(30,58,95,0.08)' }}>
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
                    padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: range === r.key ? NAVY : 'transparent',
                    color: range === r.key ? CREAM : GREY,
                    transition: 'background 150ms, color 150ms',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: loading ? MUTED : GREEN }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY }}>
                {loading ? 'Refreshing…' : `as of ${asOf}`}
              </span>
            </div>
          </div>
        </div>

        {!!error && (
          <Card style={{ marginBottom: '20px', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}

        {/* ── QUEUE STATUS TILES ─────────────────────────────────────── */}
        <div className="od-queue-grid" style={{ marginBottom: '20px' }}>
          {queueTiles.map(t => <QueueTile key={t.key} {...t} />)}
        </div>

        {/* ── DEADLINE URGENCY BREAKDOWN ─────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle
            eyebrow="Deadlines"
            title="Deadline urgency breakdown"
            caption="Tickets are colour-coded by time remaining. A Standard ticket that turns red is elevated to the same urgency as Premium."
          />
          <div className="od-urgency-grid">
            <div style={{ background: 'rgba(22,163,74,0.06)', border: `1px solid rgba(22,163,74,0.25)`, borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: GREY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: GREEN }} /> Green, plenty of time
              </p>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: GREEN, marginTop: '6px' }}>{urgency.green}</p>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.07)', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: GREY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: AMBER }} /> Amber, approaching
              </p>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: AMBER, marginTop: '6px' }}>{urgency.amber}</p>
            </div>
            <div style={{ background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.3)`, borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: GREY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: RED }} /> Red, imminent
              </p>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: RED, marginTop: '6px' }}>{urgency.red}</p>
              {!!urgency.red && (
                <p style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px',
                  background: '#FFFFFF', border: `1px solid ${AMBER}`, borderRadius: '6px', padding: '3px 8px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '600', color: '#92610A',
                }}>
                  <ShieldAlert size={11} color={AMBER} />
                  Standard tickets in this count are elevated to urgent
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* ── CAMPUS HANDLER ROSTER ──────────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle eyebrow="Roster" title="Campus Handler roster" caption="Live status, load, and specialism per handler." />
          {handlers.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: MUTED }}>No Handlers on the roster yet.</p>
          ) : (
            <div className="od-table-wrap">
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Handler</th>
                    <th>Status</th>
                    <th>Active tickets</th>
                    <th>Completed today</th>
                    <th>Rating</th>
                    <th>Specialism</th>
                  </tr>
                </thead>
                <tbody>
                  {handlers.map(h => (
                    <tr key={h.handler_id}>
                      <td style={{ fontWeight: '600' }}>
                        {h.name}
                        {h.is_ghost && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px',
                            background: 'rgba(245,158,11,0.12)', color: '#92610A', borderRadius: '6px', padding: '2px 7px',
                            fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600',
                          }}>
                            <Ghost size={10} color={AMBER} />
                            3+ missed check-ins this week
                          </span>
                        )}
                      </td>
                      <td><StatusBadge status={h.status} /></td>
                      <td>{h.active_tickets}</td>
                      <td>{h.completed_today}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {h.avg_rating != null ? (
                          <>
                            <Star size={11} color={AMBER} fill={AMBER} />
                            {Number(h.avg_rating).toFixed(1)} ({h.rating_count})
                          </>
                        ) : (
                          <span style={{ color: MUTED }}>Not yet rated</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(h.specialisms || []).length === 0 && <span style={{ color: MUTED, fontSize: '11px' }}>None declared</span>}
                          {(h.specialisms || []).map(tag => (
                            <span key={tag} style={{
                              background: CREAM, color: NAVY, borderRadius: '5px', padding: '2px 7px',
                              fontFamily: "'DM Sans', sans-serif", fontSize: '10px', whiteSpace: 'nowrap',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── SUNDAY QUEUE PANEL ─────────────────────────────────────── */}
        <Card style={{ marginBottom: '20px', border: `1px solid rgba(30,58,95,0.15)` }}>
          <SectionTitle eyebrow="Named mechanic" title="Sunday Queue" caption="Always visible, not conditional on today being Sunday." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '30px', color: NAVY }}>{sunday.depth}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, marginTop: '2px' }}>Current queue depth</p>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '30px', color: NAVY }}>
                {sunday.cap}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, marginTop: '2px' }}>Calculated cap</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', color: MUTED, marginTop: '2px', fontStyle: 'italic' }}>
                Cap = Monday rota handlers ({sunday.monday_rota_handlers}) &times; 70% of declared capacity per handler ({sunday.declared_capacity_avg ?? 0} avg)
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '30px', color: GREEN }}>
                {sunday.checked_in} / {sunday.monday_rota_handlers}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, marginTop: '2px' }}>Monday rota handlers confirmed checked in</p>
            </div>
          </div>
        </Card>

        {/* ── WHAT'S ORDERING, FROM WHERE ────────────────────────────── */}
        <div className="od-two-col" style={{ marginBottom: '20px' }}>
          <Card>
            <SectionTitle eyebrow="Demand" title="Submissions by campus" caption="Institutions generating the most submissions this period." />
            <HBarList data={campusDemand} />
          </Card>
          <Card>
            <SectionTitle eyebrow="Demand" title="Requests by service type" caption="Most requested Foundation and Elevation services this period." />
            <HBarList data={serviceDemand} labelWidth="200px" />
          </Card>
        </div>

        {/* ── HOTTEST OUTPUTS ─────────────────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle eyebrow="Trending" title="Hottest outputs" caption="Top requested service types, by timeframe." />
          <div className="od-two-col" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {Object.entries(hottest).map(([period, items]) => (
              <div key={period}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
                  color: NAVY, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px',
                }}>
                  {period}
                </p>
                {items.length === 0 ? (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: MUTED }}>Nothing yet</p>
                ) : (
                  <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {items.map(name => (
                      <li key={name} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#1E3A5F' }}>
                        {name}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ── TIER MIX ────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle eyebrow="Tier mix" title="Submissions this period, Pro vs Standard" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', width: '260px', height: '14px', borderRadius: '7px', overflow: 'hidden', background: SAND }}>
              <div style={{ width: `${proPct}%`, background: NAVY }} />
              <div style={{ width: `${standardPct}%`, background: SAND }} />
            </div>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: NAVY }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: NAVY }} />
                Pro, {proPct}% ({tierMix.premium_count})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: NAVY }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: SAND, border: '1px solid rgba(30,58,95,0.2)' }} />
                Standard, {standardPct}% ({tierMix.standard_count})
              </span>
            </div>
          </div>
          <p style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY,
          }}>
            <AlertCircle size={12} color={MUTED} />
            {tierMix.protected_standard_count} Standard tickets are currently in the protection zone: a Standard ticket cannot be pushed back more than 10 positions in the queue.
          </p>
        </Card>

      </div>
    </>
  )
}
