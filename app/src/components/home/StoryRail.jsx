import { Wallet } from 'lucide-react-native'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { PILLARS } from '../../constants/pillars'
import { usePillarOrder } from '../../hooks/usePillarOrder'
import { routeExists } from './routeExists'

// The row of rings under the page title: Budget (gold, because it is money),
// then the pillars. There is no Live circle here: Live lives in the Post area
// and on the Campus Connect and Course Connect rails. Icons, colours and routes all come from PILLARS, so a pillar looks
// the same here as everywhere else in the app.

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
  return NAVY_PILLARS.has(pillar.key) ? colors.textPrimary : lighten(pillar.color, pillar.key === 'elevation' ? 0.55 : 0.35)
}

const SIDE = 16
const GAP = 4

export default function StoryRail({ navigation, name }) {
  const { colors, isDark } = useTheme()
  const { width } = useWindowDimensions()
  // Foundation is left out while it is closed on iOS and Android.
  const pillarKeys = usePillarOrder(['compass'])
  const count = pillarKeys.length + 1 // Budget comes last
  // Size the items to fit, never narrower than 52 (the row then scrolls) or wider than 66.
  const item = Math.max(52, Math.min(66, Math.floor((width - SIDE * 2 - GAP * (count - 1)) / count)))
  const ring = Math.min(62, item - 2)
  const s = getStyles(colors, item, ring)

  function openBudget() {
    // Opens Budgeting once it is registered on this stack, otherwise does nothing.
    if (routeExists(navigation, 'Budgeting')) navigation.navigate('Budgeting')
  }
  // The one place gold is allowed on Home: it is money.
  const gold = colors.goldText || '#B4923A'

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {pillarKeys.map(key => {
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

      <TouchableOpacity
        style={s.item}
        activeOpacity={0.8}
        onPress={openBudget}
        accessibilityRole="button"
        accessibilityLabel="Budget"
      >
        <View style={[s.ring, { borderColor: gold, backgroundColor: isDark ? colors.surface : gold + '14' }]}>
          <Wallet size={Math.round(ring * 0.4)} color={gold} strokeWidth={1.7} />
        </View>
        <Text style={s.label}>Budget</Text>
      </TouchableOpacity>
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
    label: { fontFamily: fonts.sansMedium, fontSize: 10.5, color: colors.textSecondary, marginTop: 10, textAlign: 'center', width: item + 12, marginHorizontal: -6, flexShrink: 0 },
  })
}
