import { View, Text, StyleSheet } from 'react-native'
import { Compass } from 'lucide-react-native'
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

// The partner tile: Course Compass (navy, compass), Priority (black, silver
// serif P), Kobo (dark teal, mint K). `partner` comes from PARTNERS in
// constants/exploreCatalog.js.
export function PartnerMark({ partner, size = 44 }) {
  const radiusPx = Math.round(size * 0.28)
  return (
    <View style={[s.mark, { width: size, height: size, borderRadius: radiusPx, backgroundColor: partner.bg }]}>
      {partner.mark === 'compass' ? (
        <Compass size={Math.round(size * 0.5)} color={partner.fg} strokeWidth={1.8} />
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

const s = StyleSheet.create({
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, marginBottom: 10, paddingHorizontal: 2 },
  card: { borderRadius: 16, overflow: 'hidden' },
  mark: { alignItems: 'center', justifyContent: 'center' },
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
