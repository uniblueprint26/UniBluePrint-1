import { View, Text, StyleSheet } from 'react-native'
import { fonts, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import Button from './Button'

// The "polished" empty-state tier — icon-in-box + serif title + muted
// subtitle, optionally a CTA — already used by NotificationsScreen,
// MessagesScreen, MyOutputsScreen, BudgetingScreen, and others, but never
// shared. Community/forum screens (BoardDetailScreen, ModuleQAScreen,
// CourseConnectScreen) deliberately keep their own plainer, text-first empty
// state instead of this one — that's an intentional, already-consistent
// pattern for dense content, not something this component should replace.
export default function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCtaPress, style }) {
  const { colors, isDark } = useTheme()
  return (
    <View style={[styles.wrap, style]}>
      {!!Icon && (
        <View
          style={[
            styles.iconBox,
            { backgroundColor: colors.surface },
            isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card,
          ]}
        >
          <Icon size={34} color={colors.textPrimary} strokeWidth={1.4} />
        </View>
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      {!!ctaLabel && (
        <Button label={ctaLabel} onPress={onCtaPress} style={styles.cta} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 48, paddingBottom: 24 },
  iconBox: {
    width: 76, height: 76, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.serif, fontSize: 24,
    marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans, fontSize: 14,
    lineHeight: 22, textAlign: 'center',
  },
  cta: { marginTop: 20, height: 46, paddingHorizontal: 28 },
})
