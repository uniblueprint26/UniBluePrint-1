/**
 * CampusGateModal — the one-time "select your campus" prompt.
 *
 * Per spec: boards are browsable by anyone immediately, no campus selection
 * required. Posting to any board requires the student to have selected
 * their campus first — this modal is what asks for it, shown only at the
 * point a student tries to post without one already on their account
 * (most students set this at sign-up; this covers the few who skipped it
 * or typed a free-text institution that didn't match the directory).
 */
import { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { X, Search, MapPin } from 'lucide-react-native'
import { searchInstitutions } from '../../data/institutions'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

export default function CampusGateModal({ visible, onClose, onSelected }) {
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const results = query.trim() ? searchInstitutions(query).slice(0, 8) : []

  async function choose(inst) {
    if (saving) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { institution: inst.name, institution_short: inst.short },
    })
    setSaving(false)
    if (!error) {
      setQuery('')
      onSelected()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.headerRow}>
            <Text style={s.title}>Select your campus</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={s.sub}>
            Posting to a Campus Connect board needs your institution on file first — browsing doesn't.
          </Text>
          <View style={s.searchWrap}>
            <Search size={15} color={colors.muted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search your college or institute..."
              placeholderTextColor={colors.light}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
            {saving ? (
              <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: spacing.md }} />
            ) : results.length === 0 && query.trim() ? (
              <Text style={s.empty}>No matches — try a shorter search.</Text>
            ) : (
              results.map(inst => (
                <TouchableOpacity key={inst.id} style={s.row} activeOpacity={0.7} onPress={() => choose(inst)}>
                  <MapPin size={14} color={colors.navy} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowName}>{inst.name}</Text>
                    <Text style={s.rowMeta}>{inst.short} · {inst.city}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '80%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, flex: 1, marginRight: 12 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, height: 46, marginBottom: 10,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  rowName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },
  empty: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: spacing.md, textAlign: 'center' },
})
