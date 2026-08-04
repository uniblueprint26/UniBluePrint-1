import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import {
  FileText, Target, Award, Linkedin, MessageSquare, Search,
  BookOpen, GraduationCap, Compass, Map, Wrench, Package,
  User, Users, MapPin, ChevronRight, Sparkles, ExternalLink,
  Phone, Mail, AtSign, Link2,
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
  { name: 'Course Compass',         icon: Compass,       url: 'https://coursecompass.ie/course-compass',          desc: 'Find the right CAO course for you' },
  { name: 'Subject Interest Test',  icon: Linkedin,      url: 'https://coursecompass.ie/subject-interest-test',   desc: 'Discover what subjects you excel in' },
  { name: 'Learning Style Test',    icon: GraduationCap, url: 'https://coursecompass.ie/learning-style-test',     desc: 'Understand how you learn best' },
  { name: 'PLC Compass',            icon: Map,           url: 'https://coursecompass.ie/plc-compass-test',        desc: 'Explore PLC pathway options' },
  { name: 'Apprenticeship Compass', icon: Wrench,        url: 'https://coursecompass.ie/apprentice-compass-test', desc: 'Find the right apprenticeship' },
  { name: '5th & 6th Year Bundle',  icon: Package,       url: 'https://coursecompass.ie/bundles/senior-cycle',    desc: 'Full senior cycle guidance suite' },
]

// ─── Elevation Blueprint — Coaches ───────────────────────────────────────────
// Removed: Shauna Rogers, Ethan Henry, Fayed, Stephen McKeown
// Updated: Milan Piroska, Emanuel Tolic, Jayden Reynolds
// Added: Tadgh Darcy, Eitne Jarrett, Kevin (TrainWitKev), Aoife Keogh

const FILTER_PILLS = [
  'All', 'Fitness', 'Academic Grinds', 'Trading', 'Branding',
  'Marketing', 'Career', 'Network', 'Creative', 'Sports', 'Yoga', 'Postgrad',
]

const COACHES = [
  // ── Academic ──
  {
    id: 1, name: 'Emmanuel Fasanmi', category: 'Academic Grinds', filter: 'Academic Grinds',
    location: 'Dublin, Ireland', rating: '4.9', reviews: 24, from: 'Pricing TBC',
    services: ['Maths Grinds', 'Physics Grinds', 'Biology Grinds'],
    bio: 'Emmanuel offers one-to-one and small group grinds in Maths, Physics, and Biology for Leaving Certificate and university students across Dublin. Sessions are structured, focused, and built around where you actually need to improve.',
  },

  // ── Sports ──
  {
    id: 2, name: 'JMC Fitness', category: 'Sports Coaching', filter: 'Sports',
    location: 'North Dublin', rating: '5.0', reviews: 41, from: 'From €50/hr',
    services: ['12-Week Online Plan', 'In-Person Training', 'Football Coaching', 'Analytics Breakdown', 'Dietary Guidance', 'Agent Connections'],
    bio: 'Elite sports coaching offering fully personalised programmes for students serious about performance. In-person sessions on North Dublin 4G Astro. Football coaching and professional agent connections available.',
    pricelist: [
      { label: '12-Week Online Plan', price: '€300' },
      { label: 'In-Person Session (1hr)', price: '€50' },
      { label: 'Analytics Breakdown', price: '€100' },
    ],
  },

  // ── Creative ──
  {
    id: 3, name: 'Nathan Yanzo (Nyz3ditz)', category: 'Photography & Video', filter: 'Creative',
    location: 'Ireland', rating: '4.9', reviews: 19, from: 'From €55/month',
    services: ['Monthly Mentorship', '1-1 Shoot Session', 'Editing Guidance', 'Creative Direction'],
    bio: 'Professional photographer and videographer offering mentorship and shoot sessions. Monthly subscription includes Zoom calls and editing guidance.',
    pricelist: [
      { label: 'Monthly Subscription', price: '€55/month' },
      { label: '1-1 Shoot Session', price: '€90' },
    ],
    contact: { instagram: 'Nyz3ditz', phone: '+353857272875' },
  },

  // ── Trading ──
  {
    id: 4, name: 'Daniel Gough', category: 'Trading & Finance', filter: 'Trading',
    location: 'Ireland', rating: '4.8', reviews: 17, from: 'From €40',
    services: ['Trading Fundamentals', 'Portfolio Strategy', '1-to-1 Sessions'],
    bio: 'Active trader breaking down markets and investment strategy for students starting their financial journey.',
  },

  // ── Fitness ──
  {
    id: 5, name: 'Ali', category: 'Personal Training', filter: 'Fitness',
    location: 'Ireland', rating: '4.9', reviews: 31, from: 'From €35',
    services: ['Personal Training', 'Training Plans', 'Form Coaching'],
    bio: 'Certified personal trainer building strength, fitness, and consistency into student lifestyle.',
  },

  {
    id: 6, name: 'Emanuel Tolic', category: 'Personal Training', filter: 'Fitness',
    location: 'Ireland, open to worldwide', rating: '5.0', reviews: 22, from: 'Via consultation',
    services: ['Online Workout Plans', 'Online Diet Plans', 'Weightlifting Coaching', 'Calisthenics Coaching', 'Free Consultation Call'],
    bio: '20-year-old qualified personal trainer with 5+ years of fitness experience. Specialising in weightlifting and calisthenics — also works with clients in kickboxing and other sports. Provides personalised online workout and diet plans, ensuring every client fully understands why and how to follow their programme. Available in and outside working hours.',
    package: [
      'Full 1-month coaching guide with workout and meal plan',
      'Fully explained and tracked daily',
      '24/7 WhatsApp availability',
      'Weekly progress check-in calls',
    ],
    contact: { instagram: 'emtolic', email: 'etcoaching06@gmail.com', linktree: 'https://linktr.ee/EmanuelPT' },
    pricingNote: 'Pricing discussed during consultation calls and texts.',
  },

  {
    id: 7, name: 'Tadgh Darcy', category: 'Physique Development', filter: 'Fitness',
    location: 'Dublin', from: 'Pricing on request',
    services: ['Tailored Nutrition Plan', 'Custom Training Programme', 'Weekly Check-in Videos', 'All-in-One Coaching App', 'Direct Coach Access'],
    bio: "Main goal is to help people regain confidence and build healthy, sustainable habits while enjoying the process. Online physique development coaching built around you.",
    contact: { instagram: 'tdarcycoaching', tiktok: 'darcy.lifts', linktree: 'https://linktr.ee/tadghdarcy123' },
  },

  {
    id: 8, name: 'Milan Piroska (MPFitness)', category: 'Personal Training', filter: 'Fitness',
    location: 'Ireland', from: 'From €40/session',
    title: 'Certified Personal Trainer / Advanced Nutrition Coach / International Men\'s Physique Athlete',
    tagline: 'MPFitness. More Than Fitness.',
    services: ['Physique Development', 'Muscle Gain', 'Fat Loss', 'Nutrition Coaching', 'Lifestyle Transformation', 'Holiday & Contest Prep'],
    bio: 'Specialising in Physique and Lifestyle Transformations via Fat Loss and Lean Muscle Gain. 20+ client transformations. Works with clients on physique development, muscle gain, fat loss, nutrition, lifestyle change, and holiday, photoshoot, and contest prep.',
    quote: 'Guarantee of achieving your true potential through proven systems and methodologies with personalised training solutions to fit your lifestyle, goals and preferences. Crafted with precision and backed by results.',
    pricelist: [
      { label: '1x per week', price: '€50/session' },
      { label: '2x per week', price: '€45/session' },
      { label: '3x per week', price: '€40/session' },
      { label: 'One-time session', price: '€60' },
    ],
    package: [
      'Online training and nutrition programmes',
      'Online tracking tools',
      '24/7 WhatsApp support',
      'Frequent check-ins',
    ],
    contact: { instagram: 'milanpir_fitness', phone: '0857633757', email: 'milanpirfitness@gmail.com' },
    pricingNote: 'Available in 8, 10, or 12-week blocks. Payable in 2 instalments or in full. Pricing pending final sign-off.',
  },

  {
    id: 9, name: 'Kevin (TrainWitKev)', category: 'Personal Training', filter: 'Fitness',
    location: 'Dublin, Ireland', from: 'From €25',
    tagline: 'Strength. Physique. Confidence. Mindset.',
    services: ['1-to-1 Personal Training', 'Beginner Gym Coaching', 'Personalised Training Programmes', 'Accountability & Progress Coaching'],
    bio: 'Coach behind TrainWitKev and the mindset behind WORKSYY. Helps people get stronger, build a physique they are proud of, and gain real confidence in and out of the gym. Suits complete beginners through to people who have plateaued on consistency or progress. Focus on structure, technique, understanding, and sustainable progress.',
    quote: 'A mad yoke with something to prove. — WORKSYY',
    pricelist: [
      { label: '1-to-1 PT: Single session', price: '€25' },
      { label: '1-to-1 PT: 4 sessions', price: '€90' },
      { label: '1-to-1 PT: 8 sessions', price: '€170' },
      { label: 'Personalised Training Programme', price: '€25' },
      { label: 'Initial consultation', price: 'Free' },
    ],
    bookingNote: 'Booking currently being set up. Get in touch directly to enquire.',
    pricingNote: 'Currently coaching clients as part of building experience and client base. Testimonials available on request.',
  },

  // ── Marketing / Branding ──
  {
    id: 10, name: 'Alex Leva', category: 'Digital Marketing', filter: 'Marketing',
    location: 'Ireland', rating: '4.9', reviews: 35, from: 'From €40',
    services: ['Social Media Strategy', 'Content Creation', 'Brand Building'],
    bio: 'Digital marketing specialist helping students and early-stage founders grow their presence online.',
  },

  {
    id: 11, name: 'Nikola Jurek', category: 'Personal Branding', filter: 'Branding',
    location: 'Ireland', rating: '4.8', reviews: 21, from: 'From €40',
    services: ['LinkedIn Optimisation', 'Brand Strategy', 'Online Presence'],
    bio: 'Personal branding coach helping students define and communicate their professional identity with confidence.',
  },

  // ── Health & Fitness ──
  {
    id: 12, name: 'Jayden Reynolds', category: 'Health & Fitness Coaching', filter: 'Fitness',
    location: 'County Sligo', rating: '4.8', reviews: 18, from: 'On request',
    services: ['1-1 Online Coaching', 'Tailored Fitness Plans', 'Nutritional Guidance', 'Regular Check-ins', 'Nutrition Journal', 'Local In-Person Coaching'],
    bio: 'Qualified Personal Trainer with over a decade of experience. Passionate about helping people balance school, work, fitness, sport, and social life. League of Ireland player. Available for both online and local in-person coaching in County Sligo.',
    contact: { instagram: 'JayRfitness6', tiktok: 'JayRfitness6' },
  },

  // ── Yoga ──
  {
    id: 13, name: 'Aoife Keogh', category: 'Yoga', filter: 'Yoga',
    location: 'Dublin', from: 'Coming soon',
    shell: true,
    shellMessage: 'Full profile and booking details coming soon.',
  },

  // ── Career / Counselling ──
  {
    id: 14, name: 'Eitne Jarrett', category: 'Careers & Counselling', filter: 'Career',
    location: 'Ireland', from: 'Coming soon',
    shell: true,
    shellMessage: 'Full profile and session details coming soon.',
  },
]

// ─── Coach Card ───────────────────────────────────────────────────────────────

function CoachCard({ coach }) {
  const [expanded, setExpanded] = useState(false)

  function openLink(type, value) {
    if (!value) return
    const urls = {
      instagram: `https://www.instagram.com/${value}`,
      tiktok:    `https://www.tiktok.com/@${value}`,
      linktree:  value,
      email:     `mailto:${value}`,
      phone:     `tel:${value}`,
    }
    Linking.openURL(urls[type])
  }

  // Shell / coming-soon state
  if (coach.shell) {
    return (
      <Card style={styles.coachCard}>
        <View style={styles.coachTop}>
          <View style={styles.coachAvatarWrap}>
            <View style={[styles.coachAvatar, { backgroundColor: '#F5F0E8' }]}>
              <User size={26} color={colors.light} />
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.coachName}>{coach.name}</Text>
            <Text style={styles.coachCategory}>{coach.category}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={11} color={colors.muted} />
              <Text style={styles.coachLocation}>{coach.location}</Text>
            </View>
          </View>
          <View style={styles.shellBadge}>
            <Text style={styles.shellBadgeText}>Coming Soon</Text>
          </View>
        </View>
        <Text style={styles.shellMessage}>{coach.shellMessage}</Text>
      </Card>
    )
  }

  const hasExtra = coach.quote || coach.pricelist || coach.package || coach.contact || coach.pricingNote || coach.bookingNote

  return (
    <Card style={styles.coachCard}>
      {/* Header */}
      <View style={styles.coachTop}>
        <View style={styles.coachAvatarWrap}>
          <View style={styles.coachAvatar}>
            <User size={26} color={colors.light} />
          </View>
          {!coach.shell && <View style={styles.coachOnlineDot} />}
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.coachName}>{coach.name}</Text>
              {coach.title && (
                <Text style={styles.coachTitle} numberOfLines={2}>{coach.title}</Text>
              )}
              <Text style={styles.coachCategory}>{coach.category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <MapPin size={11} color={colors.muted} />
                <Text style={styles.coachLocation}>{coach.location}</Text>
              </View>
            </View>
          </View>
          {coach.rating && (
            <View style={styles.ratingRow}>
              <Text style={{ fontSize: 12, color: '#F59E0B' }}>★</Text>
              <Text style={styles.ratingText}>{coach.rating}</Text>
              <Text style={styles.ratingCount}>({coach.reviews} reviews)</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tagline */}
      {coach.tagline && (
        <Text style={styles.coachTagline}>{coach.tagline}</Text>
      )}

      {/* Bio */}
      <Text style={styles.coachBio}>{coach.bio}</Text>

      {/* Quote */}
      {coach.quote && (
        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>"{coach.quote}"</Text>
        </View>
      )}

      {/* Service pills */}
      <View style={styles.servicePills}>
        {coach.services.map(s => (
          <View key={s} style={styles.servicePill}>
            <Text style={styles.servicePillText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Expandable detail */}
      {hasExtra && (
        <>
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setExpanded(e => !e)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandLabel}>{expanded ? 'Show less' : 'Show pricing & contact'}</Text>
            <ChevronRight
              size={14} color={colors.navy}
              style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.expandedContent}>

              {/* Pricelist */}
              {coach.pricelist && (
                <View style={styles.pricelistWrap}>
                  {coach.pricelist.map((p, i) => (
                    <View
                      key={p.label}
                      style={[styles.pricelistRow, i < coach.pricelist.length - 1 && styles.pricelistDivider]}
                    >
                      <Text style={styles.pricelistLabel}>{p.label}</Text>
                      <Text style={styles.pricelistPrice}>{p.price}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Package inclusions */}
              {coach.package && (
                <View style={styles.packageWrap}>
                  <Text style={styles.packageHeader}>Included</Text>
                  {coach.package.map((item, i) => (
                    <View key={i} style={styles.packageRow}>
                      <View style={styles.packageDot} />
                      <Text style={styles.packageText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Pricing note */}
              {coach.pricingNote && (
                <View style={styles.pricingNote}>
                  <Text style={styles.pricingNoteText}>{coach.pricingNote}</Text>
                </View>
              )}

              {/* Booking note */}
              {coach.bookingNote && (
                <View style={styles.bookingNote}>
                  <Text style={styles.bookingNoteText}>{coach.bookingNote}</Text>
                </View>
              )}

              {/* Contact links */}
              {coach.contact && (
                <View style={styles.contactRow}>
                  {coach.contact.instagram && (
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => openLink('instagram', coach.contact.instagram)}
                      activeOpacity={0.75}
                    >
                      <AtSign size={12} color={colors.navy} />
                      <Text style={styles.contactChipText}>{coach.contact.instagram}</Text>
                    </TouchableOpacity>
                  )}
                  {coach.contact.tiktok && (
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => openLink('tiktok', coach.contact.tiktok)}
                      activeOpacity={0.75}
                    >
                      <AtSign size={12} color={colors.navy} />
                      <Text style={styles.contactChipText}>{coach.contact.tiktok}</Text>
                    </TouchableOpacity>
                  )}
                  {coach.contact.email && (
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => openLink('email', coach.contact.email)}
                      activeOpacity={0.75}
                    >
                      <Mail size={12} color={colors.navy} />
                      <Text style={styles.contactChipText}>Email</Text>
                    </TouchableOpacity>
                  )}
                  {coach.contact.phone && (
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => openLink('phone', coach.contact.phone)}
                      activeOpacity={0.75}
                    >
                      <Phone size={12} color={colors.navy} />
                      <Text style={styles.contactChipText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {coach.contact.linktree && (
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => openLink('linktree', coach.contact.linktree)}
                      activeOpacity={0.75}
                    >
                      <Link2 size={12} color={colors.navy} />
                      <Text style={styles.contactChipText}>Linktree</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* Footer */}
      <View style={styles.coachFooter}>
        <View>
          <Text style={styles.fromLabel}>Starting from</Text>
          <Text style={styles.fromPrice}>{coach.from}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} activeOpacity={0.8}>
          <Text style={styles.profileBtnText}>Book / Enquire</Text>
        </TouchableOpacity>
      </View>
    </Card>
  )
}

// ─── Foundation tab ───────────────────────────────────────────────────────────
function FoundationTab() {
  const [selected, setSelected] = useState(null)

  return (
    <View>
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
            <Text style={styles.ccCardSub}>AI-powered CAO course matching for Irish students</Text>
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
  )
}

// ─── Elevation tab ────────────────────────────────────────────────────────────
// Part A: categories/services list removed — coach list + filters only
function ElevationTab() {
  const [active, setActive] = useState('All')
  const visible = active === 'All' ? COACHES : COACHES.filter(c => c.filter === active)

  return (
    <View>
      {/* Filter pills — kept as-is per spec */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={{ paddingBottom: 4 }}
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
            One-to-one Leaving Cert and university grinds now available through Elevation Blueprint.
          </Text>
        </View>
      )}

      <View style={{ gap: 16, marginTop: spacing.sm }}>
        {visible.map(coach => <CoachCard key={coach.id} coach={coach} />)}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  heroTitle:   { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub:     { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  tabRow: {
    flexDirection: 'row', backgroundColor: colors.white,
    padding: 5, marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, gap: 5, ...shadows.card,
  },
  tabBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: radius.button },
  tabBtnActive:     { backgroundColor: colors.navy },
  tabBtnText:       { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  tabBtnTextActive: { color: colors.white },

  content: { paddingHorizontal: spacing.md, marginTop: spacing.lg },

  // Stats
  statsBanner: { flexDirection: 'row', backgroundColor: colors.navy, borderRadius: radius.card, padding: spacing.md, alignItems: 'center' },
  statItem:    { flex: 1, alignItems: 'center' },
  statNumber:  { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  statLabel:   { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(245,240,232,0.15)' },

  trialBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  trialBannerText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  servicesSubHeader: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 12 },

  // Service cards (Foundation)
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

  pricingRow:    { flexDirection: 'row', gap: 10 },
  priceBox:      { flex: 1, backgroundColor: colors.cream, borderRadius: radius.button, padding: 14, alignItems: 'center' },
  priceBoxPremium: { backgroundColor: colors.navy },
  priceBoxLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginBottom: 4 },
  priceStack:    { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceOriginal: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textDecorationLine: 'line-through' },
  priceTrial:    { fontFamily: fonts.serif, fontSize: 22, color: colors.navy },
  priceBoxSub:   { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center' },
  trialNote:     { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 10, fontStyle: 'italic' },

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

  // Filter pills
  pillScroll:     { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  pill:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, marginRight: 8, borderWidth: 1, borderColor: 'rgba(30,58,95,0.14)' },
  pillActive:     { backgroundColor: colors.navy, borderColor: colors.navy },
  pillText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  pillTextActive: { color: colors.cream },
  resultsCount:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 8, marginBottom: 4 },

  academicBanner:     { backgroundColor: '#FEF9C3', borderRadius: radius.card, padding: 14, marginTop: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  academicBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  academicBannerTitle:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  academicBannerSub:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },
  newBadgeInline:     { backgroundColor: '#7C3AED', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeInlineText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5 },

  // Coach cards
  coachCard:       { padding: 18, marginBottom: 0 },
  coachTop:        { flexDirection: 'row' },
  coachAvatarWrap: { position: 'relative' },
  coachAvatar:     { width: 52, height: 52, borderRadius: radius.circle, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.08)' },
  coachOnlineDot:  { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#16A34A', borderWidth: 2, borderColor: colors.white },

  coachName:     { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  coachTitle:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, lineHeight: 16, marginTop: 2 },
  coachCategory: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, opacity: 0.65, marginTop: 2 },
  coachLocation: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  coachTagline:  { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, marginTop: 10, fontStyle: 'italic' },
  coachBio:      { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 10 },

  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  ratingText:  { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },
  ratingCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  // Quote
  quoteBlock: { backgroundColor: colors.cream, borderLeftWidth: 3, borderLeftColor: colors.navy, borderRadius: 4, padding: 12, marginTop: 12 },
  quoteText:  { fontFamily: fonts.serifItalic || fonts.serif, fontSize: 13, color: colors.navy, lineHeight: 20, fontStyle: 'italic' },

  // Service pills
  servicePills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  servicePill:    { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  servicePillText:{ fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

  // Expandable section
  expandRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.07)' },
  expandLabel:  { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  expandedContent: { marginTop: 12, gap: 12 },

  // Pricelist
  pricelistWrap:    { backgroundColor: colors.cream, borderRadius: radius.button, padding: 12 },
  pricelistRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  pricelistDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)' },
  pricelistLabel:   { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, flex: 1, marginRight: 8 },
  pricelistPrice:   { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  // Package inclusions
  packageWrap:   { backgroundColor: '#F0FDF4', borderRadius: radius.button, padding: 12 },
  packageHeader: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: '#15803D', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  packageRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 },
  packageDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803D', marginTop: 5, flexShrink: 0 },
  packageText:   { fontFamily: fonts.sans, fontSize: 13, color: '#166534', lineHeight: 19, flex: 1 },

  // Notes
  pricingNote:     { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FDE68A' },
  pricingNoteText: { fontFamily: fonts.sans, fontSize: 12, color: '#92400E', lineHeight: 18 },
  bookingNote:     { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  bookingNoteText: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy, lineHeight: 18 },

  // Contact chips
  contactRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  contactChipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },

  // Footer
  coachFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  fromLabel:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  fromPrice:   { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginTop: 1 },
  profileBtn:  { backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 18, paddingVertical: 10 },
  profileBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // Shell card
  shellBadge:     { backgroundColor: 'rgba(30,58,95,0.07)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  shellBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted },
  shellMessage:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12, fontStyle: 'italic' },
})
