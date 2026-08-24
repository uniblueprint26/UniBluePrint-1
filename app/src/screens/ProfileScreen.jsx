import { useState, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Linking,
  Modal, TextInput, Image, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  User, GraduationCap, Users, HelpCircle, Info,
  Bell, Lock, LifeBuoy, LogOut, ChevronRight,
  Star, FileText, Calendar, BookOpen, X,
} from 'lucide-react-native'
import Card from '../components/ui/Card'
import ImageUploader from '../components/ui/ImageUploader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { WEBSITE_LINKS } from '../constants/site'

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
  { Icon: Bell,     label: 'Notifications',   sub: 'Manage your alerts and reminders',  screen: null },
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
        <View style={ep.container}>

          {/* Header */}
          <View style={ep.header}>
            <View style={{ flex: 1 }}>
              <Text style={ep.headerTitle}>Edit Profile</Text>
              <Text style={ep.headerSub}>Update your name and profile photo</Text>
            </View>
            <TouchableOpacity style={ep.closeBtn} onPress={() => onClose(null)} activeOpacity={0.8}>
              <X size={15} color={colors.navy} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
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
            <Text style={ep.fieldLabel}>Display Name</Text>
            <TextInput
              style={ep.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.light}
              maxLength={60}
              autoCapitalize="words"
              returnKeyType="done"
            />

            {/* Save */}
            <TouchableOpacity
              style={[ep.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={ep.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
            </TouchableOpacity>

            <Text style={ep.note}>
              University, course, and apprenticeship details are set during onboarding and cannot be changed here yet.
            </Text>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const ep = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },
  headerSub:   { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.55)', marginTop: 4 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  scroll: { padding: 24, paddingBottom: 60, gap: 0 },

  fieldLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7,
    marginTop: 28, marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.button, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 15, color: colors.navy,
  },
  saveBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingVertical: 15, alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  note: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.light,
    textAlign: 'center', marginTop: 16, lineHeight: 18,
  },
})


// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuth()
  const [signingOut,   setSigningOut]   = useState(false)
  const [stats,        setStats]        = useState({ cvs: 0, sessions: 0, notes: 0 })
  const [profileAvatar, setProfileAvatar] = useState(null)  // loaded from profiles table
  const [editVisible,  setEditVisible]  = useState(false)

  const displayName      = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const institution      = user?.user_metadata?.institution || user?.user_metadata?.university || ''
  const course           = user?.user_metadata?.course || ''
  const situation        = user?.user_metadata?.situation || ''
  const trade            = user?.user_metadata?.trade || ''
  const trainingProvider = user?.user_metadata?.training_provider || ''
  const initials         = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

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
    { value: stats.sessions.toString(), label: 'Session Booked', Icon: Calendar,  color: '#15803D', bg: '#F0FDF4' },
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
      Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=Become a Coach Application')
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile header */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}>
          {/* Avatar: shows uploaded photo if available, falls back to initials */}
          <View style={[styles.avatarCircle, profileAvatar && styles.avatarCirclePhoto]}>
            {profileAvatar ? (
              <Image source={{ uri: profileAvatar }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
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
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statBorder]}>
              <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                <s.Icon size={13} color={s.color} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Membership banner */}
        <View style={styles.membershipCard}>
          <View style={styles.membershipTop}>
            <View style={styles.membershipStarWrap}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.membershipEyebrow}>CURRENT PLAN</Text>
              <Text style={styles.membershipTitle}>Free Member</Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(WEBSITE_LINKS.pricing)}
            >
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.membershipSub}>
            Upgrade to unlock priority coach access and premium document services. Plans and
            payment are handled securely on the UniBlueprint website, never in the app.
          </Text>
        </View>

        {/* Explore */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>EXPLORE</Text>
          <View style={{ gap: 12 }}>
            {EXPLORE_LINKS.map(link => (
              <TouchableOpacity
                key={link.eyebrow}
                activeOpacity={0.8}
                onPress={() => handleExplorePress(link)}
              >
                <Card style={styles.linkCard}>
                  <View style={[styles.linkIcon, { backgroundColor: link.color }]}>
                    <link.Icon size={20} color={colors.navy} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.linkEyebrow}>{link.eyebrow}</Text>
                    <Text style={styles.linkLabel}>{link.label}</Text>
                    <Text style={styles.linkSub} numberOfLines={2}>{link.sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.light} style={{ flexShrink: 0 }} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ACCOUNT</Text>
          <Card style={{ padding: 0 }}>
            {ACCOUNT_LINKS.map(({ Icon, label, sub, screen }, i, arr) => (
              <TouchableOpacity
                key={label}
                activeOpacity={0.75}
                style={[styles.settingsRow, i < arr.length - 1 && styles.divider]}
                onPress={() => screen && navigation.navigate(screen)}
              >
                <View style={styles.settingsIcon}>
                  <Icon size={18} color={colors.navy} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>{label}</Text>
                  <Text style={styles.settingsSub}>{sub}</Text>
                </View>
                <ChevronRight size={14} color={colors.light} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <TouchableOpacity
            style={[styles.signOutBtn, signingOut && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={16} color="#DC2626" />
            <Text style={styles.signOutText}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>UniBlueprint · v1.0.0</Text>
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
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: {},

  profileHeader: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 28,
    alignItems: 'center',
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
  avatarInitials: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream },
  profileName:    { fontFamily: fonts.serif, fontSize: 24, color: colors.cream, marginBottom: 6 },
  profileUniBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 18 },
  profileUni:     { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.62)' },
  editBtn: {
    backgroundColor: 'rgba(245,240,232,0.1)', borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.22)',
    paddingHorizontal: 20, paddingVertical: 9,
  },
  editBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  statsRow: {
    flexDirection: 'row', backgroundColor: colors.cream,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 4 },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(30,58,95,0.08)' },
  statIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy, lineHeight: 28 },
  statLabel: {
    fontFamily: fonts.sans, fontSize: 10, color: colors.muted,
    marginTop: 3, textAlign: 'center', lineHeight: 14,
  },

  membershipCard: {
    backgroundColor: colors.navy,
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
  membershipTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },
  membershipSub:   {
    fontFamily: fonts.sans, fontSize: 12,
    color: 'rgba(245,240,232,0.58)', lineHeight: 18,
  },
  upgradeBtn: {
    backgroundColor: colors.cream, borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 9, flexShrink: 0,
  },
  upgradeBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },

  linkCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  linkIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  linkEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 9, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4,
  },
  linkLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, lineHeight: 20, marginBottom: 3 },
  linkSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17 },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  divider:       { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  settingsIcon:  {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  settingsLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  settingsSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: radius.card,
    height: 50, backgroundColor: '#FEF2F2',
  },
  signOutText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#DC2626' },
  versionText: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.light,
    textAlign: 'center', marginTop: spacing.lg,
  },
})
