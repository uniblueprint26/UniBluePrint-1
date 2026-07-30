import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  User, GraduationCap, Users, HelpCircle, Info,
  Bell, Lock, LifeBuoy, LogOut, ChevronRight,
  Star, Award, FileText,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

const STATS = [
  { value: '3',  label: 'CVs Submitted' },
  { value: '1',  label: 'Session Booked' },
  { value: '12', label: 'Notes Saved' },
]

export default function MoreScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const university = user?.user_metadata?.university || 'Your University'
  const course = user?.user_metadata?.course || ''

  const QUICK_LINKS = [
    { icon: Users,    label: 'Our Coaches',        sub: 'Browse all verified Uni Coaches',    color: '#EFF6FF', screen: null },
    { icon: Award,    label: 'Become a Coach',     sub: 'Apply to join the coaching panel',   color: '#F0FDF4', screen: null },
    { icon: HelpCircle, label: 'FAQs',             sub: 'Common questions answered',          color: '#FFF7ED', screen: 'FAQs' },
    { icon: Info,     label: 'About UniBlueprint', sub: 'Our mission and how it works',       color: '#FDF4FF', screen: 'About' },
  ]

  const ACCOUNT_LINKS = [
    { icon: Bell,     label: 'Notifications',  sub: 'Manage your alerts and reminders', screen: null },
    { icon: Lock,     label: 'Privacy',        sub: 'Control your data and visibility',  screen: null },
    { icon: LifeBuoy, label: 'Help & Support', sub: 'Get help from the team',            screen: 'Help' },
  ]

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try {
            await signOut()
          } catch (err) {
            Alert.alert('Error', 'Could not sign out. Please try again.')
          } finally {
            setSigningOut(false)
          }
        },
      },
    ])
  }

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <User size={36} color={colors.light} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.profileBadgeRow}>
              <GraduationCap size={13} color="rgba(245,240,232,0.7)" />
              <Text style={styles.profileUni} numberOfLines={1}>
                {university}{course ? ` · ${course}` : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Membership badge */}
        <View style={styles.membershipCard}>
          <Star size={16} color="#F59E0B" fill="#F59E0B" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.membershipTitle}>Free Member</Text>
            <Text style={styles.membershipSub}>Upgrade to unlock priority coach access and premium document services</Text>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8}>
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>EXPLORE</Text>
          <View style={{ gap: 12 }}>
            {QUICK_LINKS.map(({ icon: Icon, label, sub, color, screen }) => (
              <TouchableOpacity
                key={label}
                activeOpacity={0.8}
                onPress={() => screen && navigation.navigate(screen)}
              >
                <Card style={styles.linkCard}>
                  <View style={[styles.linkIcon, { backgroundColor: color }]}>
                    <Icon size={20} color={colors.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linkLabel}>{label}</Text>
                    <Text style={styles.linkSub}>{sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.light} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>RECENT ACTIVITY</Text>
          <Card>
            {[
              { title: 'CV Review — In Review', time: '2 hours ago', dot: '#F59E0B' },
              { title: 'Cover Letter — Delivered', time: 'Yesterday', dot: colors.success },
              { title: 'Coaching Session Confirmed', time: '2 days ago', dot: colors.navy },
            ].map(({ title, time, dot }, i, arr) => (
              <View key={title} style={[styles.actRow, i < arr.length - 1 && styles.actDivider]}>
                <View style={[styles.actDot, { backgroundColor: dot }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>{title}</Text>
                  <Text style={styles.actTime}>{time}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ACCOUNT</Text>
          <Card style={{ padding: 0 }}>
            {ACCOUNT_LINKS.map(({ icon: Icon, label, sub, screen }, i, arr) => (
              <TouchableOpacity
                key={label}
                activeOpacity={0.75}
                style={[styles.settingsRow, i < arr.length - 1 && styles.actDivider]}
                onPress={() => screen && navigation.navigate(screen)}
              >
                <View style={styles.settingsIcon}>
                  <Icon size={18} color={colors.navy} />
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
            <LogOut size={16} color='#DC2626' />
            <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>UniBlueprint · v1.0.0</Text>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 48 },

  profileCard: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(245,240,232,0.12)',
    borderWidth: 2, borderColor: 'rgba(245,240,232,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },
  profileBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  profileUni: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.65)', flex: 1 },
  editBtn: {
    backgroundColor: 'rgba(245,240,232,0.12)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.25)',
    paddingHorizontal: 14, paddingVertical: 7,
  },
  editBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.cream },

  statsRow: {
    flexDirection: 'row', backgroundColor: colors.white,
    marginHorizontal: spacing.md, marginTop: -1,
    borderRadius: 12, ...shadows.card,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(30,58,95,0.08)' },
  statValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  statLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },

  membershipCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 12,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    padding: 14, borderWidth: 1, borderColor: '#FDE68A',
  },
  membershipTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  membershipSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 16 },
  upgradeBtn: {
    backgroundColor: colors.navy, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  upgradeBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.cream },

  section: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },

  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  linkIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  linkLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  linkSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
  actDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  actDot: { width: 8, height: 8, borderRadius: 4 },
  actTitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  actTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  settingsIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingsLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  settingsSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: 12,
    height: 50, backgroundColor: '#FEF2F2',
  },
  signOutText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#DC2626' },

  versionText: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.light,
    textAlign: 'center', marginTop: spacing.lg,
  },
})
