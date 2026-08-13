import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

// ─── Design tokens ───────────────────────────────────────────────────────────
// Gold means "real, live, on the ground" — new, scoped to this map only.
const GOLD = '#C9A24B'
const GOLD_DEEP = '#A5813B'
const GOLD_LIGHT = '#E4C77E'
const GOLD_GLOW = 'rgba(201,162,75,0.4)'
const LOCKED = '#8B9BB5'
const NAVY = '#1E3A5F'

// ─── Ireland outline — derived from real county coordinates, not traced free-hand.
// viewBox 0 0 400 480. Smoothed through 53 coastal reference points (Malin Head,
// Fair Head, Carlingford Lough, Dublin Bay, Carnsore Point, Hook Head, the Cork/
// Kerry peninsulas, the Shannon Estuary, Galway Bay, Clew Bay, Donegal Bay…).
const IRELAND_PATH =
  'M 214.5 12 Q 249 4 259.5 7 Q 270 10 290 11 Q 310 12 327.5 17 Q 345 22 356.5 36 ' +
  'Q 368 50 359 61 Q 350 72 370 88.5 Q 390 105 379 120 Q 368 135 370 146.5 ' +
  'Q 372 158 352 168 Q 332 178 336 186.5 Q 340 195 332.5 207.5 Q 325 220 335 229 ' +
  'Q 345 238 336.5 246.5 Q 328 255 330.5 266.5 Q 333 278 341.5 285 Q 350 292 344 308.5 ' +
  'Q 338 325 330 351.5 Q 322 378 303.5 385 Q 285 392 267.5 395 Q 250 398 232.5 401 ' +
  'Q 215 404 196.5 412 Q 178 420 164 426 Q 150 432 130 433.5 Q 110 435 85 447.5 ' +
  'Q 60 460 56.5 467 Q 53 474 64 461 Q 75 448 61.5 451.5 Q 48 455 63 440 Q 78 425 54 420 ' +
  'Q 30 415 45 405 Q 60 395 37.5 391.5 Q 15 388 32.5 376.5 Q 50 365 30 360 Q 10 355 32.5 347.5 ' +
  'Q 55 340 57.5 330 Q 60 320 77.5 315 Q 95 310 70 304 Q 45 298 50 286.5 Q 55 275 70 265 ' +
  'Q 85 255 65 247.5 Q 45 240 32.5 231 Q 20 222 32.5 211 Q 45 200 55 192.5 Q 65 185 45 181.5 ' +
  'Q 25 178 35 166.5 Q 45 155 32.5 150 Q 20 145 52.5 146.5 Q 85 148 112.5 135 Q 140 122 145 115 ' +
  'Q 150 108 135 96.5 Q 120 85 132.5 70 Q 145 55 162.5 37.5 Q 180 20 214.5 12 Z'

const COUNTY_POS = {
  dublin: [316, 244], cork: [126, 426], galway: [118, 240], limerick: [141, 348],
  waterford: [243, 384], tipperary: [204, 336], kerry: [71, 390], wexford: [314, 354],
  kilkenny: [255, 336], meath: [302, 216], kildare: [282, 264], louth: [322, 180],
  wicklow: [322, 288], carlow: [282, 324], laois: [251, 288], offaly: [235, 264],
  westmeath: [247, 222], longford: [212, 204], roscommon: [173, 198], mayo: [86, 180],
  sligo: [157, 138], leitrim: [196, 150], cavan: [247, 168], monaghan: [278, 138],
  donegal: [188, 66], clare: [122, 306],
}

function at(county, jitter) {
  const [cx, cy] = COUNTY_POS[county]
  return jitter ? [cx + jitter[0], cy + jitter[1]] : [cx, cy]
}

// ─── Live: real listing, deep-links to the full Partners card ────────────────
const LIVE_PINS = [
  { id: 'mpfitness',    name: 'MPFitness',       category: 'Personal Training',        deal: 'Full package from €150/month',      pos: at('kildare') },
  { id: 'energie',      name: 'Energie Fitness', category: 'Gym Membership · Dublin 8', deal: 'From €37.99/month',                 pos: at('dublin', [-4, -16]) },
  { id: 'jmc',          name: 'JMC Fitness',     category: 'Sports Coaching',           deal: 'From €50/hr',                       pos: at('dublin', [-26, -6]) },
  { id: 'nyz3ditz',     name: 'Nyz3ditz',        category: 'Photography & Video',       deal: 'From €55/month',                    pos: at('dublin', [-10, 20]) },
  { id: 'efgrinds',     name: 'Emmanuel Fasanmi Grinds', category: 'Education & Coaching', deal: 'Pro member rates',               pos: at('dublin', [2, 4]) },
  { id: 'whipwizardz',  name: 'Whip Wizardz',    category: 'Automotive · Dundalk',      deal: 'Student-friendly pricing',          pos: at('louth', [-8, 10]) },
  { id: 'nailnurse',    name: 'The Nail Nurse',  category: 'Nail Tech',                 deal: 'Student discount with valid ID',    pos: at('galway', [-10, -8]) },
  { id: 'leva',         name: 'LEVA Impact',     category: 'Digital Marketing & Design', deal: 'One week free social media trial', pos: at('mayo', [-12, -8]) },
  { id: 'henrysisters', name: 'Henry Sisters Co',category: 'Creative Content',          deal: '10% off your first booking',        pos: at('mayo', [12, 8]) },
]

// ─── Incoming: one tier on the map. Some are named + placed exactly (they get
// the "Official Blueprint Partner" badge on tap); the rest stay anonymous
// until they're real. Visually identical — the pin never gives it away. ─────
const INCOMING_PINS = [
  // named, exact location
  { name: 'madebykelan',             category: 'Creative',          pos: at('mayo', [10, -18]) },
  { name: 'Manni The Barber',        category: 'Barber · Dundalk',  pos: at('louth', [2, 14]) },
  { name: 'Angelic Touch',           category: 'Hair',              pos: at('sligo', [-6, 6]) },
  { name: 'Angelic Touch',           category: 'Hair · 2nd location', pos: at('dublin', [-32, 10]) },
  { name: 'Archangel',               category: 'Clothing Brand',    pos: at('kildare', [16, 14]) },
  { name: "Clara's Beauty Room",     category: 'Nail Tech',         pos: at('mayo', [-4, 18]) },
  // named, confirmed with UniBlueprint but still placing
  { name: 'Carolynes Beauty Studio', category: 'Beauty Studio',     pos: at('clare') },
  { name: 'Makeup By Kasia',         category: 'Makeup',            pos: at('galway', [14, 10]) },
  { name: 'The PK Glam',             category: 'Beauty',            pos: at('kildare', [-16, -14]) },
  { name: 'Hardluck Club',           category: 'Venue',             pos: at('louth', [-16, -12]) },
  { name: 'Lashes By Steph',         category: 'Lash Tech',         pos: at('sligo', [14, -10]) },
  { name: 'Purple Brunch',           category: 'Food & Drink',      pos: at('sligo', [-16, 16]) },
  // anonymous — name withheld until it's real
  ...[
    'cork', 'limerick', 'waterford', 'tipperary', 'kerry', 'wexford', 'kilkenny',
    'meath', 'wicklow', 'carlow', 'laois', 'offaly', 'westmeath', 'longford',
    'roscommon', 'leitrim', 'cavan', 'monaghan', 'donegal',
  ].map(county => ({ name: null, category: null, pos: at(county) })),
].map((p, i) => ({ ...p, key: `incoming-${i}`, delay: i }))

const PING_INTERVAL_MS = 27000

const PMAP_STYLES = `
  .pmap-wrap { display: flex; flex-direction: column; align-items: center; gap: 22px; }
  .pmap-stage { position: relative; width: 100%; max-width: 800px; margin: 0 auto; }
  .pmap-svg { width: 100%; height: auto; display: block; overflow: visible; }
  .pmap-land { stroke: rgba(245,240,232,0.24); stroke-width: 1.3; }
  .pmap-coastline-inner { fill: none; stroke: rgba(245,240,232,0.13); stroke-width: 0.7; transform: scale(0.975); transform-box: fill-box; transform-origin: center; }
  .pmap-compass { opacity: 0.4; }

  .pmap-pin { cursor: pointer; opacity: 1; transition: opacity 260ms ease; }
  .pmap-pin:focus { outline: none; }
  .pmap-pin:focus-visible .pmap-tack-core,
  .pmap-pin:focus-visible .pmap-tack-sketch { stroke: #fff; stroke-width: 1.8px; }
  .pmap-pin.pmap-dim { opacity: 0.3; }
  .pmap-hit { fill: rgba(0,0,0,0.001); pointer-events: all; }

  .pmap-pin-inner {
    opacity: 0; transform: scale(0.4);
    transform-box: fill-box; transform-origin: center;
    transition: opacity 520ms ease, transform 520ms cubic-bezier(.34,1.56,.64,1);
    transition-delay: var(--pmap-delay, 0ms);
  }
  .pmap-wrap.pmap-arrived .pmap-pin-inner { opacity: 1; transform: scale(1); }

  /* Live — a solid, glossy blueprint tack. Fully seated. */
  .pmap-pin.gold .pmap-tack-core { fill: url(#pmapTackGold); stroke: ${GOLD_DEEP}; stroke-width: 0.9; transition: r 140ms ease; }
  .pmap-pin.gold .pmap-tack-shine { fill: rgba(255,250,235,0.75); }
  .pmap-pin.gold .pmap-halo { fill: ${GOLD_GLOW}; animation: pmapGoldPulse 2.8s ease-in-out infinite; }
  .pmap-pin.gold:hover .pmap-tack-core { r: 7.4; }
  .pmap-ping { fill: none; stroke: ${GOLD}; stroke-width: 1.4; animation: pmapPingOnce 1.9s ease-out forwards; }

  /* Incoming — the same tack, drafted but not inked: dashed outline, no fill. */
  .pmap-pin.grey .pmap-tack-sketch { fill: rgba(139,155,181,0.06); stroke: ${LOCKED}; stroke-width: 1.1; stroke-dasharray: 2.6 2.2; }
  .pmap-pin.grey .pmap-tack-cross { stroke: ${LOCKED}; stroke-width: 0.9; opacity: 0.75; }
  .pmap-pin.grey .pmap-shimmer { fill: transparent; stroke: ${LOCKED}; stroke-width: 1; opacity: 0; animation: pmapShimmer 6s ease-in-out infinite; }
  .pmap-pin.grey:hover .pmap-tack-sketch { stroke-width: 1.5; }

  @keyframes pmapGoldPulse { 0%,100% { r: 9.5; opacity: 0.6; } 50% { r: 14.5; opacity: 0.12; } }
  @keyframes pmapShimmer { 0%,100% { r: 5.5; opacity: 0; } 55% { r: 5.5; opacity: 0; } 72% { r: 10; opacity: 0.4; } 90% { r: 13; opacity: 0; } }
  @keyframes pmapPingOnce { 0% { r: 6.5; stroke-opacity: 0.7; } 100% { r: 24; stroke-opacity: 0; } }
  .pmap-shadow { fill: rgba(0,0,0,0.26); }

  @media (prefers-reduced-motion: reduce) {
    .pmap-pin.gold .pmap-halo, .pmap-pin.grey .pmap-shimmer, .pmap-ping { animation: none !important; }
    .pmap-pin-inner { transition: none; opacity: 1; transform: scale(1); }
  }

  .pmap-card {
    width: 100%; max-width: 460px;
    background: rgba(245,240,232,0.98);
    border-radius: 14px;
    box-shadow: 0 16px 34px rgba(0,0,0,0.28);
    padding: 18px 20px;
    display: flex; flex-direction: column; gap: 10px;
    min-height: 96px;
    justify-content: center;
  }
  .pmap-card.idle { background: rgba(245,240,232,0.06); box-shadow: none; border: 1px dashed rgba(245,240,232,0.18); }
  .pmap-legend { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .pmap-legend-item { display: flex; align-items: center; gap: 8px; font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 600; color: rgba(245,240,232,0.55); }

  @media (max-width: 640px) {
    .pmap-wrap { gap: 16px; }
    .pmap-card { padding: 15px 16px; min-height: 84px; }
    .pmap-legend { gap: 14px; }
    .pmap-legend-item { font-size: 10.5px; }
  }
`

function CompassMark() {
  return (
    <g className="pmap-compass" transform="translate(372,40)" aria-hidden="true">
      <circle r="12" fill="none" stroke="rgba(245,240,232,0.4)" strokeWidth="0.8" />
      <path d="M0,-9 L2.6,-1 L0,2.2 L-2.6,-1 Z" fill="rgba(245,240,232,0.55)" />
      <text x="0" y="-14.5" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="6.5" fontWeight="700" fill="rgba(245,240,232,0.5)">N</text>
    </g>
  )
}

// A blueprint tack — live pins are solid and seated, incoming pins are the
// same shape drafted in dashed line, not yet inked. Legend logo icon too.
function TackGlyph({ live, size = 1 }) {
  const r = 6.2 * size
  return live ? (
    <>
      <circle className="pmap-tack-core" r={r} />
      <ellipse className="pmap-tack-shine" cx={-r * 0.3} cy={-r * 0.36} rx={r * 0.34} ry={r * 0.21} />
    </>
  ) : (
    <>
      <circle className="pmap-tack-sketch" r={r} />
      <path className="pmap-tack-cross" d={`M0,${-r * 0.42} L0,${r * 0.42} M${-r * 0.42},0 L${r * 0.42},0`} />
    </>
  )
}

function Pin({ pinKey, live, x, y, dimmed, arriveDelay, ping, onClick, onKeyDown, label }) {
  return (
    <g
      className={`pmap-pin ${live ? 'gold' : 'grey'}${dimmed ? ' pmap-dim' : ''}`}
      transform={`translate(${x},${y})`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={label}
      data-pin={pinKey}
    >
      <circle className="pmap-hit" r={17} />
      <g className="pmap-pin-inner" style={{ '--pmap-delay': `${arriveDelay}ms` }}>
        <ellipse className="pmap-shadow" cx={0} cy={4} rx={5.6} ry={1.7} />
        {live && <circle className="pmap-halo" r={9.5} />}
        {!live && <circle className="pmap-shimmer" r={5.5} style={{ animationDelay: `${(arriveDelay % 6) * 0.9}s` }} />}
        {ping && <circle key={ping} className="pmap-ping" r={6.5} />}
        <TackGlyph live={live} />
      </g>
    </g>
  )
}

export default function PartnerMap() {
  const [active, setActive] = useState(null)
  const [arrived, setArrived] = useState(false)
  const [ping, setPing] = useState(null)
  const wrapRef = useRef(null)
  const nonceRef = useRef(0)

  // One-time arrival — the map "switches on" the first time it scrolls into view.
  useEffect(() => {
    const wrapEl = wrapRef.current
    if (!wrapEl) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setArrived(true); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(wrapEl)
    return () => obs.disconnect()
  }, [])

  // A rare signal ping from a random live partner — quiet proof the network's active.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const intervalId = setInterval(() => {
      nonceRef.current += 1
      setPing({ pinId: LIVE_PINS[Math.floor(Math.random() * LIVE_PINS.length)].id, nonce: nonceRef.current })
    }, PING_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [])

  function select(pinKey, data) {
    setActive(prev => (prev && prev.pinKey === pinKey ? null : { pinKey, ...data }))
  }
  function onKey(e, pinKey, data) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(pinKey, data) }
  }

  return (
    <div ref={wrapRef} className={`pmap-wrap${arrived ? ' pmap-arrived' : ''}`}>
      <style>{PMAP_STYLES}</style>

      <div className="pmap-stage">
        <svg
          className="pmap-svg"
          viewBox="0 0 400 480"
          role="group"
          aria-label="Interactive map of Ireland showing UniBlueprint partner locations"
        >
          <defs>
            <radialGradient id="pmapLandFill" cx="35%" cy="20%" r="90%">
              <stop offset="0%" stopColor="rgba(245,240,232,0.115)" />
              <stop offset="55%" stopColor="rgba(245,240,232,0.06)" />
              <stop offset="100%" stopColor="rgba(245,240,232,0.03)" />
            </radialGradient>
            <radialGradient id="pmapTackGold" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor={GOLD_LIGHT} />
              <stop offset="55%" stopColor={GOLD} />
              <stop offset="100%" stopColor={GOLD_DEEP} />
            </radialGradient>
          </defs>

          <path className="pmap-land" d={IRELAND_PATH} fill="url(#pmapLandFill)" />
          <path className="pmap-coastline-inner" d={IRELAND_PATH} />
          <CompassMark />

          {INCOMING_PINS.map(p => (
            <Pin
              key={p.key}
              pinKey={p.key}
              live={false}
              x={p.pos[0]} y={p.pos[1]}
              arriveDelay={p.delay * 12}
              dimmed={active && active.pinKey !== p.key}
              label={p.name ? `${p.name}, ${p.category} — Official Blueprint Partner, launching soon` : 'Unconfirmed partner — coming soon'}
              onClick={() => select(p.key, { live: false, name: p.name, category: p.category })}
              onKeyDown={e => onKey(e, p.key, { live: false, name: p.name, category: p.category })}
            />
          ))}

          {LIVE_PINS.map((p, i) => (
            <Pin
              key={p.id}
              pinKey={p.id}
              live
              x={p.pos[0]} y={p.pos[1]}
              arriveDelay={260 + i * 50}
              dimmed={active && active.pinKey !== p.id}
              ping={ping && ping.pinId === p.id ? `ping-${ping.nonce}` : null}
              label={`${p.name}, ${p.category} — live partner. View details.`}
              onClick={() => select(p.id, { live: true, ...p })}
              onKeyDown={e => onKey(e, p.id, { live: true, ...p })}
            />
          ))}
        </svg>
      </div>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      {active ? (
        <div className="pmap-card">
          {active.live && (
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

          {!active.live && active.name && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
                <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '17px', color: NAVY, margin: 0 }}>{active.name}</p>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, color: LOCKED, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, textAlign: 'right' }}>Official Blueprint Partner</span>
              </div>
              <span style={{ alignSelf: 'flex-start', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: NAVY, background: 'rgba(30,58,95,0.08)', borderRadius: '6px', padding: '3px 9px' }}>{active.category}</span>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.55 }}>
                On board with UniBlueprint — full listing and deal launch soon.
              </p>
            </>
          )}

          {!active.live && !active.name && (
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
        <span className="pmap-legend-item">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="6" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.8" /></svg>
          Live Partner
        </span>
        <span className="pmap-legend-item">
          <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="6" fill="none" stroke={LOCKED} strokeWidth="1.2" strokeDasharray="2.4 2" /></svg>
          New Partner Incoming
        </span>
      </div>
    </div>
  )
}
