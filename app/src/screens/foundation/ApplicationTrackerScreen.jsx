import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  Briefcase, Plus, X, Trash2, ChevronRight, FileText, CalendarClock, Link2,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { fonts, radius, spacing, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useSafeGoBack } from '../../hooks/useSafeGoBack'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'
import StatTile, { StatTileRow } from '../../components/ui/StatTile'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'

// Application Tracker — a personal, manual record of applications the
// student made ELSEWHERE (no job-board/API integration). Lives in
// Foundation Blueprint right beside My Outputs: the one thing a generic
// to-do-list tracker can't do is point at the exact CV/cover-letter version
// the student actually used, which is what submission_id (an optional link
// to one of this user's own DELIVERED Foundation Blueprint submissions)
// is for — closing the loop from "we helped you write it" to "we helped
// you land it". See supabase/migrations/20261015140000_job_application_tracker.sql.
//
// Deadline reminders (within 3 days of the deadline, once per application)
// are handled entirely server-side by handle_application_deadline_reminders(),
// a daily pg_cron job — this screen has no reminder logic of its own beyond
// showing the same "due soon" window back to the student.

const REMINDER_WINDOW_DAYS = 3

const STAGES = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]
const STAGE_LABEL = Object.fromEntries(STAGES.map(s => [s.value, s.label]))
// Same palette family as MyOutputsScreen's STAGE_COLOR (blue in progress,
// gold for a live moment, green for a win) plus a shared muted grey for the
// two closed-and-done stages, mirroring that screen's own EXPIRED_COLOR
// convention for "nothing left to track here".
const STAGE_COLOR = {
  applied:   { fg: '#1d4ed8', bg: '#EFF6FF' },
  interview: { fg: '#B45309', bg: '#FEF3C7' },
  offer:     { fg: '#15803D', bg: '#F0FDF4' },
  rejected:  { fg: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  withdrawn: { fg: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}
const CLOSED_STAGES = new Set(['rejected', 'withdrawn'])

const EMPTY_FORM = { companyName: '', roleTitle: '', stage: 'applied', deadline: '', notes: '', submissionId: null }

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

// Deliberately plain YYYY-MM-DD text entry rather than a native date-picker
// dependency this app doesn't otherwise have — validated here so a typo
// can't silently save as `null` or an unparseable value.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
function isValidDateStr(v) {
  if (!DATE_RE.test(v)) return false
  const d = new Date(v + 'T00:00:00')
  return !Number.isNaN(d.getTime())
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export default function ApplicationTrackerScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation, 'Foundation')

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  // This user's own DELIVERED submissions, offered as the optional "which
  // document did you use" link — never any other user's, and never a
  // not-yet-delivered one (there'd be nothing finished to point at yet).
  const [submissions, setSubmissions] = useState([])

  // 'list' | 'form'
  const [mode, setMode] = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    const [appsRes, subsRes] = await Promise.all([
      supabase
        .from('job_applications')
        .select('id, company_name, role_title, stage, deadline, submission_id, notes')
        .eq('user_id', user.id)
        // Soonest deadline first; rows with no deadline fall to the bottom
        // rather than sorting as if a null deadline were "most urgent".
        .order('deadline', { ascending: true, nullsFirst: false }),
      supabase
        .from('submissions')
        .select('id, document_table, delivered_at, services(name)')
        .eq('user_id', user.id)
        .eq('stage', 'delivered')
        .order('delivered_at', { ascending: false }),
    ])
    if (!appsRes.error && appsRes.data) setApplications(appsRes.data)
    if (!subsRes.error && subsRes.data) setSubmissions(subsRes.data)
    setLoading(false)
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function submissionLabel(sub) {
    const name = sub?.services?.name || 'Delivered document'
    return sub?.delivered_at ? `${name} — delivered ${formatDate(sub.delivered_at.slice(0, 10))}` : name
  }

  function startAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setMode('form')
  }

  function startEdit(app) {
    setEditingId(app.id)
    setForm({
      companyName: app.company_name,
      roleTitle: app.role_title,
      stage: app.stage,
      deadline: app.deadline || '',
      notes: app.notes || '',
      submissionId: app.submission_id || null,
    })
    setFormError(null)
    setMode('form')
  }

  function cancelForm() {
    Keyboard.dismiss()
    setMode('list')
    setFormError(null)
  }

  function setField(key, v) {
    setForm(prev => ({ ...prev, [key]: v }))
  }

  async function save() {
    if (isBlank(form.companyName)) { setFormError('Add the company name.'); return }
    if (isBlank(form.roleTitle)) { setFormError('Add the role you applied for.'); return }
    const deadline = form.deadline.trim()
    if (deadline && !isValidDateStr(deadline)) {
      setFormError('Enter the deadline as YYYY-MM-DD, e.g. 2026-11-03.')
      return
    }
    if (!user?.id) { setFormError('You need to be signed in to save this.'); return }

    setFormError(null)
    setSaving(true)
    const payload = {
      company_name: form.companyName.trim(),
      role_title: form.roleTitle.trim(),
      stage: form.stage,
      deadline: deadline || null,
      notes: form.notes.trim() || null,
      submission_id: form.submissionId || null,
    }
    const { error } = editingId
      ? await supabase.from('job_applications').update(payload).eq('id', editingId)
      : await supabase.from('job_applications').insert({ ...payload, user_id: user.id })
    setSaving(false)
    if (error) { setFormError(error.message || 'Could not save this application. Please try again.'); return }
    setMode('list')
    load()
  }

  function confirmDelete() {
    Alert.alert(
      'Remove this application?',
      `This removes your tracker entry for ${form.roleTitle || 'this application'}${form.companyName ? ` at ${form.companyName}` : ''}. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ],
    )
  }

  async function doDelete() {
    if (!editingId) return
    const id = editingId
    setApplications(prev => prev.filter(a => a.id !== id)) // optimistic
    setMode('list')
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) load() // reconcile on failure
  }

  // ── Form (add / edit) ────────────────────────────────────────────────────
  if (mode === 'form') {
    return (
      <View style={styles.screen}>
        <View style={[styles.formHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={cancelForm} activeOpacity={0.7} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Close">
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingId ? 'Edit application' : 'Add application'}</Text>
          {editingId ? (
            <TouchableOpacity onPress={confirmDelete} activeOpacity={0.7} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Delete application">
              <Trash2 size={18} color={colors.destructive} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 14 }}>
            <View>
              <FieldLabel required>Company</FieldLabel>
              <FormTextInput value={form.companyName} onChangeText={t => setField('companyName', t)} placeholder="e.g. Acme Ltd" />
            </View>
            <View>
              <FieldLabel required>Role</FieldLabel>
              <FormTextInput value={form.roleTitle} onChangeText={t => setField('roleTitle', t)} placeholder="e.g. Marketing Intern" />
            </View>
            <View>
              <FieldLabel>Stage</FieldLabel>
              <ChoiceGrid options={STAGES} value={form.stage} onChange={v => setField('stage', v)} />
            </View>
            <View>
              <FieldLabel hint="Optional — used to remind you when it's coming up.">Deadline</FieldLabel>
              <View style={styles.deadlineRow}>
                <FormTextInput
                  value={form.deadline}
                  onChangeText={t => setField('deadline', t)}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                />
                {!!form.deadline && (
                  <TouchableOpacity onPress={() => setField('deadline', '')} style={styles.clearDeadlineBtn} accessibilityRole="button" accessibilityLabel="Clear deadline">
                    <X size={14} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* The actual competitive-gap feature: link this application to
                the real delivered document the student used for it, not a
                duplicate copy of it. */}
            <View>
              <FieldLabel hint="Which delivered document did you use for this one, if any?">Linked document</FieldLabel>
              {submissions.length === 0 ? (
                <Text style={styles.noSubmissionsHint}>
                  You don't have any delivered Foundation Blueprint documents to link yet — you can still track this application without one.
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setField('submissionId', null)}
                    style={[styles.subRow, form.submissionId === null && styles.subRowActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: form.submissionId === null }}
                  >
                    <Text style={[styles.subRowText, form.submissionId === null && styles.subRowTextActive]}>None</Text>
                  </TouchableOpacity>
                  {submissions.map(sub => {
                    const active = form.submissionId === sub.id
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        activeOpacity={0.8}
                        onPress={() => setField('submissionId', sub.id)}
                        style={[styles.subRow, active && styles.subRowActive]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                      >
                        <FileText size={14} color={active ? colors.accentBg : colors.muted} />
                        <Text style={[styles.subRowText, active && styles.subRowTextActive]} numberOfLines={1}>{submissionLabel(sub)}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </View>

            <View>
              <FieldLabel>Notes</FieldLabel>
              <FormTextArea value={form.notes} onChangeText={t => setField('notes', t)} placeholder="Anything worth remembering — a referral, interview format, salary range…" minHeight={90} />
            </View>

            {!!formError && (
              <View style={styles.errorBox} accessibilityLiveRegion="polite" accessibilityRole="alert">
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.formActions}>
              <TouchableOpacity onPress={cancelForm} activeOpacity={0.7} style={styles.cancelBtn} accessibilityRole="button">
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <Button
                label={saving ? 'Saving…' : editingId ? 'Save changes' : 'Add application'}
                onPress={save}
                variant="primary"
                loading={saving}
                style={styles.saveBtn}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ── List ──────────────────────────────────────────────────────────────────
  const activeCount = applications.filter(a => !CLOSED_STAGES.has(a.stage)).length
  const offerCount = applications.filter(a => a.stage === 'offer').length
  const dueSoonCount = applications.filter(a => {
    if (!a.deadline || CLOSED_STAGES.has(a.stage)) return false
    const d = daysUntil(a.deadline)
    return d !== null && d >= 0 && d <= REMINDER_WINDOW_DAYS
  }).length

  return (
    <View style={styles.screen}>
      <View style={[styles.listHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={safeGoBack} activeOpacity={0.7} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Back to Foundation Blueprint">
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Tracker</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>Every application you've made, in one place — with a reminder before each deadline.</Text>

        {!loading && applications.length > 0 && (
          <StatTileRow style={{ marginTop: spacing.md }}>
            <StatTile icon={Briefcase} iconBg="#EFF6FF" iconColor={colors.textPrimary} value={activeCount} label="Active" border />
            <StatTile icon={CalendarClock} iconBg="#FEF3C7" iconColor={colors.goldDeep} value={dueSoonCount} label="Due soon" border />
            <StatTile icon={FileText} iconBg="#F0FDF4" iconColor={colors.success} value={offerCount} label="Offers" />
          </StatTileRow>
        )}

        <Text style={styles.sectionLabel}>Your applications</Text>
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Nothing tracked yet"
            subtitle="Add the applications you've sent out — link one to a delivered CV or cover letter and we'll remind you before the deadline."
            ctaLabel="Add your first application"
            onCtaPress={startAdd}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {applications.map(app => {
              const stageColor = STAGE_COLOR[app.stage] || STAGE_COLOR.applied
              const due = app.deadline ? daysUntil(app.deadline) : null
              const dueSoon = due !== null && due >= 0 && due <= REMINDER_WINDOW_DAYS && !CLOSED_STAGES.has(app.stage)
              return (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => startEdit(app)}
                  activeOpacity={0.85}
                  style={styles.appCard}
                  accessibilityRole="button"
                  accessibilityLabel={`${app.role_title} at ${app.company_name}`}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.appTopRow}>
                      <Text style={styles.appRole} numberOfLines={1}>{app.role_title}</Text>
                      <View style={[styles.stagePill, { backgroundColor: stageColor.bg }]}>
                        <Text style={[styles.stagePillText, { color: stageColor.fg }]}>{STAGE_LABEL[app.stage] || app.stage}</Text>
                      </View>
                    </View>
                    <Text style={styles.appCompany} numberOfLines={1}>{app.company_name}</Text>
                    <View style={styles.appMetaRow}>
                      {app.deadline ? (
                        <Text style={[styles.appMeta, dueSoon && styles.appMetaDueSoon]}>
                          {dueSoon ? (due === 0 ? 'Due today' : `Due in ${due}d`) : `Due ${formatDate(app.deadline)}`}
                        </Text>
                      ) : (
                        <Text style={styles.appMeta}>No deadline set</Text>
                      )}
                      {!!app.submission_id && (
                        <View style={styles.linkedChip}>
                          <Link2 size={10} color={colors.textPrimary} strokeWidth={2.2} />
                          <Text style={styles.linkedChipText}>Linked document</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.light} strokeWidth={2} />
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {applications.length > 0 && (
          <TouchableOpacity onPress={startAdd} activeOpacity={0.8} style={styles.addBtn} accessibilityRole="button">
            <Plus size={16} color={colors.textPrimary} />
            <Text style={styles.addBtnText}>Add another application</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },

  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  formHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  pageSubtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },

  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  appCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, ...shadows.card,
  },
  appTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  appRole: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },
  appCompany: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  appMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  appMeta: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted },
  appMetaDueSoon: { color: '#B45309' },
  linkedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  linkedChipText: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.textPrimary },

  stagePill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  stagePillText: { fontFamily: fonts.sansSemiBold, fontSize: 10 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.accentBg,
    borderStyle: 'dashed', marginTop: 16,
  },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },

  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearDeadlineBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  noSubmissionsHint: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.button,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.surface,
  },
  subRowActive: { borderColor: colors.accentBg, backgroundColor: 'rgba(30,58,95,0.04)' },
  subRowText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted, flex: 1 },
  subRowTextActive: { color: colors.accentBg, fontFamily: fonts.sansSemiBold },

  formActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted },
  saveBtn: { flex: 2 },

  errorBox: { marginTop: 4, backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: radius.button, padding: 12 },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },
  })
}
