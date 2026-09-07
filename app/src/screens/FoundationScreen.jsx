import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, Linkedin, Award, MessageSquare, Search, Briefcase, PenLine,
  Compass, GraduationCap, Map, Wrench, Package,
  ChevronLeft, ChevronRight, ExternalLink, Sparkles, UserCheck, Zap,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import { useWeekendDeliveryCopy } from '../hooks/useWeekendDeliveryCopy'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'

// ─── Career services ──────────────────────────────────────────────────────────

const CAREER_SERVICES = [
  {
    icon: FileText,
    title: 'CV Optimisation',
    tagline: 'A CV that opens doors, not one that gets ignored',
    description: 'Your CV is the first thing every employer sees. UniBlueprint builds you a professional, tailored CV, structured correctly, worded powerfully, and formatted to pass applicant tracking systems. Every output is reviewed by a trained Campus Handler before it reaches you.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#EFF6FF',
  },
  {
    icon: Briefcase,
    title: 'Portfolio Building',
    tagline: 'Show your work, not just tell it',
    description: 'Employers and clients want to see proof, not just a list of skills. UniBlueprint helps you put together a portfolio that actually showcases your projects, work samples, and results, structured clearly and built to make an impression.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#FEF9C3',
  },
  {
    icon: Linkedin,
    title: 'LinkedIn Optimisation',
    tagline: 'Turn your LinkedIn from invisible to irresistible',
    description: 'Recruiters search LinkedIn every day. UniBlueprint optimises your entire profile: headline, about section, experience, skills, and featured section, so you show up in searches and make the right impression.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#EEF2FF',
  },
  {
    icon: FileText,
    title: 'Cover Letter Assistance',
    tagline: 'A cover letter that actually gets read',
    description: 'Most cover letters are ignored because they are generic. UniBlueprint writes you a tailored, compelling cover letter for a specific role or company, one that adds to your CV rather than repeating it.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#F0FDF4',
  },
  {
    icon: PenLine,
    title: 'Personal Statement',
    tagline: 'Tell your story in a way that actually lands',
    description: 'A personal statement is where you make the case for yourself in your own words, not a bullet point. UniBlueprint helps you write one that is specific, honest, and structured to stand out, whether it is for a CAO application, a postgraduate course, or a scholarship.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#F0F9FF',
  },
  {
    icon: Award,
    title: 'Application Form Assistance',
    tagline: 'Answer every question with confidence and clarity',
    description: 'Competency questions, situational questions, motivation questions: UniBlueprint gives you structured, polished answers using the STAR method that demonstrate exactly what employers are looking for.',
    originalStd: 'From €20', trialStd: 'From €10',
    originalPrem: 'From €30', trialPrem: 'From €15',
    color: '#FFF7ED',
  },
  {
    icon: MessageSquare,
    title: 'Interview Preparation',
    tagline: 'Walk in prepared. Walk out confident.',
    description: 'UniBlueprint prepares you for the exact interview you are facing: predicted questions, model STAR answers, company research, and what to ask at the end. Premium includes a live mock interview with a Campus Handler.',
    originalStd: 'From €20', trialStd: 'From €10',
    originalPrem: 'From €30', trialPrem: 'From €15',
    color: '#FDF4FF',
  },
  {
    icon: Search,
    title: 'Job Search Support',
    tagline: 'Stop applying blindly. Start searching strategically.',
    description: 'UniBlueprint builds you a personalised job search strategy: the right platforms, the right search terms, the right outreach approach, and a realistic action plan based on your field, year, and goals.',
    originalStd: '€15', trialStd: '€8',
    originalPrem: '€22', trialPrem: '€11',
    color: '#F0F9FF',
  },
]

// ─── Course Compass tools ─────────────────────────────────────────────────────

const CC_TOOLS = [
  { name: 'Course Compass',         icon: Compass,       url: 'https://coursecompass.ie/course-compass',          desc: 'Find the right CAO course for you' },
  { name: 'Subject Interest Test',  icon: Linkedin,      url: 'https://coursecompass.ie/subject-interest-test',   desc: 'Discover what subjects you excel in' },
  { name: 'Learning Style Test',    icon: GraduationCap, url: 'https://coursecompass.ie/learning-style-test',     desc: 'Understand how you learn best' },
  { name: 'PLC Compass',            icon: Map,           url: 'https://coursecompass.ie/plc-compass-test',        desc: 'Explore PLC pathway options' },
  { name: 'Apprenticeship Compass', icon: Wrench,        url: 'https://coursecompass.ie/apprentice-compass-test', desc: 'Find the right apprenticeship' },
  { name: '5th & 6th Year Bundle',  icon: Package,       url: 'https://coursecompass.ie/bundles/senior-cycle',    desc: 'Full senior cycle guidance suite' },
]

// ─── Trust points ─────────────────────────────────────────────────────────────
// Consolidates what used to be a separate 4-card stats grid plus a
// standalone "why us" card into a single compact section — same message,
// far less scroll before the actual service list.
const TRUST_POINTS = [
  {
    icon: Sparkles,
    title: 'Real research, not a generic prompt',
    line: '7 months building around what Irish recruiters and ATS systems actually screen for, service by service.',
  },
  {
    icon: UserCheck,
    title: 'Checked by a real Campus Handler',
    line: 'Every submission is reviewed line by line by a trained person before it ever reaches you, not just AI output.',
  },
  {
    icon: Award,
    title: '30+ verified strengths',
    line: 'Matched against the same framework employers use to hire worldwide.',
  },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FoundationScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState(null)
  // From 11pm Saturday to 8am Monday the team is closed for the weekend, so
  // Premium's turnaround copy switches to Monday delivery and reverts
  // automatically once the window ends.
  const { isWeekendWindow } = useWeekendDeliveryCopy()

  return (
    <View style={styles.screen}>

      {/* ── Integrated header + hero (single navy block) ── */}
      <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Home</Text>
          </TouchableOpacity>
          <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
          {/* Spacer to balance the back button */}
          <View style={{ width: 70 }} />
        </View>

        <Text style={styles.heroEyebrow}>FOUNDATION BLUEPRINT</Text>
        <Text style={styles.heroTitle}>Professional Documents</Text>
        <Text style={styles.heroSub}>
          Built on real research into what Irish employers and ATS systems actually screen for, not a generic
          template. Every submission is checked by a real Campus Handler before it reaches you.
        </Text>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* Service tiers — the decision every request starts with, so it
              now leads the page instead of surfacing after several sections
              of supporting context. */}
          <View style={styles.tierBanner}>
            <View style={styles.tierBannerHeader}>
              <Text style={styles.tierBannerTitle}>Choose your turnaround</Text>
              <View style={styles.tierBannerBadge}>
                <Text style={styles.tierBannerBadgeText}>50% OFF LAUNCH PRICING</Text>
              </View>
            </View>
            <View style={styles.tierRow}>
              <View style={styles.tierBox}>
                <Text style={styles.tierLabel}>Standard</Text>
                <Text style={styles.tierValue}>48hr</Text>
                <Text style={styles.tierSub}>Full Campus Handler review</Text>
              </View>
              <View style={styles.tierSep} />
              <View style={styles.tierBox}>
                <View style={styles.tierPremiumLabelRow}>
                  <Zap size={11} color={colors.gold} fill={colors.gold} />
                  <Text style={styles.tierLabel}>Premium</Text>
                </View>
                <Text style={styles.tierValue}>{isWeekendWindow ? 'Monday' : 'Same day'}</Text>
                <Text style={styles.tierSub}>Priority + revisions included</Text>
              </View>
            </View>
          </View>

          {/* Consolidated trust section — what used to be a 4-card stats
              grid plus a separate "why us" card, now one compact block. */}
          <Card style={styles.trustCard}>
            {TRUST_POINTS.map(({ icon: Icon, title, line }, i) => (
              <View key={title} style={[styles.trustRow, i > 0 && styles.trustRowBorder]}>
                <View style={styles.trustIconWrap}>
                  <Icon size={17} color={colors.navy} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustTitle}>{title}</Text>
                  <Text style={styles.trustLine}>{line}</Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Entry point for the shared evidence bank — Application Form
              Assistance requires at least one story, and Interview
              Preparation uses it too, so it's surfaced right before the
              service list rather than only discovered mid-form. */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EvidenceBank')}
            style={styles.evidenceBankBanner}
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.evidenceBankTitle}>Your Evidence Bank</Text>
              <Text style={styles.evidenceBankSubtitle}>Real STAR stories that power Application Form Assistance and Interview Prep</Text>
            </View>
            <ChevronRight size={20} color={colors.navy} />
          </TouchableOpacity>

          <Text style={styles.servicesSubHeader}>Career Services</Text>
          <View style={{ gap: 14 }}>
            {CAREER_SERVICES.map(({ icon: Icon, title, tagline, description, originalStd, trialStd, originalPrem, trialPrem, color }) => (
              <TouchableOpacity
                key={title}
                activeOpacity={0.88}
                onPress={() => setSelected(selected === title ? null : title)}
              >
                <Card style={[styles.serviceCard, selected === title && styles.serviceCardActive]}>
                  <View style={styles.fiftyBadge}>
                    <Text style={styles.fiftyBadgeText}>50% OFF</Text>
                  </View>
                  <View style={styles.serviceCardTop}>
                    <View style={[styles.serviceIcon, { backgroundColor: color }]}>
                      <Icon size={20} color={colors.navy} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceTitle}>{title}</Text>
                      {tagline ? <Text style={styles.serviceTagline}>{tagline}</Text> : null}
                    </View>
                    <ChevronRight
                      size={16} color={colors.light}
                      style={{ transform: [{ rotate: selected === title ? '90deg' : '0deg' }] }}
                    />
                  </View>
                  {selected === title && (
                    <View style={styles.serviceExpanded}>
                      <Text style={styles.serviceDesc}>{description}</Text>
                      <View style={styles.pricingRow}>
                        <View style={styles.priceBox}>
                          <Text style={styles.priceBoxLabel}>Standard</Text>
                          <View style={styles.priceStack}>
                            <Text style={styles.priceOriginal}>{originalStd}</Text>
                            <Text style={styles.priceTrial}>{trialStd}</Text>
                          </View>
                          <Text style={styles.priceBoxSub}>Core service · 48hr</Text>
                        </View>
                        <View style={[styles.priceBox, styles.priceBoxPremium]}>
                          <Text style={[styles.priceBoxLabel, { color: colors.cream }]}>Premium</Text>
                          <View style={styles.priceStack}>
                            <Text style={[styles.priceOriginal, { color: 'rgba(245,240,232,0.5)' }]}>{originalPrem}</Text>
                            <Text style={[styles.priceTrial, { color: colors.cream }]}>{trialPrem}</Text>
                          </View>
                          <Text style={[styles.priceBoxSub, { color: 'rgba(245,240,232,0.6)' }]}>
                            {isWeekendWindow ? 'Priority + revisions, delivered by end of day Monday' : 'Priority + revisions · Same day'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.trialNote}>* Limited-time launch pricing, 50% off standard rates</Text>
                      <TouchableOpacity
                        style={styles.orderBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          // All 8 Foundation Blueprint services now have a real
                          // in-app intake, on the CV Optimisation reference
                          // pattern (QuestionFlow + Edge Function + Campus
                          // Handler review). Mailto is kept only as a fallback
                          // for any future service added before its builder
                          // screen exists.
                          const BUILDER_SCREEN_BY_TITLE = {
                            'CV Optimisation': 'CvBuilder',
                            'LinkedIn Optimisation': 'LinkedinBuilder',
                            'Cover Letter Assistance': 'CoverLetterBuilder',
                            'Application Form Assistance': 'ApplicationFormBuilder',
                            'Interview Preparation': 'InterviewPrepBuilder',
                            'Personal Statement': 'PersonalStatementBuilder',
                            'Portfolio Building': 'PortfolioPlanBuilder',
                            'Job Search Support': 'JobSearchSupportBuilder',
                          }
                          const builderScreen = BUILDER_SCREEN_BY_TITLE[title]
                          if (builderScreen) {
                            navigation.navigate(builderScreen)
                            return
                          }
                          Linking.openURL(`mailto:uniblueprintoperations@gmail.com?subject=${encodeURIComponent(`Order request: ${title}`)}&body=${encodeURIComponent(`Hi UniBlueprint,\n\nI'd like to order: ${title}\n\nHere's a bit about what I need:\n`)}`)
                        }}
                      >
                        <Text style={styles.orderBtnText}>Order {title} →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.servicesSubHeader, { marginTop: spacing.xl }]}>CAO & College Applications</Text>
          <Card style={styles.ccCard}>
            <View style={styles.ccCardHeader}>
              <Compass size={22} color={colors.navy} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.ccCardTitle}>Powered by CourseCompass</Text>
                <Text style={styles.ccCardSub}>AI-powered CAO course matching for young people across Ireland</Text>
              </View>
            </View>
            <Text style={styles.ccCardDesc}>
              CAO Personal Statements, College Interview Preparation, Scholarship Applications, and Course Selection Guidance are all handled in partnership with CourseCompass, Ireland's leading CAO platform.
            </Text>
            <View style={styles.ccToolGrid}>
              {CC_TOOLS.map(({ name, icon: Icon, url, desc }) => (
                <TouchableOpacity key={name} style={styles.ccTool} activeOpacity={0.8} onPress={() => Linking.openURL(url)}>
                  <View style={styles.ccToolIcon}><Icon size={16} color={colors.navy} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ccToolName}>{name}</Text>
                    <Text style={styles.ccToolDesc} numberOfLines={1}>{desc}</Text>
                  </View>
                  <ExternalLink size={12} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.ccVisitBtn} activeOpacity={0.8} onPress={() => Linking.openURL('https://coursecompass.ie/course-compass')}>
              <Compass size={15} color={colors.cream} />
              <Text style={styles.ccVisitBtnText}>Visit Course Compass →</Text>
            </TouchableOpacity>
          </Card>

          {/* Fallback contact — each service above already has its own
              Order button, so this is deliberately secondary now: it's
              for anything not covered by the list, not the main CTA. */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Foundation Blueprint request'))}
          >
            <Text style={styles.secondaryBtnText}>Something else in mind? Get in touch</Text>
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
    paddingBottom: spacing.xl + spacing.sm,
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
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22 },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed navy header on every platform — without
  // it, RN can size the ScrollView to its own content instead of the
  // available viewport, which is what let the header float over content.
  scrollView: { flex: 1 },
  scroll:   { },
  content:  { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Service tier banner — moved to the top of the page (previously a plain
  // pill row that appeared after a full stats grid). Same navy block
  // language as the hero and the Course Compass "visit" button.
  tierBanner: {
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: 18, marginBottom: 14, ...shadows.card,
  },
  tierBannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  tierBannerTitle:  { fontFamily: fonts.serif, fontSize: 17, color: colors.cream },
  tierBannerBadge:  { backgroundColor: colors.gold, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  tierBannerBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: colors.navy, letterSpacing: 0.3 },
  tierRow:  { flexDirection: 'row', alignItems: 'stretch' },
  tierBox:  { flex: 1, alignItems: 'center' },
  tierPremiumLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tierLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: 'rgba(245,240,232,0.55)', textTransform: 'uppercase', letterSpacing: 0.8 },
  tierValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, marginTop: 5 },
  tierSub:   { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(245,240,232,0.55)', marginTop: 4, textAlign: 'center', lineHeight: 15 },
  tierSep:   { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(245,240,232,0.18)', marginHorizontal: 10 },

  // Consolidated trust section — replaces what used to be a 4-card stats
  // grid plus a separate "why us" card.
  trustCard: { marginBottom: spacing.sm, padding: 6 },
  trustRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 8 },
  trustRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  trustIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  trustTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  trustLine:  { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },

  servicesSubHeader: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 12 },

  evidenceBankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: radius.card, padding: 16, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  evidenceBankTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  evidenceBankSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },

  // Service cards
  serviceCard:       { padding: 16 },
  serviceCardActive: { borderWidth: 1.5, borderColor: colors.navy },
  fiftyBadge:        { position: 'absolute', top: -9, right: 14, backgroundColor: colors.navy, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, ...shadows.card },
  fiftyBadgeText:    { fontFamily: fonts.sansSemiBold, fontSize: 9, color: colors.cream, letterSpacing: 0.3 },
  serviceCardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  serviceIcon:       { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceTitle:      { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  serviceTagline:    { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, fontStyle: 'italic', lineHeight: 17 },
  serviceExpanded:   { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  serviceDesc:       { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 14 },

  pricingRow:      { flexDirection: 'row', gap: 10 },
  priceBox:        { flex: 1, backgroundColor: colors.cream, borderRadius: radius.button, padding: 14, alignItems: 'center' },
  priceBoxPremium: { backgroundColor: colors.navy },
  priceBoxLabel:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  priceStack:      { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceOriginal:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textDecorationLine: 'line-through' },
  priceTrial:      { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  priceBoxSub:     { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center' },
  trialNote:       { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 10, fontStyle: 'italic' },

  orderBtn:     { backgroundColor: colors.navy, borderRadius: radius.button, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  orderBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  // Course Compass
  ccCard:       { padding: 18, marginBottom: 4 },
  ccCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  ccCardTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  ccCardSub:    { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  ccCardDesc:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 16 },
  ccToolGrid:   { gap: 10, marginBottom: 16 },
  ccTool:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.cream, borderRadius: radius.button, padding: 12 },
  ccToolIcon:   { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  ccToolName:   { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  ccToolDesc:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  ccVisitBtn:   { backgroundColor: colors.navy, borderRadius: radius.button, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ccVisitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  // Deliberately secondary — every service card above already has its own
  // Order button, so this fallback contact no longer needs to read as the
  // page's primary action.
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.button, height: 50,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.15)', marginTop: spacing.lg,
  },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
})
