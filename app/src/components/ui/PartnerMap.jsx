import { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, Animated, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native'
import Svg, { Path, Circle, Ellipse, G, Defs, RadialGradient, Stop, Text as SvgText, Line, Rect } from 'react-native-svg'
import { Lock, Search, X } from 'lucide-react-native'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { PARTNERS, MYSTERY_MAP_COUNTIES } from '../../data/lifestylePartners'

const AnimatedG = Animated.createAnimatedComponent(G)
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// ─── Design tokens — same palette as the website map ─────────────────────────
const GOLD = '#C9A24B'
const GOLD_DEEP = '#A5813B'
const GOLD_LIGHT = '#E4C77E'
const LOCKED = '#8B9BB5'

// ─── Ireland outline + county anchors — identical numbers to the website's
// PartnerMap (src/components/PartnerMap.jsx). Pure SVG path/coordinate data,
// so it ports 1:1 between web and react-native-svg with zero changes. ────────
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

// Thin blueprint graph-paper grid — decorative, computed once at module load.
const GRID_LINES = (() => {
  const lines = []
  for (let x = 0; x <= 400; x += 16) lines.push({ key: `v${x}`, x1: x, y1: 0, x2: x, y2: 480, major: x % 80 === 0 })
  for (let y = 0; y <= 480; y += 16) lines.push({ key: `h${y}`, x1: 0, y1: y, x2: 400, y2: y, major: y % 80 === 0 })
  return lines
})()

// ─── Every pin's position — a packing script arranges partners sharing a
// county into a tight, centred grid (not scattered), ray-cast against the
// real coastline, checked against every other pin on the whole map so
// nothing overlaps or sits in the sea. Re-run it rather than hand-tweaking
// one offset if the roster changes — identical numbers to the website's
// PartnerMap so both stay visually in sync. ───────────────────────────────
const LIVE_JITTER = {
  mpfitness: [-5.2, -5.2], energie: [-15.7, -10.5], jmc: [-5.2, -10.5], nyz3ditz: [5.3, -10.5],
  camila: [15.8, -10.5], elect: [-15.7, 0], eabakeditt: [-5.2, 0], royaltyproductions: [5.3, 0],
  poiemadexigns: [15.8, 0], coded69studios: [-10.5, 10.5], whipwizardz: [-10.5, -5.2],
  ilashedbydiya: [0, -5.2], nailnurse: [-5.2, -5.2], veeslash: [5.3, -5.2], leva: [-10.5, -5.2],
  henrysisters: [0, -5.2], kelan: [10.5, -5.2], claras: [-10.5, 5.3], zvisionapparel: [0, 5.3],
  lashessteph: [5.3, -5.2], cutbyire: [-5.2, -5.2],
}
const INCOMING_JITTER = {
  mbcuts: [10.5, -5.2], mmcutz: [0, 10.5], cutbyalind: [10.5, 5.3], droghedafoodie: [-5.2, 5.3],
  archangel: [-5.2, 5.3], kasia: [0, 5.3], pkglam: [5.3, 5.3], hardluck: [5.3, 5.3],
  purplebrunch: [0, 5.3],
  angelic: [[5.3, -5.2], [10.5, 10.5]], // paired positionally with p.counties: ['Sligo', 'Dublin']
}

function at(county, jitter) {
  const pos = COUNTY_POS[county?.toLowerCase()]
  if (!pos) return null
  return jitter ? [pos[0] + jitter[0], pos[1] + jitter[1]] : pos
}

function buildLivePins() {
  return PARTNERS
    .filter(p => p.status === 'live' && p.county)
    .map(p => {
      const pos = at(p.county, LIVE_JITTER[p.id] || null)
      return pos ? { id: p.id, name: p.brand, category: p.category, deal: p.deal, county: p.county.toLowerCase(), pos } : null
    })
    .filter(Boolean)
}

function buildIncomingPins() {
  const named = []
  PARTNERS.filter(p => p.status === 'shell').forEach(p => {
    if (p.counties) {
      const jitters = INCOMING_JITTER[p.id] || p.counties.map(() => null)
      p.counties.forEach((c, i) => {
        const pos = at(c, jitters[i])
        if (pos) named.push({ key: `${p.id}-${i}`, name: p.brand, category: p.category, county: c.toLowerCase(), pos })
      })
    } else if (p.county) {
      const pos = at(p.county, INCOMING_JITTER[p.id] || null)
      if (pos) named.push({ key: p.id, name: p.brand, category: p.category, county: p.county.toLowerCase(), pos })
    }
  })
  return named
}

function buildMysteryPins() {
  return MYSTERY_MAP_COUNTIES
    .map(c => {
      const pos = at(c, null)
      return pos ? { county: c.toLowerCase(), pos } : null
    })
    .filter(Boolean)
}

const LIVE_PINS = buildLivePins()
const INCOMING_PINS = buildIncomingPins()
const MYSTERY_PINS = buildMysteryPins()

// Every county with more than one pin — these render smaller, calmer (no
// pulsing halo/shimmer), with a soft backing plate behind them so a crowded
// county reads as one tidy, intentional group instead of clutter. A solo pin
// elsewhere stays full-size and animated; it can afford to.
const GROUP_BOUNDS = (() => {
  const byCounty = {}
  ;[...LIVE_PINS, ...INCOMING_PINS].forEach(p => {
    if (!byCounty[p.county]) byCounty[p.county] = []
    byCounty[p.county].push(p.pos)
  })
  const bounds = {}
  Object.entries(byCounty).forEach(([county, positions]) => {
    if (positions.length < 2) return
    const xs = positions.map(p => p[0]), ys = positions.map(p => p[1])
    bounds[county] = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  })
  return bounds
})()
const GROUPED_COUNTIES = new Set(Object.keys(GROUP_BOUNDS))

// Flat, searchable index — every live + named-incoming partner plus every
// county label, so the search box can jump straight to any of them.
const SEARCH_INDEX = [
  ...LIVE_PINS.map(p => ({ kind: 'live', id: p.id, name: p.name, county: p.county, sub: p.category })),
  ...INCOMING_PINS.map(p => ({ kind: 'incoming', id: p.key, name: p.name, county: p.county, sub: p.category })),
  ...Object.keys(COUNTY_POS).map(k => ({ kind: 'county', id: k, name: COUNTY_LABEL[k], county: k, sub: 'County' })),
]

const PING_INTERVAL_MS = 27000

// ─── Compass mark — static, decorative ────────────────────────────────────────
function CompassMark() {
  return (
    <G transform="translate(372, 40)" opacity={0.4}>
      <Circle r={12} fill="none" stroke="rgba(245,240,232,0.4)" strokeWidth={0.8} />
      <Path d="M0,-9 L2.6,-1 L0,2.2 L-2.6,-1 Z" fill="rgba(245,240,232,0.55)" />
      <SvgText x={0} y={-14.5} textAnchor="middle" fontSize={7} fontWeight="700" fill="rgba(245,240,232,0.5)">N</SvgText>
    </G>
  )
}

// ─── A single pin — blueprint tack. Live = solid and seated. Incoming = the
// same shape drafted as a dashed sketch, not yet inked. Compact = smaller,
// calmer version used inside a crowded county so the group reads as tidy,
// not busy; a solo pin elsewhere stays full-size and animated. ───────────────
function Pin({ pinKey, live, x, y, compact, dimOpacity, matchRing, ping, onPress }) {
  const arriveOpacity = useRef(new Animated.Value(0)).current
  const r = compact ? 4.3 : 6.2
  const hitR = compact ? 8 : 17

  return (
    <AnimatedG
      transform={`translate(${x}, ${y})`}
      opacity={Animated.multiply(arriveOpacity, dimOpacity)}
      onPress={onPress}
      accessibilityLabel={pinKey}
    >
      <Circle r={hitR} fill="rgba(0,0,0,0.001)" />
      {matchRing}
      <Ellipse cx={0} cy={compact ? 3 : 4} rx={compact ? 3.9 : 5.6} ry={compact ? 1.2 : 1.7} fill="rgba(0,0,0,0.26)" />

      {live ? (
        <>
          <Circle r={compact ? 6.6 : 9.5} fill="rgba(201,162,75,0.35)" />
          <Circle r={r} fill="url(#pmapGold)" stroke={GOLD_DEEP} strokeWidth={0.9} />
          <Ellipse cx={-r * 0.3} cy={-r * 0.36} rx={r * 0.34} ry={r * 0.21} fill="rgba(255,250,235,0.75)" />
        </>
      ) : (
        <>
          <Circle r={r} fill="rgba(139,155,181,0.06)" stroke={LOCKED} strokeWidth={1.1} strokeDasharray="2.6 2.2" />
          <Path d={`M0,${-r * 0.42} L0,${r * 0.42} M${-r * 0.42},0 L${r * 0.42},0`} stroke={LOCKED} strokeWidth={0.9} opacity={0.75} />
        </>
      )}
      {ping && <SignalRing x={0} y={0} color={GOLD} />}
      <ArrivalTrigger opacity={arriveOpacity} delay={0} />
    </AnimatedG>
  )
}

// Fires its one-time fade-in as soon as it mounts. Split out so each pin can
// own its animation without the parent needing 50+ refs.
function ArrivalTrigger({ opacity, delay }) {
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 480, delay, useNativeDriver: false }).start()
  }, [])
  return null
}

// One-shot ring — reused for both the periodic "network's alive" ping on a
// random live pin, and the "found it" pulse when a search result is picked.
function SignalRing({ x, y, color, maxR = 24, duration = 1900 }) {
  const r = useRef(new Animated.Value(6)).current
  const opacity = useRef(new Animated.Value(0.7)).current

  useEffect(() => {
    r.setValue(6)
    opacity.setValue(0.7)
    Animated.parallel([
      Animated.timing(r, { toValue: maxR, duration, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: false }),
    ]).start()
  }, [x, y])

  return <AnimatedCircle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.4} strokeOpacity={opacity} />
}

export default function PartnerMap({ onViewListing }) {
  const [active, setActive] = useState(null)
  const [ping, setPing] = useState(null)
  const [query, setQuery] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const [matchedKeys, setMatchedKeys] = useState(new Set())
  const dimValues = useRef({}).current // pinKey -> Animated.Value, built lazily

  function dimFor(pinKey) {
    if (!dimValues[pinKey]) dimValues[pinKey] = new Animated.Value(1)
    return dimValues[pinKey]
  }

  useEffect(() => {
    const allKeys = [
      ...LIVE_PINS.map(p => p.id),
      ...INCOMING_PINS.map(p => p.key),
      ...MYSTERY_PINS.map(p => `mystery-${p.county}`),
    ]
    allKeys.forEach(key => {
      Animated.timing(dimFor(key), {
        toValue: !active || active.pinKey === key ? 1 : 0.3,
        duration: 220,
        useNativeDriver: false,
      }).start()
    })
  }, [active])

  // A rare signal ping from a random live partner.
  useEffect(() => {
    const id = setInterval(() => {
      setPing({ id: LIVE_PINS[Math.floor(Math.random() * LIVE_PINS.length)]?.id, nonce: Date.now() })
    }, PING_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SEARCH_INDEX.filter(r => r.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  function select(pinKey, data) {
    setActive(prev => (prev && prev.pinKey === pinKey ? null : { pinKey, ...data }))
  }

  function pickResult(r) {
    if (r.kind === 'county') {
      const keys = SEARCH_INDEX.filter(x => x.county === r.county && x.kind !== 'county').map(x => x.id)
      setActive(null)
      setMatchedKeys(new Set(keys.length ? keys : [`mystery-${r.county}`]))
    } else if (r.kind === 'live') {
      select(r.id, { live: true, ...LIVE_PINS.find(p => p.id === r.id) })
      setMatchedKeys(new Set([r.id]))
    } else {
      select(r.id, { live: false, name: r.name, category: r.sub })
      setMatchedKeys(new Set([r.id]))
    }
    setQuery('')
    setResultsOpen(false)
    Keyboard.dismiss()
    setTimeout(() => setMatchedKeys(new Set()), 2200)
  }

  return (
    <View style={styles.wrap}>
      {/* ── Search ─────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Search size={15} color="rgba(245,240,232,0.55)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Find a partner or county…"
            placeholderTextColor="rgba(245,240,232,0.45)"
            value={query}
            onChangeText={t => { setQuery(t); setResultsOpen(true) }}
            onFocus={() => setResultsOpen(true)}
            onBlur={() => setTimeout(() => setResultsOpen(false), 150)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResultsOpen(false) }} hitSlop={8}>
              <X size={14} color="rgba(245,240,232,0.7)" />
            </TouchableOpacity>
          )}
        </View>
        {query.length > 0 && resultsOpen && (
          <View style={styles.searchResults}>
            {results.length === 0 && <Text style={styles.searchEmpty}>No matches for "{query}"</Text>}
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
              {results.map(r => (
                <TouchableOpacity key={`${r.kind}-${r.id}-${r.county}`} style={styles.searchResultRow} onPress={() => pickResult(r)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchResultName} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.searchResultSub} numberOfLines={1}>{r.kind === 'county' ? 'Jump to county' : r.sub}</Text>
                  </View>
                  <View style={[
                    styles.searchResultTag,
                    r.kind === 'live' ? styles.searchResultTagLive : r.kind === 'incoming' ? styles.searchResultTagIncoming : styles.searchResultTagCounty,
                  ]}>
                    <Text style={[
                      styles.searchResultTagText,
                      r.kind === 'live' ? { color: GOLD_DEEP } : r.kind === 'incoming' ? { color: LOCKED } : { color: colors.navy },
                    ]}>
                      {r.kind === 'live' ? 'Live' : r.kind === 'incoming' ? 'Incoming' : 'County'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.stage}>
        <Svg viewBox="0 0 400 480" style={{ width: '100%', aspectRatio: 400 / 480 }}>
          <Defs>
            <RadialGradient id="pmapLand" cx="35%" cy="20%" r="90%">
              <Stop offset="0%" stopColor="rgba(245,240,232,0.115)" />
              <Stop offset="55%" stopColor="rgba(245,240,232,0.06)" />
              <Stop offset="100%" stopColor="rgba(245,240,232,0.03)" />
            </RadialGradient>
            <RadialGradient id="pmapGold" cx="35%" cy="30%" r="75%">
              <Stop offset="0%" stopColor={GOLD_LIGHT} />
              <Stop offset="55%" stopColor={GOLD} />
              <Stop offset="100%" stopColor={GOLD_DEEP} />
            </RadialGradient>
          </Defs>

          {/* Blueprint graph-paper texture — a nod to the brand, not an empty sea. */}
          {GRID_LINES.map(l => (
            <Line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.major ? 'rgba(245,240,232,0.06)' : 'rgba(245,240,232,0.045)'}
              strokeWidth={l.major ? 0.6 : 0.5} />
          ))}

          <Path d={IRELAND_PATH} fill="url(#pmapLand)" stroke="rgba(245,240,232,0.24)" strokeWidth={1.3} />
          <CompassMark />

          {/* Soft backing plates behind every crowded county — gives the eye a
              boundary so a busy group reads as one designed unit, not clutter. */}
          {Object.entries(GROUP_BOUNDS).map(([county, b]) => (
            <Rect
              key={`plate-${county}`}
              x={b.minX - 8} y={b.minY - 8}
              width={b.maxX - b.minX + 16} height={b.maxY - b.minY + 16}
              rx={9}
              fill="rgba(245,240,232,0.05)" stroke="rgba(245,240,232,0.14)" strokeWidth={0.8}
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
                dimOpacity={dimFor(key)}
                matchRing={matchedKeys.has(key) ? <SignalRing x={0} y={0} color={colors.cream} maxR={16} duration={1300} /> : null}
                onPress={() => select(key, { live: false, name: null, category: null })}
              />
            )
          })}

          {INCOMING_PINS.map(p => {
            const compact = GROUPED_COUNTIES.has(p.county)
            return (
              <Pin
                key={p.key}
                pinKey={p.key}
                live={false}
                x={p.pos[0]} y={p.pos[1]}
                compact={compact}
                dimOpacity={dimFor(p.key)}
                matchRing={matchedKeys.has(p.key) ? <SignalRing x={0} y={0} color={colors.cream} maxR={16} duration={1300} /> : null}
                onPress={() => select(p.key, { live: false, name: p.name, category: p.category })}
              />
            )
          })}

          {LIVE_PINS.map(p => {
            const compact = GROUPED_COUNTIES.has(p.county)
            return (
              <Pin
                key={p.id}
                pinKey={p.id}
                live
                x={p.pos[0]} y={p.pos[1]}
                compact={compact}
                dimOpacity={dimFor(p.id)}
                matchRing={matchedKeys.has(p.id) ? <SignalRing x={0} y={0} color={colors.cream} maxR={16} duration={1300} /> : null}
                ping={ping && ping.id === p.id}
                onPress={() => select(p.id, { live: true, ...p })}
              />
            )
          })}

          {/* County name labels — always visible, resolved offline so none overlap. */}
          {Object.entries(COUNTY_LABEL).map(([county, label]) => (
            <SvgText
              key={`label-${county}`}
              x={COUNTY_POS[county][0]} y={LABEL_Y[county]}
              textAnchor="middle" fontSize={7.2} fontWeight="600"
              fill="rgba(245,240,232,0.5)"
            >
              {label}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* ── Info card ──────────────────────────────────────────────────── */}
      {active ? (
        <View style={styles.card}>
          {active.live ? (
            <>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{active.name}</Text>
                <Text style={styles.liveBadge}>LIVE</Text>
              </View>
              <View style={styles.chipRow}>
                <Text style={styles.chip}>{active.category}</Text>
                {!!active.deal && <Text style={[styles.chip, styles.dealChip]}>{active.deal}</Text>}
              </View>
              <Text
                style={styles.viewListingLink}
                onPress={() => onViewListing?.(active.id)}
              >
                View full listing →
              </Text>
            </>
          ) : active.name ? (
            <>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{active.name}</Text>
                <Text style={styles.incomingBadge}>OFFICIAL BLUEPRINT PARTNER</Text>
              </View>
              <Text style={styles.chip}>{active.category}</Text>
              <Text style={styles.cardBody}>On board with UniBlueprint. Full listing and deal launch soon.</Text>
            </>
          ) : (
            <>
              <View style={styles.mysteryRow}>
                <View style={styles.lockBadge}>
                  <Lock size={14} color={LOCKED} strokeWidth={2} />
                </View>
                <Text style={styles.cardName}>A new partner is joining soon</Text>
              </View>
              <Text style={styles.cardBody}>We're not ready to share who yet. Check back as the map fills in.</Text>
            </>
          )}
        </View>
      ) : (
        <View style={[styles.card, styles.cardIdle]}>
          <Text style={styles.idleText}>Tap a pin to see who's there, or search above to jump straight to a partner.</Text>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GOLD, borderColor: GOLD_DEEP, borderWidth: 1 }]} />
          <Text style={styles.legendText}>Live Partner</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: LOCKED, borderWidth: 1.2, borderStyle: 'dashed' }]} />
          <Text style={styles.legendText}>New Partner Incoming</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  stage: { width: '100%' },

  // Search
  searchWrap: { width: '100%' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,240,232,0.08)', borderWidth: 1, borderColor: 'rgba(245,240,232,0.18)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.cream, padding: 0 },
  searchResults: { marginTop: 6, backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' },
  searchEmpty: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, textAlign: 'center', padding: 14 },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  searchResultName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  searchResultSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  searchResultTag: { flexShrink: 0, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  searchResultTagLive: { backgroundColor: 'rgba(201,162,75,0.18)' },
  searchResultTagIncoming: { backgroundColor: 'rgba(139,155,181,0.18)' },
  searchResultTagCounty: { backgroundColor: 'rgba(30,58,95,0.08)' },
  searchResultTagText: { fontFamily: fonts.sansBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.4 },

  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 16,
    minHeight: 84,
    justifyContent: 'center',
    gap: 8,
  },
  cardIdle: { backgroundColor: 'rgba(30,58,95,0.04)', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  idleText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, textAlign: 'center' },

  cardTopRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  cardName: { fontFamily: fonts.serif, fontSize: 16, color: colors.navy, flexShrink: 1 },
  liveBadge: { fontFamily: fonts.sansBold, fontSize: 10, color: GOLD_DEEP, letterSpacing: 0.6 },
  incomingBadge: { fontFamily: fonts.sansBold, fontSize: 9, color: LOCKED, letterSpacing: 0.4, textAlign: 'right', flexShrink: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy,
    backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3,
  },
  dealChip: { color: GOLD_DEEP, backgroundColor: 'rgba(201,162,75,0.18)', fontFamily: fonts.sansSemiBold },

  viewListingLink: {
    fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.navy,
    borderBottomWidth: 1.5, borderBottomColor: GOLD, alignSelf: 'flex-start', paddingBottom: 1,
  },
  cardBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18 },

  mysteryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockBadge: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(139,155,181,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // These sit directly on the map's navy backdrop (see LifestyleScreen's
  // wrapping section), not on a card, so they need light-on-navy colours,
  // not the usual colors.muted.
  legend: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)' },
})
