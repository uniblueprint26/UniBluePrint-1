import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  X, ChevronLeft, Trash2, Plus, Pencil,
  BookOpen, FileText, MessageSquare,
  Briefcase, GraduationCap, Users, Layers, TrendingUp, Award,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'
import { FieldLabel, FormTextInput, FormTextArea } from '../../components/forms/FormControls'

// Evidence Bank — real STAR stories (Situation/Task/Action/Result) a student
// builds up once and reuses across services. Application Form Assistance
// hard-requires at least one story (generate-application-answers/index.ts
// errors "Add at least one story..." on an empty bank); Interview Preparation
// and Application Answers both draw on it as supporting evidence when present.
// Matches the evidence_bank_stories table (see
// supabase/migrations/20260724120000_application_form_assistance.sql plus the
// category column added in 20260915130000_evidence_bank_story_category.sql):
// title, situation, task, action, result all required text; category one of
// the six below; competency_tags a text[] (kept as an empty default here —
// the guided add flow below matches the brief's five plain-language STAR
// questions exactly and doesn't add a sixth "pick your competencies" step).
//
// The add flow is deliberately NOT a single big form. It's a discrete,
// one-question-at-a-time walk (QuestionFlow, the same pattern the other 7
// Foundation Blueprint intakes use) that happens to collect Situation/Task/
// Action/Result — STAR — without ever naming it that to the student. Once
// saved, a story renders as a populated card (category tag + preview) that
// opens into a full editable detail view on tap.

export const CATEGORIES = [
  { value: 'work', label: 'Work', promptLabel: 'WORK', icon: Briefcase },
  { value: 'college', label: 'College', promptLabel: 'COLLEGE', icon: GraduationCap },
  { value: 'leadership', label: 'Leadership', promptLabel: 'LEADERSHIP', icon: Users },
  { value: 'project', label: 'Project', promptLabel: 'PROJECTS', icon: Layers },
  { value: 'challenge', label: 'Challenge', promptLabel: 'CHALLENGES', icon: TrendingUp },
  { value: 'achievement', label: 'Achievement', promptLabel: 'ACHIEVEMENTS', icon: Award },
]

function categoryMeta(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[0]
}

const EMPTY_ADD_VALUES = { situation: '', category: null, task: '', action: '', result: '' }

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

// The add flow never asks for a title directly — it isn't one of the brief's
// five questions — so one is derived from the first line of "what happened".
function deriveTitle(situation) {
  const clean = (situation || '').trim().replace(/\s+/g, ' ')
  if (clean.length <= 64) return clean || 'Untitled story'
  return `${clean.slice(0, 61).trimEnd()}…`
}

/** Vertical list of radio rows — a real radio control (circle + fill), not a
 *  pill grid, for the "Where?" step: Work / College / Leadership / Project /
 *  Challenge / Achievement, single-select. */
function RadioOptions({ options, value, onChange }) {
  return (
    <View style={{ gap: 10 }}>
      {options.map(opt => {
        const active = value === opt.value
        const Icon = opt.icon
        return (
          <TouchableOpacity
            key={opt.value}
            activeOpacity={0.8}
            onPress={() => onChange(opt.value)}
            style={[styles.radioRow, active && styles.radioRowActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <View style={[styles.radioCircle, active && styles.radioCircleActive]}>
              {active && <View style={styles.radioDot} />}
            </View>
            {!!Icon && <Icon size={16} color={active ? colors.navy : colors.muted} style={{ marginRight: 4 }} />}
            <Text style={[styles.radioLabel, active && styles.radioLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const ADD_STEPS = [
  {
    key: 'situation',
    title: 'What happened?',
    subtitle: 'Set the scene — a job, a class project, a society you ran, a moment things went sideways and you fixed it.',
    validate: v => isBlank(v) ? 'Tell us what happened.' : null,
    render: (value, onChange) => (
      <FormTextArea value={value} onChangeText={onChange} placeholder="e.g. Our society's open day stand had no volunteers two days before the event…" minHeight={140} />
    ),
  },
  {
    key: 'category',
    title: 'Where?',
    subtitle: 'Pick the category that fits this experience best.',
    validate: v => isBlank(v) ? 'Pick one to continue.' : null,
    render: (value, onChange) => (
      <RadioOptions options={CATEGORIES.map(c => ({ value: c.value, label: c.label, icon: c.icon }))} value={value} onChange={onChange} />
    ),
  },
  {
    key: 'task',
    title: 'What were you responsible for?',
    subtitle: 'What was expected of you, or what you set out to do.',
    validate: v => isBlank(v) ? 'Add what you were responsible for.' : null,
    render: (value, onChange) => (
      <FormTextArea value={value} onChangeText={onChange} placeholder="e.g. I needed to get the stand fully staffed and ready in time." minHeight={120} />
    ),
  },
  {
    key: 'action',
    title: 'What did you do?',
    subtitle: 'The specific actions you took — the part only you can take credit for.',
    validate: v => isBlank(v) ? 'Add what you actually did.' : null,
    render: (value, onChange) => (
      <FormTextArea value={value} onChangeText={onChange} placeholder="e.g. I messaged every member individually, built a sign-up rota, and covered the two gaps myself." minHeight={120} />
    ),
  },
  {
    key: 'result',
    title: 'What happened as a result?',
    subtitle: 'The outcome — numbers if you have them, what changed, what you learned.',
    validate: v => isBlank(v) ? 'Add what happened as a result.' : null,
    render: (value, onChange) => (
      <FormTextArea value={value} onChangeText={onChange} placeholder="e.g. The stand ran fully staffed all day and we signed up 40 new members, our best on record." minHeight={120} />
    ),
  },
]

export default function EvidenceBankScreen({ navigation }) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [statCounts, setStatCounts] = useState({ applications: null, interviews: null })

  // 'list' | 'add' | 'detail'
  const [mode, setMode] = useState('list')
  const [addValues, setAddValues] = useState(EMPTY_ADD_VALUES)
  const [addStep, setAddStep] = useState(0)
  const [addError, setAddError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [selectedStory, setSelectedStory] = useState(null)
  const [detailDraft, setDetailDraft] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [detailSaving, setDetailSaving] = useState(false)

  const loadStories = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: fetchErr } = await supabase
      .from('evidence_bank_stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!fetchErr) setStories(data || [])
    setLoading(false)
  }, [user])

  // Real counts for the stats row — never fabricated. Applications and
  // Interviews come from the same tables Application Form Assistance and
  // Interview Preparation actually write to, scoped to this user.
  const loadStatCounts = useCallback(async () => {
    if (!user) return
    const [applications, interviews] = await Promise.all([
      supabase.from('application_forms').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('interview_prep_packs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    setStatCounts({
      applications: applications.error ? 0 : (applications.count ?? 0),
      interviews: interviews.error ? 0 : (interviews.count ?? 0),
    })
  }, [user])

  useEffect(() => { loadStories(); loadStatCounts() }, [loadStories, loadStatCounts])

  function startAdd(presetCategory) {
    setAddValues({ ...EMPTY_ADD_VALUES, category: presetCategory || null })
    setAddStep(0)
    setAddError(null)
    setMode('add')
  }

  function setAddField(key, v) {
    setAddValues(prev => ({ ...prev, [key]: v }))
  }

  function addStepBack() {
    setAddError(null)
    if (addStep === 0) { setMode('list'); return }
    setAddStep(i => i - 1)
  }

  async function addStepNext() {
    const step = ADD_STEPS[addStep]
    const err = step.validate ? step.validate(addValues[step.key]) : null
    if (err) { setAddError(err); return }
    setAddError(null)
    if (addStep < ADD_STEPS.length - 1) {
      setAddStep(i => i + 1)
      return
    }
    if (!user) { setAddError('You need to be signed in to add a story.'); return }
    setSaving(true)
    const { error: insertErr } = await supabase.from('evidence_bank_stories').insert({
      user_id: user.id,
      title: deriveTitle(addValues.situation),
      situation: addValues.situation,
      task: addValues.task,
      action: addValues.action,
      result: addValues.result,
      category: addValues.category,
      competency_tags: [],
    })
    setSaving(false)
    if (insertErr) { setAddError(insertErr.message || 'Could not save your story. Please try again.'); return }
    setAddValues(EMPTY_ADD_VALUES)
    setMode('list')
    loadStories()
  }

  function openDetail(story) {
    setSelectedStory(story)
    setDetailDraft({
      title: story.title, situation: story.situation, task: story.task,
      action: story.action, result: story.result, category: story.category || 'work',
    })
    setDetailError(null)
    setMode('detail')
  }

  function closeDetail() {
    setSelectedStory(null)
    setDetailDraft(null)
    setDetailError(null)
    setMode('list')
  }

  function setDetailField(key, v) {
    setDetailDraft(prev => ({ ...prev, [key]: v }))
  }

  async function saveDetail() {
    if (isBlank(detailDraft.title) || isBlank(detailDraft.situation) || isBlank(detailDraft.task) || isBlank(detailDraft.action) || isBlank(detailDraft.result)) {
      setDetailError('Every field is required.')
      return
    }
    setDetailSaving(true)
    setDetailError(null)
    const { error: updateErr } = await supabase.from('evidence_bank_stories').update({
      title: detailDraft.title,
      situation: detailDraft.situation,
      task: detailDraft.task,
      action: detailDraft.action,
      result: detailDraft.result,
      category: detailDraft.category,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedStory.id)
    setDetailSaving(false)
    if (updateErr) { setDetailError(updateErr.message || 'Could not save your changes. Please try again.'); return }
    closeDetail()
    loadStories()
  }

  async function deleteDetail() {
    const id = selectedStory.id
    closeDetail()
    setStories(prev => prev.filter(s => s.id !== id)) // optimistic
    const { error: deleteErr } = await supabase.from('evidence_bank_stories').delete().eq('id', id)
    if (deleteErr) loadStories() // reconcile on failure
  }

  // ── Guided add flow ──────────────────────────────────────────────────────
  if (mode === 'add') {
    const step = ADD_STEPS[addStep]
    const progress = (addStep + 1) / ADD_STEPS.length
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.flowHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={addStepBack}
            activeOpacity={0.7}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={addStep === 0 ? 'Close' : 'Go back to previous question'}
          >
            {addStep === 0 ? <X size={20} color={colors.navy} /> : <ChevronLeft size={20} color={colors.navy} />}
          </TouchableOpacity>
          <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: ADD_STEPS.length, now: addStep + 1 }}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.stepCount} accessibilityElementsHidden importantForAccessibility="no">{addStep + 1}/{ADD_STEPS.length}</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.flowTitle} accessibilityRole="header">{step.title}</Text>
          {!!step.subtitle && <Text style={styles.flowSubtitle}>{step.subtitle}</Text>}
          <View style={{ marginTop: spacing.lg }}>
            {step.render(addValues[step.key], v => setAddField(step.key, v))}
          </View>
          {!!addError && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite" accessibilityRole="alert">
              <Text style={styles.errorText}>{addError}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.flowFooter, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            onPress={addStepNext}
            activeOpacity={0.85}
            disabled={saving}
            style={[styles.nextBtn, saving && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving, busy: saving }}
          >
            <Text style={styles.nextBtnText}>
              {saving ? 'Saving…' : addStep === ADD_STEPS.length - 1 ? 'Save story' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ── Story detail / edit ──────────────────────────────────────────────────
  if (mode === 'detail' && selectedStory && detailDraft) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={closeDetail} activeOpacity={0.7} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Back">
            <ChevronLeft size={20} color={colors.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your story</Text>
          <TouchableOpacity onPress={deleteDetail} activeOpacity={0.7} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Delete story">
            <Trash2 size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 14 }}>
            <View>
              <FieldLabel required>Title</FieldLabel>
              <FormTextInput value={detailDraft.title} onChangeText={t => setDetailField('title', t)} />
            </View>
            <View>
              <FieldLabel required>Where</FieldLabel>
              <RadioOptions
                options={CATEGORIES.map(c => ({ value: c.value, label: c.label, icon: c.icon }))}
                value={detailDraft.category}
                onChange={v => setDetailField('category', v)}
              />
            </View>
            <View>
              <FieldLabel required>What happened?</FieldLabel>
              <FormTextArea value={detailDraft.situation} onChangeText={t => setDetailField('situation', t)} />
            </View>
            <View>
              <FieldLabel required>What were you responsible for?</FieldLabel>
              <FormTextArea value={detailDraft.task} onChangeText={t => setDetailField('task', t)} />
            </View>
            <View>
              <FieldLabel required>What did you do?</FieldLabel>
              <FormTextArea value={detailDraft.action} onChangeText={t => setDetailField('action', t)} />
            </View>
            <View>
              <FieldLabel required>What happened as a result?</FieldLabel>
              <FormTextArea value={detailDraft.result} onChangeText={t => setDetailField('result', t)} />
            </View>

            {!!detailError && (
              <View style={styles.errorBox} accessibilityLiveRegion="polite" accessibilityRole="alert">
                <Text style={styles.errorText}>{detailError}</Text>
              </View>
            )}

            <View style={styles.formActions}>
              <TouchableOpacity onPress={closeDetail} activeOpacity={0.7} style={styles.cancelBtn} accessibilityRole="button">
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveDetail}
                activeOpacity={0.85}
                disabled={detailSaving}
                style={[styles.saveBtn, detailSaving && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityState={{ disabled: detailSaving, busy: detailSaving }}
              >
                <Text style={styles.saveBtnText}>{detailSaving ? 'Saving…' : 'Save changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
  const storiesCount = stories.length
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evidence Bank</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageSubtitle}>Your experiences, organised.</Text>

        <View style={styles.bannerCard}>
          <Text style={styles.bannerText}>
            Build your bank once. Reuse your strongest experiences whenever an application or interview asks for them.
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, styles.statBorder]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <BookOpen size={13} color={colors.navy} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{loading ? '–' : storiesCount}</Text>
            <Text style={styles.statLabel}>Evidence{'\n'}Stories</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF9C3' }]}>
              <FileText size={13} color={colors.goldDeep} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{statCounts.applications === null ? '–' : statCounts.applications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <MessageSquare size={13} color={colors.success} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{statCounts.interviews === null ? '–' : statCounts.interviews}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
        </View>

        {/* Category prompts */}
        <Text style={styles.sectionLabel}>Start with a category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => startAdd(cat.value)}
                activeOpacity={0.8}
                style={styles.categoryTile}
                accessibilityRole="button"
                accessibilityLabel={`Add a ${cat.label.toLowerCase()} story`}
              >
                <Icon size={18} color={colors.navy} strokeWidth={2} />
                <Text style={styles.categoryTileText}>{cat.promptLabel}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Stories */}
        <Text style={styles.sectionLabel}>Your stories</Text>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 24 }} />
        ) : storiesCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No evidence saved yet — start by adding your first story.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {stories.map(story => {
              const meta = categoryMeta(story.category)
              return (
                <TouchableOpacity
                  key={story.id}
                  onPress={() => openDetail(story)}
                  activeOpacity={0.85}
                  style={styles.storyCard}
                  accessibilityRole="button"
                  accessibilityLabel={`View story: ${story.title}`}
                >
                  <View style={styles.storyCardTop}>
                    <View style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{meta.label}</Text>
                    </View>
                    <Pencil size={14} color={colors.light} />
                  </View>
                  <Text style={styles.storyTitle}>{story.title}</Text>
                  <Text style={styles.storyPreview} numberOfLines={2}>{story.situation}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={() => startAdd(null)}
          activeOpacity={0.8}
          style={styles.addBtn}
          accessibilityRole="button"
        >
          <Plus size={16} color={colors.navy} />
          <Text style={styles.addBtnText}>Add a story</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.cream,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.navy },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },

  pageSubtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 4 },

  bannerCard: {
    marginTop: spacing.md, backgroundColor: colors.navy, borderRadius: radius.card,
    padding: 16, borderLeftWidth: 4, borderLeftColor: colors.gold,
  },
  bannerText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.cream, lineHeight: 20 },

  statsRow: {
    flexDirection: 'row', backgroundColor: colors.white,
    marginTop: spacing.md, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4 },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, lineHeight: 26 },
  statLabel: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 3, textAlign: 'center', lineHeight: 13 },

  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: spacing.lg, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryTile: {
    width: '31%', minWidth: 96, aspectRatio: 1.05, backgroundColor: colors.white,
    borderRadius: radius.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6,
  },
  categoryTileText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.navy, textAlign: 'center', letterSpacing: 0.3 },

  emptyState: { paddingVertical: 32, alignItems: 'center', paddingHorizontal: spacing.md },
  emptyStateText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },

  storyCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, ...shadows.card },
  storyCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginTop: 10 },
  storyPreview: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 },
  tagChip: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  tagChipText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.navy,
    borderStyle: 'dashed', marginTop: 16,
  },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  formActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted },
  saveBtn: { flex: 2, height: 48, borderRadius: radius.button, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  errorBox: { marginTop: spacing.md, backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: radius.button, padding: 12 },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },

  // Radio options (the "Where?" step, and category in the detail/edit view)
  radioRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.button,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.white,
  },
  radioRowActive: { borderColor: colors.navy, backgroundColor: 'rgba(30,58,95,0.04)' },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.light,
    alignItems: 'center', justifyContent: 'center',
  },
  radioCircleActive: { borderColor: colors.navy },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.navy },
  radioLabel: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted, flex: 1 },
  radioLabelActive: { color: colors.navy, fontFamily: fonts.sansSemiBold },

  // Guided add-flow chrome (mirrors QuestionFlow's own styling)
  flowHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.cream,
  },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.navy, borderRadius: 2 },
  stepCount: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted, width: 34, textAlign: 'right' },
  flowTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy, lineHeight: 30 },
  flowSubtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 20 },
  flowFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: colors.border,
  },
  nextBtn: { flex: 1, height: 52, borderRadius: radius.button, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  nextBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
