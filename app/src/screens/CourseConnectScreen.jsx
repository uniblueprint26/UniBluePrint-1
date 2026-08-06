import { useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, Users, MessageSquare, BookMarked, Search, Briefcase, Star,
  GraduationCap, Compass, Globe,
  PenLine, BookOpenCheck, CalendarDays, Clock, BookOpen,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import FeatureCard from '../components/ui/FeatureCard'
import MockContentBanner from '../components/ui/MockContentBanner'
import SectionHeader from '../components/ui/SectionHeader'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'

// ─── Course feature products (7 total — 4 live, 3 coming soon) ───────────────

const COURSE_FEATURES = [
  {
    key: 'notes', label: 'NOTES EXCHANGE', Icon: FileText, color: '#EFF6FF',
    headline: 'Get ahead with peer notes',
    sub: 'Upload and access module summaries, lecture notes, and revision guides shared by students like you.',
    count: 'Growing',
    preview: [
      { text: 'MG4021 — Consumer Behaviour · Week 7 Summary · UL', meta: '142 views' },
      { text: 'CS2001 — Data Structures · Linked Lists & Trees · UCD', meta: '98 views' },
    ],
  },
  {
    key: 'groups', label: 'STUDY GROUPS', Icon: Users, color: '#F0FDF4',
    headline: 'Study with people who get it',
    sub: 'Form or join groups by module, topic, or upcoming deadline. Open to every campus in Ireland.',
    count: 'Coming soon',
    preview: [
      { text: 'CS2001 Exam Prep Group · UCD · 4 members', meta: 'Active' },
      { text: 'MG4021 Week 7 Revision · UL · 3 members', meta: 'Active' },
    ],
  },
  {
    key: 'qa', label: 'MODULE Q&A', Icon: MessageSquare, color: '#FDF4FF',
    headline: 'Get unstuck, fast',
    sub: 'Ask course-specific questions and get answers from students who have already been there.',
    count: 'Coming soon',
    preview: [
      { text: "What's the best way to approach Big O notation for the upcoming exam?", meta: 'CS2001' },
      { text: 'Can anyone explain the difference between void and voidable contracts?', meta: 'LA1102' },
    ],
  },
  {
    key: 'exams', label: 'EXAM RESOURCES', Icon: BookMarked, color: '#FFF7ED',
    headline: 'Past papers and revision guides in one place',
    sub: 'Access a growing library of past papers, exam tips, and revision guides across all Irish universities.',
    count: 'Coming soon',
    preview: [
      { text: 'UCD Business — 2023 Past Papers Bundle', meta: 'Past Paper' },
      { text: 'TCD Law — Essay structure and exam technique guide', meta: 'Guide' },
    ],
  },
  {
    key: 'resources', label: 'RESOURCE FINDER', Icon: Search, color: '#F0F9FF',
    headline: 'Find academic supports from any institution',
    sub: 'Search grants, scholarships, academic resources, and campus services across Ireland.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'industry', label: 'INDUSTRY DISCUSSIONS', Icon: Briefcase, color: '#FEF9C3',
    headline: 'Talk to people already in your field',
    sub: 'Industry-specific threads for students exploring careers. Ask, listen, and connect with those ahead of you.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'college_reviews', label: 'COLLEGE REVIEWS', Icon: Star, color: '#F0FDF4',
    headline: 'Real reviews of Irish colleges and courses',
    sub: 'Honest assessments from students across all institutions. Search by course, campus, or subject area.',
    count: 'Coming soon', coming: true,
  },
]

// ─── Academic Support: Course Tools (shells — exact tool set TBD) ─────────────
// NOTE: Exact tool set to be confirmed. Pattern and card structure built here.
const ACADEMIC_TOOLS = [
  {
    key: 'essay',       label: 'ESSAY & WRITING',    Icon: PenLine,      color: '#EFF6FF',
    headline: 'Write clearer, more structured essays',
    sub: 'Guidance on essay structure, argumentation, and academic writing style across disciplines.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'referencing', label: 'REFERENCING',         Icon: BookOpenCheck, color: '#F0FDF4',
    headline: 'Generate references in any style',
    sub: 'APA, Harvard, Chicago, and more. Build and export your bibliography in seconds.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'timetable',   label: 'TIMETABLE PLANNER',  Icon: CalendarDays,  color: '#FDF4FF',
    headline: 'Build your week before the week builds you',
    sub: 'Plan lectures, study sessions, and deadlines in one clear view. Syncs with your module list.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'tracker',     label: 'MODULE TRACKER',      Icon: Clock,         color: '#FFF7ED',
    headline: 'Stay on top of every assignment',
    sub: 'Log assessments, track grades, and never miss a submission deadline again.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'research',    label: 'RESEARCH SKILLS',     Icon: Search,        color: '#F0F9FF',
    headline: 'Find and evaluate academic sources',
    sub: 'Guidance on searching databases, evaluating sources, and building strong literature reviews.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'integrity',   label: 'ACADEMIC INTEGRITY',  Icon: BookOpen,      color: '#FEF9C3',
    headline: "Know your college's academic guidelines",
    sub: 'Plain-language summaries of plagiarism rules, proper citation, and what counts as collaboration.',
    count: 'Coming soon', coming: true,
  },
]

// ─── Popular Notes ────────────────────────────────────────────────────────────

const RECENT_NOTES = [
  { module: 'MG4021', title: 'Consumer Behaviour — Week 7 Summary', university: 'UL', views: 142, saved: 38 },
  { module: 'CS2001', title: 'Data Structures — Linked Lists & Trees', university: 'UCD', views: 98, saved: 22 },
  { module: 'LA1102', title: 'Contract Law — Offer & Acceptance Notes', university: 'TCD', views: 203, saved: 61 },
  { module: 'AC3010', title: 'Financial Accounting — Ratio Analysis', university: 'UCC', views: 87, saved: 19 },
]

// ─── Graduate Mentors ─────────────────────────────────────────────────────────

const GRADUATE_MENTORS = [
  {
    id: 'ciara', name: 'Ciara Nolan', shell: false,
    institution: 'UCD', course: 'Business & Finance', year: '2023',
    role: 'Graduate — KPMG Dublin',
    areas: ['Graduate Applications', 'Finance Careers', 'CV & LinkedIn'],
    bio: "Ciara completed her Business & Finance degree at UCD in 2023 and joined KPMG's graduate programme. She mentors students on navigating graduate applications, crafting strong CVs, and getting the most out of final year.",
    initials: 'CN', initBg: '#EFF6FF',
  },
  {
    id: 'james', name: 'James Healy', shell: false,
    institution: 'TCD', course: 'Computer Science', year: '2022',
    role: 'Software Engineer — Stripe',
    areas: ['Tech Careers', 'Technical Interviews', 'CS Projects'],
    bio: "James graduated from TCD's Computer Science programme in 2022 and joined Stripe's engineering team. He mentors on cracking technical interviews, building side projects that matter, and getting into top-tier tech roles.",
    initials: 'JH', initBg: '#F0FDF4',
  },
  {
    id: 'sarah', name: 'Sarah Fitzpatrick', shell: true,
    institution: 'UCC', course: 'Law', year: '2023',
    shellMessage: 'Full mentor profile coming soon.',
    initials: 'SF', initBg: '#FDF4FF',
  },
  {
    id: 'david', name: 'David Okafor', shell: true,
    institution: 'DCU', course: 'Communications', year: '2022',
    shellMessage: 'Full mentor profile coming soon.',
    initials: 'DO', initBg: '#FFF7ED',
  },
]

// ─── Student Database (27 members) ───────────────────────────────────────────

const STUDENT_PROFILES = [
  { name: 'Ethan',    uni: 'UCD',  course: 'Computer Science',       cao: 'DN110', skills: ['React', 'Python'],     initials: 'ET', color: '#EFF6FF' },
  { name: 'Fiza',     uni: 'TCD',  course: 'Law',                    cao: 'TR010', skills: ['Research', 'Writing'],  initials: 'FZ', color: '#F0FDF4' },
  { name: 'Nicole',   uni: 'UCC',  course: 'Medicine',               cao: 'CK101', skills: ['Biology', 'Chemistry'], initials: 'NL', color: '#FDF4FF' },
  { name: 'Eman',     uni: 'DCU',  course: 'Communications',         cao: 'DC116', skills: ['PR', 'Content'],        initials: 'EN', color: '#FFF7ED' },
  { name: 'Gigi',     uni: 'NUIG', course: 'Business',               cao: 'GY101', skills: ['Marketing', 'Excel'],   initials: 'GG', color: '#F0F9FF' },
  { name: 'Mohammed', uni: 'UCD',  course: 'Engineering',            cao: 'DN150', skills: ['CAD', 'Matlab'],        initials: 'MH', color: '#FEF9C3' },
  { name: 'Wami',     uni: 'TCD',  course: 'Business & Economics',   cao: 'TR004', skills: ['Finance', 'Excel'],     initials: 'WM', color: '#EFF6FF' },
  { name: 'Abdullah', uni: 'UCC',  course: 'Computer Science',       cao: 'CK401', skills: ['Java', 'React'],        initials: 'AB', color: '#F0FDF4' },
  { name: 'Siobhan',  uni: 'UL',   course: 'Nursing',                cao: 'LM116', skills: ['Biology', 'Health'],    initials: 'SB', color: '#FDF4FF' },
  { name: 'Ciaran',   uni: 'MTU',  course: 'Civil Engineering',      cao: 'CK600', skills: ['AutoCAD', 'Survey'],    initials: 'CI', color: '#FFF7ED' },
  { name: 'Aoife',    uni: 'UCD',  course: 'Arts',                   cao: 'DN001', skills: ['Writing', 'History'],   initials: 'AF', color: '#F0F9FF' },
  { name: 'Emily',    uni: 'DCU',  course: 'Journalism',             cao: 'DC118', skills: ['Writing', 'Social'],    initials: 'EM', color: '#FEF9C3' },
  { name: 'Zafur',    uni: 'TCD',  course: 'Computer Science',       cao: 'TR064', skills: ['Python', 'AI/ML'],      initials: 'ZF', color: '#EFF6FF' },
  { name: 'Maura',    uni: 'UCC',  course: 'Law',                    cao: 'CK200', skills: ['Research', 'Advocacy'], initials: 'MR', color: '#F0FDF4' },
  { name: 'Billy',    uni: 'UL',   course: 'Sports Science',         cao: 'LM051', skills: ['Fitness', 'Coaching'],  initials: 'BL', color: '#FDF4FF' },
  { name: 'Oisin',    uni: 'NUIG', course: 'Marine Science',         cao: 'GY301', skills: ['Research', 'Data'],     initials: 'OS', color: '#FFF7ED' },
  { name: 'Sinead',   uni: 'UCD',  course: 'Psychology',             cao: 'DN200', skills: ['Research', 'Stats'],    initials: 'SD', color: '#F0F9FF' },
  { name: 'Kofi',     uni: 'TCD',  course: 'Engineering',            cao: 'TR008', skills: ['Circuits', 'Python'],   initials: 'KF', color: '#FEF9C3' },
  { name: 'Seamus',   uni: 'ATU',  course: 'Business',               cao: 'GA201', skills: ['Sales', 'Marketing'],   initials: 'SM', color: '#EFF6FF' },
  { name: 'Sean',     uni: 'UCC',  course: 'Business & French',      cao: 'CK218', skills: ['French', 'Finance'],    initials: 'SN', color: '#F0FDF4' },
  { name: 'David',    uni: 'UCD',  course: 'Finance',                cao: 'DN155', skills: ['Excel', 'Bloomberg'],   initials: 'DV', color: '#FDF4FF' },
  { name: 'Isaac',    uni: 'DCU',  course: 'International Business', cao: 'DC200', skills: ['Languages', 'Trade'],   initials: 'IC', color: '#FFF7ED' },
  { name: 'Basmali',  uni: 'TCD',  course: 'Pharmacy',               cao: 'TR251', skills: ['Chemistry', 'Science'], initials: 'BM', color: '#F0F9FF' },
  { name: 'Fatima',   uni: 'UCC',  course: 'Social Work',            cao: 'CK730', skills: ['Empathy', 'Policy'],    initials: 'FT', color: '#FEF9C3' },
  { name: 'Sienna',   uni: 'NUIG', course: 'Marketing',              cao: 'GY201', skills: ['Branding', 'Content'],  initials: 'SI', color: '#EFF6FF' },
  { name: 'Alex',     uni: 'UL',   course: 'Architecture',           cao: 'LM085', skills: ['Revit', 'SketchUp'],    initials: 'AX', color: '#F0FDF4' },
  { name: 'Daniel',   uni: 'UCD',  course: 'Commerce',               cao: 'DN130', skills: ['Accounting', 'Law'],    initials: 'DN', color: '#FDF4FF' },
]

// ─── Course Discussions ───────────────────────────────────────────────────────

const DISCUSSIONS = [
  { module: 'CS2001', question: "What's the best way to approach Big O notation for the upcoming exam?", replies: 14, university: 'UCD', time: '2h ago' },
  { module: 'MG4021', question: 'Looking for Week 6 lecture notes for Consumer Behaviour — anyone have them?', replies: 7, university: 'UL', time: '5h ago' },
  { module: 'LA1102', question: 'Can anyone explain the difference between void and voidable contracts?', replies: 22, university: 'TCD', time: '1d ago' },
]

// ─── Cross-Ireland Features ───────────────────────────────────────────────────
// For graduates, prospective students, apprentices, and young workers.
const CROSS_IRELAND_FEATURES = [
  {
    key: 'grad_network', label: 'GRADUATE NETWORK', Icon: GraduationCap, color: 'rgba(245,240,232,0.15)',
    headline: 'Stay connected after you graduate',
    sub: 'A network for recent graduates across Irish institutions. Share opportunities, advice, and experience.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'cao_guide', label: 'CAO COURSE GUIDE', Icon: Compass, color: 'rgba(245,240,232,0.15)',
    headline: 'Find your course before you apply',
    sub: 'Course profiles, points history, and student reviews for every CAO-listed course in Ireland.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'apprenticeship', label: 'APPRENTICESHIP CONNECT', Icon: Briefcase, color: 'rgba(245,240,232,0.15)',
    headline: 'Navigate apprenticeships and vocational routes',
    sub: 'For young people in trade apprenticeships or vocational training. Resources, community, and support.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'industry_paths', label: 'INDUSTRY PATHWAYS', Icon: Globe, color: 'rgba(245,240,232,0.15)',
    headline: 'Explore where your course leads',
    sub: 'Industry-specific routes, salary benchmarks, and career insights for graduates and final-year students.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'all_reviews', label: 'COLLEGE REVIEWS (ALL-IRELAND)', Icon: Star, color: 'rgba(245,240,232,0.15)',
    headline: 'Every Irish college, reviewed honestly',
    sub: 'Open to current students, graduates, and prospective applicants. Search by course or institution.',
    count: 'Coming soon', coming: true,
  },
]

// ─── Mentor Card ──────────────────────────────────────────────────────────────

function MentorCard({ mentor }) {
  const [open, setOpen] = useState(false)
  const initials = mentor.name.split(' ').map(n => n[0]).join('')

  return (
    <View style={styles.mentorCard}>
      <TouchableOpacity
        style={styles.mentorRow}
        activeOpacity={mentor.shell ? 1 : 0.75}
        onPress={() => !mentor.shell && setOpen(v => !v)}
        disabled={mentor.shell}
      >
        <View style={[styles.mentorCircle, { backgroundColor: mentor.initBg }]}>
          <Text style={styles.mentorInitials}>{initials}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.mentorName}>{mentor.name}</Text>
          {mentor.shell ? (
            <Text style={styles.mentorShell}>{mentor.shellMessage}</Text>
          ) : (
            <>
              <Text style={styles.mentorRole}>{mentor.role}</Text>
              <Text style={styles.mentorCourse}>
                {mentor.course} · {mentor.institution} {mentor.year}
              </Text>
            </>
          )}
        </View>
        {!mentor.shell && (
          open
            ? <ChevronUp   size={15} color={colors.navy} />
            : <ChevronDown size={15} color={colors.muted} />
        )}
      </TouchableOpacity>

      {!mentor.shell && mentor.areas && (
        <View style={styles.mentorAreaRow}>
          {mentor.areas.map(a => (
            <View key={a} style={styles.mentorAreaPill}>
              <Text style={styles.mentorAreaPillText}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      {open && !mentor.shell && (
        <View style={styles.mentorExpanded}>
          <View style={styles.mentorDivider} />
          <Text style={styles.mentorBioLabel}>ABOUT</Text>
          <Text style={styles.mentorBio}>{mentor.bio}</Text>
          <TouchableOpacity style={styles.mentorConnectBtn} activeOpacity={0.8}>
            <Text style={styles.mentorConnectBtnText}>Request Mentorship</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CourseConnectScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>

      {/* ── Integrated header + hero (stats live in the navy block) ── */}
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
          <View style={{ width: 70 }} />
        </View>

        <Text style={styles.heroEyebrow}>COURSE CONNECT</Text>
        <Text style={styles.heroTitle}>Course Connect</Text>
        <Text style={styles.heroSub}>
          Notes, study groups, exam resources, and graduate mentors — built around your course and institution.
        </Text>

        {/*
          Stats — real Irish HE figures, not platform usage metrics.
          Source: HEA.ie Annual Report 2022/23 and CAO.ie course listings.

          TODO (permanent): Keep this stat in sync with app/src/data/institutions.js.
          Currently 94 named institutions (universities, TUs, IoTs, specialist, private,
          ETB FE colleges, Northern Ireland). Stat shown is 100+ (rounded to nearest 10).
          Update when institutions.js crosses the next 10-boundary.

          1,300+ CAO courses: approximate — confirm exact count at cao.ie before publishing
          240,000+ students: HE enrolments in Ireland per HEA — confirm exact figure
        */}
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNumber}>100+</Text>
            <Text style={styles.heroStatLabel}>Institutions{'\n'}Across Ireland</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNumber}>1,300+</Text>
            <Text style={styles.heroStatLabel}>CAO Courses{'\n'}Covered</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNumber}>240k+</Text>
            <Text style={styles.heroStatLabel}>Young People{'\n'}in Irish HE</Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 56 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* ── Course Tools ── */}
          <SectionHeader eyebrow="What's Available" title="Course Tools" style={{ marginTop: spacing.lg }} />
          <View style={{ gap: 14 }}>
            {COURSE_FEATURES.map(f => <FeatureCard key={f.key} feature={f} />)}
          </View>

          {/* ── Academic Support (white breakout section) ── */}
          <View style={styles.academicSection}>
            <Text style={styles.academicEyebrow}>ACADEMIC SUPPORT</Text>
            <Text style={styles.academicTitle}>Built for how you actually study</Text>
            <Text style={styles.academicSub}>
              Practical tools, relevant notes, and mentors who recently graduated from your course.
            </Text>

            <Text style={[styles.academicSubLabel, { marginTop: spacing.lg }]}>COURSE TOOLS</Text>
            <Text style={styles.academicSubSub}>Practical academic tools for your studies. Exact tool set being confirmed.</Text>
            <View style={{ gap: 12, marginTop: spacing.md }}>
              {ACADEMIC_TOOLS.map(f => <FeatureCard key={f.key} feature={f} />)}
            </View>

            <Text style={[styles.academicSubLabel, { marginTop: spacing.xl }]}>POPULAR NOTES</Text>
            <Text style={styles.academicSubSub}>Surfaced from students on similar courses. Shown as examples until your course community grows.</Text>
            <MockContentBanner
              title="Example notes — shown until your course goes live"
              subtitle="These notes are illustrative. Notes relevant to your module and institution will surface here once students start sharing."
              style={{ marginTop: spacing.md }}
            />
            <View style={{ gap: 10, marginTop: spacing.sm }}>
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

            <Text style={[styles.academicSubLabel, { marginTop: spacing.xl }]}>GRADUATE MENTORS</Text>
            <Text style={styles.academicSubSub}>Recently graduated from your course. Mentors who have been exactly where you are now.</Text>
            <MockContentBanner
              title="Mentorship programme — building now"
              subtitle="Mentors matched to your course and institution. Full programme launching soon."
              style={{ marginTop: spacing.md }}
            />
            <View style={{ gap: 12, marginTop: spacing.sm }}>
              {GRADUATE_MENTORS.map(m => <MentorCard key={m.id} mentor={m} />)}
            </View>
          </View>

          {/* ── Student Database ── */}
          <SectionHeader eyebrow="Student Network" title="Student Database" style={{ marginTop: spacing.xl }} />
          <MockContentBanner
            title="Full database coming soon"
            subtitle="Connect with students across Irish universities. Filter by course, year, and skills."
          />
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
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

          {/* ── Course Discussions ── */}
          <SectionHeader eyebrow="Community" title="Recent Discussions" style={{ marginTop: spacing.xl }} />
          <MockContentBanner
            title="Discussions — Building Now"
            subtitle="Module-specific Q&A threads launching with Course Connect. Ask questions, share answers."
          />
          <View style={{ gap: 10 }}>
            {DISCUSSIONS.map((d, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ChatRoom', {
                  contextType: 'board',
                  contextId:   `course-${d.module.toLowerCase()}`,
                  roomName:    `${d.module} Discussion`,
                  subtitle:    d.university,
                })}
              >
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

          {/* ── Cross-Ireland (navy breakout section) ── */}
          <View style={styles.crossIrelandSection}>
            <Text style={styles.crossIrelandEyebrow}>ACROSS IRELAND</Text>
            <Text style={styles.crossIrelandTitle}>Built for every young person in Ireland</Text>
            <Text style={styles.crossIrelandSub}>
              Not just current university students. Whether you're a recent graduate, a prospective student, or in an apprenticeship — this section is for you.
            </Text>
            <View style={{ gap: 14, marginTop: spacing.lg }}>
              {CROSS_IRELAND_FEATURES.map(f => (
                <FeatureCard key={f.key} feature={f} dark />
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Plus size={16} color={colors.cream} />
            <Text style={styles.primaryBtnText}>Share Your Notes</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Hero (includes stats)
  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
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
  heroTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.cream, lineHeight: 38, marginBottom: 10 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22, marginBottom: spacing.lg },

  // Stats inside hero
  heroStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,240,232,0.08)',
    borderRadius: radius.card, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.12)',
  },
  heroStatItem:   { flex: 1, alignItems: 'center' },
  heroStatNumber: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  heroStatLabel:  { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 3, textAlign: 'center', lineHeight: 14 },
  heroStatDivider:{ width: 1, height: 36, backgroundColor: 'rgba(245,240,232,0.15)' },

  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Academic Support section (white breakout)
  academicSection: {
    backgroundColor: colors.white,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginTop: spacing.xl,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
  },
  academicEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    letterSpacing: 1.2, marginBottom: 6,
  },
  academicTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy, lineHeight: 33 },
  academicSub:   { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 21 },
  academicSubLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy,
    opacity: 0.55, letterSpacing: 0.8,
  },
  academicSubSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },

  // Cross-Ireland section (navy breakout)
  crossIrelandSection: {
    backgroundColor: colors.navy,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  crossIrelandEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  crossIrelandTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, lineHeight: 33 },
  crossIrelandSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.65)', marginTop: 8, lineHeight: 21 },

  // Mentor Card
  mentorCard: {
    backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden',
    ...shadows.card,
  },
  mentorRow:     { flexDirection: 'row', alignItems: 'center', padding: 14 },
  mentorCircle:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mentorInitials:{ fontFamily: fonts.serif, fontSize: 16, color: colors.navy },
  mentorName:    { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  mentorRole:    { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, opacity: 0.75, marginTop: 1 },
  mentorCourse:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  mentorShell:   { fontFamily: fonts.sans, fontSize: 12, color: colors.light, fontStyle: 'italic', marginTop: 2 },
  mentorAreaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 14 },
  mentorAreaPill:     { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  mentorAreaPillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },
  mentorExpanded:     { paddingHorizontal: 14, paddingBottom: 16 },
  mentorDivider:      { height: 1, backgroundColor: 'rgba(30,58,95,0.08)', marginBottom: 14 },
  mentorBioLabel:     { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 6 },
  mentorBio:          { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },
  mentorConnectBtn:   { backgroundColor: colors.navy, borderRadius: 8, height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  mentorConnectBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // Notes
  rowScroll:       { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  noteCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  noteModuleBadge: { backgroundColor: colors.navy, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0 },
  noteModuleText:  { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },
  noteTitle:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  noteMeta:        { flexDirection: 'row', gap: 5, marginTop: 3 },
  noteMetaText:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  // Student cards
  studentCard:     { width: 148, borderRadius: radius.card, padding: 14, marginRight: 12, alignItems: 'center' },
  studentAvatar:   { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(30,58,95,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
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

  // CTAs
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.navy, borderRadius: 8, height: 54, marginTop: spacing.lg },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
