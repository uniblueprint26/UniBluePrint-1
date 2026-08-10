import { Helmet } from 'react-helmet-async'
import {
  ListChecks, Clock, CheckCircle2, Timer, Truck, AlertTriangle,
  AlertCircle, ShieldAlert, Star, Ghost,
} from 'lucide-react'

// DEMO DATA — replace with live Supabase queries once the analytics schema (see supabase/migrations/) is populated

const DEMO = {
  asOf: '09:41',

  queue: [
    { key: 'inQueue',     label: 'Tickets in queue right now', value: 34, icon: ListChecks, tone: 'neutral' },
    { key: 'inProgress',  label: 'Tickets in progress',        value: 21, icon: Timer,       tone: 'neutral' },
    { key: 'completed',   label: "Completed today",            value: 47, icon: CheckCircle2, tone: 'good' },
    { key: 'toAssign',    label: 'Average time-to-assignment', value: '18 min', icon: Clock,  tone: 'neutral' },
    { key: 'toDeliver',   label: 'Average time-to-delivery',   value: '6.4 hrs', icon: Truck, tone: 'neutral' },
    { key: 'overdue',     label: 'Tickets overdue',            value: 3,  icon: AlertTriangle, tone: 'bad' },
  ],

  urgency: {
    green: 38,
    amber: 12,
    red: 5,
    elevatedStandard: 3,
  },

  handlers: [
    { name: 'Aoife Byrne',       status: 'Online',  active: 4, completedToday: 7, rating: 4.8, tags: ['CV Optimisation', 'Interview Prep'] },
    { name: 'Cian Doyle',        status: 'On rota', active: 3, completedToday: 5, rating: 4.6, tags: ['Cover Letter', 'LinkedIn Optimisation'] },
    { name: 'Sinéad Walsh',      status: 'Online',  active: 5, completedToday: 9, rating: 4.9, tags: ['CAO Personal Statement', 'Course Selection'] },
    { name: 'Darragh Kelly',     status: 'Offline', active: 0, completedToday: 3, rating: 4.3, tags: ['Application Forms', 'Job Search'], ghost: '2 missed check-ins this week' },
    { name: "Niamh O'Connor",    status: 'Online',  active: 4, completedToday: 6, rating: 4.7, tags: ['Interview Prep', 'Personal Branding'] },
    { name: 'Ronan Murphy',      status: 'On rota', active: 2, completedToday: 4, rating: 4.5, tags: ['Portfolio Building', 'Network Assistance'] },
    { name: 'Saoirse Fitzgerald', status: 'Online', active: 6, completedToday: 8, rating: 4.9, tags: ['Scholarship & Grants', 'Postgrad Support'] },
    { name: 'Eoin Brennan',      status: 'Offline', active: 0, completedToday: 2, rating: 4.2, tags: ['CV Optimisation', 'Cover Letter'] },
  ],

  sundayQueue: {
    depth: 42,
    mondayRotaHandlers: 9,
    declaredCapacityPerHandler: 8,
    checkedIn: 7,
  },

  campusOrdering: [
    { name: 'University College Dublin',            value: 39 },
    { name: 'Trinity College Dublin',                value: 31 },
    { name: 'University College Cork',               value: 26 },
    { name: 'Dublin City University',                value: 22 },
    { name: 'University of Galway',                  value: 19 },
    { name: 'University of Limerick',                value: 16 },
    { name: 'Technological University Dublin',       value: 14 },
    { name: 'Maynooth University',                    value: 11 },
    { name: 'RCSI University',                         value: 8 },
    { name: 'South East Technological University',   value: 6 },
    { name: 'Atlantic Technological University',     value: 5 },
    { name: 'Dundalk Institute of Technology',        value: 4 },
  ],

  serviceTypes: [
    { name: 'CV Optimisation',                       value: 184 },
    { name: 'Interview Prep',                        value: 151 },
    { name: 'Cover Letter Assistance',                value: 133 },
    { name: 'LinkedIn Optimisation',                  value: 118 },
    { name: 'CAO Personal Statement',                 value: 96 },
    { name: 'Job Search Support',                     value: 89 },
    { name: 'Application Form Assistance',            value: 77 },
    { name: 'Course Selection Guidance',               value: 64 },
    { name: 'Personal Branding',                       value: 52 },
    { name: 'Scholarship & Grants Application',        value: 41 },
    { name: 'Portfolio Building',                       value: 33 },
    { name: 'Network Assistance',                       value: 28 },
    { name: 'Postgrad Support',                          value: 19 },
  ],

  hottest: {
    Today: ['CV Optimisation', 'Interview Prep', 'Cover Letter Assistance', 'LinkedIn Optimisation'],
    'This Week': ['CV Optimisation', 'Interview Prep', 'LinkedIn Optimisation', 'Cover Letter Assistance', 'CAO Personal Statement'],
    'This Year': ['CV Optimisation', 'Cover Letter Assistance', 'Interview Prep', 'CAO Personal Statement', 'LinkedIn Optimisation'],
  },

  tierMix: {
    proPct: 61,
    standardPct: 39,
    protectedStandardCount: 11,
  },
}

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
  .od-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .od-table-wrap { overflow-x: auto; }
  .od-table { width: 100%; border-collapse: collapse; }
  .od-table th { text-align: left; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; padding: 0 10px 8px; border-bottom: 1px solid rgba(30,58,95,0.1); white-space: nowrap; }
  .od-table td { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #1E3A5F; padding: 8px 10px; border-bottom: 1px solid rgba(30,58,95,0.06); vertical-align: middle; }
  .od-table tr:last-child td { border-bottom: none; }
  @media (max-width: 1200px) { .od-queue-grid { grid-template-columns: repeat(3, 1fr); } .od-two-col { grid-template-columns: 1fr; } .od-three-col { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .od-queue-grid { grid-template-columns: repeat(2, 1fr); } .od-urgency-grid { grid-template-columns: 1fr; } }
`

function fmt(n) {
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

export default function OperationsDashboardPage() {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: GREEN }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY }}>
              as of {DEMO.asOf}
            </span>
          </div>
        </div>

        {/* ── QUEUE STATUS TILES ─────────────────────────────────────── */}
        <div className="od-queue-grid" style={{ marginBottom: '20px' }}>
          {DEMO.queue.map(t => <QueueTile key={t.key} {...t} />)}
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
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: GREEN, marginTop: '6px' }}>{DEMO.urgency.green}</p>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.07)', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: GREY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: AMBER }} /> Amber, approaching
              </p>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: AMBER, marginTop: '6px' }}>{DEMO.urgency.amber}</p>
            </div>
            <div style={{ background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.3)`, borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: GREY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: RED }} /> Red, imminent
              </p>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: RED, marginTop: '6px' }}>{DEMO.urgency.red}</p>
              <p style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px',
                background: '#FFFFFF', border: `1px solid ${AMBER}`, borderRadius: '6px', padding: '3px 8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: '600', color: '#92610A',
              }}>
                <ShieldAlert size={11} color={AMBER} />
                {DEMO.urgency.elevatedStandard} Standard tickets elevated to urgent
              </p>
            </div>
          </div>
        </Card>

        {/* ── CAMPUS HANDLER ROSTER ──────────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle eyebrow="Roster" title="Campus Handler roster" caption="Live status, load, and specialism per handler." />
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
                {DEMO.handlers.map(h => (
                  <tr key={h.name}>
                    <td style={{ fontWeight: '600' }}>
                      {h.name}
                      {h.ghost && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px',
                          background: 'rgba(245,158,11,0.12)', color: '#92610A', borderRadius: '6px', padding: '2px 7px',
                          fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600',
                        }}>
                          <Ghost size={10} color={AMBER} />
                          {h.ghost}
                        </span>
                      )}
                    </td>
                    <td><StatusBadge status={h.status} /></td>
                    <td>{h.active}</td>
                    <td>{h.completedToday}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={11} color={AMBER} fill={AMBER} />
                      {h.rating.toFixed(1)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {h.tags.map(tag => (
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
        </Card>

        {/* ── SUNDAY QUEUE PANEL ─────────────────────────────────────── */}
        <Card style={{ marginBottom: '20px', border: `1px solid rgba(30,58,95,0.15)` }}>
          <SectionTitle eyebrow="Named mechanic" title="Sunday Queue" caption="Always visible, not conditional on today being Sunday." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '30px', color: NAVY }}>{DEMO.sundayQueue.depth}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, marginTop: '2px' }}>Current queue depth</p>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '30px', color: NAVY }}>
                {Math.floor(DEMO.sundayQueue.mondayRotaHandlers * 0.7 * DEMO.sundayQueue.declaredCapacityPerHandler)}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, marginTop: '2px' }}>Calculated cap</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', color: MUTED, marginTop: '2px', fontStyle: 'italic' }}>
                Cap = Monday rota handlers ({DEMO.sundayQueue.mondayRotaHandlers}) &times; 70% of declared capacity per handler ({DEMO.sundayQueue.declaredCapacityPerHandler})
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '30px', color: GREEN }}>
                {DEMO.sundayQueue.checkedIn} / {DEMO.sundayQueue.mondayRotaHandlers}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, marginTop: '2px' }}>Monday rota handlers confirmed checked in</p>
            </div>
          </div>
        </Card>

        {/* ── WHAT'S ORDERING, FROM WHERE ────────────────────────────── */}
        <div className="od-two-col" style={{ marginBottom: '20px' }}>
          <Card>
            <SectionTitle eyebrow="Demand" title="Submissions by campus" caption="Institutions generating the most submissions this period." />
            <HBarList data={DEMO.campusOrdering} />
          </Card>
          <Card>
            <SectionTitle eyebrow="Demand" title="Requests by service type" caption="Most requested Foundation and Elevation services this period." />
            <HBarList data={DEMO.serviceTypes} labelWidth="200px" />
          </Card>
        </div>

        {/* ── HOTTEST OUTPUTS ─────────────────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle eyebrow="Trending" title="Hottest outputs" caption="Top requested service types, by timeframe." />
          <div className="od-three-col">
            {Object.entries(DEMO.hottest).map(([period, items]) => (
              <div key={period}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '700',
                  color: NAVY, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px',
                }}>
                  {period}
                </p>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items.map(name => (
                    <li key={name} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#1E3A5F' }}>
                      {name}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>

        {/* ── TIER MIX ────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle eyebrow="Tier mix" title="Today's submissions, Pro vs Standard" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', width: '260px', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
              <div style={{ width: `${DEMO.tierMix.proPct}%`, background: NAVY }} />
              <div style={{ width: `${DEMO.tierMix.standardPct}%`, background: SAND }} />
            </div>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: NAVY }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: NAVY }} />
                Pro, {DEMO.tierMix.proPct}%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: NAVY }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: SAND, border: '1px solid rgba(30,58,95,0.2)' }} />
                Standard, {DEMO.tierMix.standardPct}%
              </span>
            </div>
          </div>
          <p style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY,
          }}>
            <AlertCircle size={12} color={MUTED} />
            {DEMO.tierMix.protectedStandardCount} free-tier Standard tickets are currently in the protection zone: a Standard ticket cannot be pushed back more than 10 positions in the queue.
          </p>
        </Card>

      </div>
    </>
  )
}
