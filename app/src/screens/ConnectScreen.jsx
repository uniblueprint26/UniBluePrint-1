import { useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import {
  Users, BookOpen, Car, CalendarDays, FileText,
  MessageSquare, BookMarked, Search, ChevronRight,
  MapPin, Lightbulb, Plus, AlertCircle, User, Briefcase, Star,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import MockContentBanner from '../components/ui/MockContentBanner'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Campus Connect Feature Products ─────────────────────────────────────────
// headline = value-first (benefit before feature name)
const CAMPUS_FEATURES = [
  {
    key: 'boards',
    label: 'CAMPUS BOARDS',
    Icon: Users,
    color: '#FFF7ED',
    headline: 'Find rooms, sell stuff, stay connected',
    sub: 'Twelve community boards covering accommodation, marketplace, societies, and more.',
    count: '42 live posts',
    preview: [
      { text: 'Room near UCD — €600/month, bills included. Available from August.', meta: '2h ago' },
      { text: 'Selling all 2nd yr Business textbooks — €15 each or €50 bundle.', meta: '1h ago' },
    ],
  },
  {
    key: 'carpool',
    label: 'CARPOOLING',
    Icon: Car,
    color: '#F0FDF4',
    headline: 'Split the cost of your commute',
    sub: 'Match with students on your route every day and cut your travel costs every week.',
    count: '17 active routes',
    preview: [
      { text: 'Limerick City → UL Campus · Mon–Fri · 8:30am', meta: '2 seats' },
      { text: 'Cork City → UCC Main Gate · Mon/Wed/Fri · 9:00am', meta: '3 seats' },
    ],
  },
  {
    key: 'events',
    label: 'CAMPUS EVENTS',
    Icon: CalendarDays,
    color: '#EFF6FF',
    headline: "Never miss what's on this week",
    sub: 'Society events, open days, campus talks, and student-run nights — all in one feed.',
    count: '8 this week',
    preview: [
      { text: 'UCD Law Society mixer — Thursday · Free entry with student card', meta: 'Thu' },
      { text: 'TCD Drama Society auditions — Monday 7pm · All welcome', meta: 'Mon' },
    ],
  },
  {
    key: 'projects',
    label: 'PROJECT COLLABORATION',
    Icon: Lightbulb,
    color: '#FDF4FF',
    headline: 'Build something real with your peers',
    sub: 'Post project ideas, find teammates from any campus, and ship something worth showing.',
    count: '11 open projects',
    isNew: true,
    preview: [
      { text: 'Campus Sustainability App · UCD · 2 spots open', meta: 'Mobile Dev' },
      { text: 'AI Study Planner (Final Year) · TCD · 3 spots open', meta: 'AI/ML' },
    ],
  },
]

// ─── Community Boards (12 total — 7 existing + 5 from plan spec) ──────────────
const BOARDS_DATA = [
  {
    title: 'Accommodation', icon: '🏠', color: '#EFF6FF', postCount: 14,
    posts: [
      { text: 'Room available near UCD — €600/month, bills included. Available from August.', time: '2h ago' },
      { text: 'Looking for 2 flatmates in Smithfield. Modern apt, €750pp. DM for info.', time: '5h ago' },
    ],
  },
  {
    title: 'Marketplace', icon: '🛒', color: '#F0FDF4', postCount: 21,
    posts: [
      { text: 'Selling all 2nd year Business textbooks — €15 each or €50 bundle.', time: '1h ago' },
      { text: 'MacBook Pro 2020 — excellent condition — €900. DM for photos.', time: '3h ago' },
    ],
  },
  {
    title: 'Events', icon: '🎉', color: '#FDF4FF', postCount: 8,
    posts: [
      { text: 'UCD Law Society mixer this Thursday — free entry with student card.', time: '30m ago' },
      { text: 'TCD Drama Society auditions — Monday 7pm — all welcome.', time: '4h ago' },
    ],
  },
  {
    title: 'Lost & Found', icon: '🔍', color: '#FFF7ED', postCount: 5,
    posts: [
      { text: 'Found: Blue North Face jacket in Library. Posted to security desk.', time: '6h ago' },
      { text: 'Lost: AirPods Pro near Arts building — please DM if found.', time: '1d ago' },
    ],
  },
  {
    title: 'Societies', icon: '🤝', color: '#F0F9FF', postCount: 9,
    posts: [
      { text: 'Chess Society looking for new members — all levels welcome!', time: '2h ago' },
      { text: 'St. Vincent de Paul UCC — volunteering every Tuesday evening.', time: '1d ago' },
    ],
  },
  {
    title: 'Opportunities', icon: '💼', color: '#FEF9C3', postCount: 12,
    posts: [
      { text: 'Part-time barista role — €13.50/hr — 3 mins from UCD. Apply now.', time: '45m ago' },
      { text: 'Marketing intern wanted by Dublin startup — 20 hrs/week, paid.', time: '3h ago' },
    ],
  },
  {
    title: 'Problems & Solutions', icon: '💡', color: '#FEF9C3', postCount: 6,
    posts: [
      { text: 'Anyone know how to appeal a CAO change of mind decision? Need help urgently.', time: '1h ago' },
      { text: 'Accommodation deposit taken but landlord gone silent — what are my rights?', time: '3h ago' },
    ],
  },
  {
    title: 'Shared Subscriptions', icon: '🔗', color: '#F0F9FF', postCount: 4,
    posts: [
      { text: 'Sharing Spotify Premium family plan — 2 spots left, €4/month each. DM me.', time: '2h ago' },
      { text: 'Netflix account share — 1 spot open, €5/month. UCD area preferred.', time: '5h ago' },
    ],
  },
  {
    title: 'Shared Notes', icon: '📝', color: '#EFF6FF', postCount: 9,
    posts: [
      { text: 'MG4021 Week 8 notes — Google Drive link in comments.', time: '30m ago' },
      { text: 'CS2001 Binary Trees summary — anyone want a copy? DM me.', time: '2h ago' },
    ],
  },
  {
    title: 'College Reviews', icon: '⭐', color: '#F0FDF4', postCount: 11,
    posts: [
      { text: 'UCD Commerce — solid for networking, weak on small group teaching. 7/10.', time: '4h ago' },
      { text: 'TCD Law — incredibly challenging but library resources are unmatched.', time: '1d ago' },
    ],
  },
  {
    title: 'Campus Suggestions', icon: '💬', color: '#FDF4FF', postCount: 3,
    posts: [
      { text: '24hr study room in the Arts block — high demand during exam season.', time: '6h ago' },
      { text: 'More microwaves in the SU — lunch queues are 20 minutes.', time: '1d ago' },
    ],
  },
  {
    title: 'Student Ads', icon: '📢', color: '#F5F0E8', postCount: 7,
    posts: [
      { text: 'Guitar lessons available — €25/session, Dublin. Beginners welcome.', time: '1h ago' },
      { text: 'Professional CV & cover letter service — €25. Fast turnaround.', time: '2h ago' },
    ],
  },
]

// ─── Carpooling ───────────────────────────────────────────────────────────────
const CARPOOL_POSTS = [
  { from: 'Limerick City', to: 'UL Campus', time: 'Mon–Fri · 8:30am', seats: 2 },
  { from: 'Cork City Centre', to: 'UCC Main Gate', time: 'Mon/Wed/Fri · 9:00am', seats: 3 },
  { from: 'Galway City', to: 'NUIG Concourse', time: 'Daily · 8:00am', seats: 1 },
]

// ─── Projects ─────────────────────────────────────────────────────────────────
const PROJECTS = [
  { title: 'Campus Sustainability App', tags: ['Mobile Dev', 'UI/UX', 'Sustainability'], team: 2, need: 2, university: 'UCD' },
  { title: 'AI Study Planner — Final Year Project', tags: ['AI/ML', 'Python', 'React'], team: 1, need: 3, university: 'TCD' },
  { title: 'Student Budget Tracker', tags: ['Finance', 'App Dev', 'Open to All'], team: 3, need: 1, university: 'UL' },
]

// ─── Course Connect Feature Products ─────────────────────────────────────────
const COURSE_FEATURES = [
  {
    key: 'notes',
    label: 'NOTES EXCHANGE',
    Icon: FileText,
    color: '#EFF6FF',
    headline: 'Get ahead with peer notes',
    sub: 'Upload and access module summaries, lecture notes, and revision guides shared by students like you.',
    count: '1,200+ notes',
    preview: [
      { text: 'MG4021 — Consumer Behaviour · Week 7 Summary · UL', meta: '142 views' },
      { text: 'CS2001 — Data Structures · Linked Lists & Trees · UCD', meta: '98 views' },
    ],
  },
  {
    key: 'groups',
    label: 'STUDY GROUPS',
    Icon: Users,
    color: '#F0FDF4',
    headline: 'Study with people who get it',
    sub: 'Form or join groups by module, topic, or upcoming deadline. Open to every campus in Ireland.',
    count: '34 active groups',
    preview: [
      { text: 'CS2001 Exam Prep Group · UCD · 4 members', meta: 'Active' },
      { text: 'MG4021 Week 7 Revision · UL · 3 members', meta: 'Active' },
    ],
  },
  {
    key: 'qa',
    label: 'MODULE Q&A',
    Icon: MessageSquare,
    color: '#FDF4FF',
    headline: 'Get unstuck, fast',
    sub: 'Ask course-specific questions and get answers from students who have already been there.',
    count: '280 answers',
    preview: [
      { text: "What's the best way to approach Big O notation for the upcoming exam?", meta: 'CS2001' },
      { text: 'Can anyone explain the difference between void and voidable contracts?', meta: 'LA1102' },
    ],
  },
  {
    key: 'exams',
    label: 'EXAM RESOURCES',
    Icon: BookMarked,
    color: '#FFF7ED',
    headline: 'Past papers and revision guides in one place',
    sub: 'Access a growing library of past papers, exam tips, and revision guides across all Irish universities.',
    count: '500+ resources',
    preview: [
      { text: 'UCD Business — 2023 Past Papers Bundle', meta: 'Past Paper' },
      { text: 'TCD Law — Essay structure and exam technique guide', meta: 'Guide' },
    ],
  },
  {
    key: 'resources',
    label: 'RESOURCE FINDER',
    Icon: Search,
    color: '#F0F9FF',
    headline: 'Find academic supports from any institution',
    sub: 'Search grants, scholarships, academic resources, and campus services across Ireland.',
    count: 'Coming soon',
    coming: true,
  },
  {
    key: 'industry',
    label: 'INDUSTRY DISCUSSIONS',
    Icon: Briefcase,
    color: '#FEF9C3',
    headline: 'Talk to people already in your field',
    sub: 'Industry-specific threads for students exploring careers. Ask, listen, and connect with those ahead of you.',
    count: 'Coming soon',
    coming: true,
  },
  {
    key: 'college_reviews',
    label: 'COLLEGE REVIEWS',
    Icon: Star,
    color: '#F0FDF4',
    headline: 'Real reviews of Irish colleges and courses',
    sub: 'Honest assessments from students across all institutions. Search by course, campus, or subject area.',
    count: 'Coming soon',
    coming: true,
  },
]

// ─── Recent Notes ─────────────────────────────────────────────────────────────
const RECENT_NOTES = [
  { module: 'MG4021', title: 'Consumer Behaviour — Week 7 Summary', university: 'UL', views: 142, saved: 38 },
  { module: 'CS2001', title: 'Data Structures — Linked Lists & Trees', university: 'UCD', views: 98, saved: 22 },
  { module: 'LA1102', title: 'Contract Law — Offer & Acceptance Notes', university: 'TCD', views: 203, saved: 61 },
  { module: 'AC3010', title: 'Financial Accounting — Ratio Analysis', university: 'UCC', views: 87, saved: 19 },
]

// ─── Student Database (27 members) ───────────────────────────────────────────
const STUDENT_PROFILES = [
  { name: 'Ethan',    uni: 'UCD',  course: 'Computer Science',       cao: 'DN110', year: '3rd Year', skills: ['React', 'Python'],     initials: 'ET', color: '#EFF6FF' },
  { name: 'Fiza',     uni: 'TCD',  course: 'Law',                    cao: 'TR010', year: '2nd Year', skills: ['Research', 'Writing'],  initials: 'FZ', color: '#F0FDF4' },
  { name: 'Nicole',   uni: 'UCC',  course: 'Medicine',               cao: 'CK101', year: '1st Year', skills: ['Biology', 'Chemistry'], initials: 'NL', color: '#FDF4FF' },
  { name: 'Eman',     uni: 'DCU',  course: 'Communications',         cao: 'DC116', year: '2nd Year', skills: ['PR', 'Content'],        initials: 'EN', color: '#FFF7ED' },
  { name: 'Gigi',     uni: 'NUIG', course: 'Business',               cao: 'GY101', year: '3rd Year', skills: ['Marketing', 'Excel'],   initials: 'GG', color: '#F0F9FF' },
  { name: 'Mohammed', uni: 'UCD',  course: 'Engineering',            cao: 'DN150', year: '2nd Year', skills: ['CAD', 'Matlab'],        initials: 'MH', color: '#FEF9C3' },
  { name: 'Wami',     uni: 'TCD',  course: 'Business & Economics',   cao: 'TR004', year: '3rd Year', skills: ['Finance', 'Excel'],     initials: 'WM', color: '#EFF6FF' },
  { name: 'Abdullah', uni: 'UCC',  course: 'Computer Science',       cao: 'CK401', year: '4th Year', skills: ['Java', 'React'],        initials: 'AB', color: '#F0FDF4' },
  { name: 'Siobhan',  uni: 'UL',   course: 'Nursing',                cao: 'LM116', year: '2nd Year', skills: ['Biology', 'Health'],    initials: 'SB', color: '#FDF4FF' },
  { name: 'Ciaran',   uni: 'MTU',  course: 'Civil Engineering',      cao: 'CK600', year: '3rd Year', skills: ['AutoCAD', 'Survey'],    initials: 'CI', color: '#FFF7ED' },
  { name: 'Aoife',    uni: 'UCD',  course: 'Arts',                   cao: 'DN001', year: '1st Year', skills: ['Writing', 'History'],   initials: 'AF', color: '#F0F9FF' },
  { name: 'Emily',    uni: 'DCU',  course: 'Journalism',             cao: 'DC118', year: '2nd Year', skills: ['Writing', 'Social'],    initials: 'EM', color: '#FEF9C3' },
  { name: 'Zafur',    uni: 'TCD',  course: 'Computer Science',       cao: 'TR064', year: '3rd Year', skills: ['Python', 'AI/ML'],      initials: 'ZF', color: '#EFF6FF' },
  { name: 'Maura',    uni: 'UCC',  course: 'Law',                    cao: 'CK200', year: '4th Year', skills: ['Research', 'Advocacy'], initials: 'MR', color: '#F0FDF4' },
  { name: 'Billy',    uni: 'UL',   course: 'Sports Science',         cao: 'LM051', year: '2nd Year', skills: ['Fitness', 'Coaching'],  initials: 'BL', color: '#FDF4FF' },
  { name: 'Oisin',    uni: 'NUIG', course: 'Marine Science',         cao: 'GY301', year: '3rd Year', skills: ['Research', 'Data'],     initials: 'OS', color: '#FFF7ED' },
  { name: 'Sinead',   uni: 'UCD',  course: 'Psychology',             cao: 'DN200', year: '2nd Year', skills: ['Research', 'Stats'],    initials: 'SD', color: '#F0F9FF' },
  { name: 'Kofi',     uni: 'TCD',  course: 'Engineering',            cao: 'TR008', year: '3rd Year', skills: ['Circuits', 'Python'],   initials: 'KF', color: '#FEF9C3' },
  { name: 'Seamus',   uni: 'ATU',  course: 'Business',               cao: 'GA201', year: '1st Year', skills: ['Sales', 'Marketing'],   initials: 'SM', color: '#EFF6FF' },
  { name: 'Sean',     uni: 'UCC',  course: 'Business & French',      cao: 'CK218', year: '2nd Year', skills: ['French', 'Finance'],    initials: 'SN', color: '#F0FDF4' },
  { name: 'David',    uni: 'UCD',  course: 'Finance',                cao: 'DN155', year: '3rd Year', skills: ['Excel', 'Bloomberg'],   initials: 'DV', color: '#FDF4FF' },
  { name: 'Isaac',    uni: 'DCU',  course: 'International Business', cao: 'DC200', year: '2nd Year', skills: ['Languages', 'Trade'],   initials: 'IC', color: '#FFF7ED' },
  { name: 'Basmali',  uni: 'TCD',  course: 'Pharmacy',               cao: 'TR251', year: '3rd Year', skills: ['Chemistry', 'Science'], initials: 'BM', color: '#F0F9FF' },
  { name: 'Fatima',   uni: 'UCC',  course: 'Social Work',            cao: 'CK730', year: '1st Year', skills: ['Empathy', 'Policy'],    initials: 'FT', color: '#FEF9C3' },
  { name: 'Sienna',   uni: 'NUIG', course: 'Marketing',              cao: 'GY201', year: '2nd Year', skills: ['Branding', 'Content'],  initials: 'SI', color: '#EFF6FF' },
  { name: 'Alex',     uni: 'UL',   course: 'Architecture',           cao: 'LM085', year: '4th Year', skills: ['Revit', 'SketchUp'],    initials: 'AX', color: '#F0FDF4' },
  { name: 'Daniel',   uni: 'UCD',  course: 'Commerce',               cao: 'DN130', year: '2nd Year', skills: ['Accounting', 'Law'],    initials: 'DN', color: '#FDF4FF' },
]

// ─── Course Discussions ───────────────────────────────────────────────────────
const DISCUSSIONS = [
  { module: 'CS2001', question: "What's the best way to approach Big O notation for the upcoming exam?", replies: 14, university: 'UCD', time: '2h ago' },
  { module: 'MG4021', question: 'Looking for Week 6 lecture notes for Consumer Behaviour — anyone have them?', replies: 7, university: 'UL', time: '5h ago' },
  { module: 'LA1102', question: 'Can anyone explain the difference between void and voidable contracts?', replies: 22, university: 'TCD', time: '1d ago' },
]

// ─── Mentors ──────────────────────────────────────────────────────────────────
const MENTORS = [
  {
    name: 'Ciara Nolan',
    role: 'Graduate — KPMG Dublin',
    background: 'Business & Finance, UCD 2023',
    areas: ['Career Advice', 'Graduate Applications', 'Finance'],
    color: '#EFF6FF',
  },
  {
    name: 'James Healy',
    role: 'Software Engineer — Stripe',
    background: 'Computer Science, TCD 2022',
    areas: ['Tech Careers', 'Interview Prep', 'CS Projects'],
    color: '#F0FDF4',
  },
]

// ─── Feature Product Card ─────────────────────────────────────────────────────
function FeatureCard({ feature }) {
  return (
    <Card style={styles.featureCard}>
      {/* Top row: icon + label + badges */}
      <View style={styles.featureTopRow}>
        <View style={[styles.featureIconBox, { backgroundColor: feature.color }]}>
          <feature.Icon size={20} color={colors.navy} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.featureLabel}>{feature.label}</Text>
          <View style={styles.featureMeta}>
            {feature.coming ? (
              <View style={styles.comingSoonPill}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            ) : (
              <Text style={styles.featureCount}>{feature.count}</Text>
            )}
            {feature.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Value headline */}
      <Text style={styles.featureHeadline}>{feature.headline}</Text>
      <Text style={styles.featureSub}>{feature.sub}</Text>

      {/* Mini content preview */}
      {feature.preview && (
        <View style={styles.featurePreview}>
          {feature.preview.map((post, i) => (
            <View
              key={i}
              style={[
                styles.previewPost,
                i < feature.preview.length - 1 && styles.previewPostBorder,
              ]}
            >
              <Text style={styles.previewText} numberOfLines={1}>{post.text}</Text>
              <Text style={styles.previewMeta}>{post.meta}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA footer */}
      {!feature.coming && (
        <TouchableOpacity style={styles.featureCta} activeOpacity={0.8}>
          <Text style={styles.featureCtaText}>Open</Text>
          <ChevronRight size={13} color={colors.cream} />
        </TouchableOpacity>
      )}
    </Card>
  )
}

// ─── Campus Tab ───────────────────────────────────────────────────────────────
function CampusTab() {
  const [search, setSearch] = useState('')

  return (
    <View>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={16} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find your campus..."
          placeholderTextColor={colors.light}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Feature product cards */}
      <SectionHeader
        eyebrow="What's Available"
        title="Campus Features"
        style={{ marginTop: spacing.lg }}
      />
      <View style={{ gap: 14 }}>
        {CAMPUS_FEATURES.map(f => <FeatureCard key={f.key} feature={f} />)}
      </View>

      {/* Community Boards */}
      <SectionHeader
        eyebrow="Community Boards"
        title="12 Boards, One Place"
        style={{ marginTop: spacing.xl }}
      />
      <MockContentBanner
        title="Example content — live when your campus goes live"
        subtitle="These posts are shown as examples. All 12 boards launch when real students join your campus community."
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScroll}
        contentContainerStyle={{ paddingRight: spacing.md }}
      >
        {BOARDS_DATA.map(board => (
          <TouchableOpacity key={board.title} activeOpacity={0.8}>
            <View style={[styles.boardCard, { backgroundColor: board.color }]}>
              <View style={styles.boardHeader}>
                <Text style={styles.boardEmoji}>{board.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boardTitle}>{board.title}</Text>
                  <Text style={styles.boardCount}>{board.postCount} posts</Text>
                </View>
              </View>
              {board.posts.map((post, i) => (
                <View
                  key={i}
                  style={[styles.boardPost, i > 0 && { marginTop: 8 }]}
                >
                  <Text style={styles.boardPostText} numberOfLines={2}>{post.text}</Text>
                  <Text style={styles.boardPostTime}>{post.time}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Carpooling */}
      <SectionHeader
        eyebrow="Active Routes"
        title="Carpooling"
        style={{ marginTop: spacing.xl }}
      />
      <View style={styles.safetyBanner}>
        <AlertCircle size={15} color="#92400E" />
        <Text style={styles.safetyBannerText}>
          Always verify carpool drivers through your campus student services before travelling.
        </Text>
      </View>
      <View style={{ gap: 10, marginTop: spacing.sm }}>
        {CARPOOL_POSTS.map((post, i) => (
          <Card key={i} style={styles.carpoolCard}>
            <View style={styles.carpoolRouteRow}>
              <View style={styles.carpoolDot} />
              <Text style={styles.carpoolFrom}>{post.from}</Text>
            </View>
            <View style={[styles.carpoolRouteRow, { marginTop: 6 }]}>
              <MapPin size={10} color={colors.navy} />
              <Text style={styles.carpoolTo}>{post.to}</Text>
            </View>
            <View style={styles.carpoolFooter}>
              <Text style={styles.carpoolTime}>{post.time}</Text>
              <View style={styles.seatBadge}>
                <Text style={styles.seatBadgeText}>{post.seats} seat{post.seats !== 1 ? 's' : ''} free</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
      <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing.md }]} activeOpacity={0.8}>
        <Plus size={14} color={colors.navy} />
        <Text style={styles.secondaryBtnText}>Add Your Route</Text>
      </TouchableOpacity>

      {/* Open Projects */}
      <SectionHeader
        eyebrow="Project Collaboration"
        title="Open Projects"
        style={{ marginTop: spacing.xl }}
      />
      <View style={{ gap: 12 }}>
        {PROJECTS.map((p, i) => (
          <Card key={i} style={styles.projectCard}>
            <Text style={styles.projectTitle}>{p.title}</Text>
            <View style={styles.projectTags}>
              {p.tags.map(t => (
                <View key={t} style={styles.projectTag}>
                  <Text style={styles.projectTagText}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={styles.projectFooter}>
              <View style={styles.projectMeta}>
                <Text style={styles.projectMetaText}>{p.university}</Text>
                <Text style={styles.projectMetaText}>·</Text>
                <Text style={styles.projectMetaText}>{p.team} in team</Text>
                <Text style={styles.projectMetaText}>·</Text>
                <Text style={[styles.projectMetaText, { color: colors.navy, fontFamily: fonts.sansSemiBold }]}>
                  {p.need} spot{p.need !== 1 ? 's' : ''} open
                </Text>
              </View>
              <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8}>
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>

      {/* Post button */}
      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Plus size={16} color={colors.cream} />
        <Text style={styles.primaryBtnText}>Post to Campus Board</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Course Tab ───────────────────────────────────────────────────────────────
function CourseTab() {
  return (
    <View>
      {/* Stats banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>1,200+</Text>
          <Text style={styles.statLabel}>Notes Shared</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>34</Text>
          <Text style={styles.statLabel}>Study Groups</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>280</Text>
          <Text style={styles.statLabel}>Q&A Answers</Text>
        </View>
      </View>

      {/* Feature product cards */}
      <SectionHeader
        eyebrow="Academic Support"
        title="Course Tools"
        style={{ marginTop: spacing.lg }}
      />
      <View style={{ gap: 14 }}>
        {COURSE_FEATURES.map(f => <FeatureCard key={f.key} feature={f} />)}
      </View>

      {/* Popular Notes */}
      <SectionHeader
        eyebrow="Recently Shared"
        title="Popular Notes"
        style={{ marginTop: spacing.xl }}
      />
      <View style={{ gap: 10 }}>
        {RECENT_NOTES.map((note, i) => (
          <Card key={i} style={styles.noteCard}>
            <View style={styles.noteModuleBadge}>
              <Text style={styles.noteModuleText}>{note.module}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={styles.noteMeta}>
                <Text style={styles.noteMetaText}>{note.university}</Text>
                <Text style={styles.noteMetaText}>·</Text>
                <Text style={styles.noteMetaText}>{note.views} views</Text>
                <Text style={styles.noteMetaText}>·</Text>
                <Text style={styles.noteMetaText}>{note.saved} saves</Text>
              </View>
            </View>
            <ChevronRight size={14} color={colors.light} style={{ alignSelf: 'center' }} />
          </Card>
        ))}
      </View>

      {/* Student Database */}
      <SectionHeader
        eyebrow="Student Network"
        title="Student Database"
        style={{ marginTop: spacing.xl }}
      />
      <MockContentBanner
        title="Full database coming soon"
        subtitle="Connect with students across Irish universities. Filter by course, year, and skills."
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScroll}
        contentContainerStyle={{ paddingRight: spacing.md }}
      >
        {STUDENT_PROFILES.map((s, i) => (
          <TouchableOpacity key={i} activeOpacity={0.8}>
            <View style={[styles.studentCard, { backgroundColor: s.color }]}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentInitials}>{s.initials}</Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>{s.name}</Text>
              <Text style={styles.studentUni}>{s.uni}</Text>
              <Text style={styles.studentCao}>{s.cao}</Text>
              <Text style={styles.studentCourse} numberOfLines={2}>{s.course}</Text>
              <View style={styles.studentSkills}>
                {s.skills.slice(0, 2).map(sk => (
                  <View key={sk} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{sk}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recent Discussions */}
      <SectionHeader
        eyebrow="Community"
        title="Recent Discussions"
        style={{ marginTop: spacing.xl }}
      />
      <MockContentBanner
        title="Discussions — Building Now"
        subtitle="Module-specific Q&A threads launching with Course Connect. Ask questions, share answers."
      />
      <View style={{ gap: 10 }}>
        {DISCUSSIONS.map((d, i) => (
          <TouchableOpacity key={i} activeOpacity={0.8}>
            <Card style={styles.discussionCard}>
              <View style={styles.discussionTop}>
                <View style={styles.noteModuleBadge}>
                  <Text style={styles.noteModuleText}>{d.module}</Text>
                </View>
                <Text style={styles.discussionTime}>{d.time}</Text>
              </View>
              <Text style={styles.discussionQuestion} numberOfLines={2}>{d.question}</Text>
              <View style={styles.discussionMeta}>
                <MessageSquare size={12} color={colors.muted} />
                <Text style={styles.discussionReplies}>{d.replies} replies</Text>
                <Text style={styles.discussionUni}>{d.university}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mentorship */}
      <SectionHeader
        eyebrow="Graduate Mentors"
        title="Mentorship"
        style={{ marginTop: spacing.xl }}
      />
      <MockContentBanner
        title="Mentorship Programme — Coming Soon"
        subtitle="Get matched with graduates in your field for career guidance and industry insights."
      />
      <View style={{ gap: 14 }}>
        {MENTORS.map((m, i) => (
          <Card key={i} style={[styles.mentorCard, { backgroundColor: m.color }]}>
            <View style={styles.mentorTop}>
              <View style={styles.mentorAvatar}>
                <User size={22} color={colors.navy} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.mentorName}>{m.name}</Text>
                <Text style={styles.mentorRole}>{m.role}</Text>
                <Text style={styles.mentorBackground}>{m.background}</Text>
              </View>
            </View>
            <View style={styles.mentorAreas}>
              {m.areas.map(a => (
                <View key={a} style={styles.mentorAreaPill}>
                  <Text style={styles.mentorAreaText}>{a}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8}>
              <Text style={styles.joinBtnText}>Request Mentor</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      {/* Share notes CTA */}
      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Plus size={16} color={colors.cream} />
        <Text style={styles.primaryBtnText}>Share Your Notes</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ConnectScreen({ route }) {
  const initialTab = route?.params?.initialTab?.toLowerCase() || 'campus'
  const [tab, setTab] = useState(initialTab)

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>COMMUNITY</Text>
          <Text style={styles.heroTitle}>Your campus, your people.</Text>
          <Text style={styles.heroSub}>
            From accommodation to study groups, carpooling to project collaboration — your university community, all in one place.
          </Text>
        </View>

        {/* Tab selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'campus' && styles.tabBtnActive]}
            onPress={() => setTab('campus')}
          >
            <Users size={15} color={tab === 'campus' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'campus' && styles.tabBtnTextActive]}>Campus</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'course' && styles.tabBtnActive]}
            onPress={() => setTab('course')}
          >
            <BookOpen size={15} color={tab === 'course' ? colors.white : colors.navy} />
            <Text style={[styles.tabBtnText, tab === 'course' && styles.tabBtnTextActive]}>Course</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {tab === 'campus' ? <CampusTab /> : <CourseTab />}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 56 },

  // Hero — editorial, value-led
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.sm,
  },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle:   { fontFamily: fonts.serif, fontSize: 30, color: colors.cream, marginTop: 6, lineHeight: 38 },
  heroSub:     { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  // Tab selector
  tabRow: {
    flexDirection: 'row', backgroundColor: colors.white, padding: 5,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.card, gap: 5, ...shadows.card,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: radius.button,
  },
  tabBtnActive:     { backgroundColor: colors.navy },
  tabBtnText:       { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  tabBtnTextActive: { color: colors.white },

  content: { paddingHorizontal: spacing.md, marginTop: spacing.lg },

  // Search bar
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.button,
    paddingHorizontal: 14, height: 48, ...shadows.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },

  // Feature product card
  featureCard: { padding: 16 },
  featureTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  featureIconBox: {
    width: 46, height: 46, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted,
    letterSpacing: 0.8, marginBottom: 4,
  },
  featureMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureCount:   { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, opacity: 0.65 },
  featureHeadline: {
    fontFamily: fonts.serif, fontSize: 20, color: colors.navy,
    marginTop: 12, lineHeight: 27,
  },
  featureSub: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    marginTop: 5, lineHeight: 19,
  },

  // Coming soon pill
  comingSoonPill: {
    backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  comingSoonText: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.muted },

  // NEW badge
  newBadge:     { backgroundColor: '#7C3AED', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5 },

  // Feature preview
  featurePreview: {
    backgroundColor: colors.cream, borderRadius: radius.button,
    marginTop: 14, overflow: 'hidden',
  },
  previewPost: {
    paddingHorizontal: 12, paddingVertical: 9,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8,
  },
  previewPostBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)' },
  previewText: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy, flex: 1 },
  previewMeta: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted, flexShrink: 0 },

  // Feature CTA
  featureCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-end', marginTop: 14,
  },
  featureCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // Boards horizontal scroll
  rowScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  boardCard: { width: 228, borderRadius: radius.card, padding: 14, marginRight: 12 },
  boardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  boardEmoji:  { fontSize: 22 },
  boardTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  boardCount:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  boardPost:      { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: 8 },
  boardPostText:  { fontFamily: fonts.sans, fontSize: 11, color: colors.navy, lineHeight: 16 },
  boardPostTime:  { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 3 },

  // Carpooling
  safetyBanner: {
    backgroundColor: '#FEF3C7', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12,
    borderWidth: 1, borderColor: 'rgba(146,64,14,0.2)',
  },
  safetyBannerText: { fontFamily: fonts.sans, fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  carpoolCard:      { padding: 14 },
  carpoolRouteRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  carpoolDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy },
  carpoolFrom:      { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  carpoolTo:        { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  carpoolFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  carpoolTime:      { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  seatBadge: {
    backgroundColor: colors.cream, borderRadius: radius.badge,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  seatBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  // Projects
  projectCard:   { padding: 16 },
  projectTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, lineHeight: 21 },
  projectTags:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  projectTag:    { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  projectTagText:{ fontFamily: fonts.sans, fontSize: 11, color: colors.navy },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  projectMeta:   { flexDirection: 'row', gap: 5, alignItems: 'center' },
  projectMetaText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  // Course stats
  statsBanner: {
    flexDirection: 'row', backgroundColor: colors.navy,
    borderRadius: radius.card, padding: spacing.md, alignItems: 'center',
  },
  statItem:   { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  statLabel:  { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 2, textAlign: 'center' },
  statDivider:{ width: 1, height: 32, backgroundColor: 'rgba(245,240,232,0.15)' },

  // Notes
  noteCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  noteModuleBadge: { backgroundColor: colors.navy, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0 },
  noteModuleText:  { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },
  noteTitle:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  noteMeta:        { flexDirection: 'row', gap: 5, marginTop: 3 },
  noteMetaText:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  // Student cards
  studentCard: { width: 148, borderRadius: radius.card, padding: 14, marginRight: 12, alignItems: 'center' },
  studentAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(30,58,95,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  studentInitials: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },
  studentName:     { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textAlign: 'center' },
  studentUni:      { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy, opacity: 0.5, marginTop: 2 },
  studentCao:      { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 1 },
  studentCourse:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 3, lineHeight: 15 },
  studentSkills:   { flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  skillPill:       { backgroundColor: 'rgba(30,58,95,0.1)', borderRadius: radius.badge, paddingHorizontal: 7, paddingVertical: 3 },
  skillPillText:   { fontFamily: fonts.sans, fontSize: 10, color: colors.navy },

  // Discussions
  discussionCard:     { padding: 14 },
  discussionTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  discussionTime:     { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  discussionQuestion: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 19 },
  discussionMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  discussionReplies:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, flex: 1 },
  discussionUni:      { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy, opacity: 0.6 },

  // Mentors
  mentorCard:     { padding: 16, borderRadius: radius.card },
  mentorTop:      { flexDirection: 'row', alignItems: 'flex-start' },
  mentorAvatar:   {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(30,58,95,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  mentorName:       { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  mentorRole:       { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, opacity: 0.75, marginTop: 1 },
  mentorBackground: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  mentorAreas:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  mentorAreaPill:   { backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  mentorAreaText:   { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

  // Buttons
  joinBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  joinBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, marginTop: spacing.lg,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.button,
    height: 46, borderWidth: 1.5, borderColor: colors.border,
  },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
})
