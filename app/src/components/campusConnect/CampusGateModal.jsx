/**
 * CampusGateModal — the one-time "select your campus" prompt.
 *
 * Per spec: boards are browsable by anyone immediately, no campus selection
 * required. Posting to any board requires the student to have selected
 * their campus first — this modal is what asks for it, shown only at the
 * point a student tries to post without one already on their account
 * (most students set this at sign-up; this covers the few who skipped it
 * or typed a free-text institution that didn't match the directory).
 * Apprentices are asked for their training provider and workers for their
 * industry. Everything is saved to profiles (see updateEducationDetails).
 */
import { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { X, Search, MapPin } from 'lucide-react-native'
import { searchInstitutions } from '../../data/institutions'
import { searchProviders } from '../../data/apprenticeships'
import { useAuth } from '../../context/AuthContext'
import { useUserType } from '../../hooks/useUserType'
import { USER_TYPE_APPRENTICE, USER_TYPE_WORKER } from '../../constants/userTypes'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// What the person is asked for depends on who they are. Students and gap year
// pick a college. Apprentices pick their training provider (or type one).
// Workers type their industry. All of it is saved to their profile, and a
// database trigger turns it into their Campus Connect group.
function copyFor(userType) {
  if (userType === USER_TYPE_APPRENTICE) {
    return {
      title: 'Select your training provider',
      sub: 'Posting to your Campus Connect group needs your training provider on file first. Browsing does not.',
      placeholder: 'Search your training centre or college...',
    }
  }
  if (userType === USER_TYPE_WORKER) {
    return {
      title: 'Your industry',
      sub: 'Posting to your Campus Connect group needs your industry on file first. Browsing does not.',
      placeholder: 'e.g. Healthcare, Retail, Construction',
    }
  }
  return {
    title: 'Select your campus',
    sub: 'Posting to a Campus Connect board needs your institution on file first. Browsing does not.',
    placeholder: 'Search your college or institute...',
  }
}

export default function CampusGateModal({ visible, onClose, onSelected }) {
  const { colors } = useTheme()
  const s = __gs_s(colors)
  const { updateEducationDetails } = useAuth()
  const { userType } = useUserType()
  const copy = copyFor(userType)
  const isApprentice = userType === USER_TYPE_APPRENTICE
  const isWorker = userType === USER_TYPE_WORKER
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const typed = query.trim()

  let results = []
  if (typed && !isWorker) {
    results = (isApprentice ? searchProviders(query) : searchInstitutions(query)).slice(0, 8)
  }

  async function save(fields) {
    if (saving) return
    setSaving(true)
    setFailed(false)
    const { error } = await updateEducationDetails(fields)
    setSaving(false)
    if (error) { setFailed(true); return }
    setQuery('')
    onSelected()
  }

  function choose(item) {
    // institution (students) or trainingProvider (apprentices): writes
    // profiles and auth metadata, see AuthContext.updateEducationDetails.
    save(isApprentice ? { trainingProvider: item } : { institution: item })
  }

  function saveTyped() {
    if (!typed) return
    if (isWorker) save({ industry: typed })
    else if (isApprentice) save({ trainingProvider: typed })
    else save({ institution: typed })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={s.sheet}>
          <View style={s.headerRow}>
            <Text style={s.title}>{copy.title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={s.sub}>{copy.sub}</Text>
          <View style={s.searchWrap}>
            <Search size={15} color={colors.muted} />
            <TextInput
              style={s.searchInput}
              placeholder={copy.placeholder}
              placeholderTextColor={colors.light}
              value={query}
              onChangeText={setQuery}
              autoFocus
              maxLength={200}
              returnKeyType={isWorker ? 'done' : 'search'}
              onSubmitEditing={isWorker ? saveTyped : undefined}
            />
          </View>
          {failed ? <Text style={s.error}>Could not save. Please try again.</Text> : null}
          <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
            {saving ? (
              <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginTop: spacing.md }} />
            ) : (
              <>
                {results.map(item => (
                  <TouchableOpacity key={item.id || item.name} style={s.row} activeOpacity={0.7} onPress={() => choose(item)}>
                    <MapPin size={14} color={colors.textPrimary} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName}>{item.name}</Text>
                      <Text style={s.rowMeta}>{item.short} · {item.city}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {typed ? (
                  <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={saveTyped} accessibilityRole="button">
                    <MapPin size={14} color={colors.textPrimary} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName}>Use "{typed}"</Text>
                      {results.length === 0 && !isWorker ? <Text style={s.rowMeta}>Not in the list? Add it yourself.</Text> : null}
                    </View>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function __gs_s(colors) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '80%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, flex: 1, marginRight: 12 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, height: 46, marginBottom: 10,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  rowName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, marginBottom: 8 },
  empty: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: spacing.md, textAlign: 'center' },
  })
}
