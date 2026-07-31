import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import UBPLogo from '../components/ui/UBPLogo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FileText, Target, Users, Heart, Zap, ChevronRight, Bell, User } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

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
  { brand: 'Whip Wizardz',    discount: 'Student Deal',       color: '#EFF6FF', logo: require('../../assets/whip-wizardz-logo.png.png'), initials: 'WW', initBg: '#1E3A5F' },
  { brand: 'JMC Fitness',     discount: 'Student Rate',       color: '#F0FDF4', logo: require('../../assets/jmc-fitness-logo.png.jpeg'), initials: 'JMC', initBg: '#15803D' },
  { brand: 'Energie Fitness', discount: '€37.99/month',       color: '#F0F9FF', logo: require('../../assets/energie-fitness-logo.png.jpeg'), initials: 'EF', initBg: '#0369A1' },
  { brand: 'Nyz3ditz',        discount: 'From €55/month',     color: '#FFF7ED', logo: require('../../assets/nyz3ditz-logo.png.jpeg'), initials: 'N3', initBg: '#C2410C' },
  { brand: 'The Nail Nurse',  discount: 'Student Rate',       color: '#FDF4FF', logo: null, initials: 'TNN', initBg: '#B8860B' },
  { brand: 'Emmanuel',        discount: 'Pricing TBC',        color: '#FEF9C3', logo: null, initials: 'EF', initBg: '#7C3AED' },
]

// Magazine-style advertisement board — first card is UniBlueprint 50% off
const AD_BOARD = [
  {
    type: 'promo',
    title: '50% Off Your First Service',
    detail: 'September trial — every Foundation Blueprint service at half price. CV, LinkedIn, cover letter and more.',
    tag: 'UniBlueprint',
    color: colors.navy,
    textColor: colors.cream,
    tagBg: 'rgba(245,240,232,0.2)',
    tagText: colors.cream,
    emoji: null,
  },
  {
    type: 'partner',
    title: 'Whip Wizardz — Car Sales & Services',
    detail: 'Vehicle sales, sourcing, inspections, repairs & detailing. Jonesborough, near Dundalk. Book via WhatsApp.',
    tag: 'Automotive',
    color: '#EFF6FF',
    textColor: colors.navy,
    tagBg: 'rgba(30,58,95,0.1)',
    tagText: colors.navy,
    emoji: '🚗',
    logo: null,
  },
  {
    type: 'partner',
    title: 'The Nail Nurse — Nail & Beauty',
    detail: 'Acrylic full sets from €25 · Gel polish from €6 · Galway · Student discount with valid ID. DM @theenailnurse__',
    tag: 'Beauty',
    color: '#FDF4FF',
    textColor: colors.navy,
    tagBg: 'rgba(184,134,11,0.15)',
    tagText: '#92400E',
    emoji: '💅',
    logo: null,
  },
  {
    type: 'partner',
    title: 'JMC Fitness — Elite Sports Coaching',
    detail: '12-week plan €300 · In-person sessions €50/hr · North Dublin 4G Astro · Analytics €100',
    tag: 'Fitness',
    color: '#F0FDF4',
    textColor: colors.navy,
    tagBg: 'rgba(21,128,61,0.12)',
    tagText: '#15803D',
    emoji: '⚽',
    logo: null,
  },
  {
    type: 'partner',
    title: 'Nyz3ditz — Photography & Video',
    detail: 'Monthly mentorship €55/month · 1-1 shoot session €90 · WhatsApp +353 85 7272 875 · @Nyz3ditz',
    tag: 'Creative',
    color: '#FFF7ED',
    textColor: colors.navy,
    tagBg: 'rgba(194,65,12,0.1)',
    tagText: '#C2410C',
    emoji: '📸',
    logo: null,
  },
  {
    type: 'partner',
    title: 'Energie Fitness — Student Membership',
    detail: '€37.99/month (normal €39.99–€44.99) · €15 joining fee · Mon–Fri 6am–10pm · Sat–Sun 9am–5pm',
    tag: 'Gym',
    color: '#F0F9FF',
    textColor: colors.navy,
    tagBg: 'rgba(3,105,161,0.1)',
    tagText: '#0369A1',
    emoji: '🏋️',
    logo: null,
  },
  {
    type: 'app',
    title: 'Find your campus carpool',
    detail: 'Match with students on your route and split the cost every day.',
    tag: 'Campus Connect',
    color: '#FEF9C3',
    textColor: colors.navy,
    tagBg: 'rgba(30,58,95,0.1)',
    tagText: colors.navy,
    emoji: '🚗',
    logo: null,
  },
  {
    type: 'app',
    title: 'Share notes across Ireland',
    detail: '1,200+ notes uploaded by students — search by module and university.',
    tag: 'Course Connect',
    color: '#F5F0E8',
    textColor: colors.navy,
    tagBg: 'rgba(30,58,95,0.1)',
    tagText: colors.navy,
    emoji: '📚',
    logo: null,
  },
]

function DealLogo({ deal }) {
  return (
    <Image
      source={deal.logo}
      style={styles.dealLogoImg}
      resizeMode="contain"
    />
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const university = user?.user_metadata?.university || 'Your University'
  const course = user?.user_metadata?.course || ''

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <UBPLogo height={30} color={colors.cream} />
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
          <Text style={styles.greetingPre}>{greeting},</Text>
          <Text style={styles.greetingName}>{displayName}.</Text>
          <Text style={styles.greetingSub}>{university}{course ? ` · ${course}` : ''}</Text>
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
                  {deal.logo ? (
                    <Image source={deal.logo} style={styles.dealLogoImg} resizeMode="contain" />
                  ) : (
                    <View style={[styles.dealInitial, { backgroundColor: deal.initBg }]}>
                      <Text style={styles.dealInitialText}>{deal.initials}</Text>
                    </View>
                  )}
                  <Text style={styles.dealBrand} numberOfLines={2}>{deal.brand}</Text>
                  <Text style={styles.dealDiscount}>{deal.discount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Advertisement Board — ABOVE Services */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.eyebrow}>Advertisement Board</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAll}>Post an ad →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={{ paddingRight: spacing.md }}
          >
            {AD_BOARD.map((ad, i) => (
              <TouchableOpacity key={i} activeOpacity={0.8}>
                <View style={[styles.adCard, { backgroundColor: ad.color }]}>
                  {/* First card: UBP promo logo */}
                  {ad.type === 'promo' ? (
                    <View style={styles.adPromoLogo}>
                      <UBPLogo height={22} color={ad.textColor} />
                    </View>
                  ) : ad.emoji ? (
                    <Text style={styles.adEmoji}>{ad.emoji}</Text>
                  ) : null}
                  <View style={[styles.adTag, { backgroundColor: ad.tagBg }]}>
                    <Text style={[styles.adTagText, { color: ad.tagText }]}>{ad.tag}</Text>
                  </View>
                  <Text style={[styles.adTitle, { color: ad.textColor }]} numberOfLines={2}>{ad.title}</Text>
                  <Text style={[styles.adDetail, { color: ad.type === 'promo' ? 'rgba(245,240,232,0.75)' : colors.muted }]} numberOfLines={3}>{ad.detail}</Text>
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

  // Deal cards
  dealCard: {
    width: 118, borderRadius: radius.card,
    padding: 14, marginRight: 12, alignItems: 'center',
  },
  dealLogoImg: { width: 52, height: 44, marginBottom: 8 },
  dealInitial: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  dealInitialText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#FFFFFF' },
  dealBrand: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, textAlign: 'center', lineHeight: 16 },
  dealDiscount: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.navy, marginTop: 3, textAlign: 'center' },

  // Magazine-style ad cards
  adCard: {
    width: 260, borderRadius: radius.card,
    padding: 18, marginRight: 12, minHeight: 180,
    justifyContent: 'flex-end',
  },
  adPromoLogo: { marginBottom: 12 },
  adEmoji: { fontSize: 30, marginBottom: 10 },
  adTag: {
    borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8,
  },
  adTagText: { fontFamily: fonts.sansSemiBold, fontSize: 10 },
  adTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 21, marginBottom: 4 },
  adDetail: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17 },

  // Pillar cards
  pillarCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  pillarIcon: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pillarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  pillarSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },

  // Activity
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 14, paddingHorizontal: 16,
  },
  activityDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  activityDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  activityTitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  activityTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
})
