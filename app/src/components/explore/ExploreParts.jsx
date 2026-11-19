import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Compass, ChevronRight } from 'lucide-react-native'
import { fonts, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Small shared pieces for My Blueprint and Explore, so both screens look like
// one family: a serif group heading, a rounded list card, and the partner marks.

export function SectionTitle({ children, style }) {
  const { colors } = useTheme()
  return <Text style={[s.sectionTitle, { color: colors.textPrimary }, style]}>{children}</Text>
}

// Rounded white (or dark surface) card that holds a list of rows.
export function GroupCard({ children, style }) {
  const { colors, isDark } = useTheme()
  return (
    <View
      style={[
        s.card,
        { backgroundColor: colors.surface },
        isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function RowDivider({ inset = 64 }) {
  const { colors } = useTheme()
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: inset }} />
}

// The partner tile in each partner's own look: Course Compass (navy tile, sky
// compass), Priority (black circle, thin silver ring, italic silver serif P).
// `partner` comes from PARTNERS in constants/exploreCatalog.js.
export function PartnerMark({ partner, size = 44, bg }) {
  if (partner.mark === 'priority') {
    return (
      <View style={[s.mark, { width: size, height: size, borderRadius: size / 2, backgroundColor: partner.bg, borderWidth: 1.5, borderColor: partner.accent }]}>
        <Text
          style={{
            fontFamily: fonts.serifItalic, color: partner.fg, includeFontPadding: false,
            fontSize: Math.round(size * 0.56), lineHeight: Math.round(size * 0.68), marginRight: 1,
          }}
        >
          P
        </Text>
      </View>
    )
  }
  const radiusPx = Math.round(size * 0.28)
  return (
    <View style={[s.mark, { width: size, height: size, borderRadius: radiusPx, backgroundColor: bg || partner.bg }]}>
      {partner.mark === 'compass' ? (
        <Compass size={Math.round(size * 0.52)} color={partner.accent} strokeWidth={1.8} />
      ) : (
        <Text
          style={{
            fontFamily: fonts.serif, color: partner.fg, includeFontPadding: false,
            fontSize: Math.round(size * 0.58), lineHeight: Math.round(size * 0.7),
          }}
        >
          {partner.mark}
        </Text>
      )}
    </View>
  )
}

// The big partner card on Explore. The whole card is the partner's colour.
// A featured card (Course Compass) is wider and taller so it reads as first.
export function PartnerCard({ partner: p, onPress }) {
  const { isDark } = useTheme()
  const featured = !!p.featured
  // The app's dark page is navy too, so on dark the Compass card goes a shade
  // deeper and gets a thin sky edge to stay a distinct card.
  const grad = isDark && p.darkGradient ? p.darkGradient : p.gradient
  const ring = isDark && p.darkRing ? p.darkRing : p.ring
  const cardStyle = [
    s.pCard,
    featured ? s.pCardFeatured : null,
    { backgroundColor: p.bg },
    ring ? { borderWidth: 1, borderColor: ring } : null,
  ]
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${p.name}. ${p.blurb}`}
      style={cardStyle}
    >
      {!!grad && (
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
      {p.mark === 'compass' && (
        <View pointerEvents="none" style={s.pWatermark}>
          <Compass size={160} color={p.accent} strokeWidth={1} style={{ opacity: 0.2 }} />
        </View>
      )}
      <View style={s.pTop}>
        <PartnerMark partner={p} size={featured ? 52 : 44} bg={p.markBg} />
        <View style={[s.pCta, { backgroundColor: p.ctaBg }]}>
          <Text style={[s.pCtaText, { color: p.ctaFg, fontFamily: p.ctaFont || fonts.sansSemiBold }]}>{p.cta}</Text>
          <ChevronRight size={14} color={p.ctaFg} strokeWidth={2.4} />
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <Text style={[s.pName, featured && s.pNameFeatured, { color: p.fg, fontFamily: p.nameFont || fonts.serif }]}>{p.name}</Text>
      <Text style={[s.pBlurb, { color: p.fg, fontFamily: p.bodyFont || fonts.sans }]} numberOfLines={2}>{p.blurb}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, marginBottom: 10, paddingHorizontal: 2 },
  card: { borderRadius: 16, overflow: 'hidden' },
  mark: { alignItems: 'center', justifyContent: 'center' },

  pCard: { width: 224, minHeight: 168, borderRadius: 18, padding: 16, overflow: 'hidden' },
  pCardFeatured: { width: 288, minHeight: 176, padding: 18 },
  pWatermark: { position: 'absolute', right: -26, bottom: -30 },
  pTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pCta: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 13, height: 30, borderRadius: 15 },
  pCtaText: { fontSize: 12.5 },
  pName: { fontSize: 22, lineHeight: 28, marginTop: 14 },
  pNameFeatured: { fontSize: 28, lineHeight: 34 },
  pBlurb: { fontSize: 13, lineHeight: 18, marginTop: 3, opacity: 0.78 },
})

// A pillar's colour, readable on the current surface. The navy and purple
// pillar colours vanish on the dark surface, so in dark mode they are mixed
// towards white; the tint is the same colour at low opacity for tile fills.
export function pillarTone(color, isDark) {
  const hex = color.replace('#', '')
  const n = parseInt(hex, 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  if (isDark) {
    const lum = (0.299 * r + 0.587 * g + 0.114 * b)
    if (lum < 120) {
      const k = 0.55
      r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k)
    }
  }
  return { fg: `rgb(${r},${g},${b})`, tint: `rgba(${r},${g},${b},${isDark ? 0.2 : 0.13})` }
}
