import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheck, Eye, Ticket, Percent, TrendingUp, TrendingDown,
  GraduationCap, Lock, Instagram, Mail, Dumbbell,
} from 'lucide-react'

// ─── Design tokens (matches site-wide system) ──────────────────────────────────
const NAVY   = '#1E3A5F'
const CREAM  = '#F5F0E8'
const SAND   = '#EDE8DF'
const GREY   = '#6B7280'
const MUTED  = '#9CA3AF'
const GREEN  = '#16A34A'
const AMBER  = '#F59E0B'
const RED    = '#DC2626'
const CARD_SHADOW = '0px 2px 12px rgba(30,58,95,0.08)'
const SERIF = "'DM Serif Display', serif"
const SANS  = "'DM Sans', sans-serif"

// DEMO DATA — replace with a live Supabase query scoped to the logged-in partner's own partner_id once the analytics schema is populated
const DEMO = {
  partner: {
    name: 'MPFitness',
    category: 'Fitness',
    initials: 'MP',
    initBg: '#15803D',
    instagram: 'milanpir_fitness',
  },
  ranges: {
    week: {
      label: 'This Week',
      previousLabel: 'vs last week',
      views: 214,
      viewsDeltaPct: 9,
      claims: 15,
      claimsDeltaPct: 25,
      ctrPct: 7.0,
      ctrDeltaPp: 1.1,
      viewsSeries: [
        { label: 'Mon', value: 24 },
        { label: 'Tue', value: 28 },
        { label: 'Wed', value: 35 },
        { label: 'Thu', value: 30 },
        { label: 'Fri', value: 38 },
        { label: 'Sat', value: 33 },
        { label: 'Sun', value: 26 },
      ],
    },
    month: {
      label: 'This Month',
      previousLabel: 'vs last month',
      views: 3180,
      viewsDeltaPct: 14,
      claims: 224,
      claimsDeltaPct: 18,
      ctrPct: 7.0,
      ctrDeltaPp: 0.4,
      viewsSeries: [
        { label: 'Week 1', value: 690 },
        { label: 'Week 2', value: 740 },
        { label: 'Week 3', value: 815 },
        { label: 'Week 4', value: 935 },
      ],
    },
    all: {
      label: 'All Time',
      previousLabel: 'vs prior 90 days',
      views: 28460,
      viewsDeltaPct: 22,
      claims: 1860,
      claimsDeltaPct: 19,
      ctrPct: 6.5,
      ctrDeltaPp: 0.2,
      viewsSeries: [
        { label: 'Mar', value: 3450 },
        { label: 'Apr', value: 3820 },
        { label: 'May', value: 4010 },
        { label: 'Jun', value: 4460 },
        { label: 'Jul', value: 4890 },
        { label: 'Aug', value: 5230 },
      ],
    },
  },
  // Top institutions claiming this deal, last 30 days
  engagementByInstitution: [
    { name: 'University College Dublin', claims: 68 },
    { name: 'Dublin City University',    claims: 45 },
    { name: 'Trinity College Dublin',    claims: 34 },
    { name: 'Maynooth University',       claims: 27 },
    { name: 'All other institutions',    claims: 50 },
  ],
  // Redemption claims by day of week, last 30 days
  redemptionByDay: [
    { day: 'Mon', claims: 50 },
    { day: 'Tue', claims: 27 },
    { day: 'Wed', claims: 43 },
    { day: 'Thu', claims: 25 },
    { day: 'Fri', claims: 21 },
    { day: 'Sat', claims: 34 },
    { day: 'Sun', claims: 24 },
  ],
  // Anonymized category benchmarking, Fitness category, this month
  comparison: {
    rankPercentile: 20,
    engagementMultiplier: 1.4,
    yourViewsPerWeek: 740,
    categoryMedianViewsPerWeek: 560,
    yourRedemptionRatePct: 7.0,
    categoryAvgRedemptionRatePct: 5.1,
  },
  deal: {
    dealLabel: '20% off your first personal training package',
    description: 'Certified Personal Trainer and Advanced Nutrition Coach. Full client packages built around your goals, lifestyle, and schedule, combining personalised training with nutrition coaching.',
  },
}

// ─── Small shared bits ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: SANS, fontSize: '12px', fontWeight: '600',
      color: GREY, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
    }}>
      {children}
    </p>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '16px', boxShadow: CARD_SHADOW,
      padding: '28px', ...style,
    }}>
      {children}
    </div>
  )
}

function TrendBadge({ deltaValue, deltaLabel, suffix = '%' }) {
  const positive = deltaValue >= 0
  const color = positive ? GREEN : RED
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={13} color={color} strokeWidth={2.4} />
      <span style={{ fontFamily: SANS, fontSize: '12px', fontWeight: '700', color }}>
        {positive ? '+' : ''}{deltaValue}{suffix}
      </span>
      <span style={{ fontFamily: SANS, fontSize: '11px', color: MUTED }}>{deltaLabel}</span>
    </div>
  )
}

// ─── Stat tile row ───────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, label, value, deltaValue, deltaLabel, suffix }) {
  return (
    <Card style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(30,58,95,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color={NAVY} strokeWidth={2} />
        </div>
        <SectionLabel>{label}</SectionLabel>
      </div>
      <p style={{ fontFamily: SERIF, fontSize: '34px', color: NAVY, marginTop: '14px', lineHeight: 1 }}>
        {value}
      </p>
      <div style={{ marginTop: '10px' }}>
        <TrendBadge deltaValue={deltaValue} deltaLabel={deltaLabel} suffix={suffix} />
      </div>
    </Card>
  )
}

// ─── Views over time chart (SVG line + area, single hue, hover crosshair) ───────

function niceCeil(n) {
  if (n <= 0) return 10
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)))
  const step = magnitude / 2
  return Math.ceil(n / step) * step
}

function ViewsChart({ series, periodLabel }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const width = 720
  const height = 220
  const padL = 44, padR = 16, padT = 16, padB = 30
  const plotW = width - padL - padR
  const plotH = height - padT - padB

  const maxVal = useMemo(() => niceCeil(Math.max(...series.map(d => d.value)) * 1.15), [series])
  const n = series.length

  const points = series.map((d, i) => {
    const x = padL + (n === 1 ? 0 : (i / (n - 1)) * plotW)
    const y = padT + plotH - (d.value / maxVal) * plotH
    return { ...d, x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * width
    let closest = 0
    let closestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX)
      if (dist < closestDist) { closestDist = dist; closest = i }
    })
    setHoverIdx(closest)
  }

  const hovered = hoverIdx !== null ? points[hoverIdx] : null

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={`Views over time for ${periodLabel}`}
      >
        {gridLines.map(g => {
          const y = padT + plotH - g * plotH
          return (
            <g key={g}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="rgba(30,58,95,0.08)" strokeWidth="1" />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontFamily={SANS} fontSize="10" fill={MUTED}>
                {Math.round(maxVal * g).toLocaleString()}
              </text>
            </g>
          )
        })}

        <path d={areaPath} fill="rgba(30,58,95,0.10)" stroke="none" />
        <path d={linePath} fill="none" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <text key={p.label} x={p.x} y={height - 6} textAnchor="middle" fontFamily={SANS} fontSize="10" fill={MUTED}>
            {i === 0 || i === points.length - 1 || i === hoverIdx ? p.label : (n <= 8 ? p.label : '')}
          </text>
        ))}

        {/* end point marker */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={NAVY} stroke="#FFFFFF" strokeWidth="2" />

        {hovered && (
          <>
            <line x1={hovered.x} x2={hovered.x} y1={padT} y2={padT + plotH} stroke="rgba(30,58,95,0.25)" strokeWidth="1" />
            <circle cx={hovered.x} cy={hovered.y} r="4" fill={NAVY} stroke="#FFFFFF" strokeWidth="2" />
          </>
        )}
      </svg>

      {hovered && (
        <div style={{
          position: 'absolute', top: '4px',
          left: `${Math.min(Math.max((hovered.x / width) * 100, 10), 90)}%`,
          transform: 'translateX(-50%)',
          background: NAVY, color: CREAM, borderRadius: '8px', padding: '6px 10px',
          fontFamily: SANS, fontSize: '11px', whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: CARD_SHADOW,
        }}>
          <strong style={{ fontWeight: 700 }}>{hovered.value.toLocaleString()}</strong> views &middot; {hovered.label}
        </div>
      )}
    </div>
  )
}

// ─── Ranked bar list (member engagement by institution) ────────────────────────

function RankBar({ name, claims, maxClaims, rank }) {
  const pctWidth = Math.max((claims / maxClaims) * 100, 4)
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px', gap: '10px' }}>
        <span style={{ fontFamily: SANS, fontSize: '13px', color: NAVY, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{
            fontFamily: SANS, fontSize: '10px', fontWeight: '700', color: MUTED,
            width: '14px', flexShrink: 0,
          }}>
            {rank}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </span>
        <span style={{ fontFamily: SANS, fontSize: '12px', color: GREY, flexShrink: 0 }}>{claims} claims</span>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(30,58,95,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pctWidth}%`, borderRadius: '4px', background: NAVY }} />
      </div>
    </div>
  )
}

// ─── Redemption by day of week (small bar chart) ────────────────────────────────

function DayOfWeekChart({ data }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const maxClaims = Math.max(...data.map(d => d.claims))
  const peakIdx = data.findIndex(d => d.claims === maxClaims)
  const barMaxHeight = 110

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: `${barMaxHeight + 44}px`, paddingTop: '20px' }}>
      {data.map((d, i) => {
        const h = Math.max((d.claims / maxClaims) * barMaxHeight, 6)
        const isPeak = i === peakIdx
        return (
          <div
            key={d.day}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {isPeak && (
              <span style={{
                fontFamily: SANS, fontSize: '9px', fontWeight: '700', color: GREEN,
                textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', whiteSpace: 'nowrap',
              }}>
                Busiest
              </span>
            )}
            {hoverIdx === i && (
              <div style={{
                position: 'absolute', bottom: `${h + 26}px`,
                background: NAVY, color: CREAM, borderRadius: '6px', padding: '4px 8px',
                fontFamily: SANS, fontSize: '11px', whiteSpace: 'nowrap', boxShadow: CARD_SHADOW, zIndex: 1,
              }}>
                <strong>{d.claims}</strong> claims
              </div>
            )}
            <div style={{
              width: '22px', maxWidth: '24px', height: `${h}px`, borderRadius: '4px 4px 0 0',
              background: NAVY, opacity: isPeak ? 1 : 0.5,
              transition: 'opacity 150ms',
            }} />
            <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY, marginTop: '8px' }}>{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Comparison paired bar (you vs anonymized category average) ────────────────

function ComparisonBar({ label, yourValue, categoryValue, suffix = '', captionPrefix }) {
  const maxV = Math.max(yourValue, categoryValue) * 1.1
  const yourPct = (yourValue / maxV) * 100
  const catPct = (categoryValue / maxV) * 100
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontFamily: SANS, fontSize: '13px', fontWeight: '600', color: NAVY, marginBottom: '10px' }}>{label}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY, width: '108px', flexShrink: 0 }}>You</span>
        <div style={{ flex: 1, height: '10px', borderRadius: '5px', background: 'rgba(30,58,95,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${yourPct}%`, borderRadius: '5px', background: NAVY }} />
        </div>
        <span style={{ fontFamily: SANS, fontSize: '12px', fontWeight: '700', color: NAVY, width: '52px', textAlign: 'right', flexShrink: 0 }}>
          {yourValue}{suffix}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY, width: '108px', flexShrink: 0 }}>Category average</span>
        <div style={{ flex: 1, height: '10px', borderRadius: '5px', background: 'rgba(30,58,95,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${catPct}%`, borderRadius: '5px', background: AMBER }} />
        </div>
        <span style={{ fontFamily: SANS, fontSize: '12px', fontWeight: '700', color: '#B45309', width: '52px', textAlign: 'right', flexShrink: 0 }}>
          {categoryValue}{suffix}
        </span>
      </div>

      {captionPrefix && (
        <p style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, marginTop: '6px' }}>{captionPrefix}</p>
      )}
    </div>
  )
}

const PAGE_STYLES = `
  .ppp-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .ppp-split-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; align-items: stretch; }
  .ppp-highlight-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .ppp-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
  @media (max-width: 820px) {
    .ppp-stat-grid { grid-template-columns: 1fr; }
    .ppp-split-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .ppp-highlight-grid { grid-template-columns: 1fr; }
  }
`

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function PartnerPortalPage() {
  const [range, setRange] = useState('month')
  const data = DEMO.ranges[range]
  const { engagementByInstitution, redemptionByDay, comparison, deal, partner } = DEMO
  const maxInstitutionClaims = Math.max(...engagementByInstitution.map(e => e.claims))

  return (
    <>
      <Helmet>
        <title>Partner Portal | UniBlueprint</title>
        <meta name="description" content="Your Lifestyle Blueprint partner performance dashboard: listing stats, member engagement, and anonymized category benchmarking." />
        <meta name="robots" content="noindex" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <div style={{ background: CREAM, minHeight: '100vh', padding: '48px 20px 88px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <Card style={{ marginBottom: '24px' }}>
            <div className="ppp-header-row">
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: SAND, borderRadius: '20px', padding: '5px 12px', marginBottom: '14px',
                }}>
                  <ShieldCheck size={13} color={NAVY} />
                  <span style={{ fontFamily: SANS, fontSize: '11px', fontWeight: '600', color: NAVY }}>
                    Logged in as {partner.name} &middot; Partner Portal
                  </span>
                </div>
                <h1 style={{ fontFamily: SERIF, fontSize: '32px', color: NAVY, lineHeight: 1.15 }}>
                  Welcome back, {partner.name}.
                </h1>
                <p style={{ fontFamily: SANS, fontSize: '14px', color: GREY, marginTop: '8px', maxWidth: '520px', lineHeight: 1.6 }}>
                  Here is how your Lifestyle Blueprint listing is performing, and how it compares to other {partner.category} partners on the platform.
                </p>
              </div>

              {/* Date range toggle (visual only) */}
              <div style={{
                display: 'inline-flex', background: SAND, borderRadius: '10px', padding: '4px', flexShrink: 0,
              }}>
                {Object.entries(DEMO.ranges).map(([key, r]) => (
                  <button
                    key={key}
                    onClick={() => setRange(key)}
                    style={{
                      border: 'none', cursor: 'pointer',
                      background: range === key ? NAVY : 'transparent',
                      color: range === key ? CREAM : GREY,
                      fontFamily: SANS, fontSize: '12px', fontWeight: '600',
                      borderRadius: '7px', padding: '8px 14px',
                      transition: 'background 150ms, color 150ms',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* ── YOUR LISTING PERFORMANCE ──────────────────────────────────── */}
          <div style={{ marginBottom: '10px' }}>
            <SectionLabel>Your listing performance &middot; {data.label}</SectionLabel>
          </div>
          <div className="ppp-stat-grid" style={{ marginBottom: '24px' }}>
            <StatTile
              icon={Eye} label="Views" value={data.views.toLocaleString()}
              deltaValue={data.viewsDeltaPct} deltaLabel={data.previousLabel}
            />
            <StatTile
              icon={Ticket} label="Deal claims" value={data.claims.toLocaleString()}
              deltaValue={data.claimsDeltaPct} deltaLabel={data.previousLabel}
            />
            <StatTile
              icon={Percent} label="Click-through rate" value={`${data.ctrPct}%`}
              deltaValue={data.ctrDeltaPp} deltaLabel={data.previousLabel} suffix="pp"
            />
          </div>

          {/* ── VIEWS OVER TIME ───────────────────────────────────────────── */}
          <Card style={{ marginBottom: '24px' }}>
            <p style={{ fontFamily: SERIF, fontSize: '19px', color: NAVY, marginBottom: '4px' }}>Views over time</p>
            <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, marginBottom: '18px' }}>
              How many members viewed your listing, {data.label.toLowerCase()}. Hover the chart for exact figures.
            </p>
            <ViewsChart series={data.viewsSeries} periodLabel={data.label} />
          </Card>

          {/* ── MEMBER ENGAGEMENT + REDEMPTION BY DAY ─────────────────────── */}
          <div className="ppp-split-grid" style={{ marginBottom: '24px' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <GraduationCap size={17} color={NAVY} />
                <p style={{ fontFamily: SERIF, fontSize: '19px', color: NAVY }}>Member engagement</p>
              </div>
              <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, marginBottom: '18px' }}>
                Where your claims are coming from, last 30 days.
              </p>
              {engagementByInstitution.map((inst, i) => (
                <RankBar
                  key={inst.name}
                  name={inst.name}
                  claims={inst.claims}
                  maxClaims={maxInstitutionClaims}
                  rank={i + 1}
                />
              ))}
            </Card>

            <Card>
              <p style={{ fontFamily: SERIF, fontSize: '19px', color: NAVY, marginBottom: '4px' }}>Redemption by day</p>
              <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, marginBottom: '4px' }}>
                Which days your deal gets claimed most, last 30 days. Useful for staffing and stock planning.
              </p>
              <DayOfWeekChart data={redemptionByDay} />
            </Card>
          </div>

          {/* ── HOW YOU COMPARE ───────────────────────────────────────────── */}
          <div style={{ marginBottom: '10px' }}>
            <SectionLabel>How you compare</SectionLabel>
          </div>
          <Card style={{ marginBottom: '24px' }}>
            <div className="ppp-highlight-grid" style={{ marginBottom: '24px' }}>
              <div style={{ background: 'rgba(22,163,74,0.08)', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ fontFamily: SERIF, fontSize: '26px', color: GREEN }}>Top {comparison.rankPercentile}%</p>
                <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, marginTop: '6px', lineHeight: 1.55 }}>
                  You rank in the top {comparison.rankPercentile}% of {partner.category} category partners by redemption rate this month.
                </p>
              </div>
              <div style={{ background: 'rgba(30,58,95,0.06)', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ fontFamily: SERIF, fontSize: '26px', color: NAVY }}>{comparison.engagementMultiplier}x</p>
                <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, marginTop: '6px', lineHeight: 1.55 }}>
                  Your average member engagement is {comparison.engagementMultiplier}x the {partner.category} category average.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: NAVY }} />
              <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY }}>You</span>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: AMBER, marginLeft: '10px' }} />
              <span style={{ fontFamily: SANS, fontSize: '11px', color: GREY }}>Category average</span>
            </div>

            <ComparisonBar
              label="Views per week"
              yourValue={comparison.yourViewsPerWeek}
              categoryValue={comparison.categoryMedianViewsPerWeek}
              captionPrefix={`Category median views per week: ${comparison.categoryMedianViewsPerWeek}. Your views per week: ${comparison.yourViewsPerWeek}.`}
            />
            <ComparisonBar
              label="Redemption rate"
              yourValue={comparison.yourRedemptionRatePct}
              categoryValue={comparison.categoryAvgRedemptionRatePct}
              suffix="%"
            />

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '22px',
              paddingTop: '18px', borderTop: '1px solid rgba(30,58,95,0.08)',
            }}>
              <Lock size={13} color={MUTED} style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED, lineHeight: 1.6 }}>
                Comparisons are anonymized category averages. We never share another partner's individual performance data or name them directly.
              </p>
            </div>
          </Card>

          {/* ── YOUR DEAL, AS MEMBERS SEE IT ──────────────────────────────── */}
          <div style={{ marginBottom: '10px' }}>
            <SectionLabel>Your deal, as members see it</SectionLabel>
          </div>
          <Card style={{ marginBottom: '24px', maxWidth: '380px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: NAVY, color: CREAM, borderRadius: '4px', padding: '3px 8px',
                fontFamily: SANS, fontSize: '10px', fontWeight: '700',
              }}>
                Pro Deal
              </span>

              <div style={{
                width: '56px', height: '56px', borderRadius: '12px', background: partner.initBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: SERIF, fontSize: '18px', color: '#FFFFFF' }}>{partner.initials}</span>
              </div>

              <p style={{ fontFamily: SERIF, fontSize: '20px', color: NAVY, marginTop: '14px' }}>{partner.name}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <span style={{ background: SAND, color: NAVY, borderRadius: '6px', padding: '3px 10px', fontFamily: SANS, fontSize: '11px' }}>
                  <Dumbbell size={10} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                  {partner.category}
                </span>
                <span style={{ background: 'rgba(20,90,62,0.1)', color: '#145A3E', borderRadius: '6px', padding: '3px 10px', fontFamily: SANS, fontSize: '11px', fontWeight: '600' }}>
                  {deal.dealLabel}
                </span>
              </div>

              <p style={{ fontFamily: SANS, fontSize: '13px', color: GREY, marginTop: '12px', lineHeight: 1.65 }}>
                {deal.description}
              </p>

              <div style={{ marginTop: '14px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: NAVY, color: CREAM, borderRadius: '20px', padding: '5px 12px',
                  fontFamily: SANS, fontSize: '12px',
                }}>
                  <Instagram size={12} />
                  @{partner.instagram}
                </span>
              </div>

              <p style={{ fontFamily: SANS, fontSize: '11px', color: MUTED, marginTop: '14px' }}>
                This is exactly how your listing renders to members in the Lifestyle Blueprint tab.
              </p>
            </div>
          </Card>

          {/* ── FOOTER NOTE ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '32px', textAlign: 'center' }}>
            <Mail size={12} color={MUTED} />
            <p style={{ fontFamily: SANS, fontSize: '12px', color: MUTED }}>
              Questions about your listing or performance? Contact your Partnership Contact or uniblueprintoperations@gmail.com.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
