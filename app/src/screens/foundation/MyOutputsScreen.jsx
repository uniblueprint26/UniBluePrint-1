import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, FileText, Linkedin, Briefcase, Award, PenLine, MessageSquare, Search, Package } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'

// My Outputs — a real, live count of what each Foundation Blueprint service
// has produced for this user, pulled from the actual generator tables (not a
// fabricated number). Every one of the 8 services writes to its own table
// with the same status lifecycle: draft -> generated -> submitted ->
// delivered (see each service's own migration). This screen reads that
// status straight off every table, per user, so "My Outputs" always reflects
// what's really been delivered rather than a static claim.
//
// There is no separate per-output viewer screen anywhere in the app yet —
// each builder's own GenerationSubmittedScreen is the only place a finished
// document is currently shown — so this screen intentionally stops at
// status + count rather than linking somewhere that doesn't exist.

const SOURCES = [
  { table: 'cv_documents',         label: 'CV Optimisation',             Icon: FileText },
  { table: 'linkedin_documents',   label: 'LinkedIn Optimisation',       Icon: Linkedin },
  { table: 'cover_letters',        label: 'Cover Letter Assistance',     Icon: FileText },
  { table: 'personal_statements',  label: 'Personal Statement',         Icon: PenLine },
  { table: 'application_forms',    label: 'Application Form Assistance', Icon: Award },
  { table: 'interview_prep_packs', label: 'Interview Preparation',       Icon: MessageSquare },
  { table: 'portfolio_plans',      label: 'Portfolio Building',          Icon: Briefcase },
  { table: 'job_search_sessions',  label: 'Job Search Support',          Icon: Search },
]

export default function MyOutputsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [rows, setRows] = useState(null) // null = loading
  const [errored, setErrored] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) { setRows([]); return }
    const results = await Promise.allSettled(
      SOURCES.map(src =>
        supabase.from(src.table).select('status').eq('user_id', user.id)
      )
    )
    const next = SOURCES.map((src, i) => {
      const r = results[i]
      if (r.status !== 'fulfilled' || r.value.error || !r.value.data) {
        return { ...src, total: 0, delivered: 0, unavailable: true }
      }
      const data = r.value.data
      return {
        ...src,
        total: data.length,
        delivered: data.filter(d => d.status === 'delivered').length,
        unavailable: false,
      }
    })
    setRows(next)
    setErrored(next.every(r => r.unavailable))
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const totalDelivered = (rows || []).reduce((sum, r) => sum + r.delivered, 0)
  const totalInProgress = (rows || []).reduce((sum, r) => sum + (r.total - r.delivered), 0)

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
            <Text style={styles.title}>My Outputs</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.cream} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>
          Every document the Foundation Blueprint team has delivered, or is still working on, for you.
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {rows === null ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.navy} />
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryTile}>
                <Text style={styles.summaryValue}>{totalDelivered}</Text>
                <Text style={styles.summaryLabel}>Delivered</Text>
              </View>
              <View style={styles.summaryTile}>
                <Text style={styles.summaryValue}>{totalInProgress}</Text>
                <Text style={styles.summaryLabel}>In progress</Text>
              </View>
            </View>

            {errored && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>Couldn't load your outputs right now. Pull to refresh or try again shortly.</Text>
              </View>
            )}

            <View style={{ gap: 10 }}>
              {(rows || []).map(row => (
                <View key={row.table} style={styles.row}>
                  <View style={styles.rowIcon}>
                    <row.Icon size={18} color={colors.navy} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text style={styles.rowMeta}>
                      {row.unavailable
                        ? 'Not available right now'
                        : row.total === 0
                          ? 'Not started yet'
                          : `${row.delivered} delivered · ${row.total - row.delivered} in progress`}
                    </Text>
                  </View>
                  {!row.unavailable && row.delivered > 0 && (
                    <View style={styles.readyPill}>
                      <Text style={styles.readyPillText}>{row.delivered} ready</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 2 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 19 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245,240,232,0.14)', alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  summaryTile: { flex: 1, backgroundColor: colors.white, borderRadius: radius.card, padding: 16, alignItems: 'center', ...shadows.card },
  summaryValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  summaryLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  noteBox: { backgroundColor: '#FFFBEB', borderRadius: radius.button, padding: 12, borderWidth: 1, borderColor: '#FDE68A', marginBottom: spacing.md },
  noteText: { fontFamily: fonts.sans, fontSize: 12, color: '#92400E', lineHeight: 18 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: radius.card, padding: 14,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(30,58,95,0.06)', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  readyPill: { backgroundColor: 'rgba(201,162,75,0.14)', borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  readyPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#A5813B' },
})
