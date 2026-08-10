import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  ArrowUp, ArrowDown, Minus, Users, Crown, UserCheck, Briefcase,
  GraduationCap, Handshake, FileText, CalendarCheck,
} from 'lucide-react'

// DEMO DATA — replace with live Supabase queries once the analytics schema (see supabase/migrations/) is populated

const DEMO = {
  ranges: ['Today', 'This Week', 'This Month', 'This Year'],
  defaultRange: 'This Month',

  topline: [
    { key: 'members',    label: 'Total active members',              value: 4820, delta: 6.4,  positiveIsGood: true, icon: Users,         spark: [3980, 4080, 4160, 4310, 4460, 4590, 4700, 4820] },
    { key: 'pro',        label: 'Pro subscribers',                   sub: '23.8% of total', value: 1146, delta: 9.1,  positiveIsGood: true, icon: Crown,         spark: [860, 910, 950, 990, 1040, 1080, 1110, 1146] },
    { key: 'free',       label: 'Free tier members',                 value: 3674, delta: 4.7,  positiveIsGood: true, icon: UserCheck,     spark: [3120, 3170, 3230, 3310, 3400, 3510, 3600, 3674] },
    { key: 'handlers',   label: 'Active Campus Handlers',             value: 18,   delta: 12.5, positiveIsGood: true, icon: Briefcase,     spark: [14, 14, 15, 15, 16, 17, 17, 18] },
    { key: 'coaches',    label: 'Active Uni Coaches',                 value: 12,   delta: 0,    positiveIsGood: true, icon: GraduationCap, spark: [12, 12, 11, 12, 12, 12, 12, 12] },
    { key: 'partners',   label: 'Active Lifestyle Partners',          value: 8,    delta: 0,    positiveIsGood: true, icon: Handshake,     spark: [8, 8, 8, 8, 8, 8, 8, 8] },
    { key: 'foundation', label: 'Foundation Blueprint submissions',   sub: 'this period', value: 612, delta: 14.2, positiveIsGood: true, icon: FileText,      spark: [430, 460, 480, 510, 540, 560, 590, 612] },
    { key: 'elevation',  label: 'Elevation Blueprint bookings',       sub: 'this period', value: 289, delta: -3.1, positiveIsGood: true, icon: CalendarCheck, spark: [310, 305, 300, 298, 295, 292, 291, 289] },
  ],

  featureEngagement: [
    { name: 'Foundation Blueprint', value: 3820 },
    { name: 'Elevation Blueprint',  value: 2210 },
    { name: 'Lifestyle Blueprint',  value: 1560 },
    { name: 'Campus Connect',       value: 1290 },
    { name: 'Course Connect',       value: 980 },
    { name: 'Budgeting Tool',       value: 860 },
    { name: 'Ad Board',             value: 540 },
    { name: 'Course Compass',       value: 410 },
  ],

  weeklySignups: [62, 58, 71, 75, 69, 82, 90, 88, 101, 96, 112, 124],

  partners: [
    { name: 'MPFitness',               views: 2140, claims: 186, trend: 8.4 },
    { name: 'Energie Fitness',         views: 1980, claims: 231, trend: 5.1 },
    { name: 'JMC Fitness',             views: 1720, claims: 142, trend: 11.6 },
    { name: 'Nyz3ditz',                views: 1340, claims: 88,  trend: -2.3 },
    { name: 'Whip Wizardz',            views: 990,  claims: 47,  trend: 3.8 },
    { name: 'The Nail Nurse',          views: 860,  claims: 96,  trend: 14.9 },
    { name: 'Emmanuel Fasanmi Grinds', views: 720,  claims: 61,  trend: 1.2 },
    { name: 'LEVA Impact',             views: 640,  claims: 39,  trend: -4.7 },
  ],

  coaches: [
    { name: 'Emmanuel Fasanmi', bookings: 61, rating: 4.9, repeat: 68 },
    { name: 'JMC Fitness',      bookings: 54, rating: 4.8, repeat: 62 },
    { name: 'Nathan Yanzo',     bookings: 47, rating: 4.9, repeat: 71 },
    { name: 'Daniel Gough',     bookings: 42, rating: 4.7, repeat: 55 },
    { name: 'Ali',              bookings: 39, rating: 4.6, repeat: 49 },
    { name: 'Emanuel Tolic',    bookings: 35, rating: 4.8, repeat: 58 },
    { name: 'Tadgh Darcy',      bookings: 33, rating: 4.5, repeat: 44 },
    { name: 'Milan Piroska',    bookings: 30, rating: 4.9, repeat: 66 },
    { name: 'Kevin',            bookings: 27, rating: 4.4, repeat: 38 },
    { name: 'Alex Leva',        bookings: 24, rating: 4.7, repeat: 51 },
    { name: 'Nikola Jurek',     bookings: 21, rating: 4.6, repeat: 47 },
    { name: 'Jayden Reynolds',  bookings: 18, rating: 4.5, repeat: 41 },
  ],

  campuses: [
    { name: 'University College Dublin',         members: 890, submissions: 142 },
    { name: 'Trinity College Dublin',             members: 760, submissions: 118 },
    { name: 'University College Cork',            members: 640, submissions: 96 },
    { name: 'Dublin City University',             members: 520, submissions: 81 },
    { name: 'University of Galway',               members: 480, submissions: 74 },
    { name: 'University of Limerick',             members: 410, submissions: 63 },
    { name: 'Technological University Dublin',    members: 380, submissions: 58 },
    { name: 'Maynooth University',                members: 340, submissions: 49 },
    { name: 'RCSI University',                    members: 210, submissions: 31 },
    { name: 'South East Technological University', members: 190, submissions: 27 },
    { name: 'Atlantic Technological University',  members: 160, submissions: 22 },
    { name: 'Dundalk Institute of Technology',     members: 120, submissions: 16 },
  ],

  retention: {
    churnRate: 3.2,
    avgSubMonths: 7.4,
    conversionRate: 8.6,
  },
}

const NAVY = '#1E3A5F'
const CREAM = '#F5F0E8'
const SAND = '#EDE8DF'
const GREY = '#6B7280'
const MUTED = '#9CA3AF'
const GREEN = '#16A34A'
const RED = '#DC2626'

const PAGE_STYLES = `
  .fd-topline-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .fd-two-col { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px; align-items: stretch; }
  .fd-table-wrap { overflow-x: auto; }
  .fd-table { width: 100%; border-collapse: collapse; }
  .fd-table th { text-align: left; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; padding: 0 10px 8px; border-bottom: 1px solid rgba(30,58,95,0.1); white-space: nowrap; }
  .fd-table td { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #1E3A5F; padding: 8px 10px; border-bottom: 1px solid rgba(30,58,95,0.06); white-space: nowrap; }
  .fd-table tr:last-child td { border-bottom: none; }
  @media (max-width: 1100px) { .fd-topline-grid { grid-template-columns: repeat(2, 1fr); } .fd-two-col { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .fd-topline-grid { grid-template-columns: 1fr; } }
`

function fmt(n) {
  if (n >= 1000) return n.toLocaleString('en-IE')
  return String(n)
}

function TrendBadge({ value, positiveIsGood = true }) {
  const flat = !value
  const isUp = value > 0
  const good = flat ? null : isUp === positiveIsGood
  const color = flat ? MUTED : good ? GREEN : RED
  const Icon = flat ? Minus : isUp ? ArrowUp : ArrowDown
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600',
      color,
    }}>
      <Icon size={11} strokeWidth={2.5} />
      {flat ? 'No change' : `${Math.abs(value).toFixed(1)}%`}
    </span>
  )
}

function Sparkline({ data, color = NAVY, width = 64, height = 22 }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d - min) / range) * height
    return [x, y]
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const [lastX, lastY] = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={area} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  )
}

function StatTile({ label, sub, value, delta, positiveIsGood, icon: Icon, spark }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      border: '1px solid rgba(30,58,95,0.08)',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px',
          background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={NAVY} />
        </div>
        {spark && <Sparkline data={spark} color={NAVY} />}
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: NAVY, lineHeight: 1.1, marginTop: '2px' }}>
        {fmt(value)}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, lineHeight: 1.3 }}>
        {label}{sub ? `, ${sub}` : ''}
      </p>
      <TrendBadge value={delta} positiveIsGood={positiveIsGood} />
    </div>
  )
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

function HBarList({ data, valueFormatter = fmt }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map(d => (
        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: NAVY,
            width: '160px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {d.name}
          </span>
          <div style={{ flex: 1, background: SAND, borderRadius: '4px', height: '12px' }}>
            <div style={{
              width: `${Math.max((d.value / max) * 100, 3)}%`, height: '100%',
              background: NAVY, borderRadius: '0 4px 4px 0',
            }} />
          </div>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', fontWeight: '600', color: GREY,
            width: '44px', textAlign: 'right', flexShrink: 0,
          }}>
            {valueFormatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function GrowthChart({ data }) {
  const width = 640
  const height = 140
  const padTop = 10
  const padBottom = 22
  const plotH = height - padTop - padBottom
  const max = Math.max(...data)
  const min = 0
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = padTop + plotH - ((d - min) / (max - min)) * plotH
    return [x, y]
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${padTop + plotH} L0,${padTop + plotH} Z`
  const baselineY = padTop + plotH
  const [lastX, lastY] = pts[pts.length - 1]
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} role="img" aria-label="New sign-ups per week over the last 12 weeks">
      <line x1="0" y1={baselineY} x2={width} y2={baselineY} stroke="#E5E0D6" strokeWidth="1" />
      <path d={area} fill={NAVY} opacity="0.1" />
      <path d={line} fill="none" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="4" fill={NAVY} stroke="#FFFFFF" strokeWidth="2" />
      <text x={lastX} y={lastY - 10} textAnchor="end" fontFamily="'DM Sans', sans-serif" fontSize="11" fontWeight="700" fill={NAVY}>
        {data[data.length - 1]}
      </text>
      <text x="0" y={height - 4} fontFamily="'DM Sans', sans-serif" fontSize="10" fill={MUTED}>12 weeks ago</text>
      <text x={width} y={height - 4} textAnchor="end" fontFamily="'DM Sans', sans-serif" fontSize="10" fill={MUTED}>This week</text>
    </svg>
  )
}

export default function FounderDashboardPage() {
  const [range, setRange] = useState(DEMO.defaultRange)

  return (
    <>
      <Helmet>
        <title>Founder Dashboard | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <div style={{ background: CREAM, minHeight: '100vh', padding: '24px 28px 64px' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
        }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: NAVY, margin: 0 }}>
              Founder Dashboard
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: GREY, margin: '4px 0 0' }}>
              Platform health, feature usage, and partner or coach impact. Read only, for internal reference.
            </p>
          </div>
          <div style={{ display: 'inline-flex', background: '#FFFFFF', borderRadius: '8px', padding: '3px', border: '1px solid rgba(30,58,95,0.08)' }}>
            {DEMO.ranges.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600',
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: range === r ? NAVY : 'transparent',
                  color: range === r ? CREAM : GREY,
                  transition: 'background 150ms, color 150ms',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── TOP-LINE STAT TILES ────────────────────────────────────── */}
        <div className="fd-topline-grid" style={{ marginBottom: '20px' }}>
          {DEMO.topline.map(t => <StatTile key={t.key} {...t} />)}
        </div>

        {/* ── FEATURE ENGAGEMENT + GROWTH ────────────────────────────── */}
        <div className="fd-two-col" style={{ marginBottom: '20px' }}>
          <Card>
            <SectionTitle eyebrow="Product usage" title="Feature engagement" caption="Sessions touching each feature this period, ranked." />
            <HBarList data={DEMO.featureEngagement} />
          </Card>
          <Card>
            <SectionTitle eyebrow="Growth" title="New sign-ups per week" caption="Last 12 weeks." />
            <GrowthChart data={DEMO.weeklySignups} />
          </Card>
        </div>

        {/* ── LIFESTYLE PARTNER IMPACT ───────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle
            eyebrow="Partner impact"
            title="Lifestyle partner performance"
            caption="Source of truth for partner impact reporting: views, deal claims, and engagement trend per live partner this period."
          />
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Views</th>
                  <th>Deal claims / redemptions</th>
                  <th>Engagement trend</th>
                </tr>
              </thead>
              <tbody>
                {DEMO.partners.map(p => (
                  <tr key={p.name}>
                    <td style={{ fontWeight: '600' }}>{p.name}</td>
                    <td>{fmt(p.views)}</td>
                    <td>{fmt(p.claims)}</td>
                    <td><TrendBadge value={p.trend} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── COACH IMPACT ───────────────────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle eyebrow="Coach impact" title="Uni Coach performance" caption="Bookings, average rating, and repeat client rate this period." />
          <div className="fd-table-wrap">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Coach</th>
                  <th>Bookings</th>
                  <th>Average rating</th>
                  <th>Repeat client rate</th>
                </tr>
              </thead>
              <tbody>
                {DEMO.coaches.map(c => (
                  <tr key={c.name}>
                    <td style={{ fontWeight: '600' }}>{c.name}</td>
                    <td>{c.bookings}</td>
                    <td>{c.rating.toFixed(1)} / 5</td>
                    <td>{c.repeat}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── CAMPUS BREAKDOWN + RETENTION ───────────────────────────── */}
        <div className="fd-two-col">
          <Card>
            <SectionTitle eyebrow="Institutions" title="Campus breakdown" caption="Member count by institution, submission volume this period alongside." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {(() => {
                const max = Math.max(...DEMO.campuses.map(c => c.members))
                return DEMO.campuses.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: NAVY,
                      width: '190px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {c.name}
                    </span>
                    <div style={{ flex: 1, background: SAND, borderRadius: '4px', height: '10px' }}>
                      <div style={{ width: `${Math.max((c.members / max) * 100, 3)}%`, height: '100%', background: NAVY, borderRadius: '0 4px 4px 0' }} />
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: '600', color: GREY, width: '38px', textAlign: 'right' }}>
                      {c.members}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', color: MUTED, width: '70px', textAlign: 'right' }}>
                      {c.submissions} subs.
                    </span>
                  </div>
                ))
              })()}
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="Retention" title="Retention snapshot" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: RED, margin: 0 }}>
                  {DEMO.retention.churnRate}%
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY, margin: '2px 0 0' }}>
                  Pro subscriber churn rate this period
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: NAVY, margin: 0 }}>
                  {DEMO.retention.avgSubMonths} mo
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY, margin: '2px 0 0' }}>
                  Average subscription length
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: GREEN, margin: 0 }}>
                  {DEMO.retention.conversionRate}%
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY, margin: '2px 0 0' }}>
                  Free to Pro conversion rate
                </p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </>
  )
}
