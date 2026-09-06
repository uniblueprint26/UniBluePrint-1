/**
 * MarketplaceScreen — entry point for the Ad Board's Marketplace section.
 * Two modes, each its own schema-driven board (see constants/marketplaceBoards.js):
 * Skills Marketplace (offer/find a skill) and Buy & Sell (items for sale/wanted).
 * Browsing, posting, filtering, and "mark sold" all reuse the same
 * BoardDetailScreen + PostFormModal engine Campus Connect and Course Connect
 * boards use — passed `registry: 'marketplace'` so it looks the key up in
 * marketplaceBoards.js instead, and skips the campus gate (this is
 * cross-Ireland, like Course Connect).
 */
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { MARKETPLACE_BOARDS } from '../constants/marketplaceBoards'

const ICONS = { skills: Sparkles, buysell: ShoppingBag }

export default function MarketplaceScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.heroBlock}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Ad Board</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroTitle}>Marketplace</Text>
        <Text style={styles.heroSub}>Offer a skill, find one, or buy and sell with students across Ireland. No auto-expiry — you mark your own listing sold whenever it's done.</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {MARKETPLACE_BOARDS.map(board => {
          const Icon = ICONS[board.key] || ShoppingBag
          return (
            <TouchableOpacity
              key={board.key}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BoardDetail', { boardKey: board.key, registry: 'marketplace' })}
              style={{ marginBottom: spacing.md }}
            >
              <Card style={styles.modeCard}>
                <View style={[styles.modeIconWrap, { backgroundColor: board.color }]}>
                  <Icon size={22} color={colors.navy} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>{board.title}</Text>
                  <Text style={styles.modeSub}>{board.tagline}</Text>
                </View>
                <ChevronRight size={18} color={colors.light} />
              </Card>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingTop: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, lineHeight: 34 },
  heroSub: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.72)', marginTop: 8, lineHeight: 20 },

  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  modeIconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modeTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },
  modeSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 18 },
})
