import { View, Text, StyleSheet } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useProFree } from '../../hooks/useAppFlags'

// A small, calm card that says Pro is free until the date in
// app_flags.pro_free_until (31 January 2027 by default). It renders nothing
// once the date has passed. No prices and no purchase steering, so it is safe
// on iPhone and Android as well as web.
export default function ProFreeNotice({ style, compact = false }) {
  const { colors } = useTheme()
  const { active, labelShort } = useProFree()
  if (!active) return null
  return (
    <View
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }, compact && s.compact, style]}
      accessibilityRole="text"
      accessibilityLabel={`Pro is free for everyone until ${labelShort}`}
    >
      <View style={[s.icon, { backgroundColor: colors.tabFill }]}>
        <Sparkles size={18} color={colors.textPrimary} strokeWidth={1.8} />
      </View>
      <View style={s.text}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Pro is free for everyone until {labelShort}</Text>
        {!compact ? (
          <Text style={[s.sub, { color: colors.textSecondary }]}>Every account has Pro until then. Nothing to do.</Text>
        ) : null}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.card, borderWidth: 1 },
  compact: { padding: 12, gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, lineHeight: 20 },
  sub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
})
