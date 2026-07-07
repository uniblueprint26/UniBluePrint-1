import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import {
  Users, BookOpen, Car, CalendarDays, FileText,
  MessageSquare, BookMarked, Search, ChevronRight,
  MapPin, Lightbulb, Plus, AlertCircle, User,
} from 'lucide-react-native'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import MockContentBanner from '../components/ui/MockContentBanner'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Campus Connect data ──────────────────────────────────────────────────────
const CAMPUS_FEATURES = [
  {
    icon: Users, color: '#FFF7ED',
    title: 'Campus Board',
    sub: 'Peer notices — sublets, events, lost & found, announcements',
    count: '42 live posts',
  },
  {
    icon: Car, color: '#F0FDF4',
    title: 'Carpooling',
    sub: 'Match with students on your route and split the cost',
    count: '17 active routes',
  },
  {
    icon: CalendarDays, color: '#EFF6FF',
    title: 'Campus Events',
    sub: "What's on across your campus this week",
    count: '8 this week',
  },
  {
    icon: Lightbulb, color: '#FDF4FF',
    title: 'Project Collaboration',
    sub: 'Post project ideas, find teammates, build something real',
    count: '11 open projects',
    isNew: true,
  },
]

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
    title: 'Student Ads', icon: '📢', color: '#F5F0E8', postCount: 7,
    posts: [
      { text: 'Guitar lessons available — €25/session, Dublin. Beginners welcome.', time: '1h ago' },
      { text: 'Professional CV & cover letter service — €25. Fast turnaround.', time: '2h ago' },
    ],
  },
]

const CAMPUS_AD_POSTS = [
  { title: 'Room — Smithfield', detail: '€650/month · June–Aug', tag: 'Accommodation', color: '#EFF6FF', emoji: '🏠' },
  { title: 'Guitar Lessons', detail: '€25/session · Dublin', tag: 'Tutoring', color: '#FDF4FF', emoji: '🎸' },
  { title: 'Textbooks For Sale', detail: '2nd yr Business · €15 each', tag: 'Marketplace', color: '#F0FDF4', emoji: '📚' },
  { title: 'CV Writing Help', detail: '€25 · Fast turnaround', tag: 'Services', color: '#FFF7ED', emoji: '✏️' },
  { title: 'Photography Services', detail: 'Student rate available', tag: 'Creative', color: '#FEF9C3', emoji: '📸' },
]

const CARPOOL_POSTS = [
  { from: 'Limerick City', to: 'UL Campus', time: 'Mon–Fri · 8:30am', seats: 2 },
  { from: 'Cork City Centre', to: 'UCC Main Gate', time: 'Mon/Wed/Fri · 9:00am', seats: 3 },
  { from: 'Galway City', to: 'NUIG Concourse', time: 'Daily · 8:00am', seats: 1 },
]

const PROJECTS = [
  { title: 'Campus Sustainability App', tags: ['Mobile Dev', 'UI/UX', 'Sustainability'], team: 2, need: 2, university: 'UCD' },
  { title: 'AI Study Planner — Final Year Project', tags: ['AI/ML', 'Python', 'React'], team: 1, need: 3, university: 'TCD' },
  { title: 'Student Budget Tracker', tags: ['Finance', 'App Dev', 'Open to All'], team: 3, need: 1, university: 'UL' },
]

// ─── Course Connect data ──────────────────────────────────────────────────────
const COURSE_FEATURES = [
  { icon: FileText,       color: '#EFF6FF', title: 'Notes Exchange',  sub: 'Upload and access peer notes and module summaries', count: '1,200+ notes' },
  { icon: Users,          color: '#F0FDF4', title: 'Study Groups',    sub: 'Form or join groups by module, topic, or deadline', count: '34 active groups' },
  { icon: MessageSquare,  color: '#FDF4FF', title: 'Module Q&A',      sub: 'Ask and answer course-specific questions', count: '280 answers' },
  { icon: BookMarked,     color: '#FFF7ED', title: 'Exam Resources',  sub: 'Past papers, tips, and revision guides', count: '500+ resources' },
]

const RECENT_NOTES = [
  { module: 'MG4021', title: 'Consumer Behaviour — Week 7 Summary', university: 'UL', views: 142, saved: 38 },
  { module: 'CS2001', title: 'Data Structures — Linked Lists & Trees', university: 'UCD', views: 98, saved: 22 },
  { module: 'LA1102', title: 'Contract Law — Offer & Acceptance Notes', university: 'TCD', views: 203, saved: 61 },
  { module: 'AC3010', title: 'Financial Accounting — Ratio Analysis', university: 'UCC', views: 87, saved: 19 },
]

// All 27 team member names — each with university, course, CAO number
const STUDENT_PROFILES = [
  { name: 'Ethan',    uni: 'UCD',  course: 'Computer Science',           cao: 'DN110', year: '3rd Year', skills: ['React', 'Python'],     initials: 'ET', color: '#EFF6FF' },
  { name: 'Fiza',     uni: 'TCD',  course: 'Law',                        cao: 'TR010', year: '2nd Year', skills: ['Research', 'Writing'],  initials: 'FZ', color: '#F0FDF4' },
  { name: 'Nicole',   uni: 'UCC',  course: 'Medicine',                   cao: 'CK101', year: '1st Year', skills: ['Biology', 'Chemistry'], initials: 'NL', color: '#FDF4FF' },
  { name: 'Eman',     uni: 'DCU',  course: 'Communications',             cao: 'DC116', year: '2nd Year', skills: ['PR', 'Content'],        initials: 'EN', color: '#FFF7ED' },
  { name: 'Gigi',     uni: 'NUIG', course: 'Business',                   cao: 'GY101', year: '3rd Year', skills: ['Marketing', 'Excel'],   initials: 'GG', color: '#F0F9FF' },
  { name: 'Mohammed', uni: 'UCD',  course: 'Engineering',                cao: 'DN150', year: '2nd Year', skills: ['CAD', 'Matlab'],        initials: 'MH', color: '#FEF9C3' },
  { name: 'Wami',     uni: 'TCD',  course: 'Business & Economics',       cao: 'TR004', year: '3rd Year', skills: ['Finance', 'Excel'],     initials: 'WM', color: '#EFF6FF' },
  { name: 'Abdullah', uni: 'UCC',  course: 'Computer Science',           cao: 'CK401', year: '4th Year', skills: ['Java', 'React'],        initials: 'AB', color: '#F0FDF4' },
  { name: 'Siobhan',  uni: 'UL',   course: 'Nursing',                    cao: 'LM116', year: '2nd Year', skills: ['Biology', 'Health'],    initials: 'SB', color: '#FDF4FF' },
  { name: 'Ciaran',   uni: 'MTU',  course: 'Civil Engineering',          cao: 'CK600', year: '3rd Year', skills: ['AutoCAD', 'Surveying'], initials: 'CI', color: '#FFF7ED' },
  { name: 'Aoife',    uni: 'UCD',  course: 'Arts',                       cao: 'DN001', year: '1st Year', skills: ['Writing', 'History'],   initials: 'AF', color: '#F0F9FF' },
  { name: 'Emily',    uni: 'DCU',  course: 'Journalism',                 cao: 'DC118', year: '2nd Year', skills: ['Writing', 'Social'],    initials: 'EM', color: '#FEF9C3' },
  { name: 'Zafur',    uni: 'TCD',  course: 'Computer Science',           cao: 'TR064', year: '3rd Year', skills: ['Python', 'AI/ML'],      initials: 'ZF', color: '#EFF6FF' },
  { name: 'Maura',    uni: 'UCC',  course: 'Law',                        cao: 'CK200', year: '4th Year', skills: ['Research', 'Advocacy'], initials: 'MR', color: '#F0FDF4' },
  { name: 'Billy',    uni: 'UL',   course: 'Sports Science',             cao: 'LM051', year: '2nd Year', skills: ['Fitness', 'Coaching'],  initials: 'BL', color: '#FDF4FF' },
  { name: 'Oisin',    uni: 'NUIG', course: 'Marine Science',             cao: 'GY301', year: '3rd Year', skills: ['Research', 'Data'],     initials: 'OS', color: '#FFF7ED' },
  { name: 'Sinead',   uni: 'UCD',  course: 'Psychology',                 cao: 'DN200', year: '2nd Year', skills: ['Research', 'Stats'],    initials: 'SD', color: '#F0F9FF' },
  { name: 'Kofi',     uni: 'TCD',  course: 'Engineering',                cao: 'TR008', year: '3rd Year', skills: ['Circuits', 'Python'],   initials: 'KF', color: '#FEF9C3' },
  { name: 'Seamus',   uni: 'ATU',  course: 'Business',                   cao: 'GA201', year: '1st Year', skills: ['Sales', 'Marketing'],   initials: 'SM', color: '#EFF6FF' },
  { name: 'Sean',     uni: 'UCC',  course: 'Business & French',          cao: 'CK218', year: '2nd Year', skills: ['French', 'Finance'],    initials: 'SN', color: '#F0FDF4' },
  { name: 'David',    uni: 'UCD',  course: 'Finance',                    cao: 'DN155', year: '3rd Year', skills: ['Excel', 'Bloomberg'],   initials: 'DV', color: '#FDF4FF' },
  { name: 'Isaac',    uni: 'DCU',  course: 'International Business',     cao: 'DC200', year: '2nd Year', skills: ['Languages', 'Trade'],   initials: 'IC', color: '#FFF7ED' },
  { name: 'Basmali',  uni: 'TCD',  course: 'Pharmacy',                   cao: 'TR251', year: '3rd Year', skills: ['Chemistry', 'Science'], initials: 'BM', color: '#F0F9FF' },
  { name: 'Fatima',   uni: 'UCC',  course: 'Social Work',                cao: 'CK730', year: '1st Year', skills: ['Empathy', 'Policy'],    initials: 'FT', color: '#FEF9C3' },
  { name: 'Sienna',   uni: 'NUIG', course: 'Marketing',                  cao: 'GY201', year: '2nd Year', skills: ['Branding', 'Content'],  initials: 'SI', color: '#EFF6FF' },
  { name: 'Alex',     uni: 'UL',   course: 'Architecture',               cao: 'LM085', year: '4th Year', skills: ['Revit', 'SketchUp'],   initials: 'AX', color: '#F0FDF4' },
  { name: 'Daniel',   uni: 'UCD',  course: 'Commerce',                   cao: 'DN130', year: '2nd Year', skills: ['Accounting', 'Law'],    initials: 'DN', color: '#FDF4FF' },
]

const DISCUSSIONS = [
  { module: 'CS2001', question: "What's the best way to approach Big O notation for the upcoming exam?", replies: 14, university: 'UCD', time: '2h ago' },
  { module: 'MG4021', question: 'Looking for Week 6 lecture notes for Consumer Behaviour — anyone have them?', replies: 7, university: 'UL', time: '5h ago' },
  { module: 'LA1102', question: 'Can anyone explain the difference between void and voidable contracts?', replies: 22, university: 'TCD', time: '1d ago' },
]

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

// ─── Campus tab ───────────────────────────────────────────────────────────────
function CampusTab() {
  const [search, setSearch] = useState('')

  return (
    <View>
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

      <SectionHeader eyebrow="What's Available" title="Campus Features" style={{ marginTop: spacing.lg }} />
      <View style={{ gap: 12 }}>
        {CAMPUS_FEATURES.map(({ icon: Icon, color, title, sub, count, isNew }) => (
          <TouchableOpacity key={title} activeOpacity={0.8}>
            <Card style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: color }]}>
                <Icon size={20} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.featureTitle}>{title}</Text>
                  {isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureSub}>{sub}</Text>
                <Text style={styles.featureCount}>{count}</Text>
              </View>
              <ChevronRight size={16} color={colors.light} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader eyebrow="Community Boards" title="Campus Boards" style={{ marginTop: spacing.xl }} />
      <MockContentBanner
        title="Campus Boards — Live Soon"
        subtitle="7 community boards launching when your campus goes live. Post notices, find rooms, sell textbooks, and more."
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
                <View key={i} style={[styles.boardPost, i > 0 && { marginTop: 8 }]}>
                  <Text style={styles.boardPostText} numberOfLines={2}>{post.text}</Text>
                  <Text style={styles.boardPostTime}>{post.time}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionHeader eyebrow="Project Collaboration" title="Open Projects" style={{ marginTop: spacing.xl }} />
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

      <SectionHeader eyebrow="Active Routes" title="Carpooling" style={{ marginTop: spacing.xl }} />
      <View style={styles.safetyBanner}>
        <AlertCircle size={15} color='#92400E' />
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

      <SectionHeader eyebrow="Student Ads" title="Advertisement Board" style={{ marginTop: spacing.xl }} />
      <View style={styles.adsGrid}>
        {CAMPUS_AD_POSTS.map((ad, i) => (
          <TouchableOpacity key={i} activeOpacity={0.8} style={styles.adsCell}>
            <Card style={[styles.adGridCard, { backgroundColor: ad.color }]}>
              <Text style={styles.adGridEmoji}>{ad.emoji}</Text>
              <View style={styles.adGridTag}>
                <Text style={styles.adGridTagText}>{ad.tag}</Text>
              </View>
              <Text style={styles.adGridTitle} numberOfLines={2}>{ad.title}</Text>
              <Text style={styles.adGridDetail} numberOfLines={2}>{ad.detail}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Plus size={16} color={colors.cream} />
        <Text style={styles.primaryBtnText}>Post to Campus Board</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Course tab ───────────────────────────────────────────────────────────────
function CourseTab() {
  return (
    <View>
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

      <SectionHeader eyebrow="Academic Support" title="Course Tools" style={{ marginTop: spacing.lg }} />
      <View style={{ gap: 12 }}>
        {COURSE_FEATURES.map(({ icon: Icon, color, title, sub, count }) => (
          <TouchableOpacity key={title} activeOpacity={0.8}>
            <Card style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: color }]}>
                <Icon size={20} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSub}>{sub}</Text>
                <Text style={styles.featureCount}>{count}</Text>
              </View>
              <ChevronRight size={16} color={colors.light} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader eyebrow="Recently Shared" title="Popular Notes" style={{ marginTop: spacing.xl }} />
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

      {/* Student Database — all 27 names */}
      <SectionHeader eyebrow="Student Network" title="Student Database" style={{ marginTop: spacing.xl }} />
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

      <SectionHeader eyebrow="Community" title="Recent Discussions" style={{ marginTop: spacing.xl }} />
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

      <SectionHeader eyebrow="Graduate Mentors" title="Mentorship" style={{ marginTop: spacing.xl }} />
      <MockContentBanner
        title="Mentorship Programme — Coming Soon"
        subtitle="Get matched with graduates in your field for career guidance and industry insights."
      />
      <View style={{ gap: 12 }}>
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

      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
        <Plus size={16} color={colors.cream} />
        <Text style={styles.primaryBtnText}>Share Your Notes</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ConnectScreen() {
  const [tab, setTab] = useState('campus')

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>COMMUNITY</Text>
          <Text style={styles.heroTitle}>Connect</Text>
          <Text style={styles.heroSub}>
            Campus life, academic support, and project collaboration — all in one place.
          </Text>
        </View>

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
    flexDirection: 'row', backgroundColor: colors.white, padding: 5,
    marginHorizontal: spacing.md, marginTop: spacing.md,
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

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.button,
    paddingHorizontal: 14, height: 48, ...shadows.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },

  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  featureIcon: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  featureSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  featureCount: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.navy, marginTop: 4, opacity: 0.6 },

  newBadge: { backgroundColor: '#7C3AED', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5 },

  rowScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },

  boardCard: { width: 220, borderRadius: radius.card, padding: 14, marginRight: 12 },
  boardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  boardEmoji: { fontSize: 22 },
  boardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  boardCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  boardPost: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: 8 },
  boardPostText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy, lineHeight: 16 },
  boardPostTime: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 3 },

  projectCard: { padding: 16 },
  projectTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, lineHeight: 21 },
  projectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  projectTag: { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  projectTagText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  projectMeta: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  projectMetaText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  joinBtn: { backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 18, paddingVertical: 8 },
  joinBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  safetyBanner: {
    backgroundColor: '#FEF3C7', borderRadius: radius.button,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, marginBottom: 4,
    borderWidth: 1, borderColor: 'rgba(146,64,14,0.2)',
  },
  safetyBannerText: { fontFamily: fonts.sans, fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },

  carpoolCard: { padding: 14 },
  carpoolRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  carpoolDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy },
  carpoolFrom: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  carpoolTo: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  carpoolFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  carpoolTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  seatBadge: { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  seatBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  adsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  adsCell: { width: '50%', padding: 6 },
  adGridCard: { padding: 14, borderRadius: radius.card, minHeight: 120 },
  adGridEmoji: { fontSize: 22, marginBottom: 8 },
  adGridTag: { backgroundColor: 'rgba(30,58,95,0.1)', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  adGridTagText: { fontFamily: fonts.sans, fontSize: 10, color: colors.navy },
  adGridTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, lineHeight: 18 },
  adGridDetail: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 3, lineHeight: 16 },

  statsBanner: {
    flexDirection: 'row', backgroundColor: colors.navy,
    borderRadius: radius.card, padding: spacing.md, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  statLabel: { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(245,240,232,0.15)' },

  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  noteModuleBadge: { backgroundColor: colors.navy, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0 },
  noteModuleText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },
  noteTitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  noteMeta: { flexDirection: 'row', gap: 5, marginTop: 3 },
  noteMetaText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  studentCard: { width: 148, borderRadius: radius.card, padding: 14, marginRight: 12, alignItems: 'center' },
  studentAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(30,58,95,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  studentInitials: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },
  studentName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textAlign: 'center' },
  studentUni: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy, opacity: 0.5, marginTop: 2 },
  studentCao: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, marginTop: 1 },
  studentCourse: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 3, lineHeight: 15 },
  studentSkills: { flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  skillPill: { backgroundColor: 'rgba(30,58,95,0.1)', borderRadius: radius.badge, paddingHorizontal: 7, paddingVertical: 3 },
  skillPillText: { fontFamily: fonts.sans, fontSize: 10, color: colors.navy },

  discussionCard: { padding: 14 },
  discussionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  discussionTime: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  discussionQuestion: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 19 },
  discussionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  discussionReplies: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, flex: 1 },
  discussionUni: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy, opacity: 0.6 },

  mentorCard: { padding: 16, borderRadius: radius.card },
  mentorTop: { flexDirection: 'row', alignItems: 'flex-start' },
  mentorAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(30,58,95,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  mentorName: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  mentorRole: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, opacity: 0.75, marginTop: 1 },
  mentorBackground: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  mentorAreas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  mentorAreaPill: { backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  mentorAreaText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, marginTop: spacing.lg,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
