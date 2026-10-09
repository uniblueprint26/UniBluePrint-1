import { View, Text, StyleSheet } from 'react-native'
import { colors, fonts, radius, shadows } from '../../constants/theme'
import Button from './Button'

// The "polished" empty-state tier — icon-in-box + serif title + muted
// subtitle, optionally a CTA — already used by NotificationsScreen,
// MessagesScreen, MyOutputsScreen, BudgetingScreen, and others, but never
// shared. Community/forum screens (BoardDetailScreen, ModuleQAScreen,
// CourseConnectScreen) deliberately keep their own plainer, text-first empty
// state instead of this one — that's an intentional, already-consistent
// pattern for dense content, not something this component should replace.
export default function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCtaPress, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {!!Icon && (
        <View style={styles.iconBox}>
          <Icon size={34} color={colors.navy} strokeWidth={1.4} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    ...shadows.card,
  },
  title: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.navy,
    marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    lineHeight: 22, textAlign: 'center',
  },
  cta: { marginTop: 20, height: 46, paddingHorizontal: 28 },
})
