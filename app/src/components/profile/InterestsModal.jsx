/**
 * InterestsModal — pick from the expanded predefined interest list AND type
 * in your own. Shared, not Course-Connect- or Profile-specific: both
 * ProfileScreen's Account settings row and Course Connect's interests
 * banner open this exact component, both against the same useInterests()
 * hook (hooks/useInterests.js) — same "one modal, wherever it's needed"
 * pattern as AccountTypeModal.
 *
 * Two ways in: tap a predefined chip (grouped by category, from
 * data/interests.js) to toggle it, or type into "Add your own" and press
 * Add for a custom one. Both land in the same flat `interests` array on
 * save — nothing distinguishes a predefined pick from a custom one once
 * it's set. Selected interests (predefined or custom) surface as removable
 * pills up top so the current set is always visible while browsing more.
 */
import { useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native'
import { X, Check, Plus } from 'lucide-react-native'
import { useInterests, normalizeInterestLabel } from '../../hooks/useInterests'
import { CATEGORY_LABELS } from '../../data/interests'
import { colors, fonts, spacing, radius } from '../../constants/theme'

export default function InterestsModal({ visible, onClose }) {
  const { interests, predefined, max, setInterests } = useInterests()
  const [selected, setSelected] = useState([])
  const [customText, setCustomText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visible) { setSelected(interests); setCustomText(''); setError('') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const grouped = useMemo(() => {
    const byCategory = {}
    predefined.forEach(item => {
      if (!byCategory[item.category]) byCategory[item.category] = []
      byCategory[item.category].push(item)
    })
    return Object.entries(byCategory)
  }, [predefined])

  const predefinedLabelSet = useMemo(
    () => new Set(predefined.map(i => i.label.toLowerCase())),
    [predefined]
  )
  const selectedCustom = selected.filter(l => !predefinedLabelSet.has(l.toLowerCase()))

  function has(label) {
    return selected.some(l => l.toLowerCase() === label.toLowerCase())
  }

  function toggle(label) {
    setError('')
    setSelected(prev => {
      if (prev.some(l => l.toLowerCase() === label.toLowerCase())) {
        return prev.filter(l => l.toLowerCase() !== label.toLowerCase())
      }
      if (prev.length >= max) {
        setError(`You can pick up to ${max} interests — remove one to add another.`)
        return prev
      }
      return [...prev, label]
    })
  }

  function addCustom() {
    const clean = normalizeInterestLabel(customText)
    if (!clean) return
    if (has(clean)) { setCustomText(''); return }
    if (selected.length >= max) {
      setError(`You can pick up to ${max} interests — remove one to add another.`)
      return
    }
    setSelected(prev => [...prev, clean])
    setCustomText('')
    setError('')
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError('')
    const { error: err } = await setInterests(selected)
    setSaving(false)
    if (err) { setError('Could not save this — please try again.'); return }
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>What are you into?</Text>
              <Text style={s.subtitle}>
                Pick from the list or add your own — this is how Course Connect and the Directory
                connect you to people with the same interests, whatever course, trade, or job they're on.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={s.error}>{error}</Text>}

          <Text style={s.countLine}>{selected.length} of {max} selected</Text>

          {selected.length > 0 && (
            <View style={s.selectedRow}>
              {selected.map(label => (
                <TouchableOpacity key={label} style={s.selectedPill} activeOpacity={0.8} onPress={() => toggle(label)}>
                  <Text style={s.selectedPillText}>{label}</Text>
                  <X size={11} color={colors.cream} strokeWidth={2.5} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Add your own */}
          <View style={s.customRow}>
            <TextInput
              style={s.customInput}
              placeholder="Add your own interest..."
              placeholderTextColor={colors.light}
              value={customText}
              onChangeText={setCustomText}
              onSubmitEditing={addCustom}
              returnKeyType="done"
              maxLength={30}
            />
            <TouchableOpacity
              style={[s.customAddBtn, !customText.trim() && { opacity: 0.5 }]}
              activeOpacity={0.8}
              onPress={addCustom}
              disabled={!customText.trim()}
              accessibilityRole="button"
              accessibilityLabel="Add custom interest"
            >
              <Plus size={16} color={colors.cream} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          {selectedCustom.length > 0 && (
            <Text style={s.customHint}>Your own: {selectedCustom.join(', ')}</Text>
          )}

          <ScrollView style={{ maxHeight: 340, marginTop: 14 }} showsVerticalScrollIndicator={false}>
            {grouped.map(([category, items]) => (
              <View key={category} style={{ marginBottom: 16 }}>
                <Text style={s.categoryLabel}>{CATEGORY_LABELS[category] || category}</Text>
                <View style={s.chipGrid}>
                  {items.map(item => {
                    const isSelected = has(item.label)
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[s.chip, isSelected && s.chipActive]}
                        onPress={() => toggle(item.label)}
                        activeOpacity={0.8}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                      >
                        {isSelected && <Check size={11} color={colors.cream} strokeWidth={3} style={{ marginRight: 4 }} />}
                        <Text style={[s.chipText, isSelected && s.chipTextActive]}>{item.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, marginBottom: 8 },
  countLine: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, letterSpacing: 0.4, marginBottom: 8 },

  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  selectedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.badge,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  selectedPillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.cream },

  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.button,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.12)',
    paddingHorizontal: 14, paddingVertical: 11,
    fontFamily: fonts.sans, fontSize: 13.5, color: colors.navy,
  },
  customAddBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  customHint: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, fontStyle: 'italic', marginTop: 6 },

  categoryLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.navy,
    opacity: 0.55, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.badge, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.cream, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.10)',
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.navy },
  chipTextActive: { color: colors.cream },

  saveBtn: {
    backgroundColor: colors.navy, borderRadius: 8, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
