/**
 * CompassScreen, in-app landing page for the CourseCompass integration.
 *
 * CourseCompass is an independent product by Stephen McKeon, integrated in
 * partnership with UniBlueprint. This screen frames each tool before handing
 * off to the external site via Linking.openURL, matching the existing external
 * link behaviour used throughout the app.
 *
 * Tool list and copy sourced from coursecompass.ie, verify URLs before each
 * release in case paths change.
 */

import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ChevronRight, ExternalLink,
  Compass, Wrench, GraduationCap, BookOpen,
  Lightbulb, Globe, FileText, MessageSquare, Star,
  ClipboardCheck, Target, Users, Laptop,
  Calculator, Sparkles, Search, ShieldCheck,
} from 'lucide-react-native'

import UBPLogo    from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'

// ─── Data ─────────────────────────────────────────────────────────────────────
// All tool names, descriptions, and URLs verified against coursecompass.ie.
// Prices sourced from the live site, confirm before each release.

const BUNDLE = {
  name:     'Senior Cycle Bundle',
  price:    '€49.99',
  includes: 'Course Compass · PLC Compass · Apprenticeship Compass · Learning Style Test · Career Investigations',
  url:      'https://coursecompass.ie',
}

// Second bundle option, confirmed live on coursecompass.ie/pricing (Sept 2026):
// "Complete Platform Bundle", €90 (listed against a €95 individual total).
const BUNDLE_TWO = {
  name:     'Complete Platform Bundle',
  price:    '€90',
  includes: 'All 6 assessments — Subject Interest Test · Course Compass · Learning Style Test · Apprenticeship Compass · Career Investigations · CV Builder',
  url:      'https://coursecompass.ie/pricing',
}

const TOOLS = [
  {
    key:      'course',
    label:    'AI COURSE MATCHING',
    Icon:     Compass,
    color:    '#EFF6FF',
    headline: 'Find the CAO course that fits you, not just your points',
    sub:      'AI-matched course recommendations based on your personality, interests, and learning style. Includes a full PDF results booklet.',
    url:      'https://coursecompass.ie/course-compass',
  },
  {
    key:      'apprenticeship',
    label:    'APPRENTICESHIP COMPASS',
    Icon:     Wrench,
    color:    '#F0FDF4',
    headline: 'Match your profile to the right SOLAS apprenticeship',
    sub:      'A structured matching process that identifies the trade or technical apprenticeship best suited to your skills and interests.',
    url:      'https://coursecompass.ie/apprentice-compass-test',
  },
  {
    key:      'plc',
    label:    'PLC COMPASS',
    Icon:     GraduationCap,
    color:    '#FDF4FF',
    headline: 'Post-Leaving Cert courses matched to your profile',
    sub:      'Not sure if university is the right route? PLC Compass shows you the further education courses that fit who you are and what you want to do.',
    url:      'https://coursecompass.ie/plc-compass-test',
  },
  {
    key:      'subjects',
    label:    'SUBJECT INTEREST TEST',
    Icon:     BookOpen,
    color:    '#FFF7ED',
    headline: 'Choose Leaving Cert subjects you will actually enjoy',
    sub:      'A quick assessment that identifies which Leaving Cert subjects align with your genuine interests and natural strengths.',
    url:      'https://coursecompass.ie/subject-interest-test',
  },
  {
    key:      'learning',
    label:    'LEARNING STYLE TEST',
    Icon:     Lightbulb,
    color:    '#F0F9FF',
    headline: 'Understand exactly how your brain learns best',
    sub:      'A VARK+M cognitive profile with personalised study strategies built around the way you actually process and retain information.',
    url:      'https://coursecompass.ie/learning-style-test',
  },
  {
    key:      'careers',
    label:    'CAREER INVESTIGATIONS',
    Icon:     Globe,
    color:    '#FEF9C3',
    headline: '60+ in-depth guides to careers across Ireland',
    sub:      'Deep-dive career profiles covering what the role is really like, how to get in, salary ranges, and the qualifications you need.',
    url:      'https://coursecompass.ie/career-investigations',
  },
  {
    key:      'cv',
    label:    'CV BUILDER',
    Icon:     FileText,
    color:    '#F5F0E8',
    headline: 'Build a CV that clears ATS filters and gets noticed',
    sub:      'Guided CV creation with real-time ATS scoring, designed specifically for school leavers and early-career applicants.',
    url:      'https://coursecompass.ie/cv-builder-test',
  },
  {
    key:      'studyskills',
    label:    'STUDY SKILLS & EXAM READINESS',
    Icon:     ClipboardCheck,
    color:    '#ECFCCB',
    headline: 'Build a study system that actually works for you',
    sub:      'A 5-dimension study skills profile with an AI-generated improvement plan and tips you can use this week. Retake it to track progress.',
    url:      'https://coursecompass.ie/study-skills-test',
  },
  {
    key:      'careervalues',
    label:    'CAREER VALUES & MOTIVATION',
    Icon:     Target,
    color:    '#FCE7F3',
    headline: 'Find out what actually drives your career choices',
    sub:      'A 12-value radar chart with your top 5 motivators highlighted, built from real trade-off scenarios rather than a simple checklist.',
    url:      'https://coursecompass.ie/career-values-test',
  },
  {
    key:      'personality',
    label:    'PERSONALITY & TEAMWORK STYLE',
    Icon:     Users,
    color:    '#E0E7FF',
    headline: 'Understand how you work, not just what you like',
    sub:      'A 6-spectrum working style profile with AI-generated recommendations for the kind of environments and teams that suit you best.',
    url:      'https://coursecompass.ie/personality-teamwork-test',
  },
  {
    key:      'digitalskills',
    label:    'DIGITAL SKILLS & FUTURE READINESS',
    Icon:     Laptop,
    color:    '#FFE4E6',
    headline: 'Know where you stand on digital skills before college',
    sub:      'A 5-domain digital competency profile and Future Readiness Score built on the EU DigComp 2.2 framework, with real-world scenarios.',
    url:      'https://coursecompass.ie/digital-skills-test',
  },
  {
    key:      'chatbot',
    label:    'AI CHATBOT',
    Icon:     MessageSquare,
    color:    '#EFF6FF',
    headline: 'Instant answers to your CAO and Leaving Cert questions',
    sub:      '24/7 AI assistant trained on CAO requirements, points history, subject pathways, and entry routes across Irish higher education.',
    url:      'https://coursecompass.ie/login',
  },
]

// ─── Free tools ─────────────────────────────────────────────────────────────
// No purchase or account needed on coursecompass.ie — confirmed live via its
// /resources page (Sept 2026). Kept separate from the paid TOOLS list above
// since these are immediate, zero-friction utilities rather than assessments.

const FREE_TOOLS = [
  {
    key:  'points',
    label: 'CAO Points Calculator',
    Icon: Calculator,
    sub:  'Enter your Leaving Cert grades for your CAO points total out of 625, then see which 2026 courses your points would have reached.',
    url:  'https://coursecompass.ie/cao-points-calculator',
  },
  {
    key:  'riasec',
    label: 'Free RIASEC Career Test',
    Icon: Sparkles,
    sub:  'A 5-minute interest inventory — get your three-letter Holland Code and the CAO course areas that typically fit. No account needed.',
    url:  'https://coursecompass.ie/riasec-test-ireland',
  },
  {
    key:  'coursesearch',
    label: 'CAO Course Search',
    Icon: Search,
    sub:  'Browse and search all 1,395 CAO-listed courses across every Irish university, institute of technology, and college.',
    url:  'https://coursecompass.ie/courses',
  },
  {
    key:  'susi',
    label: 'SUSI Grant Eligibility Checker',
    Icon: ShieldCheck,
    sub:  'An anonymous pre-screen for the SUSI student grant, based on household income and family size.',
    url:  'https://coursecompass.ie/resources/susi-eligibility',
  },
  {
    key:  'hear',
    label: 'HEAR Eligibility Checker',
    Icon: ShieldCheck,
    sub:  'An anonymous pre-screen for the Higher Education Access Route (HEAR).',
    url:  'https://coursecompass.ie/resources/hear-eligibility',
  },
  {
    key:  'dare',
    label: 'DARE Eligibility Checker',
    Icon: ShieldCheck,
    sub:  'An anonymous pre-screen for the Disability Access Route to Education (DARE).',
    url:  'https://coursecompass.ie/resources/dare-eligibility',
  },
]

// ─── Tool card ────────────────────────────────────────────────────────────────

function ToolCard({ tool }) {
  function open() { Linking.openURL(tool.url) }

  return (
    <View style={s.toolCard}>
      {/* Top row: icon + label */}
      <View style={s.toolTopRow}>
        <View style={[s.toolIconBox, { backgroundColor: tool.color }]}>
          <tool.Icon size={20} color={colors.navy} strokeWidth={1.8} />
        </View>
        <Text style={s.toolLabel}>{tool.label}</Text>
      </View>

      {/* Headline */}
      <Text style={s.toolHeadline}>{tool.headline}</Text>

      {/* Supporting line */}
      <Text style={s.toolSub}>{tool.sub}</Text>

      {/* CTA */}
      <TouchableOpacity style={s.toolCta} onPress={open} activeOpacity={0.8}>
        <ExternalLink size={13} color={colors.cream} strokeWidth={2} />
        <Text style={s.toolCtaText}>Open on CourseCompass</Text>
        <ChevronRight size={13} color={colors.cream} />
      </TouchableOpacity>
    </View>
  )
}

// ─── Free tool row ──────────────────────────────────────────────────────────

function FreeToolRow({ tool }) {
  function open() { Linking.openURL(tool.url) }

  return (
    <TouchableOpacity style={s.freeRow} onPress={open} activeOpacity={0.75}>
      <View style={s.freeIconBox}>
        <tool.Icon size={18} color={colors.navy} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.freeTopLine}>
          <Text style={s.freeLabel}>{tool.label}</Text>
          <View style={s.freePill}>
            <Text style={s.freePillText}>FREE</Text>
          </View>
        </View>
        <Text style={s.freeSub}>{tool.sub}</Text>
      </View>
      <ChevronRight size={16} color={colors.light} style={{ flexShrink: 0 }} />
    </TouchableOpacity>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CompassScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={s.screen}>

      {/* ── Integrated header + hero ── */}
      <View style={[s.heroBlock, { paddingTop: insets.top + 8 }]}>
        <View style={s.navRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={s.backBtnText}>Home</Text>
          </TouchableOpacity>
          <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
          <View style={{ width: 70 }} />
        </View>

        <Text style={s.heroEyebrow}>COURSE COMPASS</Text>
        <Text style={s.heroTitle}>Find Your Ideal Path</Text>
        <Text style={s.heroSub}>
          AI-powered course and career matching for every young person in Ireland. Match to CAO courses, PLCs, and apprenticeships based on who you are, not just your predicted points.
        </Text>

        {/* Partnership attribution */}
        <View style={s.attrRow}>
          <View style={s.attrDot} />
          <Text style={s.attrText}>
            An independent platform by Stephen McKeon, integrated in partnership with UniBlueprint
          </Text>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.content}>

          {/* ── Featured bundles ── */}
          <View style={s.toolsHeader}>
            <Text style={s.toolsEyebrow}>BUNDLES</Text>
            <Text style={s.toolsTitle}>Save by bundling</Text>
          </View>

          <View style={{ gap: 14, marginBottom: spacing.sm }}>
            {[BUNDLE, BUNDLE_TWO].map(bundle => (
              <TouchableOpacity
                key={bundle.name}
                activeOpacity={0.88}
                style={s.bundleCard}
                onPress={() => Linking.openURL(bundle.url)}
              >
                <View style={s.bundleTop}>
                  <View style={s.bundleIconBox}>
                    <Star size={18} color={colors.navy} strokeWidth={2} />
                  </View>
                  <View style={s.bundlePricePill}>
                    <Text style={s.bundlePriceText}>{bundle.price}</Text>
                  </View>
                </View>

                <Text style={s.bundleName}>{bundle.name}</Text>
                <Text style={s.bundleIncludes}>{bundle.includes}</Text>

                <View style={s.bundleCta}>
                  <Text style={s.bundleCtaText}>Get the Bundle</Text>
                  <ChevronRight size={14} color={colors.navy} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={s.sampleLink}
            onPress={() => Linking.openURL('https://coursecompass.ie/sample-results/overview')}
          >
            <Text style={s.sampleLinkText}>See a real sample result before you buy</Text>
            <ChevronRight size={13} color={colors.navy} />
          </TouchableOpacity>

          {/* ── Individual tools ── */}
          <View style={[s.toolsHeader, { marginTop: spacing.xl }]}>
            <Text style={s.toolsEyebrow}>ALL TOOLS</Text>
            <Text style={s.toolsTitle}>{TOOLS.length} tools, one platform</Text>
          </View>

          <View style={{ gap: 14 }}>
            {TOOLS.map(tool => <ToolCard key={tool.key} tool={tool} />)}
          </View>

          {/* ── Free tools ── */}
          <View style={[s.toolsHeader, { marginTop: spacing.xl }]}>
            <Text style={s.toolsEyebrow}>FREE TOOLS</Text>
            <Text style={s.toolsTitle}>No purchase needed</Text>
            <Text style={s.freeIntro}>
              A handful of CourseCompass tools are free to use right now, no account or payment required.
            </Text>
          </View>

          <View style={s.freeCard}>
            {FREE_TOOLS.map((tool, i) => (
              <View key={tool.key}>
                <FreeToolRow tool={tool} />
                {i < FREE_TOOLS.length - 1 && <View style={s.freeDivider} />}
              </View>
            ))}
          </View>

          {/* ── Footer note ── */}
          <View style={s.footerNote}>
            <Text style={s.footerNoteText}>
              Pricing and tool availability set by CourseCompass. All tools open on coursecompass.ie in your device browser.
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Hero
  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + spacing.sm,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingRight: 10,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  heroTitle: {
    fontFamily: fonts.serif, fontSize: 30, color: colors.cream, lineHeight: 38, marginBottom: 10,
  },
  heroSub: {
    fontFamily: fonts.sans, fontSize: 14,
    color: 'rgba(245,240,232,0.72)', lineHeight: 22,
  },

  // Attribution
  attrRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: spacing.md,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1, borderTopColor: 'rgba(245,240,232,0.12)',
  },
  attrDot: {
    width: 5, height: 5, borderRadius: 99,
    backgroundColor: 'rgba(245,240,232,0.35)',
    marginTop: 5, flexShrink: 0,
  },
  attrText: {
    fontFamily: fonts.sans, fontSize: 11,
    color: 'rgba(245,240,232,0.45)', lineHeight: 16, flex: 1,
  },

  // Scroll content
  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed navy header on every platform — without
  // it, RN can size the ScrollView to its own content instead of the
  // available viewport, which is what let the header float over content.
  scrollView: { flex: 1 },
  scroll: {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Bundle card (cream bg, navy accent, inverted from the tool cards)
  bundleCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    borderWidth: 2, borderColor: colors.navy,
    padding: 18,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  bundleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  bundleIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.15)',
  },
  bundlePricePill: {
    backgroundColor: colors.navy, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  bundlePriceText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
  bundleName: {
    fontFamily: fonts.serif, fontSize: 22, color: colors.navy, marginBottom: 8,
  },
  bundleIncludes: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18, marginBottom: 16,
  },
  bundleCta: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', gap: 4,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  bundleCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // Sample-result link, sits between the bundle cards and the tools list
  sampleLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, marginBottom: spacing.md,
  },
  sampleLinkText: {
    fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.navy,
    textDecorationLine: 'underline',
  },

  // Tools section header
  toolsHeader: { marginBottom: spacing.md },
  toolsEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  toolsTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy },
  freeIntro: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    lineHeight: 19, marginTop: 6,
  },

  // Free tools list card
  freeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    ...shadows.card,
    overflow: 'hidden',
  },
  freeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14,
  },
  freeIconBox: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  freeTopLine: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8,
  },
  freeLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy,
  },
  freePill: {
    backgroundColor: 'rgba(20,90,62,0.1)', borderRadius: radius.pill,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  freePillText: {
    fontFamily: fonts.sansSemiBold, fontSize: 9.5, color: '#145A3E', letterSpacing: 0.4,
  },
  freeSub: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.muted,
    lineHeight: 17, marginTop: 4,
  },
  freeDivider: {
    height: 1, backgroundColor: 'rgba(30,58,95,0.07)', marginLeft: 62,
  },

  // Individual tool card
  toolCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 16,
    ...shadows.card,
  },
  toolTopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  toolIconBox: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  toolLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10,
    color: colors.muted, letterSpacing: 0.8,
  },
  toolHeadline: {
    fontFamily: fonts.serif, fontSize: 18, color: colors.navy,
    lineHeight: 24, marginBottom: 6,
  },
  toolSub: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    lineHeight: 19, marginBottom: 14,
  },
  toolCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 14, paddingVertical: 9,
    alignSelf: 'flex-end',
  },
  toolCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // Footer note
  footerNote: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  footerNoteText: {
    fontFamily: fonts.sans, fontSize: 11, color: colors.light,
    lineHeight: 17, textAlign: 'center',
  },
})
