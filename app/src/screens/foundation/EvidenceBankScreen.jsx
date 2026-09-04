import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Trash2, Plus } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'
import { FieldLabel, FormTextInput, FormTextArea, ChoiceGrid } from '../../components/forms/FormControls'

// Evidence Bank — real STAR stories (Situation/Task/Action/Result) a student
// builds up once and reuses across services. Application Form Assistance
// hard-requires at least one story (generate-application-answers/index.ts
// errors "Add at least one story..." on an empty bank); Interview Preparation
// and Application Answers both draw on it as supporting evidence when present.
// Matches the evidence_bank_stories table exactly (see
// supabase/migrations/20260724120000_application_form_assistance.sql):
// title, situation, task, action, result all required text; competency_tags
// a text[] — offered here as a multi-select over the same CORE_COMPETENCIES
// list the generator functions themselves score answers against (see
// supabase/functions/_shared/competencyBank.ts), not free text, so a tagged
// story actually matches how the backend looks stories up.
//
// This is a management screen (a growing list of small records), not a
// one-time submission — so unlike the Foundation Blueprint intake builders it
// is not a QuestionFlow wizard. It mirrors the shape of Tayyab's website
// EvidenceBankTab (src/pages/foundation/ApplicationFormPage.jsx): a list of
// existing stories with delete, plus an inline add-a-story form.

const COMPETENCIES = [
  'Teamwork', 'Leadership', 'Problem Solving', 'Communication', 'Initiative',
  'Resilience', 'Client / Stakeholder Focus', 'Adaptability', 'Attention to Detail',
]

const EMPTY_FORM = { title: '', situation: '', task: '', action: '', result: '', competency_tags: [] }

function isBlank(v) {
  return typeof v !== 'string' || v.trim().length === 0
}

export default function EvidenceBankScreen({ navigation }) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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

  useEffect(() => { loadStories() }, [loadStories])

  function setField(key, v) {
    setForm(prev => ({ ...prev, [key]: v }))
  }

  function validate() {
    if (isBlank(form.title) || isBlank(form.situation) || isBlank(form.task) || isBlank(form.action) || isBlank(form.result)) {
      return 'Title, situation, task, action, and result are all required.'
    }
    return null
  }

  async function handleSave() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    if (!user) { setError('You need to be signed in to add a story.'); return }
    setSaving(true)
    setError(null)
    const { error: insertErr } = await supabase.from('evidence_bank_stories').insert({
      user_id: user.id,
      title: form.title,
      situation: form.situation,
      task: form.task,
      action: form.action,
      result: form.result,
      competency_tags: form.competency_tags,
    })
    setSaving(false)
    if (insertErr) { setError(insertErr.message || 'Could not save your story. Please try again.'); return }
    setForm(EMPTY_FORM)
    setShowForm(false)
    loadStories()
  }

  async function handleDelete(id) {
    setStories(prev => prev.filter(s => s.id !== id)) // optimistic
    const { error: deleteErr } = await supabase.from('evidence_bank_stories').delete().eq('id', id)
    if (deleteErr) loadStories() // reconcile on failure
  }

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

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Real STAR stories from your own experience — a job, a project, a society, anything. Build this once and
          reuse it: Application Form Assistance drafts every answer from these stories, and Interview Preparation
          uses them for model answers.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 24 }} />
        ) : stories.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No stories yet — add your first one below.</Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 8 }}>
            {stories.map(story => (
              <View key={story.id} style={styles.storyCard}>
                <TouchableOpacity
                  onPress={() => handleDelete(story.id)}
                  activeOpacity={0.7}
                  style={styles.deleteBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove story: ${story.title}`}
                >
                  <Trash2 size={15} color={colors.muted} />
                </TouchableOpacity>
                <Text style={styles.storyTitle}>{story.title}</Text>
                {story.competency_tags?.length > 0 && (
                  <View style={styles.tagRow}>
                    {story.competency_tags.map(tag => (
                      <View key={tag} style={styles.tagChip}><Text style={styles.tagChipText}>{tag}</Text></View>
                    ))}
                  </View>
                )}
                <Text style={styles.storyPreview} numberOfLines={2}>{story.situation}</Text>
              </View>
            ))}
          </View>
        )}

        {showForm ? (
          <View style={styles.formCard}>
            <View style={{ gap: 14 }}>
              <View>
                <FieldLabel required>Title</FieldLabel>
                <FormTextInput value={form.title} onChangeText={t => setField('title', t)} placeholder="e.g. Leading the college open day stand" />
              </View>
              <View>
                <FieldLabel required>Situation</FieldLabel>
                <FormTextArea value={form.situation} onChangeText={t => setField('situation', t)} placeholder="What was the context?" />
              </View>
              <View>
                <FieldLabel required>Task</FieldLabel>
                <FormTextArea value={form.task} onChangeText={t => setField('task', t)} placeholder="What needed to happen?" />
              </View>
              <View>
                <FieldLabel required>Action</FieldLabel>
                <FormTextArea value={form.action} onChangeText={t => setField('action', t)} placeholder="What did you specifically do?" />
              </View>
              <View>
                <FieldLabel required>Result</FieldLabel>
                <FormTextArea value={form.result} onChangeText={t => setField('result', t)} placeholder="What happened as a result?" />
              </View>
              <View>
                <FieldLabel hint="Optional — pick whichever this story genuinely demonstrates">Competencies</FieldLabel>
                <ChoiceGrid options={COMPETENCIES} value={form.competency_tags} onChange={v => setField('competency_tags', v)} multiple />
              </View>
              {!!error && (
                <View style={styles.errorBox} accessibilityLiveRegion="polite" accessibilityRole="alert">
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null) }}
                  activeOpacity={0.7}
                  style={styles.cancelBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.85}
                  disabled={saving}
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: saving, busy: saving }}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save story'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
            style={styles.addBtn}
            accessibilityRole="button"
          >
            <Plus size={16} color={colors.navy} />
            <Text style={styles.addBtnText}>Add a story</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.cream,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.navy },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  intro: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, lineHeight: 20 },

  emptyState: { paddingVertical: 32, alignItems: 'center' },
  emptyStateText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },

  storyCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, ...shadows.card },
  deleteBtn: { position: 'absolute', top: 12, right: 12, padding: 4, zIndex: 1 },
  storyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, paddingRight: 28 },
  storyPreview: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tagChipText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.navy,
    borderStyle: 'dashed', marginTop: 16,
  },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },

  formCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, marginTop: 16, ...shadows.card },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted },
  saveBtn: { flex: 2, height: 48, borderRadius: radius.button, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  errorBox: { backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: radius.button, padding: 12 },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },
})
