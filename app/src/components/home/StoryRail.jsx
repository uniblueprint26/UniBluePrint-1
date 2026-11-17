import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { PILLARS, PILLAR_ORDER } from '../../constants/pillars'

// The row of rings under the page title: your Live ring first, then the five
// pillars. Icons, colours and routes all come from PILLARS, so a pillar looks
// the same here as everywhere else in the app.

// True when `name` is registered on this navigator or any parent of it.
function routeExists(navigation, name) {
  let nav = navigation
  while (nav) {
    try {
      if (nav.getState?.()?.routeNames?.includes(name)) return true
    } catch {}
    nav = nav.getParent?.()
  }
  return false
}

// The Foundation and Compass colours are navy, which vanishes on the dark
// page, so in dark mode those two fall back to the theme's text colour.
const NAVY_PILLARS = new Set(['foundation', 'compass'])
// Other pillar colours are lifted a little toward white in dark mode so the
// purple of Elevation and the like stay readable on the navy page.
function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const mix = c => Math.round(c + (255 - c) * amt)
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}
function ringColor(pillar, colors, isDark) {
  if (!isDark) return pillar.color
  return NAVY_PILLARS.has(pillar.key) ? colors.textPrimary : lighten(pillar.color, 0.35)
}

const SIDE = 16
const GAP = 4

export default function StoryRail({ navigation, name }) {
  const { colors, isDark } = useTheme()
  const { width } = useWindowDimensions()
  // Six items share the row at phone width: size them to fit, never wider than 66.
  const item = Math.max(52, Math.min(66, Math.floor((width - SIDE * 2 - GAP * 5) / 6)))
  const ring = Math.min(62, item - 2)
  const s = getStyles(colors, item, ring)
  const initial = (name || 'You').trim().charAt(0).toUpperCase() || 'Y'

  function openLive() {
    // Live Capture is built separately: only open it once it is registered.
    if (routeExists(navigation, 'LiveCapture')) navigation.navigate('LiveCapture')
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      <TouchableOpacity
        style={s.item}
        activeOpacity={0.8}
        onPress={openLive}
        accessibilityRole="button"
        accessibilityLabel="Go live, a 2 minute capture"
      >
        <View style={[s.ring, { borderColor: colors.textPrimary, backgroundColor: colors.surface }]}>
          <Text style={[s.liveInitial, { color: colors.textPrimary }]}>{initial}</Text>
          <View style={[s.minPill, { backgroundColor: colors.accentBg }]}>
            <Text style={[s.minText, { color: colors.accentFg }]}>2 MIN</Text>
          </View>
        </View>
        <Text style={s.label}>Live</Text>
      </TouchableOpacity>

      {PILLAR_ORDER.filter(k => k !== 'compass').map(key => {
        const p = PILLARS[key]
        const c = ringColor(p, colors, isDark)
        const Icon = p.Icon
        return (
          <TouchableOpacity
            key={key}
            style={s.item}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(p.route)}
            accessibilityRole="button"
            accessibilityLabel={p.label}
          >
            <View style={[s.ring, { borderColor: c, backgroundColor: isDark ? colors.surface : c + '14' }]}>
              <Icon size={Math.round(ring * 0.4)} color={c} strokeWidth={1.7} />
            </View>
            <Text style={s.label}>{p.short ?? p.label}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

function getStyles(colors, item, ring) {
  return StyleSheet.create({
    row: { paddingHorizontal: SIDE, gap: GAP },
    item: { width: item, alignItems: 'center' },
    ring: {
      width: ring, height: ring, borderRadius: ring / 2, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
    liveInitial: { fontFamily: fonts.serif, fontSize: 22 },
    minPill: {
      position: 'absolute', bottom: -7, borderRadius: 8,
      paddingHorizontal: 6, paddingVertical: 2,
    },
    minText: { fontFamily: fonts.sansBold, fontSize: 8.5, letterSpacing: 0.4 },
    label: { fontFamily: fonts.sansMedium, fontSize: 10.5, color: colors.textSecondary, marginTop: 10, textAlign: 'center', width: item + 12, marginHorizontal: -6, flexShrink: 0 },
  })
}
