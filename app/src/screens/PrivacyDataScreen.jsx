import { useEffect, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Download, Trash2, ExternalLink, Clock } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { WEBSITE_LINKS } from '../constants/site'

// Files a request into gdpr_requests — Operations/Founder are notified and
// action it from their side (see migration 20260811090000). This screen does
// not itself export or delete data, it is the request intake.
export default function PrivacyDataScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(null) // 'export' | 'deletion' | null

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('gdpr_requests')
      .select('id, request_type, status, requested_at')
      .order('requested_at', { ascending: false })
      .then(({ data }) => { setRequests(data || []); setLoading(false) })
  }, [user?.id])

  async function submitRequest(type) {
    if (submitting) return
    setSubmitting(type)
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .insert({ user_id: user.id, request_type: type })
        .select('id, request_type, status, requested_at')
        .single()
      if (error) throw error
      setRequests(prev => [data, ...prev])
      Alert.alert(
        'Request submitted',
        type === 'export'
          ? "We've received your data export request. The UniBlueprint team will follow up by email within 30 days, as required under GDPR."
          : "We've received your account deletion request. The UniBlueprint team will follow up by email to confirm before anything is deleted.",
      )
    } catch {
      Alert.alert('Something went wrong', 'Please try again, or contact us directly.')
    } finally {
      setSubmitting(null)
    }
  }

  function confirmDeletion() {
    Alert.alert(
      'Request account deletion',
      'This starts the process of permanently deleting your UniBlueprint account and associated data. The team will confirm with you by email before anything is deleted. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Deletion', style: 'destructive', onPress: () => submitRequest('deletion') },
      ],
    )
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
          <Text style={styles.backBtnText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy and Data</Text>
        <Text style={styles.headerSub}>Your rights over your personal data under GDPR.</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          style={styles.policyLink}
          activeOpacity={0.75}
          onPress={() => Linking.openURL(WEBSITE_LINKS.privacy)}
        >
          <Text style={styles.policyLinkText}>Read the full Privacy Policy</Text>
          <ExternalLink size={14} color={colors.navy} strokeWidth={2} />
        </TouchableOpacity>

        <Card style={styles.actionCard}>
          <View style={styles.actionIconWrap}><Download size={16} color={colors.navy} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Request a copy of your data</Text>
            <Text style={styles.actionSub}>Export everything UniBlueprint holds about you.</Text>
          </View>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.85}
            onPress={() => submitRequest('export')}
            disabled={!!submitting}
          >
            {submitting === 'export'
              ? <ActivityIndicator size="small" color={colors.cream} />
              : <Text style={styles.actionBtnText}>Request</Text>}
          </TouchableOpacity>
        </Card>

        <Card style={[styles.actionCard, { borderColor: 'rgba(220,38,38,0.15)' }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(220,38,38,0.08)' }]}>
            <Trash2 size={16} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Delete your account</Text>
            <Text style={styles.actionSub}>Permanently remove your account and personal data.</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            activeOpacity={0.85}
            onPress={confirmDeletion}
            disabled={!!submitting}
          >
            {submitting === 'deletion'
              ? <ActivityIndicator size="small" color="#DC2626" />
              : <Text style={styles.actionBtnDangerText}>Request</Text>}
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionEyebrow}>YOUR REQUESTS</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.navy} />
        ) : requests.length === 0 ? (
          <Text style={styles.emptyText}>No requests submitted yet.</Text>
        ) : (
          <Card style={{ padding: 0 }}>
            {requests.map((r, i, arr) => (
              <View key={r.id} style={[styles.reqRow, i < arr.length - 1 && styles.divider]}>
                <Clock size={14} color={colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqTitle}>{r.request_type === 'export' ? 'Data export' : 'Account deletion'}</Text>
                  <Text style={styles.reqSub}>{new Date(r.requested_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusChip, r.status === 'completed' && styles.statusChipDone]}>
                  <Text style={[styles.statusChipText, r.status === 'completed' && styles.statusChipTextDone]}>{r.status}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  headerTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, marginBottom: 6 },
  headerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.7)', lineHeight: 19 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  policyLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, marginBottom: spacing.lg,
    borderRadius: radius.button, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
  },
  policyLinkText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },

  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  actionIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(30,58,95,0.06)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, marginBottom: 2 },
  actionSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 16 },
  actionBtn: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9, minWidth: 78, alignItems: 'center' },
  actionBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.cream },
  actionBtnDanger: { backgroundColor: 'rgba(220,38,38,0.08)' },
  actionBtnDangerText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: '#DC2626' },

  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: 10,
  },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic' },

  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  reqTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  reqSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  statusChip: { backgroundColor: 'rgba(30,58,95,0.06)', borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  statusChipDone: { backgroundColor: '#F0FDF4' },
  statusChipText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, textTransform: 'capitalize' },
  statusChipTextDone: { color: '#15803D' },
})
