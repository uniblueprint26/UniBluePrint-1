import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle2 } from 'lucide-react-native'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'

// Generic confirmation screen for every Foundation Blueprint generator service —
// built once here rather than duplicated per service, since the message is the
// same regardless of which one just got submitted: it's with a Campus Handler now,
// not something the student sees the raw AI output of directly.

export default function GenerationSubmittedScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { serviceTitle, tier } = route.params || {}
  const isPremium = tier === 'premium'

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.iconWrap}>
        <CheckCircle2 size={56} color={colors.success} />
      </View>
      <Text style={styles.title}>Submitted for review</Text>
      <Text style={styles.body}>
        Your {serviceTitle || 'request'} has been generated and is now with a trained Campus Handler for review —{' '}
        {isPremium ? 'delivered same day (priority queue).' : 'delivered within 48 hours.'}
      </Text>
      <Text style={styles.subBody}>
        You'll get a notification the moment it's ready. No need to keep this screen open.
      </Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        activeOpacity={0.85}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.primaryBtnText}>Back to Foundation Blueprint</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, alignItems: 'center' },
  iconWrap: { marginBottom: spacing.lg },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy, textAlign: 'center' },
  body: { fontFamily: fonts.sans, fontSize: 15, color: colors.navy, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  subBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 19 },
  primaryBtn: {
    marginTop: spacing.xl, height: 52, paddingHorizontal: 32, borderRadius: radius.button,
    backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', ...shadows.card,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
