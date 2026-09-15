import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  FileText, Compass, Building2, Heart, Globe, CheckCircle,
  Calculator, Megaphone, Users, MessageSquare, CalendarClock, Send, Star, User,
} from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

// ── Static, representative content only ─────────────────────────────────────
//
// This tour used to mount the app's real, live screen components behind
// each card (HomeScreen, ElevationScreen, etc.) so it was showing genuine
// Supabase-backed data. That meant a brand-new account with an empty
// dashboard, no coaches loaded yet, or a slow connection made the "welcome
// tour" itself look broken or sparse — exactly what a first-run walkthrough
// must never do. Every step below is now a small, fixed, illustrative mockup
// built from sample copy and numbers baked in at build time: nothing here
// reads from Supabase, AsyncStorage-cached data, or the signed-in user's own
// account, so the tour renders identically for every account, empty or not,
// online or off.

const SAMPLE_TILES = [
  { Icon: FileText,      label: 'Submit a Service', sub: 'Order a Foundation Blueprint service' },
  { Icon: CheckCircle,   label: 'My Outputs',       sub: 'Your completed documents' },
  { Icon: Users,         label: 'Find a Coach',     sub: 'Book time with a coach' },
  { Icon: MessageSquare, label: 'Campus Board',     sub: 'See what campus is talking about' },
]

const STEPS = [
  {
    key: 'welcome', accent: colors.navy, Icon: null,
    title: 'Welcome to UniBlueprint', tagline: null,
    body: "A quick, guided tour of everything UniBlueprint offers, using sample screens so nothing here depends on your account. It takes a couple of minutes, and shows you the whole app before you land on your real dashboard.",
    mock: { kind: 'quickAccess', tiles: SAMPLE_TILES },
  },
  {
    key: 'foundation', accent: '#2563EB', Icon: FileText,
    title: 'Foundation Blueprint', tagline: 'Your Profile Builders',
    body: 'Every career document you need: CV, cover letter, LinkedIn, portfolio, application answers, interview prep, personal statements. Built with you, then reviewed by a real trained Campus Handler before it ever reaches you — not AI output on its own, real human review.',
    chips: [
      'CV Optimisation', 'Portfolio Building', 'LinkedIn Optimisation', 'Cover Letter Assistance',
      'Personal Statement', 'Application Form Assistance', 'Interview Preparation', 'Job Search Support',
    ],
  },
  {
    key: 'foundation-detail', accent: '#2563EB', Icon: FileText,
    title: 'How a document gets built', tagline: 'One question at a time',
    body: "Each service is a short, guided questionnaire, not a blank page. Answer a few focused questions and a real Campus Handler reviews and polishes the result before it reaches you. Your answers also build your Evidence Bank, a bank of stories and achievements you can draw on again for future documents.",
    mock: {
      kind: 'cards',
      items: [
        { title: 'CV Optimisation', sub: 'One question at a time, then handler review', meta: 'Sample' },
        { title: 'Evidence Bank', sub: 'Your story bank, one guided prompt at a time', meta: 'Sample' },
      ],
    },
  },
  {
    key: 'elevation', accent: '#16A34A', Icon: Compass,
    title: 'Elevation Blueprint', tagline: 'Verified coaches, one enquiry away',
    body: 'Browse verified coaches across fitness, academics, trading and marketing. Every coach profile follows the same layout: pricing, a full bio, services, and a clear way to reach them.',
    chips: ['All Coaches', 'Fitness', 'Academic Grinds', 'Trading', 'Marketing'],
  },
  {
    key: 'elevation-detail', accent: '#16A34A', Icon: Compass,
    title: 'A coach profile, up close', tagline: 'Sample profile',
    body: "Every coach page shows real pricing, a full bio, and their services, then two ways to reach them: book time directly, or send a quick message. Pricing and booking happen between you and the coach, not through UniBlueprint.",
    mock: {
      kind: 'profile',
      name: 'Sample Coach',
      category: 'Personal Training',
      price: 'From €45/session',
      bio: "A short paragraph about the coach's training style and experience appears here, pulled from their real profile.",
      ctaPrimary: 'Book a Coach',
      ctaSecondary: 'Send a Quick Message',
    },
  },
  {
    key: 'lifestyle', accent: '#A21CAF', Icon: Heart,
    title: 'Lifestyle Blueprint', tagline: 'Student life, sorted',
    body: 'Real discounts from verified local partners, browsable as a grid or on a map. Plus a categorised mental health and wellbeing directory, and the budgeting tools most students never get taught.',
    chips: ['Health & Fitness', 'Beauty & Grooming', 'Fashion', 'Food & Drink', 'Creative & Services'],
  },
  {
    key: 'lifestyle-detail', accent: '#A21CAF', Icon: Heart,
    title: 'Partners near you', tagline: 'Grid or map view',
    body: 'Filter by category, switch between a grid and a map, then tap through to a full listing with the discount details and how to claim it.',
    mock: {
      kind: 'cards',
      items: [
        { title: 'Sample Café', sub: '10% off with student ID', meta: 'Food & Drink' },
        { title: 'Sample Studio', sub: 'First class free', meta: 'Health & Fitness' },
      ],
    },
  },
  {
    key: 'campus', accent: '#C2660B', Icon: Building2,
    title: 'Campus Connect', tagline: 'Your own college, in one place',
    body: 'Fourteen real boards for your own college, each with its own full board page: Accommodation, Campus Events, Study Groups, Lost & Found, Clubs & Societies, Carpooling, Project Collaboration and more. Browse, post, and reply right there.',
    mock: {
      kind: 'cards',
      items: [
        { title: 'Accommodation', sub: 'Rooms, sublets and housemates' },
        { title: 'Study Groups', sub: 'Find people revising the same module' },
      ],
    },
  },
  {
    key: 'course', accent: '#0369A1', Icon: Globe,
    title: 'Course Connect', tagline: 'Cross-Ireland student network',
    body: 'Nine live tools spanning every Irish institution, not just your own: Course Boards, Notes Exchange, Study Groups, Module Q&A, Exam Resources, a cross-institution Resource Finder, Industry Discussions, College Reviews, and Project Collaboration.',
    mock: {
      kind: 'cards',
      items: [
        { title: 'Notes Exchange', sub: 'Share and find notes by module' },
        { title: 'Module Q&A', sub: 'Ask questions, get answers from your course' },
      ],
    },
  },
  {
    key: 'budgeting', accent: '#B45309', Icon: Calculator,
    title: 'Budgeting', tagline: 'Your financial companion, not a Blueprint',
    body: 'A standalone tool, not one of the five pillars. Track what you spend and plan your term under Budget, see every real Irish grant and scheme you might qualify for under Grants & Schemes, and learn from independent trading coaches under Investment.',
    mock: {
      kind: 'budget',
      tabs: ['Budget', 'Grants & Schemes', 'Investment'],
      label: 'This month (sample)',
      value: '€340 of €500 spent',
      progress: 0.68,
    },
  },
  {
    key: 'adboard', accent: '#7C3AED', Icon: Megaphone,
    title: 'Ad Board', tagline: 'Not one of the five pillars, four things in one place',
    body: 'The Weekly Blueprint, a 13-section magazine you flip through, not scroll: deals, coach spotlights, campus events and student stories, new every week. A Blog, a Marketplace to buy, sell, or offer a skill, and the live Ad Board itself, where anyone can post a listing for review.',
    mock: {
      kind: 'cards',
      items: [
        { title: 'The Weekly Blueprint', sub: 'A 13-section magazine, new every week' },
        { title: 'Marketplace', sub: 'Buy, sell, or offer a skill' },
      ],
    },
  },
  {
    key: 'messages', accent: colors.goldDeep, Icon: MessageSquare,
    title: 'Messages & Directory', tagline: 'Stay connected',
    body: "Once you enquire with a coach or work with a Handler, keep the conversation going in Messages. The Directory helps you find other students and coaches who share your interests.",
    mock: {
      kind: 'cards',
      items: [
        { title: 'Messages', sub: 'Chat with coaches and handlers you’ve engaged with' },
        { title: 'Directory', sub: 'Find students and coaches by interest' },
      ],
    },
  },
  {
    key: 'done', accent: colors.navy, Icon: CheckCircle,
    title: 'You’re set', tagline: null,
    body: 'That’s the whole map. Everything you just saw is real and ready for you — this tour just used sample content so nothing depended on your account yet. Come back to this any time from Profile, then How UniBlueprint Works.',
    mock: null,
  },
]

export const TOUR_SEEN_KEY_PREFIX = 'btb_tour_seen_'

// ── Mockup pieces ────────────────────────────────────────────────────────────
// Small, fixed illustrative panels — plain Views and static strings, not
// live components. Each renders identically every time, regardless of any
// real account or backend state.

function QuickAccessMock({ tiles }) {
  return (
    <View style={mock.quickAccessGrid}>
      {tiles.map(t => (
        <View key={t.label} style={mock.quickAccessTile}>
          <View style={mock.quickAccessIconWrap}>
            <t.Icon size={18} color={colors.navy} strokeWidth={1.8} />
          </View>
          <Text style={mock.quickAccessLabel}>{t.label}</Text>
          <Text style={mock.quickAccessSub} numberOfLines={2}>{t.sub}</Text>
        </View>
      ))}
    </View>
  )
}

function CardsMock({ items, accent }) {
  return (
    <View style={mock.cardList}>
      {items.map(it => (
        <View key={it.title} style={mock.listRow}>
          <View style={[mock.listDot, { backgroundColor: accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={mock.listTitle}>{it.title}</Text>
            <Text style={mock.listSub}>{it.sub}</Text>
          </View>
          {it.meta && (
            <View style={[mock.listMeta, { backgroundColor: `${accent}1A` }]}>
              <Text style={[mock.listMetaText, { color: accent }]}>{it.meta}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

function ProfileMock({ name, category, price, bio, ctaPrimary, ctaSecondary, accent }) {
  return (
    <View style={mock.profileCard}>
      <View style={mock.profileTopRow}>
        <View style={[mock.profileAvatar, { borderColor: accent }]}>
          <User size={22} color={accent} strokeWidth={1.6} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={mock.profileName}>{name}</Text>
          <View style={mock.profileMetaRow}>
            <Star size={11} color={colors.gold} fill={colors.gold} />
            <Text style={mock.profileCategory}>{category}</Text>
          </View>
        </View>
        <View style={mock.profilePriceChip}>
          <Text style={mock.profilePriceText}>{price}</Text>
        </View>
      </View>
      <Text style={mock.profileBio} numberOfLines={3}>{bio}</Text>
      <View style={{ gap: 8, marginTop: 12 }}>
        <View style={[mock.profileCtaPrimary, { backgroundColor: accent }]}>
          <CalendarClock size={13} color={colors.white} strokeWidth={2} />
          <Text style={mock.profileCtaPrimaryText}>{ctaPrimary}</Text>
        </View>
        <View style={mock.profileCtaSecondary}>
          <Send size={12} color={colors.navy} strokeWidth={2} />
          <Text style={mock.profileCtaSecondaryText}>{ctaSecondary}</Text>
        </View>
      </View>
    </View>
  )
}

function BudgetMock({ tabs, label, value, progress, accent }) {
  return (
    <View>
      <View style={mock.tabRow}>
        {tabs.map((t, i) => (
          <View key={t} style={[mock.tabPill, i === 0 && { backgroundColor: accent, borderColor: accent }]}>
            <Text style={[mock.tabPillText, i === 0 && { color: colors.white }]}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={mock.statCard}>
        <Text style={mock.statLabel}>{label}</Text>
        <Text style={mock.statValue}>{value}</Text>
        <View style={mock.progressTrack}>
          <View style={[mock.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: accent }]} />
        </View>
      </View>
    </View>
  )
}

function MockPanel({ mock: spec, accent }) {
  if (!spec) return null
  if (spec.kind === 'quickAccess') return <QuickAccessMock tiles={spec.tiles} />
  if (spec.kind === 'cards')       return <CardsMock items={spec.items} accent={accent} />
  if (spec.kind === 'profile')     return <ProfileMock {...spec} accent={accent} />
  if (spec.kind === 'budget')      return <BudgetMock {...spec} accent={accent} />
  return null
}

// `mode="first-launch"` (default): shown once after sign-in, rendered
// directly by RootNavigator's own state (not pushed onto a stack) — marks
// itself seen in AsyncStorage on finish, then calls onFinish so the caller
// can swap to MainTabs. There is no Skip control anywhere in this flow: the
// only way through is stepping through every step to the final "You're set"
// card. `mode="replay"`: pushed as a normal screen from Profile any time,
// doesn't touch AsyncStorage, onFinish just does navigation.goBack() once
// the person reaches the end (or backs out via the header, same as any
// other pushed screen).
export default function BlueprintTourScreen({ mode = 'first-launch', onFinish }) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { user } = useAuth()
  const [index, setIndex] = useState(0)
  const fade = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  // Smooth crossfade between steps, and an animated top progress bar — both
  // purely cosmetic pacing cues, no live data involved.
  useEffect(() => {
    fade.setValue(0)
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start()
    Animated.timing(progressAnim, {
      toValue: (index + 1) / STEPS.length,
      duration: 320,
      useNativeDriver: false,
    }).start()
  }, [index])

  function finish() {
    if (mode === 'first-launch' && user?.id) {
      AsyncStorage.setItem(`${TOUR_SEEN_KEY_PREFIX}${user.id}`, '1').catch(() => {})
    }
    onFinish?.()
  }

  function next() {
    setIndex(i => Math.min(STEPS.length - 1, i + 1))
  }

  // Dots only ever step BACKWARD to a step already seen — tapping ahead of
  // the current step does nothing. Combined with there being no Skip
  // control, this is the only navigation in the tour, so every step is
  // guaranteed to have been shown before the person can finish it.
  function goToVisited(i) {
    if (i <= index) setIndex(i)
  }

  return (
    <View style={styles.screen}>
      {/* ── Fixed illustrative mockup for this step (never live data) ── */}
      <View style={styles.liveArea}>
        <Animated.View style={[styles.mockWrap, { opacity: fade }]}>
          <MockPanel mock={step.mock} accent={step.accent} />
        </Animated.View>
        <LinearGradient
          colors={['rgba(245,240,232,0)', 'rgba(245,240,232,0.9)', colors.white]}
          style={styles.liveScrim}
          pointerEvents="none"
        />
      </View>

      {/* ── Floating chrome — step counter and progress bar only, no Skip ── */}
      <View style={[styles.floatingRow, { top: insets.top + 10 }]} pointerEvents="none">
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>{index + 1} of {STEPS.length}</Text>
        </View>
      </View>
      <View style={[styles.progressTrackTop, { top: insets.top + 10 }]} pointerEvents="none">
        <Animated.View
          style={[
            styles.progressFillTop,
            {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>

      {/* ── Explanation card, anchored to the bottom, over the mockup ── */}
      <View style={styles.card}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => goToVisited(i)}
              disabled={i > index}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={[styles.dot, i === index && styles.dotActive, i > index && styles.dotUpcoming]} />
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
            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={next}>
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
  mockWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  liveScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },

  floatingRow: {
    position: 'absolute', left: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
  },
  stepPill: {
    backgroundColor: 'rgba(15,23,32,0.55)', borderRadius: radius.pill,
    paddingHorizontal: 11, paddingVertical: 6,
  },
  stepPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.cream },

  progressTrackTop: {
    position: 'absolute', left: spacing.md, right: spacing.md, marginTop: 34,
    height: 3, borderRadius: 2, backgroundColor: 'rgba(15,23,32,0.12)', overflow: 'hidden',
  },
  progressFillTop: { height: '100%', borderRadius: 2, backgroundColor: colors.gold },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    marginTop: -26,
    ...shadows.elevated,
  },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: spacing.sm, flexWrap: 'wrap' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, borderRadius: 3, backgroundColor: colors.navy },
  dotUpcoming: { opacity: 0.5 },

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

// ── Mockup panel styles ──────────────────────────────────────────────────────
const mock = StyleSheet.create({
  quickAccessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickAccessTile: {
    width: '47%', backgroundColor: colors.white, borderRadius: radius.card,
    padding: 14, ...shadows.card,
  },
  quickAccessIconWrap: {
    width: 32, height: 32, borderRadius: 9, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  quickAccessLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginBottom: 2 },
  quickAccessSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, lineHeight: 15 },

  cardList: { gap: 10 },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: 14, ...shadows.card,
  },
  listDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  listTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, marginBottom: 2 },
  listSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 17 },
  listMeta: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  listMetaText: { fontFamily: fonts.sansSemiBold, fontSize: 10 },

  profileCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, ...shadows.elevated },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream, flexShrink: 0,
  },
  profileName: { fontFamily: fonts.serif, fontSize: 16, color: colors.navy, marginBottom: 2 },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileCategory: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  profilePriceChip: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  profilePriceText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },
  profileBio: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  profileCtaPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.button, paddingVertical: 11,
  },
  profileCtaPrimaryText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.white },
  profileCtaSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.button, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.border,
  },
  profileCtaSecondaryText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.navy },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabPill: {
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  tabPillText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.navy },
  statCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 16, ...shadows.card },
  statLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  statValue: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, marginBottom: 10 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.cream, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
})
