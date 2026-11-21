import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { fonts, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Small shared pieces so Campus Connect, Course Connect and the toolkit screens
// look like one family. Campus Connect uses a warm terracotta accent, Course
// Connect a calm teal. Both are picked per light or dark mode.

export function useTone(kind = 'campus') {
  const { colors, isDark } = useTheme()
  const campus = kind === 'campus'
  const accent = campus ? (isDark ? '#F2A584' : '#B5522C') : (isDark ? '#7DD3CB' : '#23706B')
  const tint = campus
    ? (isDark ? 'rgba(242,165,132,0.18)' : 'rgba(181,82,44,0.11)')
    : (isDark ? 'rgba(125,211,203,0.18)' : 'rgba(35,112,107,0.11)')
  return { colors, isDark, accent, tint }
}

export const STATUS = {
  quiet: { label: 'Quiet', light: '#15803D', dark: '#4ADE80', steps: 1 },
  busy: { label: 'Busy', light: '#B45309', dark: '#FBBF24', steps: 2 },
  packed: { label: 'Packed', light: '#B91C1C', dark: '#FCA5A5', steps: 3 },
}
export function statusColor(level, isDark) {
  const s = STATUS[level]
  return s ? (isDark ? s.dark : s.light) : '#9CA3AF'
}

// Stamp style badge for content UBP wrote. `label` is From UBP, Posted by UBP
// or Example.
export function Stamp({ label = 'FROM UBP', kind = 'campus', style }) {
  const { accent } = useTone(kind)
  return (
    <View style={[k.stamp, { borderColor: accent }, style]}>
      <Text style={[k.stampText, { color: accent }]}>{String(label).toUpperCase()}</Text>
    </View>
  )
}

export function Pill({ label, tone = 'neutral', kind = 'campus', style }) {
  const { colors, accent, tint, isDark } = useTone(kind)
  let bg = colors.tabFill
  let fg = colors.textPrimary
  if (tone === 'accent') { bg = tint; fg = accent }
  if (tone === 'good') { bg = isDark ? 'rgba(74,222,128,0.16)' : '#DCFCE7'; fg = isDark ? '#4ADE80' : '#15803D' }
  return (
    <View style={[k.pill, { backgroundColor: bg }, style]}>
      <Text style={[k.pillText, { color: fg }]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

export function Chip({ label, active, onPress, kind = 'campus' }) {
  const { colors } = useTone(kind)
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[
        k.chip,
        active
          ? { backgroundColor: colors.accentBg, borderColor: colors.accentBg }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[k.chipText, { color: active ? colors.accentFg : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

export function Card({ children, style, onPress, accessibilityLabel }) {
  const { colors, isDark } = useTone()
  const base = [k.card, { backgroundColor: colors.surface }, isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card, style]
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.86} onPress={onPress} style={base} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </TouchableOpacity>
    )
  }
  return <View style={base}>{children}</View>
}

export function SectionRow({ title, action, onAction, kind = 'campus', style }) {
  const { colors, accent } = useTone(kind)
  return (
    <View style={[k.sectionRow, style]}>
      <Text style={[k.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {!!action && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button">
          <Text style={[k.sectionAction, { color: accent }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// Square tiles in a grid, three across on phones (two when the text is large).
export function TileGrid({ items, onPress, kind = 'campus' }) {
  const { colors, accent, tint, isDark } = useTone(kind)
  const { width, fontScale } = useWindowDimensions()
  const cols = width < 360 || fontScale > 1.3 ? 2 : 3
  const gap = 10
  const tileW = (width - 32 - gap * (cols - 1)) / cols
  return (
    <View style={[k.grid, { gap }]}>
      {items.map(t => (
        <TouchableOpacity
          key={t.key}
          activeOpacity={0.86}
          onPress={() => onPress(t)}
          accessibilityRole="button"
          accessibilityLabel={t.sub ? `${t.title}. ${t.sub}` : t.title}
          style={[
            k.tile, { width: tileW, minHeight: tileW * 0.9, backgroundColor: colors.surface },
            isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card,
          ]}
        >
          <View style={[k.tileIcon, { backgroundColor: tint }]}>
            <t.Icon size={20} color={accent} strokeWidth={1.8} />
          </View>
          <Text style={[k.tileTitle, { color: colors.textPrimary }]}>{t.title}</Text>
          {!!t.sub && <Text style={[k.tileSub, { color: colors.textSecondary }]} numberOfLines={2}>{t.sub}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  )
}

// A calm message for an empty list. `children` is where a button goes.
export function EmptyNote({ title, body, children, Icon }) {
  const { colors, accent, tint } = useTone()
  return (
    <Card style={{ alignItems: 'center', padding: 22 }}>
      {Icon && (
        <View style={[k.emptyIcon, { backgroundColor: tint }]}>
          <Icon size={22} color={accent} strokeWidth={1.8} />
        </View>
      )}
      <Text style={[k.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      {!!body && <Text style={[k.emptyBody, { color: colors.textSecondary }]}>{body}</Text>}
      {children}
    </Card>
  )
}

export function PrimaryButton({ label, onPress, Icon, disabled, style }) {
  const { colors } = useTone()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[k.btn, { backgroundColor: colors.accentBg, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {Icon ? <Icon size={16} color={colors.accentFg} strokeWidth={2} /> : null}
      <Text style={[k.btnText, { color: colors.accentFg }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const k = StyleSheet.create({
  stamp: { borderWidth: 1.5, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, transform: [{ rotate: '-2deg' }], alignSelf: 'flex-start' },
  stampText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.9 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start', maxWidth: '100%' },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  card: { borderRadius: 18, padding: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, flexShrink: 1 },
  sectionAction: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderRadius: 18, padding: 14 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  tileTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 20 },
  tileSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 3, lineHeight: 16 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999, marginTop: 14 },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
})
