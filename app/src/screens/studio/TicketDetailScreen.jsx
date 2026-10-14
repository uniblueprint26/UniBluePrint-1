import { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { AlertCircle, Clock, Sparkles, FileText, Flag, CheckCircle2 } from 'lucide-react-native'

import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ScreenHeader from '../../components/ui/ScreenHeader'
import { FieldLabel, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { formatDocumentContent } from '../../lib/formatGeneratedDocument'
import { ticketUrgency, getTicketDisplayName } from '../../hooks/useHandlerTickets'
import { useSafeGoBack } from '../../hooks/useSafeGoBack'

// TicketDetailScreen — what a Campus Handler actually needs to review and act
// on one ticket, opened from StudioQueueScreen's TicketCard (replacing the
// "coming soon" Alert it used to show).
//
// Per the founder's own framing of the job: Handlers don't write the
// document, the generator does — a Handler's job is to review the AI draft
// against what the student actually submitted, then deliver, flag, or send
// it back. So this screen's core content is the student's original intake
// (document_table.input / .questions) and the AI-generated draft
// (document_table.generated / .student_strategy), read directly off
// whichever of the 8 service tables this submission's document_table points
// at — same join MyOutputsScreen/OutputDetailScreen/CareerReadinessScreen
// already use submissions.document_table/document_id for.
//
// The generated draft is rendered with formatDocumentContent({forHandler:
// true}) (see lib/formatGeneratedDocument.js) rather than
// OutputDetailScreen's student-facing formatGeneratedDocument() — a Handler
// is exactly the audience handler_notes/handler_guide/handler_mock_rubric
// were written for, so those stay in, instead of being stripped the way
// they are for the student's own delivered-document view.
//
// The actual review action: submit_handler_decision() (migration
// 20260728090000_quality_scoring_acknowledgement.sql) already existed in the
// backend — a single RPC that records a 5-dimension quality scorecard
// (accuracy/quality/completeness/tone/deliverability, 1-5 each) and then
// calls deliver_submission() / flag_submission() / mark_submission_incomplete()
// for the actual stage transition, all in one transaction — but nothing in
// the app called it from anywhere. This screen is that missing call site.
// start_review() (claim_submission's other sibling) is wired in too, fired
// once, quietly, the first time a Handler opens an 'assigned' ticket here.

const DOC_CONFIG = {
  cv_documents:         { outputColumn: 'generated',        intakeColumn: 'input' },
  cover_letters:        { outputColumn: 'generated',        intakeColumn: 'input' },
  application_forms:    { outputColumn: 'generated',        intakeColumn: 'questions' },
  interview_prep_packs: { outputColumn: 'generated',        intakeColumn: 'input' },
  linkedin_documents:   { outputColumn: 'generated',        intakeColumn: 'input' },
  personal_statements:  { outputColumn: 'generated',        intakeColumn: 'input' },
  portfolio_plans:      { outputColumn: 'generated',        intakeColumn: 'input' },
  job_search_sessions:  { outputColumn: 'student_strategy', intakeColumn: 'input', handlerGuideTable: 'job_search_handler_guides' },
}

const META_FIELD_LABELS = {
  title: 'Title',
  style: 'Style',
  target_role: 'Target Role',
  target_industry: 'Target Industry',
  target_company: 'Target Company',
  job_description: 'Job Description',
  pathway: 'Pathway',
  target_course: 'Target Course',
  target_institution: 'Target Institution',
  field: 'Field',
  interview_type: 'Interview Type',
}

const SCORE_DIMENSIONS = [
  { key: 'accuracy', label: 'Accuracy', hint: 'Does it match what the student actually told us?' },
  { key: 'quality', label: 'Quality', hint: 'Is the writing itself strong?' },
  { key: 'completeness', label: 'Completeness', hint: 'Does it cover everything the service promises?' },
  { key: 'tone', label: 'Tone', hint: 'Right register for this student and service?' },
  { key: 'deliverability', label: 'Deliverability', hint: 'Ready to hand to the student as-is?' },
]
const SCORE_OPTIONS = [1, 2, 3, 4, 5].map(n => ({ value: n, label: String(n) }))

// Mirrors public.has_two_sentences() closely enough to give the Handler an
// inline hint before they hit the server-side check — the RPC is the real
// authority, this is just so the "why is Deliver disabled" question doesn't
// go unanswered until after a failed round trip.
function hasTwoSentencesClient(text) {
  const trimmed = (text || '').trim()
  if (trimmed.length < 20) return false
  return trimmed.split(/[.!?]+\s*/).filter(Boolean).length >= 2
}

function formatDeadline(iso) {
  if (!iso) return 'No deadline set'
  const d = new Date(iso)
  return d.toLocaleString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

const URGENCY_COLOR = { green: '#16A34A', amber: '#F59E0B', red: '#DC2626' }

function Pill({ label, bg, fg }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, color: fg }}>{label}</Text>
    </View>
  )
}

function ContentBlock({ text, emptyLabel }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors, isDark)
  if (!text) {
    return <Text style={styles.emptyBlockText}>{emptyLabel}</Text>
  }
  return <Text selectable style={styles.bodyText}>{text}</Text>
}

export default function TicketDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors, isDark)
  const { ticketId } = route.params || {}
  const safeGoBack = useSafeGoBack(navigation, 'StudioQueue')

  const [status, setStatus] = useState('loading') // loading | ok | error
  const [submission, setSubmission] = useState(null)
  const [docStatus, setDocStatus] = useState('loading') // loading | ok | error | unsupported
  const [doc, setDoc] = useState(null)
  const [handlerGuide, setHandlerGuide] = useState(null)
  const [revisions, setRevisions] = useState([])

  const [scores, setScores] = useState({ accuracy: null, quality: null, completeness: null, tone: null, deliverability: null })
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const [submittingDecision, setSubmittingDecision] = useState(null) // 'approved' | 'flagged' | 'incomplete' | null

  const loadDocument = useCallback(async sub => {
    const config = sub.document_table ? DOC_CONFIG[sub.document_table] : null
    if (!sub.document_table || !config) {
      setDocStatus('unsupported')
      return
    }
    setDocStatus('loading')
    try {
      const { data, error } = await supabase
        .from(sub.document_table)
        .select('*')
        .eq('id', sub.document_id)
        .single()
      if (error || !data) {
        console.error('[TicketDetail] could not load document', sub.document_table, error)
        setDocStatus('error')
        return
      }
      setDoc(data)
      setDocStatus('ok')

      if (config.handlerGuideTable) {
        const { data: guideRow, error: guideErr } = await supabase
          .from(config.handlerGuideTable)
          .select('handler_guide')
          .eq('session_id', sub.document_id)
          .maybeSingle()
        if (!guideErr && guideRow) setHandlerGuide(guideRow.handler_guide)
      }
    } catch (e) {
      console.error('[TicketDetail] unexpected error loading document', e)
      setDocStatus('error')
    }
  }, [])

  const loadRevisions = useCallback(async submissionId => {
    try {
      const { data, error } = await supabase
        .from('ticket_revisions')
        .select('id, revision_notes, created_at')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false })
      if (!error && data) setRevisions(data)
    } catch {
      // Best-effort history — not critical to the review itself.
    }
  }, [])

  const load = useCallback(async () => {
    if (!ticketId) { setStatus('error'); return }
    setStatus('loading')
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, user_id, tier, stage, turnaround_deadline, submitted_at, notes, submitted_name, document_table, document_id, marked_incomplete, incomplete_reason, services(name)')
        .eq('id', ticketId)
        .single()
      if (error || !data) {
        console.error('[TicketDetail] could not load submission', error)
        setStatus('error')
        return
      }
      setSubmission(data)
      setStatus('ok')
      await loadDocument(data)
      loadRevisions(data.id)

      // "I've claimed it" (assigned) → "I'm actively looking at it" (in_review)
      // — start_review() existed in the pipeline with no caller anywhere in
      // the app. Fire it once per screen visit, best-effort: a failure here
      // (e.g. a stale assignment) shouldn't block reading the ticket.
      if (data.stage === 'assigned') {
        const { error: reviewErr } = await supabase.rpc('start_review', { p_submission_id: data.id })
        if (!reviewErr) {
          setSubmission(prev => (prev ? { ...prev, stage: 'in_review' } : prev))
        }
      }
    } catch (e) {
      console.error('[TicketDetail] unexpected error loading submission', e)
      setStatus('error')
    }
  }, [ticketId, loadDocument, loadRevisions])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function setScore(dimension, value) {
    setScores(prev => ({ ...prev, [dimension]: value }))
    setFormError('')
  }

  const allScored = SCORE_DIMENSIONS.every(d => scores[d.key] != null)
  const composite = allScored ? SCORE_DIMENSIONS.reduce((sum, d) => sum + scores[d.key], 0) : null
  const lowestScore = allScored ? Math.min(...SCORE_DIMENSIONS.map(d => scores[d.key])) : null
  const noteValid = hasTwoSentencesClient(note)

  function confirmLowScoreOverride() {
    return new Promise(resolve => {
      Alert.alert(
        'Low composite score',
        `This draft scored ${composite}/25 overall. Approving and delivering anyway requires confirming that explicitly.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Deliver anyway', style: 'destructive', onPress: () => resolve(true) },
        ],
      )
    })
  }

  async function submitDecision(decision) {
    if (!allScored) {
      setFormError('Score all five quality dimensions before submitting a decision.')
      return
    }
    if (!noteValid) {
      setFormError('Your note needs at least two sentences explaining the decision.')
      return
    }
    if (decision === 'approved' && lowestScore === 1) {
      setFormError('A score of 1 on any dimension means this has to be flagged to Operations, not delivered.')
      return
    }

    let lowScoreOverride = false
    if (decision === 'approved' && composite < 11) {
      const confirmed = await confirmLowScoreOverride()
      if (!confirmed) return
      lowScoreOverride = true
    }

    setFormError('')
    setSubmittingDecision(decision)
    try {
      const { error } = await supabase.rpc('submit_handler_decision', {
        p_submission_id: submission.id,
        p_decision: decision,
        p_handler_note: note.trim(),
        p_accuracy: scores.accuracy,
        p_quality: scores.quality,
        p_completeness: scores.completeness,
        p_tone: scores.tone,
        p_deliverability: scores.deliverability,
        p_low_score_override: lowScoreOverride,
      })
      if (error) {
        console.error('[TicketDetail] submit_handler_decision failed', error)
        setFormError(error.message || 'Something went wrong submitting your decision. Please try again.')
        return
      }
      const copy = {
        approved: 'Delivered to the student.',
        flagged: 'Flagged to Operations.',
        incomplete: 'Marked incomplete — the student has been notified.',
      }[decision]
      Alert.alert('Done', copy, [{ text: 'OK', onPress: safeGoBack }])
    } catch (e) {
      console.error('[TicketDetail] unexpected error submitting decision', e)
      setFormError('Something went wrong submitting your decision. Please try again.')
    } finally {
      setSubmittingDecision(null)
    }
  }

  if (status === 'loading') {
    return (
      <View style={styles.screen}>
        <ScreenHeader variant="navy" onBack={safeGoBack} backLabel="Queue" eyebrow="TICKET" title="Loading..." style={styles.heroBlock} titleStyle={styles.heroTitle} />
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
      </View>
    )
  }

  if (status === 'error' || !submission) {
    return (
      <View style={styles.screen}>
        <ScreenHeader variant="navy" onBack={safeGoBack} backLabel="Queue" eyebrow="TICKET" title="Ticket" style={styles.heroBlock} titleStyle={styles.heroTitle} />
        <Card style={[styles.messageCard, { margin: spacing.md }]}>
          <AlertCircle size={32} color={colors.destructive} />
          <Text style={styles.messageTitle}>Couldn't load this ticket</Text>
          <Text style={styles.messageSub}>Check your connection and try again.</Text>
          <Button label="Try again" onPress={load} variant="secondary" style={{ marginTop: 12 }} />
        </Card>
      </View>
    )
  }

  const serviceName = submission.services?.name || 'Service'
  const tierLabel = submission.tier === 'premium' ? 'Premium' : 'Standard'
  const urgency = ticketUrgency(submission.turnaround_deadline, submission.tier)
  const displayName = getTicketDisplayName(submission)
  const config = submission.document_table ? DOC_CONFIG[submission.document_table] : null
  const alreadyDelivered = submission.stage === 'delivered'

  const intakeText = doc && config ? formatDocumentContent(doc[config.intakeColumn]) : ''
  const generatedText = doc && config ? formatDocumentContent(doc[config.outputColumn], { forHandler: true }) : ''
  const handlerGuideText = handlerGuide ? formatDocumentContent(handlerGuide, { forHandler: true }) : ''

  const metaEntries = doc
    ? Object.entries(META_FIELD_LABELS)
        .filter(([key]) => typeof doc[key] === 'string' && doc[key].trim().length > 0)
        .map(([key, label]) => [label, doc[key]])
    : []

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        onBack={safeGoBack}
        backLabel="Queue"
        eyebrow="THE BLUEPRINT STUDIO"
        title={serviceName}
        subtitle={`${displayName} · ${tierLabel}`}
        style={styles.heroBlock}
        titleStyle={styles.heroTitle}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status row */}
        <View style={styles.statusRow}>
          <View style={styles.urgencyRow}>
            <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLOR[urgency] }]} />
            <Clock size={13} color={colors.muted} />
            <Text style={styles.deadlineText}>{formatDeadline(submission.turnaround_deadline)}</Text>
          </View>
          <Pill
            label={alreadyDelivered ? 'Delivered' : submission.stage === 'in_review' ? 'In Review' : 'Assigned'}
            bg={alreadyDelivered ? colors.successBg : colors.infoBg}
            fg={alreadyDelivered ? colors.success : colors.textPrimary}
          />
        </View>

        {submission.marked_incomplete && (
          <Card style={[styles.noticeCard, { borderColor: colors.warning }]}>
            <AlertCircle size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Already marked incomplete</Text>
              {!!submission.incomplete_reason && <Text style={styles.noticeBody}>{submission.incomplete_reason}</Text>}
            </View>
          </Card>
        )}

        {alreadyDelivered && (
          <Card style={[styles.noticeCard, { borderColor: colors.success }]}>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={styles.noticeBody}>This ticket has already been delivered to the student.</Text>
          </Card>
        )}

        {/* Student's submission */}
        <Text style={styles.sectionLabel}>STUDENT'S SUBMISSION</Text>
        <Card style={styles.sectionCard}>
          {docStatus === 'loading' && <ActivityIndicator color={colors.textPrimary} />}
          {docStatus === 'unsupported' && (
            <View style={styles.inlineNotice}>
              <AlertCircle size={16} color={colors.muted} />
              <Text style={styles.inlineNoticeText}>
                This submission has no linked document record, so there's nothing to review here beyond the ticket metadata above.
              </Text>
            </View>
          )}
          {docStatus === 'error' && (
            <View style={styles.inlineNotice}>
              <AlertCircle size={16} color={colors.destructive} />
              <Text style={[styles.inlineNoticeText, { color: colors.destructive }]}>
                Couldn't load the student's submitted answers — the linked document record may be missing or inaccessible. Flag this to Operations rather than delivering blind.
              </Text>
            </View>
          )}
          {!!submission.notes && (
            <View style={styles.metaGrid}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Student's Note</Text>
                <Text style={styles.metaValue}>{submission.notes}</Text>
              </View>
            </View>
          )}
          {docStatus === 'ok' && (
            <>
              {metaEntries.length > 0 && (
                <View style={styles.metaGrid}>
                  {metaEntries.map(([label, value]) => (
                    <View key={label} style={styles.metaRow}>
                      <Text style={styles.metaLabel}>{label}</Text>
                      <Text style={styles.metaValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              )}
              <ContentBlock text={intakeText} emptyLabel="No submitted answers found on this record." />
            </>
          )}
        </Card>

        {/* AI-generated draft */}
        <Text style={styles.sectionLabel}>AI-GENERATED DRAFT — FOR YOUR REVIEW</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.inlineNotice}>
            <Sparkles size={15} color={colors.goldDeep} />
            <Text style={styles.inlineNoticeText}>
              Written by the generator from the submission above, not by you — your job is to check it against that submission, not to write it yourself.
            </Text>
          </View>
          {docStatus === 'ok' && <ContentBlock text={generatedText} emptyLabel="Nothing generated yet for this submission." />}
          {docStatus !== 'ok' && <ContentBlock text="" emptyLabel="Unavailable until the submission above loads." />}
        </Card>

        {!!handlerGuide && (
          <>
            <Text style={styles.sectionLabel}>HANDLER SESSION GUIDE</Text>
            <Card style={styles.sectionCard}>
              <View style={styles.inlineNotice}>
                <FileText size={15} color={colors.textPrimary} />
                <Text style={styles.inlineNoticeText}>Handler-only — never shown to the student. Use this to run the advisory session.</Text>
              </View>
              <ContentBlock text={handlerGuideText} emptyLabel="No session guide on record." />
            </Card>
          </>
        )}

        {revisions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>REVIEW HISTORY</Text>
            <Card style={styles.sectionCard}>
              {revisions.map((r, i) => (
                <View key={r.id} style={[styles.revisionRow, i > 0 && styles.revisionRowDivider]}>
                  <Text style={styles.revisionDate}>{formatDate(r.created_at)}</Text>
                  <Text style={styles.revisionText}>{r.revision_notes}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Decision */}
        {!alreadyDelivered && (
          <>
            <Text style={styles.sectionLabel}>YOUR DECISION</Text>
            <Card style={styles.sectionCard}>
              {SCORE_DIMENSIONS.map(d => (
                <View key={d.key} style={{ marginBottom: 16 }}>
                  <FieldLabel hint={d.hint}>{d.label}</FieldLabel>
                  <ChoiceGrid options={SCORE_OPTIONS} value={scores[d.key]} onChange={v => setScore(d.key, v)} />
                </View>
              ))}

              <FieldLabel hint="At least two sentences — this is recorded against the ticket and, for a flag or incomplete, sent to the student or Operations.">
                Handler note
              </FieldLabel>
              <FormTextArea
                value={note}
                onChangeText={t => { setNote(t); setFormError('') }}
                placeholder="What did you check, and what's your decision based on?"
                minHeight={100}
              />

              {!!formError && (
                <View style={styles.formErrorBox}>
                  <AlertCircle size={15} color={colors.destructive} />
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              <View style={{ gap: 10, marginTop: 16 }}>
                <Button
                  label="Approve & Deliver to Student"
                  onPress={() => submitDecision('approved')}
                  variant="primary"
                  loading={submittingDecision === 'approved'}
                  disabled={!!submittingDecision}
                />
                <Button
                  label="Mark Incomplete"
                  onPress={() => submitDecision('incomplete')}
                  variant="secondary"
                  loading={submittingDecision === 'incomplete'}
                  disabled={!!submittingDecision}
                />
                <Button
                  label="Flag to Operations"
                  icon={Flag}
                  onPress={() => submitDecision('flagged')}
                  variant="destructive"
                  loading={submittingDecision === 'flagged'}
                  disabled={!!submittingDecision}
                />
              </View>
            </Card>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function __gs_styles(colors, isDark) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },

    heroBlock: { backgroundColor: colors.chromeBg, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
    heroTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.chromeFg, marginTop: 6 },

    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    urgencyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    urgencyDot: { width: 9, height: 9, borderRadius: 4.5 },
    deadlineText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },

    noticeCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      padding: 14, marginBottom: 14, borderWidth: 1.5,
    },
    noticeTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, marginBottom: 2 },
    noticeBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18, flex: 1 },

    sectionLabel: {
      fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1,
      color: colors.muted, marginBottom: 8, marginTop: 6,
    },
    sectionCard: { padding: 16, marginBottom: 18 },

    inlineNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
    inlineNoticeText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18, flex: 1 },

    metaGrid: { marginBottom: 14, gap: 6 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    metaLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },
    metaValue: { fontFamily: fonts.sans, fontSize: 12, color: colors.textPrimary, flex: 1, textAlign: 'right' },

    bodyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
    emptyBlockText: { fontFamily: fonts.sans, fontSize: 13, color: colors.light, fontStyle: 'italic' },

    revisionRow: { paddingVertical: 10 },
    revisionRowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
    revisionDate: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, marginBottom: 2 },
    revisionText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 19 },

    formErrorBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)',
      borderRadius: radius.button, padding: 12, marginTop: 14,
    },
    formErrorText: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, lineHeight: 18, flex: 1 },

    messageCard: { alignItems: 'center', paddingVertical: 36, gap: 8 },
    messageTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary, marginTop: 6, textAlign: 'center' },
    messageSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },
  })
}
