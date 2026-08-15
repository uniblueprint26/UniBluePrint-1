import { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, Animated, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native'
import Svg, { Path, Circle, Ellipse, G, Defs, RadialGradient, Stop, Text as SvgText, Line } from 'react-native-svg'
import { Lock, Search, X, ChevronRight } from 'lucide-react-native'
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
const COUNTY_LABEL = Object.fromEntries(
  Object.keys(COUNTY_POS).map(k => [k, k[0].toUpperCase() + k.slice(1)])
)

// Thin blueprint graph-paper grid — decorative, computed once at module load.
const GRID_LINES = (() => {
  const lines = []
  for (let x = 0; x <= 400; x += 16) lines.push({ key: `v${x}`, x1: x, y1: 0, x2: x, y2: 480, major: x % 80 === 0 })
  for (let y = 0; y <= 480; y += 16) lines.push({ key: `h${y}`, x1: 0, y1: y, x2: 400, y2: y, major: y % 80 === 0 })
  return lines
})()

// ─── Group every partner into one marker per county — the actual fix for pins
// reading as "bunched up." A county with 11 partners is ONE tack with an "11"
// badge, not 11 dots fighting for the same few pixels. Tapping it opens a
// scrollable list instead of forcing every pin to stay visually distinct at a
// glance, which no amount of spacing could make a crowded county achieve. ────
function buildClusters() {
  const byCounty = {}
  function bucket(countyRaw) {
    const key = countyRaw?.toLowerCase()
    if (!key || !COUNTY_POS[key]) return null
    if (!byCounty[key]) byCounty[key] = { county: key, live: [], incoming: [], anonymous: 0 }
    return byCounty[key]
  }
  PARTNERS.filter(p => p.status === 'live' && p.county).forEach(p => bucket(p.county)?.live.push(p))
  PARTNERS.filter(p => p.status === 'shell').forEach(p => {
    if (p.counties) p.counties.forEach(c => bucket(c)?.incoming.push(p))
    else if (p.county) bucket(p.county)?.incoming.push(p)
  })
  MYSTERY_MAP_COUNTIES.forEach(c => { const b = bucket(c); if (b) b.anonymous += 1 })

  return Object.values(byCounty).map(c => ({
    ...c,
    pos: COUNTY_POS[c.county],
    label: COUNTY_LABEL[c.county],
    total: c.live.length + c.incoming.length + c.anonymous,
    hasLive: c.live.length > 0,
  }))
}
const CLUSTERS = buildClusters()

// Flat, searchable index — every live + named-incoming partner plus every
// county label, so the search box can jump straight to any of them.
const SEARCH_INDEX = [
  ...PARTNERS.filter(p => p.status === 'live' && p.county).map(p => ({
    kind: 'live', id: p.id, name: p.brand, county: p.county.toLowerCase(), sub: p.category,
  })),
  ...PARTNERS.filter(p => p.status === 'shell' && (p.county || p.counties)).flatMap(p =>
    (p.counties || [p.county]).map(c => ({
      kind: 'incoming', id: p.id, name: p.brand, county: c.toLowerCase(), sub: p.category,
    }))
  ),
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

// ─── Count badge — the whole fix for "too many pins in one spot": one marker
// communicates the number instead of N markers fighting for the same pixels. ─
function CountBadge({ count, live }) {
  const r = count > 9 ? 7.4 : 6.6
  return (
    <G transform="translate(6.5, -6.5)">
      <Circle r={r} fill={colors.cream} stroke={live ? GOLD_DEEP : LOCKED} strokeWidth={1.4} />
      <SvgText x={0} y={0.5} textAnchor="middle" alignmentBaseline="central" fontSize={count > 9 ? 7 : 7.6} fontWeight="700" fill={colors.navy}>
        {count}
      </SvgText>
    </G>
  )
}

// ─── A single pin — blueprint tack. Live = solid and seated. Incoming = the
// same shape drafted as a dashed sketch, not yet inked. ───────────────────────
// No looping/pulsing animation on individual pins here (unlike the website):
// with up to 26 county markers on screen, this keeps JS-thread SVG animation
// cheap. Liveliness comes from the one-time arrival sequence and the periodic
// ping — both cheap, neither sustained.
function Pin({ pinKey, live, x, y, badge, dimOpacity, matchRing, onPress }) {
  const arriveOpacity = useRef(new Animated.Value(0)).current
  const scale = badge ? 1.12 : 1

  return (
    <AnimatedG
      transform={`translate(${x}, ${y})`}
      opacity={Animated.multiply(arriveOpacity, dimOpacity)}
      onPress={onPress}
      accessibilityLabel={pinKey}
    >
      {/* generous invisible hit area, independent of the small visual pin */}
      <Circle r={badge ? 20 : 17} fill="rgba(0,0,0,0.001)" />
      {matchRing}
      <Ellipse cx={0} cy={4} rx={5.6 * scale} ry={1.7 * scale} fill="rgba(0,0,0,0.26)" />

      {live ? (
        <>
          <Circle r={9.5 * scale} fill="rgba(201,162,75,0.35)" />
          <Circle r={6.2 * scale} fill="url(#pmapGold)" stroke={GOLD_DEEP} strokeWidth={0.9} />
          <Ellipse cx={-1.9 * scale} cy={-2.2 * scale} rx={2.1 * scale} ry={1.3 * scale} fill="rgba(255,250,235,0.75)" />
        </>
      ) : (
        <>
          <Circle r={6.2 * scale} fill="rgba(139,155,181,0.06)" stroke={LOCKED} strokeWidth={1.1} strokeDasharray="2.6 2.2" />
          <Path d={`M0,${-2.6 * scale} L0,${2.6 * scale} M${-2.6 * scale},0 L${2.6 * scale},0`} stroke={LOCKED} strokeWidth={0.9} opacity={0.75} />
        </>
      )}
      {badge && <CountBadge count={badge} live={live} />}
      <ArrivalTrigger opacity={arriveOpacity} delay={0} />
    </AnimatedG>
  )
}

// Fires its one-time fade-in as soon as it mounts. Split out so each pin can
// own its animation without the parent needing 26 refs.
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

function ClusterRow({ live, name, category, deal, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View
  return (
    <Wrapper style={styles.clusterRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.clusterSwatch, live ? styles.clusterSwatchLive : styles.clusterSwatchIncoming]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.clusterRowName} numberOfLines={1}>{name}</Text>
        <Text style={styles.clusterRowSub} numberOfLines={1}>{category}{!live ? ' · launching soon' : ''}</Text>
        {deal && <Text style={styles.clusterRowDeal} numberOfLines={1}>{deal}</Text>}
      </View>
      {onPress && <ChevronRight size={15} color={colors.light} />}
    </Wrapper>
  )
}

export default function PartnerMap({ onViewListing }) {
  const [active, setActive] = useState(null)
  const [ping, setPing] = useState(null)
  const [query, setQuery] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const [matchedKey, setMatchedKey] = useState(null)
  const dimValues = useRef({}).current // pinKey -> Animated.Value, built lazily

  function dimFor(pinKey) {
    if (!dimValues[pinKey]) dimValues[pinKey] = new Animated.Value(1)
    return dimValues[pinKey]
  }

  useEffect(() => {
    // Animate every cluster's dim value toward the right target whenever
    // selection changes — cheap, one-shot transitions, not loops.
    CLUSTERS.forEach(c => {
      Animated.timing(dimFor(c.county), {
        toValue: !active || active.pinKey === c.county ? 1 : 0.3,
        duration: 220,
        useNativeDriver: false,
      }).start()
    })
  }, [active])

  // A rare signal ping from a random live partner.
  useEffect(() => {
    const liveList = PARTNERS.filter(p => p.status === 'live' && p.county)
    const id = setInterval(() => {
      const p = liveList[Math.floor(Math.random() * liveList.length)]
      if (p) setPing({ county: p.county.toLowerCase(), nonce: Date.now() })
    }, PING_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SEARCH_INDEX.filter(r => r.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  function selectCluster(county) {
    const cluster = CLUSTERS.find(c => c.county === county)
    if (!cluster) return
    if (cluster.total === 1) {
      if (cluster.live[0]) return select(county, { live: true, ...cluster.live[0], id: cluster.live[0].id, name: cluster.live[0].brand, category: cluster.live[0].category })
      if (cluster.incoming[0]) return select(county, { live: false, name: cluster.incoming[0].brand, category: cluster.incoming[0].category })
      return select(county, { live: false, name: null, category: null })
    }
    setActive(prev => (prev && prev.pinKey === county ? null : { pinKey: county, isCluster: true, ...cluster }))
  }

  function select(pinKey, data) {
    setActive(prev => (prev && prev.pinKey === pinKey ? null : { pinKey, ...data }))
  }

  function pickResult(r) {
    selectCluster(r.county)
    setMatchedKey(r.county)
    setQuery('')
    setResultsOpen(false)
    Keyboard.dismiss()
    setTimeout(() => setMatchedKey(null), 2200)
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

          {CLUSTERS.map((c, i) => {
            const isPinging = c.total === 1 && c.live[0] && ping && ping.county === c.county
            const isMatched = matchedKey === c.county
            return (
              <Pin
                key={c.county}
                pinKey={c.county}
                live={c.hasLive}
                x={c.pos[0]} y={c.pos[1]}
                badge={c.total > 1 ? c.total : null}
                dimOpacity={dimFor(c.county)}
                matchRing={isMatched ? <SignalRing x={0} y={0} color={colors.cream} maxR={19} duration={1300} /> : null}
                onPress={() => selectCluster(c.county)}
              />
            )
          })}

          {ping && (() => {
            const cluster = CLUSTERS.find(c => c.county === ping.county && c.total === 1)
            return cluster ? <SignalRing key={ping.nonce} x={cluster.pos[0]} y={cluster.pos[1]} color={GOLD} /> : null
          })()}
        </Svg>
      </View>

      {/* ── Info card / cluster list ──────────────────────────────────── */}
      {active ? (
        <View style={[styles.card, active.isCluster && styles.cardCluster]}>
          {active.isCluster ? (
            <>
              <View style={styles.clusterHeader}>
                <Text style={styles.cardName}>{active.label}</Text>
                <View style={styles.clusterCountPill}>
                  <Text style={styles.clusterCountText}>{active.total} partner{active.total === 1 ? '' : 's'}</Text>
                </View>
              </View>
              <ScrollView style={styles.clusterList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {active.live.map(p => (
                  <ClusterRow key={p.id} live name={p.brand} category={p.category} deal={p.deal} onPress={() => onViewListing?.(p.id)} />
                ))}
                {active.incoming.map((p, i) => (
                  <ClusterRow key={`${p.id}-${i}`} live={false} name={p.brand} category={p.category} />
                ))}
                {active.anonymous > 0 && (
                  <View style={styles.clusterRow}>
                    <Lock size={13} color={LOCKED} />
                    <Text style={[styles.clusterRowSub, { flex: 1, marginLeft: 10 }]}>
                      Unconfirmed partner joining soon — check back as the map fills in.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          ) : active.live ? (
            <>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{active.name}</Text>
                <Text style={styles.liveBadge}>LIVE</Text>
              </View>
              <View style={styles.chipRow}>
                <Text style={styles.chip}>{active.category}</Text>
                {!!active.deal && <Text style={[styles.chip, styles.dealChip]}>{active.deal}</Text>}
              </View>
              <Text style={styles.viewListingLink} onPress={() => onViewListing?.(active.id)}>
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
          <Text style={styles.idleText}>Tap a pin to see who's there — or search above to jump straight to a partner.</Text>
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
        <View style={styles.legendItem}>
          <View style={styles.legendBadgeSample}>
            <View style={[styles.legendDot, { backgroundColor: GOLD, borderColor: GOLD_DEEP, borderWidth: 1 }]} />
            <View style={styles.legendBadgeDot}>
              <Text style={styles.legendBadgeDotText}>3</Text>
            </View>
          </View>
          <Text style={styles.legendText}>Multiple Partners — tap for the list</Text>
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
  searchResults: {
    marginTop: 6, backgroundColor: colors.white, borderRadius: 10,
    overflow: 'hidden',
  },
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
  cardCluster: { justifyContent: 'flex-start' },
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

  // Cluster drawer
  clusterHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  clusterCountPill: { backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, flexShrink: 0 },
  clusterCountText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.navy },
  clusterList: { maxHeight: 260 },
  clusterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  clusterSwatch: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  clusterSwatchLive: { backgroundColor: GOLD, borderWidth: 1, borderColor: GOLD_DEEP },
  clusterSwatchIncoming: { borderWidth: 1.4, borderColor: LOCKED, borderStyle: 'dashed' },
  clusterRowName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  clusterRowSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  clusterRowDeal: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: GOLD_DEEP, marginTop: 2 },

  // These sit directly on the map's navy backdrop (see LifestyleScreen's
  // wrapping section), not on a card, so they need light-on-navy colours,
  // not the usual colors.muted.
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)' },
  legendBadgeSample: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  legendBadgeDot: {
    position: 'absolute', top: -4, right: -5, width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: GOLD_DEEP,
    alignItems: 'center', justifyContent: 'center',
  },
  legendBadgeDotText: { fontFamily: fonts.sansBold, fontSize: 6.5, color: colors.navy },
})
