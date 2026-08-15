import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import Svg, { Path, Circle, Ellipse, G, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg'
import { Lock } from 'lucide-react-native'
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

function at(county, jitter) {
  const pos = COUNTY_POS[county?.toLowerCase()]
  if (!pos) return null
  return jitter ? [pos[0] + jitter[0], pos[1] + jitter[1]] : pos
}

// Every offset below was generated with a packing script (Vogel-spiral
// candidates, ray-cast against the real coastline, greedy nearest-valid-slot
// placement) enforcing a minimum clearance between every pair of pins on the
// ENTIRE map, not just within a county — including against the anonymous
// "mystery" pins. Re-run that script rather than hand-tweaking a single
// offset if a county's partner list changes again; nudging one value by eye
// easily reintroduces a collision with a neighbour you can't see in this table.
const LIVE_JITTER = {
  jmc: [-9.5, 9.5], nyz3ditz: [0.9, -13.5], camila: [8.9, 10.1], elect: [-12.5, -5.2],
  eabakeditt: [12.5, -5.2], royaltyproductions: [-1.4, 21], poiemadexigns: [-22.1, 4.4],
  coded69studios: [10, -24.3], henrysisters: [-11.2, 7.5], kelan: [0.9, -13.5],
  claras: [8.2, 10.7], zvisionapparel: [-12.1, -6], ilashedbydiya: [-9.5, 9.5],
  lashessteph: [-10.1, 8.9], veeslash: [-11.2, 7.5],
}
const INCOMING_JITTER = {
  mbcuts: [0.7, -11.2], mmcutz: [-10.8, -16.2], cutbyalind: [9.4, -6.3],
  droghedafoodie: [6.8, 8.9], archangel: [0.7, -11.2], kasia: [0.7, -11.2],
  pkglam: [6.8, 8.9], hardluck: [-11, -2.2], purplebrunch: [0.7, -11.2],
  angelic: [[-8.5, 7.4], [10.6, 21.5]], // paired positionally with p.counties
}

// ─── Derive every pin from PARTNERS — one source of truth with the list view,
// rather than a second hand-maintained roster that can drift out of sync. ────
function buildLivePins() {
  return PARTNERS
    .filter(p => p.status === 'live' && p.county)
    .map(p => {
      const pos = at(p.county, LIVE_JITTER[p.id] || null)
      return pos ? { id: p.id, name: p.brand, category: p.category, deal: p.deal, pos } : null
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
        if (pos) named.push({ key: `${p.id}-${i}`, name: p.brand, category: p.category, pos })
      })
    } else if (p.county) {
      const pos = at(p.county, INCOMING_JITTER[p.id] || null)
      if (pos) named.push({ key: p.id, name: p.brand, category: p.category, pos })
    }
  })

  const anonymous = PARTNERS
    .filter(p => p.status === 'shell' && !p.county && !p.counties)
    .map((p, i) => {
      const pos = at(MYSTERY_MAP_COUNTIES[i], null)
      return pos ? { key: `mystery-${p.id}`, name: null, category: null, pos } : null
    })
    .filter(Boolean)

  return [...named, ...anonymous].map((p, i) => ({ ...p, delay: i }))
}

const LIVE_PINS = buildLivePins()
const INCOMING_PINS = buildIncomingPins()
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
// same shape drafted as a dashed sketch, not yet inked. ───────────────────────
// No looping/pulsing animation on individual pins here (unlike the website):
// with up to 52 pins on screen, running that many concurrent JS-thread SVG
// animations risked visible jank on real devices with no way to profile it
// from this environment. Liveliness instead comes from the one-time arrival
// sequence and the periodic ping — both cheap, neither sustained.
function Pin({ pinKey, live, x, y, name, category, dimOpacity, onPress }) {
  const arriveOpacity = useRef(new Animated.Value(0)).current

  return (
    <AnimatedG
      transform={`translate(${x}, ${y})`}
      opacity={Animated.multiply(arriveOpacity, dimOpacity)}
      onPress={onPress}
      accessibilityLabel={
        name
          ? `${name}, ${category} — ${live ? 'live partner' : 'Official Blueprint Partner, launching soon'}`
          : 'Unconfirmed partner, coming soon'
      }
    >
      {/* generous invisible hit area, independent of the small visual pin */}
      <Circle r={17} fill="rgba(0,0,0,0.001)" />
      <Ellipse cx={0} cy={4} rx={5.6} ry={1.7} fill="rgba(0,0,0,0.26)" />

      {live ? (
        <>
          <Circle r={9.5} fill="rgba(201,162,75,0.35)" />
          <Circle r={6.2} fill="url(#pmapGold)" stroke={GOLD_DEEP} strokeWidth={0.9} />
          <Ellipse cx={-1.9} cy={-2.2} rx={2.1} ry={1.3} fill="rgba(255,250,235,0.75)" />
        </>
      ) : (
        <>
          <Circle r={6.2} fill="rgba(139,155,181,0.06)" stroke={LOCKED} strokeWidth={1.1} strokeDasharray="2.6 2.2" />
          <Path d="M0,-2.6 L0,2.6 M-2.6,0 L2.6,0" stroke={LOCKED} strokeWidth={0.9} opacity={0.75} />
        </>
      )}
      <ArrivalTrigger opacity={arriveOpacity} delay={0} />
    </AnimatedG>
  )
}

// Fires its one-time fade-in as soon as it mounts. Split out so each pin can
// own its animation without the parent needing 52 refs.
function ArrivalTrigger({ opacity, delay }) {
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 480, delay, useNativeDriver: false }).start()
  }, [])
  return null
}

export default function PartnerMap({ onViewListing }) {
  const [active, setActive] = useState(null)
  const [ping, setPing] = useState(null)
  const dimValues = useRef({}).current // pinKey -> Animated.Value, built lazily

  function dimFor(pinKey) {
    if (!dimValues[pinKey]) dimValues[pinKey] = new Animated.Value(1)
    return dimValues[pinKey]
  }

  useEffect(() => {
    // Animate every known pin's dim value toward the right target whenever
    // selection changes — cheap, one-shot transitions, not loops.
    const allKeys = [...LIVE_PINS.map(p => p.id), ...INCOMING_PINS.map(p => p.key)]
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

  function select(pinKey, data) {
    setActive(prev => (prev && prev.pinKey === pinKey ? null : { pinKey, ...data }))
  }

  return (
    <View style={styles.wrap}>
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

          <Path d={IRELAND_PATH} fill="url(#pmapLand)" stroke="rgba(245,240,232,0.24)" strokeWidth={1.3} />
          <CompassMark />

          {INCOMING_PINS.map(p => (
            <Pin
              key={p.key}
              pinKey={p.key}
              live={false}
              x={p.pos[0]} y={p.pos[1]}
              name={p.name} category={p.category}
              dimOpacity={dimFor(p.key)}
              onPress={() => select(p.key, { live: false, name: p.name, category: p.category })}
            />
          ))}

          {LIVE_PINS.map(p => (
            <Pin
              key={p.id}
              pinKey={p.id}
              live
              x={p.pos[0]} y={p.pos[1]}
              name={p.name} category={p.category}
              dimOpacity={dimFor(p.id)}
              onPress={() => select(p.id, { live: true, ...p })}
            />
          ))}

          {ping && (() => {
            const target = LIVE_PINS.find(p => p.id === ping.id)
            return target ? <PingRing key={ping.nonce} x={target.pos[0]} y={target.pos[1]} /> : null
          })()}
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
              <Text style={styles.cardBody}>On board with UniBlueprint — full listing and deal launch soon.</Text>
            </>
          ) : (
            <>
              <View style={styles.mysteryRow}>
                <View style={styles.lockBadge}>
                  <Lock size={14} color={LOCKED} strokeWidth={2} />
                </View>
                <Text style={styles.cardName}>A new partner is joining soon</Text>
              </View>
              <Text style={styles.cardBody}>We're not ready to share who yet — check back as the map fills in.</Text>
            </>
          )}
        </View>
      ) : (
        <View style={[styles.card, styles.cardIdle]}>
          <Text style={styles.idleText}>Tap a pin to see who's there.</Text>
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

// One-shot expanding ring, replayed at a new pin on every interval tick.
function PingRing({ x, y }) {
  const r = useRef(new Animated.Value(6)).current
  const opacity = useRef(new Animated.Value(0.7)).current

  useEffect(() => {
    r.setValue(6)
    opacity.setValue(0.7)
    Animated.parallel([
      Animated.timing(r, { toValue: 24, duration: 1900, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0, duration: 1900, useNativeDriver: false }),
    ]).start()
  }, [x, y])

  return (
    <AnimatedCircle
      cx={x} cy={y} r={r}
      fill="none" stroke={GOLD} strokeWidth={1.4}
      strokeOpacity={opacity}
    />
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md },
  stage: { width: '100%' },

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

  // These two sit directly on the map's navy backdrop (see LifestyleScreen's
  // wrapping section), not on a card, so they need light-on-navy colours,
  // not the usual colors.muted.
  legend: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)' },
})
