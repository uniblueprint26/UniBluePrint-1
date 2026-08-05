import { useState, useEffect } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  User, GraduationCap, Users, HelpCircle, Info,
  Bell, Lock, LifeBuoy, LogOut, ChevronRight,
  Star, FileText, Calendar, BookOpen,
} from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

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
  { Icon: Lock,     label: 'Privacy',          sub: 'Control your data and visibility',  screen: null },
  { Icon: LifeBuoy, label: 'Help and Support', sub: 'Get help from the team',            screen: 'Help' },
]

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [stats, setStats] = useState({ cvs: 0, sessions: 0, notes: 0 })

  const displayName      = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
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
        screen: 'Blueprint', params: { initialTab: 'Elevation' },
      })
    } else if (link.action === 'become_coach') {
      Linking.openURL('mailto:hello@uniblueprint.ie?subject=Become a Coach Application')
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
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
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
            onPress={() => Alert.alert(
              'Edit Profile',
              'Profile editing is coming soon. You will be able to update your name, university, course, and photo here.',
              [{ text: 'Got it' }]
            )}
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
            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.membershipSub}>
            Upgrade to unlock priority coach access and premium document services.
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
    marginBottom: 14,
  },
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
    flexDirection: 'row', backgroundColor: colors.white,
    marginHorizontal: spacing.md, marginTop: -1,
    borderRadius: radius.card, ...shadows.card,
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
