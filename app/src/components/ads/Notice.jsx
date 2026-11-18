import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'
import { useAdTokens } from './adTheme'

// A calm, quiet row for the in-between states of the Ad Board: "More deals
// coming soon", "Be the first to post here", and the offline retry line.
// Never a bare empty screen.
export default function Notice({ Icon, title, sub, ctaLabel, onCta, dashed = true, style }) {
  const t = useAdTokens()
  const { colors } = t
  return (
    <View style={[s.box, { borderColor: colors.border, borderStyle: dashed ? 'dashed' : 'solid' }, style]}>
      {!!Icon && (
        <View style={[s.icon, { backgroundColor: colors.tabFill }]}>
          <Icon size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </View>
      )}
      <View style={s.text}>
        <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
        {!!sub && <Text style={[s.sub, { color: colors.textSecondary }]}>{sub}</Text>}
        {!!ctaLabel && (
          <TouchableOpacity
            onPress={onCta}
            activeOpacity={0.85}
            style={[s.cta, { backgroundColor: t.accent }]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text style={[s.ctaText, { color: t.accentInk }]}>{ctaLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 18, padding: 16 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14.5 },
  sub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
  cta: { alignSelf: 'flex-start', marginTop: 12, height: 38, paddingHorizontal: 16, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5 },
})
