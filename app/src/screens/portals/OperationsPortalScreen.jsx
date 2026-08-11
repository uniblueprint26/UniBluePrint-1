import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeftRight, Inbox, ShieldAlert, MessageSquare } from 'lucide-react-native'

import Card from '../../components/ui/Card'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function MetricTile({ label, value, border }) {
  return (
    <View style={[styles.metricTile, border && styles.metricTileBorder]}>
      <Text style={styles.metricValue}>{value ?? '—'}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

export default function OperationsPortalScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { setPortalMode } = useAuth()

  const [queue, setQueue] = useState(null)
  const [gdprRequests, setGdprRequests] = useState([])
  const [enquiries, setEnquiries] = useState([])

  function backToMyBlueprint() {
    setPortalMode('personal')
    navigation.navigate('HomeMain')
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ data: queueSnapshot }, { data: gdpr }, { data: enq }] = await Promise.all([
        supabase.rpc('get_ops_queue_snapshot'),
        supabase.from('gdpr_requests').select('id, request_type, status, requested_at').eq('status', 'pending').order('requested_at', { ascending: true }).limit(10),
        supabase.from('coach_enquiries').select('id, coach_name, status, created_at').order('created_at', { ascending: false }).limit(10),
      ])
      if (cancelled) return
      setQueue(queueSnapshot?.[0] || null)
      setGdprRequests(gdpr || [])
      setEnquiries(enq || [])
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerEyebrow}>OPERATIONS DASHBOARD</Text>
          <TouchableOpacity style={styles.backLink} activeOpacity={0.75} onPress={backToMyBlueprint}>
            <ArrowLeftRight size={12} color="rgba(245,240,232,0.6)" strokeWidth={2} />
            <Text style={styles.backLinkText}>My Blueprint</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Operations Queue</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <Inbox size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>REQUEST QUEUE</Text>
        </View>
        <Card style={styles.queueCard}>
          <View style={styles.queueRow}>
            <MetricTile label="Queued" value={queue?.queued} />
            <MetricTile label="In Progress" value={queue?.in_progress} border />
            <MetricTile label="Completed Today" value={queue?.completed_today} border />
          </View>
          <View style={styles.urgencyRow}>
            <View style={[styles.urgencyDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.urgencyText}>{queue?.red_count ?? 0} red</Text>
            <View style={[styles.urgencyDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.urgencyText}>{queue?.amber_count ?? 0} amber</Text>
            <View style={[styles.urgencyDot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.urgencyText}>{queue?.green_count ?? 0} green</Text>
          </View>
        </Card>

        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <ShieldAlert size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>GDPR REQUESTS AWAITING ACTION</Text>
        </View>
        <Card style={{ padding: 0 }}>
          {gdprRequests.length === 0 ? (
            <Text style={styles.emptyRow}>Nothing pending.</Text>
          ) : gdprRequests.map((r, i, arr) => (
            <View key={r.id} style={[styles.listRow, i < arr.length - 1 && styles.divider]}>
              <Text style={styles.listRowTitle}>{r.request_type === 'export' ? 'Data export' : 'Account deletion'}</Text>
              <Text style={styles.listRowSub}>Requested {new Date(r.requested_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </Card>

        <View style={[styles.sectionRow, { marginTop: spacing.xl }]}>
          <MessageSquare size={14} color={colors.navy} />
          <Text style={styles.sectionEyebrow}>RECENT COACH ENQUIRIES</Text>
        </View>
        <Card style={{ padding: 0 }}>
          {enquiries.length === 0 ? (
            <Text style={styles.emptyRow}>No enquiries yet.</Text>
          ) : enquiries.map((e, i, arr) => (
            <View key={e.id} style={[styles.listRow, i < arr.length - 1 && styles.divider]}>
              <Text style={styles.listRowTitle}>{e.coach_name}</Text>
              <Text style={styles.listRowSub}>{e.status} · {new Date(e.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backLinkText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },

  queueCard: {},
  queueRow: { flexDirection: 'row', marginBottom: 14 },
  metricTile: { flex: 1 },
  metricTileBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(30,58,95,0.08)', paddingLeft: 14, marginLeft: 4 },
  metricValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  metricLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  urgencyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginRight: 8 },

  listRow: { padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  listRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textTransform: 'capitalize' },
  listRowSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2, textTransform: 'capitalize' },
  emptyRow: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, fontStyle: 'italic', padding: 14 },
})
