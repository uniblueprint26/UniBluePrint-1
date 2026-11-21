import { useState, useCallback, useEffect } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  FileText, Linkedin, Award, MessageSquare, Search, Briefcase, PenLine,
  Compass, GraduationCap, Map, Wrench, Package, Archive, FolderOpen,
  ChevronRight, ExternalLink, Target, ClipboardList,
} from 'lucide-react-native'

import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import EnvelopeTile from '../components/foundation/EnvelopeTile'
import EnvelopeSheet from '../components/foundation/EnvelopeSheet'
import { SERVICE_LETTERS } from '../components/foundation/serviceLetters'
import { useWeekendDeliveryCopy } from '../hooks/useWeekendDeliveryCopy'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { FOUNDATION_WEBSITE_LINKS, foundationHandoffUrl } from '../constants/site'
import { NATIVE_NEUTRAL_BILLING } from '../constants/platformPolicy'
import { useFoundationOrdering } from '../hooks/useAppFlags'


// iOS: Foundation Blueprint services are pay-per-service digital documents
// (a CV, a cover letter, etc.) — App Store 3.1.1 — so no price, "Order"
// button or in-app submit path renders here on iOS, same decision and same
// conservative no-tappable-link pattern as PricingScreen's Pro/Premium
// gating (Platform.OS === 'ios'). On Android and web the order button hands
// the person to the service's page on uniblueprint.ie, where the questions
// are answered and the order is placed; the in-app builder screens stay
// registered but no button here opens them. Elevation
// Blueprint (ElevationScreen.jsx) is different: coaching sessions are a
// real-world service, exempt under 3.1.3(e), so that one links out instead
// of hiding — see CoachProfileScreen.jsx and constants/site.js.
// Update: neutral billing now covers Android as well (constants/platformPolicy.js),
// so on iOS and Android there is no order button here and no link to the website.
// IS_IOS keeps its old name but now means neutral billing.
const IS_IOS = NATIVE_NEUTRAL_BILLING

// ─── Career services ──────────────────────────────────────────────────────────
// Exported (same pattern as ElevationScreen's COACHES) so other real-data
// consumers — the Home dashboard's curated Spotlight carousel — can pull
// the same real tagline/description/pricing shown here, live, instead of
// duplicating or fabricating a second copy of this content.

export const CAREER_SERVICES = [
  {
    icon: FileText,
    title: 'CV Optimisation',
    tagline: 'A CV that opens doors, not one that gets ignored',
    description: 'A CV written for your industry and the role you want, built from your own experience. It uses a clean structure and plain text so automatic screening (ATS) can read it. Every output is reviewed by a trained Campus Handler before it reaches you.',
    priceStd: '€10',
    pricePrem: '€15',
    color: '#EFF6FF',
  },
  {
    icon: Briefcase,
    title: 'Portfolio Building',
    tagline: 'Show your work, not just tell it',
    description: 'A clear plan for the portfolio that suits your field: where to show your work, what to include and how to present it, built around what you already have. It is a plan for you to follow, reviewed by a trained Campus Handler.',
    priceStd: '€10',
    pricePrem: '€15',
    color: '#FEF9C3',
  },
  {
    icon: Linkedin,
    title: 'LinkedIn Optimisation',
    tagline: 'Turn your LinkedIn from invisible to irresistible',
    description: 'Profile text written for your target industry: a headline, an About section, your experience, skills to add and ideas for what to feature. Reviewed by a trained Campus Handler.',
    priceStd: '€10',
    pricePrem: '€15',
    color: '#EEF2FF',
  },
  {
    icon: FileText,
    title: 'Cover Letter Assistance',
    tagline: 'A cover letter that actually gets read',
    description: 'A cover letter written for one role at one company, from your own strongest point. It adds to your CV instead of repeating it. Reviewed by a trained Campus Handler.',
    priceStd: '€10',
    pricePrem: '€15',
    color: '#F0FDF4',
  },
  {
    icon: PenLine,
    title: 'Personal Statement',
    tagline: 'Tell your story in a way that actually lands',
    description: 'A personal statement for UCAS, a CAO mature application or a postgraduate course, written for your course and institution in your own voice. Reviewed by a trained Campus Handler.',
    priceStd: '€10',
    pricePrem: '€15',
    color: '#F0F9FF',
  },
  {
    icon: Award,
    title: 'Application Form Assistance',
    tagline: 'Answer every question with confidence and clarity',
    description: 'Drafted answers to your application form questions, built from your own saved Evidence Bank stories and shaped for what each question tests. Reviewed by a trained Campus Handler.',
    priceStd: 'From €10',
    pricePrem: 'From €15',
    color: '#FFF7ED',
  },
  {
    icon: MessageSquare,
    title: 'Interview Preparation',
    tagline: 'Walk in prepared. Walk out confident.',
    description: 'A prep pack for the exact interview you are facing: likely questions, model answers built from your own stories, and things to research about the company. Reviewed by a trained Campus Handler.',
    priceStd: 'From €10',
    pricePrem: 'From €15',
    color: '#FDF4FF',
  },
  {
    icon: Search,
    title: 'Job Search Support',
    tagline: 'Stop applying blindly. Start searching strategically.',
    description: 'A job search plan for your field and situation: the channels to use, real Irish platforms that fit, and a 7 day action plan to start on. Reviewed by a trained Campus Handler.',
    priceStd: '€8',
    pricePrem: '€11',
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

// ─── Where each service starts, and where its progress is tracked ─────────────
// `table` is the document table the service's output is stored in; the same
// mapping Career Readiness uses to read real progress from `submissions`, so a
// service ordered on the website shows its status here. `screen` is the
// in-app builder route. While ordering is closed the envelope's button opens
// it so a member can start and save a draft.
const BUILDER_BY_TITLE = {
  'CV Optimisation':             { screen: 'CvBuilder',               table: 'cv_documents' },
  'LinkedIn Optimisation':       { screen: 'LinkedinBuilder',         table: 'linkedin_documents' },
  'Cover Letter Assistance':     { screen: 'CoverLetterBuilder',      table: 'cover_letters' },
  'Application Form Assistance': { screen: 'ApplicationFormBuilder',  table: 'application_forms' },
  'Interview Preparation':       { screen: 'InterviewPrepBuilder',    table: 'interview_prep_packs' },
  'Personal Statement':          { screen: 'PersonalStatementBuilder', table: 'personal_statements' },
  'Portfolio Building':          { screen: 'PortfolioPlanBuilder',    table: 'portfolio_plans' },
  'Job Search Support':          { screen: 'JobSearchSupportBuilder', table: 'job_search_sessions' },
}
const DOCUMENT_TABLES = Object.values(BUILDER_BY_TITLE).map(b => b.table)

const GAP = 14

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FoundationScreen({ navigation, route }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  // Ordering opens in January. Until the flag says so, no order button shows
  // and a person can start their answers, which are saved as a draft.
  const { enabled: orderingOpen } = useFoundationOrdering()
  const [selected, setSelected] = useState(null)
  const [gridWidth, setGridWidth] = useState(0)
  const [rows, setRows] = useState([])
  // From 11pm Saturday to 8am Monday the team is closed for the weekend, so
  // Premium's turnaround copy switches to Monday delivery and reverts
  // automatically once the window ends.
  const { isWeekendWindow } = useWeekendDeliveryCopy()
  // Real progress only: the latest submission per service, read from the same
  // `submissions` table Career Readiness and My Outputs use. No row means
  // nothing is shown on that envelope.
  const loadProgress = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('document_table, document_id, stage, delivered_at, submitted_at')
        .eq('user_id', user.id)
        .in('document_table', DOCUMENT_TABLES)
        .order('submitted_at', { ascending: false })
      if (!error && Array.isArray(data)) setRows(data)
    } catch { /* leave envelopes without a status */ }
  }, [user?.id])
  useFocusEffect(useCallback(() => { loadProgress() }, [loadProgress]))

  // Search opens a service straight away: Foundation with params.open set to
  // the service title.
  const openTitle = route?.params?.open
  useEffect(() => {
    if (!openTitle) return
    const match = CAREER_SERVICES.find(sv => sv.title === openTitle)
    if (match) setSelected(match)
    navigation.setParams?.({ open: undefined })
  }, [openTitle])

  function progressFor(title) {
    const table = BUILDER_BY_TITLE[title]?.table
    const mine = rows.filter(r => r.document_table === table)
    if (mine.length === 0) return { status: null, row: null }
    // A delivered document is never downgraded by a newer pending one.
    const delivered = mine.find(r => r.stage === 'delivered')
    if (delivered) return { status: 'delivered', row: delivered }
    return { status: 'in_progress', row: mine[0] }
  }

  const tileWidth = gridWidth > 0 ? Math.floor((gridWidth - GAP) / 2) : 160

  // Android and web only. Never called on iOS, where Apple does not allow an
  // external purchase link (see IS_IOS above). A service with no website page
  // falls back to the contact page, never to pricing.
  function continueOnWebsite(title) {
    setSelected(null)
    Linking.openURL(foundationHandoffUrl(title)).catch(() => {})
  }

  function orderAction(title) {
    if (IS_IOS || !orderingOpen) return null
    const hasPage = !!FOUNDATION_WEBSITE_LINKS[title]
    return {
      label: hasPage ? 'Continue on uniblueprint.ie' : 'Contact us to order',
      external: true,
      helper: hasPage
        ? 'You will sign in with the same account and finish your order there. It shows up here when it is ready.'
        : 'Tell us which service you want and we will help you order it.',
      onPress: () => continueOnWebsite(title),
    }
  }

  function sheetActions(service) {
    const { status, row } = progressFor(service.title)
    // iOS: no order path in the app (App Store 3.1.1), only for a service the
    // user has not started. Viewing progress or a delivered document is fine.
    const order = orderAction(service.title)
    if (status === 'delivered' && row) {
      return {
        status,
        primary: {
          label: 'Open your document',
          onPress: () => {
            setSelected(null)
            navigation.navigate('OutputDetail', {
              documentTable: row.document_table,
              documentId: row.document_id,
              serviceName: service.title,
              deliveredAt: row.delivered_at,
            })
          },
        },
        secondary: order ? { label: 'Order another', onPress: order.onPress } : null,
      }
    }
    if (status === 'in_progress') {
      return {
        status,
        primary: { label: 'See where it is', onPress: () => { setSelected(null); navigation.navigate('MyOutputs') } },
        secondary: order ? { label: 'Order another', onPress: order.onPress } : null,
      }
    }
    if (!orderingOpen) {
      // Not open for orders yet. The builder saves a draft as the person goes.
      const builder = BUILDER_BY_TITLE[service.title]
      return {
        status: null,
        primary: builder
          ? { label: 'Start your answers', onPress: () => { setSelected(null); navigation.navigate(builder.screen) } }
          : null,
        secondary: null,
      }
    }
    return { status: null, primary: order, secondary: null }
  }

  const sheet = selected ? sheetActions(selected) : null

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle title="Foundation" subtitle="Your career documents, checked by a real person." />

        <View style={styles.content}>
          {/* Evidence Bank and Outputs, the two places your work is kept. */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('EvidenceBank')}
              accessibilityRole="button"
              accessibilityLabel="Evidence Bank"
            >
              <View style={styles.topIcon}>
                <Archive size={20} color={colors.textPrimary} strokeWidth={1.7} />
              </View>
              <Text style={styles.topTitle}>Evidence Bank</Text>
              <Text style={styles.topSub}>Your saved evidence</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyOutputs')}
              accessibilityRole="button"
              accessibilityLabel="Outputs"
            >
              <View style={styles.topIcon}>
                <FolderOpen size={20} color={colors.textPrimary} strokeWidth={1.7} />
              </View>
              <Text style={styles.topTitle}>Outputs</Text>
              <Text style={styles.topSub}>Finished documents</Text>
            </TouchableOpacity>
          </View>

          {/* The Foundation Blueprints: one sealed envelope per service. */}
          <Text style={styles.sectionTitle}>Foundation Blueprints</Text>
          <Text style={styles.sectionSub}>Tap an envelope to open it.</Text>
          <View style={styles.grid} onLayout={e => setGridWidth(e.nativeEvent.layout.width)}>
            {CAREER_SERVICES.map(service => (
              <EnvelopeTile
                key={service.title}
                title={service.title}
                Icon={service.icon}
                status={progressFor(service.title).status}
                width={tileWidth}
                onPress={() => setSelected(service)}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>
          <Text style={styles.note}>Every document is checked by a real Campus Handler before it reaches you.</Text>

          {/* Also in Foundation */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Keep going</Text>
          <View style={styles.list}>
            <TouchableOpacity style={styles.rowCard} activeOpacity={0.85} onPress={() => navigation.navigate('CareerReadiness')} accessibilityRole="button">
              <View style={styles.rowIcon}><Target size={18} color={colors.textPrimary} strokeWidth={1.8} /></View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Career Readiness</Text>
                <Text style={styles.rowSub}>See your progress across all eight Blueprints.</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.rowCard} activeOpacity={0.85} onPress={() => navigation.navigate('ApplicationTracker')} accessibilityRole="button">
              <View style={styles.rowIcon}><ClipboardList size={18} color={colors.textPrimary} strokeWidth={1.8} /></View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Application Tracker</Text>
                <Text style={styles.rowSub}>Track what you have sent.</Text>
              </View>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Reference Desk. Course Compass opens in-app, branded in
              CourseCompass's own identity; the rest hand off to
              coursecompass.ie directly. */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Reference Desk</Text>
          <Text style={styles.sectionSub}>Powered by our partner, CourseCompass</Text>
          <View style={styles.list}>
            {CC_TOOLS.map(({ name, icon: Icon, url, desc, screen }) => (
              <TouchableOpacity
                key={name}
                style={styles.rowCard}
                activeOpacity={0.85}
                onPress={() => (screen ? navigation.navigate(screen) : Linking.openURL(url))}
                accessibilityRole="button"
              >
                <View style={styles.rowIcon}><Icon size={18} color={colors.textPrimary} strokeWidth={1.7} /></View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{desc}</Text>
                </View>
                {screen
                  ? <ChevronRight size={16} color={colors.textSecondary} />
                  : <ExternalLink size={14} color={colors.textSecondary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Fallback contact for anything the services above do not cover. */}
          <TouchableOpacity
            style={styles.contact}
            activeOpacity={0.7}
            onPress={() => Linking.openURL('mailto:support@uniblueprint.ie?subject=' + encodeURIComponent('Foundation Blueprint request'))}
            accessibilityRole="button"
          >
            <Text style={styles.contactText}>Something else in mind? Get in touch</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {selected ? (
        <EnvelopeSheet
          key={selected.title}
          service={{ ...selected, Icon: selected.icon, letter: SERVICE_LETTERS[selected.title] }}
          status={sheet.status}
          isIOS={IS_IOS}
          orderingOpen={orderingOpen}
          weekend={isWeekendWindow}
          primary={sheet.primary}
          secondary={sheet.secondary}
          onClose={() => setSelected(null)}
          colors={colors}
          isDark={isDark}
        />
      ) : null}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: spacing.md },

    topRow: { flexDirection: 'row', gap: 12 },
    topCard: {
      flex: 1, minHeight: 136, backgroundColor: colors.surface, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: colors.border, justifyContent: 'flex-end',
    },
    topIcon: {
      position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.tabFill, alignItems: 'center', justifyContent: 'center',
    },
    topTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.textPrimary },
    topSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },

    sectionTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary, marginTop: spacing.xl },
    sectionSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: spacing.md },
    note: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: 12 },

    list: { gap: 10, marginTop: spacing.md },
    rowCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    rowIcon: {
      width: 38, height: 38, borderRadius: 12, backgroundColor: colors.tabFill,
      alignItems: 'center', justifyContent: 'center',
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },
    rowSub: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },

    contact: { alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.sm },
    contactText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textSecondary },
  })
}
