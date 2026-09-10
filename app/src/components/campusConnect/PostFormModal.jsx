/**
 * PostFormModal — the shared, schema-driven post form used by every Campus
 * Connect board. Field shape comes from `constants/campusBoards.js`; this
 * component only knows how to render each field `type` and how to insert
 * the result into `board.table` (or `tableOverride`, used by the Clubs and
 * Societies "request a new society" flow, which shares this form but
 * targets a different subset of fields / a different status value).
 */
import { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { X, Plus, Star, Check } from 'lucide-react-native'
import ImageUploader from '../ui/ImageUploader'
import FileUploader from '../ui/FileUploader'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function StarPicker({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} accessibilityRole="button" accessibilityLabel={`${n} star${n !== 1 ? 's' : ''}`}>
          <Star size={24} color={colors.gold} fill={n <= value ? colors.gold : 'transparent'} strokeWidth={1.6} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

function TagsInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  function add() {
    const v = draft.trim()
    if (!v) return
    if (!value.includes(v)) onChange([...value, v])
    setDraft('')
  }
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={[f.input, { flex: 1 }]}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.light}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <TouchableOpacity style={f.tagAddBtn} onPress={add} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Add skill">
          <Plus size={16} color={colors.cream} />
        </TouchableOpacity>
      </View>
      {value.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {value.map(tag => (
            <TouchableOpacity key={tag} style={f.tagChip} onPress={() => onChange(value.filter(t => t !== tag))} activeOpacity={0.7}>
              <Text style={f.tagChipText}>{tag}</Text>
              <X size={11} color={colors.navy} strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

function SelectPicker({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = value === opt
        return (
          <TouchableOpacity
            key={opt}
            style={[f.chip, active && f.chipActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[f.chipText, active && f.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function TogglePicker({ value, onChange, onLabel, offLabel }) {
  return (
    <TouchableOpacity style={f.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <View style={[f.toggleTrack, value && f.toggleTrackOn]}>
        <View style={[f.toggleThumb, value && f.toggleThumbOn]} />
      </View>
      <Text style={f.toggleLabel}>{value ? (onLabel || 'On') : (offLabel || 'Off')}</Text>
    </TouchableOpacity>
  )
}

export default function PostFormModal({
  visible, onClose, board, fields, tableOverride, titleOverride,
  extraValues, onPosted, userIdField = 'user_id', includePosterName = true,
}) {
  const { user } = useAuth()
  const activeFields = fields || board?.fields || []
  const table = tableOverride || board?.table

  const initial = {}
  activeFields.forEach(field => {
    if (field.type === 'toggle') initial[field.key] = false
    else if (field.type === 'tags') initial[field.key] = []
    else if (field.type === 'stars') initial[field.key] = 0
    else if (field.default != null) initial[field.key] = field.default
    else initial[field.key] = ''
  })

  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  function set(key, v) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  function reset() {
    setValues(initial)
    setErrorMsg(null)
  }

  function close() {
    reset()
    onClose()
  }

  async function submit() {
    for (const field of activeFields) {
      if (field.showIf && !field.showIf(values)) continue
      if (!field.required) continue
      const v = values[field.key]
      const empty = field.type === 'tags' ? v.length === 0
        : field.type === 'stars' ? !v
        : field.type === 'toggle' ? false
        : v == null || String(v).trim() === ''
      if (empty) {
        setErrorMsg(`${field.label.replace(' (optional)', '')} is required.`)
        return
      }
      if (field.type === 'date' && v && !DATE_RE.test(v)) {
        setErrorMsg('Dates should be in YYYY-MM-DD format.')
        return
      }
    }

    setSaving(true)
    setErrorMsg(null)

    const payload = { ...(userIdField ? { [userIdField]: user.id } : {}), ...extraValues }
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A student'
    activeFields.forEach(field => {
      if (field.showIf && !field.showIf(values)) {
        payload[field.key] = null
        return
      }
      let v = values[field.key]
      if (field.type === 'number') v = v === '' ? null : Number(v)
      if (field.type === 'decimal') v = v === '' ? null : Number(v)
      if (field.type === 'date') v = v || null
      if (field.type === 'text' || field.type === 'textarea') v = typeof v === 'string' ? v.trim() : v
      payload[field.key] = v
      if (field.type === 'file') {
        if (field.mimeKey) payload[field.mimeKey] = values[field.mimeKey] || null
        if (field.nameKey) payload[field.nameKey] = values[field.nameKey] || null
      }
    })
    // Anonymous posts still carry poster_name in the row (so the poster can
    // still see their own name on their own post if that's ever surfaced),
    // but the client never displays it when anonymous — see BoardDetailScreen.
    if (includePosterName && !('poster_name' in (extraValues || {}))) {
      payload.poster_name = displayName
    }

    try {
      const { data, error } = await supabase.from(table).insert(payload).select().single()
      if (error) throw error
      onPosted(data)
      reset()
    } catch {
      setErrorMsg('Could not post. Please check your entries and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!activeFields.length) return null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={f.backdrop}>
        <View style={f.sheet}>
          <View style={f.headerRow}>
            <Text style={f.title}>{titleOverride || board?.postCta || 'New post'}</Text>
            <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {activeFields.map(field => {
              if (field.showIf && !field.showIf(values)) return null
              return (
                <View key={field.key} style={{ marginTop: 14 }}>
                  <Text style={f.label}>{field.label}</Text>
                  {field.type === 'text' && (
                    <TextInput
                      style={f.input}
                      value={values[field.key]}
                      onChangeText={v => set(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.light}
                    />
                  )}
                  {field.type === 'date' && (
                    <TextInput
                      style={f.input}
                      value={values[field.key]}
                      onChangeText={v => set(field.key, v)}
                      placeholder={field.placeholder || 'YYYY-MM-DD'}
                      placeholderTextColor={colors.light}
                      keyboardType={Platform.OS === 'web' ? 'default' : 'numbers-and-punctuation'}
                    />
                  )}
                  {field.type === 'textarea' && (
                    <TextInput
                      style={[f.input, { minHeight: 84 }]}
                      value={values[field.key]}
                      onChangeText={v => set(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.light}
                      multiline
                      textAlignVertical="top"
                    />
                  )}
                  {(field.type === 'number' || field.type === 'decimal') && (
                    <TextInput
                      style={f.input}
                      value={String(values[field.key] ?? '')}
                      onChangeText={v => set(field.key, v.replace(field.type === 'number' ? /[^0-9]/g : /[^0-9.]/g, ''))}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.light}
                      keyboardType={field.type === 'number' ? 'number-pad' : 'decimal-pad'}
                    />
                  )}
                  {field.type === 'select' && (
                    <SelectPicker options={field.options} value={values[field.key]} onChange={v => set(field.key, v)} />
                  )}
                  {field.type === 'toggle' && (
                    <TogglePicker value={values[field.key]} onChange={v => set(field.key, v)} onLabel={field.onLabel} offLabel={field.offLabel} />
                  )}
                  {field.type === 'tags' && (
                    <TagsInput value={values[field.key]} onChange={v => set(field.key, v)} placeholder={field.placeholder} />
                  )}
                  {field.type === 'stars' && (
                    <StarPicker value={values[field.key]} onChange={v => set(field.key, v)} />
                  )}
                  {field.type === 'photo' && (
                    <ImageUploader
                      bucket="campus-board-photos"
                      storagePath={`${user?.id}/${Date.now()}.jpg`}
                      onUpload={url => set(field.key, url)}
                      label=""
                      size={72}
                    />
                  )}
                  {field.type === 'file' && (
                    <FileUploader
                      bucket={field.bucket || 'course-connect-files'}
                      storagePath={`${user?.id}/${Date.now()}`}
                      onUpload={(url, meta) => {
                        set(field.key, url)
                        if (field.mimeKey) set(field.mimeKey, meta.mimeType || null)
                        if (field.nameKey) set(field.nameKey, meta.name || null)
                      }}
                      label=""
                    />
                  )}
                </View>
              )
            })}

            {!!errorMsg && <Text style={f.error}>{errorMsg}</Text>}

            <TouchableOpacity style={[f.submitBtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.cream} /> : <Check size={15} color={colors.cream} strokeWidth={2.4} />}
              <Text style={f.submitBtnText}>{saving ? 'Posting…' : 'Post'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const f = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy, flex: 1, marginRight: 12 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
  },
  chip: {
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.3, borderColor: 'rgba(30,58,95,0.15)', backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.navy },
  chipTextActive: { color: colors.cream },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleTrack: { width: 42, height: 24, borderRadius: 12, backgroundColor: 'rgba(30,58,95,0.15)', padding: 2, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.navy },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  tagAddBtn: { width: 46, borderRadius: radius.card, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.cream, borderRadius: radius.badge,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  tagChipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, marginTop: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14, marginTop: 20,
  },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})
