import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MessageSquare } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing } from '../constants/theme'

export default function MessagesScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <UBPLogo height={28} color={colors.cream} />
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <MessageSquare size={40} color={colors.navy} strokeWidth={1.4} />
        </View>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>
          Direct messaging between students, coaches, and campus handlers is being built now. Check back soon.
        </Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.serif, fontSize: 28,
    color: colors.navy, marginBottom: 12,
  },
  sub: {
    fontFamily: fonts.sans, fontSize: 14,
    color: colors.muted, lineHeight: 21,
    textAlign: 'center', marginBottom: 24,
  },
  comingSoonBadge: {
    backgroundColor: colors.navy, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  comingSoonText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
})
