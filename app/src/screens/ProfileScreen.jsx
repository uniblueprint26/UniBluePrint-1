import { useState, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Share, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  GraduationCap, Briefcase, Hammer, Pencil, Bookmark, Eye, Gift, Shield, Radio,
} from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { Row, RowGroup } from '../components/profile/Rows'
import HandlerRatingPrompt from '../components/profile/HandlerRatingPrompt'
import { EditProfileModal, DirectoryProfileModal } from '../components/profile/ProfileModals'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useUserType } from '../hooks/useUserType'
import { useDirectoryProfile } from '../hooks/useDirectoryProfile'
import WalletStats from '../components/profile/WalletStats'
import { useReferrals } from '../hooks/useReferrals'
import { supabase } from '../lib/supabase'
import { useProFree } from '../hooks/useAppFlags'
import { NATIVE_NEUTRAL_BILLING } from '../constants/platformPolicy'
import { openInHomeStack } from '../navigation/helpers'

// Round three pick A: serif title with an Edit profile button, avatar and name
// with a role badge, three real counts, the plan card, then one grouped list.
// Everything else (account, notifications, privacy, help) lives in Settings.
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user, isPro, hasRealPro, isProFree, isComplimentaryPro, subscription } = useAuth()
  const { labelShort: proFreeLabelShort } = useProFree()
  const { label: userTypeLabel } = useUserType()
  const { discoverable } = useDirectoryProfile()
  const { shareLink, count: invited } = useReferrals()
  const [stats, setStats] = useState({ cvs: 0, sessions: 0, notes: 0 })
  const [profileAvatar, setProfileAvatar] = useState(null)
  const [editVisible, setEditVisible] = useState(false)
  const [directoryVisible, setDirectoryVisible] = useState(false)

  const meta = user?.user_metadata || {}
  const displayName = meta.full_name || user?.email?.split('@')[0] || ''
  const institution = meta.institution || meta.university || ''
  const course = meta.course || ''
  const situation = meta.situation || ''
  const trade = meta.trade || ''
  const trainingProvider = meta.training_provider || ''
  const industry = meta.industry || ''
  const initials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const BadgeIcon = situation === 'apprenticeship' ? Hammer : (situation === 'working' || industry) ? Briefcase : GraduationCap
  const place = situation === 'apprenticeship' ? trainingProvider : (institution || industry)
  const badge = [userTypeLabel, place].filter(Boolean).join(', ')
  const subLine = situation === 'apprenticeship' ? (trade ? `${trade} apprenticeship` : '') : course

  const planLabel = isComplimentaryPro
    ? 'Complimentary Pro'
    : hasRealPro
      ? (subscription?.tier === 'pro_annual' ? 'Premium' : 'Pro')
      : isProFree ? 'Pro' : 'Free'
  const planSub = isProFree && !hasRealPro && !isComplimentaryPro
    ? `Pro is free for everyone until ${proFreeLabelShort}.`
    : (isPro || isComplimentaryPro)
      ? 'Thanks for being a member.'
      : NATIVE_NEUTRAL_BILLING
        ? 'Your plan is managed on uniblueprint.ie.'
        : 'Try Pro free. Services are half price during the trial.'

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => { if (data?.avatar_url) setProfileAvatar(data.avatar_url) })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('activity_events').select('type').eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return
        setStats({
          cvs: data.filter(e => e.type === 'document_submitted').length,
          sessions: data.filter(e => e.type === 'session_booked').length,
          notes: data.filter(e => e.type === 'note_saved').length,
        })
      })
      .catch(() => {})
  }, [user?.id])

  async function handleInvite() {
    if (!shareLink) { Alert.alert('Invite friends', 'Your invite link is not ready yet. Try again in a moment.'); return }
    try { await Share.share({ message: `Join me on UniBlueprint. ${shareLink}` }) } catch { /* cancelled */ }
  }

  const STATS = [
    { value: stats.cvs, label: 'CVs submitted' },
    { value: stats.sessions, label: 'Sessions booked' },
    { value: stats.notes, label: 'Notes saved' },
  ]

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <PageTitle
          title="Profile"
          right={(
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: colors.tabFill }]}
              activeOpacity={0.8}
              onPress={() => setEditVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Pencil size={16} color={colors.textPrimary} strokeWidth={1.9} />
              <Text style={[styles.editText, { color: colors.textPrimary }]}>Edit profile</Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.idRow}>
          <View style={[styles.avatarRing, { borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.accentBg }]}>
              {profileAvatar ? (
                <Image source={{ uri: profileAvatar }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Text style={[styles.initials, { color: colors.accentFg }]}>{initials}</Text>
              )}
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>{displayName}</Text>
            {!!subLine && <Text style={[styles.subLine, { color: colors.textSecondary }]} numberOfLines={1}>{subLine}</Text>}
            {!!badge && (
              <View style={[styles.badge, { backgroundColor: colors.tabFill }]}>
                <BadgeIcon size={15} color={colors.textPrimary} strokeWidth={1.9} />
                <Text style={[styles.badgeText, { color: colors.textPrimary }]} numberOfLines={1}>{badge}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {STATS.map((st, i) => (
            <View key={st.label} style={[styles.stat, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.divider }]}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{st.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{st.label}</Text>
            </View>
          ))}
        </View>

        <WalletStats />

        <View style={[styles.plan, { backgroundColor: colors.chromeBg }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.planEyebrow}>CURRENT PLAN</Text>
            <Text style={[styles.planTitle, { color: colors.chromeFg }]}>{planLabel}</Text>
            <Text style={styles.planSub}>{planSub}</Text>
          </View>
          <TouchableOpacity
            style={[styles.planBtn, { backgroundColor: colors.chromeFg }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Pricing')}
            accessibilityRole="button"
            accessibilityLabel="See plans"
          >
            <Text style={[styles.planBtnText, { color: colors.chromeBg }]}>See plans</Text>
          </TouchableOpacity>
        </View>

        <HandlerRatingPrompt userId={user?.id} />

        <View style={{ height: 22 }} />
        <RowGroup>
          <Row Icon={Bookmark} label="Saved posts" onPress={() => openInHomeStack(navigation, 'SavedPosts')} />
          <Row Icon={Radio} label="Live archive" sub="Your Live moments, private to you" onPress={() => openInHomeStack(navigation, 'LiveArchive')} />
          <Row Icon={Eye} label="Directory profile" value={discoverable ? 'Visible' : 'Hidden'} onPress={() => setDirectoryVisible(true)} />
          <Row Icon={Gift} label="Invite friends" value={invited > 0 ? `${invited} joined` : undefined} onPress={handleInvite} />
          <Row Icon={Shield} label="Settings" sub="Account, privacy, appearance" onPress={() => navigation.navigate('Settings')} last />
        </RowGroup>
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        userId={user?.id}
        currentName={displayName}
        currentAvatar={profileAvatar}
        onClose={updates => {
          setEditVisible(false)
          if (updates?.avatarUrl) setProfileAvatar(updates.avatarUrl)
        }}
      />
      <DirectoryProfileModal visible={directoryVisible} onClose={() => setDirectoryVisible(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 40, borderRadius: 14, marginBottom: 2 },
  editText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  avatarRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 72, height: 72 },
  initials: { fontFamily: fonts.serif, fontSize: 28 },
  name: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 32 },
  subLine: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginTop: 8, maxWidth: '100%' },
  badgeText: { fontFamily: fonts.sansSemiBold, fontSize: 13, flexShrink: 1 },
  stats: { flexDirection: 'row', marginHorizontal: 16, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 32 },
  statLabel: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 2, textAlign: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 16, borderRadius: radius.card, padding: 18 },
  planEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: 'rgba(245,240,232,0.65)' },
  planTitle: { fontFamily: fonts.serif, fontSize: 26, marginTop: 4 },
  planSub: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: 'rgba(245,240,232,0.8)', marginTop: 4 },
  planBtn: { paddingHorizontal: 16, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})
