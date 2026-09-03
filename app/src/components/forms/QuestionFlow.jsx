import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, X } from 'lucide-react-native'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'

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
export default function QuestionFlow({ steps, values, onChange, onComplete, onExit, submitLabel = 'Submit' }) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(0)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const step = steps[index]
  const isLast = index === steps.length - 1
  const progress = (index + 1) / steps.length

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
    if (index === 0) { onExit?.(); return }
    setIndex(i => i - 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onComplete(values)
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={styles.headerBtn}>
          {index === 0
            ? <X size={20} color={colors.navy} />
            : <ChevronLeft size={20} color={colors.navy} />}
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>{index + 1}/{steps.length}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{step.title}</Text>
        {!!step.subtitle && <Text style={styles.subtitle}>{step.subtitle}</Text>}

        <View style={styles.stepBody}>
          {step.render(values[step.key], v => onChange(step.key, v), values, onChange)}
        </View>

        {!!error && (
          <View style={styles.errorBox}>
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
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.85}
          disabled={submitting}
          style={[styles.nextBtn, submitting && { opacity: 0.7 }]}
        >
          <Text style={styles.nextBtnText}>
            {submitting ? 'Submitting…' : isLast ? submitLabel : 'Continue'}
          </Text>
        </TouchableOpacity>
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
  nextBtn: {
    flex: 1, height: 52, borderRadius: radius.button, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center', ...shadows.card,
  },
  nextBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
