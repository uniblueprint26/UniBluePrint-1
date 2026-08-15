import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Search, X } from 'lucide-react'

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
const COUNTY_LABEL = Object.fromEntries(Object.keys(COUNTY_POS).map(k => [k, k[0].toUpperCase() + k.slice(1)]))

// Every label's Y position, resolved offline against every pin group and
// every other label so nothing overlaps (see the packing script this was
// generated with) — re-run it rather than nudging one value by eye if the
// roster changes again, the same way the pin positions below were.
const LABEL_Y = {
  dublin: 263.5, cork: 438, galway: 254.3, limerick: 360, waterford: 396, tipperary: 348,
  kerry: 402, wexford: 366, kilkenny: 348, meath: 208, kildare: 278.3, louth: 194.3,
  wicklow: 300, carlow: 336, laois: 300, offaly: 276, westmeath: 234, longford: 216,
  roscommon: 190, mayo: 194.3, sligo: 152.3, leitrim: 162, cavan: 180, monaghan: 150,
  donegal: 78, clare: 318,
}

// ─── Live: real listing, deep-links to the full Partners card. Positions
// below were generated with a packing script: partners sharing a county are
// arranged in a tight, centred grid (not scattered), ray-cast against the
// real coastline, checked against every other pin on the whole map — not
// just its own county — so nothing overlaps or sits in the sea. Re-run the
// script rather than hand-tweaking a single offset if the roster changes. ────
const LIVE_PINS = [
  { id: 'mpfitness',         name: 'MPFitness',               county: 'kildare', category: 'Personal Training',                deal: 'Full package from €150/month',      pos: [276.8, 258.8] },
  { id: 'energie',           name: 'Energie Fitness',          county: 'dublin',  category: 'Gym Membership · Dublin 8',        deal: 'From €37.99/month',                  pos: [300.3, 233.5] },
  { id: 'jmc',               name: 'JMC Fitness',              county: 'dublin',  category: 'Sports Coaching',                  deal: 'From €50/hr',                        pos: [310.8, 233.5] },
  { id: 'nyz3ditz',          name: 'Nyz3ditz',                 county: 'dublin',  category: 'Photography & Video',              deal: 'From €55/month',                     pos: [321.3, 233.5] },
  { id: 'camila',            name: 'Camila Aruk',              county: 'dublin',  category: 'Personal Training · Muay Thai · Yoga', deal: 'PT from €60/session',            pos: [331.8, 233.5] },
  { id: 'elect',             name: 'Elect',                    county: 'dublin',  category: 'Clothing Brand',                   deal: '10% off with code ELECTXUNIBLUEPRINT', pos: [300.3, 244] },
  { id: 'eabakeditt',        name: 'Eabakeditt',               county: 'dublin',  category: 'Home Baking · Dublin 15',          deal: '€5 off every item (cookie pouches to €1.50)', pos: [310.8, 244] },
  { id: 'royaltyproductions',name: 'Royalty Productions',      county: 'dublin',  category: 'Photography · Dublin',             deal: '10% off for verified UniBlueprint users', pos: [321.3, 244] },
  { id: 'poiemadexigns',     name: 'Poiema Dexigns',           county: 'dublin',  category: 'Web Design & Branding',            pos: [331.8, 244] },
  { id: 'coded69studios',    name: 'Coded69 Studios',          county: 'dublin',  category: 'Photography, Printing & Studio Rental · Tallaght', deal: '10% discount for UniBlueprint members', pos: [305.5, 254.5] },
  { id: 'whipwizardz',       name: 'Whip Wizardz',             county: 'louth',   category: 'Automotive · Dundalk',             deal: 'Student-friendly pricing',           pos: [311.5, 174.8] },
  { id: 'ilashedbydiya',     name: 'ilashedbydiya',            county: 'louth',   category: 'Lash Tech · Dundalk',              deal: '10% off first appointment',          pos: [322, 174.8] },
  { id: 'nailnurse',         name: 'The Nail Nurse',           county: 'galway',  category: 'Nail Tech',                        deal: 'Student discount with valid ID',     pos: [112.8, 234.8] },
  { id: 'veeslash',          name: 'Vees Lash Studio',         county: 'galway',  category: 'Lash Tech · Galway',               deal: 'From €40',                           pos: [123.3, 234.8] },
  { id: 'leva',              name: 'LEVA Impact',              county: 'mayo',    category: 'Digital Marketing & Design',       deal: 'One week free social media trial',   pos: [75.5, 174.8] },
  { id: 'henrysisters',      name: 'Henry Sisters Co',         county: 'mayo',    category: 'Creative Content',                 deal: '10% off your first booking',         pos: [86, 174.8] },
  { id: 'kelan',             name: 'Made By Kelan',            county: 'mayo',    category: 'Photography & Video · Co. Mayo',   pos: [96.5, 174.8] },
  { id: 'claras',            name: "Clara's Beauty Room",      county: 'mayo',    category: 'Nail Tech · Mayo',                 deal: 'Gel extensions from €40',            pos: [75.5, 185.3] },
  { id: 'zvisionapparel',    name: 'Z Vision Apparel',         county: 'mayo',    category: 'Custom Embroidery & Clothing · Co. Mayo', pos: [86, 185.3] },
  { id: 'lashessteph',       name: 'Lashes By Steph',          county: 'kildare', category: 'Lash Tech · Kildare',              deal: 'Classics from €35',                  pos: [287.3, 258.8] },
  { id: 'cutbyire',          name: 'CutbyIre',                 county: 'sligo',   category: 'Barber · Sligo',                   deal: 'From €15',                           pos: [151.8, 132.8] },
]
// Not on the map yet — no county on file: Saiemsent, Roomy.ie (nationwide).

// ─── Incoming: one tier on the map. Named ones get the "Official Blueprint
// Partner" badge on tap; the rest stay anonymous until they're real — visually
// identical, the pin never gives it away. ─────────────────────────────────────
const INCOMING_NAMED = [
  { name: 'Manni The Barber',        county: 'louth',   category: 'Barber · Dundalk',           pos: [332.5, 174.8] },
  { name: 'MM Cutz',                 county: 'dublin',  category: 'Barber · Dublin',            pos: [316, 254.5] },
  { name: 'Cut by Alind',            county: 'mayo',    category: 'Barber · Mayo',               pos: [96.5, 185.3] },
  { name: 'The Drogheda Foodie',     county: 'louth',   category: 'Food & Drink · Louth',       pos: [316.8, 185.3] },
  // Dylan Power sits exactly at the Cork anchor — the only pin there.
  { name: 'Dylan Power',             county: 'cork',    category: 'Sports Photographer · Cork', pos: COUNTY_POS.cork },
  { name: 'Angelic Touch',           county: 'sligo',   category: 'Hair',                      pos: [162.3, 132.8] },
  { name: 'Angelic Touch',           county: 'dublin',  category: 'Hair · 2nd location',       pos: [326.5, 254.5] },
  { name: 'Archangel',               county: 'kildare', category: 'Clothing Brand',            pos: [276.8, 269.3] },
  // named, confirmed with UniBlueprint but still placing — sole pin in Clare
  { name: 'Carolynes Beauty Studio', county: 'clare',   category: 'Beauty Studio',             pos: COUNTY_POS.clare },
  { name: 'Makeup By Kasia',         county: 'galway',  category: 'Makeup',                    pos: [118, 245.3] },
  { name: 'The PK Glam',             county: 'kildare', category: 'Beauty',                    pos: [287.3, 269.3] },
  { name: 'Hardluck Club',           county: 'louth',   category: 'Food & Drink',              pos: [327.3, 185.3] },
  { name: 'Purple Brunch',           county: 'sligo',   category: 'Food & Drink',              pos: [157, 143.3] },
]
// Anonymous — name withheld until it's real, one per county still without a
// named partner. Cork is excluded: Dylan Power already occupies it.
const MYSTERY_COUNTIES = [
  'limerick', 'waterford', 'tipperary', 'kerry', 'wexford', 'kilkenny',
  'meath', 'wicklow', 'carlow', 'laois', 'offaly', 'westmeath', 'longford',
  'roscommon', 'leitrim', 'cavan', 'monaghan', 'donegal',
]
const MYSTERY_PINS = MYSTERY_COUNTIES.map(county => ({ county, pos: COUNTY_POS[county] }))

// Every county that has more than one pin — these render smaller, calmer
// (no pulsing halo/shimmer), and get a soft backing plate behind them so a
// crowded county reads as one tidy, intentional group instead of clutter.
// A solo pin elsewhere stays full-size and animated; it can afford to.
const GROUP_BOUNDS = (() => {
  const byCounty = {}
  ;[...LIVE_PINS, ...INCOMING_NAMED].forEach(p => {
    if (!byCounty[p.county]) byCounty[p.county] = []
    byCounty[p.county].push(p.pos)
  })
  const bounds = {}
  Object.entries(byCounty).forEach(([county, positions]) => {
    if (positions.length < 2) return
    const xs = positions.map(p => p[0]), ys = positions.map(p => p[1])
    bounds[county] = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), count: positions.length }
  })
  return bounds
})()
const GROUPED_COUNTIES = new Set(Object.keys(GROUP_BOUNDS))

// Flat, searchable index — every live + named-incoming partner plus every
// county label, so the search box can jump straight to any of them.
const SEARCH_INDEX = [
  ...LIVE_PINS.map(p => ({ kind: 'live', id: p.id, name: p.name, county: p.county, sub: p.category, pos: p.pos })),
  ...INCOMING_NAMED.map((p, i) => ({ kind: 'incoming', id: `incoming-${i}`, name: p.name, county: p.county, sub: p.category, pos: p.pos })),
  ...Object.values(COUNTY_LABEL).map(label => ({ kind: 'county', id: label, name: label, county: label.toLowerCase(), sub: 'County' })),
]

const PING_INTERVAL_MS = 27000

const PMAP_STYLES = `
  .pmap-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .pmap-search { position: relative; width: 100%; max-width: 460px; }
  .pmap-search-input-row {
    display: flex; align-items: center; gap: 8px;
    background: rgba(245,240,232,0.08); border: 1px solid rgba(245,240,232,0.18);
    border-radius: 10px; padding: 9px 12px;
  }
  .pmap-search-input-row:focus-within { border-color: rgba(201,162,75,0.55); background: rgba(245,240,232,0.12); }
  .pmap-search-input {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: ${'#F5F0E8'};
  }
  .pmap-search-input::placeholder { color: rgba(245,240,232,0.45); }
  .pmap-search-clear { display: flex; cursor: pointer; opacity: 0.6; }
  .pmap-search-clear:hover { opacity: 1; }
  .pmap-search-results {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 5;
    background: #F5F0E8; border-radius: 10px; box-shadow: 0 16px 34px rgba(0,0,0,0.3);
    overflow: hidden; max-height: 260px; overflow-y: auto;
  }
  .pmap-search-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 10px 14px; cursor: pointer; text-align: left; width: 100%;
    background: none; border: none; border-bottom: 1px solid rgba(30,58,95,0.06);
    font-family: 'DM Sans', sans-serif;
  }
  .pmap-search-row:last-child { border-bottom: none; }
  .pmap-search-row:hover, .pmap-search-row:focus-visible { background: rgba(30,58,95,0.06); }
  .pmap-search-row-name { font-size: 13px; font-weight: 600; color: ${NAVY}; }
  .pmap-search-row-sub { font-size: 11px; color: #6B7280; margin-top: 1px; }
  .pmap-search-row-tag {
    flex-shrink: 0; font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em;
    text-transform: uppercase; padding: 3px 7px; border-radius: 5px;
  }
  .pmap-search-empty { padding: 14px; font-size: 12.5px; color: #6B7280; text-align: center; }

  .pmap-stage { position: relative; width: 100%; max-width: 800px; margin: 0 auto; }
  .pmap-svg { width: 100%; height: auto; display: block; overflow: visible; }
  .pmap-land { stroke: rgba(245,240,232,0.24); stroke-width: 1.3; }
  .pmap-coastline-inner { fill: none; stroke: rgba(245,240,232,0.13); stroke-width: 0.7; transform: scale(0.975); transform-box: fill-box; transform-origin: center; }
  .pmap-compass { opacity: 0.4; }
  .pmap-group-plate { fill: rgba(245,240,232,0.05); stroke: rgba(245,240,232,0.14); stroke-width: 0.8; }
  .pmap-label { font-family: 'DM Sans', sans-serif; font-weight: 600; fill: rgba(245,240,232,0.5); text-anchor: middle; letter-spacing: 0.02em; }

  .pmap-pin { cursor: pointer; opacity: 1; transition: opacity 260ms ease; }
  .pmap-pin:focus { outline: none; }
  .pmap-pin:focus-visible .pmap-tack-core,
  .pmap-pin:focus-visible .pmap-tack-sketch { stroke: #fff; stroke-width: 1.8px; }
  .pmap-pin.pmap-dim { opacity: 0.28; }
  .pmap-pin.pmap-match { opacity: 1; }
  .pmap-hit { fill: rgba(0,0,0,0.001); pointer-events: all; }

  .pmap-pin-inner {
    opacity: 0; transform: scale(0.4);
    transform-box: fill-box; transform-origin: center;
    transition: opacity 480ms ease, transform 480ms cubic-bezier(.34,1.56,.64,1);
    transition-delay: var(--pmap-delay, 0ms);
  }
  .pmap-wrap.pmap-arrived .pmap-pin-inner { opacity: 1; transform: scale(1); }

  /* Live — a solid, glossy blueprint tack. Fully seated. */
  .pmap-pin.gold .pmap-tack-core { fill: url(#pmapTackGold); stroke: ${GOLD_DEEP}; stroke-width: 0.9; transition: r 140ms ease; }
  .pmap-pin.gold .pmap-tack-shine { fill: rgba(255,250,235,0.75); }
  .pmap-pin.gold .pmap-halo { fill: ${GOLD_GLOW}; }
  .pmap-pin.gold.solo .pmap-halo { animation: pmapGoldPulse 2.8s ease-in-out infinite; }
  .pmap-pin.gold:hover .pmap-tack-core { r: 7.4; }
  .pmap-pin.gold.compact:hover .pmap-tack-core { r: 5.2; }
  .pmap-ping { fill: none; stroke: ${GOLD}; stroke-width: 1.4; animation: pmapPingOnce 1.9s ease-out forwards; }

  /* Incoming — the same tack, drafted but not inked: dashed outline, no fill. */
  .pmap-pin.grey .pmap-tack-sketch { fill: rgba(139,155,181,0.06); stroke: ${LOCKED}; stroke-width: 1.1; stroke-dasharray: 2.6 2.2; }
  .pmap-pin.grey .pmap-tack-cross { stroke: ${LOCKED}; stroke-width: 0.9; opacity: 0.75; }
  .pmap-pin.grey .pmap-shimmer { fill: transparent; stroke: ${LOCKED}; stroke-width: 1; opacity: 0; }
  .pmap-pin.grey.solo .pmap-shimmer { animation: pmapShimmer 6s ease-in-out infinite; }
  .pmap-pin.grey:hover .pmap-tack-sketch { stroke-width: 1.5; }

  @keyframes pmapGoldPulse { 0%,100% { r: 9.5; opacity: 0.6; } 50% { r: 14.5; opacity: 0.12; } }
  @keyframes pmapShimmer { 0%,100% { r: 5.5; opacity: 0; } 55% { r: 5.5; opacity: 0; } 72% { r: 10; opacity: 0.4; } 90% { r: 13; opacity: 0; } }
  @keyframes pmapPingOnce { 0% { r: 6.5; stroke-opacity: 0.7; } 100% { r: 24; stroke-opacity: 0; } }
  @keyframes pmapMatchPulse { 0%,100% { r: 11; opacity: 0.55; } 50% { r: 16; opacity: 0.05; } }
  .pmap-match-ring { fill: none; stroke: #F5F0E8; stroke-width: 1.4; animation: pmapMatchPulse 1.3s ease-in-out infinite; }
  .pmap-shadow { fill: rgba(0,0,0,0.26); }

  @media (prefers-reduced-motion: reduce) {
    .pmap-pin.gold .pmap-halo, .pmap-pin.grey .pmap-shimmer, .pmap-ping, .pmap-match-ring { animation: none !important; }
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
    .pmap-wrap { gap: 12px; }
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
// same shape drafted in dashed line, not yet inked. Compact = smaller, calmer
// version used inside a crowded county so the group reads as tidy, not busy.
function TackGlyph({ live, compact }) {
  const r = compact ? 4.3 : 6.2
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

function Pin({ pinKey, live, x, y, dimmed, matched, compact, arriveDelay, ping, onClick, onKeyDown, label }) {
  const hitR = compact ? 8 : 17
  return (
    <g
      className={`pmap-pin ${live ? 'gold' : 'grey'}${compact ? ' compact' : ' solo'}${dimmed ? ' pmap-dim' : ''}${matched ? ' pmap-match' : ''}`}
      transform={`translate(${x},${y})`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={label}
      data-pin={pinKey}
    >
      <title>{label}</title>
      <circle className="pmap-hit" r={hitR} />
      <g className="pmap-pin-inner" style={{ '--pmap-delay': `${arriveDelay}ms` }}>
        {matched && <circle className="pmap-match-ring" r={11} />}
        <ellipse className="pmap-shadow" cx={0} cy={compact ? 3 : 4} rx={compact ? 3.9 : 5.6} ry={compact ? 1.2 : 1.7} />
        {live && <circle className="pmap-halo" r={compact ? 6.6 : 9.5} />}
        {!live && <circle className="pmap-shimmer" r={5.5} style={{ animationDelay: `${(arriveDelay % 6) * 0.9}s` }} />}
        {ping && <circle key={ping} className="pmap-ping" r={6.5} />}
        <TackGlyph live={live} compact={compact} />
      </g>
    </g>
  )
}

export default function PartnerMap() {
  const [active, setActive] = useState(null)
  const [arrived, setArrived] = useState(false)
  const [ping, setPing] = useState(null)
  const [query, setQuery] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const [matchedKeys, setMatchedKeys] = useState(new Set())
  const wrapRef = useRef(null)
  const nonceRef = useRef(0)
  const searchRef = useRef(null)

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

  // Close the results dropdown on outside click, without clearing what was typed.
  useEffect(() => {
    function onDocClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setResultsOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SEARCH_INDEX.filter(r => r.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  function select(pinKey, data) {
    setActive(prev => (prev && prev.pinKey === pinKey ? null : { pinKey, ...data }))
  }
  function onKey(e, pinKey, data) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(pinKey, data) }
  }

  function pickResult(r) {
    if (r.kind === 'county') {
      // No single card makes sense for a whole county — pulse every pin
      // there instead, so the search still doubles as "where is this county".
      const keys = SEARCH_INDEX.filter(x => x.county === r.county && x.kind !== 'county').map(x => x.id)
      setActive(null)
      setMatchedKeys(new Set(keys.length ? keys : [`mystery-${r.county}`]))
    } else {
      select(r.id, r.kind === 'live'
        ? { live: true, ...LIVE_PINS.find(p => p.id === r.id) }
        : { live: false, name: r.name, category: r.sub })
      setMatchedKeys(new Set([r.id]))
    }
    setQuery('')
    setResultsOpen(false)
    window.setTimeout(() => setMatchedKeys(new Set()), 2200)
    wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div ref={wrapRef} className={`pmap-wrap${arrived ? ' pmap-arrived' : ''}`}>
      <style>{PMAP_STYLES}</style>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="pmap-search" ref={searchRef}>
        <div className="pmap-search-input-row">
          <Search size={15} color="rgba(245,240,232,0.55)" />
          <input
            className="pmap-search-input"
            type="text"
            placeholder="Find a partner or county…"
            value={query}
            onChange={e => { setQuery(e.target.value); setResultsOpen(true) }}
            onFocus={() => setResultsOpen(true)}
          />
          {query && (
            <span className="pmap-search-clear" onClick={() => { setQuery(''); setResultsOpen(false) }} role="button" aria-label="Clear search">
              <X size={14} color="rgba(245,240,232,0.7)" />
            </span>
          )}
        </div>
        {query && resultsOpen && (
          <div className="pmap-search-results">
            {results.length === 0 && <div className="pmap-search-empty">No matches for "{query}"</div>}
            {results.map(r => (
              <button key={`${r.kind}-${r.id}`} className="pmap-search-row" onClick={() => pickResult(r)}>
                <span>
                  <span className="pmap-search-row-name">{r.name}</span>
                  <div className="pmap-search-row-sub">{r.kind === 'county' ? 'Jump to county' : r.sub}</div>
                </span>
                <span
                  className="pmap-search-row-tag"
                  style={
                    r.kind === 'live'
                      ? { background: GOLD_GLOW, color: GOLD_DEEP }
                      : r.kind === 'incoming'
                        ? { background: 'rgba(139,155,181,0.18)', color: LOCKED }
                        : { background: 'rgba(30,58,95,0.08)', color: NAVY }
                  }
                >
                  {r.kind === 'live' ? 'Live' : r.kind === 'incoming' ? 'Incoming' : 'County'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

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
            {/* Blueprint graph-paper texture — a nod to the brand, not just an empty sea. */}
            <pattern id="pmapGrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(245,240,232,0.05)" strokeWidth="0.5" />
            </pattern>
            <pattern id="pmapGridMajor" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(245,240,232,0.06)" strokeWidth="0.6" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="400" height="480" fill="url(#pmapGrid)" />
          <rect x="0" y="0" width="400" height="480" fill="url(#pmapGridMajor)" />
          <path className="pmap-land" d={IRELAND_PATH} fill="url(#pmapLandFill)" />
          <path className="pmap-coastline-inner" d={IRELAND_PATH} />
          <CompassMark />

          {/* Soft backing plates behind every crowded county — gives the eye a
              boundary so a busy group reads as one designed unit, not clutter. */}
          {Object.entries(GROUP_BOUNDS).map(([county, b]) => (
            <rect
              key={`plate-${county}`}
              className="pmap-group-plate"
              x={b.minX - 8} y={b.minY - 8}
              width={b.maxX - b.minX + 16} height={b.maxY - b.minY + 16}
              rx={9}
            />
          ))}

          {MYSTERY_PINS.map(p => {
            const key = `mystery-${p.county}`
            return (
              <Pin
                key={key}
                pinKey={key}
                live={false}
                x={p.pos[0]} y={p.pos[1]}
                arriveDelay={40}
                dimmed={active && active.pinKey !== key}
                matched={matchedKeys.has(key)}
                label="Unconfirmed partner — coming soon"
                onClick={() => select(key, { live: false, name: null, category: null })}
                onKeyDown={e => onKey(e, key, { live: false, name: null, category: null })}
              />
            )
          })}

          {INCOMING_NAMED.map((p, i) => {
            const key = `incoming-${i}`
            const compact = GROUPED_COUNTIES.has(p.county)
            return (
              <Pin
                key={key}
                pinKey={key}
                live={false}
                x={p.pos[0]} y={p.pos[1]}
                compact={compact}
                arriveDelay={i * 14}
                dimmed={active && active.pinKey !== key}
                matched={matchedKeys.has(key)}
                label={`${p.name}, ${p.category} — Official Blueprint Partner, launching soon`}
                onClick={() => select(key, { live: false, name: p.name, category: p.category })}
                onKeyDown={e => onKey(e, key, { live: false, name: p.name, category: p.category })}
              />
            )
          })}

          {LIVE_PINS.map((p, i) => {
            const compact = GROUPED_COUNTIES.has(p.county)
            return (
              <Pin
                key={p.id}
                pinKey={p.id}
                live
                x={p.pos[0]} y={p.pos[1]}
                compact={compact}
                arriveDelay={260 + i * 30}
                dimmed={active && active.pinKey !== p.id}
                matched={matchedKeys.has(p.id)}
                ping={ping && ping.pinId === p.id ? `ping-${ping.nonce}` : null}
                label={`${p.name}, ${p.category} — live partner. View details.`}
                onClick={() => select(p.id, { live: true, ...p })}
                onKeyDown={e => onKey(e, p.id, { live: true, ...p })}
              />
            )
          })}

          {/* County name labels — always visible, resolved offline so none overlap. */}
          {Object.entries(COUNTY_LABEL).map(([county, label]) => (
            <text key={`label-${county}`} className="pmap-label" x={COUNTY_POS[county][0]} y={LABEL_Y[county]} fontSize="7.2">
              {label}
            </text>
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
                {active.deal && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: GOLD_DEEP, background: GOLD_GLOW, borderRadius: '6px', padding: '3px 9px' }}>{active.deal}</span>
                )}
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
            Tap a pin to see who's there — or search above to jump straight to a partner.
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
