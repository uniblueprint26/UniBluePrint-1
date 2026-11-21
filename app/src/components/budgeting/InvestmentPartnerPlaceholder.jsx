import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { COACHES } from '../../screens/ElevationScreen'

// Budgeting Investment tab: investment guidance points only to Zainab Adeyemi
// (Soft Life Investing), a finance coach in Elevation. The card opens her
// Elevation coach profile. Never link to trading, copy trading, challenges,
// brokers or commission schemes from here.
const COACH_ID = 16
const PARTNER_LINE = 'Personal finance and investing guidance from a finance coach in Elevation.'

export default function InvestmentPartnerPlaceholder() {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const coach = COACHES.find(c => c.id === COACH_ID)
  if (!coach) return null
  return (
    <View style={s.wrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CoachProfile', { coach })}
        accessibilityRole="button"
        accessibilityLabel={`Open ${coach.name}`}
        style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.name, { color: colors.textPrimary }]}>{coach.name}</Text>
          <Text style={[s.line, { color: colors.textSecondary }]}>{PARTNER_LINE}</Text>
        </View>
        <ChevronRight size={18} color={colors.textPrimary} strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { marginTop: 24 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.card, borderWidth: 1 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  line: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
})
