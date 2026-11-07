import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, Linkedin, Award, MessageSquare, Search, Briefcase, PenLine,
  Compass, GraduationCap, Map, Wrench, Package, Archive, FolderOpen,
  ChevronLeft, ChevronRight, Sparkles, ExternalLink,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import { useWeekendDeliveryCopy } from '../hooks/useWeekendDeliveryCopy'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

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
  // Course Compass itself opens in-app, on a screen branded in CourseCompass's
  // own identity (navy/sky/orange, Crimson Pro + Outfit) rather than UBP's
  // navy/cream — see CompassScreen.jsx + src/constants/partnerBrands.js. The
  // rest still hand off to coursecompass.ie directly, same as before.
  { name: 'Course Compass',         icon: Compass,       url: 'https://coursecompass.ie/course-compass', screen: 'Compass', desc: 'Find the right CAO course for you' },
  { name: 'Subject Interest Test',  icon: Linkedin,      url: 'https://coursecompass.ie/subject-interest-test',   desc: 'Discover what subjects you excel in' },
  { name: 'Learning Style Test',    icon: GraduationCap, url: 'https://coursecompass.ie/learning-style-test',     desc: 'Understand how you learn best' },
  { name: 'PLC Compass',            icon: Map,           url: 'https://coursecompass.ie/plc-compass-test',        desc: 'Explore PLC pathway options' },
  { name: 'Apprenticeship Compass', icon: Wrench,        url: 'https://coursecompass.ie/apprentice-compass-test', desc: 'Find the right apprenticeship' },
  { name: '5th & 6th Year Bundle',  icon: Package,       url: 'https://coursecompass.ie/bundles/senior-cycle',    desc: 'Full senior cycle guidance suite' },
]

// ─── Editorial stats ──────────────────────────────────────────────────────────

const FOUNDATION_STATS = [
  {
    stat: '7 months in the making.',
    line: 'Built and refined for how Irish recruiters and ATS systems actually hire.',
  },
  {
    stat: '8 services. 1 standard.',
    line: 'CVs, cover letters, personal statements, LinkedIn profiles, portfolios, application forms and more. Every one built to get you noticed.',
  },
  {
    stat: '30+ verified strengths.',
    line: 'Matched against the same strengths framework employers use to hire worldwide.',
  },
  {
    stat: 'Reviewed by real people.',
    line: 'Every submission gets eyes from a real Campus Handler before it reaches you.',
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
          >
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Home</Text>
          </TouchableOpacity>
          <UBPLogo height={30} color={colors.cream} />
          {/* Spacer to balance the back button */}
          <View style={{ width: 70 }} />
        </View>

        <Text style={styles.heroEyebrow}>FOUNDATION BLUEPRINT</Text>
        <Text style={styles.heroTitle}>Professional Documents</Text>
        <Text style={styles.heroSub}>
          CVs, cover letters, personal statements, LinkedIn profiles, portfolios, interview prep, and application forms.
          Every output reviewed by a Campus Handler before it reaches you.
        </Text>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* "Your Library" archive shelf — Evidence Bank + My Outputs
              promoted up here, above everything else, instead of the
              Evidence Bank banner being the only entry point further down. */}
          <View style={styles.shelfRow}>
            <TouchableOpacity
              style={styles.shelfCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('EvidenceBank')}
            >
              <View style={styles.shelfIcon}>
                <Archive size={17} color={colors.navy} strokeWidth={1.7} />
              </View>
              <Text style={styles.shelfTitle}>Evidence Bank</Text>
              <Text style={styles.shelfSub}>Your STAR stories, archived</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shelfCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyOutputs')}
            >
              <View style={styles.shelfIcon}>
                <FolderOpen size={17} color={colors.navy} strokeWidth={1.7} />
              </View>
              <Text style={styles.shelfTitle}>My Outputs</Text>
              <Text style={styles.shelfSub}>Everything delivered to you</Text>
            </TouchableOpacity>
          </View>

          {/* Editorial confidence stats */}
          <View style={styles.foundationStatsGrid}>
            {FOUNDATION_STATS.map(({ stat, line }, i) => (
              <View key={i} style={styles.foundationStatCard}>
                <Text style={styles.foundationStatValue}>{stat}</Text>
                <Text style={styles.foundationStatLine}>{line}</Text>
              </View>
            ))}
          </View>

          {/* Turnaround tiers */}
          <View style={styles.turnaroundRow}>
            <View style={styles.turnaroundChip}>
              <Text style={styles.turnaroundLabel}>Standard</Text>
              <Text style={styles.turnaroundValue}>48hr</Text>
            </View>
            <View style={styles.turnaroundSep} />
            <View style={styles.turnaroundChip}>
              <Text style={styles.turnaroundLabel}>Premium</Text>
              <Text style={styles.turnaroundValue}>{isWeekendWindow ? 'Monday' : 'Same day'}</Text>
            </View>
          </View>

          <View style={styles.trialBanner}>
            <Sparkles size={14} color={colors.cream} />
            <Text style={styles.trialBannerText}>September Trial: 50% off every service</Text>
          </View>

          {/* Why not just use a generic AI tool yourself */}
          <Card style={styles.whyCard}>
            <Text style={styles.whyTitle}>Not a prompt you type in and hope.</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {[
                'A generic AI tool gives everyone the same generic output, with no idea what Irish employers or ATS systems actually screen for.',
                'Every UniBlueprint output is built, then checked line by line by a real trained Campus Handler before it ever reaches you.',
                'That is the difference between a document that looks fine and one that actually gets you shortlisted.',
              ].map((line, i) => (
                <View key={i} style={styles.whyRow}>
                  <View style={styles.whyDot} />
                  <Text style={styles.whyText}>{line}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* ── The Index — file cards, one per service, each a small
              folder-tab index number + stacked-paper shadow + both price
              tiers shown side by side. Tap to expand the full description
              and order CTA — same data and order flow as before, just
              presented as an archive of files rather than a plain list. ── */}
          <View style={styles.indexLabelWrap}>
            <Text style={styles.servicesSubHeader}>The Index</Text>
            <Text style={styles.indexHeadline}>Eight services, one library</Text>
          </View>
          <View style={{ gap: 22 }}>
            {CAREER_SERVICES.map(({ icon: Icon, title, tagline, description, originalStd, trialStd, originalPrem, trialPrem, color }, i) => {
              const expanded = selected === title
              const rotation = i % 2 === 0 ? (i % 4 === 0 ? 1.1 : 0.9) : (i % 4 === 1 ? -1 : -1.2)
              return (
                <TouchableOpacity
                  key={title}
                  activeOpacity={0.9}
                  onPress={() => setSelected(expanded ? null : title)}
                >
                  <View style={styles.fileCardWrap}>
                    {/* Stacked-paper shadow card behind the real one */}
                    <View style={[styles.fileCardBehind, { transform: [{ rotate: `${rotation}deg` }] }]} />
                    <View style={[styles.fileCard, expanded && styles.fileCardActive]}>
                      <View style={styles.fileTab}>
                        <Text style={styles.fileTabText}>N°{String(i + 1).padStart(2, '0')}</Text>
                      </View>
                      <View style={styles.fiftyBadge}>
                        <Text style={styles.fiftyBadgeText}>50% OFF</Text>
                      </View>

                      <View style={styles.fileHeadRow}>
                        <View style={[styles.serviceIcon, { backgroundColor: color }]}>
                          <Icon size={18} color={colors.navy} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fileTitle}>{title}</Text>
                          {tagline ? <Text style={styles.fileTagline}>{tagline}</Text> : null}
                        </View>
                        <ChevronRight
                          size={15} color={colors.light}
                          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
                        />
                      </View>

                      {/* Both tiers, always visible, side by side */}
                      <View style={styles.fileTierRow}>
                        <View style={styles.tierTile}>
                          <Text style={styles.tierPrice}>{trialStd}</Text>
                          <Text style={styles.tierLabel}>Standard</Text>
                        </View>
                        <View style={[styles.tierTile, styles.tierTilePremium]}>
                          <Text style={[styles.tierPrice, styles.tierPricePremium]}>{trialPrem}</Text>
                          <Text style={[styles.tierLabel, styles.tierLabelPremium]}>Premium</Text>
                        </View>
                      </View>

                      {expanded && (
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
                          <Text style={styles.trialNote}>* September trial prices, 50% off standard rates</Text>
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
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* ── Reference Desk — same premium file-card treatment as the
              index above (white card, border, shadow, icon tile), not the
              old muted/flat tool-row list. Course Compass opens in-app,
              branded in CourseCompass's own identity; the rest hand off to
              coursecompass.ie directly. ── */}
          <View style={[styles.indexLabelWrap, { marginTop: spacing.xl }]}>
            <Text style={styles.servicesSubHeader}>The Reference Desk</Text>
            <Text style={styles.indexHeadline}>Powered by our partner, CourseCompass</Text>
          </View>
          <View style={{ gap: 10 }}>
            {CC_TOOLS.map(({ name, icon: Icon, url, desc, screen }) => (
              <TouchableOpacity
                key={name}
                style={styles.deskCard}
                activeOpacity={0.85}
                onPress={() => (screen ? navigation.navigate(screen) : Linking.openURL(url))}
              >
                <View style={styles.deskIcon}>
                  <Icon size={18} color={colors.navy} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.deskTitle}>{name}</Text>
                  <Text style={styles.deskSub} numberOfLines={1}>{desc}</Text>
                </View>
                {screen
                  ? <ChevronRight size={15} color={colors.navy} strokeWidth={2} />
                  : <ExternalLink size={13} color={colors.muted} />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.ccVisitBtn, { marginTop: 4 }]} activeOpacity={0.8} onPress={() => Linking.openURL('https://coursecompass.ie/course-compass')}>
            <Compass size={15} color={colors.cream} />
            <Text style={styles.ccVisitBtnText}>Visit Course Compass →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent('Foundation Blueprint request'))}
          >
            <Text style={styles.primaryBtnText}>Submit a Request</Text>
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

  scroll:   { },
  content:  { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Foundation editorial stats grid
  foundationStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  foundationStatCard: {
    width: '48.5%', backgroundColor: colors.white, borderRadius: radius.card,
    padding: 16, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card,
  },
  foundationStatValue: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, lineHeight: 26, marginBottom: 8 },
  foundationStatLine:  { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18 },

  // Turnaround tiers
  turnaroundRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 32, backgroundColor: colors.navy, borderRadius: radius.card,
    paddingVertical: 16, marginBottom: 14,
  },
  turnaroundChip:  { alignItems: 'center' },
  turnaroundLabel: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: 'rgba(245,240,232,0.5)', textTransform: 'uppercase', letterSpacing: 0.9 },
  turnaroundValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.cream, marginTop: 3 },
  turnaroundSep:   { width: 1, height: 36, backgroundColor: 'rgba(245,240,232,0.18)' },

  trialBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  trialBannerText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  servicesSubHeader: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 3 },

  // Archive shelf — Evidence Bank + My Outputs
  shelfRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  shelfCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.card, padding: 16,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card,
  },
  shelfIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(30,58,95,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  shelfTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy },
  shelfSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 3, lineHeight: 15 },

  whyCard: { marginTop: spacing.lg, padding: 18 },
  whyTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },
  whyRow: { flexDirection: 'row', gap: 10 },
  whyDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.navy, marginTop: 7, flexShrink: 0 },
  whyText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },

  // "The Index" file cards — stacked-paper, folder-tab index number
  indexLabelWrap: { marginBottom: 14 },
  indexHeadline: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, marginTop: 1 },

  fileCardWrap: { position: 'relative' },
  fileCardBehind: {
    position: 'absolute', top: 7, left: 8, right: -8, bottom: -7,
    backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(30,58,95,0.06)',
    borderRadius: radius.card,
  },
  fileCard: {
    position: 'relative', backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', borderRadius: radius.card,
    padding: 16, paddingTop: 18, ...shadows.card,
  },
  fileCardActive: { borderWidth: 1.5, borderColor: colors.navy },
  fileTab: {
    position: 'absolute', top: -9, left: 16,
    backgroundColor: colors.navy, borderRadius: 5,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  fileTabText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.cream, letterSpacing: 0.4 },
  fiftyBadge:        { position: 'absolute', top: -9, right: 14, backgroundColor: colors.navy, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, ...shadows.card },
  fiftyBadgeText:    { fontFamily: fonts.sansSemiBold, fontSize: 9, color: colors.cream, letterSpacing: 0.3 },
  fileHeadRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6 },
  serviceIcon:       { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileTitle:         { fontFamily: fonts.serif, fontSize: 17, color: colors.navy },
  fileTagline:       { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },

  // Side-by-side price tiles — always visible, not stacked/expanded-only
  fileTierRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tierTile: { flex: 1, backgroundColor: colors.cream, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center' },
  tierTilePremium: { backgroundColor: 'rgba(201,162,75,0.12)', borderWidth: 1, borderColor: 'rgba(201,162,75,0.4)' },
  tierPrice: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  tierPricePremium: { color: '#A5813B' },
  tierLabel: { fontFamily: fonts.sansSemiBold, fontSize: 8.5, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  tierLabelPremium: { color: '#A5813B' },

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

  // Reference Desk — same premium card treatment as the file index above
  deskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    borderRadius: radius.card, padding: 14, ...shadows.card,
  },
  deskIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(30,58,95,0.06)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  deskTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  deskSub: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, marginTop: 1 },
  ccVisitBtn:   { backgroundColor: colors.navy, borderRadius: radius.button, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  ccVisitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  primaryBtn:     { backgroundColor: colors.navy, borderRadius: radius.button, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
