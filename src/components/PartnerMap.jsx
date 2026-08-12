import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

// ─── Design tokens ───────────────────────────────────────────────────────────
// Gold is new and scoped to this map only — it means "real, live, on the ground".
// Amber reuses the site's existing TBC/shell colour, so "confirmed, not live yet"
// reads the same way it already does on the Partners page.
const GOLD = '#C9A24B'
const GOLD_DEEP = '#A5813B'
const GOLD_GLOW = 'rgba(201,162,75,0.4)'
const AMBER = '#F59E0B'
const AMBER_GLOW = 'rgba(245,158,11,0.28)'
const LOCKED = '#8B9BB5'
const CREAM = '#F5F0E8'
const NAVY = '#1E3A5F'

// ─── Simplified Republic of Ireland outline (viewBox 0 0 360 400) ────────────
const IRELAND_PATH =
  'M 185 12 L 215 24 L 232 44 L 248 75 L 262 108 L 252 130 L 260 156 ' +
  'L 263 180 L 259 204 L 253 226 L 243 252 L 232 276 L 218 302 L 200 325 ' +
  'L 180 346 L 160 360 L 138 368 L 112 370 L 88 374 L 66 369 L 46 363 ' +
  'L 28 350 L 20 330 L 16 308 L 20 284 L 28 260 L 40 240 L 56 226 ' +
  'L 64 236 L 42 242 L 26 226 L 16 205 L 20 184 L 30 168 L 40 156 ' +
  'L 30 138 L 40 123 L 56 113 L 78 108 L 100 103 L 118 96 L 128 86 ' +
  'L 122 73 L 106 60 L 100 48 L 116 36 L 136 26 L 152 18 L 166 12 ' +
  'L 178 9 L 185 12 Z'

const COUNTY_POS = {
  dublin: [259, 200], cork: [142, 362], galway: [64, 232], limerick: [94, 296],
  waterford: [212, 344], tipperary: [152, 298], kerry: [58, 342], wexford: [246, 330],
  kilkenny: [198, 308], meath: [228, 174], kildare: [218, 224], louth: [254, 148],
  wicklow: [262, 252], carlow: [218, 298], laois: [188, 268], offaly: [168, 238],
  westmeath: [176, 200], longford: [156, 188], roscommon: [110, 186], mayo: [60, 148],
  sligo: [90, 112], leitrim: [118, 130], cavan: [196, 140], monaghan: [214, 128],
  donegal: [108, 52], clare: [80, 258],
}

function at(county, jitter) {
  const [cx, cy] = COUNTY_POS[county]
  return jitter ? [cx + jitter[0], cy + jitter[1]] : [cx, cy]
}

// ─── Tier 1 — live: real listing, deep-links to the full Partners card ───────
const LIVE_PINS = [
  { id: 'mpfitness',    name: 'MPFitness',       category: 'Personal Training',        deal: 'Full package from €150/month',      pos: at('kildare') },
  { id: 'energie',      name: 'Energie Fitness', category: 'Gym Membership · Dublin 8', deal: 'From €37.99/month',                 pos: at('dublin', [16, -8]) },
  { id: 'jmc',          name: 'JMC Fitness',     category: 'Sports Coaching',           deal: 'From €50/hr',                       pos: at('dublin', [-16, -8]) },
  { id: 'nyz3ditz',     name: 'Nyz3ditz',        category: 'Photography & Video',       deal: 'From €55/month',                    pos: at('dublin', [0, 20]) },
  { id: 'efgrinds',     name: 'Emmanuel Fasanmi Grinds', category: 'Education & Coaching', deal: 'Pro member rates',               pos: at('dublin', [30, 12]) },
  { id: 'whipwizardz',  name: 'Whip Wizardz',    category: 'Automotive · Dundalk',      deal: 'Student-friendly pricing',          pos: at('louth', [-8, 10]) },
  { id: 'nailnurse',    name: 'The Nail Nurse',  category: 'Nail Tech',                 deal: 'Student discount with valid ID',    pos: at('galway', [-10, -8]) },
  { id: 'leva',         name: 'LEVA Impact',     category: 'Digital Marketing & Design', deal: 'One week free social media trial', pos: at('mayo', [-12, -8]) },
  { id: 'henrysisters', name: 'Henry Sisters Co',category: 'Creative Content',          deal: '10% off your first booking',        pos: at('mayo', [12, 8]) },
]

// ─── Tier 2 — confirmed: real name + category, full profile not published yet.
// Some have an exact county, some are confirmed-but-still-placing (scattered).
const NAMED_SOON_PINS = [
  { name: 'madebykelan',              category: 'Creative',          pos: at('mayo', [10, -18]) },
  { name: 'Manni The Barber',         category: 'Barber · Dundalk',  pos: at('louth', [16, 12]) },
  { name: 'Angelic Touch',            category: 'Hair',              pos: at('sligo', [-6, 6]) },
  { name: 'Angelic Touch',            category: 'Hair · 2nd location', pos: at('dublin', [-30, 14]) },
  { name: 'Archangel',                category: 'Clothing Brand',    pos: at('kildare', [16, 14]) },
  { name: "Clara's Beauty Room",      category: 'Nail Tech',         pos: at('mayo', [-4, 18]) },
  // confirmed with UniBlueprint, location still being finalised
  { name: 'Carolynes Beauty Studio',  category: 'Beauty Studio',     pos: at('clare') },
  { name: 'Makeup By Kasia',          category: 'Makeup',            pos: at('galway', [14, 10]) },
  { name: 'The PK Glam',              category: 'Beauty',            pos: at('kildare', [-16, -14]) },
  { name: 'Hardluck Club',            category: 'Venue',             pos: at('louth', [-16, -12]) },
  { name: 'Lashes By Steph',          category: 'Lash Tech',         pos: at('sligo', [14, -10]) },
  { name: 'Purple Brunch',            category: 'Food & Drink',      pos: at('sligo', [-16, 16]) },
]

// ─── Tier 3 — unconfirmed: name withheld until it's real. One per county below,
// standing in for madebykelan (Ocean1, Fortesce, etc.) awaiting confirmation. ─
const MYSTERY_COUNTIES = [
  'cork', 'limerick', 'waterford', 'tipperary', 'kerry', 'wexford', 'kilkenny',
  'meath', 'wicklow', 'carlow', 'laois', 'offaly', 'westmeath', 'longford',
  'roscommon', 'leitrim', 'cavan', 'monaghan', 'donegal',
]
const MYSTERY_PINS = MYSTERY_COUNTIES.map((county, i) => ({ key: `mystery-${county}`, pos: at(county), delay: i }))

const PMAP_STYLES = `
  .pmap-wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .pmap-stage { position: relative; width: 100%; max-width: 380px; }
  .pmap-svg { width: 100%; height: auto; display: block; overflow: visible; }
  .pmap-land { fill: rgba(245,240,232,0.065); stroke: rgba(245,240,232,0.22); stroke-width: 1.4; }
  .pmap-pin { cursor: pointer; }
  .pmap-pin:focus { outline: none; }
  .pmap-pin:focus-visible circle.pmap-core { stroke: #fff; stroke-width: 1.6px; }
  .pmap-pin.gold circle.pmap-core { fill: ${GOLD}; stroke: ${GOLD_DEEP}; stroke-width: 0.8; transition: r 140ms ease; }
  .pmap-pin.gold circle.pmap-halo { fill: ${GOLD_GLOW}; animation: pmapGoldPulse 2.8s ease-in-out infinite; }
  .pmap-pin.gold:hover circle.pmap-core { r: 6.5; }
  .pmap-pin.amber circle.pmap-core { fill: ${AMBER}; stroke: rgba(0,0,0,0.15); stroke-width: 0.6; }
  .pmap-pin.amber circle.pmap-ring { fill: none; stroke: ${AMBER_GLOW}; stroke-width: 3; }
  .pmap-pin.amber:hover circle.pmap-core { r: 5; }
  .pmap-pin.grey circle.pmap-core { fill: ${LOCKED}; opacity: 0.85; }
  .pmap-pin.grey circle.pmap-shimmer { fill: transparent; stroke: ${LOCKED}; stroke-width: 1; opacity: 0; animation: pmapShimmer 5.5s ease-in-out infinite; }
  .pmap-pin.grey:hover circle.pmap-core { opacity: 1; }
  @keyframes pmapGoldPulse { 0%,100% { r: 8.5; opacity: 0.6; } 50% { r: 13; opacity: 0.12; } }
  @keyframes pmapShimmer { 0%,100% { r: 5; opacity: 0; } 55% { r: 5; opacity: 0; } 72% { r: 9; opacity: 0.45; } 90% { r: 11.5; opacity: 0; } }
  .pmap-shadow { fill: rgba(0,0,0,0.28); }
  @media (prefers-reduced-motion: reduce) {
    .pmap-pin.gold circle.pmap-halo, .pmap-pin.grey circle.pmap-shimmer { animation: none !important; }
  }

  .pmap-card {
    width: 100%; max-width: 380px;
    background: rgba(245,240,232,0.98);
    border-radius: 14px;
    box-shadow: 0 16px 34px rgba(0,0,0,0.28);
    padding: 18px 20px;
    display: flex; flex-direction: column; gap: 10px;
    min-height: 96px;
    justify-content: center;
  }
  .pmap-card.idle { background: rgba(245,240,232,0.06); box-shadow: none; border: 1px dashed rgba(245,240,232,0.18); }
  .pmap-legend { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; }
  .pmap-legend-item { display: flex; align-items: center; gap: 7px; font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 600; color: rgba(245,240,232,0.55); }
  .pmap-legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
`

function Pin({ tier, x, y, onClick, onKeyDown, label, delay = 0 }) {
  const cls = tier === 'live' ? 'gold' : tier === 'named' ? 'amber' : 'grey'
  return (
    <g
      className={`pmap-pin ${cls}`}
      transform={`translate(${x},${y})`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={label}
      style={cls === 'grey' ? { animationDelay: `${(delay % 6) * 0.7}s` } : undefined}
    >
      <ellipse className="pmap-shadow" cx={0} cy={3.5} rx={5} ry={1.5} />
      {cls === 'gold' && <circle className="pmap-halo" r={8.5} />}
      {cls === 'amber' && <circle className="pmap-ring" r={7.5} />}
      {cls === 'grey' && <circle className="pmap-shimmer" r={5} style={{ animationDelay: `${(delay % 6) * 0.9}s` }} />}
      <circle className="pmap-core" r={cls === 'grey' ? 3.6 : 5.5} />
    </g>
  )
}

export default function PartnerMap() {
  const [active, setActive] = useState(null)

  function select(pin) {
    setActive(prev => (prev && prev.tier === pin.tier && prev.name === pin.name ? null : pin))
  }
  function onKey(e, pin) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(pin) }
  }

  return (
    <div className="pmap-wrap">
      <style>{PMAP_STYLES}</style>

      <div className="pmap-stage">
        <svg
          className="pmap-svg"
          viewBox="0 0 360 400"
          role="group"
          aria-label="Interactive map of Ireland showing UniBlueprint partner locations"
        >
          <path className="pmap-land" d={IRELAND_PATH} />

          {MYSTERY_PINS.map(p => (
            <Pin
              key={p.key}
              tier="mystery"
              x={p.pos[0]} y={p.pos[1]}
              delay={p.delay}
              label="Unconfirmed partner — coming soon"
              onClick={() => select({ tier: 'mystery' })}
              onKeyDown={e => onKey(e, { tier: 'mystery' })}
            />
          ))}

          {NAMED_SOON_PINS.map((p, i) => (
            <Pin
              key={`${p.name}-${i}`}
              tier="named"
              x={p.pos[0]} y={p.pos[1]}
              label={`${p.name}, ${p.category} — confirmed, launching soon`}
              onClick={() => select({ tier: 'named', ...p })}
              onKeyDown={e => onKey(e, { tier: 'named', ...p })}
            />
          ))}

          {LIVE_PINS.map(p => (
            <Pin
              key={p.id}
              tier="live"
              x={p.pos[0]} y={p.pos[1]}
              label={`${p.name}, ${p.category} — live partner. View details.`}
              onClick={() => select({ tier: 'live', ...p })}
              onKeyDown={e => onKey(e, { tier: 'live', ...p })}
            />
          ))}
        </svg>
      </div>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      {active ? (
        <div className="pmap-card">
          {active.tier === 'live' && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: NAVY, margin: 0 }}>{active.name}</p>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, color: GOLD_DEEP, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Live</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: NAVY, background: 'rgba(30,58,95,0.08)', borderRadius: '6px', padding: '3px 9px' }}>{active.category}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: GOLD_DEEP, background: GOLD_GLOW, borderRadius: '6px', padding: '3px 9px' }}>{active.deal}</span>
              </div>
              <Link
                to={`/partners#${active.id}`}
                style={{
                  alignSelf: 'flex-start', marginTop: '2px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 700,
                  color: NAVY, textDecoration: 'none', borderBottom: `1.5px solid ${GOLD}`, paddingBottom: '1px',
                }}
              >
                View full listing →
              </Link>
            </>
          )}

          {active.tier === 'named' && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: NAVY, margin: 0 }}>{active.name}</p>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Confirmed</span>
              </div>
              <span style={{ alignSelf: 'flex-start', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: NAVY, background: 'rgba(30,58,95,0.08)', borderRadius: '6px', padding: '3px 9px' }}>{active.category}</span>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.55 }}>
                On board with UniBlueprint — full listing and deal launch soon.
              </p>
            </>
          )}

          {active.tier === 'mystery' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(139,155,181,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lock size={14} color={LOCKED} strokeWidth={2} />
                </div>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '16px', color: NAVY, margin: 0 }}>A new partner is joining soon</p>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.55 }}>
                We're not ready to share who yet — check back as the map fills in.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="pmap-card idle">
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: 'rgba(245,240,232,0.5)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
            Tap a pin to see who's there.
          </p>
        </div>
      )}

      <div className="pmap-legend">
        <span className="pmap-legend-item"><span className="pmap-legend-dot" style={{ background: GOLD }} /> Live partner</span>
        <span className="pmap-legend-item"><span className="pmap-legend-dot" style={{ background: AMBER }} /> Confirmed, launching soon</span>
        <span className="pmap-legend-item"><span className="pmap-legend-dot" style={{ background: LOCKED }} /> New partner incoming</span>
      </div>
    </div>
  )
}
