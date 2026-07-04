import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { FileText, Target, Award, Linkedin, User, MapPin, ChevronRight, Clock } from 'lucide-react-native'
import Svg, { Path, Polygon } from 'react-native-svg'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Foundation Blueprint data ───────────────────────────────────────────────
const FOUNDATION_SERVICES = [
  {
    icon: FileText,
    title: 'CV Writing',
    sub: 'Stand-out CVs tailored to your role and industry',
    standard: '€25',
    premium: '€45',
    turnaround: '48 hrs',
    color: '#EFF6FF',
    tag: 'Most Popular',
  },
  {
    icon: FileText,
    title: 'Cover Letter Writing',
    sub: 'Tailored letters that complement every application',
    standard: '€15',
    premium: '€30',
    turnaround: '24 hrs',
    color: '#F0FDF4',
    tag: null,
  },
  {
    icon: Award,
    title: 'Personal Statement',
    sub: 'CAO, postgrad & scholarship applications done right',
    standard: '€30',
    premium: '€60',
    turnaround: '72 hrs',
    color: '#FFF7ED',
    tag: null,
  },
  {
    icon: Linkedin,
    title: 'LinkedIn Optimisation',
    sub: 'Turn your profile into a recruiter magnet',
    standard: '€20',
    premium: '€40',
    turnaround: '48 hrs',
    color: '#EEF2FF',
    tag: null,
  },
]

// ─── Elevation Blueprint data ─────────────────────────────────────────────────
const FILTER_PILLS = ['All', 'Mentorship', 'Fitness', 'Branding', 'Portfolio', 'Pitch', 'Network', 'Postgrad']

const COACHES = [
  {
    id: 1, name: 'Uni Coach', category: 'Fitness Coaching', filter: 'Fitness',
    location: 'Dublin', rating: '4.9', reviews: 18, from: 'Pricing TBC',
    services: ['Training Plans', 'Nutrition Basics', 'Form Coaching'],
    bio: 'Certified personal trainer helping students build sustainable fitness habits around college life.',
  },
  {
    id: 2, name: 'Uni Coach', category: 'Personal Branding', filter: 'Branding',
    location: 'Dublin', rating: '4.8', reviews: 23, from: 'From €40',
    services: ['LinkedIn Optimisation', 'Brand Strategy', 'Online Presence'],
    bio: 'Marketing professional specialising in building authentic personal brands for graduates.',
  },
  {
    id: 3, name: 'Uni Coach', category: 'Mentorship', filter: 'Mentorship',
    location: 'Limerick', rating: '5.0', reviews: 31, from: 'From €20',
    services: ['Career Guidance', 'Session Prep', 'Goal Setting'],
    bio: 'Senior professional with 10+ years mentoring students into top graduate roles across Ireland.',
  },
  {
    id: 4, name: 'Uni Coach', category: 'Portfolio Building', filter: 'Portfolio',
    location: 'Dublin', rating: '4.7', reviews: 14, from: 'From €30',
    services: ['Portfolio Strategy', 'Case Study Frameworks', 'Design Review'],
    bio: 'UX designer and creative director helping students build portfolios that get interviews.',
  },
  {
    id: 5, name: 'Uni Coach', category: 'Pitch Coaching', filter: 'Pitch',
    location: 'Cork', rating: '4.9', reviews: 27, from: 'From €25',
    services: ['Pitch Feedback', 'Live Rehearsal', 'Q&A Prep'],
    bio: 'Former startup founder and pitch competition judge coaching students to communicate with confidence.',
  },
  {
    id: 6, name: 'Uni Coach', category: 'Network Assistance', filter: 'Network',
    location: 'Galway', rating: '4.6', reviews: 11, from: 'From €30',
    services: ['Outreach Templates', 'Network Audit', 'LinkedIn Connections'],
    bio: 'Talent acquisition specialist helping students build genuine professional networks from day one.',
  },
  {
    id: 7, name: 'Uni Coach', category: 'Postgrad Support', filter: 'Postgrad',
    location: 'Dublin', rating: '4.8', reviews: 19, from: 'From €30',
    services: ['Personal Statement', 'Programme Research', 'Interview Prep'],
    bio: 'Academic advisor with experience guiding students into top postgrad programmes across Europe.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function FoundationTab() {
  const [selected, setSelected] = useState(null)

  return (
    <View>
      {/* Stats banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2,400+</Text>
          <Text style={styles.statLabel}>Documents Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>24 hrs</Text>
          <Text style={styles.statLabel}>Fastest Turnaround</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.9★</Text>
          <Text style={styles.statLabel}>Avg. Rating</Text>
        </View>
      </View>

      <View style={{ gap: 14, marginTop: spacing.lg }}>
        {FOUNDATION_SERVICES.map(({ icon: Icon, title, sub, standard, premium, turnaround, color, tag }) => (
          <TouchableOpacity
            key={title}
            activeOpacity={0.88}
            onPress={() => setSelected(selected === title ? null : title)}
          >
            <Card style={[styles.serviceCard, selected === title && styles.serviceCardActive]}>
              <View style={styles.serviceCardTop}>
                <View style={[styles.serviceIcon, { backgroundColor: color }]}>
                  <Icon size={20} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.serviceTitle}>{title}</Text>
                    {tag && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>{tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.serviceSub}>{sub}</Text>
                </View>
                <ChevronRight
                  size={16}
                  color={colors.light}
                  style={{ transform: [{ rotate: selected === title ? '90deg' : '0deg' }] }}
                />
              </View>

              {selected === title && (
                <View style={styles.serviceExpanded}>
                  <View style={styles.pricingRow}>
                    <View style={styles.priceBox}>
                      <Text style={styles.priceBoxLabel}>Standard</Text>
                      <Text style={styles.priceBoxValue}>{standard}</Text>
                      <Text style={styles.priceBoxSub}>Core service</Text>
                    </View>
                    <View style={[styles.priceBox, styles.priceBoxPremium]}>
                      <Text style={[styles.priceBoxLabel, { color: colors.cream }]}>Premium</Text>
                      <Text style={[styles.priceBoxValue, { color: colors.cream }]}>{premium}</Text>
                      <Text style={[styles.priceBoxSub, { color: 'rgba(245,240,232,0.7)' }]}>Priority + revisions</Text>
                    </View>
                  </View>
                  <View style={styles.turnaroundRow}>
                    <Clock size={13} color={colors.muted} />
                    <Text style={styles.turnaroundText}>Typical turnaround: {turnaround}</Text>
                  </View>
                  <TouchableOpacity style={styles.orderBtn} activeOpacity={0.8}>
                    <Text style={styles.orderBtnText}>Order {title} →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>Submit a Request</Text>
      </TouchableOpacity>
    </View>
  )
}

function ElevationTab() {
  const [active, setActive] = useState('All')
  const visible = active === 'All' ? COACHES : COACHES.filter(c => c.filter === active)

  return (
    <View>
      {/* Filter pills — pinned at top */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 4 }}
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

      {/* Results count */}
      <Text style={styles.resultsCount}>{visible.length} coach{visible.length !== 1 ? 'es' : ''} available</Text>

      {/* Coach profile cards */}
      <View style={{ gap: 16, marginTop: spacing.sm }}>
        {visible.map(coach => (
          <Card key={coach.id} style={styles.coachCard}>
            {/* Top row: avatar + name + badge */}
            <View style={styles.coachTop}>
              <View style={styles.coachAvatarWrap}>
                <View style={styles.coachAvatar}>
                  <User size={28} color={colors.light} />
                </View>
                <View style={styles.coachOnlineDot} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={styles.coachName}>{coach.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <MapPin size={12} color={colors.muted} />
                      <Text style={styles.coachLocation}>{coach.location}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{coach.category}</Text>
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  <Svg width={13} height={13} viewBox="0 0 24 24">
                    <Polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#F59E0B" stroke="#F59E0B" strokeWidth={1} />
                  </Svg>
                  <Text style={styles.ratingText}>{coach.rating}</Text>
                  <Text style={styles.ratingCount}>({coach.reviews} reviews)</Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            <Text style={styles.coachBio}>{coach.bio}</Text>

            {/* Service pills */}
            <View style={styles.servicePills}>
              {coach.services.map(s => (
                <View key={s} style={styles.servicePill}>
                  <Text style={styles.servicePillText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Footer: price + CTA */}
            <View style={styles.coachFooter}>
              <View>
                <Text style={styles.fromLabel}>Starting from</Text>
                <Text style={styles.fromPrice}>{coach.from}</Text>
              </View>
              <TouchableOpacity style={styles.profileBtn} activeOpacity={0.8}>
                <Text style={styles.profileBtnText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>Book a Coach</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BlueprintScreen() {
  const [tab, setTab] = useState('foundation')

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>SERVICES</Text>
          <Text style={styles.heroTitle}>Blueprint Services</Text>
          <Text style={styles.heroSub}>
            Professional documents and verified coaching — built around Irish student life.
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'foundation' && styles.tabBtnActive]}
            onPress={() => setTab('foundation')}
          >
            <FileText size={15} color={tab === 'foundation' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'foundation' && styles.tabBtnTextActive]}>Foundation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'elevation' && styles.tabBtnActive]}
            onPress={() => setTab('elevation')}
          >
            <Target size={15} color={tab === 'elevation' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'elevation' && styles.tabBtnTextActive]}>Elevation</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {tab === 'foundation' ? (
            <>
              <SectionHeader eyebrow="Foundation Blueprint" title="Professional Documents" />
              <FoundationTab />
            </>
          ) : (
            <>
              <SectionHeader eyebrow="Elevation Blueprint" title="Our Coaches" />
              <ElevationTab />
            </>
          )}
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 48 },

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  tabRow: {
    flexDirection: 'row', backgroundColor: colors.white,
    padding: 5, marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, gap: 5, ...shadows.card,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: radius.button,
  },
  tabBtnActive: { backgroundColor: colors.navy },
  tabBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  tabBtnTextActive: { color: colors.white },

  content: { paddingHorizontal: spacing.md, marginTop: spacing.lg },

  // Stats
  statsBanner: {
    flexDirection: 'row', backgroundColor: colors.navy,
    borderRadius: radius.card, padding: spacing.md, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  statLabel: { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(245,240,232,0.15)' },

  // Foundation service cards
  serviceCard: { padding: 16 },
  serviceCardActive: { borderWidth: 1.5, borderColor: colors.navy },
  serviceCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  serviceIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  serviceSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 18 },
  popularBadge: { backgroundColor: '#FFF7ED', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  popularBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: '#C2410C' },

  serviceExpanded: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  pricingRow: { flexDirection: 'row', gap: 10 },
  priceBox: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.button,
    padding: 14, alignItems: 'center',
  },
  priceBoxPremium: { backgroundColor: colors.navy },
  priceBoxLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  priceBoxValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, marginTop: 2 },
  priceBoxSub: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 2 },
  turnaroundRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  turnaroundText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  orderBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  orderBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  primaryBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },

  // Elevation filter pills
  pillScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.white, marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.14)',
  },
  pillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  pillTextActive: { color: colors.cream },

  resultsCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 8 },

  // Coach cards
  coachCard: { padding: 18 },
  coachTop: { flexDirection: 'row' },
  coachAvatarWrap: { position: 'relative' },
  coachAvatar: {
    width: 56, height: 56, borderRadius: radius.circle,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(30,58,95,0.08)',
  },
  coachOnlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#16A34A', borderWidth: 2, borderColor: colors.white,
  },
  coachName: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.navy },
  coachLocation: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  categoryBadge: {
    backgroundColor: colors.navy, borderRadius: radius.badge,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  categoryBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.cream },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  ratingCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  coachBio: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    lineHeight: 20, marginTop: spacing.sm,
  },
  servicePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  servicePill: {
    backgroundColor: colors.cream, borderRadius: radius.badge,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  servicePillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },
  coachFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  fromLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  fromPrice: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.navy, marginTop: 1 },
  profileBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  profileBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
})
