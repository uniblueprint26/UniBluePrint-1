import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, Linkedin, Award, MessageSquare, Search,
  Compass, GraduationCap, Map, Wrench, Package,
  ChevronLeft, ChevronRight, Sparkles, ExternalLink,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Career services ──────────────────────────────────────────────────────────

const CAREER_SERVICES = [
  {
    icon: FileText,
    title: 'CV Optimisation',
    tagline: 'A CV that opens doors — not one that gets ignored',
    description: 'Your CV is the first thing every employer sees. UniBlueprint builds you a professional, tailored CV — structured correctly, worded powerfully, and formatted to pass applicant tracking systems. Every output is reviewed by a trained Campus Handler before it reaches you.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#EFF6FF',
  },
  {
    icon: Linkedin,
    title: 'LinkedIn Optimisation',
    tagline: 'Turn your LinkedIn from invisible to irresistible',
    description: 'Recruiters search LinkedIn every day. UniBlueprint optimises your entire profile — headline, about section, experience, skills, and featured section — so you show up in searches and make the right impression.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#EEF2FF',
  },
  {
    icon: FileText,
    title: 'Cover Letter Assistance',
    tagline: 'A cover letter that actually gets read',
    description: 'Most cover letters are ignored because they are generic. UniBlueprint writes you a tailored, compelling cover letter for a specific role or company — one that adds to your CV rather than repeating it.',
    originalStd: '€20', trialStd: '€10',
    originalPrem: '€30', trialPrem: '€15',
    color: '#F0FDF4',
  },
  {
    icon: Award,
    title: 'Application Form Assistance',
    tagline: 'Answer every question with confidence and clarity',
    description: 'Competency questions, situational questions, motivation questions — UniBlueprint gives you structured, polished answers using the STAR method that demonstrate exactly what employers are looking for.',
    originalStd: 'From €20', trialStd: 'From €10',
    originalPrem: 'From €30', trialPrem: 'From €15',
    color: '#FFF7ED',
  },
  {
    icon: MessageSquare,
    title: 'Interview Preparation',
    tagline: 'Walk in prepared. Walk out confident.',
    description: 'UniBlueprint prepares you for the exact interview you are facing — predicted questions, model STAR answers, company research, and what to ask at the end. Premium includes a live mock interview with a Campus Handler.',
    originalStd: 'From €20', trialStd: 'From €10',
    originalPrem: 'From €30', trialPrem: 'From €15',
    color: '#FDF4FF',
  },
  {
    icon: Search,
    title: 'Job Search Support',
    tagline: 'Stop applying blindly. Start searching strategically.',
    description: 'UniBlueprint builds you a personalised job search strategy — the right platforms, the right search terms, the right outreach approach, and a realistic action plan based on your field, year, and goals.',
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

// ─── Editorial stats ──────────────────────────────────────────────────────────

const FOUNDATION_STATS = [
  {
    stat: '7 months in the making.',
    line: 'Built and refined for how Irish recruiters and ATS systems actually hire.',
  },
  {
    stat: '8 documents. 1 standard.',
    line: 'CV, cover letter, LinkedIn, interview prep, personal statement and more. Every one built to get you noticed.',
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
          CVs, cover letters, LinkedIn profiles, interview prep, and application forms.
          Every output reviewed by a Campus Handler before it reaches you.
        </Text>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

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
              <Text style={styles.turnaroundValue}>Same day</Text>
            </View>
          </View>

          <View style={styles.trialBanner}>
            <Sparkles size={14} color={colors.cream} />
            <Text style={styles.trialBannerText}>September Trial — 50% off every service</Text>
          </View>

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
                          <Text style={[styles.priceBoxSub, { color: 'rgba(245,240,232,0.6)' }]}>Priority + revisions · Same day</Text>
                        </View>
                      </View>
                      <Text style={styles.trialNote}>* September trial prices — 50% off standard rates</Text>
                      <TouchableOpacity style={styles.orderBtn} activeOpacity={0.8}>
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
              CAO Personal Statements, College Interview Preparation, Scholarship Applications, and Course Selection Guidance are all handled in partnership with CourseCompass — Ireland's leading CAO platform.
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

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
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

  servicesSubHeader: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 12 },

  // Service cards
  serviceCard:       { padding: 16 },
  serviceCardActive: { borderWidth: 1.5, borderColor: colors.navy },
  fiftyBadge:        { position: 'absolute', top: 12, right: 12, backgroundColor: colors.navy, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
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

  primaryBtn:     { backgroundColor: colors.navy, borderRadius: radius.button, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
