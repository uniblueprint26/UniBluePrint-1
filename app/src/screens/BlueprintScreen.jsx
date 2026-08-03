import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import {
  FileText, Target, Award, Linkedin, MessageSquare, Search,
  BookOpen, GraduationCap, Compass, Map, Wrench, Package,
  User, Users, MapPin, ChevronRight, Clock, Sparkles, ExternalLink,
} from 'lucide-react-native'

import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Foundation Blueprint — Career services ───────────────────────────────────
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
  { name: 'Course Compass',         icon: Compass,         url: 'https://coursecompass.ie/course-compass',          desc: 'Find the right CAO course for you' },
  { name: 'Subject Interest Test',  icon: Linkedin,        url: 'https://coursecompass.ie/subject-interest-test',   desc: 'Discover what subjects you excel in' },
  { name: 'Learning Style Test',    icon: GraduationCap,   url: 'https://coursecompass.ie/learning-style-test',     desc: 'Understand how you learn best' },
  { name: 'PLC Compass',            icon: Map,             url: 'https://coursecompass.ie/plc-compass-test',        desc: 'Explore PLC pathway options' },
  { name: 'Apprenticeship Compass', icon: Wrench,          url: 'https://coursecompass.ie/apprentice-compass-test', desc: 'Find the right apprenticeship' },
  { name: '5th & 6th Year Bundle',  icon: Package,         url: 'https://coursecompass.ie/bundles/senior-cycle',    desc: 'Full senior cycle guidance suite' },
]

// ─── Elevation Blueprint — Services ──────────────────────────────────────────
const ELEVATION_SERVICES = [
  {
    icon: Sparkles,
    title: 'Personal Branding Support',
    desc: 'Build a consistent, professional online presence that gets you noticed. We help you define your story, optimise your LinkedIn, and communicate your value clearly across every platform.',
    color: '#EFF6FF',
  },
  {
    icon: Users,
    title: 'Network Assistance',
    desc: 'Strategic guidance on building and activating your professional network — outreach templates, connection strategy, and how to turn conversations into opportunities.',
    color: '#F0FDF4',
  },
  {
    icon: Package,
    title: 'Portfolio Building',
    desc: 'Showcase your projects, skills, and achievements in a format that employers and clients actually engage with. We help you build a portfolio that complements your CV.',
    color: '#FFF7ED',
  },
  {
    icon: Target,
    title: 'Mentorship Matching',
    desc: 'Get paired with an experienced professional or senior student in your field for ongoing guidance, accountability, and real-world perspective throughout your college journey.',
    color: '#FDF4FF',
  },
  {
    icon: MessageSquare,
    title: 'Pitch & Presentation Coaching',
    desc: 'Whether it\'s a job interview, a startup pitch, or a college presentation — we help you structure your message, practise delivery, and walk in with confidence.',
    color: '#F0F9FF',
  },
  {
    icon: GraduationCap,
    title: 'Postgrad Support',
    desc: 'Thinking about a Master\'s, PhD, or professional qualification? We help you navigate applications, personal statements, funding options, and the decision itself.',
    color: '#FEF9C3',
  },
]

// ─── Elevation Blueprint — Coaches ───────────────────────────────────────────
const FILTER_PILLS = ['All', 'Fitness', 'Nutrition', 'Academic Grinds', 'Trading', 'Branding', 'Marketing', 'Career', 'Network', 'Creative', 'Sports', 'Music', 'Postgrad']

const COACHES = [
  {
    id: 1, name: 'Emmanuel Fasanmi', category: 'Academic Grinds', filter: 'Academic Grinds',
    location: 'Dublin, Ireland', rating: '4.9', reviews: 24, from: 'Pricing TBC',
    services: ['Maths Grinds', 'Physics Grinds', 'Biology Grinds'],
    bio: 'Emmanuel offers one-to-one and small group grinds in Maths, Physics, and Biology for Leaving Certificate and university students across Dublin. Sessions are structured, focused, and built around where you actually need to improve.',
  },
  {
    id: 2, name: 'JMC Fitness', category: 'Sports Coaching', filter: 'Sports',
    location: 'North Dublin', rating: '5.0', reviews: 41,
    from: 'From €50/hr',
    services: ['12-Week Online Plan', 'In-Person Training', 'Football Coaching', 'Analytics Breakdown', 'Dietary Guidance', 'Agent Connections'],
    bio: 'Elite sports coaching offering fully personalised programmes. 12-week online plan €300. In-person sessions €50/hr on North Dublin 4G Astro. Analytics breakdown €100. Football coaching and professional agent connections available.',
    pricelist: [
      { label: '12-Week Online Plan', price: '€300' },
      { label: 'In-Person Session (1hr)', price: '€50' },
      { label: 'Analytics Breakdown', price: '€100' },
    ],
  },
  {
    id: 3, name: 'Nathan Yanzo (Nyz3ditz)', category: 'Photography & Video', filter: 'Creative',
    location: 'Ireland', rating: '4.9', reviews: 19,
    from: 'From €55/month',
    services: ['Monthly Mentorship', '1-1 Shoot Session', 'Editing Guidance', 'Creative Direction'],
    bio: 'Professional photographer and videographer. Monthly subscription €55/month (Zoom calls + editing guidance). 1-1 shoot session €90 (lighting, composition). WhatsApp: +353 85 7272 875 · @Nyz3ditz',
    pricelist: [
      { label: 'Monthly Subscription', price: '€55/month' },
      { label: '1-1 Shoot Session', price: '€90' },
    ],
  },
  {
    id: 4, name: 'Daniel Gough', category: 'Trading & Finance', filter: 'Trading',
    location: 'Ireland', rating: '4.8', reviews: 17, from: 'From €40',
    services: ['Trading Fundamentals', 'Portfolio Strategy', '1-to-1 Sessions'],
    bio: 'Active trader breaking down markets and investment strategy for students starting their financial journey.',
  },
  {
    id: 5, name: 'Ali', category: 'Personal Training', filter: 'Fitness',
    location: 'Ireland', rating: '4.9', reviews: 31, from: 'From €35',
    services: ['Personal Training', 'Training Plans', 'Form Coaching'],
    bio: 'Certified personal trainer building strength, fitness, and consistency into student lifestyle.',
  },
  {
    id: 6, name: 'Emmanuel Tolic', category: 'Online Coaching', filter: 'Fitness',
    location: 'Remote', rating: '5.0', reviews: 22, from: 'From €20',
    services: ['Online Coaching', 'Goal Setting', 'Weekly Check-ins'],
    bio: 'Results-driven online coach helping students build structure, accountability, and momentum.',
  },
  {
    id: 7, name: 'Shauna Rogers', category: 'Fitness Coaching', filter: 'Fitness',
    location: 'Ireland', rating: '4.8', reviews: 28, from: 'From €30',
    services: ['Fitness Coaching', 'Training Plans', 'Lifestyle Support'],
    bio: 'Fitness coach specialising in helping students build sustainable habits around college life.',
  },
  {
    id: 8, name: 'Alex Leva', category: 'Digital Marketing', filter: 'Marketing',
    location: 'Ireland', rating: '4.9', reviews: 35, from: 'From €40',
    services: ['Social Media Strategy', 'Content Creation', 'Brand Building'],
    bio: 'Digital marketing specialist helping students and early-stage founders grow their presence online.',
  },
  {
    id: 9, name: 'Ethan Henry', category: 'Guitar Lessons', filter: 'Music',
    location: 'Ireland', rating: '5.0', reviews: 14, from: 'From €25',
    services: ['Beginner Guitar', 'Music Theory', '1-to-1 Lessons'],
    bio: 'Experienced guitarist offering structured lessons for beginners through to intermediate players.',
  },
  {
    id: 10, name: 'Nikola Jurek', category: 'Personal Branding', filter: 'Branding',
    location: 'Ireland', rating: '4.8', reviews: 21, from: 'From €40',
    services: ['LinkedIn Optimisation', 'Brand Strategy', 'Online Presence'],
    bio: 'Personal branding coach helping students define and communicate their professional identity with confidence.',
  },
  {
    id: 11, name: 'Fayed', category: 'Strategic Networking', filter: 'Network',
    location: 'Ireland', rating: '4.7', reviews: 13, from: 'From €30',
    services: ['Network Audit', 'Outreach Templates', 'Connection Strategy'],
    bio: 'Strategic networking specialist helping students build genuine professional connections that open doors.',
  },
  {
    id: 12, name: 'Milan', category: 'Strength Coaching', filter: 'Fitness',
    location: 'Ireland', rating: '4.9', reviews: 26, from: 'From €35',
    services: ['Strength Programming', 'Powerlifting', 'Progressive Overload'],
    bio: 'Strength coach building progressive training programmes for students serious about performance gains.',
  },
  {
    id: 13, name: 'Jayden Reynolds', category: 'Nutrition', filter: 'Nutrition',
    location: 'Ireland', rating: '4.8', reviews: 18, from: 'From €30',
    services: ['Nutrition Plans', 'Meal Prep Guidance', 'Sports Nutrition'],
    bio: 'Certified nutritionist creating practical, student-friendly plans that fuel performance without breaking the bank.',
  },
  {
    id: 14, name: 'Stephen McKeown', category: 'Career Guidance', filter: 'Career',
    location: 'Ireland', rating: '4.9', reviews: 32, from: 'From €25',
    services: ['Career Planning', 'Interview Prep', 'Graduate Pathways'],
    bio: 'Career advisor with extensive experience guiding students from final year into graduate roles across Ireland.',
  },
]

// ─── Foundation tab ───────────────────────────────────────────────────────────
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
          <Text style={styles.statNumber}>48 hrs</Text>
          <Text style={styles.statLabel}>Standard Turnaround</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.9★</Text>
          <Text style={styles.statLabel}>Avg. Rating</Text>
        </View>
      </View>

      {/* Trial badge */}
      <View style={styles.trialBanner}>
        <Sparkles size={14} color={colors.cream} />
        <Text style={styles.trialBannerText}>September Trial — 50% off every service</Text>
      </View>

      {/* Career services */}
      <Text style={styles.servicesSubHeader}>Career Services</Text>
      <View style={{ gap: 14 }}>
        {CAREER_SERVICES.map(({ icon: Icon, title, tagline, description, originalStd, trialStd, originalPrem, trialPrem, color }) => (
          <TouchableOpacity
            key={title}
            activeOpacity={0.88}
            onPress={() => setSelected(selected === title ? null : title)}
          >
            <Card style={[styles.serviceCard, selected === title && styles.serviceCardActive]}>
              {/* 50% OFF badge */}
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
                  size={16}
                  color={colors.light}
                  style={{ transform: [{ rotate: selected === title ? '90deg' : '0deg' }] }}
                />
              </View>

              {selected === title && (
                <View style={styles.serviceExpanded}>
                  <Text style={styles.serviceDesc}>{description}</Text>

                  {/* Pricing: strikethrough original, bold trial */}
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

      {/* CAO section — handled by Course Compass */}
      <Text style={[styles.servicesSubHeader, { marginTop: spacing.xl }]}>CAO & College Applications</Text>

      <Card style={styles.ccCard}>
        <View style={styles.ccCardHeader}>
          <Compass size={22} color={colors.navy} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.ccCardTitle}>Powered by CourseCompass</Text>
            <Text style={styles.ccCardSub}>AI-powered CAO course matching for Irish students</Text>
          </View>
        </View>

        <Text style={styles.ccCardDesc}>
          CAO Personal Statements, College Interview Preparation, Scholarship Applications, and Course Selection Guidance are all handled in partnership with CourseCompass — Ireland's leading CAO platform. Visit the tools below to get started.
        </Text>

        <View style={styles.ccToolGrid}>
          {CC_TOOLS.map(({ name, icon: Icon, url, desc }) => (
            <TouchableOpacity
              key={name}
              style={styles.ccTool}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(url)}
            >
              <View style={styles.ccToolIcon}>
                <Icon size={16} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ccToolName}>{name}</Text>
                <Text style={styles.ccToolDesc} numberOfLines={1}>{desc}</Text>
              </View>
              <ExternalLink size={12} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.ccVisitBtn}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('https://coursecompass.ie/course-compass')}
        >
          <Compass size={15} color={colors.cream} />
          <Text style={styles.ccVisitBtnText}>Visit Course Compass →</Text>
        </TouchableOpacity>
      </Card>

      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>Submit a Request</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Elevation tab ────────────────────────────────────────────────────────────
function ElevationTab() {
  const [active, setActive] = useState('All')
  const [selectedService, setSelectedService] = useState(null)
  const visible = active === 'All' ? COACHES : COACHES.filter(c => c.filter === active)

  return (
    <View>

      {/* Elevation services */}
      <Text style={styles.servicesSubHeader}>Elevation Services</Text>
      <View style={{ gap: 12, marginBottom: spacing.lg }}>
        {ELEVATION_SERVICES.map(({ icon: Icon, title, desc, color }) => (
          <TouchableOpacity
            key={title}
            activeOpacity={0.88}
            onPress={() => setSelectedService(selectedService === title ? null : title)}
          >
            <Card style={[styles.serviceCard, selectedService === title && styles.serviceCardActive]}>
              <View style={styles.serviceCardTop}>
                <View style={[styles.serviceIcon, { backgroundColor: color }]}>
                  <Icon size={20} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{title}</Text>
                </View>
                <ChevronRight
                  size={16}
                  color={colors.light}
                  style={{ transform: [{ rotate: selectedService === title ? '90deg' : '0deg' }] }}
                />
              </View>
              {selectedService === title && (
                <View style={styles.serviceExpanded}>
                  <Text style={styles.serviceDesc}>{desc}</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Coaches section */}
      <Text style={[styles.servicesSubHeader, { marginTop: 0 }]}>Our Coaches</Text>

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

      <Text style={styles.resultsCount}>{visible.length} coach{visible.length !== 1 ? 'es' : ''} available</Text>

      {(active === 'All' || active === 'Academic Grinds') && (
        <View style={styles.academicBanner}>
          <View style={styles.academicBannerLeft}>
            <View style={styles.newBadgeInline}>
              <Text style={styles.newBadgeInlineText}>NEW</Text>
            </View>
            <Text style={styles.academicBannerTitle}>Academic Grinds</Text>
          </View>
          <Text style={styles.academicBannerSub}>
            One-to-one Leaving Cert & university grinds now available through Elevation Blueprint.
          </Text>
        </View>
      )}

      <View style={{ gap: 16, marginTop: spacing.sm }}>
        {visible.map(coach => (
          <Card key={coach.id} style={styles.coachCard}>
            <View style={styles.coachTop}>
              <View style={styles.coachAvatarWrap}>
                <View style={styles.coachAvatar}>
                  <User size={28} color={colors.light} />
                </View>
                <View style={styles.coachOnlineDot} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
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
                  <Text style={{ fontSize: 12, color: '#F59E0B' }}>★</Text>
                  <Text style={styles.ratingText}>{coach.rating}</Text>
                  <Text style={styles.ratingCount}>({coach.reviews} reviews)</Text>
                </View>
              </View>
            </View>

            <Text style={styles.coachBio}>{coach.bio}</Text>

            {/* Real pricelist if available */}
            {coach.pricelist && (
              <View style={styles.pricelistWrap}>
                {coach.pricelist.map(p => (
                  <View key={p.label} style={styles.pricelistRow}>
                    <Text style={styles.pricelistLabel}>{p.label}</Text>
                    <Text style={styles.pricelistPrice}>{p.price}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.servicePills}>
              {coach.services.map(s => (
                <View key={s} style={styles.servicePill}>
                  <Text style={styles.servicePillText}>{s}</Text>
                </View>
              ))}
            </View>

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
export default function BlueprintScreen({ route }) {
  const initialTab = route?.params?.initialTab?.toLowerCase() || 'foundation'
  const [tab, setTab] = useState(initialTab)

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>SERVICES</Text>
          <Text style={styles.heroTitle}>Blueprint Services</Text>
          <Text style={styles.heroSub}>
            Professional documents and verified coaching — built around Irish student life.
          </Text>
        </View>

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

  statsBanner: {
    flexDirection: 'row', backgroundColor: colors.navy,
    borderRadius: radius.card, padding: spacing.md, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  statLabel: { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(245,240,232,0.15)' },

  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 14,
  },
  trialBannerText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  servicesSubHeader: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 12,
  },

  // Service cards
  serviceCard: { padding: 16 },
  serviceCardActive: { borderWidth: 1.5, borderColor: colors.navy },
  fiftyBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: colors.navy, borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  fiftyBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: colors.cream, letterSpacing: 0.3 },
  serviceCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  serviceIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  serviceTagline: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, fontStyle: 'italic', lineHeight: 17 },

  serviceExpanded: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  serviceDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 14 },

  pricingRow: { flexDirection: 'row', gap: 10 },
  priceBox: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.button,
    padding: 14, alignItems: 'center',
  },
  priceBoxPremium: { backgroundColor: colors.navy },
  priceBoxLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  priceStack: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceOriginal: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    textDecorationLine: 'line-through',
  },
  priceTrial: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  priceBoxSub: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center' },
  trialNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 10, fontStyle: 'italic' },

  orderBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  orderBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  // Course Compass card
  ccCard: { padding: 18, marginBottom: 4 },
  ccCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  ccCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  ccCardSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  ccCardDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 16 },
  ccToolGrid: { gap: 10, marginBottom: 16 },
  ccTool: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cream, borderRadius: radius.button,
    padding: 12,
  },
  ccToolIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  ccToolName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  ccToolDesc: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  ccVisitBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 46, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  ccVisitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

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

  academicBanner: {
    backgroundColor: '#FEF9C3', borderRadius: radius.card,
    padding: 14, marginTop: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  academicBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  academicBannerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  academicBannerSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },
  newBadgeInline: { backgroundColor: '#7C3AED', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeInlineText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5 },

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
  coachBio: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: spacing.sm },

  pricelistWrap: {
    marginTop: 12, backgroundColor: colors.cream, borderRadius: radius.button, padding: 12,
  },
  pricelistRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)',
  },
  pricelistLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.navy },
  pricelistPrice: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  servicePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  servicePill: { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
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
