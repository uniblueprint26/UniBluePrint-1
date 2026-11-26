import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, X, Pencil, BookOpen, Building2, ChevronRight } from 'lucide-react-native'
import { fonts, radius, spacing, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/ui/Button'
import { FOUNDATION_SERVICES } from '../../constants/foundationServices'

// The end of every Foundation builder when the app does not order (always on
// iOS and Android). It is a success state with three things to do next:
// view and edit the answers, open the example library, go back to Foundation.
// No price, no order button and no link to the website.
export default function FoundationSavedScreen({ navigation, route }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors, isDark)
  const insets = useSafeAreaInsets()
  const { serviceKey, serviceTitle } = route.params || {}
  const service = FOUNDATION_SERVICES[serviceKey]

  const goHub = () => navigation.navigate('Foundation')

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.top}>
        <TouchableOpacity onPress={goHub} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close and go to Foundation">
          <X size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.paper}>
          <View style={styles.seal}>
            <Check size={28} color={colors.accentFg} strokeWidth={2.6} />
          </View>
          <Text style={styles.title} accessibilityRole="header">Your answers are saved to your Blueprint</Text>
          <Text style={styles.body}>
            {serviceTitle ? `Your ${serviceTitle} answers are safe.` : 'Your answers are safe.'} You can come back any time to read them or change them.
          </Text>
        </View>

        <Text style={styles.nextLabel}>WHAT NEXT</Text>

        <Button
          label="View and edit your answers"
          icon={Pencil}
          onPress={() => (service ? navigation.replace(service.screen, { review: true }) : goHub())}
          variant="primary"
          style={styles.primary}
        />

        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => navigation.navigate('ExampleLibrary')} accessibilityRole="button">
          <View style={styles.rowIcon}><BookOpen size={18} color={colors.textPrimary} strokeWidth={1.8} /></View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Open the example library</Text>
            <Text style={styles.rowSub}>See what good looks like.</Text>
          </View>
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => navigation.navigate('IndustryGuide')} accessibilityRole="button">
          <View style={styles.rowIcon}><Building2 size={18} color={colors.textPrimary} strokeWidth={1.8} /></View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Read an industry guide</Text>
            <Text style={styles.rowSub}>How each field screens applications.</Text>
          </View>
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.hubBtn} activeOpacity={0.7} onPress={goHub} accessibilityRole="button">
          <Text style={styles.hubText}>Back to Foundation</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function getStyles(colors, isDark) {
  const card = isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    top: { paddingHorizontal: spacing.md, paddingBottom: 4 },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    scroll: { paddingHorizontal: spacing.md, paddingTop: 36 },
    paper: {
      backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 22, paddingTop: 52, paddingBottom: 26, ...shadows.card,
    },
    seal: {
      position: 'absolute', top: -30, alignSelf: 'center', width: 62, height: 62, borderRadius: 31,
      backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
      borderWidth: 5, borderColor: colors.background,
    },
    title: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.textPrimary, textAlign: 'center' },
    body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
    nextLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary, marginTop: 30, marginBottom: 12 },
    primary: { marginBottom: 14 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface,
      borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10, ...card,
    },
    rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tabFill, alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
    rowSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
    hubBtn: { alignItems: 'center', justifyContent: 'center', height: 48, marginTop: 8, borderRadius: radius.button },
    hubText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  })
}
