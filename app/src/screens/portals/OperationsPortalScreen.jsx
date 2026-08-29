import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeftRight, Inbox, ShieldAlert, MessageSquare, Check, X } from 'lucide-react-native'

import Card from '../../components/ui/Card'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const GDPR_LABELS = {
  export: 'Data export', deletion: 'Account deletion',
  correction: 'Data correction', restriction: 'Restrict processing',
}

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
  const { setPortalMode, user } = useAuth()

  const [queue, setQueue] = useState(null)
  const [gdprRequests, setGdprRequests] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [markingDone, setMarkingDone] = useState(null) // the request being actioned, or null
  const [doneNote, setDoneNote] = useState('')
  const [savingDone, setSavingDone] = useState(false)

  function backToMyBlueprint() {
    setPortalMode('personal')
    navigation.navigate('HomeMain')
  }

  async function loadGdpr() {
    const { data } = await supabase
      .from('gdpr_requests')
      .select('id, request_type, status, requested_at, due_at, name, email, user_id')
      .eq('status', 'pending')
      .order('due_at', { ascending: true })
      .limit(10)
    setGdprRequests(data || [])
  }

  function openMarkDone(req) {
    setDoneNote('')
    setMarkingDone(req)
  }

  async function confirmMarkDone() {
    if (!markingDone || savingDone) return
    setSavingDone(true)
    const { error } = await supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: user?.id,
        notes: doneNote.trim() || null,
      })
      .eq('id', markingDone.id)
    setSavingDone(false)
    if (!error) {
      setGdprRequests(prev => prev.filter(r => r.id !== markingDone.id))
      setMarkingDone(null)
    } else {
      Alert.alert('Something went wrong', 'Please try again.')
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ data: queueSnapshot }, , { data: enq }] = await Promise.all([
        supabase.rpc('get_ops_queue_snapshot'),
        loadGdpr(),
        supabase.from('coach_enquiries').select('id, coach_name, status, created_at').order('created_at', { ascending: false }).limit(10),
      ])
      if (cancelled) return
      setQueue(queueSnapshot?.[0] || null)
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
          ) : gdprRequests.map((r, i, arr) => {
            const overdue = new Date(r.due_at) < new Date()
            return (
              <View key={r.id} style={[styles.gdprRow, i < arr.length - 1 && styles.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{GDPR_LABELS[r.request_type] || r.request_type}</Text>
                  <Text style={styles.listRowSub}>
                    {r.name || r.email || 'Registered app user'} · Requested {new Date(r.requested_at).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.dueText, overdue && styles.dueTextOverdue]}>
                    {overdue ? 'Overdue — was due' : 'Due'} {new Date(r.due_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.markDoneBtn} activeOpacity={0.8} onPress={() => openMarkDone(r)}>
                  <Check size={13} color={colors.navy} />
                  <Text style={styles.markDoneBtnText}>Mark Done</Text>
                </TouchableOpacity>
              </View>
            )
          })}
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

      {/* Mark-done note — records what was actually done for the GDPR paper trail,
          instead of a bare confirm dialog with nothing kept for the record. */}
      <Modal visible={!!markingDone} transparent animationType="slide" onRequestClose={() => setMarkingDone(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Mark request completed</Text>
              <TouchableOpacity onPress={() => setMarkingDone(null)} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {!!markingDone && (
              <Text style={styles.modalSub}>
                Confirm the {(GDPR_LABELS[markingDone.request_type] || markingDone.request_type).toLowerCase()} request from{' '}
                {markingDone.name || markingDone.email || 'this user'} has actually been actioned.
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="What was done? e.g. exported to CSV and emailed, or deleted per retention policy"
              placeholderTextColor={colors.light}
              value={doneNote}
              onChangeText={setDoneNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.modalSaveBtn, savingDone && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={confirmMarkDone}
              disabled={savingDone}
            >
              <Text style={styles.modalSaveBtnText}>{savingDone ? 'Saving…' : 'Mark Done'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  gdprRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  dueText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 3 },
  dueTextOverdue: { color: '#DC2626', fontFamily: fonts.sansSemiBold },
  markDoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0,
    backgroundColor: 'rgba(30,58,95,0.06)', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  markDoneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.navy },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  listRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textTransform: 'capitalize' },
  listRowSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2, textTransform: 'capitalize' },
  emptyRow: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, fontStyle: 'italic', padding: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, flex: 1, marginRight: 12 },
  modalSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 14 },
  modalInput: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 84,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
    marginBottom: 14,
  },
  modalSaveBtn: { backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14, alignItems: 'center' },
  modalSaveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})
