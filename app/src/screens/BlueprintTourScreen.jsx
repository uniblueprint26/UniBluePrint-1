import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  FileText, Compass, Building2, Heart, Globe, CheckCircle,
  Calculator, Megaphone,
} from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

// The real, current screen components this tour walks through — the exact
// same code every user sees once they leave the tour, not a screenshot or
// an illustrative stand-in of them.
import HomeScreen          from './HomeScreen'
import FoundationScreen    from './FoundationScreen'
import ElevationScreen     from './ElevationScreen'
import LifestyleScreen     from './LifestyleScreen'
import CampusConnectScreen from './CampusConnectScreen'
import CourseConnectScreen from './CourseConnectScreen'
import BudgetingScreen     from './BudgetingScreen'
import AdBoardScreen       from './AdBoardScreen'

// Each step's `screen` is a real screen component, mounted live for that
// step only (see LiveBackdrop below) — genuinely the current app, fetching
// real data, not a mockup or static illustration of it. Copy below is kept
// in sync manually with what's actually on each of those screens right now;
// see the comment above each step for what was checked against the code.
const STEPS = [
  {
    key: 'welcome', screen: HomeScreen, accent: colors.navy, Icon: null,
    title: 'Welcome to UniBlueprint', tagline: null,
    body: 'That’s your real dashboard behind this card, not a mockup — five Blueprints, plus Budgeting and the Ad Board. This is the two-minute tour of what’s actually here. Skip it any time and start exploring.',
    chips: null,
  },
  {
    // Matches FoundationScreen's CAREER_SERVICES (8 services, exact titles).
    key: 'foundation', screen: FoundationScreen, accent: '#2563EB', Icon: FileText,
    title: 'Foundation Blueprint', tagline: 'Your Profile Builders',
    body: 'Every career document you need: CV, cover letter, LinkedIn, portfolio, application answers, interview prep, personal statements. Built with you, then reviewed by a real trained Campus Handler before it ever reaches you. Not AI output on its own — real, human review.',
    chips: [
      'CV Optimisation', 'Portfolio Building', 'LinkedIn Optimisation', 'Cover Letter Assistance',
      'Personal Statement', 'Application Form Assistance', 'Interview Preparation', 'Job Search Support',
    ],
  },
  {
    // Matches ElevationScreen's FILTERS: only 4 real categories remain after
    // the Fitness/Sports/Yoga merge and Creative folding into Marketing.
    key: 'elevation', screen: ElevationScreen, accent: '#16A34A', Icon: Compass,
    title: 'Elevation Blueprint', tagline: 'Verified coaches, one enquiry away',
    body: 'Browse by service and see real, verified coach profiles, each with the same standardised price and View Profile layout. Message a coach to enquire directly — pricing and booking happen between you and them, not through UniBlueprint.',
    chips: ['All Coaches', 'Fitness', 'Academic Grinds', 'Trading', 'Marketing'],
  },
  {
    // Matches LifestyleScreen's Partner Listings (Grid/Map toggle, 5 real
    // filter categories from PartnerCards.FILTERS) plus its Wellbeing and
    // Budgeting sections, and the standalone LifestylePartnersScreen behind
    // "Explore more".
    key: 'lifestyle', screen: LifestyleScreen, accent: '#A21CAF', Icon: Heart,
    title: 'Lifestyle Blueprint', tagline: 'Student life, sorted',
    body: 'Real discounts from verified local partners, browsable as a grid or on a map, with a full standalone listings screen behind "Explore more". Plus a categorised mental health and wellbeing directory, and the budgeting tools most students never get taught.',
    chips: ['Health & Fitness', 'Beauty & Grooming', 'Fashion', 'Food & Drink', 'Creative & Services'],
  },
  {
    // Matches CampusConnectScreen's CAMPUS_BOARDS: 14 boards, each its own
    // full-width card → BoardDetail page, Carpooling and Project
    // Collaboration included — both recently moved onto that same shared
    // board-page pattern.
    key: 'campus', screen: CampusConnectScreen, accent: '#C2660B', Icon: Building2,
    title: 'Campus Connect', tagline: 'Your own college, in one place',
    body: 'Fourteen real boards for your own college, each with its own full board page — Accommodation, Campus Events, Study Groups, Lost & Found, Clubs & Societies and more. Carpooling and Project Collaboration just got that same treatment: browse, post, and reply right there.',
    chips: ['Accommodation', 'Carpooling', 'Campus Events', 'Project Collaboration', 'Study Groups', 'Opportunities'],
  },
  {
    // Matches CourseConnectScreen's COURSE_FEATURES: 9 live tools, cross
    // every Irish institution rather than one college.
    key: 'course', screen: CourseConnectScreen, accent: '#0369A1', Icon: Globe,
    title: 'Course Connect', tagline: 'Cross-Ireland student network',
    body: 'Nine live tools spanning every Irish college, not just your own: Course Boards, Notes Exchange, Study Groups, Module Q&A, Exam Resources, a cross-institution Resource Finder, Industry Discussions, College Reviews, and Project Collaboration with students anywhere in the country.',
    chips: ['Course Boards', 'Notes Exchange', 'Study Groups', 'Module Q&A', 'Exam Resources', 'College Reviews'],
  },
  {
    // Matches BudgetingScreen's 3 real tabs.
    key: 'budgeting', screen: BudgetingScreen, accent: '#B45309', Icon: Calculator,
    title: 'Budgeting', tagline: 'Your financial companion, not a Blueprint',
    body: 'A standalone tool, not one of the five pillars. Track what you spend and plan your term under Budget, see every real Irish grant and scheme you might qualify for under Grants & Schemes, not just SUSI, and learn from independent trading coaches under Investment.',
    chips: ['Budget', 'Grants & Schemes', 'Investment'],
  },
  {
    // Matches AdBoardScreen: The Weekly Blueprint banner (13-section
    // magazine), plus dedicated entry cards into Blog and Marketplace, plus
    // the live curated ad list and Post an Ad on this page itself.
    key: 'adboard', screen: AdBoardScreen, accent: '#7C3AED', Icon: Megaphone,
    title: 'Ad Board', tagline: 'Not one of the five pillars, four things in one place',
    body: 'The Weekly Blueprint, a 13-section magazine you flip through, not scroll: deals, coach spotlights, campus events, and student stories, new every week. A Blog with career and student-life articles, a Marketplace to buy, sell, or offer a skill, and the live Ad Board itself, where anyone can post a listing for review.',
    chips: ['The Weekly Blueprint', 'Blog', 'Marketplace', 'Post an Ad'],
  },
  {
    key: 'done', screen: HomeScreen, accent: colors.navy, Icon: CheckCircle,
    title: 'You’re set', tagline: null,
    body: 'That’s the whole map, live, exactly as it looks right now. Come back to this any time from Profile, then How UniBlueprint Works. Nothing here is a one-time thing.',
    chips: null,
  },
]

export const TOUR_SEEN_KEY_PREFIX = 'btb_tour_seen_'

// One-screen nested stack, remounted fresh (via the `key` prop) every time
// the active step changes. Nesting a real Stack.Navigator — exactly the
// pattern HomeStack/AdBoardStack already use elsewhere — is what lets the
// real screen component render correctly here: several of these screens
// rely on real navigation context (e.g. HomeScreen's useFocusEffect), which
// only exists when the component is an actual routed screen, not a plain
// child element. `pointerEvents="none"` keeps it a look-but-don't-touch
// preview: real data renders and real layout happens, but a stray tap can't
// carry the user off into a builder flow or post something mid-tour.
const LiveStack = createNativeStackNavigator()

function LiveBackdrop({ step }) {
  const Screen = step.screen
  return (
    <View style={styles.liveWrap} pointerEvents="none">
      <LiveStack.Navigator key={step.key} screenOptions={{ headerShown: false, animation: 'none' }}>
        <LiveStack.Screen name="TourLiveScreen" component={Screen} />
      </LiveStack.Navigator>
    </View>
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
  const [index, setIndex] = useState(0)

  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  function finish() {
    if (mode === 'first-launch' && user?.id) {
      AsyncStorage.setItem(`${TOUR_SEEN_KEY_PREFIX}${user.id}`, '1').catch(() => {})
    }
    onFinish?.()
  }

  function goTo(i) {
    setIndex(Math.max(0, Math.min(STEPS.length - 1, i)))
  }

  return (
    <View style={styles.screen}>
      {/* ── Real, live screen for this step ── */}
      <View style={styles.liveArea}>
        <LiveBackdrop step={step} />
        <LinearGradient
          colors={['rgba(245,240,232,0)', 'rgba(245,240,232,0.9)', colors.white]}
          style={styles.liveScrim}
          pointerEvents="none"
        />
      </View>

      {/* ── Floating chrome over the live screen ── */}
      <View style={[styles.floatingRow, { top: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>{index + 1} of {STEPS.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.skipPill}
          activeOpacity={0.8}
          onPress={finish}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipPillText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Explanation card, anchored to the bottom, over the live screen ── */}
      <View style={styles.card}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <TouchableOpacity key={s.key} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={{ maxHeight: width < 380 ? 250 : 280 }}
          showsVerticalScrollIndicator={false}
        >
          {step.Icon && (
            <View style={[styles.iconWrap, { backgroundColor: `${step.accent}1A` }]}>
              <step.Icon size={22} color={step.accent} strokeWidth={1.8} />
            </View>
          )}
          <Text style={styles.cardTitle}>{step.title}</Text>
          {step.tagline && <Text style={[styles.cardTagline, { color: step.accent }]}>{step.tagline}</Text>}
          <Text style={styles.cardBody}>{step.body}</Text>

          {step.chips && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipRow}
            >
              {step.chips.map(c => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md }]}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },

  liveArea: { flex: 1, backgroundColor: colors.cream, overflow: 'hidden' },
  liveWrap: { flex: 1 },
  liveScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },

  floatingRow: {
    position: 'absolute', left: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  stepPill: {
    backgroundColor: 'rgba(15,23,32,0.55)', borderRadius: radius.pill,
    paddingHorizontal: 11, paddingVertical: 6,
  },
  stepPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.cream },
  skipPill: {
    backgroundColor: 'rgba(15,23,32,0.55)', borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  skipPillText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.cream },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    marginTop: -26,
    ...shadows.elevated,
  },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, borderRadius: 3, backgroundColor: colors.navy },

  iconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.serif, fontSize: 23, color: colors.navy, marginBottom: 2 },
  cardTagline: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginBottom: spacing.sm },
  cardBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, lineHeight: 21 },

  chipScroll: { marginTop: spacing.md, marginHorizontal: -spacing.lg },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingBottom: 4 },
  chip: {
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  footer: { paddingTop: spacing.md },
  ctaBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingVertical: 15, alignItems: 'center',
  },
  ctaBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
