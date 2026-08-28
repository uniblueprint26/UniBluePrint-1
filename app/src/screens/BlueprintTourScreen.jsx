import { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  FileText, Compass, Building2, Heart, BookOpen, ChevronDown, CheckCircle,
} from 'lucide-react-native'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

// Same content as the website's /how-it-works five-pillar section and the
// original tutorial draft — kept in sync manually across all three.
const CARDS = [
  {
    key: 'welcome', tint: colors.cream, accent: colors.navy, Icon: null,
    title: 'Welcome to UniBlueprint', tagline: null,
    body: 'Five tools, one app, built by students trying to get ahead — for students trying to get ahead. This is the two-minute version. Skip it any time and just start exploring.',
    chips: null, features: null,
  },
  {
    key: 'foundation', tint: '#EFF6FF', accent: '#2563EB', Icon: FileText,
    title: 'Foundation Blueprint', tagline: 'Your Profile Builders',
    body: 'Every career document you need — CV, cover letter, LinkedIn, portfolio, application answers, interview prep, personal statements — built with you, then reviewed by a real trained Campus Handler before it ever reaches you. Not AI output. Real, human review.',
    chips: ['CV Builder', 'Cover Letter Builder', 'Portfolio Builder', 'LinkedIn Builder', 'Personal Statement'],
    features: [
      ['CV Builder', 'Structured, ATS-formatted, worded to get past the first screen.'],
      ['Cover Letter Builder', 'Tailored per role — adds to your CV instead of repeating it.'],
      ['LinkedIn Builder', 'Headline, about, experience and skills, optimised to get found.'],
      ['Portfolio Builder', 'Shows your actual work, not just a list of skills.'],
      ['Application Form Builder', 'STAR-method answers for competency and situational questions.'],
      ['Personal Statement', 'Your own words, structured to actually land — CAO, postgrad, or scholarship.'],
      ['Interview Prep', 'Predicted questions, model answers, and a live mock interview on Premium.'],
      ['Turnaround', 'Standard: 48 hours. Premium: 24 hours and first in the queue.'],
    ],
  },
  {
    key: 'elevation', tint: '#F0FDF4', accent: '#16A34A', Icon: Compass,
    title: 'Elevation Blueprint', tagline: 'Verified coaches, one enquiry away',
    body: 'Browse real, verified coaches — fitness, academic grinds, trading, marketing, creative, sports and more. See their profile, message them to enquire. Pricing and booking happen directly between you and them.',
    chips: ['Fitness', 'Academic Grinds', 'Trading', 'Marketing', 'Creative', 'Sports', 'Yoga'],
    features: [
      ['Browse by category', 'Filter the full coach directory to find the right fit.'],
      ['Verified profiles', 'Every coach is checked before they’re listed.'],
      ['Enquire, not book', 'You message the coach directly — UniBlueprint doesn’t process the booking or payment.'],
    ],
  },
  {
    key: 'lifestyle', tint: '#FDF4FF', accent: '#A21CAF', Icon: Heart,
    title: 'Lifestyle Blueprint', tagline: 'Student life, sorted',
    body: 'Real discounts from verified local partners, a mental health and wellbeing support directory, and the money tools most students never get taught — including SUSI and every other real Irish grant worth knowing.',
    chips: ['Health & Fitness', 'Beauty & Grooming', 'Fashion', 'Food & Drink'],
    features: [
      ['Partner deals', 'Verified local businesses, real student discounts.'],
      ['Support directory', 'Categorised mental health and wellbeing resources, Irish and verified.'],
      ['Budget Calculator', 'Plan rent, food, transport and more against what you actually have.'],
      ['Grants & Schemes', 'SUSI plus every other real Irish student grant, with eligibility and how to apply.'],
    ],
  },
  {
    key: 'campus', tint: '#FFF7ED', accent: '#C2660B', Icon: Building2,
    title: 'Campus Connect', tagline: 'Your own college, in one place',
    body: 'Everything happening at your own college specifically — organised into boards — plus carpooling, campus events, and finding people on your course to work on projects with.',
    chips: ['Campus Boards', 'Carpooling', 'Campus Events', 'Project Collaboration'],
    features: [
      ['Accommodation', 'Rooms, sublets and housing posted by other students at your college.'],
      ['Marketplace', 'Buy, sell, swap — textbooks, gear, whatever’s going.'],
      ['Lost & Found', 'Report or claim something that went missing.'],
      ['Societies', 'Find and connect with student societies.'],
      ['Opportunities', 'Part-time roles, internships, one-off gigs.'],
      ['Student Ads', 'Local student-run businesses and side hustles.'],
    ],
  },
  {
    key: 'course', tint: '#F0F9FF', accent: '#0369A1', Icon: BookOpen,
    title: 'Course Connect', tagline: 'Cross-Ireland student network',
    body: 'A networking board that spans every Irish college and university, not just your own — connect with students and grads anywhere in the country, read honest college reviews, and tap into the shared academic resources that go with it: notes, study groups, and module-specific help.',
    chips: ['Graduate Network', 'College Reviews', 'Notes Exchange', 'Study Groups'],
    features: [
      ['Graduate Network', 'Connect with students and graduates across every Irish institution, not just yours.'],
      ['College Reviews', 'Honest reviews from students who’ve actually been there — any college, any course.'],
      ['Notes Exchange', 'Shared notes by module code, searchable across universities.'],
      ['Study Groups', 'Find or start a group for your module.'],
      ['Module Q&A', 'Ask something specific, get an answer from someone who’s done it.'],
      ['Exam Resources', 'Past papers, summaries, and revision material.'],
    ],
  },
  {
    key: 'done', tint: colors.cream, accent: colors.navy, Icon: CheckCircle,
    title: 'You’re set', tagline: null,
    body: 'That’s the whole map. Come back to this any time from Profile → How UniBlueprint Works — nothing here is a one-time thing.',
    chips: null, features: null,
  },
]

export const TOUR_SEEN_KEY_PREFIX = 'btb_tour_seen_'

function TourCard({ item, width }) {
  const [expanded, setExpanded] = useState(false)
  const { Icon } = item

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.cardContent}
      showsVerticalScrollIndicator={false}
    >
      {Icon && (
        <View style={[styles.iconWrap, { backgroundColor: item.tint }]}>
          <Icon size={26} color={item.accent} strokeWidth={1.8} />
        </View>
      )}
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.tagline && <Text style={[styles.cardTagline, { color: item.accent }]}>{item.tagline}</Text>}
      <Text style={styles.cardBody}>{item.body}</Text>

      {item.chips && (
        <View style={styles.chipRow}>
          {item.chips.map(c => (
            <View key={c} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      {item.features && (
        <View>
          <TouchableOpacity
            style={styles.expandBtn}
            activeOpacity={0.7}
            onPress={() => setExpanded(e => !e)}
          >
            <Text style={styles.expandBtnText}>
              {expanded ? 'Show less' : 'See everything it covers'}
            </Text>
            <ChevronDown
              size={14} color={colors.navy}
              style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.featureList}>
              {item.features.map(([t, d]) => (
                <View key={t} style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: item.accent }]} />
                  <Text style={styles.featureText}>
                    <Text style={styles.featureTextBold}>{t}. </Text>{d}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

// `mode="first-launch"` (default): shown once after sign-in, rendered
// directly by RootNavigator's own state (not pushed onto a stack) — marks
// itself seen in AsyncStorage on skip/finish, then calls onFinish so the
// caller can swap to MainTabs. `mode="replay"`: pushed as a normal screen
// from Profile any time, doesn't touch AsyncStorage, onFinish just does
// navigation.goBack().
export default function BlueprintTourScreen({ mode = 'first-launch', onFinish }) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { user } = useAuth()
  const scrollRef = useRef(null)
  const [index, setIndex] = useState(0)

  function finish() {
    if (mode === 'first-launch' && user?.id) {
      AsyncStorage.setItem(`${TOUR_SEEN_KEY_PREFIX}${user.id}`, '1').catch(() => {})
    }
    onFinish?.()
  }

  function goTo(i) {
    const clamped = Math.max(0, Math.min(CARDS.length - 1, i))
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true })
    setIndex(clamped)
  }

  function onMomentumEnd(e) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width)
    setIndex(i)
  }

  const isLast = index === CARDS.length - 1

  return (
    <View style={styles.screen}>
      <View style={[styles.chrome, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={finish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {CARDS.map((c, i) => (
            <TouchableOpacity key={c.key} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      >
        {CARDS.map(item => <TourCard key={item.key} item={item} width={width} />)}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isLast ? (
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={finish}>
            <Text style={styles.ctaBtnText}>
              {mode === 'replay' ? 'Done' : 'Start exploring'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={() => goTo(index + 1)}>
            <Text style={styles.ctaBtnText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  chrome: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  skipText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.muted, width: 40 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, borderRadius: 3, backgroundColor: colors.navy },

  cardContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },

  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  cardTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy, marginBottom: 4 },
  cardTagline: { fontFamily: fonts.sansSemiBold, fontSize: 14, marginBottom: spacing.sm },
  cardBody: { fontFamily: fonts.sans, fontSize: 15, color: colors.muted, lineHeight: 23 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  chip: {
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.lg, paddingVertical: 4,
  },
  expandBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline' },

  featureList: { marginTop: spacing.md, gap: 12 },
  featureRow: { flexDirection: 'row', gap: 10 },
  featureDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 8 },
  featureText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: colors.muted, lineHeight: 20 },
  featureTextBold: { fontFamily: fonts.sansSemiBold, color: colors.navy },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  ctaBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingVertical: 15, alignItems: 'center',
  },
  ctaBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
