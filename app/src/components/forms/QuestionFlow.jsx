import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePreventRemove } from '@react-navigation/native'
import { ChevronLeft, X } from 'lucide-react-native'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'
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
export default function QuestionFlow({ steps, values, onChange, onComplete, onExit, navigation, submitLabel = 'Submit' }) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(0)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const step = steps[index]
  const isLast = index === steps.length - 1
  const progress = (index + 1) / steps.length

  // Past the first question, assume there's something worth not losing —
  // deliberately simple (no deep-diffing every field's shape across all 8
  // builders) rather than a precise "did anything actually change" check.
  const hasProgress = index > 0

  usePreventRemove(!!navigation && hasProgress, ({ data }) => {
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
    if (!hasProgress) { onExit?.(); return }
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
      handleSubmit()
    } else {
      setIndex(i => i + 1)
    }
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
            ? <X size={20} color={colors.navy} />
            : <ChevronLeft size={20} color={colors.navy} />}
        </TouchableOpacity>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: steps.length, now: index + 1 }}
        >
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepCount} accessibilityElementsHidden importantForAccessibility="no">{index + 1}/{steps.length}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title} accessibilityRole="header">{step.title}</Text>
        {!!step.subtitle && <Text style={styles.subtitle}>{step.subtitle}</Text>}

        <View style={styles.stepBody}>
          {step.render(values[step.key], v => onChange(step.key, v), values, onChange)}
        </View>

        {!!error && (
          <View style={styles.errorBox} accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
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
        <Button
          label={isLast ? submitLabel : 'Continue'}
          onPress={goNext}
          variant="primary"
          loading={submitting}
          style={styles.nextBtn}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.cream,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.navy, borderRadius: 2 },
  stepCount: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted, width: 34, textAlign: 'right' },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space between the header and footer bars on native — without
  // it, RN can size the ScrollView to its own content instead of the
  // available viewport. Shared by all 8 Foundation Blueprint intake flows.
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy, lineHeight: 30 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 20 },
  stepBody: { marginTop: spacing.lg },

  errorBox: {
    marginTop: spacing.md, backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: radius.button, padding: 12,
  },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, lineHeight: 18 },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: colors.border,
  },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 4 },
  skipBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted },
  nextBtn: { flex: 1, ...shadows.card },
})
