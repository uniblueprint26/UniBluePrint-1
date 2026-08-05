import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ChevronRight, MapPin, User,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Filter pills ─────────────────────────────────────────────────────────────

const FILTER_PILLS = [
  'All', 'Fitness', 'Academic Grinds', 'Trading', 'Branding',
  'Marketing', 'Career', 'Network', 'Creative', 'Sports', 'Yoga', 'Postgrad',
]

// ─── Coaches ──────────────────────────────────────────────────────────────────
// Removed: Shauna Rogers, Ethan Henry, Fayed, Stephen McKeown
// Updated: Milan Piroska, Emanuel Tolic, Jayden Reynolds
// Added: Tadgh Darcy, Eitne Jarrett, Kevin (TrainWitKev), Aoife Keogh

const COACHES = [
  // ── Academic ──
  {
    id: 1, name: 'Emmanuel Fasanmi', category: 'Academic Grinds', filter: 'Academic Grinds',
    location: 'Dublin, Ireland', rating: '4.9', reviews: 24, from: 'Pricing TBC',
    services: ['Maths Grinds', 'Physics Grinds', 'Biology Grinds'],
    bio: 'Emmanuel offers one-to-one and small group grinds in Maths, Physics, and Biology for Leaving Certificate and university students across Dublin. Sessions are structured, focused, and built around where you actually need to improve.',
  },

  // ── Sports ──
  {
    id: 2, name: 'JMC Fitness', category: 'Sports Coaching', filter: 'Sports',
    location: 'North Dublin', rating: '5.0', reviews: 41, from: 'From €50/hr',
    services: ['12-Week Online Plan', 'In-Person Training', 'Football Coaching', 'Analytics Breakdown', 'Dietary Guidance', 'Agent Connections'],
    bio: 'Elite sports coaching offering fully personalised programmes for students serious about performance. In-person sessions on North Dublin 4G Astro. Football coaching and professional agent connections available.',
    pricelist: [
      { label: '12-Week Online Plan', price: '€300' },
      { label: 'In-Person Session (1hr)', price: '€50' },
      { label: 'Analytics Breakdown', price: '€100' },
    ],
  },

  // ── Creative ──
  {
    id: 3, name: 'Nathan Yanzo (Nyz3ditz)', category: 'Photography & Video', filter: 'Creative',
    location: 'Ireland', rating: '4.9', reviews: 19, from: 'From €55/month',
    services: ['Monthly Mentorship', '1-1 Shoot Session', 'Editing Guidance', 'Creative Direction'],
    bio: 'Professional photographer and videographer offering mentorship and shoot sessions. Monthly subscription includes Zoom calls and editing guidance.',
    pricelist: [
      { label: 'Monthly Subscription', price: '€55/month' },
      { label: '1-1 Shoot Session', price: '€90' },
    ],
    contact: { instagram: 'Nyz3ditz', phone: '+353857272875' },
  },

  // ── Trading ──
  {
    id: 4, name: 'Daniel Gough', category: 'Trading & Finance', filter: 'Trading',
    location: 'Ireland', rating: '4.8', reviews: 17, from: 'From €40',
    services: ['Trading Fundamentals', 'Portfolio Strategy', '1-to-1 Sessions'],
    bio: 'Active trader breaking down markets and investment strategy for students starting their financial journey.',
  },

  // ── Fitness ──
  {
    id: 5, name: 'Ali', category: 'Personal Training', filter: 'Fitness',
    location: 'Ireland', rating: '4.9', reviews: 31, from: 'From €35',
    services: ['Personal Training', 'Training Plans', 'Form Coaching'],
    bio: 'Certified personal trainer building strength, fitness, and consistency into student lifestyle.',
  },

  {
    id: 6, name: 'Emanuel Tolic', category: 'Personal Training', filter: 'Fitness',
    location: 'Ireland, open to worldwide', rating: '5.0', reviews: 22, from: 'Via consultation',
    services: ['Online Workout Plans', 'Online Diet Plans', 'Weightlifting Coaching', 'Calisthenics Coaching', 'Free Consultation Call'],
    bio: '20-year-old qualified personal trainer with 5+ years of fitness experience. Specialising in weightlifting and calisthenics — also works with clients in kickboxing and other sports. Provides personalised online workout and diet plans, ensuring every client fully understands why and how to follow their programme. Available in and outside working hours.',
    package: [
      'Full 1-month coaching guide with workout and meal plan',
      'Fully explained and tracked daily',
      '24/7 WhatsApp availability',
      'Weekly progress check-in calls',
    ],
    contact: { instagram: 'emtolic', email: 'etcoaching06@gmail.com', linktree: 'https://linktr.ee/EmanuelPT' },
    pricingNote: 'Pricing discussed during consultation calls and texts.',
  },

  {
    id: 7, name: 'Tadgh Darcy', category: 'Physique Development', filter: 'Fitness',
    location: 'Dublin', from: 'Pricing on request',
    services: ['Tailored Nutrition Plan', 'Custom Training Programme', 'Weekly Check-in Videos', 'All-in-One Coaching App', 'Direct Coach Access'],
    bio: "Main goal is to help people regain confidence and build healthy, sustainable habits while enjoying the process. Online physique development coaching built around you.",
    contact: { instagram: 'tdarcycoaching', tiktok: 'darcy.lifts', linktree: 'https://linktr.ee/tadghdarcy123' },
  },

  {
    id: 8, name: 'Milan Piroska (MPFitness)', category: 'Personal Training', filter: 'Fitness',
    location: 'Ireland', from: 'From €40/session',
    title: 'Certified Personal Trainer / Advanced Nutrition Coach / International Men\'s Physique Athlete',
    tagline: 'MPFitness. More Than Fitness.',
    services: ['Physique Development', 'Muscle Gain', 'Fat Loss', 'Nutrition Coaching', 'Lifestyle Transformation', 'Holiday & Contest Prep'],
    bio: 'Specialising in Physique and Lifestyle Transformations via Fat Loss and Lean Muscle Gain. 20+ client transformations. Works with clients on physique development, muscle gain, fat loss, nutrition, lifestyle change, and holiday, photoshoot, and contest prep.',
    quote: 'Guarantee of achieving your true potential through proven systems and methodologies with personalised training solutions to fit your lifestyle, goals and preferences. Crafted with precision and backed by results.',
    pricelist: [
      { label: '1x per week', price: '€50/session' },
      { label: '2x per week', price: '€45/session' },
      { label: '3x per week', price: '€40/session' },
      { label: 'One-time session', price: '€60' },
    ],
    package: [
      'Online training and nutrition programmes',
      'Online tracking tools',
      '24/7 WhatsApp support',
      'Frequent check-ins',
    ],
    contact: { instagram: 'milanpir_fitness', phone: '0857633757', email: 'milanpirfitness@gmail.com' },
    pricingNote: 'Available in 8, 10, or 12-week blocks. Payable in 2 instalments or in full. Pricing pending final sign-off.',
  },

  {
    id: 9, name: 'Kevin (TrainWitKev)', category: 'Personal Training', filter: 'Fitness',
    location: 'Dublin, Ireland', from: 'From €25',
    tagline: 'Strength. Physique. Confidence. Mindset.',
    services: ['1-to-1 Personal Training', 'Beginner Gym Coaching', 'Personalised Training Programmes', 'Accountability & Progress Coaching'],
    bio: 'Coach behind TrainWitKev and the mindset behind WORKSYY. Helps people get stronger, build a physique they are proud of, and gain real confidence in and out of the gym. Suits complete beginners through to people who have plateaued on consistency or progress. Focus on structure, technique, understanding, and sustainable progress.',
    quote: 'A mad yoke with something to prove. — WORKSYY',
    pricelist: [
      { label: '1-to-1 PT: Single session', price: '€25' },
      { label: '1-to-1 PT: 4 sessions', price: '€90' },
      { label: '1-to-1 PT: 8 sessions', price: '€170' },
      { label: 'Personalised Training Programme', price: '€25' },
      { label: 'Initial consultation', price: 'Free' },
    ],
    bookingNote: 'Booking currently being set up. Get in touch directly to enquire.',
    pricingNote: 'Currently coaching clients as part of building experience and client base. Testimonials available on request.',
  },

  // ── Marketing / Branding ──
  {
    id: 10, name: 'Alex Leva', category: 'Digital Marketing', filter: 'Marketing',
    location: 'Ireland', rating: '4.9', reviews: 35, from: 'From €40',
    services: ['Social Media Strategy', 'Content Creation', 'Brand Building'],
    bio: 'Digital marketing specialist helping students and early-stage founders grow their presence online.',
  },

  {
    id: 11, name: 'Nikola Jurek', category: 'Personal Branding', filter: 'Branding',
    location: 'Ireland', rating: '4.8', reviews: 21, from: 'From €40',
    services: ['LinkedIn Optimisation', 'Brand Strategy', 'Online Presence'],
    bio: 'Personal branding coach helping students define and communicate their professional identity with confidence.',
  },

  // ── Health & Fitness ──
  {
    id: 12, name: 'Jayden Reynolds', category: 'Health & Fitness Coaching', filter: 'Fitness',
    location: 'County Sligo', rating: '4.8', reviews: 18, from: 'On request',
    services: ['1-1 Online Coaching', 'Tailored Fitness Plans', 'Nutritional Guidance', 'Regular Check-ins', 'Nutrition Journal', 'Local In-Person Coaching'],
    bio: 'Qualified Personal Trainer with over a decade of experience. Passionate about helping people balance school, work, fitness, sport, and social life. League of Ireland player. Available for both online and local in-person coaching in County Sligo.',
    contact: { instagram: 'JayRfitness6', tiktok: 'JayRfitness6' },
  },

  // ── Yoga ──
  {
    id: 13, name: 'Aoife Keogh', category: 'Yoga', filter: 'Yoga',
    location: 'Dublin', from: 'Coming soon',
    shell: true,
    shellMessage: 'Full profile and booking details coming soon.',
  },

  // ── Career / Counselling ──
  {
    id: 14, name: 'Eitne Jarrett', category: 'Careers & Counselling', filter: 'Career',
    location: 'Ireland', from: 'Coming soon',
    shell: true,
    shellMessage: 'Full profile and session details coming soon.',
  },
]

// ─── Groups (used when filter = All) ─────────────────────────────────────────

const GROUPS = [
  { label: 'Fitness & Physique',   filters: ['Fitness']                    },
  { label: 'Sports Coaching',       filters: ['Sports']                     },
  { label: 'Academic Grinds',       filters: ['Academic Grinds']            },
  { label: 'Trading & Finance',     filters: ['Trading']                    },
  { label: 'Marketing & Branding',  filters: ['Marketing', 'Branding']      },
  { label: 'Creative',              filters: ['Creative']                   },
  { label: 'Yoga',                  filters: ['Yoga']                       },
  { label: 'Careers & Counselling', filters: ['Career']                     },
]

// ─── Coach Card ───────────────────────────────────────────────────────────────

function CoachCard({ coach, navigation }) {
  function handlePress() {
    navigation.navigate('CoachProfile', { coach })
  }

  if (coach.shell) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={handlePress}>
        <Card style={styles.coachCard}>
          <View style={styles.coachTop}>
            <View style={styles.coachAvatarWrap}>
              <View style={[styles.coachAvatar, { backgroundColor: '#F5F0E8' }]}>
                <User size={26} color={colors.light} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.coachName}>{coach.name}</Text>
              <Text style={styles.coachCategory}>{coach.category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <MapPin size={11} color={colors.muted} />
                <Text style={styles.coachLocation}>{coach.location}</Text>
              </View>
            </View>
            <View style={styles.shellBadge}>
              <Text style={styles.shellBadgeText}>Coming Soon</Text>
            </View>
          </View>
          <Text style={styles.shellMessage}>{coach.shellMessage}</Text>
          <View style={styles.coachFooter}>
            <View>
              <Text style={styles.fromLabel}>Starting from</Text>
              <Text style={styles.fromPrice}>{coach.from}</Text>
            </View>
            <View style={styles.profileBtnMuted}>
              <Text style={styles.profileBtnMutedText}>View Profile</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={handlePress}>
      <Card style={styles.coachCard}>
        {/* Header */}
        <View style={styles.coachTop}>
          <View style={styles.coachAvatarWrap}>
            <View style={styles.coachAvatar}>
              <User size={26} color={colors.light} />
            </View>
            <View style={styles.coachOnlineDot} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.coachName}>{coach.name}</Text>
            {coach.title && (
              <Text style={styles.coachTitle} numberOfLines={2}>{coach.title}</Text>
            )}
            <Text style={styles.coachCategory}>{coach.category}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <MapPin size={11} color={colors.muted} />
              <Text style={styles.coachLocation}>{coach.location}</Text>
            </View>
            {coach.rating && (
              <View style={styles.ratingRow}>
                <Text style={{ fontSize: 12, color: '#F59E0B' }}>★</Text>
                <Text style={styles.ratingText}>{coach.rating}</Text>
                <Text style={styles.ratingCount}>({coach.reviews} reviews)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tagline */}
        {coach.tagline && (
          <Text style={styles.coachTagline}>{coach.tagline}</Text>
        )}

        {/* Bio — preview, 3 lines max */}
        <Text style={styles.coachBio} numberOfLines={3}>{coach.bio}</Text>

        {/* Service pills — first 3 + overflow count */}
        <View style={styles.servicePills}>
          {coach.services.slice(0, 3).map(s => (
            <View key={s} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{s}</Text>
            </View>
          ))}
          {coach.services.length > 3 && (
            <View style={[styles.servicePill, { backgroundColor: 'rgba(30,58,95,0.06)' }]}>
              <Text style={styles.servicePillText}>+{coach.services.length - 3} more</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.coachFooter}>
          <View>
            <Text style={styles.fromLabel}>Starting from</Text>
            <Text style={styles.fromPrice}>{coach.from}</Text>
          </View>
          <View style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>View Profile</Text>
            <ChevronRight size={13} color={colors.cream} strokeWidth={2.5} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

// ─── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({ label, count, first }) {
  return (
    <View style={[styles.groupHeader, first && { marginTop: 8 }]}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupCountBadge}>
        <Text style={styles.groupCountText}>{count}</Text>
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ElevationScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [active, setActive] = useState('All')

  const visible = active === 'All' ? COACHES : COACHES.filter(c => c.filter === active)

  const academicBanner = (
    <View style={styles.academicBanner}>
      <View style={styles.academicBannerLeft}>
        <View style={styles.newBadgeInline}>
          <Text style={styles.newBadgeInlineText}>NEW</Text>
        </View>
        <Text style={styles.academicBannerTitle}>Academic Grinds</Text>
      </View>
      <Text style={styles.academicBannerSub}>
        One-to-one Leaving Cert and university grinds now available through Elevation Blueprint.
      </Text>
    </View>
  )

  return (
    <View style={styles.screen}>

      {/* ── Integrated header + hero (single navy block) ── */}
      <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Home</Text>
          </TouchableOpacity>
          <UBPLogo height={30} color={colors.cream} />
          {/* Spacer to balance the back button */}
          <View style={{ width: 70 }} />
        </View>

        <Text style={styles.heroEyebrow}>ELEVATION BLUEPRINT</Text>
        <Text style={styles.heroTitle}>Our Coaches</Text>
        <Text style={styles.heroSub}>
          Verified coaches across fitness, sports, academic grinds, trading, and careers.
          Every coach is reviewed before joining the platform.
        </Text>

        {/* Filter pills — inside hero so they visually anchor to the navy header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.pillRow}
        >
          {FILTER_PILLS.map(label => (
            <TouchableOpacity
              key={label}
              onPress={() => setActive(label)}
              style={[styles.pill, active === label && styles.pillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active === label && styles.pillTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>

          <Text style={styles.resultsCount}>
            {visible.length} coach{visible.length !== 1 ? 'es' : ''} available
          </Text>

          {/* Academic banner for filtered view */}
          {active === 'Academic Grinds' && academicBanner}

          <View style={{ marginTop: spacing.sm }}>
            {active === 'All' ? (
              /* Grouped view */
              GROUPS.map((group, gi) => {
                const groupCoaches = COACHES.filter(c => group.filters.includes(c.filter))
                if (groupCoaches.length === 0) return null
                return (
                  <View key={group.label}>
                    {/* Academic banner inline before its group */}
                    {group.label === 'Academic Grinds' && academicBanner}
                    <GroupHeader label={group.label} count={groupCoaches.length} first={gi === 0} />
                    <View style={{ gap: 12, marginBottom: 4 }}>
                      {groupCoaches.map(coach => (
                        <CoachCard key={coach.id} coach={coach} navigation={navigation} />
                      ))}
                    </View>
                  </View>
                )
              })
            ) : (
              /* Flat filtered view */
              <View style={{ gap: 12 }}>
                {visible.map(coach => (
                  <CoachCard key={coach.id} coach={coach} navigation={navigation} />
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Book a Coach</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Integrated header + hero
  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingRight: 10,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },

  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginBottom: 10 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22, marginBottom: spacing.md },

  // Filter pills live inside the navy hero
  pillScroll: { marginHorizontal: -spacing.md },
  pillRow:    { paddingHorizontal: spacing.md, paddingBottom: 16, gap: 8 },
  pill:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(245,240,232,0.12)', marginRight: 0, borderWidth: 1, borderColor: 'rgba(245,240,232,0.18)' },
  pillActive:     { backgroundColor: colors.cream, borderColor: colors.cream },
  pillText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: 'rgba(245,240,232,0.7)' },
  pillTextActive: { color: colors.navy },

  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  resultsCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginBottom: 4 },

  academicBanner:     { backgroundColor: '#FEF9C3', borderRadius: radius.card, padding: 14, marginTop: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  academicBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  academicBannerTitle:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  academicBannerSub:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },
  newBadgeInline:     { backgroundColor: '#7C3AED', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeInlineText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5 },

  // Group headers
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(30,58,95,0.05)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    borderLeftWidth: 3, borderLeftColor: colors.navy,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 12, marginTop: spacing.xl,
  },
  groupLabel:      { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  groupCountBadge: { backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  groupCountText:  { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },

  // Coach cards
  coachCard:       { padding: 18, marginBottom: 0 },
  coachTop:        { flexDirection: 'row' },
  coachAvatarWrap: { position: 'relative' },
  coachAvatar:     { width: 52, height: 52, borderRadius: radius.circle, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.08)' },
  coachOnlineDot:  { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#16A34A', borderWidth: 2, borderColor: colors.white },

  coachName:     { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  coachTitle:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, lineHeight: 16, marginTop: 2 },
  coachCategory: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, opacity: 0.65, marginTop: 2 },
  coachLocation: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  coachTagline:  { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, marginTop: 10, fontStyle: 'italic' },
  coachBio:      { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 10 },

  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  ratingText:  { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },
  ratingCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  servicePills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  servicePill:    { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  servicePillText:{ fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

  // Footer
  coachFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  fromLabel:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  fromPrice:   { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginTop: 1 },
  profileBtn:        { backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  profileBtnText:    { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
  profileBtnMuted:   { backgroundColor: colors.cream, borderRadius: radius.button, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  profileBtnMutedText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted },

  // Shell card
  shellBadge:     { backgroundColor: 'rgba(30,58,95,0.07)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  shellBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted },
  shellMessage:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12, fontStyle: 'italic' },

  primaryBtn:     { backgroundColor: colors.navy, borderRadius: radius.button, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
