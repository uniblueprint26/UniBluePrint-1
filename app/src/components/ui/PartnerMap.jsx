import { useState, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'
import { Lock, Navigation, X } from 'lucide-react-native'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { PARTNERS, MYSTERY_MAP_COUNTIES } from '../../data/lifestylePartners'
import { COACHES } from '../../screens/ElevationScreen'
import { COUNTY_CENTROIDS, countyFromLocation, jitterFor, distanceKm, MUTED_MAP_STYLE } from '../../constants/mapGeo'

// ─── Design tokens — same palette as the website map ─────────────────────────
const GOLD = '#C9A24B'
const GOLD_DEEP = '#A5813B'
const NAVY = colors.navy

// react-native-maps has no web renderer; this screen is reachable from the
// RN-web build too (react-native-web is a project dependency), so this
// component is required lazily and only on native. On web it falls back to
// a simple message instead of crashing the bundle.
let MapView = null, Marker = null, PROVIDER_GOOGLE = null
if (Platform.OS !== 'web') {
  // eslint-disable-next-line global-require
  const maps = require('react-native-maps')
  MapView = maps.default
  Marker = maps.Marker
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE
}

const IRELAND_REGION = { latitude: 53.35, longitude: -8.0, latitudeDelta: 4.6, longitudeDelta: 4.2 }

// ─── Build pins — real county centroids, jittered so pins sharing a county
// don't stack exactly on top of each other. Every pin keeps its original
// county label so "near you" sorting and the info card both stay honest
// about precision (county-level, never a fabricated street address). ───────
function buildPartnerPins() {
  const pins = []
  PARTNERS.forEach(p => {
    const counties = p.counties || (p.county ? [p.county] : [])
    counties.forEach((county, i) => {
      const base = COUNTY_CENTROIDS[county.toLowerCase()]
      if (!base) return
      const { lat, lng } = jitterFor(`${p.id}-${i}`, base.lat, base.lng)
      pins.push({
        kind: 'partner', id: `${p.id}-${i}`, refId: p.id,
        name: p.brand, category: p.category, deal: p.deal,
        live: p.status === 'live', county, lat, lng,
      })
    })
  })
  // One anonymous pin per county with no named partner at all yet.
  MYSTERY_MAP_COUNTIES.forEach(county => {
    const base = COUNTY_CENTROIDS[county.toLowerCase()]
    if (!base) return
    pins.push({ kind: 'mystery', id: `mystery-${county}`, name: null, county, lat: base.lat, lng: base.lng })
  })
  return pins
}

function buildCoachPins() {
  return COACHES
    .map(c => {
      const hit = countyFromLocation(c.location)
      if (!hit) return null // "Ireland, open to worldwide" etc. — no real county to place
      const { lat, lng } = jitterFor(`coach-${c.id}`, hit.lat, hit.lng)
      return { kind: 'coach', id: `coach-${c.id}`, refId: c.id, name: c.name, category: c.category, county: hit.county, lat, lng }
    })
    .filter(Boolean)
}

const PARTNER_PINS = buildPartnerPins()
const COACH_PINS = buildCoachPins()

// ─── A single pin ───────────────────────────────────────────────────────────
function PinView({ kind, live }) {
  if (kind === 'mystery') {
    return (
      <View style={[styles.pinDot, styles.pinDotLocked]}>
        <Lock size={8} color="#8B9BB5" strokeWidth={2} />
      </View>
    )
  }
  // Partners: navy fill, gold ring. Coaches: gold fill, navy ring — both
  // on-brand, visually distinguishable at a glance.
  const isCoach = kind === 'coach'
  return (
    <View style={[
      styles.pinDot,
      isCoach ? styles.pinDotCoach : (live ? styles.pinDotPartnerLive : styles.pinDotPartnerSoon),
    ]} />
  )
}

export default function PartnerMap({ onViewListing, navigation }) {
  const mapRef = useRef(null)
  const [active, setActive] = useState(null)
  const [locating, setLocating] = useState(false)
  const [userLoc, setUserLoc] = useState(null)
  const [locError, setLocError] = useState(null)

  const allPins = useMemo(() => [...PARTNER_PINS, ...COACH_PINS], [])

  const nearbySorted = useMemo(() => {
    if (!userLoc) return []
    return allPins
      .filter(p => p.kind !== 'mystery')
      .map(p => ({ ...p, km: distanceKm(userLoc, { lat: p.lat, lng: p.lng }) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 8)
  }, [allPins, userLoc])

  // Opt-in only — permission is requested the moment someone taps this
  // button, never on screen load, and the default (unfiltered) view never
  // changes: this only re-centres the map and adds a distance sort, it
  // never hides anyone else's pin.
  async function handleFindNearMe() {
    if (Platform.OS === 'web') { setLocError('Location is available in the mobile app.'); return }
    setLocating(true)
    setLocError(null)
    try {
      // eslint-disable-next-line global-require
      const Location = require('expo-location')
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocError('Location permission was not granted.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({})
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserLoc(loc)
      mapRef.current?.animateToRegion({
        latitude: loc.lat, longitude: loc.lng, latitudeDelta: 1.2, longitudeDelta: 1.2,
      }, 450)
    } catch {
      setLocError('Could not get your location right now.')
    } finally {
      setLocating(false)
    }
  }

  function select(pin) { setActive(prev => (prev?.id === pin.id ? null : pin)) }

  function viewFullListing() {
    if (!active) return
    if (active.kind === 'partner') onViewListing?.(active.refId)
    else if (active.kind === 'coach' && navigation) {
      const coach = COACHES.find(c => c.id === active.refId)
      if (coach) navigation.navigate('CoachProfile', { coach })
    }
  }

  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={[styles.wrap, { padding: spacing.lg }]}>
        <Text style={styles.webFallbackText}>
          The interactive partner map is available in the UniBlueprint mobile app.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={IRELAND_REGION}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={MUTED_MAP_STYLE}
          mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        >
          {allPins.map(pin => (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onPress={() => select(pin)}
              accessibilityLabel={pin.name || `New partner in ${pin.county}`}
            >
              <PinView kind={pin.kind} live={pin.live} />
            </Marker>
          ))}
          {userLoc && (
            <Marker coordinate={{ latitude: userLoc.lat, longitude: userLoc.lng }} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.userDot} />
            </Marker>
          )}
        </MapView>

        {/* Find Near Me — explicit opt-in control, top-right of the map */}
        <TouchableOpacity
          style={styles.nearMeBtn}
          activeOpacity={0.85}
          onPress={handleFindNearMe}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Find partners and coaches near me"
        >
          {locating
            ? <ActivityIndicator size="small" color={colors.navy} />
            : <Navigation size={14} color={colors.navy} strokeWidth={2} />}
          <Text style={styles.nearMeBtnText}>{userLoc ? 'Re-centre on me' : 'Find Near Me'}</Text>
        </TouchableOpacity>
      </View>

      {!!locError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{locError}</Text>
          <TouchableOpacity onPress={() => setLocError(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Dismiss">
            <X size={13} color={colors.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Info card ──────────────────────────────────────────────────── */}
      {active ? (
        <View style={styles.card}>
          {active.kind === 'mystery' ? (
            <>
              <View style={styles.mysteryRow}>
                <View style={styles.lockBadge}><Lock size={14} color="#8B9BB5" strokeWidth={2} /></View>
                <Text style={styles.cardName}>A new partner is joining soon</Text>
              </View>
              <Text style={styles.cardBody}>We're not ready to share who yet — {active.county[0].toUpperCase() + active.county.slice(1)}.</Text>
            </>
          ) : (
            <>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{active.name}</Text>
                <Text style={active.kind === 'coach' ? styles.coachBadge : (active.live ? styles.liveBadge : styles.incomingBadge)}>
                  {active.kind === 'coach' ? 'COACH' : (active.live ? 'LIVE' : 'INCOMING')}
                </Text>
              </View>
              <View style={styles.chipRow}>
                <Text style={styles.chip}>{active.category}</Text>
                {!!active.deal && <Text style={[styles.chip, styles.dealChip]}>{active.deal}</Text>}
              </View>
              {active.kind === 'partner' && active.live && (
                <Text style={styles.viewListingLink} onPress={viewFullListing}>View full listing →</Text>
              )}
              {active.kind === 'coach' && (
                <Text style={styles.viewListingLink} onPress={viewFullListing}>View coach profile →</Text>
              )}
            </>
          )}
        </View>
      ) : userLoc && nearbySorted.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.nearTitle}>Closest to you</Text>
          {nearbySorted.slice(0, 4).map(p => (
            <TouchableOpacity key={p.id} style={styles.nearRow} activeOpacity={0.75} onPress={() => select(p)}>
              <Text style={styles.nearName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.nearKm}>{p.km < 1 ? '<1 km' : `${Math.round(p.km)} km`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={[styles.card, styles.cardIdle]}>
          <Text style={styles.idleText}>Tap a pin to see who's there — gold-ringed pins are Lifestyle partners, navy-ringed pins are Elevation coaches.</Text>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: NAVY, borderColor: GOLD, borderWidth: 2 }]} />
          <Text style={styles.legendText}>Partner</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GOLD, borderColor: NAVY, borderWidth: 2 }]} />
          <Text style={styles.legendText}>Coach</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: '#8B9BB5', borderWidth: 1.2, borderStyle: 'dashed' }]} />
          <Text style={styles.legendText}>New Partner Incoming</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  stage: { width: '100%', height: 340, borderRadius: radius.card, overflow: 'hidden', position: 'relative' },
  map: { width: '100%', height: '100%' },

  webFallbackText: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.75)', textAlign: 'center' },

  nearMeBtn: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  nearMeBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.navy },

  errorBanner: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  errorBannerText: { fontFamily: fonts.sans, fontSize: 11.5, color: '#DC2626', flex: 1, marginRight: 8 },

  // Pins
  pinDot: { width: 15, height: 15, borderRadius: 8, borderWidth: 2.5 },
  pinDotPartnerLive:  { backgroundColor: NAVY, borderColor: GOLD },
  pinDotPartnerSoon:  { backgroundColor: 'rgba(139,155,181,0.5)', borderColor: '#8B9BB5' },
  pinDotCoach:        { backgroundColor: GOLD, borderColor: NAVY },
  pinDotLocked:       { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(139,155,181,0.15)', borderWidth: 1.2, borderColor: '#8B9BB5', alignItems: 'center', justifyContent: 'center' },
  userDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },

  card: {
    width: '100%', backgroundColor: colors.white, borderRadius: radius.card,
    padding: 16, minHeight: 72, justifyContent: 'center', gap: 8,
  },
  cardIdle: { backgroundColor: 'rgba(30,58,95,0.04)', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  idleText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, textAlign: 'center' },

  cardTopRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  cardName: { fontFamily: fonts.serif, fontSize: 16, color: colors.navy, flexShrink: 1 },
  liveBadge: { fontFamily: fonts.sansBold, fontSize: 10, color: GOLD_DEEP, letterSpacing: 0.6 },
  incomingBadge: { fontFamily: fonts.sansBold, fontSize: 9, color: '#8B9BB5', letterSpacing: 0.4 },
  coachBadge: { fontFamily: fonts.sansBold, fontSize: 9, color: GOLD_DEEP, letterSpacing: 0.4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    alignSelf: 'flex-start', fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy,
    backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3,
  },
  dealChip: { color: GOLD_DEEP, backgroundColor: 'rgba(201,162,75,0.18)', fontFamily: fonts.sansSemiBold },

  viewListingLink: {
    fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.navy,
    borderBottomWidth: 1.5, borderBottomColor: GOLD, alignSelf: 'flex-start', paddingBottom: 1,
  },
  cardBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18 },

  mysteryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(139,155,181,0.15)', alignItems: 'center', justifyContent: 'center' },

  nearTitle: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  nearRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  nearName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, flex: 1, marginRight: 8 },
  nearKm: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted },

  legend: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 11, height: 11, borderRadius: 5.5 },
  legendText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)' },
})
