import { View, Text, StyleSheet } from 'react-native'
import { Heart, Ticket } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { pillarTint } from '../../constants/pillarTints'
import { useWallet, SECRETS, SECRET_COUNT } from '../../lib/walletStore'

// Two private rows on the member's Profile, only ever shown to them:
//   Deals used     how many times they tapped "I used this deal" in the wallet
//   Secrets found  "3 of 6", badges only, no prizes
// Both are stored on this device, per account.
export default function WalletStats() {
  const { colors, isDark } = useTheme()
  const accent = pillarTint('lifestyle', isDark)
  const { dealsUsed, secretsFound, secrets } = useWallet()
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.row} accessible accessibilityLabel={`Deals used, ${dealsUsed}`}>
        <View style={[s.tile, { backgroundColor: colors.tabFill }]}><Ticket size={19} color={colors.textPrimary} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { color: colors.textPrimary }]}>Deals used</Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>Private to you</Text>
        </View>
        <Text style={[s.value, { color: colors.textPrimary }]}>{dealsUsed}</Text>
      </View>
      <View style={[s.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]} accessible accessibilityLabel={`Secrets found ${secretsFound} of ${SECRET_COUNT}`}>
        <View style={[s.tile, { backgroundColor: colors.tabFill }]}><Heart size={19} color={colors.textPrimary} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { color: colors.textPrimary }]}>Secrets found {secretsFound} of {SECRET_COUNT}</Text>
          <View style={s.badges}>
            {Array.from({ length: SECRET_COUNT }, (_, i) => i + 1).map(n => (
              <View
                key={n}
                accessibilityLabel={secrets[n] ? `Found: ${SECRETS[n]}` : 'Not found yet'}
                style={[s.badge, secrets[n] ? { backgroundColor: accent, borderColor: accent } : { borderColor: colors.border }]}
              >
                {secrets[n] ? <Heart size={11} color="#FFFFFF" fill="#FFFFFF" /> : null}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 14, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 14, minHeight: 64 },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  sub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  value: { fontFamily: fonts.serif, fontSize: 26 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
})
