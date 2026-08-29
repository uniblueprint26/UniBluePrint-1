import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Users, Crown, UserCheck, Briefcase, GraduationCap, Handshake,
  FileText, CalendarCheck, AlertCircle, Star,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Real data, sourced from supabase/migrations/20260829130000_founder_dashboard_views.sql
// plus the pre-existing get_all_partner_stats() (20260810120100). No delta or
// sparkline on the top-line tiles on purpose -- there is no historical
// snapshot table yet to compare a period against, so this shows current
// totals honestly rather than a fabricated trend.

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
]

const EVENT_LABELS = {
  document_submitted: 'Documents submitted (Foundation)',
  session_booked: 'Sessions booked (Elevation)',
  note_saved: 'Notes saved',
  handler_review: 'Handler reviews',
  ad_posted: 'Ad Board posts',
  partner_deal_viewed: 'Lifestyle deal views',
  partner_deal_claimed: 'Lifestyle deal claims',
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
  if (n === null || n === undefined) return '—'
  if (n >= 1000) return n.toLocaleString('en-IE')
  return String(n)
}

function StatTile({ label, sub, value, icon: Icon }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '10px',
      border: '1px solid rgba(30,58,95,0.08)',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '7px',
        background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} color={NAVY} />
      </div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: NAVY, lineHeight: 1.1, marginTop: '2px' }}>
        {fmt(value)}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', color: GREY, lineHeight: 1.3 }}>
        {label}{sub ? `, ${sub}` : ''}
      </p>
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

function HBarList({ data, valueFormatter = fmt, emptyLabel = 'Nothing recorded yet.' }) {
  if (!data.length) {
    return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: MUTED }}>{emptyLabel}</p>
  }
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
  const max = Math.max(...data, 1)
  const min = 0
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = padTop + plotH - ((d - min) / (max - min)) * plotH
    return [x, y]
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${padTop + plotH} L0,${padTop + plotH} Z`
  const baselineY = padTop + plotH
  const [lastX, lastY] = pts[pts.length - 1] || [0, baselineY]
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} role="img" aria-label="New sign-ups per week over the last 12 weeks">
      <line x1="0" y1={baselineY} x2={width} y2={baselineY} stroke="#E5E0D6" strokeWidth="1" />
      <path d={area} fill={NAVY} opacity="0.1" />
      <path d={line} fill="none" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="4" fill={NAVY} stroke="#FFFFFF" strokeWidth="2" />
      <text x={lastX} y={lastY - 10} textAnchor="end" fontFamily="'DM Sans', sans-serif" fontSize="11" fontWeight="700" fill={NAVY}>
        {data[data.length - 1] ?? 0}
      </text>
      <text x="0" y={height - 4} fontFamily="'DM Sans', sans-serif" fontSize="10" fill={MUTED}>12 weeks ago</text>
      <text x={width} y={height - 4} textAnchor="end" fontFamily="'DM Sans', sans-serif" fontSize="10" fill={MUTED}>This week</text>
    </svg>
  )
}

const EMPTY_TOPLINE = {
  total_members: 0, pro_subscribers: 0, free_members: 0, active_handlers: 0,
  coach_profiles_listed: 0, active_partners: 0, foundation_submissions: 0, coach_enquiries: 0,
}
const EMPTY_RETENTION = {
  active_pro_count: 0, canceled_in_range: 0, cancellation_rate: null,
  avg_active_sub_months: null, conversion_rate: null,
}

export default function FounderDashboardPage() {
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [topline, setTopline] = useState(EMPTY_TOPLINE)
  const [engagement, setEngagement] = useState([])
  const [weeklySignups, setWeeklySignups] = useState([])
  const [partners, setPartners] = useState([])
  const [coaches, setCoaches] = useState([])
  const [campuses, setCampuses] = useState([])
  const [retention, setRetention] = useState(EMPTY_RETENTION)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        toplineRes, engagementRes, signupsRes, partnersRes,
        enquiriesRes, ratingsRes, campusesRes, retentionRes,
      ] = await Promise.all([
        supabase.rpc('get_founder_topline', { _range: range }),
        supabase.rpc('get_feature_engagement', { _range: range }),
        supabase.rpc('get_weekly_signups'),
        supabase.rpc('get_all_partner_stats'),
        supabase.rpc('get_coach_enquiry_counts'),
        supabase.from('coach_rating_summary').select('*'),
        supabase.rpc('get_campus_breakdown', { _range: range }),
        supabase.rpc('get_retention_snapshot', { _range: range }),
      ])

      const firstError = [toplineRes, engagementRes, signupsRes, partnersRes, enquiriesRes, ratingsRes, campusesRes, retentionRes]
        .find(r => r.error)
      if (firstError) throw firstError.error

      setTopline(toplineRes.data?.[0] || EMPTY_TOPLINE)
      setEngagement((engagementRes.data || []).map(r => ({ name: EVENT_LABELS[r.event_type] || r.event_type, value: r.event_count })))
      setWeeklySignups((signupsRes.data || []).map(r => r.signups))
      setPartners(partnersRes.data || [])

      const ratingsBySlug = Object.fromEntries((ratingsRes.data || []).map(r => [r.coach_slug, r]))
      setCoaches((enquiriesRes.data || []).map(e => ({
        ...e,
        rating: ratingsBySlug[e.coach_slug]?.avg_rating ?? null,
        ratingCount: ratingsBySlug[e.coach_slug]?.rating_count ?? 0,
      })).sort((a, b) => b.enquiry_count - a.enquiry_count))

      setCampuses((campusesRes.data || []).map(r => ({ name: r.institution, members: r.member_count, submissions: r.submission_count })))
      setRetention(retentionRes.data?.[0] || EMPTY_RETENTION)
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  const proSharePct = topline.total_members > 0 ? Math.round((topline.pro_subscribers / topline.total_members) * 100) : 0

  const toplineTiles = [
    { key: 'members',    label: 'Total active members',              value: topline.total_members, icon: Users },
    { key: 'pro',        label: 'Pro subscribers',                   sub: `${proSharePct}% of total`, value: topline.pro_subscribers, icon: Crown },
    { key: 'free',       label: 'Free tier members',                 value: topline.free_members, icon: UserCheck },
    { key: 'handlers',   label: 'Active Campus Handlers',             value: topline.active_handlers, icon: Briefcase },
    { key: 'coaches',    label: 'Coach profiles listed',              value: topline.coach_profiles_listed, icon: GraduationCap },
    { key: 'partners',   label: 'Active Lifestyle Partners',          value: topline.active_partners, icon: Handshake },
    { key: 'foundation', label: 'Foundation Blueprint submissions',   sub: 'this period', value: topline.foundation_submissions, icon: FileText },
    { key: 'elevation',  label: 'Elevation coach enquiries',          sub: 'this period', value: topline.coach_enquiries, icon: CalendarCheck },
  ]

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
        </div>

        {!!error && (
          <Card style={{ marginBottom: '20px', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}

        {/* ── TOP-LINE STAT TILES ────────────────────────────────────── */}
        <div className="fd-topline-grid" style={{ marginBottom: '20px', opacity: loading ? 0.6 : 1 }}>
          {toplineTiles.map(t => <StatTile key={t.key} {...t} />)}
        </div>

        {/* ── FEATURE ENGAGEMENT + GROWTH ────────────────────────────── */}
        <div className="fd-two-col" style={{ marginBottom: '20px' }}>
          <Card>
            <SectionTitle
              eyebrow="Product usage"
              title="Feature engagement"
              caption="Logged events this period, by type. Not every pillar has event logging wired up yet, so this is a partial picture, not full cross-pillar usage."
            />
            <HBarList data={engagement} />
          </Card>
          <Card>
            <SectionTitle eyebrow="Growth" title="New sign-ups per week" caption="Last 12 weeks." />
            <GrowthChart data={weeklySignups} />
          </Card>
        </div>

        {/* ── LIFESTYLE PARTNER IMPACT ───────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle
            eyebrow="Partner impact"
            title="Lifestyle partner performance"
            caption="All-time views, deal claims, and unique engaged users per live partner."
          />
          {partners.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: MUTED }}>No partner activity recorded yet.</p>
          ) : (
            <div className="fd-table-wrap">
              <table className="fd-table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Views</th>
                    <th>Deal claims</th>
                    <th>Unique users engaged</th>
                  </tr>
                </thead>
                <tbody>
                  {[...partners].sort((a, b) => b.views - a.views).map(p => (
                    <tr key={p.partner_id}>
                      <td style={{ fontWeight: '600' }}>{p.partner_name}</td>
                      <td>{fmt(p.views)}</td>
                      <td>{fmt(p.claims)}</td>
                      <td>{fmt(p.unique_engaged_users)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── COACH IMPACT ───────────────────────────────────────────── */}
        <Card style={{ marginBottom: '20px' }}>
          <SectionTitle
            eyebrow="Coach impact"
            title="Uni Coach performance"
            caption="Enquiry counts and average rating this period. Coaches handle their own bookings outside the platform, so enquiries are the real, available signal, not a booking count."
          />
          {coaches.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: MUTED }}>No coach enquiries yet this period.</p>
          ) : (
            <div className="fd-table-wrap">
              <table className="fd-table">
                <thead>
                  <tr>
                    <th>Coach</th>
                    <th>Enquiries</th>
                    <th>Average rating</th>
                  </tr>
                </thead>
                <tbody>
                  {coaches.map(c => (
                    <tr key={c.coach_slug}>
                      <td style={{ fontWeight: '600' }}>{c.coach_name}</td>
                      <td>{c.enquiry_count}</td>
                      <td>
                        {c.rating != null ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={11} color="#F59E0B" fill="#F59E0B" />
                            {Number(c.rating).toFixed(1)} / 5 ({c.ratingCount})
                          </span>
                        ) : (
                          <span style={{ color: MUTED }}>Not yet rated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── CAMPUS BREAKDOWN + RETENTION ───────────────────────────── */}
        <div className="fd-two-col">
          <Card>
            <SectionTitle eyebrow="Institutions" title="Campus breakdown" caption="Member count by institution, all time; submission volume this period alongside." />
            {campuses.length === 0 ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: MUTED }}>No members with an institution on file yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {(() => {
                  const max = Math.max(...campuses.map(c => c.members), 1)
                  return campuses.map(c => (
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
            )}
          </Card>

          <Card>
            <SectionTitle eyebrow="Retention" title="Retention snapshot" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: RED, margin: 0 }}>
                  {retention.cancellation_rate != null ? `${retention.cancellation_rate}%` : '—'}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY, margin: '2px 0 0' }}>
                  Pro subscriber cancellation rate this period ({retention.canceled_in_range} canceled)
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: NAVY, margin: 0 }}>
                  {retention.avg_active_sub_months != null ? `${retention.avg_active_sub_months} mo` : '—'}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: GREY, margin: '2px 0 0' }}>
                  Average tenure of currently active subscriptions
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: GREEN, margin: 0 }}>
                  {retention.conversion_rate != null ? `${retention.conversion_rate}%` : '—'}
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
