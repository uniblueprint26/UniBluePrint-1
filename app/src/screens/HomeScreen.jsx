import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FileText, Target, Users, Heart, Zap, ChevronRight, Bell, User } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

const QUICK_ACTIONS = [
  { label: 'Submit CV',    icon: FileText },
  { label: 'Book Coach',   icon: Target },
  { label: 'Campus Board', icon: Users },
  { label: 'Deals',        icon: Heart },
  { label: 'My Notes',     icon: Zap },
]

const PILLARS = [
  { label: 'Foundation Blueprint', sub: 'CVs, cover letters, personal statements', icon: FileText, color: '#EFF6FF' },
  { label: 'Elevation Blueprint',  sub: 'Coaching, mentorship, career support',    icon: Target,   color: '#F0FDF4' },
  { label: 'Campus Connect',       sub: 'Boards, events, carpooling, projects',    icon: Users,    color: '#FFF7ED' },
  { label: 'Lifestyle Blueprint',  sub: 'Deals, mental health, budgeting',         icon: Heart,    color: '#FDF4FF' },
  { label: 'Course Connect',       sub: 'Notes, study groups, Q&A, exams',         icon: Zap,      color: '#F0F9FF' },
]

const ACTIVITY = [
  { title: 'CV Review — In Review',      time: '2 hours ago', dot: '#F59E0B' },
  { title: 'Cover Letter — Delivered',   time: 'Yesterday',   dot: '#16A34A' },
  { title: 'Coaching Session Confirmed', time: '2 days ago',  dot: colors.navy },
]

const DEALS = [
  { brand: 'Student Beans', discount: 'Up to 30% off', color: '#EFF6FF' },
  { brand: 'ASOS',          discount: '20% off',        color: '#FDF4FF' },
  { brand: 'Spotify',       discount: '50% off',        color: '#F0FDF4' },
  { brand: 'Deliveroo',     discount: '€5 off first',   color: '#FFF7ED' },
]

export default function HomeScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.topBarLogo}>UniBlueprint</Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Bell size={20} color={colors.cream} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.7}>
            <User size={18} color={colors.navy} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingPre}>Good morning,</Text>
          <Text style={styles.greetingName}>Welcome back.</Text>
          <Text style={styles.greetingSub}>University College Dublin · Business</Text>
        </View>

        {/* Profile completion */}
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Profile completion</Text>
            <Text style={styles.progressPct}>60%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressHint}>Add your course to unlock Campus Connect →</Text>
        </Card>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={{ paddingRight: spacing.md }}
          >
            {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
              <TouchableOpacity key={label} style={styles.chip} activeOpacity={0.7}>
                <View style={styles.chipIconWrap}>
                  <Icon size={15} color={colors.navy} />
                </View>
                <Text style={styles.chipLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured deals */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.eyebrow}>Featured Deals</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={{ paddingRight: spacing.md }}
          >
            {DEALS.map(deal => (
              <TouchableOpacity key={deal.brand} activeOpacity={0.8}>
                <View style={[styles.dealCard, { backgroundColor: deal.color }]}>
                  <View style={styles.dealInitial}>
                    <Text style={styles.dealInitialText}>{deal.brand.charAt(0)}</Text>
                  </View>
                  <Text style={styles.dealBrand} numberOfLines={1}>{deal.brand}</Text>
                  <Text style={styles.dealDiscount}>{deal.discount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>Services</Text>
          <View style={{ gap: 10 }}>
            {PILLARS.map(({ label, sub, icon: Icon, color }) => (
              <TouchableOpacity key={label} activeOpacity={0.8}>
                <Card style={styles.pillarCard}>
                  <View style={[styles.pillarIcon, { backgroundColor: color }]}>
                    <Icon size={20} color={colors.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pillarTitle}>{label}</Text>
                    <Text style={styles.pillarSub} numberOfLines={1}>{sub}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.light} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.eyebrow}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>View all →</Text>
            </TouchableOpacity>
          </View>
          <Card style={{ padding: 0 }}>
            {ACTIVITY.map(({ title, time, dot }, i) => (
              <View
                key={title}
                style={[styles.activityRow, i < ACTIVITY.length - 1 && styles.activityDivider]}
              >
                <View style={[styles.activityDot, { backgroundColor: dot }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{title}</Text>
                  <Text style={styles.activityTime}>{time}</Text>
                </View>
                <ChevronRight size={14} color={colors.light} />
              </View>
            ))}
          </Card>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLogo: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    position: 'relative', width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5, borderColor: colors.navy,
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,240,232,0.25)',
  },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  greeting: { marginBottom: spacing.lg },
  greetingPre: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
  greetingName: { fontFamily: fonts.serif, fontSize: 36, color: colors.navy, marginTop: 2 },
  greetingSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4 },

  progressCard: { marginBottom: spacing.xl, padding: 18 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  progressPct: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  progressTrack: { height: 6, backgroundColor: colors.cream, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.navy, borderRadius: 3 },
  progressHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 8 },

  section: { marginBottom: spacing.xl },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12,
  },
  seeAll: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, marginBottom: 12 },

  rowScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 10, marginRight: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    ...shadows.card,
  },
  chipIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  chipLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },

  dealCard: {
    width: 110, borderRadius: radius.card,
    padding: 14, marginRight: 12, alignItems: 'center',
  },
  dealInitial: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(30,58,95,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  dealInitialText: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy },
  dealBrand: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, textAlign: 'center' },
  dealDiscount: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.navy, marginTop: 3, textAlign: 'center' },

  pillarCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  pillarIcon: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pillarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  pillarSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 14, paddingHorizontal: 16,
  },
  activityDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  activityDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  activityTitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  activityTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
})
