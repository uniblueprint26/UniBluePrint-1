import { useState, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Share,
  Modal, TextInput, Image, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  User, GraduationCap, Users, HelpCircle, Info,
  Bell, Lock, LifeBuoy, LogOut, ChevronRight,
  Star, FileText, Calendar, BookOpen, X, Compass, Menu, Tag, Check, Briefcase, Heart, Eye,
  Palette, Sun, Moon, Smartphone, Share2,
} from 'lucide-react-native'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ImageUploader from '../components/ui/ImageUploader'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { openMenu } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'
import { useUserType } from '../hooks/useUserType'
import { useInterests } from '../hooks/useInterests'
import { useDirectoryProfile } from '../hooks/useDirectoryProfile'
import { useReferrals } from '../hooks/useReferrals'
import InterestsModal from '../components/profile/InterestsModal'
import {
  STATUS_OPTIONS, SOCIAL_LINK_FIELDS, VISIBILITY_OPTIONS, MAX_BIO_LENGTH,
} from '../constants/directory'
import { supabase } from '../lib/supabase'
import { WEBSITE_LINKS } from '../constants/site'
import { LEGAL_ENTITY_LINE } from '../constants/legal'

// ── Explore links ──────────────────────────────────────────────────────────────

const EXPLORE_LINKS = [
  {
    Icon: Users,
    eyebrow: 'OUR COACHES',
    label: 'Find the right coach for your goals',
    sub: 'Browse our verified panel of coaches across every field.',
    color: '#EFF6FF',
    action: 'coaches',
  },
  {
    Icon: Star,
    eyebrow: 'BECOME A COACH',
    label: 'Share your expertise. Help others grow.',
    sub: 'Apply to join the UniBlueprint coaching network.',
    color: '#F0FDF4',
    action: 'become_coach',
  },
  {
    Icon: HelpCircle,
    eyebrow: 'FAQS',
    label: 'Quick answers to the questions that matter',
    sub: 'Everything about how UniBlueprint works.',
    color: '#FFF7ED',
    action: 'screen',
    screen: 'FAQs',
  },
  {
    Icon: Tag,
    eyebrow: 'PRICING',
    label: 'View Plans',
    sub: 'Free, Pro, and Premium — see what each plan includes.',
    color: '#FEF3C7',
    action: 'screen',
    screen: 'Pricing',
  },
  {
    Icon: Info,
    eyebrow: 'ABOUT',
    label: 'Built for every young person in Ireland',
    sub: 'Our mission and how the platform works.',
    color: '#FDF4FF',
    action: 'screen',
    screen: 'About',
  },
]

// ── Account links ──────────────────────────────────────────────────────────────

const ACCOUNT_LINKS = [
  { Icon: Briefcase, label: 'Account Type',    sub: null,                                action: 'accountType' },
  { Icon: Heart,     label: 'Interests',       sub: null,                                action: 'interests' },
  { Icon: Eye,      label: 'Directory Profile', sub: null,                              action: 'directoryProfile' },
  { Icon: Bell,     label: 'Notifications',   sub: 'Push alerts and in-app reminders',  action: 'notifications' },
  { Icon: Palette,  label: 'Appearance',      sub: null,                                action: 'appearance' },
  { Icon: Compass,  label: 'How UniBlueprint Works', sub: 'Replay the app walkthrough', screen: 'BlueprintTour' },
  { Icon: Lock,     label: 'Privacy and Data', sub: 'Your data rights and requests',    screen: 'PrivacyData' },
  { Icon: LifeBuoy, label: 'Help and Support', sub: 'Get help from the team',            screen: 'Help' },
]

// ── Edit Profile Modal ─────────────────────────────────────────────────────────
// Lets the user update their display name and profile photo.
// Photo: uploaded to the profile-pictures bucket at a fixed path ({userId}/avatar.jpg)
// using upsert=true — overwrites in place, so no orphaned files accumulate on re-upload.
// Name: written to both profiles.full_name and auth user metadata so both
// the database and the in-session user object stay in sync.

function EditProfileModal({ visible, onClose, userId, currentName, currentAvatar }) {
  const { colors } = useTheme()
  const [name,      setName]      = useState(currentName || '')
  const [avatarUrl, setAvatarUrl] = useState(null)  // URL returned by ImageUploader on upload
  const [saving,    setSaving]    = useState(false)

  // Reset form fields each time the modal opens
  useEffect(() => {
    if (visible) {
      setName(currentName || '')
      setAvatarUrl(null)
    }
  }, [visible, currentName])

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
          <View style={[ep.header, { backgroundColor: colors.chromeBg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[ep.headerTitle, { color: colors.chromeFg }]}>Edit Profile</Text>
              <Text style={ep.headerSub}>Update your name and profile photo</Text>
            </View>
            <TouchableOpacity
              style={[ep.closeBtn, { backgroundColor: colors.surface }]}
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

            {/* Save */}
            <Button
              label={saving ? 'Saving…' : 'Save Changes'}
              onPress={handleSave}
              variant="primary"
              loading={saving}
              style={ep.saveBtn}
            />

            <Text style={[ep.note, { color: colors.textTertiary }]}>
              University, course, and apprenticeship details are set during onboarding and cannot be changed here yet.
            </Text>

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
  headerTitle: { fontFamily: fonts.serif, fontSize: 22 },
  headerSub:   { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.55)', marginTop: 4 },
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
})

// ── Account Type Modal ───────────────────────────────────────────────────────
// Lets the person change their general user_type (Student / Apprentice /
// Gap Year / Worker) after signup. Backed by useUserType() — the same hook
// any other screen reads from — so this write updates Budgeting's income
// categories (and anywhere else the app reads it) the moment it's saved.
function AccountTypeModal({ visible, onClose }) {
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
        <View style={[ep.header, { backgroundColor: colors.chromeBg }]}>
          <View style={{ flex: 1 }}>
            <Text style={[ep.headerTitle, { color: colors.chromeFg }]}>Account Type</Text>
            <Text style={ep.headerSub}>Tailors tools like Budgeting to your situation</Text>
          </View>
          <TouchableOpacity
            style={[ep.closeBtn, { backgroundColor: colors.surface }]}
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
function AppearanceModal({ visible, onClose }) {
  const { colors, preference, setPreference, mode } = useTheme()

  const OPTIONS = [
    { key: 'system', label: 'System', sub: `Match your device setting — currently ${mode === 'dark' ? 'Dark' : 'Light'}`, Icon: Smartphone },
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
        <View style={[ep.header, { backgroundColor: colors.chromeBg }]}>
          <View style={{ flex: 1 }}>
            <Text style={[ep.headerTitle, { color: colors.chromeFg }]}>Appearance</Text>
            <Text style={ep.headerSub}>Choose how UniBlueprint looks on this device</Text>
          </View>
          <TouchableOpacity
            style={[ep.closeBtn, { backgroundColor: colors.surface }]}
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
function DirectoryProfileModal({ visible, onClose }) {
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
          <View style={[ep.header, { backgroundColor: colors.chromeBg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[ep.headerTitle, { color: colors.chromeFg }]}>Directory Profile</Text>
              <Text style={ep.headerSub}>Control how other students find and see you</Text>
            </View>
            <TouchableOpacity
              style={[ep.closeBtn, { backgroundColor: colors.surface }]}
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
              Private profiles never appear in anyone's Directory search or results — enforced on our servers,
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


// ── Handler Rating Prompt ────────────────────────────────────────────────────
// Shows once a Foundation submission is delivered and hasn't been rated yet.
// One rating per submission (handler_ratings has a unique constraint on
// submission_id). Renders nothing when there's nothing to rate — most users
// will see nothing here until the real submission flow is live end-to-end.
function HandlerRatingPrompt({ userId }) {
  const { colors } = useTheme()
  const [pending, setPending] = useState([])
  const [stars, setStars]     = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const [subsRes, ratingsRes] = await Promise.all([
        supabase
          .from('submissions')
          .select('id, handler_id, services(name)')
          .eq('user_id', userId)
          .eq('stage', 'delivered')
          .not('handler_id', 'is', null),
        supabase.from('handler_ratings').select('submission_id').eq('user_id', userId),
      ])
      if (cancelled || subsRes.error || ratingsRes.error) return
      const ratedIds = new Set((ratingsRes.data || []).map(r => r.submission_id))
      setPending((subsRes.data || []).filter(s => !ratedIds.has(s.id)))
    })()
    return () => { cancelled = true }
  }, [userId])

  if (pending.length === 0) return null
  const current = pending[0]

  async function submit() {
    if (!stars) return
    setSaving(true)
    const { error } = await supabase.from('handler_ratings').insert({
      submission_id: current.id,
      user_id: userId,
      handler_id: current.handler_id,
      rating: stars,
      comment: comment.trim() || null,
    })
    setSaving(false)
    if (error) {
      Alert.alert('Could not save your rating', 'Please try again.')
      return
    }
    setPending(prev => prev.slice(1))
    setStars(0)
    setComment('')
  }

  return (
    <View style={[rp.card, { backgroundColor: colors.surface }]}>
      <Text style={rp.eyebrow}>YOUR REQUEST WAS DELIVERED</Text>
      <Text style={[rp.title, { color: colors.textPrimary }]}>
        How did your {current.services?.name || 'Foundation Blueprint request'} go?
      </Text>
      <View style={rp.starRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => setStars(n)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} star${n === 1 ? '' : 's'}`}
            accessibilityState={{ selected: n <= stars }}
          >
            <Star size={28} color="#F59E0B" fill={n <= stars ? '#F59E0B' : 'transparent'} strokeWidth={1.5} />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[rp.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
        placeholder="Optional: tell us more..."
        placeholderTextColor={colors.textTertiary}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />
      <Button
        label={saving ? 'Saving…' : 'Submit Rating'}
        onPress={submit}
        variant="primary"
        loading={saving}
        disabled={!stars}
      />
    </View>
  )
}

const rp = StyleSheet.create({
  card: {
    borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    marginHorizontal: spacing.md, marginTop: spacing.md,
    padding: 18,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: '#B45309',
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6,
  },
  title: { fontFamily: fonts.serif, fontSize: 17, marginBottom: 14, lineHeight: 22 },
  starRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  input: {
    borderRadius: radius.button,
    borderWidth: 1,
    padding: 12, minHeight: 56,
    fontFamily: fonts.sans, fontSize: 13,
    marginBottom: 12,
  },
})


// ── Invite Friends card ──────────────────────────────────────────────────────
// Attribution only — see the 20261015120000_referral_tracking migration and
// useReferrals(). Sharing or using a code never changes anyone's price,
// access, or billing; this card exists purely so a user can see their own
// code/link and how many people have used it, same spirit as the Directory
// Profile's "who you are" rather than anything commercial.
function InviteFriendsCard() {
  const { colors } = useTheme()
  const { code, shareLink, count, loading } = useReferrals()

  async function handleShare() {
    if (!shareLink) return
    try {
      await Share.share({
        message: `Join me on UniBlueprint — the free platform for CVs, coaching, and student life in Ireland. ${shareLink}`,
      })
    } catch { /* user cancelled or share sheet unavailable — nothing to recover from */ }
  }

  if (loading || !code) return null

  return (
    <View style={[inv.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={inv.row}>
        <View style={[inv.iconWrap, { backgroundColor: colors.background }]}>
          <Share2 size={18} color={colors.textPrimary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[inv.title, { color: colors.textPrimary }]}>Invite Friends</Text>
          <Text style={[inv.sub, { color: colors.textSecondary }]}>
            {count > 0
              ? `${count} friend${count === 1 ? '' : 's'} joined using your code`
              : 'Share your code — no catch, just helps us grow'}
          </Text>
        </View>
      </View>
      <View style={[inv.codeRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[inv.codeText, { color: colors.textPrimary }]}>{code}</Text>
      </View>
      <TouchableOpacity
        style={[inv.shareBtn, { backgroundColor: colors.accentBg }]}
        activeOpacity={0.85}
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel="Share your invite link"
      >
        <Text style={[inv.shareBtnText, { color: colors.accentFg }]}>Share Invite Link</Text>
      </TouchableOpacity>
    </View>
  )
}

const inv = StyleSheet.create({
  card: {
    borderRadius: radius.card, borderWidth: 1,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    padding: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14, marginBottom: 2 },
  sub:   { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17 },
  codeRow: {
    borderRadius: radius.button, borderWidth: 1,
    paddingVertical: 12, alignItems: 'center',
    marginBottom: 10,
  },
  codeText: { fontFamily: fonts.sansSemiBold, fontSize: 18, letterSpacing: 1.5 },
  shareBtn: {
    borderRadius: radius.button, height: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { colors, preference: themePreference, mode: themeMode } = useTheme()
  const { user, signOut, isPro, isComplimentaryPro, subscription } = useAuth()
  const { label: userTypeLabel } = useUserType()
  const { interests } = useInterests()
  const { discoverable } = useDirectoryProfile()
  const [interestsVisible, setInterestsVisible] = useState(false)
  const [signingOut,   setSigningOut]   = useState(false)
  const [stats,        setStats]        = useState({ cvs: 0, sessions: 0, notes: 0 })
  const [profileAvatar, setProfileAvatar] = useState(null)  // loaded from profiles table
  const [editVisible,  setEditVisible]  = useState(false)
  const [accountTypeVisible, setAccountTypeVisible] = useState(false)
  const [directoryProfileVisible, setDirectoryProfileVisible] = useState(false)
  const [appearanceVisible, setAppearanceVisible] = useState(false)

  const displayName      = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const institution      = user?.user_metadata?.institution || user?.user_metadata?.university || ''
  const course           = user?.user_metadata?.course || ''
  const situation        = user?.user_metadata?.situation || ''
  const trade            = user?.user_metadata?.trade || ''
  const trainingProvider = user?.user_metadata?.training_provider || ''
  const initials         = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  // Real membership state (P0-5) — was hard-coded to "Free Member" for
  // everyone, including paying Pro/Premium users. Mirrors the tier naming
  // PricingScreen already uses (`pro_annual` → Premium, otherwise Pro).
  const membershipLabel = isComplimentaryPro
    ? 'Complimentary Pro'
    : isPro
      ? (subscription?.tier === 'pro_annual' ? 'Premium Member' : 'Pro Member')
      : 'Free Member'

  // Build the sub-line shown beneath the display name in the profile header
  const SITUATION_LABELS = {
    working:     'Working',
    gap_year:    'Gap Year',
    recent_grad: 'Recent Graduate',
    prospective: 'Prospective Student',
    other:       'Not Currently Studying',
  }

  function getProfileSubLine() {
    if (situation === 'apprenticeship') {
      const parts = [trade ? `${trade} Apprenticeship` : 'Apprenticeship']
      if (trainingProvider) parts.push(trainingProvider)
      return parts.join(' · ')
    }
    if (situation === 'in_college' || situation === 'plc') {
      const parts = [institution, course].filter(Boolean)
      return parts.length ? parts.join(' · ') : (situation === 'plc' ? 'PLC' : 'Add your institution')
    }
    return SITUATION_LABELS[situation] || institution || 'Your Institution'
  }

  const profileSubLine = getProfileSubLine()

  // Appearance row's subtitle — mirrors the Account Type/Interests rows below
  // in showing the current value inline rather than a generic description.
  const appearanceSubLabel = themePreference === 'system'
    ? `System (currently ${themeMode === 'dark' ? 'Dark' : 'Light'})`
    : themePreference === 'dark' ? 'Dark' : 'Light'

  // Load avatar_url from the profiles table
  // (auth user_metadata doesn't hold avatar_url — the profiles table is the source of truth)
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data?.avatar_url) setProfileAvatar(data.avatar_url) })
      .catch(() => {})
  }, [user?.id])

  // Pull live stats from activity_events
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('activity_events')
      .select('type')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return
        setStats({
          cvs:      data.filter(e => e.type === 'document_submitted').length,
          sessions: data.filter(e => e.type === 'session_booked').length,
          notes:    data.filter(e => e.type === 'note_saved').length,
        })
      })
      .catch(() => {})
  }, [user?.id])

  const STATS = [
    { value: stats.cvs.toString(),      label: 'CVs Submitted',  Icon: FileText,  color: '#1d4ed8', bg: '#EFF6FF' },
    { value: stats.sessions.toString(), label: 'Sessions Booked', Icon: Calendar,  color: '#15803D', bg: '#F0FDF4' },
    { value: stats.notes.toString(),    label: 'Notes Saved',    Icon: BookOpen,  color: '#7C3AED', bg: '#F5F3FF' },
  ]

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try { await signOut() }
          catch { Alert.alert('Error', 'Could not sign out. Please try again.') }
          finally { setSigningOut(false) }
        },
      },
    ])
  }

  function handleExplorePress(link) {
    if (link.action === 'screen' && link.screen) {
      navigation.navigate(link.screen)
    } else if (link.action === 'coaches') {
      navigation.getParent()?.navigate('Home', {
        screen: 'Elevation',
      })
    } else if (link.action === 'become_coach') {
      Linking.openURL('mailto:support@uniblueprint.ie?subject=Become a Coach Application')
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.chromeBg, paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={[styles.menuBtn, { top: insets.top + 16 }]}
            activeOpacity={0.7}
            onPress={() => openMenu(navigation)}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Menu size={20} color={colors.chromeFg} />
          </TouchableOpacity>
          {/* Avatar: shows uploaded photo if available, falls back to initials */}
          <View style={[styles.avatarCircle, profileAvatar && styles.avatarCirclePhoto]}>
            {profileAvatar ? (
              <Image source={{ uri: profileAvatar }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <Text style={[styles.avatarInitials, { color: colors.chromeFg }]}>{initials}</Text>
            )}
          </View>

          <Text style={[styles.profileName, { color: colors.chromeFg }]}>{displayName}</Text>
          <View style={styles.profileUniBadge}>
            <GraduationCap size={13} color="rgba(245,240,232,0.6)" />
            <Text style={styles.profileUni} numberOfLines={2}>
              {profileSubLine}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={() => setEditVisible(true)}
          >
            <Text style={[styles.editBtnText, { color: colors.chromeFg }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && [styles.statBorder, { borderRightColor: colors.border }]]}>
              <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                <s.Icon size={13} color={s.color} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Membership banner — reflects the real subscription state from
            AuthContext rather than a hard-coded "Free Member" for everyone,
            including paying Pro/Premium users (P0-5). */}
        <View style={[styles.membershipCard, { backgroundColor: colors.chromeBg }]}>
          <View style={styles.membershipTop}>
            <View style={styles.membershipStarWrap}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.membershipEyebrow}>CURRENT PLAN</Text>
              <Text style={[styles.membershipTitle, { color: colors.chromeFg }]}>{membershipLabel}</Text>
            </View>
            {/* iOS: no purchase CTA in the app (App Store 3.1.1) — plan status only (D1). */}
            {!isPro && !isComplimentaryPro && Platform.OS !== 'ios' && (
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: colors.chromeFg }]}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(WEBSITE_LINKS.pricing)}
              >
                <Text style={styles.upgradeBtnText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.membershipSub}>
            {isPro || isComplimentaryPro
              ? 'Thanks for being a member. Manage or change your plan on the UniBlueprint website.'
              : Platform.OS === 'ios'
                ? 'Manage your plan on uniblueprint.ie.'
                : 'Upgrade to unlock priority coach access and premium document services. Plans and payment are handled securely on the UniBlueprint website, never in the app.'}
          </Text>
        </View>

        {/* Invite Friends — attribution only, see useReferrals() */}
        <InviteFriendsCard />

        {/* Handler rating prompt — shows only when there's a delivered, unrated request */}
        <HandlerRatingPrompt userId={user?.id} />

        {/* Explore */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: colors.textSecondary }]}>EXPLORE</Text>
          <View style={{ gap: 12 }}>
            {EXPLORE_LINKS.map(link => (
              <TouchableOpacity
                key={link.eyebrow}
                activeOpacity={0.8}
                onPress={() => handleExplorePress(link)}
              >
                <Card style={styles.linkCard}>
                  <View style={[styles.linkIcon, { backgroundColor: link.color }]}>
                    <link.Icon size={20} color={colors.textPrimary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.linkEyebrow, { color: colors.textSecondary }]}>{link.eyebrow}</Text>
                    <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>{link.label}</Text>
                    <Text style={[styles.linkSub, { color: colors.textSecondary }]} numberOfLines={2}>{link.sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textTertiary} style={{ flexShrink: 0 }} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: colors.textSecondary }]}>ACCOUNT</Text>
          <Card style={{ padding: 0 }}>
            {ACCOUNT_LINKS.map(({ Icon, label, sub, screen, action }, i, arr) => (
              <TouchableOpacity
                key={label}
                activeOpacity={0.75}
                style={[styles.settingsRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => {
                  if (action === 'accountType') setAccountTypeVisible(true)
                  else if (action === 'interests') setInterestsVisible(true)
                  else if (action === 'directoryProfile') setDirectoryProfileVisible(true)
                  else if (action === 'appearance') setAppearanceVisible(true)
                  // NotificationsScreen lives in the Home stack, not this
                  // Profile stack, so it needs a cross-stack navigate — this
                  // row used to be a dead tap (screen: null).
                  else if (action === 'notifications') navigation.getParent()?.navigate('Home', { screen: 'Notifications' })
                  else if (screen) navigation.navigate(screen)
                }}
              >
                <View style={[styles.settingsIcon, { backgroundColor: colors.background }]}>
                  <Icon size={18} color={colors.textPrimary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>{label}</Text>
                  <Text style={[styles.settingsSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {action === 'accountType' ? userTypeLabel
                      : action === 'interests' ? (interests.length ? interests.join(', ') : 'Not set — tap to choose')
                      : action === 'directoryProfile' ? (discoverable ? 'Public — visible in Directory search' : 'Private — hidden from Directory search')
                      : action === 'appearance' ? appearanceSubLabel
                      : sub}
                  </Text>
                </View>
                <ChevronRight size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <Button
            label={signingOut ? 'Signing out...' : 'Sign Out'}
            icon={LogOut}
            variant="destructive"
            loading={signingOut}
            onPress={handleSignOut}
            style={{ height: 50 }}
          />
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>UniBlueprint · v1.0.0</Text>
          <Text style={[styles.legalText, { color: colors.textTertiary }]}>{LEGAL_ENTITY_LINE}</Text>
        </View>

      </ScrollView>

      {/* Edit Profile modal */}
      <EditProfileModal
        visible={editVisible}
        userId={user?.id}
        currentName={displayName}
        currentAvatar={profileAvatar}
        onClose={updates => {
          setEditVisible(false)
          if (updates?.avatarUrl) setProfileAvatar(updates.avatarUrl)
          // Display name refresh is handled by auth state change from updateUser()
        }}
      />

      {/* Account Type modal */}
      <AccountTypeModal
        visible={accountTypeVisible}
        onClose={() => setAccountTypeVisible(false)}
      />

      {/* Interests modal — same shared picker Course Connect surfaces inline */}
      <InterestsModal
        visible={interestsVisible}
        onClose={() => setInterestsVisible(false)}
      />

      {/* Directory Profile modal — visibility, bio, statuses, social links */}
      <DirectoryProfileModal
        visible={directoryProfileVisible}
        onClose={() => setDirectoryProfileVisible(false)}
      />

      {/* Appearance modal — #82 System/Light/Dark */}
      <AppearanceModal
        visible={appearanceVisible}
        onClose={() => setAppearanceVisible(false)}
      />
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: {},

  profileHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: 28,
    alignItems: 'center',
  },
  menuBtn: {
    position: 'absolute', right: spacing.md, width: 34, height: 34,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  avatarCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(245,240,232,0.12)',
    borderWidth: 2, borderColor: 'rgba(245,240,232,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, overflow: 'hidden',
  },
  // When a photo is loaded, drop the tinted bg so the image shows cleanly
  avatarCirclePhoto: { backgroundColor: 'transparent', borderColor: 'rgba(245,240,232,0.5)' },
  avatarImg:      { width: 76, height: 76, borderRadius: 38 },
  avatarInitials: { fontFamily: fonts.serif, fontSize: 28 },
  profileName:    { fontFamily: fonts.serif, fontSize: 24, marginBottom: 6 },
  profileUniBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 18 },
  profileUni:     { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.62)' },
  editBtn: {
    backgroundColor: 'rgba(245,240,232,0.1)', borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.22)',
    paddingHorizontal: 20, paddingVertical: 9,
  },
  editBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 4 },
  statBorder: { borderRightWidth: 1 },
  statIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 28 },
  statLabel: {
    fontFamily: fonts.sans, fontSize: 10,
    marginTop: 3, textAlign: 'center', lineHeight: 14,
  },

  membershipCard: {
    borderRadius: radius.card,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: 18,
    ...shadows.elevated,
  },
  membershipTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  membershipStarWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(245,186,11,0.15)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  membershipEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 9,
    color: 'rgba(245,240,232,0.42)', textTransform: 'uppercase', letterSpacing: 0.7,
    marginBottom: 2,
  },
  membershipTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  membershipSub:   {
    fontFamily: fonts.sans, fontSize: 12,
    color: 'rgba(245,240,232,0.58)', lineHeight: 18,
  },
  upgradeBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 9, flexShrink: 0,
  },
  // Always sits on the navy/chrome membership card regardless of theme, so
  // its text stays the brand navy (matching the cream-ish button fill).
  upgradeBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#1E3A5F' },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },

  linkCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  linkIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  linkEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 9,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4,
  },
  linkLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 20, marginBottom: 3 },
  linkSub:   { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17 },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  settingsIcon:  {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  settingsLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  settingsSub:   { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },

  versionText: {
    fontFamily: fonts.sans, fontSize: 12,
    textAlign: 'center', marginTop: spacing.lg,
  },
  legalText: {
    fontFamily: fonts.sans, fontSize: 11,
    textAlign: 'center', marginTop: spacing.xs, lineHeight: 16, paddingHorizontal: spacing.lg,
  },
})
