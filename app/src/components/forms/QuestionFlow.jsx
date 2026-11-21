import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePreventRemove } from '@react-navigation/native'
import { ChevronLeft, X, FileText, Pencil, Check, Zap, Lock } from 'lucide-react-native'
import { fonts, radius, spacing, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import Button from '../ui/Button'

// One-question-at-a-time flow, matching the pattern Tayyab's session is building on
// the website side for the same intake (CV Optimisation first, reference pattern for
// the other 7 Foundation Blueprint services). Each step owns one field (or one small
// related group — e.g. tone + length together) so nothing feels like a wall of a form.
//
// `steps` is an array of:
//   { key, title, subtitle?, render(value, onChange), validate?(value) => error|null,
//     optional? }
// `values` / `onChange(key, value)` are lifted to the caller (CvBuilderScreen etc.) so
// the whole in-progress answer set is visible for the final submit step and for a
// future "resume where you left off" draft-save, not trapped inside this component.

// render(currentStepValue, setCurrentStepValue, allValues, setValue) — the fourth
// argument is a generic per-key setter, for steps that own more than one field
// (e.g. a "your details" step setting full_name/email/phone/location together).
// Steps that only ever touch their own `key` can ignore it and just use the
// second argument.
//
// `navigation` (optional) is the owning screen's navigation object. When
// given, a swipe-down/hardware-back once the student has moved past the
// first question is intercepted with a discard-confirmation Alert, same
// pattern as WeeklyIssueEditorScreen's usePreventRemove — losing up to 15
// steps of answers to an accidental gesture otherwise had no warning at all.
//
// `closedNote` (optional string): when set, the last step shows this plain line
// ("Ordering opens in January") instead of the submit button. Answers are
// already saved as a draft by the caller, so the person can close the flow.
const REVIEW_LABELS = {
  _personal: 'About you', has_no_experience: 'Experience', years_experience_band: 'Experience',
  education: 'Education', experience: 'Work', _skills: 'Skills', key_skills: 'Skills', _targeting: 'Aiming for',
  opportunity_type: 'Opportunity', tone: 'Tone', length: 'Length', style: 'Style', interview_type: 'Interview',
  pathway: 'Application', field_or_industry: 'Field', field: 'Field', work_type: 'Work to show', job_description: 'Job ad',
  current_status: 'Introduction', location: 'Where', timeline: 'Timeline', urgency: 'Urgency',
}

function prettify(v) {
  const t = String(v).replace(/_/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function labelFor(step) {
  if (step.reviewLabel) return step.reviewLabel
  if (REVIEW_LABELS[step.key]) return REVIEW_LABELS[step.key]
  return prettify(step.key.replace(/^x_/, '')).split(' ').slice(0, 3).join(' ')
}

function summarise(step, values) {
  if (step.summary) return step.summary(values)
  const k = step.key
  if (k === '_personal') return [values.personal_full_name, values.personal_location].filter(Boolean).join(', ')
  if (k === '_skills') {
    const n = ['skills_technical', 'skills_soft', 'skills_languages', 'skills_tools'].reduce((c, key) => c + (values[key]?.length || 0), 0)
    return n ? `${n} added` : ''
  }
  if (k.startsWith('_')) {
    const parts = Object.keys(values).filter(key => /^target_/.test(key)).map(key => values[key]).filter(v => typeof v === 'string' && v.trim())
    return parts.slice(0, 3).join(', ')
  }
  const v = values[k]
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'string') { const t = v.trim().replace(/\s+/g, ' '); return /^[a-z0-9_]+$/.test(t) ? prettify(t) : (t.length > 70 ? t.slice(0, 67) + '...' : t) }
  if (Array.isArray(v)) {
    if (v.length === 0) return ''
    if (typeof v[0] === 'string') return `${v.length} added`
    const first = Object.values(v[0] || {}).find(x => typeof x === 'string' && x.trim())
    if (!first) return ''
    return v.length > 1 ? `${first} and ${v.length - 1} more` : first
  }
  return ''
}

function reviewRows(steps, values) {
  const rows = []
  steps.forEach((st, i) => {
    if (st.key === 'tier') return
    const text = summarise(st, values)
    if (!text) return
    rows.push({ index: i, label: labelFor(st), text })
  })
  return rows
}

export default function QuestionFlow({ steps, values, onChange, onComplete, onExit, navigation, submitLabel = 'Submit', closedNote = null, serviceTitle = null, SealIcon = FileText }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(0)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [returnToReview, setReturnToReview] = useState(false)
  const submittingRef = useRef(false)

  const step = steps[index]
  const isLast = index === steps.length - 1
  const reviewMode = isLast && step.key === 'tier'

  // Past the first question, assume there's something worth not losing —
  // deliberately simple (no deep-diffing every field's shape across all 8
  // builders) rather than a precise "did anything actually change" check.
  const hasProgress = index > 0

  usePreventRemove(!!navigation && hasProgress && !closedNote, ({ data }) => {
    Alert.alert(
      'Discard this request?',
      'You’ll lose your answers so far if you leave now.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
      ],
    )
  })

  function confirmDiscardThenExit() {
    // With ordering closed the answers are already saved as a draft.
    if (!hasProgress || closedNote) { onExit?.(); return }
    Alert.alert(
      'Discard this request?',
      'You’ll lose your answers so far if you leave now.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => onExit?.() },
      ],
    )
  }

  function goNext() {
    const currentValue = values[step.key]
    if (step.validate) {
      const err = step.validate(currentValue, values)
      if (err) { setError(err); return }
    }
    setError(null)
    if (isLast) {
      if (closedNote) return
      handleSubmit()
    } else if (returnToReview) {
      setReturnToReview(false)
      setIndex(steps.length - 1)
    } else {
      setIndex(i => i + 1)
    }
  }

  function jumpTo(i) {
    setError(null)
    setReturnToReview(true)
    setIndex(i)
  }

  function goBack() {
    setError(null)
    if (index === 0) { confirmDiscardThenExit(); return }
    setIndex(i => i - 1)
  }

  async function handleSubmit() {
    // Belt-and-braces double-submit guard: Button/TouchableOpacity already
    // disables itself while `submitting` is true, but that's a state update
    // (a render away) — this ref blocks a second tap/invoke synchronously,
    // so a double-tap or an impatient retry-while-still-loading can't fire
    // the insert → generate → review-queue sequence twice.
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      await onComplete(values)
      // On success the caller navigates away (replace), so no need to reset
      // submittingRef — this instance is done either way.
    } catch (err) {
      console.error('[QuestionFlow] submit failed', err)
      setError(err?.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.7}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={index === 0 ? 'Close' : 'Go back to previous question'}
        >
          {index === 0
            ? <X size={22} color={colors.textPrimary} />
            : <ChevronLeft size={24} color={colors.textPrimary} />}
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{serviceTitle || ''}</Text>
        <Text style={styles.stepCount} accessibilityElementsHidden importantForAccessibility="no">{index + 1} of {steps.length}</Text>
      </View>

      <View
        style={styles.ribbon}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: steps.length, now: index + 1 }}
      >
        {steps.map((st, i) => (
          <View key={st.key + i} style={[styles.segment, i < index ? styles.segmentDone : i === index ? styles.segmentNow : null]} />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.paper}>
          <View style={styles.seal}>
            <SealIcon size={24} color={colors.accentFg} strokeWidth={1.8} />
          </View>

          {reviewMode ? (
            <>
              <Text style={styles.title} accessibilityRole="header">Check, then send</Text>
              <Text style={styles.subtitle}>A Campus Handler checks it first. It is never AI only.</Text>
              <View style={styles.reviewList}>
                {reviewRows(steps, values).map((r, n, arr) => (
                  <View key={r.index} style={[styles.reviewRow, n < arr.length - 1 && styles.reviewRowBorder]}>
                    <Text style={styles.reviewLabel}>{r.label.toUpperCase()}</Text>
                    <Text style={styles.reviewValue} numberOfLines={2}>{r.text}</Text>
                    <TouchableOpacity onPress={() => jumpTo(r.index)} style={styles.reviewEdit} accessibilityRole="button" accessibilityLabel={`Edit ${r.label}`}>
                      <Pencil size={15} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <Text style={styles.deliveryLabel}>DELIVERY</Text>
              <View style={styles.tierRow}>
                {[['standard', 'Standard', 'Within 48 hours', null], ['premium', 'Premium', 'Within 24 hours', Zap]].map(([val, name, when, Icon]) => {
                  const active = values.tier === val
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => onChange('tier', val)}
                      activeOpacity={0.85}
                      style={[styles.tierCard, active && styles.tierCardActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${name}, ${when}`}
                    >
                      <View style={styles.tierTop}>
                        {Icon ? <Icon size={15} color={colors.textSecondary} /> : null}
                        <Text style={styles.tierName}>{name}</Text>
                        {active && <View style={styles.tierTick}><Check size={13} color={colors.accentFg} strokeWidth={3} /></View>}
                      </View>
                      <Text style={styles.tierWhen}>{when}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title} accessibilityRole="header">{step.title}</Text>
              {!!step.subtitle && <Text style={styles.subtitle}>{step.subtitle}</Text>}
              <View style={styles.stepBody}>
                {step.render(values[step.key], v => onChange(step.key, v), values, onChange)}
              </View>
            </>
          )}

          {!!error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite" accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: reviewMode && !closedNote ? 6 : insets.bottom + 12 }]}>
        {step.optional && !isLast && (
          <TouchableOpacity
            onPress={() => { setError(null); setIndex(i => i + 1) }}
            activeOpacity={0.7}
            style={styles.skipBtn}
            accessibilityRole="button"
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        )}
        {isLast && closedNote ? (
          <View style={styles.closedWrap}>
            <Text style={styles.closedNote} accessibilityRole="text">{closedNote}</Text>
            <Text style={styles.closedSub}>Your answers are saved as a draft.</Text>
            <TouchableOpacity onPress={() => onExit?.()} activeOpacity={0.7} style={styles.closedBtn} accessibilityRole="button">
              <Text style={styles.closedBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            label={isLast ? submitLabel : 'Continue'}
            onPress={goNext}
            variant="primary"
            loading={submitting}
            style={styles.nextBtn}
          />
        )}
      </View>
      {reviewMode && !closedNote && (
        <View style={[styles.secureRow, { paddingBottom: insets.bottom + 8 }]}>
          <Lock size={14} color={colors.textSecondary} />
          <Text style={styles.secureText}>You pay securely in your browser next.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, paddingBottom: 6,
    backgroundColor: colors.background,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textSecondary },
  stepCount: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSecondary, minWidth: 52, textAlign: 'right' },
  ribbon: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.md, paddingTop: 4, paddingBottom: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  segmentDone: { backgroundColor: colors.textSecondary },
  segmentNow: { backgroundColor: colors.accentBg },

  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: 34 },
  paper: {
    backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 22, paddingTop: 44, paddingBottom: 24,
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  seal: {
    position: 'absolute', top: -22, left: 20, width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: colors.background,
  },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.textPrimary, lineHeight: 36 },
  subtitle: { fontFamily: fonts.sans, fontSize: 16, color: colors.textSecondary, marginTop: 10, lineHeight: 23 },
  stepBody: { marginTop: 24 },

  reviewList: { marginTop: 20 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  reviewRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  reviewLabel: { width: 92, fontFamily: fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: colors.textSecondary },
  reviewValue: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  reviewEdit: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.tabFill, alignItems: 'center', justifyContent: 'center' },
  deliveryLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary, marginTop: 22, marginBottom: 10 },
  tierRow: { flexDirection: 'row', gap: 12 },
  tierCard: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  tierCardActive: { borderColor: colors.accentBg, backgroundColor: colors.tabFill },
  tierTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierName: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.textPrimary },
  tierTick: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center' },
  tierWhen: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.background, paddingTop: 2 },
  secureText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary },

  errorBox: {
    marginTop: spacing.md, backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: radius.button, padding: 12,
  },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 4 },
  skipBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted },
  nextBtn: { flex: 1, ...shadows.card },
  closedWrap: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  closedNote: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.textPrimary, textAlign: 'center' },
  closedSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center' },
  closedBtn: { paddingVertical: 10, paddingHorizontal: 16, marginTop: 4 },
  closedBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary },
  })
}
