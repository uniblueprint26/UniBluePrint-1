/**
 * JourneyStageModal — lets someone set/change their journey_stage right from
 * Course Connect, since that's the field the matching on this screen
 * actually runs on. Same underlying write as ProfileScreen's Account
 * settings row (both go through useJourneyStage → AuthContext), just
 * surfaced here too so setting it doesn't require a trip to Settings first.
 */
import { useEffect, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { X, Check } from 'lucide-react-native'
import { useJourneyStage } from '../../hooks/useJourneyStage'
import { colors, fonts, spacing, radius } from '../../constants/theme'

export default function JourneyStageModal({ visible, onClose }) {
  const { journeyStage, stages, setJourneyStage } = useJourneyStage()
  const [selected, setSelected] = useState(journeyStage)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visible) { setSelected(journeyStage); setError('') }
  }, [visible, journeyStage])

  async function handleSave() {
    if (saving || !selected || selected === journeyStage) { onClose(); return }
    setSaving(true)
    setError('')
    const { error: err } = await setJourneyStage(selected)
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
              <Text style={s.title}>Where are you at right now?</Text>
              <Text style={s.subtitle}>
                Not what you're studying or doing — the stage of it. This is how we connect you to people in the same boat, whatever path they're on.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={s.error}>{error}</Text>}

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {stages.map(st => {
                const isSelected = selected === st.key
                return (
                  <TouchableOpacity
                    key={st.key}
                    style={[s.option, isSelected && s.optionActive]}
                    onPress={() => setSelected(st.key)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.optionLabel, isSelected && s.optionLabelActive]}>{st.label}</Text>
                      <Text style={s.optionSub}>{st.sub}</Text>
                    </View>
                    <View style={[s.radio, isSelected && s.radioActive]}>
                      {isSelected && <Check size={12} color={colors.cream} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[s.saveBtn, (saving || !selected) && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving || !selected}
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
    padding: spacing.lg, paddingBottom: 34, maxHeight: '88%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, marginBottom: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.10)',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  optionActive: { borderColor: colors.navy, backgroundColor: 'rgba(30,58,95,0.05)' },
  optionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, marginBottom: 3 },
  optionLabelActive: { color: colors.navy },
  optionSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(30,58,95,0.20)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  saveBtn: {
    backgroundColor: colors.navy, borderRadius: 8, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
