// ─── Ireland county centroids ──────────────────────────────────────────────────
// Approximate, public, county-level centre points for the Republic of
// Ireland's 26 counties — good enough to place a pin "in Kildare" without
// pretending to know anyone's actual street address. Shared by PartnerMap
// (for both lifestyle partners and coaches) so there is exactly one set of
// coordinates in the app, not one per screen.
export const COUNTY_CENTROIDS = {
  dublin:     { lat: 53.3498, lng: -6.2603 },
  cork:       { lat: 51.8985, lng: -8.4756 },
  galway:     { lat: 53.2707, lng: -9.0568 },
  limerick:   { lat: 52.6638, lng: -8.6267 },
  waterford:  { lat: 52.2593, lng: -7.1101 },
  tipperary:  { lat: 52.4738, lng: -8.1619 },
  kerry:      { lat: 52.1545, lng: -9.5669 },
  wexford:    { lat: 52.3369, lng: -6.4633 },
  kilkenny:   { lat: 52.6541, lng: -7.2448 },
  meath:      { lat: 53.6055, lng: -6.6564 },
  kildare:    { lat: 53.1639, lng: -6.9111 },
  louth:      { lat: 53.9253, lng: -6.4887 },
  wicklow:    { lat: 52.9808, lng: -6.3637 },
  carlow:     { lat: 52.7156, lng: -6.9067 },
  laois:      { lat: 53.0326, lng: -7.3002 },
  offaly:     { lat: 53.2357, lng: -7.4653 },
  westmeath:  { lat: 53.5345, lng: -7.4653 },
  longford:   { lat: 53.7276, lng: -7.7935 },
  roscommon:  { lat: 53.7167, lng: -8.2167 },
  mayo:       { lat: 53.8008, lng: -9.4784 },
  sligo:      { lat: 54.2766, lng: -8.4761 },
  leitrim:    { lat: 54.1225, lng: -8.0017 },
  cavan:      { lat: 53.9908, lng: -7.3606 },
  monaghan:   { lat: 54.2492, lng: -6.9683 },
  donegal:    { lat: 54.9533, lng: -8.1017 },
  clare:      { lat: 52.8436, lng: -8.9862 },
}

const COUNTY_NAMES = Object.keys(COUNTY_CENTROIDS)

// Finds the first recognised Irish county name inside a free-text location
// string (e.g. "Dublin 8, Ireland", "Co. Mayo, Ireland", "County Sligo") and
// returns its centroid, or null when the string names no specific county
// (e.g. "Ireland, open to worldwide") — we never guess a county that isn't
// actually named.
export function countyFromLocation(location) {
  if (!location) return null
  const lower = location.toLowerCase()
  const match = COUNTY_NAMES.find(name => lower.includes(name))
  return match ? { county: match, ...COUNTY_CENTROIDS[match] } : null
}

// Small deterministic jitter so pins sharing a county don't all stack on
// exactly one point — spread in a tight ring around the real centroid,
// seeded by id so it's stable across renders/sessions rather than random.
export function jitterFor(id, lat, lng) {
  let hash = 0
  const str = String(id)
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  const angle = (hash % 360) * (Math.PI / 180)
  const radius = 0.035 + (hash % 5) * 0.012
  return { lat: lat + Math.sin(angle) * radius, lng: lng + Math.cos(angle) * radius }
}

// Haversine distance in km — used only for the "near you" sort, never shown
// as a precise figure anyone could mistake for a real address lookup.
export function distanceKm(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// A muted, desaturated map style (Google Maps JSON style array) — brand-
// appropriate instead of default vivid Google colours. Applied via
// `customMapStyle` on react-native-maps; honoured on Android (and iOS when
// PROVIDER_GOOGLE is available) — plain Apple Maps on iOS has no equivalent
// API, so it falls back to the system's own "mutedStandard" map type there.
export const MUTED_MAP_STYLE = [
  { elementType: 'geometry',               stylers: [{ color: '#DCE3EA' }] },
  { elementType: 'labels.icon',            stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill',       stylers: [{ color: '#6B7280' }] },
  { elementType: 'labels.text.stroke',     stylers: [{ color: '#F5F0E8' }] },
  { featureType: 'administrative',         elementType: 'geometry.stroke', stylers: [{ color: 'rgba(30,58,95,0.25)' }] },
  { featureType: 'landscape',              elementType: 'geometry',        stylers: [{ color: '#DCE3EA' }] },
  { featureType: 'poi',                    stylers: [{ visibility: 'off' }] },
  { featureType: 'road',                   elementType: 'geometry',        stylers: [{ color: '#EDE7DC' }] },
  { featureType: 'road',                   elementType: 'labels',          stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway',           elementType: 'geometry',        stylers: [{ color: '#E3DCCD' }] },
  { featureType: 'transit',                stylers: [{ visibility: 'off' }] },
  { featureType: 'water',                  elementType: 'geometry',        stylers: [{ color: '#C7D3DE' }] },
]
