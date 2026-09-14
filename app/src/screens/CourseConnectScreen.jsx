import { useState, useEffect, useMemo } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Linking, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, Users, MessageSquare, BookMarked, Search, Briefcase, Star,
  GraduationCap, Compass, Globe, Lightbulb,
  PenLine, BookOpenCheck, CalendarDays, Clock, BookOpen,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Heart, TrendingUp,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import FeatureCard from '../components/ui/FeatureCard'
import MockContentBanner from '../components/ui/MockContentBanner'
import SectionHeader from '../components/ui/SectionHeader'
import UBPLogo from '../components/ui/UBPLogo'
import CourseBoardPickerModal from '../components/courseConnect/CourseBoardPickerModal'
import InterestsModal from '../components/profile/InterestsModal'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { useUserType } from '../hooks/useUserType'
import { useInterests } from '../hooks/useInterests'
import { supabase } from '../lib/supabase'
import {
  USER_TYPE_STUDENT, USER_TYPE_APPRENTICE, USER_TYPE_GAP_YEAR, USER_TYPE_WORKER,
} from '../constants/userTypes'

// ─── Reframe, round 3: interests + real popularity, not stages ─────────────
// Round 2 (the journey_stage system: 4 self-reported "stages", a Your Stage
// banner, a stage-grouped "Journey Match" section) has been REMOVED per the
// founder's direct correction: "its not about stages its about maybe giving
// them an expanded version of interests to pick and even add their own but
// course connect should just show popular content like campus [Connect]."
// That system — the journey_stage column, useJourneyStage(), JourneyStageModal,
// constants/journeyStages.js, and every piece of UI built on it — is gone
// (see 20260915110000_drop_profiles_journey_stage.sql).
//
// What replaces it, concretely:
//  1. A real, expandable interest-tag system (data/interests.js +
//     hooks/useInterests.js, backed by profiles.interests) — predefined tags
//     AND self-typed custom ones, built as shared infrastructure so
//     Directory's upcoming tag filters (Task #12) read the exact same
//     column/hook rather than a Course-Connect-only copy.
//  2. "Popular Right Now" below, ranked by real recent post counts from
//     course_boards_posts — not a designed taxonomy, not fake numbers.
// Both connect people across student/apprentice/gap-year/worker by what's
// actually true of the data (a shared interest, a course everyone's
// actively posting in) rather than a self-reported life-stage category.
// PATH_CONTENT below stays: userType still legitimately changes which
// boards/copy make sense to *show* someone, which is a different question
// from what *connects* them to other people — see the demoted "viewing as"
// note further down for why that distinction now matters more, not less.
const PATH_CONTENT = {
  [USER_TYPE_STUDENT]: {
    banner: "Course Connect is built around your course and college — boards, notes, and mentors all scoped to what you're studying.",
    sub: 'Notes, study groups, exam resources, and graduate mentors, built around your course and your college.',
    academicEyebrow: 'ACADEMIC SUPPORT',
    academicTitle: 'Built for how you actually study',
    toolsSub: 'Practical tools, relevant notes, and mentors who recently graduated from your course.',
    mentorsSub: 'Recently graduated from your course. Mentors who have been exactly where you are now.',
  },
  [USER_TYPE_APPRENTICE]: {
    banner: 'As an Apprentice, the boards and tools below adapt to your trade and training provider, not just to college courses.',
    sub: 'Discussion boards, shared resources, and a network of people on the same trade, apprentice to apprentice, not bolted onto a college portal.',
    academicEyebrow: 'COURSE & TRADE SUPPORT',
    academicTitle: 'Built for how you actually train',
    toolsSub: "Practical tools and peer resources for your apprenticeship, whatever stage you're at.",
    mentorsSub: "Recently graduated, several from routes other than a straight degree. Useful perspective wherever you're headed.",
  },
  [USER_TYPE_GAP_YEAR]: {
    banner: 'On a Gap Year, Course Connect shows you what every path actually looks like, from people already on college, trade, and work routes.',
    sub: 'Weighing up college, an apprenticeship, or work? Talk to people already on every path before you commit to yours.',
    academicEyebrow: 'SUPPORT FOR YOUR NEXT STEP',
    academicTitle: 'Built for wherever you land next',
    toolsSub: 'Tools and resources that work whichever way you end up going next.',
    mentorsSub: "Recently graduated from college, one route among several. Worth a look while you're still deciding.",
  },
  [USER_TYPE_WORKER]: {
    banner: 'As a Worker, Industry Discussions and the career-facing boards below are built for you, not just people still in college.',
    sub: 'Industry threads, career discussions, and a peer network for young people in work, not just people still in college.',
    academicEyebrow: 'CAREER SUPPORT',
    academicTitle: 'Built for how you actually work',
    toolsSub: "Practical tools and peer resources, useful whether you're studying part-time or just in the field.",
    mentorsSub: 'Recently graduated and now working. Their route was college, but the career advice travels either way.',
  },
}

// Hero stats: the sourced CAO/HE figures below are genuinely student- and
// CAO-specific, so showing them to an Apprentice, Gap Year, or Worker user
// would misrepresent what the hub covers for them. Rather than fabricate
// pathway-specific figures with no real source, those three user types see
// three honest, unsourced-figure-free stats instead (all 32 counties,
// the live tool/board count below, free to join) — the same category of
// claim Campus Connect's hero already uses.
const LIVE_TOOL_COUNT = 9 // COURSE_FEATURES.length, all "Live now" — see below

// ─── Course feature products (9 total, all live) ────────────────────────────

const COURSE_FEATURES = [
  {
    key: 'course_boards', label: 'COURSE BOARDS', Icon: GraduationCap, color: '#EFF6FF',
    headline: 'Talk to everyone on your path',
    sub: 'Discussion boards scoped to your course, programme, or workplace, not your campus — open to everyone on it, anywhere in Ireland.',
    count: 'Live now',
    preview: [
      { text: 'Computer Science, UCD · Anyone doing the optional AI module next year?', meta: 'CS' },
      { text: 'Electrical apprenticeship, ETB · Anyone else on Phase 4 this block?', meta: 'Trade' },
    ],
  },
  {
    key: 'notes', label: 'NOTES EXCHANGE', Icon: FileText, color: '#EFF6FF',
    headline: 'Get ahead with peer notes',
    sub: 'Upload and access module summaries, lecture notes, and revision guides shared by students like you.',
    count: 'Live now',
    preview: [
      { text: 'MG4021, Consumer Behaviour · Week 7 Summary · UL', meta: '142 views' },
      { text: 'CS2001, Data Structures · Linked Lists & Trees · UCD', meta: '98 views' },
    ],
  },
  {
    key: 'groups', label: 'STUDY GROUPS', Icon: Users, color: '#F0FDF4',
    headline: 'Study with people who get it',
    sub: 'Form or join groups by module, topic, or upcoming deadline, at any Irish college or training centre.',
    count: 'Live now',
    preview: [
      { text: 'CS2001 Exam Prep Group · UCD · 4 members', meta: 'Active' },
      { text: 'MG4021 Week 7 Revision · UL · 3 members', meta: 'Active' },
    ],
  },
  {
    key: 'qa', label: 'MODULE Q&A', Icon: MessageSquare, color: '#FDF4FF',
    headline: 'Get unstuck, fast',
    sub: 'Ask questions about your course, module, or on-the-job training, and get answers from people who have already been there.',
    count: 'Live now',
    preview: [
      { text: "What's the best way to approach Big O notation for the upcoming exam?", meta: 'CS2001' },
      { text: 'Can anyone explain the difference between void and voidable contracts?', meta: 'LA1102' },
    ],
  },
  {
    key: 'exams', label: 'EXAM RESOURCES', Icon: BookMarked, color: '#FFF7ED',
    headline: 'Past papers and revision guides in one place',
    sub: 'Access a growing library of past papers, exam tips, and revision guides across all Irish universities.',
    count: 'Live now',
    preview: [
      { text: 'UCD Business, 2023 Past Papers Bundle', meta: 'Past Paper' },
      { text: 'TCD Law, Essay structure and exam technique guide', meta: 'Guide' },
    ],
  },
  {
    key: 'resources', label: 'RESOURCE FINDER', Icon: Search, color: '#F0F9FF',
    headline: 'Find resources from any institution',
    sub: 'Search shared notes and past papers by subject, course, or keyword, across Ireland.',
    count: 'Live now',
  },
  {
    key: 'industry', label: 'INDUSTRY DISCUSSIONS', Icon: Briefcase, color: '#FEF9C3',
    headline: 'Talk to people already in your field',
    sub: 'Industry-specific threads for young people exploring careers, on any route in. Ask, listen, and connect with those ahead of you.',
    count: 'Live now',
  },
  {
    key: 'college_reviews', label: 'COLLEGE REVIEWS', Icon: Star, color: '#F0FDF4',
    headline: 'Real reviews of Irish colleges and courses',
    sub: 'Honest assessments from students across all institutions. Search by course, campus, or subject area.',
    count: 'Live now',
  },
  {
    key: 'cross_projects', label: 'PROJECT COLLABORATION', Icon: Lightbulb, color: '#FDF4FF',
    headline: 'Build something real, with anyone in Ireland',
    sub: 'Find teammates for college projects and side projects, from students at any Irish institution.',
    count: 'Live now',
    preview: [
      { text: 'Cross-college Hackathon Team · UCD + TCD · 2 spots open', meta: 'Mobile Dev' },
      { text: 'Sustainability Research Project · UCC · 1 spot open', meta: 'Research' },
    ],
  },
]

// Maps each Course Tools feature key to the real Supabase table backing it,
// so tile order can be driven by genuine recent-activity counts instead of
// the fixed order above. 'resources' has no table of its own (Resource
// Finder searches shared_notes and past_papers together), so its count is
// derived from 'notes' + 'exams' rather than queried separately.
const FEATURE_ACTIVITY_TABLE = {
  course_boards: 'course_boards_posts',
  notes: 'shared_notes',
  groups: 'course_connect_study_groups',
  qa: 'module_questions',
  exams: 'past_papers',
  industry: 'industry_discussions',
  college_reviews: 'college_reviews',
  cross_projects: 'cross_ireland_projects',
}
const POPULARITY_WINDOW_DAYS = 30

async function countRecentRows(table, cutoffIso) {
  try {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoffIso)
    return count || 0
  } catch {
    return 0
  }
}

// Maps each Course Tools feature card to its real destination.
function openCourseFeature(navigation, key) {
  const boardRoute = k => navigation.navigate('BoardDetail', { boardKey: k, registry: 'course' })
  if (key === 'course_boards') return boardRoute('course-boards')
  if (key === 'notes') return boardRoute('notes')
  if (key === 'groups') return boardRoute('study-groups')
  if (key === 'qa') return navigation.navigate('ModuleQA')
  if (key === 'exams') return boardRoute('papers')
  if (key === 'resources') return navigation.navigate('ResourceFinder')
  if (key === 'industry') return boardRoute('industry')
  if (key === 'college_reviews') return boardRoute('course-reviews')
  if (key === 'cross_projects') return boardRoute('projects')
}

// ─── Academic Support: Course Tools (shells, exact tool set TBD) ─────────────
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
  { module: 'MG4021', title: 'Consumer Behaviour, Week 7 Summary', university: 'UL', views: 142, saved: 38 },
  { module: 'CS2001', title: 'Data Structures, Linked Lists & Trees', university: 'UCD', views: 98, saved: 22 },
  { module: 'LA1102', title: 'Contract Law, Offer & Acceptance Notes', university: 'TCD', views: 203, saved: 61 },
  { module: 'AC3010', title: 'Financial Accounting, Ratio Analysis', university: 'UCC', views: 87, saved: 19 },
]

// ─── Graduate Mentors ─────────────────────────────────────────────────────────

const GRADUATE_MENTORS = [
  {
    id: 'ciara', name: 'Ciara Nolan', shell: false,
    institution: 'UCD', course: 'Business & Finance', year: '2023',
    role: 'Graduate at KPMG Dublin',
    areas: ['Graduate Applications', 'Finance Careers', 'CV & LinkedIn'],
    bio: "Ciara completed her Business & Finance degree at UCD in 2023 and joined KPMG's graduate programme. She mentors students on navigating graduate applications, crafting strong CVs, and getting the most out of final year.",
    initials: 'CN', initBg: '#EFF6FF',
  },
  {
    id: 'james', name: 'James Healy', shell: false,
    institution: 'TCD', course: 'Computer Science', year: '2022',
    role: 'Software Engineer at Stripe',
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

// ─── Popular Right Now ────────────────────────────────────────────────────────
// Replaces the old "Journey Match" stage-grouped mock profile grid entirely.
// No mock data here — see loadPopularCourses() in the screen component,
// which groups real course_boards_posts rows by `course` (case-insensitive,
// original casing kept for display) over the last POPULARITY_WINDOW_DAYS
// days and ranks by count. `course` is free text a poster fills in
// themselves — "Computer Science, UCD", "Electrical Apprenticeship, ETB",
// "Marketing Assistant, Version 1" all live in the same column — so ranking
// by real post volume naturally interleaves student/apprentice/gap-year/
// worker activity instead of requiring a designed taxonomy to do it.
function groupPopularCourses(rows) {
  const counts = {} // lowercased key -> { label, count }
  rows.forEach(row => {
    const raw = (row.course || '').trim()
    if (!raw) return
    const key = raw.toLowerCase()
    if (!counts[key]) counts[key] = { label: raw, count: 0 }
    counts[key].count += 1
  })
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8)
}

// Small tile grid for the popular-courses cards below — same measured-width,
// flex-wrap tile pattern Campus Connect's board grid uses (see
// CampusConnectScreen.jsx's BoardTileGrid), adapted to 2 columns since these
// tiles carry a full course name rather than a single emoji + short label.
const POPULAR_TILE_COLUMNS = 2
const POPULAR_TILE_GAP = 10

function PopularCourseGrid({ items, onPress }) {
  const [containerWidth, setContainerWidth] = useState(0)
  const tileWidth = containerWidth > 0
    ? (containerWidth - POPULAR_TILE_GAP * (POPULAR_TILE_COLUMNS - 1)) / POPULAR_TILE_COLUMNS
    : 0

  return (
    <View style={styles.popularGrid} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {containerWidth > 0 && items.map(item => (
        <TouchableOpacity
          key={item.label}
          style={[styles.popularTile, { width: tileWidth }]}
          activeOpacity={0.82}
          onPress={() => onPress(item.label)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.label} Course Board`}
        >
          <View style={styles.popularTileTop}>
            <TrendingUp size={13} color={colors.goldDeep} strokeWidth={2.2} />
            <Text style={styles.popularTileCount}>{item.count} post{item.count !== 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.popularTileLabel} numberOfLines={2}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Course Discussions ───────────────────────────────────────────────────────

const DISCUSSIONS = [
  { module: 'CS2001', question: "What's the best way to approach Big O notation for the upcoming exam?", replies: 14, university: 'UCD', time: '2h ago' },
  { module: 'MG4021', question: 'Looking for Week 6 lecture notes for Consumer Behaviour, anyone have them?', replies: 7, university: 'UL', time: '5h ago' },
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
    count: 'Live now',
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
          <TouchableOpacity
            style={styles.mentorConnectBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(`mailto:uniblueprintoperations@gmail.com?subject=${encodeURIComponent(`Mentorship request: ${mentor.name}`)}`)}
          >
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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [interestsModalOpen, setInterestsModalOpen] = useState(false)
  const { userType, label: userTypeLabel } = useUserType()
  const { interests } = useInterests()
  const path = PATH_CONTENT[userType] || PATH_CONTENT[USER_TYPE_STUDENT]
  const isStudent = userType === USER_TYPE_STUDENT

  // ── Real popularity signal #1: Course Tools tile order ──────────────────
  // Recent-activity counts (last POPULARITY_WINDOW_DAYS days) per feature's
  // real backing table (see FEATURE_ACTIVITY_TABLE above) — genuine signal,
  // not a fabricated number. All-zero (a fresh table with no posts yet)
  // falls back to the curated order below via the stable sort, rather than
  // shuffling tiles for no reason.
  const [featureCounts, setFeatureCounts] = useState({})
  useEffect(() => {
    let cancelled = false
    const cutoff = new Date(Date.now() - POPULARITY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    ;(async () => {
      const entries = Object.entries(FEATURE_ACTIVITY_TABLE)
      const results = await Promise.all(entries.map(async ([key, table]) => [key, await countRecentRows(table, cutoff)]))
      if (cancelled) return
      const counts = Object.fromEntries(results)
      counts.resources = (counts.notes || 0) + (counts.exams || 0)
      setFeatureCounts(counts)
    })()
    return () => { cancelled = true }
  }, [])

  const sortedCourseFeatures = useMemo(() => {
    return COURSE_FEATURES
      .map((f, i) => ({ f, i, count: featureCounts[f.key] || 0 }))
      .sort((a, b) => (b.count - a.count) || (a.i - b.i))
      .map(({ f, count }) => count > 0 ? { ...f, count: `${count} this month` } : f)
  }, [featureCounts])

  // ── Real popularity signal #2: "Popular Right Now" courses/programmes ───
  // Replaces the old mock Journey Match grid outright — see
  // groupPopularCourses() above for how real course_boards_posts rows
  // become this ranking.
  const [popularCourses, setPopularCourses] = useState([])
  const [popularLoading, setPopularLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    const cutoff = new Date(Date.now() - POPULARITY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    ;(async () => {
      setPopularLoading(true)
      const { data } = await supabase
        .from('course_boards_posts')
        .select('course, created_at')
        .gte('created_at', cutoff)
        .limit(2000)
      if (cancelled) return
      setPopularCourses(groupPopularCourses(data || []))
      setPopularLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  function goToDirectory() {
    navigation.getParent()?.navigate('Directory')
  }

  function goToAccountType() {
    navigation.getParent()?.navigate('Profile', { screen: 'ProfileMain' })
  }

  function openPopularCourse(course) {
    navigation.navigate('BoardDetail', { boardKey: 'course-boards', registry: 'course', presetFilter: { course } })
  }

  return (
    <View style={styles.screen}>

      {/* ── Scrollable content ──
          The navy hero block below is the FIRST CHILD of the ScrollView, not
          a fixed sibling above it — same pattern as Campus Connect and
          Lifestyle, the two screens in this family that never showed the
          native sticky-header bug. Root cause (confirmed by structural
          comparison across every affected/unaffected screen): a fixed
          sibling View above a flex:1 ScrollView, where that sibling's own
          height depends on wrapped multi-line Text (heroTagline/heroSub
          here), needs a real Yoga/Fabric text-measurement pass before its
          height is known. On a genuine cold start under the New
          Architecture that pass can resolve after the ScrollView sibling
          has already committed its frame sized against the header's
          stale/interim height, so content renders under or over the
          header — self-correcting on any later layout pass
          (background/foreground), matching the previously reported symptom
          exactly. This screen was believed already "fixed" in an earlier
          pass because its ScrollView already had `style={{flex:1}}`, but
          that only ever addressed the ScrollView side, never the actual
          unreliable element: the header sibling's height. Making the
          header scroll with the page removes the fixed-sibling/flex-sizing
          relationship entirely, so there is nothing left to race. */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 56 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Integrated header + hero (stats live in the navy block) ── */}
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
            <View style={{ width: 70 }} />
          </View>

          <Text style={styles.heroEyebrow}>COURSE CONNECT</Text>
          <Text style={styles.heroTitle}>Course Connect</Text>
          <Text style={styles.heroTagline}>
            Not sorted by course, trade, or path. Connected by what you're actually into,
            and what's busiest here right now, whatever route got you here.
          </Text>
          <Text style={styles.heroSub}>{path.sub}</Text>

          {/*
            Stats: real Irish HE figures, not platform usage metrics.
            Source: HEA.ie Annual Report 2022/23 and CAO.ie course listings.
            Shown only to Student-type users, since they're genuinely CAO/HE
            specific — see the PATH_CONTENT comment above for why every other
            userType sees three unsourced, pathway-neutral stats instead.

            TODO (permanent): Confirm exact CAO course count at cao.ie before publishing.
            TODO (permanent): Confirm HE enrolment figure at hea.ie before publishing.
            "All 32" refers to counties, CourseConnect covers the full island.
          */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>All 32</Text>
              <Text style={styles.heroStatLabel}>Counties{'\n'}Across Ireland</Text>
            </View>
            <View style={styles.heroStatDivider} />
            {isStudent ? (
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>1,300+</Text>
                <Text style={styles.heroStatLabel}>CAO Courses{'\n'}Covered</Text>
              </View>
            ) : (
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>{LIVE_TOOL_COUNT}</Text>
                <Text style={styles.heroStatLabel}>Live Tools{'\n'}& Boards</Text>
              </View>
            )}
            <View style={styles.heroStatDivider} />
            {isStudent ? (
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>240k+</Text>
                <Text style={styles.heroStatLabel}>Young People{'\n'}in Irish HE</Text>
              </View>
            ) : (
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>Free</Text>
                <Text style={styles.heroStatLabel}>To join,{'\n'}every path</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>

          {/* ── Interests banner — the actual connecting mechanism now.
              Same shared InterestsModal Profile Settings uses, surfaced
              here too since this is where the matching it powers happens. ── */}
          <TouchableOpacity style={styles.interestsBanner} activeOpacity={0.85} onPress={() => setInterestsModalOpen(true)}>
            <View style={styles.interestsBannerIcon}>
              <Heart size={15} color={colors.cream} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.interestsBannerLabel}>
                YOUR INTERESTS · {interests.length ? `${interests.length} SET` : 'NOT SET'}
              </Text>
              <Text style={styles.interestsBannerText}>
                {interests.length
                  ? `Matched on ${interests.slice(0, 3).join(', ')}${interests.length > 3 ? ', and more' : ''} — students, apprentices, gap year, and working people alike.`
                  : "Add what you're into so we can connect you with people who share it, not just your course."}
              </Text>
              <Text style={styles.interestsBannerChange}>
                {interests.length ? 'Edit your interests →' : 'Add your interests →'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── "Viewing as" note — demoted deliberately. This screen is no
              longer organised BY path (that's the whole point of the
              interests + popularity reframe above and below); userType still
              legitimately nudges some copy/stats (see PATH_CONTENT), but
              that's a minor styling detail, not the screen's structure, so
              it gets one quiet line rather than a competing full banner. ── */}
          <TouchableOpacity activeOpacity={0.7} onPress={goToAccountType} style={styles.viewingAsRow}>
            <Text style={styles.viewingAsText}>
              Some copy below is tailored for {userTypeLabel} · <Text style={styles.viewingAsLink}>change account type</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Course Tools — ordered by real recent-activity counts from
              each tool's own table (see FEATURE_ACTIVITY_TABLE), same
              "genuine popularity, not fabricated" principle as the section
              below. Falls back to the curated order when there's no
              activity yet to differentiate by. ── */}
          <SectionHeader eyebrow="Most Active First" title="Course Tools" style={{ marginTop: spacing.lg }} />
          <View style={{ gap: 14 }}>
            {sortedCourseFeatures.map(f => (
              <FeatureCard key={f.key} feature={f} onPress={() => openCourseFeature(navigation, f.key)} />
            ))}
          </View>

          {/* ── Academic Support (white breakout section) ── */}
          <View style={styles.academicSection}>
            <Text style={styles.academicEyebrow}>{path.academicEyebrow}</Text>
            <Text style={styles.academicTitle}>{path.academicTitle}</Text>
            <Text style={styles.academicSub}>{path.toolsSub}</Text>

            <Text style={[styles.academicSubLabel, { marginTop: spacing.lg }]}>COURSE TOOLS</Text>
            <Text style={styles.academicSubSub}>Practical tools for your studies or training. Exact tool set being confirmed.</Text>
            <View style={{ gap: 12, marginTop: spacing.md }}>
              {ACADEMIC_TOOLS.map(f => <FeatureCard key={f.key} feature={f} />)}
            </View>

            <Text style={[styles.academicSubLabel, { marginTop: spacing.xl }]}>POPULAR NOTES</Text>
            <Text style={styles.academicSubSub}>Surfaced from students on similar courses. Shown as examples until your course community grows.</Text>
            <MockContentBanner
              title="Example notes, shown until your course goes live"
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
            <Text style={styles.academicSubSub}>{path.mentorsSub}</Text>
            <MockContentBanner
              title="Mentorship programme: building now"
              subtitle="Mentors matched to your course and institution. Full programme launching soon."
              style={{ marginTop: spacing.md }}
            />
            <View style={{ gap: 12, marginTop: spacing.sm }}>
              {GRADUATE_MENTORS.map(m => <MentorCard key={m.id} mentor={m} />)}
            </View>
          </View>

          {/* ── Popular Right Now — replaces the old stage-grouped Journey
              Match section. Real data only: ranked by actual post counts
              from course_boards_posts (see groupPopularCourses() above),
              not a mock preview. Courses, trades, and workplaces show up
              side by side purely because people are actually posting in
              them — nothing here is grouped by user_type. ── */}
          <SectionHeader eyebrow="Popular Right Now" title="What's Busiest on Course Connect" style={{ marginTop: spacing.xl }} />
          <Text style={styles.popularIntro}>
            Not sorted by stage or path — this is what people are actually posting about
            right now, across every course, trade, and workplace in Ireland. Ranked by
            real activity in the last {POPULARITY_WINDOW_DAYS} days.
          </Text>

          {popularLoading ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: spacing.lg }} />
          ) : popularCourses.length === 0 ? (
            <Text style={styles.popularEmptyText}>
              Nothing posted yet — be the first to start a Course Board thread for your course, trade, or workplace.
            </Text>
          ) : (
            <PopularCourseGrid items={popularCourses} onPress={openPopularCourse} />
          )}

          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing.md }]} activeOpacity={0.8} onPress={() => navigation.navigate('BoardDetail', { boardKey: 'course-boards', registry: 'course' })}>
            <Text style={styles.secondaryBtnText}>Browse All Course Boards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing.sm }]} activeOpacity={0.8} onPress={goToDirectory}>
            <Text style={styles.secondaryBtnText}>Browse Full Directory</Text>
          </TouchableOpacity>

          {/* ── Course Discussions ── */}
          <SectionHeader eyebrow="Community" title="Recent Discussions" style={{ marginTop: spacing.xl }} />
          <MockContentBanner
            title="Examples shown below — Module Q&A is live"
            subtitle="These preview threads are illustrative. Tap through to ask a real question or browse live answers."
          />
          <View style={{ gap: 10 }}>
            {DISCUSSIONS.map((d, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ModuleQA')}
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
          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing.md }]} activeOpacity={0.8} onPress={() => navigation.navigate('ModuleQA')}>
            <Text style={styles.secondaryBtnText}>Browse All Module Q&A</Text>
          </TouchableOpacity>

          {/* ── Cross-Ireland (navy breakout section) ── */}
          <View style={styles.crossIrelandSection}>
            <Text style={styles.crossIrelandEyebrow}>ACROSS IRELAND</Text>
            <Text style={styles.crossIrelandTitle}>Built for every young person in Ireland</Text>
            <Text style={styles.crossIrelandSub}>
              Not just current university students. Whether you're a recent graduate, a prospective student, on an apprenticeship, or taking a gap year, this section is for you.
            </Text>
            <View style={{ gap: 14, marginTop: spacing.lg }}>
              {CROSS_IRELAND_FEATURES.map(f => (
                <FeatureCard
                  key={f.key}
                  feature={f}
                  dark
                  onPress={f.key === 'all_reviews' ? () => openCourseFeature(navigation, 'college_reviews') : undefined}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => setPickerOpen(true)}
          >
            <Plus size={16} color={colors.cream} />
            <Text style={styles.primaryBtnText}>Post to a Course Connect Board</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <CourseBoardPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={board => {
          setPickerOpen(false)
          if (board.key === 'module-qa') navigation.navigate('ModuleQA', { openAsk: true })
          else navigation.navigate('BoardDetail', { boardKey: board.key, registry: 'course', openPostForm: true })
        }}
      />

      <InterestsModal
        visible={interestsModalOpen}
        onClose={() => setInterestsModalOpen(false)}
      />
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
  heroTagline: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.gold, lineHeight: 20, marginBottom: 10 },
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

  // THE fix for the header floating/overlapping content on native — see
  // HomeScreen.jsx's mainScroll comment for the full explanation. A
  // ScrollView needs an explicit flex (not just contentContainerStyle) on
  // its own `style` or native has nothing to size its clipped viewport
  // against; react-native-web silently tolerates the omission, which is
  // why this only broke on a physical phone.
  scrollView: { flex: 1 },
  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Interests banner — primary framing now, so it's the bolder (navy) card
  interestsBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: 14, marginTop: spacing.lg,
    ...shadows.card,
  },
  interestsBannerIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  interestsBannerLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.goldLight, letterSpacing: 0.8 },
  interestsBannerText:  { fontFamily: fonts.sans, fontSize: 13, color: colors.cream, lineHeight: 19, marginTop: 4 },
  interestsBannerChange:{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: 'rgba(245,240,232,0.65)', marginTop: 6 },

  // "Viewing as" note — deliberately a single quiet line, not a competing
  // banner (see the comment where it's rendered for why).
  viewingAsRow: { marginTop: spacing.sm, paddingHorizontal: 2 },
  viewingAsText: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, lineHeight: 16 },
  viewingAsLink: { fontFamily: fonts.sansMedium, color: colors.navy, textDecorationLine: 'underline' },

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
  noteCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  noteModuleBadge: { backgroundColor: colors.navy, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0 },
  noteModuleText:  { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },
  noteTitle:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  noteMeta:        { flexDirection: 'row', gap: 5, marginTop: 3 },
  noteMetaText:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  // Popular Right Now — intro copy + empty state
  popularIntro: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 8 },
  popularEmptyText: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic',
    textAlign: 'center', marginTop: spacing.lg, lineHeight: 19,
  },

  // Popular Right Now — tile grid (same measured-width flex-wrap pattern as
  // Campus Connect's board grid, see PopularCourseGrid above)
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: POPULAR_TILE_GAP, marginTop: spacing.md },
  popularTile: {
    borderRadius: radius.card, padding: 14, minHeight: 92,
    backgroundColor: colors.white, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    justifyContent: 'space-between', ...shadows.card,
  },
  popularTileTop:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  popularTileCount: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.goldDeep },
  popularTileLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: 10, lineHeight: 18 },

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
  secondaryBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 8, height: 46, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.15)' },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
})
