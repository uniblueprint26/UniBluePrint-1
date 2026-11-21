import { useState, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Share,
  Modal, TextInput, Image, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import {
  User, GraduationCap, Users, HelpCircle, Info,
  Bell, Lock, LifeBuoy, LogOut, ChevronRight,
  Star, FileText, Calendar, BookOpen, X, Compass, Menu, Tag, Check, Briefcase, Heart, Eye,
  Palette, Sun, Moon, Smartphone, Share2, MapPin, Bookmark, Radio,
} from 'lucide-react-native'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ImageUploader from '../../components/ui/ImageUploader'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { openMenu } from '../../navigation/helpers'
import { useAuth } from '../../context/AuthContext'
import { useUserType } from '../../hooks/useUserType'
import { useInterests } from '../../hooks/useInterests'
import { useDirectoryProfile } from '../../hooks/useDirectoryProfile'
import { useReferrals } from '../../hooks/useReferrals'
import InterestsModal from '../../components/profile/InterestsModal'
import {
  STATUS_OPTIONS, SOCIAL_LINK_FIELDS, VISIBILITY_OPTIONS, MAX_BIO_LENGTH,
} from '../../constants/directory'
import { USER_TYPE_STUDENT, USER_TYPE_APPRENTICE, USER_TYPE_WORKER } from '../../constants/userTypes'
import { searchInstitutions } from '../../data/institutions'
import { searchTrades, searchProviders } from '../../data/apprenticeships'
import { supabase } from '../../lib/supabase'
import { WEBSITE_LINKS } from '../../constants/site'
import { NATIVE_NEUTRAL_BILLING } from '../../constants/platformPolicy'
import { useFoundationEnabled, useProFree } from '../../hooks/useAppFlags'
import { LEGAL_ENTITY_LINE } from '../../constants/legal'


// ── Edit Profile Modal ─────────────────────────────────────────────────────────
// Lets the user update their display name, profile photo, and — gated on
// user_type (see constants/userTypes.js) — their institution/course
// (Student) or trade/training provider (Apprentice) details. Those used to
// be onboarding-only, with a static note here saying so (the same gap
// HelpScreen's "Updating your profile information" item flagged); now
// backed by AuthContext's updateEducationDetails(), which writes the exact
// fields that apply to this person's account type.
//
// Photo: uploaded to the profile-pictures bucket at a fixed path ({userId}/avatar.jpg)
// using upsert=true — overwrites in place, so no orphaned files accumulate on re-upload.
// Name: written to both profiles.full_name and auth user metadata so both
// the database and the in-session user object stay in sync.

export function EditProfileModal({ visible, onClose, userId, currentName, currentAvatar }) {
  const { colors } = useTheme()
  const { user, updateEducationDetails } = useAuth()
  const { userType } = useUserType()
  const [name,      setName]      = useState(currentName || '')
  const [avatarUrl, setAvatarUrl] = useState(null)  // URL returned by ImageUploader on upload
  const [saving,    setSaving]    = useState(false)

  // Which extra section applies, same two shapes SignUpScreen's step 3
  // collects — a Worker/Gap Year account gets neither.
  const showInstitutionFields    = userType === USER_TYPE_STUDENT
  const showApprenticeshipFields = userType === USER_TYPE_APPRENTICE
  const showIndustryField         = userType === USER_TYPE_WORKER

  // Current values live on auth user_metadata, not `profile` — that's what
  // ProfileScreen's own header subtitle (getProfileSubLine) reads from, so
  // this form's starting point has to match it exactly.
  const currentInstitutionName  = user?.user_metadata?.institution || user?.user_metadata?.university || ''
  const currentCourse           = user?.user_metadata?.course || ''
  const currentTrade            = user?.user_metadata?.trade || ''
  const currentTrainingProvider = user?.user_metadata?.training_provider || ''
  const currentIndustry         = user?.user_metadata?.industry || ''
  const [industry, setIndustry]  = useState('')

  // Institution (Student) — same search-and-pick-or-type-free mechanism as
  // SignUpScreen's in_college/plc steps (data/institutions.js).
  const [institutionQuery,    setInstitutionQuery]    = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState(null)
  const [showInstList,        setShowInstList]        = useState(false)
  const [course,              setCourse]              = useState('')

  // Trade + training provider (Apprentice) — same pickers SignUpScreen's
  // apprenticeship step uses (data/apprenticeships.js).
  const [tradeQuery,      setTradeQuery]      = useState('')
  const [selectedTrade,   setSelectedTrade]   = useState(null)
  const [showTradeList,   setShowTradeList]   = useState(false)
  const [providerQuery,   setProviderQuery]   = useState('')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showProviderList, setShowProviderList] = useState(false)

  // Reset form fields each time the modal opens
  useEffect(() => {
    if (visible) {
      setName(currentName || '')
      setAvatarUrl(null)
      setInstitutionQuery(currentInstitutionName)
      setSelectedInstitution(null)
      setShowInstList(false)
      setCourse(currentCourse)
      setTradeQuery(currentTrade)
      setSelectedTrade(null)
      setShowTradeList(false)
      setProviderQuery(currentTrainingProvider)
      setSelectedProvider(null)
      setShowProviderList(false)
      setIndustry(currentIndustry)
    }
  }, [visible, currentName, currentInstitutionName, currentCourse, currentTrade, currentTrainingProvider, currentIndustry])

  const instResults = institutionQuery.trim() ? searchInstitutions(institutionQuery).slice(0, 8) : []
  const tradeResults = tradeQuery.trim() ? searchTrades(tradeQuery).slice(0, 8) : []
  const providerResults = providerQuery.trim() ? searchProviders(providerQuery).slice(0, 8) : []

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const profileUpdates = {}
      if (name.trim())  profileUpdates.full_name  = name.trim()
      if (avatarUrl)    profileUpdates.avatar_url  = avatarUrl

      if (Object.keys(profileUpdates).length) {
        const { error } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId)
        if (error) throw error
      }

      // Sync display name into auth metadata so ProfileScreen re-renders immediately
      if (name.trim() && name.trim() !== currentName) {
        await supabase.auth.updateUser({ data: { full_name: name.trim() } })
      }

      if (showInstitutionFields) {
        const institutionValue = selectedInstitution || institutionQuery.trim() || null
        const { error } = await updateEducationDetails({ institution: institutionValue, course })
        if (error) throw error
      } else if (showApprenticeshipFields) {
        const tradeValue    = selectedTrade    || tradeQuery.trim()    || null
        const providerValue = selectedProvider || providerQuery.trim() || null
        const { error } = await updateEducationDetails({ trade: tradeValue, trainingProvider: providerValue })
        if (error) throw error
      } else if (showIndustryField) {
        const { error } = await updateEducationDetails({ industry })
        if (error) throw error
      }

      onClose({ name: name.trim() || currentName, avatarUrl: avatarUrl || currentAvatar })
    } catch {
      Alert.alert('Save failed', 'Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const storagePath = userId ? `${userId}/avatar.jpg` : null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onClose(null)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[ep.container, { backgroundColor: colors.background }]}>

          {/* Header */}
          <View style={[ep.header, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1 }}>
              <Text style={[ep.headerTitle, { color: colors.textPrimary }]}>Edit profile</Text>
              <Text style={[ep.headerSub, { color: colors.textSecondary }]}>Change your photo, name and where you study or work. Who can find you is set in Directory profile.</Text>
            </View>
            <TouchableOpacity
              style={[ep.closeBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => onClose(null)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={15} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={ep.scrollView}
            contentContainerStyle={ep.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* Photo upload */}
            {storagePath && (
              <ImageUploader
                bucket="profile-pictures"
                storagePath={storagePath}
                currentUrl={avatarUrl || currentAvatar}
                onUpload={url => setAvatarUrl(url)}
                label="Profile Photo"
                size={96}
              />
            )}

            {/* Name field */}
            <Text style={[ep.fieldLabel, { color: colors.textSecondary }]}>Display Name</Text>
            <TextInput
              style={[ep.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              maxLength={60}
              autoCapitalize="words"
              returnKeyType="done"
            />

            {/* Institution + course — Student accounts only */}
            {showInstitutionFields && (
              <>
                <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 28 }]}>Institution</Text>
                <View style={[
                  ep.pickerWrap,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  showInstList && instResults.length > 0 && ep.pickerWrapOpen,
                ]}>
                  <GraduationCap size={16} color={colors.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[ep.pickerInput, { color: colors.textPrimary }]}
                    value={institutionQuery}
                    onChangeText={text => { setInstitutionQuery(text); setSelectedInstitution(null); setShowInstList(true) }}
                    onFocus={() => setShowInstList(true)}
                    placeholder="Search by name or short form…"
                    placeholderTextColor={colors.textTertiary}
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                </View>
                {showInstList && instResults.length > 0 && (
                  <View style={[ep.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {instResults.map((inst, i) => (
                      <TouchableOpacity
                        key={inst.id}
                        style={[ep.dropdownItem, i < instResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                        onPress={() => { setSelectedInstitution(inst); setInstitutionQuery(inst.name); setShowInstList(false) }}
                        activeOpacity={0.75}
                      >
                        <Text style={[ep.dropdownItemText, { color: colors.textPrimary }]} numberOfLines={1}>{inst.name}</Text>
                        {inst.city ? <Text style={[ep.dropdownItemSub, { color: colors.textTertiary }]}>{inst.city}</Text> : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 20 }]}>Course or Programme</Text>
                <TextInput
                  style={[ep.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  value={course}
                  onChangeText={setCourse}
                  placeholder="e.g. Business, Computer Science"
                  placeholderTextColor={colors.textTertiary}
                />
              </>
            )}

            {/* Trade + training provider — Apprentice accounts only */}
            {showApprenticeshipFields && (
              <>
                <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 28 }]}>Trade or Craft</Text>
                <View style={[
                  ep.pickerWrap,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  showTradeList && tradeResults.length > 0 && ep.pickerWrapOpen,
                ]}>
                  <Briefcase size={16} color={colors.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[ep.pickerInput, { color: colors.textPrimary }]}
                    value={tradeQuery}
                    onChangeText={text => { setTradeQuery(text); setSelectedTrade(null); setShowTradeList(true) }}
                    onFocus={() => setShowTradeList(true)}
                    placeholder="e.g. Electrical, Plumbing, Software Developer"
                    placeholderTextColor={colors.textTertiary}
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                </View>
                {showTradeList && tradeResults.length > 0 && (
                  <View style={[ep.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {tradeResults.map((t, i) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[ep.dropdownItem, i < tradeResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                        onPress={() => { setSelectedTrade(t); setTradeQuery(t.name); setShowTradeList(false) }}
                        activeOpacity={0.75}
                      >
                        <Text style={[ep.dropdownItemText, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{t.name}</Text>
                        <Text style={[ep.dropdownItemSub, { color: colors.textTertiary }]}>{t.category}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 20 }]}>Training Provider</Text>
                <View style={[
                  ep.pickerWrap,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  showProviderList && providerResults.length > 0 && ep.pickerWrapOpen,
                ]}>
                  <MapPin size={16} color={colors.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[ep.pickerInput, { color: colors.textPrimary }]}
                    value={providerQuery}
                    onChangeText={text => { setProviderQuery(text); setSelectedProvider(null); setShowProviderList(true) }}
                    onFocus={() => setShowProviderList(true)}
                    placeholder="e.g. City of Dublin ETB, Cork ETB"
                    placeholderTextColor={colors.textTertiary}
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                </View>
                {showProviderList && providerResults.length > 0 && (
                  <View style={[ep.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {providerResults.map((p, i) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[ep.dropdownItem, i < providerResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                        onPress={() => { setSelectedProvider(p); setProviderQuery(p.name); setShowProviderList(false) }}
                        activeOpacity={0.75}
                      >
                        <Text style={[ep.dropdownItemText, { color: colors.textPrimary }]} numberOfLines={1}>{p.name}</Text>
                        {p.city ? <Text style={[ep.dropdownItemSub, { color: colors.textTertiary }]}>{p.city}</Text> : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Industry: Worker accounts only. Sets their Campus Connect group. */}
            {showIndustryField && (
              <>
                <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 28 }]}>Industry</Text>
                <View style={[ep.pickerWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Briefcase size={16} color={colors.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[ep.pickerInput, { color: colors.textPrimary }]}
                    value={industry}
                    onChangeText={setIndustry}
                    maxLength={200}
                    placeholder="e.g. Healthcare, Retail, Construction"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </>
            )}

            {/* Save */}
            <Button
              label={saving ? 'Saving…' : 'Save Changes'}
              onPress={handleSave}
              variant="primary"
              loading={saving}
              style={ep.saveBtn}
            />

            {!showInstitutionFields && !showApprenticeshipFields && !showIndustryField && (
              <Text style={[ep.note, { color: colors.textTertiary }]}>
                Institution, course, apprenticeship and industry fields appear here for Student, Apprentice and Worker account types.
                You can change your account type anytime from Account Type in Settings.
              </Text>
            )}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const ep = StyleSheet.create({
  container: { flex: 1 },
  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 },
  headerSub:   { fontFamily: fonts.sans, fontSize: 14, marginTop: 4 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  scroll: { padding: 24, paddingBottom: 60, gap: 0 },

  fieldLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.7,
    marginTop: 28, marginBottom: 8,
  },
  input: {
    borderRadius: radius.button, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 15,
  },
  saveBtn: { marginTop: 32 },
  note: {
    fontFamily: fonts.sans, fontSize: 12,
    textAlign: 'center', marginTop: 16, lineHeight: 18,
  },

  // Institution/trade/provider search pickers — same search-then-pick
  // pattern as SignUpScreen's own institution/trade/provider fields.
  pickerWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.button, borderWidth: 1,
    paddingHorizontal: 14, minHeight: 48,
  },
  pickerWrapOpen: {
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  pickerInput: {
    flex: 1, fontFamily: fonts.sans, fontSize: 15, paddingVertical: 12,
  },
  dropdown: {
    borderWidth: 1, borderTopWidth: 0,
    borderBottomLeftRadius: radius.button, borderBottomRightRadius: radius.button,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownItemText: { fontFamily: fonts.sansMedium, fontSize: 14, flexShrink: 1 },
  dropdownItemSub:  { fontFamily: fonts.sans, fontSize: 11, flexShrink: 0 },
})

// ── Account Type Modal ───────────────────────────────────────────────────────
// Lets the person change their general user_type (Student / Apprentice /
// Gap Year / Worker) after signup. Backed by useUserType() — the same hook
// any other screen reads from — so this write updates Budgeting's income
// categories (and anywhere else the app reads it) the moment it's saved.
export function AccountTypeModal({ visible, onClose }) {
  const { colors } = useTheme()
  const { userType, types, setUserType } = useUserType()
  const [selected, setSelected] = useState(userType)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (visible) { setSelected(userType); setError('') }
  }, [visible, userType])

  async function handleSave() {
    if (saving || selected === userType) { onClose(); return }
    setSaving(true)
    setError('')
    const { error: err } = await setUserType(selected)
    setSaving(false)
    if (err) { setError('Could not save this change. Please try again.'); return }
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[ep.container, { backgroundColor: colors.background }]}>
        <View style={[ep.header, { backgroundColor: colors.background }]}>
          <View style={{ flex: 1 }}>
            <Text style={[ep.headerTitle, { color: colors.textPrimary }]}>Account type</Text>
            <Text style={[ep.headerSub, { color: colors.textSecondary }]}>Tailors tools like Budgeting to your situation</Text>
          </View>
          <TouchableOpacity
            style={[ep.closeBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={15} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView style={ep.scrollView} contentContainerStyle={ep.scroll} showsVerticalScrollIndicator={false}>
          {!!error && <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, marginBottom: 12 }}>{error}</Text>}
          <View style={{ gap: 10 }}>
            {types.map(t => {
              const isSelected = selected === t.key
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    at.option,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { borderColor: colors.accentBg, backgroundColor: colors.surfaceAlt },
                  ]}
                  onPress={() => setSelected(t.key)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[at.optionLabel, { color: colors.textPrimary }]}>{t.label}</Text>
                    <Text style={[at.optionSub, { color: colors.textSecondary }]}>{t.sub}</Text>
                  </View>
                  <View style={[at.radio, { borderColor: colors.border }, isSelected && { backgroundColor: colors.accentBg, borderColor: colors.accentBg }]}>
                    {isSelected && <Check size={12} color={colors.accentFg} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          <Button
            label={saving ? 'Saving…' : 'Save Changes'}
            onPress={handleSave}
            variant="primary"
            loading={saving}
            style={ep.saveBtn}
          />

          <Text style={[ep.note, { color: colors.textTertiary }]}>
            This changes which income categories Budgeting shows you going forward. Your existing entries stay as they are.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  )
}

const at = StyleSheet.create({
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: radius.card,
    borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  optionLabel:  { fontFamily: fonts.sansSemiBold, fontSize: 14, marginBottom: 2 },
  optionSub:    { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
})


// ── Appearance Modal ─────────────────────────────────────────────────────────
// The #82 System/Light/Dark three-way toggle. Unlike AccountTypeModal, this
// applies the moment a row is tapped — same as iOS/Android's own Appearance
// pickers — instead of needing a separate Save, since useTheme().setPreference
// is already a cheap, instant, reversible local write (AsyncStorage), not a
// network request. The modal itself re-themes live as you tap, which is the
// clearest possible confirmation that the choice took effect.
export function AppearanceModal({ visible, onClose }) {
  const { colors, preference, setPreference, mode } = useTheme()

  const OPTIONS = [
    { key: 'system', label: 'System', sub: `Match your device setting, currently ${mode === 'dark' ? 'Dark' : 'Light'}`, Icon: Smartphone },
    { key: 'light',  label: 'Light',  sub: 'Always use the light theme', Icon: Sun },
    { key: 'dark',   label: 'Dark',   sub: 'Always use the dark theme', Icon: Moon },
  ]

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[ep.container, { backgroundColor: colors.background }]}>
        <View style={[ep.header, { backgroundColor: colors.background }]}>
          <View style={{ flex: 1 }}>
            <Text style={[ep.headerTitle, { color: colors.textPrimary }]}>Appearance</Text>
            <Text style={[ep.headerSub, { color: colors.textSecondary }]}>Choose how UniBlueprint looks on this device</Text>
          </View>
          <TouchableOpacity
            style={[ep.closeBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={15} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView style={ep.scrollView} contentContainerStyle={ep.scroll} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            {OPTIONS.map(opt => {
              const isSelected = preference === opt.key
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    at.option,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { borderColor: colors.accentBg, backgroundColor: colors.surfaceAlt },
                  ]}
                  onPress={() => setPreference(opt.key)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[am.iconWrap, { backgroundColor: colors.background }]}>
                    <opt.Icon size={18} color={colors.textPrimary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[at.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[at.optionSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
                  </View>
                  <View style={[at.radio, { borderColor: colors.border }, isSelected && { backgroundColor: colors.accentBg, borderColor: colors.accentBg }]}>
                    {isSelected && <Check size={12} color={colors.accentFg} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[ep.note, { color: colors.textTertiary }]}>
            "System" follows your device's own light/dark setting automatically, including if it changes
            on its own (e.g. at sunset). Choosing Light or Dark overrides that until you pick System again.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  )
}

const am = StyleSheet.create({
  iconWrap: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
})


// ── Directory Profile Modal ──────────────────────────────────────────────────
// Lets the user change everything Directory discovery shows and scores
// about them after sign-up: the public/private toggle (profiles.discoverable
// — same VISIBILITY_OPTIONS SignUpScreen.jsx offers at sign-up), the "what
// are you open to" statuses, the free-text bio, and social/contact links.
// All reads/writes go through useDirectoryProfile() (AuthContext), the same
// single place SignUpScreen's own writes funnel through, so neither screen
// can drift out of sync with the other.
export function DirectoryProfileModal({ visible, onClose }) {
  const { colors } = useTheme()
  const { discoverable, bio, statuses, socialLinks, save } = useDirectoryProfile()

  const [localDiscoverable, setLocalDiscoverable] = useState(discoverable)
  const [localBio,          setLocalBio]           = useState(bio || '')
  const [localStatuses,     setLocalStatuses]       = useState(new Set(statuses))
  const [localLinks,        setLocalLinks]          = useState(socialLinks || {})
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Re-sync local form state to the latest saved values each time the modal opens
  useEffect(() => {
    if (visible) {
      setLocalDiscoverable(discoverable)
      setLocalBio(bio || '')
      setLocalStatuses(new Set(statuses))
      setLocalLinks(socialLinks || {})
      setError('')
    }
  }, [visible, discoverable, bio, statuses, socialLinks])

  function toggleStatus(key) {
    setLocalStatuses(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError('')
    const { error: err } = await save({
      discoverable: localDiscoverable,
      bio: localBio,
      statuses: [...localStatuses],
      socialLinks: localLinks,
    })
    setSaving(false)
    if (err) { setError('Could not save your changes. Please try again.'); return }
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[ep.container, { backgroundColor: colors.background }]}>
          <View style={[ep.header, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1 }}>
              <Text style={[ep.headerTitle, { color: colors.textPrimary }]}>Directory profile</Text>
              <Text style={[ep.headerSub, { color: colors.textSecondary }]}>Control how other students find and see you</Text>
            </View>
            <TouchableOpacity
              style={[ep.closeBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={15} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={ep.scrollView} contentContainerStyle={ep.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {!!error && <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, marginBottom: 12 }}>{error}</Text>}

            <Text style={[ep.fieldLabel, { color: colors.textSecondary }]}>Visibility</Text>
            <View style={{ gap: 10 }}>
              {VISIBILITY_OPTIONS.map(opt => {
                const isSelected = localDiscoverable === (opt.key === 'public')
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      at.option,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: colors.accentBg, backgroundColor: colors.surfaceAlt },
                    ]}
                    onPress={() => setLocalDiscoverable(opt.key === 'public')}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[at.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[at.optionSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
                    </View>
                    <View style={[at.radio, { borderColor: colors.border }, isSelected && { backgroundColor: colors.accentBg, borderColor: colors.accentBg }]}>
                      {isSelected && <Check size={12} color={colors.accentFg} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 28 }]}>Bio</Text>
            <TextInput
              style={[ep.input, { minHeight: 80, textAlignVertical: 'top', backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={localBio}
              onChangeText={t => setLocalBio(t.slice(0, MAX_BIO_LENGTH))}
              placeholder="A short line about yourself, shown on your Directory card"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={MAX_BIO_LENGTH}
            />
            <Text style={[dp.charCount, { color: colors.textTertiary }]}>{localBio.length}/{MAX_BIO_LENGTH}</Text>

            <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 20 }]}>What are you open to?</Text>
            <View style={{ gap: 8 }}>
              {STATUS_OPTIONS.map(opt => {
                const isSelected = localStatuses.has(opt.key)
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      at.option,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: colors.accentBg, backgroundColor: colors.surfaceAlt },
                    ]}
                    onPress={() => toggleStatus(opt.key)}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[at.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[at.optionSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
                    </View>
                    <View style={[at.radio, { borderColor: colors.border }, isSelected && { backgroundColor: colors.accentBg, borderColor: colors.accentBg }]}>
                      {isSelected && <Check size={12} color={colors.accentFg} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={[ep.fieldLabel, { color: colors.textSecondary, marginTop: 20 }]}>Social & contact links</Text>
            {SOCIAL_LINK_FIELDS.map(f => (
              <View key={f.key} style={{ marginBottom: 12 }}>
                <Text style={[dp.linkLabel, { color: colors.textSecondary }]}>{f.label}</Text>
                <TextInput
                  style={[ep.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  value={localLinks[f.key] || ''}
                  onChangeText={t => setLocalLinks(prev => ({ ...prev, [f.key]: t }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}

            <Button
              label={saving ? 'Saving…' : 'Save Changes'}
              onPress={handleSave}
              variant="primary"
              loading={saving}
              style={ep.saveBtn}
            />

            <Text style={[ep.note, { color: colors.textTertiary }]}>
              Private profiles never appear in anyone's Directory search or results, enforced on our servers,
              not just hidden in the app.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const dp = StyleSheet.create({
  charCount: {
    fontFamily: fonts.sans, fontSize: 11,
    textAlign: 'right', marginTop: 4,
  },
  linkLabel: {
    fontFamily: fonts.sansMedium, fontSize: 12, marginBottom: 6,
  },
})

