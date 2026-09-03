import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { colors, fonts, radius, spacing } from '../../constants/theme'

// Shared, minimal form primitives for native question flows (CV Optimisation and,
// following the same pattern, the other 7 Foundation Blueprint services). The app
// had no reusable form components before this — every existing screen either has
// no real form (FoundationScreen just opened a mailto: link) or hand-rolls its own
// inputs inline. These match the website's Form.jsx in spirit: same brand tokens,
// same "one clear primitive per input type" approach, just React Native instead of
// DOM.

export function FieldLabel({ children, hint, required }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={s.label}>
        {children}
        {required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      {!!hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  )
}

export function FormTextInput({ value, onChangeText, placeholder, maxLength, keyboardType, autoCapitalize }) {
  return (
    <TextInput
      style={s.input}
      value={value || ''}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.light}
      maxLength={maxLength}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  )
}

export function FormTextArea({ value, onChangeText, placeholder, maxLength, minHeight = 120 }) {
  return (
    <TextInput
      style={[s.input, s.textArea, { minHeight }]}
      value={value || ''}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.light}
      maxLength={maxLength}
      multiline
      textAlignVertical="top"
    />
  )
}

/** Single-select grid of choice pills — e.g. tone, length, experience band. */
export function ChoiceGrid({ options, value, onChange }) {
  return (
    <View style={s.choiceGrid}>
      {options.map(opt => {
        const optValue = typeof opt === 'string' ? opt : opt.value
        const optLabel = typeof opt === 'string' ? opt : opt.label
        const active = value === optValue
        return (
          <TouchableOpacity
            key={optValue}
            activeOpacity={0.8}
            onPress={() => onChange(optValue)}
            style={[s.choicePill, active && s.choicePillActive]}
          >
            <Text style={[s.choicePillText, active && s.choicePillTextActive]}>{optLabel}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

/** Free-text tag input — type a value, hit the + button (or return) to add it as a
 *  chip, tap a chip's × to remove. Used for skills (technical/soft/languages/tools). */
export function TagInput({ values = [], onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  function commit() {
    const t = draft.trim()
    if (t && !values.includes(t)) onChange([...values, t])
    setDraft('')
  }
  return (
    <View>
      <View style={s.tagRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.light}
          onSubmitEditing={commit}
          returnKeyType="done"
        />
        <TouchableOpacity style={s.tagAddBtn} activeOpacity={0.8} onPress={commit}>
          <Plus size={18} color={colors.cream} />
        </TouchableOpacity>
      </View>
      {values.length > 0 && (
        <View style={s.chipWrap}>
          {values.map(v => (
            <View key={v} style={s.chip}>
              <Text style={s.chipText}>{v}</Text>
              <TouchableOpacity onPress={() => onChange(values.filter(x => x !== v))}>
                <X size={13} color={colors.navy} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

/** Yes/no toggle rendered as two pills — used for has_no_experience etc. */
export function YesNoToggle({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }) {
  return (
    <View style={s.choiceGrid}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChange(true)}
        style={[s.choicePill, value === true && s.choicePillActive]}
      >
        <Text style={[s.choicePillText, value === true && s.choicePillTextActive]}>{yesLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChange(false)}
        style={[s.choicePill, value === false && s.choicePillActive]}
      >
        <Text style={[s.choicePillText, value === false && s.choicePillTextActive]}>{noLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  input: {
    height: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, fontFamily: fonts.sans, fontSize: 15, color: colors.navy,
    backgroundColor: colors.white,
  },
  textArea: { paddingVertical: 12, lineHeight: 21 },

  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choicePill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  choicePillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  choicePillText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  choicePillTextActive: { color: colors.cream },

  tagRow: { flexDirection: 'row', gap: 8 },
  tagAddBtn: { width: 48, height: 48, borderRadius: radius.button, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cream, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },
})
