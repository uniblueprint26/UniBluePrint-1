import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  TrendingUp, Percent, HandCoins, RotateCcw, Sparkles, Receipt,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ScreenHeader from '../../components/ui/ScreenHeader'
import StatTile, { StatTileRow } from '../../components/ui/StatTile'
import PartnerTieringAdmin from '../../components/portals/PartnerTieringAdmin'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { formatNumber } from '../../utils/formatNumber'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// Cents -> "€1,234.56". Hand-rolled on top of formatNumber (same reasoning
// as formatNumber itself: no toLocaleString/Intl dependency, so it behaves
// identically on Hermes without full ICU data).
function formatCents(cents) {
  if (cents == null) return '—'
  return `€${formatNumber(Math.abs(cents) / 100, { decimals: 2 })}`
}

export default function FinancePortalScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { setPortalMode } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [commissions, setCommissions] = useState(null)
  const [payouts, setPayouts] = useState(null)

  function backToMyBlueprint() {
    setPortalMode('personal')
    // React Navigation v7's navigate() pushes rather than pops, which would
    // grow the stack on every switch; popTo returns to the existing HomeMain.
    navigation.popTo('HomeMain')
  }

  async function loadDashboard() {
    setLoading(true)
    setLoadError(null)
    try {
      const [
        { data: revenueRows, error: revenueErr },
        { data: commissionRows, error: commissionErr },
        { data: payoutRows, error: payoutErr },
      ] = await Promise.all([
        // All three RPCs are security definer and re-check finance/founder
        // server-side (migration 20260829140000) — this screen only ever
        // reaches a finance (or finance+founder) account to begin with, but
        // the gate is enforced there regardless of who calls it.
        supabase.rpc('get_finance_revenue_snapshot'),
        supabase.rpc('get_finance_commission_summary'),
        supabase.rpc('get_finance_partner_payout_summary'),
      ])
      if (revenueErr || commissionErr || payoutErr) throw revenueErr || commissionErr || payoutErr
      setRevenue(revenueRows?.[0] || null)
      setCommissions(commissionRows?.[0] || null)
      setPayouts(payoutRows?.[0] || null)
    } catch {
      // Without this, a failed load here left every tile showing "—" with
      // no indication anything had actually gone wrong.
      setLoadError('Could not load finance stats.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadDashboard() }, [])

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        eyebrow="FINANCE DASHBOARD"
        exitTo={{ label: 'My Blueprint', onPress: backToMyBlueprint }}
        title="Revenue & Payouts"
        style={styles.header}
        titleStyle={styles.headerTitle}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {!!loadError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={loadDashboard} activeOpacity={0.7} style={styles.retryBtn} accessibilityRole="button">
              <RotateCcw size={13} color={colors.destructive} strokeWidth={2} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Revenue — modelled off list price, not a reconciled Stripe figure;
            see migration 20260829140000 for why. */}
        <View style={styles.sectionRow}>
          <TrendingUp size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>SUBSCRIPTION REVENUE</Text>
        </View>
        <Text style={styles.sectionCaption}>
          Estimated from list price (pro_monthly / pro_annual) — there is no
          per-subscription amount stored from Stripe yet, so this is a
          modelled figure, not a reconciled Stripe total.
        </Text>
        <StatTileRow>
          <StatTile
            icon={Sparkles} iconBg="#FEF9C3" iconColor={colors.goldDeep}
            value={revenue ? formatCents(revenue.estimated_mrr_cents) : '—'} label="Est. MRR" border
          />
          <StatTile
            icon={TrendingUp} iconBg="#F0FDF4" iconColor={colors.success}
            value={revenue ? formatCents(revenue.estimated_arr_cents) : '—'} label="Est. ARR"
          />
        </StatTileRow>
        <View style={styles.pillWrap}>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>{formatNumber(revenue?.active_pro_monthly ?? 0)} active monthly</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>{formatNumber(revenue?.active_pro_annual ?? 0)} active annual</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>{formatNumber(revenue?.new_subscriptions_in_range ?? 0)} new this month</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>{formatNumber(revenue?.canceled_in_range ?? 0)} canceled this month</Text>
          </View>
        </View>

        {/* Handler commissions */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <HandCoins size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>HANDLER COMMISSIONS</Text>
        </View>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <StatTile
              icon={HandCoins} iconBg="#FEF9C3" iconColor={colors.goldDeep}
              value={commissions ? formatCents(commissions.pending_amount_cents) : '—'}
              label={`Pending (${formatNumber(commissions?.pending_count ?? 0)})`} border
            />
            <StatTile
              icon={Receipt} iconBg="#F0FDF4" iconColor={colors.success}
              value={commissions ? formatCents(commissions.paid_amount_cents) : '—'}
              label={`Paid (${formatNumber(commissions?.paid_count ?? 0)})`}
            />
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {formatNumber(commissions?.declared_in_range_count ?? 0)} declared this month
              {' · '}{commissions ? formatCents(commissions.declared_in_range_amount_cents) : '—'}
            </Text>
          </View>
        </Card>

        {/* Lifestyle partner payouts */}
        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <Percent size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>PARTNER PAYOUTS</Text>
        </View>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <StatTile
              icon={Percent} iconBg="#FEF9C3" iconColor={colors.goldDeep}
              value={payouts ? formatCents(payouts.pending_amount_cents) : '—'}
              label={`Pending (${formatNumber(payouts?.pending_count ?? 0)})`} border
            />
            <StatTile
              icon={Receipt} iconBg="#F0FDF4" iconColor={colors.success}
              value={payouts ? formatCents(payouts.paid_amount_cents) : '—'}
              label={`Paid (${formatNumber(payouts?.paid_count ?? 0)})`}
            />
          </View>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <PartnerTieringAdmin />
        </View>
      </ScrollView>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: -4, marginBottom: 10, lineHeight: 17 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statPill: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  statPillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },

  summaryCard: {},
  summaryRow: { flexDirection: 'row', marginBottom: 2 },
  footerRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)', marginTop: 12 },
  footerText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  errorBox: {
    marginBottom: spacing.md, backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: radius.button,
    padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  errorText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(220,38,38,0.1)',
  },
  retryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.destructive },
  })
}
